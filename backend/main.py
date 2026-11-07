"""
ZAP (Zero Answer Policy) - Backend API Gateway & CFL Orchestrator
Framework: FastAPI (Production-Ready Spec)
Rubrik LOGICODIX 2026: Anti-Halusinasi, Zero-Answer Policy, dan Human-in-the-Loop LaTeX Confirmation
"""

import uuid
from typing import Any
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from cfl import (
    isolate_first_fault_breakpoint,
    RobustZeroAnswerGuardrail
)

app = FastAPI(
    title="ZAP Cognitive Diagnostics API",
    description="Autonomous Cognitive Diagnostics Engine for Student Scratchpads (LOGICODIX 2026)",
    version="2.2.0"
)

# CORS Middleware untuk integrasi mulus dengan Client Tier (Next.js 14)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
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

    session_id = f"sess_{uuid.uuid4().hex[:8]}"
    chosen_var = (request.target_variable or request.target_var or "x").strip() or "x"
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
