# ZAP Socratic Ontology & Zero-Answer Guardrail Rules

This reference guide governs how ZAP diagnoses student misconceptions, constructs cognitive disequilibrium counter-examples, and enforces the immutable **Zero Answer Policy**.

---

## 1. The Pedagogical Philosophy: Cognitive Disequilibrium

ZAP is built on three cognitive learning principles:
1. **Jean Piaget's Cognitive Disequilibrium:** Students learn most deeply when a concrete counter-example contradicts their mental shortcut (e.g., substituting $x = 2$ into $(x+3)^2$ gives $25$, whereas their expansion $x^2 + 9$ gives $13$).
2. **Lev Vygotsky's Scaffolding:** Provide the smallest possible Socratic question that enables the student to cross the reasoning gap on their own.
3. **Zero-Answer Policy (Immutable):** Never output the final numerical or algebraic answer to the student's active problem.

---

## 2. Misconception Taxonomy (`backend/cfl/classifier.py`)

When expanding `classify_misconception_robust(prev_obj, faulty_obj, var)`, classify student errors into deterministic symbolic categories:

| Misconception Code | Mathematical Cause | Socratic Scaffolding Strategy |
| :--- | :--- | :--- |
| `DISTRIBUTIVE_EXPANSION_ILLUSION` | Student expanded $(a+b)^n$ as $a^n + b^n$, omitting cross-multiplication terms. | Ask the student to write $(a+b)(a+b)$ explicitly and multiply each pair of terms, or test with $x = 2$. |
| `SIGN_INVERSION_OR_TRANSPOSITION_ERROR` | Student moved a term across `=` without inverting its sign (e.g., $2x + 3 = 7 \rightarrow 2x = 10$). | Ask what operation must be applied to **both sides** of the equation to eliminate $+3$ on the left. |
| `ROOT_LOSS` | Solution set of step $i+1$ is a proper subset of step $i$ (e.g., $x^2 = 4 \rightarrow x = 2$, losing $x = -2$). | Ask whether there is a negative number that, when squared, also equals $4$. |
| `EXTRANEOUS_ROOT_INTRODUCTION` | Solution set of step $i+1$ is a proper superset of step $i$ (e.g., squaring both sides without domain check). | Ask the student to substitute each candidate root back into the original first line. |
| `GENERAL_ALGEBRAIC_DERIVATION_ERROR` | Step $i$ and step $i+1$ are not equivalent ($s_1 \neq s_2$ or $\text{simplify}(E_2 - E_1) \neq 0$). | Present the minimal integer counter-example synthesized by `synthesize_counter_example`. |

---

## 3. Zero-Answer Guardrail Invariants (`backend/cfl/guardrail.py`)

Every Socratic prompt—whether pre-authored in `generators.py` or generated dynamically by an LLM—must pass `RobustZeroAnswerGuardrail.sanitize(text, final_solution=...)`.

### What Must Be Censored (Blocked):
* Explicit final declarations:
  * `"jawaban akhirnya adalah x = 2"`
  * `"solusinya adalah 5"`
  * `"maka x = -3"` / `"jadi nilai x = 10"`
  * `"kunci jawaban: 12"`
* Evaluated geometric targets:
  * `"diagonal ruang = 17.32 cm"`
  * `"d_bidang = 14.14 cm"`

### What Must Be Preserved (Allowed Socratic Context):
* Line references: `"Perhatikan baris ke-2..."`, `"Di langkah ke-5..."`
* Counter-example substitutions: `"Jika kita uji substitusi x = 2 pada baris pertama..."`
* Intermediate substitution checks: `"Hasil dari substitusi awal adalah 25, apakah sama dengan 2^2 + 9?"`
