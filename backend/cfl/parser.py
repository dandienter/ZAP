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

# Perintah LaTeX non-matematika berbahaya (file ingestion, shell execution, macro expansion)
DISALLOWED_LATEX_COMMANDS = re.compile(
    r"\\(?:input|include|write(?:\d+)?|openin|openout|read|catcode|def|let|newcommand|renewcommand|csname|special|directlua|url|href|system)(?![a-zA-Z])",
    re.IGNORECASE
)


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
    Mengurai satu sisi ekspresi matematika:
    1. Memblokir perintah LaTeX non-matematika berbahaya.
    2. Jika notasi aljabar teks aman (whitelist), gunakan parse_expr (implicit multiplication).
    3. Jika memuat perintah LaTeX ('\\'), gunakan parse_latex (bebas eval).
    4. Jika bukan keduanya, tolak sebagai ekspresi tidak valid.
    """
    cleaned = side_str.strip()
    if not cleaned:
        raise ValueError("Ekspresi matematika tidak boleh kosong.")
        
    # 1. Blokir perintah LaTeX non-matematika berbahaya
    if DISALLOWED_LATEX_COMMANDS.search(cleaned):
        raise ValueError(f"Perintah LaTeX non-matematika tidak diizinkan: '{side_str}'")
    
    # 2. Notasi aljabar teks aman (misal: 2x + 3, (x+3)^2, sin(x))
    if _is_plain_algebra(cleaned):
        try:
            return parse_expr(cleaned, transformations=TRANSFORMATIONS)
        except Exception:
            pass
            
    # 3. Notasi LaTeX matematika terstruktur (wajib memuat simbol '\')
    if "\\" in cleaned:
        try:
            from sympy.parsing.latex import parse_latex
            return parse_latex(cleaned)
        except Exception as err:
            raise ValueError(f"Gagal mengurai ekspresi LaTeX '{side_str}': {err}")

    # 4. Bukan aljabar aman dan bukan LaTeX resmi
    raise ValueError(f"Ekspresi tidak valid atau memuat identifier/simbol di luar ketentuan: '{side_str}'")


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
