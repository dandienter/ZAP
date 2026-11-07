---
name: cfl-verification
description: >-
  Use this skill whenever you need to verify, audit, or test the ZAP CFL Engine,
  FastAPI diagnostic endpoints, or run mutation testing on parser security invariants.
---

# CFL Engine & Security Verification Runbook

This skill outlines the strict, deterministic verification procedure for ZAP's Cognitive Fault Localization (CFL) Engine and API Gateway.

## Step 1: Run Full Pytest Suite

Execute the 22-test suite from the `backend/` directory:

```powershell
cd backend
python -m pytest -v -p no:cacheprovider tests/
```

Expected output:
* 10 tests passed in `tests/test_api.py`
* 12 tests passed in `tests/test_cfl_engine.py`
* Total: `22 passed in < 2.5s`

## Step 2: Mutation Testing Verification (Anti-Regression)

To verify that `test_dangerous_inputs_never_reach_sympy` is sensitive and has not regressed:

1. In `backend/cfl/parser.py`, temporarily comment out the two calls to:
   ```python
   # if _has_dangerous_exponents(cleaned):
   ```
2. Run pytest targeting only this test:
   ```powershell
   python -m pytest tests/test_cfl_engine.py -k test_dangerous_inputs_never_reach_sympy -q -p no:cacheprovider
   ```
3. Assert that it **FAILS** with:
   `AssertionError: SymPy dipanggil untuk input berbahaya`
4. Immediately restore the code:
   ```powershell
   git checkout backend/cfl/parser.py
   ```
5. Re-run to confirm it passes again.

## Step 3: API Gateway & Frontend Connectivity

Check backend health check response:
```powershell
python -c "import urllib.request, json; print(json.loads(urllib.request.urlopen('http://127.0.0.1:8000/health').read()))"
```
Ensure status is `online` and engine reports `SymPy CFL Symbolic Reasoning`.
