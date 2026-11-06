"""
NalarAI - API Integration Verification Suite
Framework: FastAPI TestClient + Pytest
Memverifikasi endpoint /api/v1/diagnose, kepatuhan schema, dan penanganan celah keamanan via HTTP.
"""

import sys
import os
import pytest
from fastapi.testclient import TestClient

# Pastikan import backend/main.py dapat ditemukan
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app

client = TestClient(app)


class TestNalarAIAPI:

    def test_health_check(self):
        """Memverifikasi endpoint health check mengembalikan status online."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "online"
        assert "SymPy" in data["engine"]

    def test_diagnose_polynomial_expansion_fault(self):
        """
        Memverifikasi alur lengkap diagnosa HTTP:
        Siswa salah ekspansi kuadrat (x+3)^2 - 4 -> x^2 + 9 - 4.
        """
        payload = {
            "confirmed_steps": [
                "(x + 3)^2 - 4",
                "x^2 + 9 - 4",
                "x^2 + 5"
            ],
            "target_variable": "x"
        }
        response = client.post("/api/v1/diagnose", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "success"
        assert data["session_id"].startswith("sess_")
        
        # Validasi Transkripsi
        tx = data["transcription"]
        assert tx["total_lines"] == 3
        assert tx["lines"][0]["is_valid"] is True
        assert tx["lines"][1]["is_valid"] is False
        assert tx["lines"][2]["is_valid"] is False
        
        # Validasi Diagnosis
        diag = data["diagnosis"]
        assert diag["has_fault"] is True
        assert diag["first_fault_line"] == 2
        assert diag["fault_type"] == "DISTRIBUTIVE_EXPANSION_ILLUSION"
        assert "perkalian silang" in diag["human_explanation"]
        
        # Validasi Kontra-Contoh
        ce = diag["counter_example"]
        assert ce is not None
        assert ce["test_variable"] == "x"
        assert ce["test_value"] == 2
        assert str(ce["lhs_expected"]) == "21"
        assert str(ce["rhs_calculated"]) == "9"
        
        # Validasi Guardrail
        assert data["guardrail_status"]["final_answer_suppressed"] is True
        assert "jawaban akhirnya" not in diag["socratic_prompt"]

    def test_diagnose_valid_transposition(self):
        """
        Memverifikasi bahwa alur langkah yang benar menghasilkan has_fault = False
        dan seluruh baris ditandai is_valid = True.
        """
        payload = {
            "confirmed_steps": [
                "2x + 3 = 7",
                "2x = 4",
                "x = 2"
            ],
            "target_variable": "x"
        }
        response = client.post("/api/v1/diagnose", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["diagnosis"]["has_fault"] is False
        assert data["diagnosis"]["status"] == "ALL_STEPS_VALID"
        assert all(line["is_valid"] is True for line in data["transcription"]["lines"])

    def test_diagnose_rejects_empty_steps(self):
        """Memverifikasi payload tanpa baris aljabar ditolak dengan HTTP 422."""
        payload = {
            "confirmed_steps": [],
            "target_variable": "x"
        }
        response = client.post("/api/v1/diagnose", json=payload)
        assert response.status_code == 422

    def test_diagnose_rejects_code_injection_payload(self):
        """
        Memverifikasi bahwa upaya injeksi kode Python via HTTP
        ditolak secara aman dengan HTTP 422 dan tidak menimbulkan RCE.
        """
        payload = {
            "confirmed_steps": [
                "__import__('os').system('echo pwned')"
            ],
            "target_variable": "x"
        }
        response = client.post("/api/v1/diagnose", json=payload)
        assert response.status_code == 422
        error_detail = response.json()["detail"]
        assert "tidak dapat diurai" in error_detail or "Gagal mengurai" in error_detail

    def test_diagnose_undecidable_condition_set(self):
        """
        Memverifikasi bahwa persamaan transendental (sin(x)=x) yang menghasilkan ConditionSet
        tidak menyebabkan crash server (HTTP 500) melainkan tertangani sebagai UNDECIDABLE_STEP.
        """
        payload = {
            "confirmed_steps": [
                "sin(x) = x",
                "sin(x) - x = 0"
            ],
            "target_variable": "x"
        }
        response = client.post("/api/v1/diagnose", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["diagnosis"]["status"] == "UNDECIDABLE_STEP"
        assert data["diagnosis"]["has_fault"] is False

    def test_diagnose_accepts_legacy_fields_lines_and_target_var(self):
        """
        Memverifikasi fleksibilitas backward-compatibility payload
        menggunakan field 'lines' dan 'target_var' sebagai pengganti confirmed_steps.
        """
        payload = {
            "lines": [
                "(x + 3)^2 - 4",
                "x^2 + 9 - 4",
                "x^2 + 5"
            ],
            "target_var": "x"
        }
        response = client.post("/api/v1/diagnose", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["diagnosis"]["first_fault_line"] == 2
        assert data["diagnosis"]["fault_type"] == "DISTRIBUTIVE_EXPANSION_ILLUSION"

    def test_diagnose_rejects_malicious_latex_payload(self):
        r"""
        Memverifikasi bahwa payload dengan perintah LaTeX non-matematika
        seperti \input{/etc/passwd} ditolak dengan HTTP 422.
        """
        payload = {
            "confirmed_steps": [
                r"\input{/etc/passwd}"
            ],
            "target_variable": "x"
        }
        response = client.post("/api/v1/diagnose", json=payload)
        assert response.status_code == 422
        error_detail = response.json()["detail"]
        assert "tidak diizinkan" in error_detail or "Gagal mengurai" in error_detail
