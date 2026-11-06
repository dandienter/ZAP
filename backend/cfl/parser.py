"""
NalarAI - Robust Mathematical Step Parser
Mendukung input LaTeX maupun notasi aljabar teks dengan implicit multiplication (2x -> 2*x).
Dilengkapi sanitasi whitelist ketat untuk memblokir eksekusi eval() dan perintah LaTeX non-matematika.
"""

import re
import sympy as sp
from sympy.parsing.sympy_parser import (
    parse_expr,
    standard_transformations,
    implicit_multiplication_application,
    convert_xor
)

TRANSFORMATIONS = standard_transformations + (implicit_multiplication_application, convert_xor)

# Whitelist nama variabel, fungsi matematika, dan konstanta yang diizinkan
ALLOWED_FUNCS = {"sin", "cos", "tan", "sqrt", "log", "exp"}
ALLOWED_VARS = {"x", "y", "z", "a", "b", "c", "d", "m", "n", "t"}
ALLOWED_CONSTS = {"pi", "E"}
ALLOWED_LATEX_CMDS = {"frac", "sqrt", "cdot", "times", "sin", "cos", "tan", "log", "exp", "pm"}

ALLOWED_NAMES = ALLOWED_VARS | ALLOWED_FUNCS | ALLOWED_CONSTS


def _has_dangerous_exponents(text: str) -> bool:
    """
    Mencegah serangan Denial of Service (DoS) dari komputasi eksponen raksasa / pangkat bertingkat:
    1. Menolak rantai pangkat bertingkat (misal: 9^9^9, x^y^z, a**b**c).
    2. Menolak nested superscript pada LaTeX (misal: x^{2^{3}}).
    3. Menolak eksponen numerik yang melebihi batas aman (nilai pangkat > 100).
    """
    condensed = re.sub(r"\s+", "", text)

    # 1. Deteksi rantai operator pangkat langsung tanpa pemisah operator biner (+, -, =)
    if re.search(r"(\^|\*\*)[^+\-=/(),]+\^", condensed):
        return True

    # 2. Deteksi nested superscript LaTeX: ^{...^...}
    if re.search(r"\^\{[^}]*?\^", condensed):
        return True

    # 3. Deteksi eksponen numerik > 100
    for m in re.findall(r"(?:\^|\*\*)\{?(\d+)\}?", condensed):
        try:
            if int(m) > 100:
                return True
        except ValueError:
            return True

    return False


def _is_plain_algebra(text: str) -> bool:
    """
    Validasi keamanan teks aljabar biasa:
    - Menolak karakter berbahaya (_, kutip, backtick, titik-koma, backslash).
    - Menolak eksponen berbahaya (> 100 atau pangkat bertingkat).
    - Memastikan hanya memuat karakter aljabar standar.
    - Memastikan seluruh identifier ada di whitelist variabel, fungsi, atau konstanta.
    """
    if len(text) > 200 or "_" in text or re.search(r"[\"'`;\\]", text):
        return False
    if _has_dangerous_exponents(text):
        return False
    if not re.fullmatch(r"[0-9A-Za-z\s+\-*/^().=,]*", text):
        return False
    identifiers = re.findall(r"[A-Za-z]+", text)
    return all(name in ALLOWED_NAMES for name in identifiers)


def _is_safe_latex(text: str) -> bool:
    """
    Validasi keamanan input LaTeX:
    - Menolak underscore, kutip, titik-koma, dollar, backtick.
    - Menolak eksponen berbahaya (> 100 atau pangkat bertingkat).
    - Wajib memuat simbol backslash '\\'.
    - Seluruh perintah LaTeX (\\cmd) harus terdaftar di ALLOWED_LATEX_CMDS.
    - Karakter harus berada dalam subset aljabar dan grouping LaTeX valid.
    - Seluruh identifier sisa (di luar perintah LaTeX) harus terdaftar di ALLOWED_NAMES.
    """
    if len(text) > 200 or "_" in text or re.search(r"[\"'`;$]", text):
        return False
    if "\\" not in text:
        return False
    if _has_dangerous_exponents(text):
        return False
    commands = re.findall(r"\\([A-Za-z0-9]+)", text)
    if not commands or not all(cmd in ALLOWED_LATEX_CMDS for cmd in commands):
        return False
    if not re.fullmatch(r"[0-9A-Za-z\s+\-*/^().=,{}\\[\]]*", text):
        return False
    # Bersihkan perintah LaTeX yang diizinkan untuk memeriksa identifier tersisa
    stripped = text
    for cmd in ALLOWED_LATEX_CMDS:
        stripped = stripped.replace(f"\\{cmd}", "")
    identifiers = re.findall(r"[A-Za-z]+", stripped)
    return all(name in ALLOWED_NAMES for name in identifiers)


def parse_single_side(side_str: str) -> sp.Expr:
    """
    Mengurai satu sisi ekspresi matematika:
    1. Menolak eksponen berbahaya (DoS prevention).
    2. Jika aljabar teks aman (whitelist), gunakan parse_expr (implicit multiplication).
    3. Jika notasi LaTeX aman (whitelist), gunakan parse_latex (bebas eval).
    4. Jika tidak lolos salah satu whitelist, lemparkan ValueError secara deterministik.
    Catatan Arsitektur: parse_expr tetap memanggil eval() internal SymPy, namun hanya
    dieksekusi pada input yang lolos validasi whitelist ketat.
    """
    cleaned = side_str.strip()
    if not cleaned:
        raise ValueError("Ekspresi matematika tidak boleh kosong.")

    # Deteksi awal eksponen raksasa / pangkat bertingkat (Anti-DoS)
    if _has_dangerous_exponents(cleaned):
        raise ValueError(
            f"Eksponen aljabar melebihi batas aman (maksimal 100) atau menggunakan pangkat bertingkat: '{side_str}'"
        )

    # 1. Jalur aljabar teks biasa aman
    if _is_plain_algebra(cleaned):
        try:
            return parse_expr(cleaned, transformations=TRANSFORMATIONS)
        except Exception as err:
            raise ValueError(f"Gagal mengurai aljabar '{side_str}': {err}")

    # 2. Jalur LaTeX matematika terstruktur aman
    if "\\" in cleaned and _is_safe_latex(cleaned):
        try:
            from sympy.parsing.latex import parse_latex
            return parse_latex(cleaned)
        except Exception as err:
            raise ValueError(f"Gagal mengurai ekspresi LaTeX '{side_str}': {err}")

    # 3. Ditolak jika berada di luar whitelist
    raise ValueError(f"Ekspresi tidak valid atau di luar whitelist aljabar: '{side_str}'")


def parse_step_to_symbolic(line_str: str) -> sp.Eq | sp.Expr:
    """
    Mengurai satu baris tulisan matematika siswa menjadi objek SymPy:
    - Jika terdapat tanda '=', menghasilkan objek sp.Eq(LHS, RHS)
    - Jika tidak terdapat '=', menghasilkan objek sp.Expr
    """
    cleaned = line_str.strip()
    if not cleaned:
        raise ValueError("Baris langkah tidak boleh kosong.")

    if "=" in cleaned:
        parts = cleaned.split("=")
        if len(parts) != 2:
            raise ValueError(f"Notasi persamaan tidak valid (lebih dari satu '='): {line_str}")
        lhs = parse_single_side(parts[0])
        rhs = parse_single_side(parts[1])
        return sp.Eq(lhs, rhs)
    else:
        return parse_single_side(cleaned)
