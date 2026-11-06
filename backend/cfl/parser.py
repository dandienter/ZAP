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


def parse_single_side(side_str: str) -> sp.Expr:
    """
    Mengurai satu sisi ekspresi matematika:
    1. Jika aljabar teks aman (whitelist), gunakan parse_expr (implicit multiplication).
    2. Jika notasi LaTeX aman (whitelist), gunakan parse_latex (bebas eval).
    3. Jika tidak lolos salah satu whitelist, lemparkan ValueError secara deterministik.
    """
    cleaned = side_str.strip()
    if not cleaned:
        raise ValueError("Ekspresi matematika tidak boleh kosong.")

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
