from datetime import datetime, timezone

from zapcore.crypto import sha256_hex
from zapcore.privacy import erase_user, export_user_data, run_retention_sweep


def seed_chat(store, vault, user, text="isi pesan rahasia"):
    conv = store.create_conversation(user["id"], "Rahasia")
    store.add_message(conv["id"], "user",
                      vault.encrypt_for_user(user["id"], text), sha256_hex(text))
    return conv


def test_export_returns_own_decrypted_data(store, vault, user, settings):
    seed_chat(store, vault, user)
    store.add_connector(user["id"], "openai", "Kantor",
                        vault.encrypt("sk-rahasia"), None, None, True)
    data = export_user_data(store, vault, user["id"], settings.jwt_secret)
    assert data["profile"]["email"] == "guru@example.id"
    msgs = data["conversations"][0]["messages"]
    assert msgs[0]["content"] == "isi pesan rahasia"
    # Ekspor tidak pernah membocorkan kunci connector.
    assert "sk-rahasia" not in str(data)
    assert "key_ciphertext" not in str(data["connectors"])


def test_erase_removes_everything(store, vault, user, settings):
    seed_chat(store, vault, user)
    result = erase_user(store, user["id"], settings.jwt_secret)
    assert result["erased"] is True
    assert store.get_user(user["id"]) is None
    assert store.list_conversations(user["id"]) == []
    remaining = store.conn.execute("SELECT COUNT(*) c FROM messages").fetchone()["c"]
    assert remaining == 0


def test_retention_sweep_deletes_stale_only(store, vault, user):
    old = seed_chat(store, vault, user, "pesan lama")
    fresh = store.create_conversation(user["id"], "Percakapan segar")
    store.conn.execute(
        "UPDATE conversations SET updated_at = '2020-01-01T00:00:00+00:00' WHERE id = ?",
        (old["id"],))
    store.conn.commit()
    result = run_retention_sweep(
        store, 365, now=datetime(2026, 11, 7, tzinfo=timezone.utc))
    assert result["deleted_conversations"] == 1
    remaining = [c["id"] for c in store.list_conversations(user["id"])]
    assert remaining == [fresh["id"]]
