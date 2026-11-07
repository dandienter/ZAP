"""
Kriptografi platform ZAP.

Batasan istilah yang ditegakkan di seluruh kode dan dokumentasi:

- SHA-256 adalah fungsi HASH satu arah. Dipakai untuk sidik jari
  (fingerprint) deduplikasi, pemeriksaan integritas, hash token sesi,
  dan pseudonimisasi. SHA-256 tidak pernah disebut enkripsi.
- Enkripsi isi memakai AES-256-GCM (AEAD). Isi percakapan dienkripsi
  dengan kunci turunan per pengguna; kunci API connector dienkripsi
  dengan kunci master server. Kunci tidak disimpan di basis data.
- Ini enkripsi saat tersimpan (at-rest), bukan E2EE: server memang harus
  bisa membaca pertanyaan pengguna untuk menjalankan tutor AI. Lihat
  docs/PRIVACY_POLICY.md bagian 3.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import os
import re

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

_FORMAT_VERSION = "v1"


def _b64e(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("ascii")


def _b64d(text: str) -> bytes:
    return base64.urlsafe_b64decode(text.encode("ascii"))


def sha256_hex(data: str | bytes) -> str:
    if isinstance(data, str):
        data = data.encode("utf-8")
    return hashlib.sha256(data).hexdigest()


def normalize_text(text: str) -> str:
    """Normalisasi teks untuk sidik jari: huruf kecil, spasi tunggal."""
    return re.sub(r"\s+", " ", text.strip().lower())


def fingerprint(text: str) -> str:
    """Sidik jari dedup sebuah materi = SHA-256 atas teks ternormalisasi."""
    return sha256_hex(normalize_text(text))


def pseudonym(secret: str, user_id: str) -> str:
    """Pseudonim stabil untuk analitik: HMAC-SHA256, tidak bisa dibalik."""
    return hmac.new(
        secret.encode("utf-8"), f"zap-pseudonym:{user_id}".encode("utf-8"), hashlib.sha256
    ).hexdigest()[:32]


class Vault:
    """Brankas AES-256-GCM berbasis satu kunci master 32 byte."""

    def __init__(self, master_key: bytes):
        if len(master_key) != 32:
            raise ValueError("Kunci master AES-256 harus tepat 32 byte")
        self._master = master_key

    # ----- konstruksi -----
    @classmethod
    def from_base64(cls, encoded: str) -> "Vault":
        return cls(_b64d(encoded))

    @classmethod
    def from_secret(cls, secret: str) -> "Vault":
        """Turunkan kunci dari string rahasia via SHA-256 (jalur dev/ops)."""
        return cls(hashlib.sha256(secret.encode("utf-8")).digest())

    @classmethod
    def generate(cls) -> "Vault":
        return cls(os.urandom(32))

    def master_key_b64(self) -> str:
        return _b64e(self._master)

    # ----- enkripsi simetris generik -----
    @staticmethod
    def _encrypt_with(key: bytes, plaintext: str, aad: bytes = b"") -> str:
        nonce = os.urandom(12)
        ct = AESGCM(key).encrypt(nonce, plaintext.encode("utf-8"), aad)
        return f"{_FORMAT_VERSION}:{_b64e(nonce + ct)}"

    @staticmethod
    def _decrypt_with(key: bytes, token: str, aad: bytes = b"") -> str:
        if not token.startswith(_FORMAT_VERSION + ":"):
            raise ValueError("Format ciphertext tidak dikenal")
        raw = _b64d(token.split(":", 1)[1])
        nonce, ct = raw[:12], raw[12:]
        return AESGCM(key).decrypt(nonce, ct, aad).decode("utf-8")

    # ----- kunci master (untuk rahasia operasional server, mis. API key) -----
    def encrypt(self, plaintext: str) -> str:
        return self._encrypt_with(self._master, plaintext, b"zap-master")

    def decrypt(self, token: str) -> str:
        return self._decrypt_with(self._master, token, b"zap-master")

    # ----- kunci turunan per pengguna (untuk isi percakapan) -----
    def derive_user_key(self, user_id: str) -> bytes:
        return hmac.new(
            self._master, f"zap-user-key:{user_id}".encode("utf-8"), hashlib.sha256
        ).digest()

    def encrypt_for_user(self, user_id: str, plaintext: str) -> str:
        return self._encrypt_with(
            self.derive_user_key(user_id), plaintext, f"zap-user:{user_id}".encode("utf-8")
        )

    def decrypt_for_user(self, user_id: str, token: str) -> str:
        return self._decrypt_with(
            self.derive_user_key(user_id), token, f"zap-user:{user_id}".encode("utf-8")
        )
