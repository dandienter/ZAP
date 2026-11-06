"""
NalarAI - Misconception Classifier
Mendiagnosis tipe cacat model mental pada domain Aljabar, termasuk deteksi kehilangan akar (ROOT_LOSS).
"""

import sympy as sp

def classify_misconception_robust(prev_obj: sp.Expr | sp.Eq, faulty_obj: sp.Expr | sp.Eq, var: sp.Symbol = sp.Symbol('x')) -> str:
    """
    Mengidentifikasi pola cacat kognitif aljabar.
    """
    # Kasus 1: Ekspresi Aljabar (misal ekspansi kuadrat)
    if not isinstance(prev_obj, sp.Eq) and not isinstance(faulty_obj, sp.Eq):
        has_pow = any(isinstance(node, sp.Pow) for node in sp.preorder_traversal(prev_obj))
        if has_pow:
            expanded_true = sp.expand(prev_obj)
            if sp.simplify(expanded_true - faulty_obj) != 0:
                return "DISTRIBUTIVE_EXPANSION_ILLUSION"

    # Kasus 2: Persamaan Aljabar
    if isinstance(prev_obj, sp.Eq) and isinstance(faulty_obj, sp.Eq):
        s_prev = sp.solveset(prev_obj.lhs - prev_obj.rhs, var, domain=sp.S.Reals)
        s_faulty = sp.solveset(faulty_obj.lhs - faulty_obj.rhs, var, domain=sp.S.Reals)

        # Deteksi kehilangan akar (Root Loss): himpunan solusi langkah baru adalah subset murni langkah sebelumnya
        # Contoh: x^2 = 4 (solusi {-2, 2}) -> x = 2 (solusi {2})
        if isinstance(s_prev, sp.FiniteSet) and isinstance(s_faulty, sp.FiniteSet):
            if s_faulty.is_proper_subset(s_prev):
                return "ROOT_LOSS"
            if s_prev.is_proper_subset(s_faulty):
                return "EXTRANEOUS_ROOT_INTRODUCTION"

        # Deteksi salah tanda / pindah ruas
        delta_lhs = sp.simplify(faulty_obj.lhs - prev_obj.lhs)
        delta_rhs = sp.simplify(faulty_obj.rhs - prev_obj.rhs)
        if delta_lhs != 0 and delta_rhs != 0:
            return "SIGN_INVERSION_OR_TRANSPOSITION_ERROR"

    return "GENERAL_ALGEBRAIC_DERIVATION_ERROR"
