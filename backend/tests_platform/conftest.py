import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest

from zapcore.config import Settings
from zapcore.crypto import Vault
from zapcore.store import Store


@pytest.fixture
def settings():
    return Settings(
        db_path=":memory:",
        jwt_secret="test-secret",
        google_client_id="test-client-id",
        gemini_api_key="platform-key-123",
        master_secret="test-master",
    )


@pytest.fixture
def store():
    s = Store(":memory:")
    yield s
    s.close()


@pytest.fixture
def vault():
    return Vault.from_secret("test-master")


@pytest.fixture
def user(store):
    return store.upsert_user_from_google("sub-1", "guru@example.id", "Bu Guru", None)


def fake_google_get_factory(valid_token="good-token", client_id="test-client-id"):
    def _get(url, params):
        if params.get("id_token") != valid_token:
            return 400, {}
        import time

        return 200, {
            "aud": client_id,
            "iss": "https://accounts.google.com",
            "exp": str(int(time.time()) + 3600),
            "email_verified": "true",
            "sub": "sub-1",
            "email": "guru@example.id",
            "name": "Bu Guru",
            "picture": None,
        }

    return _get


def fake_gemini_post(url, headers, payload):
    """Transport tiruan berbentuk respons Gemini. Juga menjawab kurasi."""
    text = ""
    contents = payload.get("contents") or []
    if contents:
        text = contents[0]["parts"][0]["text"]
    if "Nilai materi belajar" in text:
        reply = '{"quality": 0.92, "appropriate": true}'
    else:
        reply = "Pertanyaan bagus. Menurutmu, langkah pertama apa yang masuk akal?"
    return 200, {"candidates": [{"content": {"parts": [{"text": reply}]}}]}
