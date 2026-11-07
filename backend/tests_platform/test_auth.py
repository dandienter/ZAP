import time

import pytest

from zapcore.auth import (
    AuthError,
    create_session_token,
    parse_session_token,
    validate_jenjang,
    validate_role,
    verify_google_id_token,
)
from conftest import fake_google_get_factory


def test_verify_google_ok():
    profile = verify_google_id_token(
        "good-token", "test-client-id", http_get=fake_google_get_factory()
    )
    assert profile["email"] == "guru@example.id"
    assert profile["sub"] == "sub-1"


def test_verify_google_rejects_bad_token():
    with pytest.raises(AuthError):
        verify_google_id_token(
            "token-ngawur", "test-client-id", http_get=fake_google_get_factory()
        )


def test_verify_google_rejects_wrong_audience():
    def getter(url, params):
        return 200, {
            "aud": "client-lain",
            "iss": "https://accounts.google.com",
            "exp": str(int(time.time()) + 600),
            "email_verified": "true",
            "sub": "x",
            "email": "x@y.id",
        }

    with pytest.raises(AuthError):
        verify_google_id_token("t", "test-client-id", http_get=getter)


def test_verify_google_rejects_expired_and_unverified():
    def expired(url, params):
        return 200, {
            "aud": "test-client-id",
            "iss": "https://accounts.google.com",
            "exp": str(int(time.time()) - 10),
            "email_verified": "true",
            "sub": "x",
            "email": "x@y.id",
        }

    with pytest.raises(AuthError):
        verify_google_id_token("t", "test-client-id", http_get=expired)


def test_session_token_roundtrip(user):
    token, jti, _ = create_session_token("secret", user, session_days=1)
    payload = parse_session_token("secret", token)
    assert payload["sub"] == user["id"]
    assert payload["jti"] == jti
    assert payload["email"] == "guru@example.id"


def test_session_token_tampered_and_expired(user):
    token, _, _ = create_session_token("secret", user, session_days=1)
    with pytest.raises(AuthError):
        parse_session_token("secret-lain", token)
    stale, _, _ = create_session_token("secret", user, session_days=-1)
    with pytest.raises(AuthError):
        parse_session_token("secret", stale)


def test_role_and_jenjang_validation():
    assert validate_role("dosen") == "dosen"
    assert validate_role("presiden") == "umum"
    assert validate_jenjang("S3") == "S3"
    assert validate_jenjang("TK") == "-"
