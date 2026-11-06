"""
NalarAI - Robust Mathematical Step Parser
Mendukung input LaTeX maupun notasi aljabar teks dengan implicit multiplication (2x -> 2*x).
"""

import sympy as sp
from sympy.parsing.sympy_parser import (
    parse_expr,
    standard_transformations,
    implicit_multiplication_application,
    convert_xor
)

TRANSFORMATIONS = standard_transformations + (implicit_multiplication_application, convert_xor)

def parse_single_side(side_str: str) -> sp.Expr:
    """
    Mengurai satu sisi ekspresi matematika.
    Mencoba via parse_expr dengan implicit multiplication, lalu fallback ke parse_latex.
    """
    cleaned = side_str.strip()
    
    # Normalisasi tanda pangkat jika teks biasa menggunakan ^
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
