"""
NalarAI - Pytest Automated Verification Suite
Memverifikasi engine CFL aljabar, penanganan ConditionSet, dan RobustZeroAnswerGuardrail.
"""

import pytest
import sys
import os

# Pastikan path modul cfl terbaca saat dijalankan dari folder mana saja
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from cfl import (
    isolate_first_fault_breakpoint,
    steps_equivalent,
    parse_step_to_symbolic,
    RobustZeroAnswerGuardrail
)


class TestCFLEngine:

    def test_polynomial_expansion_fault_detected(self):
        """
        Kasus 1: Siswa salah ekspansi kuadrat (x+3)^2 menjadi x^2 + 9.
        Sistem harus mengisolasi baris ke-2, mengidentifikasi miskonsepsi distributif,
        dan menghasilkan kontra-contoh konkret yang dihitung (BUKAN fallback).
        """
        steps = [
            "(x + 3)^2 - 4",
            "x^2 + 9 - 4",
            "x^2 + 5"
        ]
        fault_idx, diag = isolate_first_fault_breakpoint(steps, target_var='x')
        
        assert fault_idx == 1  # 0-indexed: baris index 1 (baris ke-2)
        assert diag["fault_line"] == 2
        assert diag["misconception_type"] == "DISTRIBUTIVE_EXPANSION_ILLUSION"
        
        # Asersi ketat: Memastikan kontra-contoh benar-benar dihitung dari ekspresi
        ce = diag["counter_example"]
        assert "note" not in ce
        assert ce["test_value"] == 2
        assert ce["lhs_expected"] == "21"
        assert ce["rhs_calculated"] == "9"
        assert ce["lhs_expected"] != ce["rhs_calculated"]

    def test_equation_valid_transposition(self):
        """
        Kasus 2: Siswa menyelesaikan persamaan linear secara tepat:
        2x + 3 = 7  ==>  2x = 4  ==>  x = 2
        Solusi riil ekuivalen: {2} pada setiap langkah.
        """
        steps = [
            "2x + 3 = 7",
            "2x = 4",
            "x = 2"
        ]
        fault_idx, diag = isolate_first_fault_breakpoint(steps, target_var='x')
        
        assert fault_idx == -1
        assert diag["status"] == "ALL_STEPS_VALID"

    def test_equation_invalid_transposition(self):
        """
        Kasus 3: Siswa salah memindahkan ruas persamaan:
        2x + 3 = 7  ==>  2x = 10 (seharusnya 7 - 3 = 4, bukan 7 + 3)
        Sistem harus menangkap galat di baris ke-2 dan mengidentifikasi kesalahan tanda.
        """
        steps = [
            "2x + 3 = 7",
            "2x = 10",
            "x = 5"
        ]
        fault_idx, diag = isolate_first_fault_breakpoint(steps, target_var='x')
        
        assert fault_idx == 1
        assert diag["fault_line"] == 2
        assert diag["misconception_type"] == "SIGN_INVERSION_OR_TRANSPOSITION_ERROR"

    def test_root_loss_detection(self):
        """
        Kasus 4: Kehilangan akar saat menarik akar kuadrat:
        x^2 = 4  ==>  x = 2  (akar negatif x = -2 terbuang)
        Himpunan solusi {-2, 2} != {2}, harus ditandai galat di baris ke-2
        dengan tipe spesifik ROOT_LOSS.
        """
        steps = [
            "x^2 = 4",
            "x = 2"
        ]
        fault_idx, diag = isolate_first_fault_breakpoint(steps, target_var='x')
        
        assert fault_idx == 1
        assert diag["fault_line"] == 2
        assert diag["status"] == "FAULT_DETECTED"
        assert diag["misconception_type"] == "ROOT_LOSS"

    def test_undecidable_condition_set(self):
        """
        Kasus 5: Persamaan transendental yang menghasilkan ConditionSet:
        sin(x) = x  ==>  sin(x) - x = 0
        SymPy solveset mengembalikan ConditionSet pada Reals,
        sistem harus mengembalikan status UNDECIDABLE_STEP (jangan memaksakan vonis salah).
        """
        steps = [
            "sin(x) = x",
            "sin(x) - x = 0"
        ]
        fault_idx, diag = isolate_first_fault_breakpoint(steps, target_var='x')
        
        assert fault_idx == 1
        assert diag["status"] == "UNDECIDABLE_STEP"
        assert diag["fault_line"] == 2

    def test_parser_rejects_code_injection(self):
        """
        Kasus 6: Uji Keamanan Anti-RCE.
        Memverifikasi bahwa SymPy parser menolak sintaks Python berbahaya (eval escape)
        seperti __import__('os'), exec(), atau pemanggilan fungsi berbahaya lainnya.
        """
        malicious_payloads = [
            "__import__('os').system('echo hi')",
            "eval('1+1')",
            "open('passwords.txt')",
            "__builtins__"
        ]
        for payload in malicious_payloads:
            with pytest.raises(ValueError):
                parse_step_to_symbolic(payload)

    def test_latex_fallback_rejects_non_math_commands(self):
        r"""
        Kasus 7: Memverifikasi jalur fallback LaTeX menolak perintah non-matematika berbahaya
        seperti \input{} atau \write18{} tanpa eksekusi.
        """
        for payload in [r"\input{/etc/passwd}", r"\write18{echo hi}"]:
            with pytest.raises(ValueError):
                parse_step_to_symbolic(payload)

    def test_parser_rejects_dangerous_nested_and_huge_exponents(self):
        r"""
        Kasus 8: Uji Pertahanan Anti-DoS.
        Memverifikasi bahwa parser menolak eksponen raksasa dan pangkat bertingkat
        seperti 9^9^9, x^{99999999}, dan x^2^3 sebelum memicu pembekuan server (freeze).
        """
        dos_payloads = [
            "9^9^9",
            "(9^9)^9",
            "(9^9)^(9^9)",
            "2^(100000000000)",
            "9^{9}^{9}",
            "10^100000",
            r"\sqrt[99999]{2}",
            r"x^{99999999}",
            "x^2^3",
            "x^105"
        ]
        for payload in dos_payloads:
            with pytest.raises(ValueError):
                parse_step_to_symbolic(payload)


