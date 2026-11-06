"""
NalarAI - Socratic Minimal Counter-Example Generator
Mencari nilai substitusi integer terkecil untuk memunculkan disonansi kognitif.
"""

import sympy as sp

def synthesize_counter_example(prev_obj: sp.Expr | sp.Eq, faulty_obj: sp.Expr | sp.Eq, var: sp.Symbol = sp.Symbol('x')) -> dict:
    """
    Mencari nilai substitusi integer kecil (x*) yang mendemonstrasikan kontradiksi numerik.
    """
    candidates = [2, 3, 1, 4]

    # Ekstrak ekspresi yang dibandingkan
    if isinstance(prev_obj, sp.Eq) and isinstance(faulty_obj, sp.Eq):
        exp_p = prev_obj.lhs - prev_obj.rhs
        exp_f = faulty_obj.lhs - faulty_obj.rhs
    elif not isinstance(prev_obj, sp.Eq) and not isinstance(faulty_obj, sp.Eq):
        exp_p = prev_obj
        exp_f = faulty_obj
    else:
        exp_p = prev_obj.rhs if isinstance(prev_obj, sp.Eq) else prev_obj
        exp_f = faulty_obj.rhs if isinstance(faulty_obj, sp.Eq) else faulty_obj

    for val in candidates:
        try:
            val_p = exp_p.subs(var, val)
            val_f = exp_f.subs(var, val)
            
            # Cek perbedaan nilai secara simbolik / aljabar
            diff = sp.simplify(val_p - val_f)
            if diff != 0:
                return {
                    "test_variable": str(var),
                    "test_value": val,
                    "lhs_expected": str(val_p),
                    "rhs_calculated": str(val_f),
                    "contradiction_statement": f"Ketika {var} = {val}, rumus awal bernilai {val_p}, tetapi langkahmu menghasilkan {val_f}."
                }
        except Exception:
            continue

    return {
        "test_variable": str(var),
        "test_value": 2,
        "note": "Periksa kembali aturan ekspansi aljabar secara teliti."
    }
