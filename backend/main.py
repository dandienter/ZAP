"""
ZAP (Zero Answer Policy) - Backend API Gateway & CFL Orchestrator
Framework: FastAPI (Production-Ready Spec)
Rubrik LOGICODIX 2026: Anti-Halusinasi, Zero-Answer Policy, dan Human-in-the-Loop LaTeX Confirmation
"""

import os
import sys
import uuid
from typing import Any
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

_REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

from cfl import (
    isolate_first_fault_breakpoint,
    RobustZeroAnswerGuardrail
)
from cfl.parser import ALLOWED_VARS
from data_engine.agent_harness import ZAPAgentHarness

agent_harness = ZAPAgentHarness()

app = FastAPI(
    title="ZAP Cognitive Diagnostics API",
    description="Autonomous Cognitive Diagnostics Engine for Student Scratchpads (LOGICODIX 2026)",
    version="2.2.0"
)

# CORS Middleware terkonfigurasi aman (mendukung domain produksi & fallback wildcard)
cors_origins_env = os.environ.get("CORS_ORIGINS", "*").strip()
if cors_origins_env == "*":
    allowed_origins = ["*"]
else:
    allowed_origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# ==========================================
# Pydantic Request & Response Schemas
# ==========================================

class DiagnoseRequest(BaseModel):
    confirmed_steps: list[str] | None = Field(
        default=None,
        description="Daftar baris matematika hasil ekstraksi/konfirmasi coretan siswa"
    )
    lines: list[str] | None = Field(
        default=None,
        description="Alias backward-compatible untuk confirmed_steps"
    )
    target_variable: str | None = Field(
        default=None,
        max_length=5,
        description="Variabel aljabar utama (misal: 'x', 'y', 'a')"
    )
    target_var: str | None = Field(
        default=None,
        max_length=5,
        description="Alias backward-compatible untuk target_variable"
    )
    image: str | None = Field(
        default=None,
        description="Base64 encoded gambar coretan siswa (opsional jika sudah dikonfirmasi)"
    )
    client_timestamp: str | None = Field(
        default=None,
        description="ISO 8601 timestamp dari klien"
    )


class TranscriptionLine(BaseModel):
    line_number: int
    raw_latex: str
    is_valid: bool


class TranscriptionResult(BaseModel):
    total_lines: int
    lines: list[TranscriptionLine]


class CounterExampleResult(BaseModel):
    test_variable: str
    test_value: Any
    lhs_expected: Any
    rhs_calculated: Any
    contradiction_statement: str


class DiagnosisResult(BaseModel):
    has_fault: bool
    first_fault_line: int | None = None
    fault_type: str | None = None
    status: str
    human_explanation: str
    socratic_prompt: str
    counter_example: CounterExampleResult | None = None


class GuardrailStatus(BaseModel):
    final_answer_suppressed: bool


class DiagnoseResponse(BaseModel):
    status: str
    session_id: str
    transcription: TranscriptionResult
    diagnosis: DiagnosisResult
    guardrail_status: GuardrailStatus


# ==========================================
# API Endpoints
# ==========================================

@app.get("/", tags=["Health"])
@app.get("/health", tags=["Health"])
def health_check():
    """Health check endpoint untuk monitoring service."""
    return {
        "status": "online",
        "service": "ZAP Diagnostic Gateway",
        "engine": "SymPy CFL Symbolic Reasoning",
        "version": "2.2.0"
    }


