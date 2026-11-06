"""
NalarAI - Robust Mathematical Step Parser
Mendukung input LaTeX maupun notasi aljabar teks dengan implicit multiplication (2x -> 2*x).
Dilengkapi sanitasi whitelist anti-RCE untuk mencegah code injection pada parse_expr.
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

# Whitelist nama variabel dan fungsi matematika yang diizinkan untuk parse_expr
ALLOWED_NAMES = {
    "x", "y", "z", "a", "b", "c", "d", "m", "n", "t",
    "sin", "cos", "tan", "sqrt", "log", "exp", "pi", "E"
}

# Whitelist karakter aljabar standar
ALLOWED_CHARS = re.compile(r"^[0-9A-Za-z\s+\-*/^().=,]*$")


def _is_plain_algebra(text: str) -> bool:
    """
    Validasi keamanan: Memastikan teks hanya berupa notasi aljabar aman
    dan hanya memuat nama identifier yang ada di whitelist sebelum diserahkan ke parse_expr.
    Mencegah Remote Code Execution (RCE) via Python eval() di SymPy.
    """
    if len(text) > 200 or not ALLOWED_CHARS.match(text):
        return False
    identifiers = re.findall(r"[A-Za-z]+", text)
    return all(name in ALLOWED_NAMES for name in identifiers)


def parse_single_side(side_str: str) -> sp.Expr:
    """
    Mengurai satu sisi ekspresi matematika.
    Jika lolos sanitasi aljabar aman, gunakan parse_expr (mendukung implicit multiplication).
    Jika tidak lolos (misal notasi LaTeX murni), dialihkan ke parse_latex (bebas eval).
    Jika keduanya gagal, lemparkan ValueError.
    """
    cleaned = side_str.strip()
    
    if _is_plain_algebra(cleaned):
        try:
            return parse_expr(cleaned, transformations=TRANSFORMATIONS)
        except Exception:
            pass
            
    try:
        from sympy.parsing.latex import parse_latex
        return parse_latex(cleaned)
    except Exception as err:
        raise ValueError(f"Gagal mengurai ekspresi '{side_str}': {err}")


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
