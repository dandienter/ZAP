# AGENTS.md — Repository Operational Contract & Experiential Memory
**Project:** ZAP (Zero Answer Policy) — Logicodix 2026 Hackathon  
**Scope:** Universal project-wide rules, architectural boundaries, and crystallized memory-by-experience.

---

## 1. Core Architectural Contract

1. **Separation of Concerns (Deterministic CAS vs. Generative LLM):**
   * **Mathematical Truth Tier (Backend):** SymPy Computer Algebra System (`cfl/`) is the sole arbiter of algebraic correctness, equivalence, root conservation, and counter-example generation. No generative LLM may ever decide whether a student's derivation step is mathematically valid.
   * **Conversational Tier (Frontend / API):** LLM (Gemini 2.0 Flash / Local Socratic Engine) only translates deterministic diagnostic findings into empathetic, Socratic questions.
2. **Zero-Answer Policy (Immutable):**
   * Under no circumstances may any component output the final numerical/algebraic solution to student scratchpad exercises.
   * All prompts and explanations must pass through `RobustZeroAnswerGuardrail.sanitize(..., final_solution=...)`.

---

## 2. Hard Invariants (Crystallized Memory from Past Regressions)

Every agent operating in this codebase MUST follow these verified lessons learned:

### Invariant 1: Exception Handling in Parsers (Anti-Masking Rule)
* **The Trap:** In Python, `issubclass(AssertionError, Exception) == True`. Catching generic `except Exception as err:` in parsing logic will silently swallow `AssertionError` raised by test monkeypatches or internal assertion checks, wrapping them into `ValueError` and creating false test passes (*false positives*).
* **The Rule:** In `cfl/parser.py`, always re-raise `AssertionError` before catching generic `Exception`:
  ```python
  try:
      return parse_expr(cleaned, transformations=TRANSFORMATIONS)
  except AssertionError:
      raise
  except Exception as err:
      raise ValueError(f"Gagal mengurai aljabar '{side_str}': {err}")
  ```

### Invariant 2: Whitelist-First Parsing Order (Anti-RCE & Anti-DoS)
* **The Trap:** `parse_expr` internally invokes Python's `eval()`. Running it before whitelist verification creates arbitrary code execution vulnerabilities. Running SymPy on unbounded exponents creates DoS timeout locks.
* **The Rule:** In `parse_single_side`, strictly enforce the sequence:
  1. Whitelist validation first: `_is_plain_algebra()` or `_is_safe_latex()`.
  2. Safe degree & exponent bounds: `_has_dangerous_exponents()` ($\le 100$, no nested powers like `(9^9)^9`).
  3. Only then invoke `parse_expr()` or `parse_latex()`.

### Invariant 3: Mutation Testing Protocol
* Never conclude a security or anti-bypass test is working merely because pytest prints green.
* Verify sensitivity: temporarily comment out the mitigation logic and confirm that pytest fails with the expected trace (`AssertionError: SymPy dipanggil untuk input berbahaya`). Then restore the mitigation.

### Invariant 4: Dual-Schema Backward Compatibility
* In `main.py` request models, support both modern and legacy parameter keys:
  * `confirmed_steps` (primary) and `lines` (alias)
  * `target_variable` (primary) and `target_var` (alias)
* **Critical Default Rule:** Both alias fields must have `default=None`. Never set default `"x"` on the primary field if an alias exists, otherwise the alias value will be clobbered.
  ```python
  chosen_var = (request.target_variable or request.target_var or "x").strip() or "x"
  ```

### Invariant 5: Honest Claims over Superlatives
* Never write marketing superlatives such as *"100% bulletproof"*, *"unhackable"*, or *"100% aman"* in code comments, commit messages, or documentation.
* State exact measured facts: e.g., *"5 dangerous payloads rejected in pre-parse stage in < 1 ms"*, *"22 verified tests passed in 1.80s"*, *"scope bounded to univariate polynomials and rational expressions"*.

---

## 3. Development & Testing Environment Standards

* **Runtime:** Python 3.15 on Windows 64-bit.
* **Test Suite Execution:** Always run pytest with cache provider disabled:
  ```powershell
  python -m pytest -v -p no:cacheprovider tests/
  ```
* **FastAPI TestClient Execution:** On Windows, Starlette's `TestClient` uses `anyio` which opens local loopback sockets. Under restricted sandboxes this blocks; run test suites with `BypassSandbox: true` if socket binding is required.
* **Frontend Environment Variables:** Never hardcode `http://127.0.0.1:8000`. Always use:
  ```typescript
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";
  ```
