import pytest
from cryptography.exceptions import InvalidTag

from zapcore.crypto import Vault, fingerprint, pseudonym, sha256_hex


def test_sha256_known_vector():
    # Vektor uji baku SHA-256 untuk string "abc".
    assert sha256_hex("abc") == (
        "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    )


def test_fingerprint_normalizes_case_and_whitespace():
    assert fingerprint("Persamaan  Linear\nSatu Variabel") == fingerprint(
        "persamaan linear satu variabel"
    )
    assert fingerprint("abc") != fingerprint("abd")


def test_master_vault_roundtrip():
    vault = Vault.from_secret("rahasia-uji")
    token = vault.encrypt("AIza-contoh-kunci")
    assert token.startswith("v1:")
    assert "AIza-contoh-kunci" not in token
    assert vault.decrypt(token) == "AIza-contoh-kunci"


def test_user_vault_isolation():
    vault = Vault.from_secret("rahasia-uji")
    token = vault.encrypt_for_user("user-a", "isi chat rahasia")
    assert vault.decrypt_for_user("user-a", token) == "isi chat rahasia"
    with pytest.raises(InvalidTag):
        vault.decrypt_for_user("user-b", token)


def test_vault_wrong_master_fails():
    token = Vault.from_secret("satu").encrypt("data")
    with pytest.raises(InvalidTag):
        Vault.from_secret("dua").decrypt(token)


def test_pseudonym_stable_and_distinct():
    assert pseudonym("s", "u1") == pseudonym("s", "u1")
    assert pseudonym("s", "u1") != pseudonym("s", "u2")
    assert len(pseudonym("s", "u1")) == 32
