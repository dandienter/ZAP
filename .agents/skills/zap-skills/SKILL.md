---
name: zap-skills
description: >-
  Master Unified AI Agent Skill & Harness for ZAP (Zero Answer Policy). Combines all ZAP capabilities into
  one skill: (1) Continuous Learning from Conversation Memory (Episodic Agent Harness), (2) Multi-Source
  Verified Internet Crawling & Data Fetching (GSM8K, HuggingFace Datasets API, Wikimedia REST v1 Theorems,
  Kurikulum Merdeka), (3) Procedural SymPy Math Corpus Synthesis (TK to S3), (4) 2D/3D Spatial Geometry
  Knowledge Base Synchronization, and (5) CFL Engine & Mutation Security Verification.
---

# ZAP Skills — Unified AI Agent Harness, Web Crawler, Data Trainer & Verification System

This is the **single, unified master skill (`zap-skills`)** for training, harnessing, crawling, and verifying the **ZAP (Zero Answer Policy)** AI agent model.

All project skills—including **Continuous Conversation Memory Learning**, **Verified Internet Data Crawling**, **TK–S3 SymPy Corpus Training**, **2D/3D Spatial Geometry Synchronization**, and **CFL Security & Mutation Verification**—are consolidated into this single skill.

---

## 🏛️ 1. The 5-Pillar Unified Architecture of `zap-skills`

| Pillar | Core Modules | Persistent Storage | Role in the ZAP Agent Harness |
| :--- | :--- | :--- | :--- |
| **1. Curriculum Ontology (`TK`–`S3`)** | [`backend/data_engine/taxonomy.py`](../../../backend/data_engine/taxonomy.py) | In-Memory Pydantic Graph | Defines 7 educational tiers (`TK`, `SD`, `SMP`, `SMA`, `S1`, `S2`, `S3`), 21 topics, 25 subtopics, formulas, and WebGL canvas targets. |
| **2. SymPy Procedural & Web Crawler Corpus** | [`backend/data_engine/generators.py`](../../../backend/data_engine/generators.py)<br>[`backend/data_engine/harvester.py`](../../../backend/data_engine/harvester.py) | [`data/zap_math_corpus.jsonl`](../../../data/zap_math_corpus.jsonl)<br>`data/zap_math_corpus.db` | Synthesizes SymPy-verified derivations AND crawls verified internet math sources (`gsm8k_sample`, `hf_gsm8k_api`, `wikimedia_math_theorems`, `indo_kurikulum_sd`). |
| **3. 2D/3D Spatial Geometry DB** | [`backend/cfl/geometry_db.py`](../../../backend/cfl/geometry_db.py)<br>[`frontend/data/geometry-database.ts`](../../../frontend/data/geometry-database.ts) | [`data/zap_geometry_database.json`](../../../data/zap_geometry_database.json) | Synchronizes 20 parametric 2D shapes, 3D solids, and 2D foldable nets between SymPy backend and Three.js WebGL smartboard. |
| **4. CFL & Self-Learning Flywheel** | [`backend/cfl/`](../../../backend/cfl/)<br>[`backend/zapcore/learning.py`](../../../backend/zapcore/learning.py) | `zap_platform.db` (`knowledge_items`) | Deterministic SymPy fault localization, cognitive disequilibrium counter-examples, and Zero-Answer Guardrail (`RobustZeroAnswerGuardrail`). |
| **5. ZAP Model Agent Harness (Episodic Memory)** | [`backend/data_engine/agent_harness.py`](../../../backend/data_engine/agent_harness.py)<br>[`frontend/app/api/chat/route.ts`](../../../frontend/app/api/chat/route.ts) | [`data/zap_agent_memory.jsonl`](../../../data/zap_agent_memory.jsonl)<br>`agent_episodic_memory` (SQLite) | Continuously learns from user conversations: strips PII, extracts algebraic steps, verifies via SymPy CAS, indexes misconception patterns (`hit_count`), and injects `<ZAP_AGENT_HARNESS_CONTEXT>` into chat turns. |

---

## ⚡ 2. Unified CLI Commands (`train_zap_sources.py`)

All training, internet crawling, memory seeding, auditing, and test verification are executed through a single script: [`.agents/skills/zap-skills/scripts/train_zap_sources.py`](scripts/train_zap_sources.py).

### A. Full Unified Training Pipeline (Train + Crawl Internet + Seed Agent Memory + Audit + Verify)
```powershell
python .agents/skills/zap-skills/scripts/train_zap_sources.py --train --tier ALL --count 25 --harvest --seed-memory --audit --verify
```

