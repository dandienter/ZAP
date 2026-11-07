"""
Konfigurasi layanan platform ZAP.

Semua rahasia dibaca dari variabel lingkungan dan tidak pernah ditulis
ke basis data atau dikirim ke klien:

- ZAP_JWT_SECRET      : rahasia penanda tangan sesi JWT (HS256).
- ZAP_MASTER_KEY      : kunci master AES-256-GCM dalam base64 (32 byte).
                        Alternatif pengembangan: ZAP_MASTER_SECRET, string
                        bebas yang di-hash SHA-256 menjadi kunci.
- ZAP_GOOGLE_CLIENT_ID: client ID OAuth Google untuk verifikasi ID token.
- ZAP_GEMINI_API_KEY  : kunci Gemini milik platform (jalur bawaan).
- ZAP_DB_PATH         : lokasi berkas SQLite (bawaan zap_platform.db).
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache


@dataclass
class Settings:
    db_path: str = "zap_platform.db"
    jwt_secret: str = "dev-insecure-secret-change-me"
    master_key_b64: str | None = None
    master_secret: str | None = None
    google_client_id: str = ""
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-2.0-flash"
    session_days: int = 7
    retention_days: int = 365
    publish_min_quality: float = 0.6
    llm_curation_min_score: float = 0.7

    @property
    def is_production_ready(self) -> bool:
        """True bila rahasia bawaan pengembangan sudah diganti."""
        return (
            self.jwt_secret != "dev-insecure-secret-change-me"
            and (self.master_key_b64 is not None or self.master_secret is not None)
            and bool(self.google_client_id)
        )


def settings_from_env() -> Settings:
    return Settings(
        db_path=os.environ.get("ZAP_DB_PATH", "zap_platform.db"),
        jwt_secret=os.environ.get("ZAP_JWT_SECRET", "dev-insecure-secret-change-me"),
        master_key_b64=os.environ.get("ZAP_MASTER_KEY") or None,
        master_secret=os.environ.get("ZAP_MASTER_SECRET") or None,
        google_client_id=os.environ.get("ZAP_GOOGLE_CLIENT_ID", ""),
        gemini_api_key=os.environ.get("ZAP_GEMINI_API_KEY") or None,
        gemini_model=os.environ.get("ZAP_GEMINI_MODEL", "gemini-2.0-flash"),
        session_days=int(os.environ.get("ZAP_SESSION_DAYS", "7")),
        retention_days=int(os.environ.get("ZAP_RETENTION_DAYS", "365")),
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return settings_from_env()
