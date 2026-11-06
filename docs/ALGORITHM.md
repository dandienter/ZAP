# ALGORITMA DIAGNOSTIK KOGNITIF & SYMPY REASONING ENGINE (V2.3 VERIFIED)

---

## 1. STRUKTUR PAKET `backend/cfl`

Algoritma inti NalarAI diorganisasikan dalam modul Python terpisah:
* [`backend/cfl/parser.py`](backend/cfl/parser.py): Mengurai string ekspresi maupun persamaan dengan dukungan *implicit multiplication* (`2x` ➔ `2*x`) dan LaTeX.
* [`backend/cfl/cfl_engine.py`](backend/cfl/cfl_engine.py): Memvalidasi kontinuitas kebenaran aljabar menggunakan kombinasi `sp.solveset(domain=sp.S.Reals)` (persamaan) dan `sp.simplify` (ekspresi). Menangani kondisi `ConditionSet` sebagai `UNDECIDABLE_STEP`.
* [`backend/cfl/classifier.py`](backend/cfl/classifier.py): Mengklasifikasikan miskonsepsi: `DISTRIBUTIVE_EXPANSION_ILLUSION`, `SIGN_INVERSION_OR_TRANSPOSITION_ERROR`, dan `ROOT_LOSS` (kehilangan akar).
* [`backend/cfl/counter_example.py`](backend/cfl/counter_example.py): Menyintesis nilai integer kontra-contoh minimal tanpa bergantung pada fallback.
* [`backend/cfl/guardrail.py`](backend/cfl/guardrail.py): Menyaring kebocoran kunci jawaban deklaratif dan pola `final_solution` tanpa merusak konteks instruksional Sokrates.

---

## 2. SPESIFIKASI ALGORITMA INTI

### 2.1 Ekuivalensi Persamaan & Ekspresi (`steps_equivalent`)

```python
import sympy as sp

def steps_equivalent(prev: sp.Expr | sp.Eq, nxt: sp.Expr | sp.Eq, var: sp.Symbol = sp.Symbol('x')) -> bool | None:
    # Kasus 1: Kedua langkah adalah Persamaan (sp.Eq)
    if isinstance(prev, sp.Eq) and isinstance(nxt, sp.Eq):
        s1 = sp.solveset(prev.lhs - prev.rhs, var, domain=sp.S.Reals)
        s2 = sp.solveset(nxt.lhs - nxt.rhs, var, domain=sp.S.Reals)

        # Jika salah satu menghasilkan ConditionSet, jangan paksa vonis
        if isinstance(s1, sp.ConditionSet) or isinstance(s2, sp.ConditionSet):
            return None

        return s1 == s2

    # Kasus 2: Kedua langkah adalah Ekspresi Aljabar Biasa (sp.Expr)
    if not isinstance(prev, sp.Eq) and not isinstance(nxt, sp.Eq):
        return sp.simplify(nxt - prev) == 0

    return False
```

---

### 2.2 Klasifikasi Kehilangan Akar (`ROOT_LOSS`)

```python
if isinstance(prev_obj, sp.Eq) and isinstance(faulty_obj, sp.Eq):
    s_prev = sp.solveset(prev_obj.lhs - prev_obj.rhs, var, domain=sp.S.Reals)
    s_faulty = sp.solveset(faulty_obj.lhs - faulty_obj.rhs, var, domain=sp.S.Reals)

    # Deteksi kehilangan akar (Root Loss): himpunan solusi langkah baru adalah subset murni
    if isinstance(s_prev, sp.FiniteSet) and isinstance(s_faulty, sp.FiniteSet):
        if s_faulty.is_proper_subset(s_prev):
            return "ROOT_LOSS"
        if s_prev.is_proper_subset(s_faulty):
            return "EXTRANEOUS_ROOT_INTRODUCTION"
```

---

## 3. HASIL EKSEKUSI TERMINAL RIIL (VERBATIM CLI OUTPUT)

### 3.1 Verifikasi Langsung Parser & Solveset:
```bash
$ cd backend
$ python -c "from cfl import parse_step_to_symbolic as p, steps_equivalent as s; print(s(p('x^2 = 4'), p('x = 2'))); print(s(p('2x + 3 = 7'), p('2x = 4')))"
False
True
```

### 3.2 Eksekusi Pytest Lengkap (8/8 Lulus):
```bash
$ cd backend
$ python -m pytest -v tests/test_cfl_engine.py
============================= test session starts =============================
platform win32 -- Python 3.15.1, pytest-9.2.0, pluggy-1.7.0 -- C:\Python315\python.exe
rootdir: C:\Users\wakhidpangestu\orca\projects\logicodix\backend
plugins: anyio-4.15.1
collecting ... collected 8 items

tests/test_cfl_engine.py::TestCFLEngine::test_polynomial_expansion_fault_detected PASSED [ 12%]
tests/test_cfl_engine.py::TestCFLEngine::test_equation_valid_transposition PASSED [ 25%]
tests/test_cfl_engine.py::TestCFLEngine::test_equation_invalid_transposition PASSED [ 37%]
tests/test_cfl_engine.py::TestCFLEngine::test_root_loss_detection PASSED [ 50%]
tests/test_cfl_engine.py::TestCFLEngine::test_undecidable_condition_set PASSED [ 62%]
tests/test_cfl_engine.py::TestZeroAnswerGuardrail::test_guardrail_preserves_socratic_context PASSED [ 75%]
tests/test_cfl_engine.py::TestZeroAnswerGuardrail::test_guardrail_censors_explicit_declaration PASSED [ 87%]
tests/test_cfl_engine.py::TestZeroAnswerGuardrail::test_guardrail_masks_kunci_declaration_with_final_solution PASSED [100%]

============================== 8 passed in 1.52s ==============================
```
