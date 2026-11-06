# ALGORITMA DIAGNOSTIK KOGNITIF & SYMPY REASONING ENGINE (V2.4 VERIFIED)

---

## 1. STRUKTUR PAKET `backend/cfl` & API GATEWAY

Algoritma inti NalarAI diorganisasikan dalam modul Python terpisah:
* [`backend/cfl/parser.py`](backend/cfl/parser.py): Mengurai string ekspresi maupun persamaan dengan dukungan *implicit multiplication* (`2x` ➔ `2*x`) dan LaTeX, dilengkapi sanitasi whitelist anti-RCE untuk memblokir eksploitasi `eval()` pada `parse_expr`.
* [`backend/cfl/cfl_engine.py`](backend/cfl/cfl_engine.py): Memvalidasi kontinuitas kebenaran aljabar menggunakan kombinasi `sp.solveset(domain=sp.S.Reals)` (persamaan) dan `sp.simplify` (ekspresi). Menangani kondisi `ConditionSet` sebagai `UNDECIDABLE_STEP`.
* [`backend/cfl/classifier.py`](backend/cfl/classifier.py): Mengklasifikasikan miskonsepsi: `DISTRIBUTIVE_EXPANSION_ILLUSION`, `SIGN_INVERSION_OR_TRANSPOSITION_ERROR`, dan `ROOT_LOSS` (kehilangan akar).
* [`backend/cfl/counter_example.py`](backend/cfl/counter_example.py): Menyintesis nilai integer kontra-contoh minimal tanpa bergantung pada fallback.
* [`backend/cfl/guardrail.py`](backend/cfl/guardrail.py): Menyaring kebocoran kunci jawaban deklaratif dan pola `final_solution` tanpa merusak konteks instruksional Sokrates.
* [`backend/main.py`](backend/main.py): Endpoint FastAPI (`POST /api/v1/diagnose`) yang mengorkestrasi CFL engine, menyusun kontra-contoh terstruktur, dan menerapkan guardrail.

---

## 2. SPESIFIKASI ALGORITMA INTI

### 2.1 Sanitasi Anti-RCE & Parser Aljabar Aman (`_is_plain_algebra`)

SymPy `parse_expr` menggunakan fungsi bawaan Python `eval()`. Untuk mencegah serangan Remote Code Execution (RCE) via HTTP endpoint, input disaring ketat melalui whitelist karakter dan identifier:

```python
ALLOWED_NAMES = {
    "x", "y", "z", "a", "b", "c", "d", "m", "n", "t",
    "sin", "cos", "tan", "sqrt", "log", "exp", "pi", "E"
}
ALLOWED_CHARS = re.compile(r"^[0-9A-Za-z\s+\-*/^().=,]*$")

def _is_plain_algebra(text: str) -> bool:
    if len(text) > 200 or not ALLOWED_CHARS.match(text):
        return False
    identifiers = re.findall(r"[A-Za-z]+", text)
    return all(name in ALLOWED_NAMES for name in identifiers)
```

Input berbahaya seperti `__import__('os').system(...)` langsung gagal pada verifikasi whitelist dan dialihkan ke `parse_latex` (yang berbasis antlr gramatikal tanpa `eval`), kemudian memicu penolakan aman (`HTTP 422`).

---

### 2.2 Ekuivalensi Persamaan & Ekspresi (`steps_equivalent`)

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

### 2.3 Klasifikasi Kehilangan Akar (`ROOT_LOSS`)

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

### 3.2 Eksekusi Pytest Lengkap (15/15 Lulus):
```bash
$ cd backend
$ python -m pytest -v -p no:cacheprovider tests/
============================= test session starts =============================
platform win32 -- Python 3.15.1, pytest-9.2.0, pluggy-1.7.0 -- C:\Python315\python.exe
rootdir: C:\Users\wakhidpangestu\orca\projects\logicodix
plugins: anyio-4.15.1
collecting ... collected 15 items

backend/tests/test_api.py::TestNalarAIAPI::test_health_check PASSED      [  6%]
backend/tests/test_api.py::TestNalarAIAPI::test_diagnose_polynomial_expansion_fault PASSED [ 13%]
backend/tests/test_api.py::TestNalarAIAPI::test_diagnose_valid_transposition PASSED [ 20%]
backend/tests/test_api.py::TestNalarAIAPI::test_diagnose_rejects_empty_steps PASSED [ 26%]
backend/tests/test_api.py::TestNalarAIAPI::test_diagnose_rejects_code_injection_payload PASSED [ 33%]
backend/tests/test_api.py::TestNalarAIAPI::test_diagnose_undecidable_condition_set PASSED [ 40%]
backend/tests/test_cfl_engine.py::TestCFLEngine::test_polynomial_expansion_fault_detected PASSED [ 46%]
backend/tests/test_cfl_engine.py::TestCFLEngine::test_equation_valid_transposition PASSED [ 53%]
backend/tests/test_cfl_engine.py::TestCFLEngine::test_equation_invalid_transposition PASSED [ 60%]
backend/tests/test_cfl_engine.py::TestCFLEngine::test_root_loss_detection PASSED [ 66%]
backend/tests/test_cfl_engine.py::TestCFLEngine::test_undecidable_condition_set PASSED [ 73%]
backend/tests/test_cfl_engine.py::TestCFLEngine::test_parser_rejects_code_injection PASSED [ 80%]
backend/tests/test_cfl_engine.py::TestZeroAnswerGuardrail::test_guardrail_preserves_socratic_context PASSED [ 86%]
backend/tests/test_cfl_engine.py::TestZeroAnswerGuardrail::test_guardrail_censors_explicit_declaration PASSED [ 93%]
backend/tests/test_cfl_engine.py::TestZeroAnswerGuardrail::test_guardrail_masks_kunci_declaration_with_final_solution PASSED [100%]

======================== 15 passed, 1 warning in 2.59s ========================
```
