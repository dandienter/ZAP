import pytest
from fastapi.testclient import TestClient

from zapcore.api import Platform, create_app
from conftest import fake_gemini_post, fake_google_get_factory


@pytest.fixture
def client(settings, store, vault):
    platform = Platform(
        settings=settings,
        store=store,
        vault=vault,
        google_http_get=fake_google_get_factory(),
        gateway_http_post=fake_gemini_post,
    )
    return TestClient(create_app(platform))


def login(client, **extra):
    body = {"id_token": "good-token", "role": "guru", "jenjang": "S1"}
    body.update(extra)
    resp = client.post("/api/v1/auth/google", json=body)
    assert resp.status_code == 200, resp.text
    return resp.json()["token"]


def auth(token):
    return {"Authorization": f"Bearer {token}"}


def test_health_and_login_flow(client):
    assert client.get("/api/v1/system/health").json()["status"] == "ok"
    token = login(client)
    me = client.get("/api/v1/me", headers=auth(token))
    assert me.status_code == 200
    assert me.json()["role"] == "guru"
    assert me.json()["jenjang"] == "S1"
    assert client.get("/api/v1/me").status_code == 401
    bad = client.post("/api/v1/auth/google", json={"id_token": "salah"})
    assert bad.status_code == 401


def test_connector_crud_never_exposes_key(client):
    token = login(client)
    resp = client.post("/api/v1/connectors", headers=auth(token), json={
        "provider": "openai", "api_key": "sk-super-rahasia", "label": "Kantor"})
    assert resp.status_code == 200, resp.text
    assert "sk-super-rahasia" not in resp.text
    listing = client.get("/api/v1/connectors", headers=auth(token)).json()
    assert len(listing["connectors"]) == 1
    assert "sk-super-rahasia" not in str(listing)
    cid = listing["connectors"][0]["id"]
    assert client.delete(f"/api/v1/connectors/{cid}",
                         headers=auth(token)).json()["deleted"] is True
    assert client.get("/api/v1/connectors",
                      headers=auth(token)).json()["connectors"] == []


def test_verify_key_endpoint(client):
    token = login(client)
    resp = client.post("/api/v1/connectors/verify", headers=auth(token), json={
        "provider": "gemini", "api_key": "AIza-uji"})
    assert resp.status_code == 200
    assert resp.json()["valid"] is True


def test_chat_stores_encrypted_and_returns_reply(client, store):
    token = login(client)
    resp = client.post("/api/v1/chat", headers=auth(token), json={
        "message": "Halo, bantu aku memahami persamaan linear"})
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["credential"] == "platform"
    assert "langkah pertama" in body["reply"]
    msgs = client.get(
        f"/api/v1/conversations/{body['conversation_id']}/messages",
        headers=auth(token)).json()["messages"]
    assert [m["role"] for m in msgs] == ["user", "assistant"]
    assert msgs[0]["content"].startswith("Halo, bantu aku")
    raw = store.conn.execute(
        "SELECT content_ciphertext FROM messages").fetchall()
    assert all("memahami persamaan" not in r["content_ciphertext"] for r in raw)
    assert all("langkah pertama" not in r["content_ciphertext"] for r in raw)


def test_contribute_pipeline_and_knowledge_search(client):
    token = login(client)
    denied = client.post("/api/v1/contribute", headers=auth(token), json={
        "kind": "steps", "title": "Persamaan linear satu variabel",
        "text": "latihan", "steps": ["x + 2 = 5", "x = 3"]})
    assert denied.status_code == 403  # persetujuan berbagi belum aktif

    consent = client.post("/api/v1/privacy/consent", headers=auth(token),
                          json={"agree": True})
    assert consent.json()["consent_learning"] is True

    text = (
        "Selesaikan persamaan berikut dengan langkah yang setara. Perhatikan "
        "bahwa setiap langkah harus menjaga kesetaraan kedua ruas persamaan "
        "agar nilai variabel yang dicari tidak berubah."
    )
    resp = client.post("/api/v1/contribute", headers=auth(token), json={
        "kind": "steps", "title": "Persamaan linear satu variabel",
        "text": text, "steps": ["x + 2 = 5", "x = 5 - 2", "x = 3"]})
    assert resp.status_code == 200, resp.text
    assert resp.json()["pipeline"]["status"] == "published"
    assert resp.json()["pipeline"]["verified_by"] == "sympy"

    found = client.get("/api/v1/knowledge/search",
                       params={"topic": "aljabar"}, headers=auth(token))
    assert len(found.json()["items"]) == 1


def test_logout_revokes_and_delete_account(client):
    token = login(client)
    out = client.post("/api/v1/auth/logout", headers=auth(token))
    assert out.json()["logged_out"] is True
    assert client.get("/api/v1/me", headers=auth(token)).status_code == 401

    token2 = login(client)
    erased = client.delete("/api/v1/privacy/account", headers=auth(token2))
    assert erased.json()["erased"] is True
    assert client.get("/api/v1/me", headers=auth(token2)).status_code == 401
