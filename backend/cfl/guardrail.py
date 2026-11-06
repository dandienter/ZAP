"""
NalarAI - Context-Aware Zero-Answer Guardrail
Menyaring kebocoran deklaratif kunci jawaban tanpa merusak konteks simulasi Sokrates.
"""

import re

class RobustZeroAnswerGuardrail:
    """
    Guardrail yang secara ketat mendeteksi dan menyaring deklarasi eksplisit kunci jawaban,
    namun mengizinkan kalimat instruksional Sokrates (misal: 'Jika x = 2', 'hasil dari substitusi adalah 25').
    """

    DECLARATIVE_ANSWER_PATTERNS = [
        # Deteksi eksplisit: "jawaban akhirnya adalah x = 2", "solusinya adalah 5", "hasil akhir adalah -5/2"
        # Catatan: 'hasil' WAJIB diikuti 'akhir' agar tidak mencocokkan 'hasil dari substitusi adalah...'
        r"(?:jawaban(?:\s*akhir(?:nya)?)?|solusi(?:nya)?|hasil\s+akhir(?:nya)?)\s*(?:adalah|=|:)\s*(?:[a-zA-Z]\s*=\s*)?[-+−]?\s*(?:\d+(?:\/\d+)?|\d*\.?\d+|√\d+)",
        # Deteksi kesimpulan: "maka x = 2", "jadi x = -5", "kesimpulannya x = 2"
        r"(?:maka|jadi|kesimpulannya),?\s+[a-zA-Z]\s*=\s*[-+−]?\s*(?:\d+(?:\/\d+)?|\d*\.?\d+|√\d+)",
        # Bahasa Inggris fallback
        r"(?:the\s+(?:final\s+)?answer\s+is|therefore\s+[a-zA-Z]\s*=)\s*[-+−]?\s*(?:\d+(?:\/\d+)?|\d*\.?\d+)"
    ]

    @classmethod
    def sanitize(cls, text: str, final_solution: str | None = None) -> str:
        """
        Menyaring teks keluaran AI dari deklarasi eksplisit jawaban akhir.
        """
        sanitized = text

        # 1. Bersihkan seluruh pernyataan deklaratif kesimpulan jawaban
        for pattern in cls.DECLARATIVE_ANSWER_PATTERNS:
            sanitized = re.sub(
                pattern,
                "Bagaimanakah menurut analisismu?",
                sanitized,
                flags=re.IGNORECASE
            )

        # 2. Jika target final_solution diberikan (misal '2' atau '-5/2'),
        # hanya filter jika dipasangkan dengan kata penutup kunci (bukan 'jika x = 2')
        if final_solution and str(final_solution).strip():
            sol_escaped = re.escape(str(final_solution).strip())
            target_pattern = rf"(?:kunci|nilai\s+akhir)\s*(?:adalah|=|:)\s*(?:[a-zA-Z]\s*=\s*)?{sol_escaped}\b"
            sanitized = re.sub(target_pattern, "kunci adalah [DIRAHASIAKAN]", sanitized, flags=re.IGNORECASE)

        return sanitized
