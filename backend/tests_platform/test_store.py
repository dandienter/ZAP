from zapcore.crypto import sha256_hex


def test_upsert_user_create_then_update(store):
    u1 = store.upsert_user_from_google("sub-9", "a@b.id", "Nama Awal", None)
    u2 = store.upsert_user_from_google("sub-9", "a@b.id", "Nama Baru", "http://x/y.png")
    assert u1["id"] == u2["id"]
    assert u2["name"] == "Nama Baru"
    assert u2["avatar"] == "http://x/y.png"


def test_connector_defaults_and_listing_hides_key(store, user, vault):
    c1 = store.add_connector(user["id"], "openai", "Pertama",
                             vault.encrypt("sk-1"), None, None, True)
    c2 = store.add_connector(user["id"], "openai", "Kedua",
                             vault.encrypt("sk-2"), None, None, True)
    default = store.get_default_connector(user["id"], "openai")
    assert default["id"] == c2["id"]
    listing = store.list_connectors(user["id"])
    assert len(listing) == 2
    assert all("key_ciphertext" not in row for row in listing)
    assert vault.decrypt(default["key_ciphertext"]) == "sk-2"
    assert store.delete_connector(c1["id"], user["id"]) is True
    assert store.delete_connector(c1["id"], "pengguna-lain") is False


def test_conversation_messages_encrypted_shape(store, user, vault):
    conv = store.create_conversation(user["id"], "Belajar aljabar")
    ct = vault.encrypt_for_user(user["id"], "x + 2 = 5")
    store.add_message(conv["id"], "user", ct, sha256_hex("x + 2 = 5"))
    msgs = store.list_messages(conv["id"])
    assert len(msgs) == 1
    assert "x + 2 = 5" not in msgs[0]["content_ciphertext"]
    assert vault.decrypt_for_user(user["id"], msgs[0]["content_ciphertext"]) == "x + 2 = 5"
    assert msgs[0]["content_sha256"] == sha256_hex("x + 2 = 5")


def test_delete_user_cascade(store, user, vault):
    conv = store.create_conversation(user["id"], "Hapus aku")
    store.add_message(conv["id"], "user",
                      vault.encrypt_for_user(user["id"], "isi"), sha256_hex("isi"))
    store.add_connector(user["id"], "gemini", "", vault.encrypt("k"), None, None, True)
    store.delete_user_cascade(user["id"])
    assert store.get_user(user["id"]) is None
    assert store.list_conversations(user["id"]) == []
    assert store.list_connectors(user["id"]) == []
    count = store.conn.execute("SELECT COUNT(*) c FROM messages").fetchone()["c"]
    assert count == 0
