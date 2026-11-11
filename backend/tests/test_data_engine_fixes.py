"""
Regression tests for the 2026-11-11 audit fixes (backend / data engine):
- Harvester verification is fail-closed (unknown formulas, GSM8K annotations).
- Agent harness never promotes FAULT_DETECTED derivations into the corpus.
- Trapezoid/triangle areas keep exact .5 values (no int truncation).
- SMP generator has a real arithmetic-sequence (barisan) branch.
- POST /api/v1/verify accepts equivalent pairs and safely rejects bad input.
"""

import os
import sys

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from main import app
from backend.data_engine.harvester import _verify_gsm8k_solution, _verify_theorem_with_sympy
from backend.data_engine.agent_harness import ZAPAgentHarness
from backend.data_engine.store import MathCorpusStore
from backend.data_engine.generators import generate_sd_sample, generate_smp_sample

client = TestClient(app)


class TestHarvesterFailClosed:
    def test_unknown_theorem_is_unverified(self):
        result = _verify_theorem_with_sympy("some_unknown_identity(x) = 42")
        assert result["is_valid"] is False
        assert result["status"] == "unverified"

    def test_known_theorem_still_verifies(self):
        result = _verify_theorem_with_sympy("(x + y)^2 = x^2 + 2*x*y + y^2")
        assert result["is_valid"] is True
        assert result["status"] == "verified"

    def test_gsm8k_consistent_annotations_verify(self):
        answer = "Janet sells 16 - 3 - 4 = <<16-3-4=9>>9 eggs.\n#### 9"
        result = _verify_gsm8k_solution(answer)
        assert result["is_valid"] is True
        assert result["annotations_checked"] == 1

    def test_gsm8k_broken_annotation_fails_closed(self):
        answer = "She sells <<3*2=7>>7 eggs.\n#### 7"
        result = _verify_gsm8k_solution(answer)
        assert result["is_valid"] is False

    def test_gsm8k_without_annotations_is_unverified(self):
        result = _verify_gsm8k_solution("Some reasoning without annotations.\n#### 5")
        assert result["is_valid"] is False
        assert result["status"] == "unverified"


class TestHarnessPromotionGate:
    def test_fault_detected_is_never_promoted(self, tmp_path):
        store = MathCorpusStore(
            db_path=str(tmp_path / "corpus.db"),
            jsonl_path=str(tmp_path / "corpus.jsonl"),
        )
        harness = ZAPAgentHarness(
            db_path=str(tmp_path / "corpus.db"),
            memory_jsonl_path=str(tmp_path / "memory.jsonl"),
            corpus_store=store,
        )
        result = harness.learn_from_conversation(
            user_message="Kak aku ngitung (x + 3)^2 - 4 kok hasilnya x^2 + 9 - 4 terus jadi x^2 + 5 ya?",
            explicit_steps=["(x + 3)^2 - 4", "x^2 + 9 - 4", "x^2 + 5"],
            target_var="x",
        )
        assert result["cfl_status"] == "FAULT_DETECTED"
        assert result["sympy_verified"] is False
        assert result["promoted_to_corpus"] is False
        assert store.get_statistics()["total_records"] == 0


class TestExactAreas:
    def test_trapezoid_half_area_is_exact(self):
        found = 0
        for idx in range(60):
            item = generate_sd_sample(idx)
            if item.get("shape_kind") != "trapesium":
                continue
            params = item["parameters"]
            exact = ((params["a"] + params["b"]) * params["tinggi"]) / 2
            recorded = float(item["sympy_verification"]["luas_eval"])
            assert recorded == exact
            if exact % 1 == 0.5:
                found += 1
                assert item["sympy_verification"]["luas_eval"].endswith(".5")
        assert found >= 1, "expected at least one trapezoid sample with a .5 area"

    def test_triangle_half_area_is_exact(self):
        for idx in range(60):
            item = generate_sd_sample(idx)
            if item.get("shape_kind") != "segitiga":
                continue
            params = item["parameters"]
            exact = (params["alas"] * params["tinggi"]) / 2
            assert float(item["sympy_verification"]["luas_eval"]) == exact


class TestBarisanGenerator:
    def test_barisan_branch_produces_arithmetic_sequence(self):
        barisan_items = [
            generate_smp_sample(idx) for idx in range(8)
            if "Barisan" in generate_smp_sample(idx).get("subtopic", "")
        ]
        assert barisan_items, "no barisan sample generated in 8 SMP samples"
        item = barisan_items[0]
        params = item["parameters"]
        assert params["un"] == params["a"] + (params["n"] - 1) * params["beda"]
        assert item["sympy_verification"]["un_eval"] == str(params["un"])
        assert item["sympy_verification"]["is_valid"] is True

    def test_generator_is_deterministic(self):
        assert generate_smp_sample(3) == generate_smp_sample(3)
        assert generate_sd_sample(5) == generate_sd_sample(5)


class TestVerifyEndpoint:
    def test_equivalent_pair_accepted(self):
        response = client.post("/api/v1/verify", json={"left": "(x + 1)^2", "right": "x^2 + 2*x + 1"})
        assert response.status_code == 200
        data = response.json()
        assert data["isEquivalent"] is True
        assert data["verified"] is True

    def test_non_equivalent_pair_rejected_as_not_equivalent(self):
        response = client.post("/api/v1/verify", json={"left": "(x + 3)^2", "right": "x^2 + 9"})
        assert response.status_code == 200
        data = response.json()
        assert data["isEquivalent"] is False
        assert data["verified"] is True

    def test_dangerous_input_rejected_safely(self):
        response = client.post(
            "/api/v1/verify",
            json={"left": "__import__('os').system('echo hacked')", "right": "x"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["verified"] is False
        assert data["isEquivalent"] is False
