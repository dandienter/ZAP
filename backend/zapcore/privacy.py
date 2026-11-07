"""
Mesin privasi platform ZAP: persetujuan, retensi, ekspor, penghapusan.

Aturan yang ditegakkan di kode (bukan hanya di dokumen):

- Kontribusi ke basis pengetahuan hanya diproses bila persetujuan
  berbagi pengguna aktif DAN materi dikirim eksplisit (lihat learning.py
  yang memanggil require_share_consent di sini).
- Isi chat privat tidak pernah dibaca modul pembelajaran; modul ini yang
  menyediakan satu-satunya jembatan resmi antar domain data.
- Ekspor dan penghapusan akun mencakup seluruh tabel milik pengguna.
"""

from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone

from .crypto import pseudonym

DATA_CLASSES = ("private_chat", "contribution", "account", "telemetry")
CURRENT_CONSENT_VERSION = "2026-11-07"


class PrivacyError(Exception):
    def __init__(self, message: str, status: int = 403):
        super().__init__(message)
        self.status = status


def set_share_consent(store, user_id: str, agree: bool) -> dict:
    user = store.update_profile(
        user_id,
        consent_learning=1 if agree else 0,
        consent_version=CURRENT_CONSENT_VERSION if agree else None,
    )
    store.audit(user_id, "consent.share_on" if agree else "consent.share_off")
    return user


def require_share_consent(user: dict) -> None:
    if not user or not user.get("consent_learning"):
        raise PrivacyError(
            "Persetujuan berbagi belum aktif. Nyalakan persetujuan berbagi di"
            " profil untuk mengirim materi ke basis pengetahuan ZAP."
        )


def run_retention_sweep(store, retention_days: int, now: datetime | None = None) -> dict:
    """Hapus percakapan yang tidak aktif melewati masa simpan."""
    now = now or datetime.now(timezone.utc)
    cutoff = (now - timedelta(days=retention_days)).isoformat()
    stale = store.conversations_older_than(cutoff)
    for cid in stale:
        store.delete_conversation(cid)
    if stale:
        store.audit("system", "retention.sweep", meta={"deleted": len(stale)})
    return {"deleted_conversations": len(stale), "cutoff": cutoff}


def export_user_data(store, vault, user_id: str, jwt_secret: str) -> dict:
    """Susun seluruh data milik pengguna dalam satu berkas JSON."""
    user = store.get_user(user_id)
    if user is None:
        raise PrivacyError("Pengguna tidak ditemukan", 404)
    conversations = []
    for conv in store.list_conversations(user_id):
        messages = []
        for msg in store.list_messages(conv["id"]):
            messages.append({
                "role": msg["role"],
                "content": vault.decrypt_for_user(user_id, msg["content_ciphertext"]),
                "sha256": msg["content_sha256"],
                "created_at": msg["created_at"],
            })
        conversations.append({
            "id": conv["id"], "title": conv["title"],
            "created_at": conv["created_at"], "updated_at": conv["updated_at"],
            "messages": messages,
        })
    contributions = []
    for item in store.list_contributions(user_id):
        full = store.get_contribution(item["id"])
        contributions.append({
            "id": item["id"], "kind": item["kind"], "title": item["title"],
            "status": item["status"], "topic": item["topic"],
            "jenjang": item["jenjang"], "quality_score": item["quality_score"],
            "verified_by": item["verified_by"],
            "payload": vault.decrypt(full["payload_ciphertext"]),
            "created_at": item["created_at"],
        })
    return {
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "pseudonym": pseudonym(jwt_secret, user_id),
        "profile": {
            "email": user["email"], "name": user["name"], "role": user["role"],
            "jenjang": user["jenjang"],
            "consent_learning": bool(user["consent_learning"]),
            "consent_version": user["consent_version"],
            "created_at": user["created_at"],
        },
        "connectors": store.list_connectors(user_id),  # tanpa kunci, hanya metadata
        "conversations": conversations,
        "contributions": contributions,
    }


def erase_user(store, user_id: str, jwt_secret: str) -> dict:
    """Hapus akun dan seluruh datanya secara permanen (hak penghapusan)."""
    user = store.get_user(user_id)
    if user is None:
        raise PrivacyError("Pengguna tidak ditemukan", 404)
    anon = pseudonym(jwt_secret, user_id)
    store.delete_user_cascade(user_id)
    # Jejak audit disimpan sebagai pseudonim, tanpa identitas pribadi.
    store.audit(anon, "account.erased", meta={"pseudonym": anon})
    return {"erased": True, "pseudonym": anon}