@app.post("/api/v1/diagnose", response_model=DiagnoseResponse, status_code=status.HTTP_200_OK, tags=["Diagnostics"])
def diagnose_student_scratchpad(request: DiagnoseRequest):
    """
    Menganalisis coretan aljabar siswa baris-demi-baris secara deterministik.
    - Mengidentifikasi titik patah logika pertama (First Fault Breakpoint).
    - Menghasilkan kontra-contoh aritmetika terkecil.
    - Menyusun petunjuk Sokrates berpegang teguh pada Robust Zero-Answer Guardrail.
    """
    steps_input = request.confirmed_steps if request.confirmed_steps is not None else (request.lines or [])
    raw_steps = [s.strip() for s in steps_input if s.strip()]
    if not raw_steps:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Daftar langkah aljabar tidak boleh kosong."
        )
    if len(raw_steps) > 50:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Jumlah langkah aljabar melebihi batas maksimum (maksimal 50 langkah per sesi)."
        )

    session_id = f"sess_{uuid.uuid4().hex[:8]}"
    chosen_var = (request.target_variable or request.target_var or "x").strip() or "x"
    if chosen_var not in ALLOWED_VARS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"Variabel target '{chosen_var}' tidak diizinkan. Variabel yang didukung: {', '.join(sorted(ALLOWED_VARS))}."
        )
    target_var = chosen_var

    # Jalankan Symbolic CFL Engine
    fault_idx, diag = isolate_first_fault_breakpoint(raw_steps, target_var=target_var)

    # Tangani Parsing Error jika salah satu baris mengandung sintaks tidak valid / injeksi
    if diag.get("status") == "PARSING_ERROR":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=diag.get("message", "Format aljabar tidak valid.")
        )

    # Bangun status baris transkripsi
    transcription_lines: list[TranscriptionLine] = []
    fault_line_num = diag.get("fault_line") if fault_idx != -1 else None

    for i, step_str in enumerate(raw_steps):
        line_num = i + 1
        # Baris sebelum titik galat adalah valid; baris pada dan setelah galat ditandai tidak valid
        if fault_line_num is not None:
            is_valid = line_num < fault_line_num
        else:
            is_valid = True
            
        transcription_lines.append(TranscriptionLine(
            line_number=line_num,
            raw_latex=step_str,
            is_valid=is_valid
        ))

    # Konstruksi Diagnosis & Scaffolding Sokrates
    cfl_status = diag.get("status", "UNKNOWN")
    counter_example_obj = None

    if cfl_status == "FAULT_DETECTED":
        has_fault = True
        fault_type = diag.get("misconception_type", "GENERAL_ALGEBRAIC_DERIVATION_ERROR")
        ce = diag.get("counter_example")

        if fault_type == "DISTRIBUTIVE_EXPANSION_ILLUSION":
            human_explanation = "Terdapat indikasi hilangnya suku perkalian silang saat mengekspansi kuadrat aljabar."
            raw_prompt = (
                f"Di baris ke-{fault_line_num}, kamu mengekspansi kuadrat bentuk aljabar. "
                f"Coba uji jika {target_var} = {ce.get('test_value', 2)}: "
                f"berapakah nilai ekspresi awal dan berapakah nilai yang kamu tulis? "
                "Mengapa kedua hasil perhitungan tersebut tidak sama?"
            )
        elif fault_type == "SIGN_INVERSION_OR_TRANSPOSITION_ERROR":
            human_explanation = "Terdapat kekeliruan pembalikan tanda atau transposisi suku saat memindahkan ruas persamaan."
            raw_prompt = (
                f"Perhatikan baris ke-{fault_line_num}. "
                "Operasi aljabar apa yang kamu terapkan pada kedua ruas persamaan? "
                "Coba periksa kembali apakah tanda positif atau negatifnya sudah seimbang."
            )
        elif fault_type == "ROOT_LOSS":
            human_explanation = "Penarikan akar kuadrat pada kedua ruas menyebabkan kehilangan solusi akar negatif."
            raw_prompt = (
                f"Di baris ke-{fault_line_num}, kamu menarik akar kuadrat. "
                "Ingatlah bahwa bilangan kuadrat memiliki dua kemungkinan nilai akar (positif dan negatif). "
                "Apakah kamu sudah mempertimbangkan kedua kemungkinan tersebut?"
            )
        else:
            human_explanation = "Terdeteksi inkonsistensi matematis antara baris ini dengan langkah sebelumnya."
            raw_prompt = (
                f"Di baris ke-{fault_line_num}, periksa kembali operasi matematis yang menghubungkannya "
                "dengan baris sebelumnya. Apakah aturan aljabar sudah terpenuhi?"
            )

        if ce:
            stmt = ce.get("contradiction_statement")
            if not stmt and ce.get("lhs_expected") is not None:
                stmt = (
                    f"Ketika {target_var} = {ce.get('test_value')}, rumus awal bernilai "
                    f"{ce.get('lhs_expected')}, tetapi langkahmu menghasilkan {ce.get('rhs_calculated')}."
                )
            elif not stmt:
                stmt = ce.get("note", "Periksa kembali aturan aljabar secara teliti.")

            counter_example_obj = CounterExampleResult(
                test_variable=target_var,
                test_value=ce.get("test_value"),
                lhs_expected=ce.get("lhs_expected"),
                rhs_calculated=ce.get("rhs_calculated"),
                contradiction_statement=stmt
            )

    elif cfl_status == "UNDECIDABLE_STEP":
        # Langkah berisiko / ConditionSet (bukan tuduhan salah kepada siswa)
        has_fault = False
        fault_type = "UNDECIDABLE_STEP"
        human_explanation = "Langkah ini berada pada domain transendental yang memerlukan telaah pembatasan syarat nilai."
        raw_prompt = (
            f"Di baris ke-{fault_line_num}, langkah ini melibatkan fungsi dengan batasan domain tertentu. "
            "Coba periksa apakah nilai variabel yang kamu gunakan memenuhi seluruh syarat keberlakuan fungsi."
        )

    else:  # ALL_STEPS_VALID
        has_fault = False
        fault_type = None
        human_explanation = "Seluruh langkah penurunan aljabar konsisten dan valid secara matematis."
        raw_prompt = (
            "Hebat! Seluruh langkah penurunan aljabarmu konsisten. "
            "Apakah kamu sudah memverifikasi solusi ini dengan mensubstitusikannya kembali ke persamaan asal?"
        )

    # Filter Sokrates Prompt melalui Robust Zero-Answer Guardrail
    sanitized_prompt = RobustZeroAnswerGuardrail.sanitize(raw_prompt)

    diagnosis_payload = DiagnosisResult(
        has_fault=has_fault,
        first_fault_line=fault_line_num if has_fault else (fault_line_num if cfl_status == "UNDECIDABLE_STEP" else None),
        fault_type=fault_type,
        status=cfl_status,
        human_explanation=human_explanation,
        socratic_prompt=sanitized_prompt,
        counter_example=counter_example_obj
    )

    return DiagnoseResponse(
        status="success",
        session_id=session_id,
        transcription=TranscriptionResult(
            total_lines=len(transcription_lines),
            lines=transcription_lines
        ),
        diagnosis=diagnosis_payload,
        guardrail_status=GuardrailStatus(
            final_answer_suppressed=True
        )
    )


