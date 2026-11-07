"""
NalarAI - Robust Mathematical Step Parser
Mendukung input LaTeX maupun notasi aljabar teks dengan implicit multiplication (2x -> 2*x).
Dilengkapi sanitasi whitelist ketat untuk memblokir eksekusi eval() dan perintah LaTeX non-matematika,
serta pembatasan eksponen numerik untuk mencegah serangan Denial of Service (DoS).
"""

import re
import sympy as sp
from sympy.parsing.sympy_parser import (
    parse_expr,
    standard_transformations,
    implicit_multiplication_application,
    convert_xor
)
from sympy.parsing.latex import parse_latex

TRANSFORMATIONS = standard_transformations + (implicit_multiplication_application, convert_xor)

# Whitelist nama variabel, fungsi matematika, dan konstanta yang diizinkan
ALLOWED_FUNCS = {"sin", "cos", "tan", "sqrt", "log", "exp"}
ALLOWED_VARS = {"x", "y", "z", "a", "b", "c", "d", "m", "n", "t"}
ALLOWED_CONSTS = {"pi", "E"}
ALLOWED_LATEX_CMDS = {"frac", "sqrt", "cdot", "times", "sin", "cos", "tan", "log", "exp", "pm"}

ALLOWED_NAMES = ALLOWED_VARS | ALLOWED_FUNCS | ALLOWED_CONSTS


def _is_plain_algebra(text: str) -> bool:
    """
    Validasi keamanan teks aljabar biasa:
    - Menolak karakter berbahaya (_, kutip, backtick, titik-koma, backslash).
    - Memastikan hanya memuat karakter aljabar standar.
    - Memastikan seluruh identifier ada di whitelist variabel, fungsi, atau konstanta.
    """
    if len(text) > 200 or "_" in text or re.search(r"[\"'`;\\]", text):
        return False
    if not re.fullmatch(r"[0-9A-Za-z\s+\-*/^().=,]*", text):
        return False
    identifiers = re.findall(r"[A-Za-z]+", text)
    return all(name in ALLOWED_NAMES for name in identifiers)


def _is_safe_latex(text: str) -> bool:
    """
    Validasi keamanan input LaTeX:
    - Menolak underscore, kutip, titik-koma, dollar, backtick.
    - Wajib memuat simbol backslash '\\'.
    - Seluruh perintah LaTeX (\\cmd) harus terdaftar di ALLOWED_LATEX_CMDS.
    - Karakter harus berada dalam subset aljabar dan grouping LaTeX valid.
    - Seluruh identifier sisa (di luar perintah LaTeX) harus terdaftar di ALLOWED_NAMES.
    """
    if len(text) > 200 or "_" in text or re.search(r"[\"'`;$]", text):
        return False
    if "\\" not in text:
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


def _has_dangerous_exponents(text: str) -> bool:
    """
    Mencegah serangan Denial of Service (DoS) dari komputasi eksponen raksasa / pangkat bertingkat:
    1. Menolak eksponen numerik > 100 pada format bare, kurung, maupun kurung kurawal.
    2. Menolak indeks akar LaTeX di atas 100: \\sqrt[n]{...}.
    3. Menolak rantai pangkat bertingkat langsung maupun bersarang tanda kurung.
    """
    s = re.sub(r"\s+", "", text)

    # 1. Cek eksponen numerik besar setelah ^ atau **:
    # Mendukung format: ^123, ^{123}, ^(123), ^((123)), **123, **(123)
    for m in re.finditer(r"(?:\^|\*\*)[({]*(\d+)[)}]*", s):
        try:
            val = int(m.group(1))
            if val > 100:
                return True
        except ValueError:
            return True

    # 2. Cek indeks akar pada LaTeX: \sqrt[n]{...}
    for m in re.finditer(r"\\sqrt\[(\d+)\]", s):
        try:
            val = int(m.group(1))
            if val > 100:
                return True
        except ValueError:
            return True

    # 3. Cek pangkat bertingkat langsung: a^b^c
    if re.search(r"(\^|\*\*)[^+\-=/(),]+\^", s):
        return True

    # 4. Cek pangkat bertingkat format LaTeX: ^{...^...} atau ^{...}^{...}
    if re.search(r"\^\{[^}]*\^", s) or re.search(r"\^\{[^}]*\}\s*\^", s):
        return True

    # 5. Cek pangkat bertingkat format kurung bersarang: ^\(.*?\^.*?\)|^\(.*?\)|\(.*?^.*?\)\s*\^
    if re.search(r"(?:\^|\*\*)\([^)]*?(\^|\*\*)", s) or re.search(r"\([^)]*?(\^|\*\*)[^)]*?\)\s*(?:\^|\*\*)", s):
        return True

    return False


def parse_single_side(side_str: str) -> sp.Expr:
    """
    Mengurai satu sisi ekspresi matematika:
    1. Validasi Whitelist terlebih dahulu (plain algebra atau safe LaTeX).
    2. Jika lolos whitelist, periksa batas aman eksponen/struktur pangkat (Anti-DoS).
    3. Eksekusi penguraian simbolik.
    Catatan Arsitektur: parse_expr memanggil eval() internal SymPy, namun hanya
    dieksekusi pada input yang telah lolos validasi whitelist dan batas eksponen.
    """
    cleaned = side_str.strip()
    if not cleaned:
        raise ValueError("Ekspresi matematika tidak boleh kosong.")

    # 1. Jalur aljabar teks biasa: Whitelist diperiksa terlebih dahulu
    if _is_plain_algebra(cleaned):
        if _has_dangerous_exponents(cleaned):
            raise ValueError(
                f"Eksponen aljabar melebihi batas aman (maksimal 100) atau menggunakan pangkat bertingkat: '{side_str}'"
            )
        try:
            return parse_expr(cleaned, transformations=TRANSFORMATIONS)
        except Exception as err:
            raise ValueError(f"Gagal mengurai aljabar '{side_str}': {err}")

    # 2. Jalur LaTeX matematika terstruktur: Whitelist LaTeX diperiksa terlebih dahulu
    if "\\" in cleaned and _is_safe_latex(cleaned):
        if _has_dangerous_exponents(cleaned):
            raise ValueError(
                f"Eksponen atau indeks akar melebihi batas aman (maksimal 100) atau menggunakan pangkat bertingkat: '{side_str}'"
            )
        try:
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
