import pytest

from zapcore.gateway import Gateway, GatewayError


def make_gateway(settings, store, vault, post):
    return Gateway(settings, store, vault, http_post=post)


def test_platform_credential_used_by_default(settings, store, vault, user):
    gw = make_gateway(settings, store, vault, lambda u, h, p: (200, {}))
    cred = gw.resolve_credential(user["id"], "gemini")
    assert cred["source"] == "platform"
    assert cred["api_key"] == "platform-key-123"


def test_byok_preferred_over_platform(settings, store, vault, user):
    store.add_connector(user["id"], "gemini", "Pribadi",
                        vault.encrypt("kunci-pribadi"), None, None, True)
    gw = make_gateway(settings, store, vault, lambda u, h, p: (200, {}))
    cred = gw.resolve_credential(user["id"], "gemini")
    assert cred["source"] == "byok"
    assert cred["api_key"] == "kunci-pribadi"


def test_no_credential_raises(settings, store, vault, user):
    settings.gemini_api_key = None
    gw = make_gateway(settings, store, vault, lambda u, h, p: (200, {}))
    with pytest.raises(GatewayError) as exc:
        gw.resolve_credential(user["id"], "gemini")
    assert exc.value.code == "NO_CREDENTIAL"
    with pytest.raises(GatewayError):
        gw.resolve_credential(user["id"], "openai")


def test_chat_gemini_via_fake_transport(settings, store, vault, user):
    seen = {}

    def post(url, headers, payload):
        seen["url"] = url
        seen["key"] = headers.get("x-goog-api-key")
        return 200, {"candidates": [{"content": {"parts": [
            {"text": "Apa langkah pertamamu?"}]}}]}

    gw = make_gateway(settings, store, vault, post)
    out = gw.chat(user["id"], "gemini", [{"role": "user", "content": "halo"}])
    assert out["text"] == "Apa langkah pertamamu?"
    assert out["credential"] == "platform"
    assert "generativelanguage.googleapis.com" in seen["url"]
    assert seen["key"] == "platform-key-123"


def test_chat_openai_kind_via_byok(settings, store, vault, user):
    store.add_connector(user["id"], "openai", "", vault.encrypt("sk-live"),
                        None, "gpt-4o-mini", True)
    seen = {}

    def post(url, headers, payload):
        seen["url"] = url
        seen["auth"] = headers.get("Authorization")
        return 200, {"choices": [{"message": {"content": "Baik, kita mulai."}}]}

    gw = make_gateway(settings, store, vault, post)
    out = gw.chat(user["id"], "openai", [{"role": "user", "content": "halo"}],
                  system="Tutor")
    assert out["text"] == "Baik, kita mulai."
    assert out["credential"] == "byok"
    assert seen["url"] == "https://api.openai.com/v1/chat/completions"
    assert seen["auth"] == "Bearer sk-live"


def test_chat_anthropic_kind(settings, store, vault, user):
    store.add_connector(user["id"], "anthropic", "", vault.encrypt("sk-ant"),
                        None, None, True)

    def post(url, headers, payload):
        assert headers.get("x-api-key") == "sk-ant"
        return 200, {"content": [{"type": "text", "text": "Mari kita pikirkan."}]}

    gw = make_gateway(settings, store, vault, post)
    out = gw.chat(user["id"], "anthropic", [{"role": "user", "content": "halo"}])
    assert out["text"] == "Mari kita pikirkan."


def test_provider_error_surfaces(settings, store, vault, user):
    def post(url, headers, payload):
        return 429, {"error": {"message": "Kuota habis"}}

    gw = make_gateway(settings, store, vault, post)
    with pytest.raises(GatewayError) as exc:
        gw.chat(user["id"], "gemini", [{"role": "user", "content": "halo"}])
    assert "Kuota habis" in str(exc.value)


def test_guardrail_applied_when_solution_known(settings, store, vault, user):
    def post(url, headers, payload):
        return 200, {"candidates": [{"content": {"parts": [
            {"text": "Jadi, nilai x = 3. Selesai."}]}}]}

    gw = make_gateway(settings, store, vault, post)
    out = gw.chat(user["id"], "gemini", [{"role": "user", "content": "berapa x?"}],
                  guardrail_solution="3")
    assert "nilai x = 3" not in out["text"]
    assert out["text"] != "Jadi, nilai x = 3. Selesai."


def test_verify_key(settings, store, vault, user):
    def ok_post(url, headers, payload):
        return 200, {"candidates": [{"content": {"parts": [{"text": "OK"}]}}]}

    def bad_post(url, headers, payload):
        return 400, {"error": {"message": "API key not valid"}}

    gw_ok = make_gateway(settings, store, vault, ok_post)
    assert gw_ok.verify_key("gemini", "AIza-apa-saja")["valid"] is True
    gw_bad = make_gateway(settings, store, vault, bad_post)
    result = gw_bad.verify_key("gemini", "AIza-salah")
    assert result["valid"] is False
    assert "API key not valid" in result["error"]