class TestZeroAnswerGuardrail:

    def test_guardrail_preserves_socratic_context(self):
        """
        Kasus 7: Uji regresi - memastikan 'Jika x = 2', 'baris ke-2', dan
        'Hasil dari substitusi adalah 25' TIDAK tersensor meskipun kunci jawaban akhir bernilai 2.
        """
        socratic_prompt = (
            "Di baris ke-2, kamu mengekspansi kuadrat. "
            "Coba substitusi jika x = 2, berapakah nilai dari (2+3)^2? "
            "Hasil dari substitusi awal adalah 25, apakah sama dengan 2^2 + 9?"
        )
        target_answer = "2"
        
        sanitized = RobustZeroAnswerGuardrail.sanitize(socratic_prompt, final_solution=target_answer)
        
        # Konteks petunjuk Sokrates harus tetap utuh
        assert "baris ke-2" in sanitized
        assert "jika x = 2" in sanitized
        assert "(2+3)^2" in sanitized
        assert "Hasil dari substitusi awal adalah 25" in sanitized

    def test_guardrail_censors_explicit_declaration(self):
        """
        Kasus 7: Memastikan pernyataan deklaratif kunci jawaban langsung disaring.
        """
        leaked_text = "Berdasarkan evaluasi, jawaban akhirnya adalah x = 2."
        sanitized = RobustZeroAnswerGuardrail.sanitize(leaked_text, final_solution="2")
        
        assert "jawaban akhirnya adalah x = 2" not in sanitized
        assert "Bagaimanakah menurut analisismu?" in sanitized

    def test_guardrail_masks_kunci_declaration_with_final_solution(self):
        """
        Kasus 8: Menguji cabang kedua guardrail (parameter final_solution)
        memastikan sensor hanya terjadi pada deklarasi kunci, bukan pada 'baris ke-5'.
        """
        text = "Kunci adalah 5, sedangkan di baris ke-5 kamu salah substitusi."
        sanitized = RobustZeroAnswerGuardrail.sanitize(text, final_solution="5")
        
        assert "kunci adalah [DIRAHASIAKAN]" in sanitized
        assert "baris ke-5" in sanitized