### B. Crawl & Fetch Verified Internet Math Sources
Crawls OpenAI GSM8K (GitHub raw), HuggingFace Datasets Server API (`datasets-server.huggingface.co`), Wikimedia REST v1 Mathematical Theorems (`en.wikipedia.org/api/rest_v1`), and Indonesian Kurikulum Merdeka feeds, verifying theorems with SymPy and sanitizing prompts via `RobustZeroAnswerGuardrail`:
```powershell
python .agents/skills/zap-skills/scripts/train_zap_sources.py --harvest --max-items 25
```

### C. Train & Seed Continuous Conversation Memory (`ZAPAgentHarness`)
Seed foundational episodic conversation memories or train directly from a live user message turn:
```powershell
# Seed foundational multi-tier conversation memories
python .agents/skills/zap-skills/scripts/train_zap_sources.py --seed-memory

# Train the agent harness directly from a user conversation message
python .agents/skills/zap-skills/scripts/train_zap_sources.py --learn-turn "Bantu cek coretan saya: 2x + 6 = 14 -> 2x = 20 -> x = 10"
```

### D. Audit All 5 Pillars & Zero-Answer Guardrail Compliance
```powershell
python .agents/skills/zap-skills/scripts/train_zap_sources.py --audit
```

---

## 🧠 3. How the ZAP Model Agent Harness Learns Continuously from Conversations

Unlike static chatbots, ZAP operates as a **Continuous-Learning Socratic Agent Harness** wired across [`frontend/app/api/chat/route.ts`](../../../frontend/app/api/chat/route.ts), [`backend/main.py`](../../../backend/main.py), and [`backend/data_engine/agent_harness.py`](../../../backend/data_engine/agent_harness.py):

1. **Pre-Turn Episodic Memory Retrieval (`POST /api/v1/harness/context`):**
   - Before generating a response, the chat router queries `ZAPAgentHarness.build_harness_context(query)`.
   - The harness retrieves matching episodic memories (`agent_episodic_memory`), SymPy-verified corpus examples (`MathCorpusStore`), and 2D/3D geometry formulas (`GeometryDatabase`), injecting them into the system prompt as `<ZAP_AGENT_HARNESS_CONTEXT>`.
2. **Real-Time Continuous Learning from User Turns (`POST /api/v1/harness/learn`):**
   - Every valid user conversation turn is sent asynchronously to `ZAPAgentHarness.learn_from_conversation()`.
   - **Step 1 (Privacy Redaction):** `redact_pii()` strips emails, phone numbers, and API keys.
   - **Step 2 (Symbolic Extraction & CAS Diagnosis):** `extract_math_steps_from_text()` extracts equations/steps (`->`, multiline, or inline) and runs `isolate_first_fault_breakpoint()` in SymPy.
   - **Step 3 (Zero-Answer Sanitization):** Any Socratic resolution is sanitized through `RobustZeroAnswerGuardrail.sanitize()`.
   - **Step 4 (Episodic Upsert & Corpus Promotion):** The pattern is deduplicated by `memory_id` in `data/zap_agent_memory.jsonl` and SQLite (`hit_count` incremented on recurring misconceptions), while valid multi-step derivations (`VALID_COMPLETE` / `VALID_PARTIAL`) are automatically promoted into `data/zap_math_corpus.jsonl`.

---

## 🛡️ 4. CFL Engine & Security Mutation Verification Runbook

*(Consolidated from `cfl-verification` into `zap-skills`)*

### Step 1: Run the Full Deterministic Pytest Suite
```powershell
python -m pytest -v -p no:cacheprovider tests/ backend/tests_platform/
```

### Step 2: Mutation Testing Protocol (Anti-Masking & Anti-DoS Verification)
To verify that `test_dangerous_inputs_never_reach_sympy` is sensitive and never masked:
1. In [`backend/cfl/parser.py`](../../../backend/cfl/parser.py), temporarily comment out `_has_dangerous_exponents(cleaned)`.
2. Run:
   ```powershell
   python -m pytest tests/test_cfl_engine.py -k test_dangerous_inputs_never_reach_sympy -q -p no:cacheprovider
   ```
3. Confirm it **FAILS** with `AssertionError: SymPy dipanggil untuk input berbahaya`.
4. Restore [`backend/cfl/parser.py`](../../../backend/cfl/parser.py) immediately (`git checkout backend/cfl/parser.py`) and re-run to confirm green.

---

## 📚 5. Reference Documentation Inside This Skill

* 📄 [**`references/DATA_SOURCES_SCHEMA.md`**](references/DATA_SOURCES_SCHEMA.md) — Exact data contracts, JSON schemas, and code templates for Taxonomy, Corpus items, Internet Harvesters, Agent Episodic Memory, and 3D Geometry entities.
* 🧠 [**`references/SOCRATIC_ONTOLOGY.md`**](references/SOCRATIC_ONTOLOGY.md) — Guide to ZAP's Socratic scaffolding rules, cognitive disequilibrium counter-examples, misconception taxonomy, and Zero-Answer Guardrail invariants.