# ==========================================
# ZAP Agent Harness — Continuous Memory & RAG Endpoints
# ==========================================

class HarnessLearnRequest(BaseModel):
    user_message: str = Field(..., description="Pesan atau pertanyaan dari siswa/pengguna")
    assistant_reply: str = Field(default="", description="Balasan Sokratik dari asisten")
    explicit_steps: list[str] | None = Field(default=None, description="Langkah aljabar eksplisit jika ada")
    target_variable: str = Field(default="x", max_length=5, description="Variabel target")
    tier_hint: str | None = Field(default=None, description="Jenjang pendidikan opsional (TK s/d S3)")


class HarnessContextRequest(BaseModel):
    query: str = Field(..., description="Kueri atau pesan pengguna yang akan diperkaya dengan memori")
    limit: int | None = Field(default=None, ge=1, le=10, description="Jumlah memori relevan maksimum")
    top_k: int | None = Field(default=None, ge=1, le=10, description="Alias untuk limit")


@app.post("/api/v1/harness/learn", status_code=status.HTTP_200_OK, tags=["Agent Harness"])
def harness_learn_from_conversation(req: HarnessLearnRequest):
    """
    Mempelajari percakapan pengguna secara berkelanjutan (Continuous Learning from Memory):
    - Menyaring PII (Email, Telepon, NIK).
    - Mengekstrak langkah aljabar dan memverifikasinya via SymPy CFL.
    - Menyaring petunjuk Sokratik dengan RobustZeroAnswerGuardrail.
    - Menyimpan ke Episodic Memory dan mempromosikan langkah valid ke MathCorpusStore.
    """
    result = agent_harness.learn_from_conversation(
        user_message=req.user_message,
        assistant_reply=req.assistant_reply,
        explicit_steps=req.explicit_steps,
        target_var=req.target_variable,
        tier_hint=req.tier_hint,
    )
    return result


@app.post("/api/v1/harness/context", status_code=status.HTTP_200_OK, tags=["Agent Harness"])
def harness_retrieve_context(req: HarnessContextRequest):
    """
    Mengambil konteks memori relevan (<ZAP_AGENT_HARNESS_CONTEXT>) dari Episodic Memory,
    MathCorpusStore, dan 2D/3D Geometry Database untuk disuntikkan ke prompt agen.
    """
    effective_limit = req.limit or req.top_k or 3
    return agent_harness.build_harness_context(query=req.query, limit=effective_limit)


@app.get("/api/v1/harness/stats", status_code=status.HTTP_200_OK, tags=["Agent Harness"])
def harness_memory_stats():
    """Mengambil statistik memori agen dan korpus pembelajaran berkelanjutan."""
    mem_stats = agent_harness.get_memory_stats()
    return {
        "status": "success",
        **mem_stats,
        "memory": mem_stats,
        "corpus": agent_harness.corpus_store.get_statistics(),
    }
