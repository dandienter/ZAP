"""
Pipa self-learning ZAP: basis pengetahuan yang tumbuh terkurasi.

Alur satu kontribusi (docs/DATA_AND_LEARNING_POLICY.md):

    received -> screened -> verified -> published
                     +-> rejected / held (dengan alasan tercatat)

- Hanya kontribusi eksplisit dari pengguna yang persetujuan berbaginya
  aktif. Chat privat tidak pernah masuk pipa ini.
- Deduplikasi memakai sidik jari SHA-256 atas materi ternormalisasi.
- Verifikasi langkah matematika memakai mesin deterministik CFL/SymPy
  yang sudah ada (isolate_first_fault_breakpoint). Status
  "ALL_STEPS_VALID" adalah satu-satunya jalan menuju label
  verified_by = "sympy".
- Materi lain dinilai kurator LLM lewat gateway dan dilabeli jujur
  sebagai kurasi LLM, tidak pernah sebagai verifikasi deterministik.
"""

from __future__ import annotations

import json
import re

from .crypto import fingerprint
from .privacy import require_share_consent

TOPICS: dict[str, list[str]] = {
    "aljabar": ["persamaan", "aljabar", "variabel", "kuadrat", "linear",
                "polinomial", "faktorisasi", "spldv", "spltv", "pertidaksamaan"],
    "geometri": ["segitiga", "lingkaran", "bangun ruang", "sudut", "luas",
                 "volume", "kubus", "balok", "tabung", "kerucut", "bola",
                 "pythagoras", "geometri"],
    "kalkulus": ["limit", "turunan", "integral", "diferensial", "kalkulus"],
    "trigonometri": ["trigonometri", "sinus", "cosinus", "tangen", "sin ", "cos ", "tan "],
    "statistika": ["rata-rata", "median", "modus", "statistika", "diagram batang"],
    "peluang": ["peluang", "probabilitas", "dadu", "permutasi", "kombinasi", "faktorial"],
    "aritmatika": ["aritmatika", "pecahan", "persen", "fpb", "kpk", "bilangan bulat"],
    "matriks": ["matriks", "determinan", "invers"],
    "vektor": ["vektor", "resultan"],
    "logaritma": ["logaritma", "eksponen", "pangkat"],
    "fungsi": ["fungsi", "domain", "kodomain", "grafik"],
    "barisan": ["barisan", "deret", "suku ke"],
}

_EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+\.[\w.]+")
_PHONE_RE = re.compile(r"(?:\+62|0)8\d{7,11}")
_NIK_RE = re.compile(r"\b\d{16}\b")

KINDS = ("steps", "qa", "material")


def classify_topic(text: str) -> tuple[str, list[str]]:
    """Klasifikasi topik berbasis kata kunci. Mengembalikan (topik, kata cocok)."""
    lowered = " " + text.lower() + " "
    best_topic, best_hits = "umum", []
    for topic, keywords in TOPICS.items():
        hits = [kw for kw in keywords if kw in lowered]
        if len(hits) > len(best_hits):
            best_topic, best_hits = topic, hits
    return best_topic, best_hits


def infer_jenjang(topic: str, stated: str | None, user_jenjang: str | None) -> str:
    if stated and stated != "-":
        return stated
    if topic in ("kalkulus", "matriks", "vektor"):
        return "SMA"
    if topic in ("trigonometri", "logaritma", "fungsi", "barisan"):
        return "SMA"
    if topic in ("aljabar", "geometri", "peluang"):
        return "SMP"
    if topic in ("aritmatika", "statistika"):
        return "SD"
    return user_jenjang if user_jenjang and user_jenjang != "-" else "SMP"


def _payload_text(payload: dict) -> str:
    parts = [payload.get("text", "")]
    steps = payload.get("steps") or []
    if steps:
        parts.append("\n".join(steps))
    return "\n".join(p for p in parts if p).strip()


def _quality_heuristic(payload: dict) -> float:
    text = _payload_text(payload)
    score = 0.3
    if len(text) >= 60:
        score += 0.1
    if len(text) >= 200:
        score += 0.2
    steps = payload.get("steps") or []
    if len(steps) >= 2:
        score += 0.25
    if len(payload.get("title", "")) >= 8:
        score += 0.15
    return min(score, 1.0)


class LearningPipeline:
    def __init__(self, store, vault, settings, gateway=None):
        self.store = store
        self.vault = vault
        self.settings = settings
        self.gateway = gateway

    # ---------------- intake ----------------
    def submit(self, user: dict, kind: str, title: str, payload: dict,
               jenjang: str | None = None) -> dict:
        require_share_consent(user)
        if kind not in KINDS:
            raise ValueError(f"Jenis kontribusi tidak dikenal: {kind}")
        payload = dict(payload)
        payload.setdefault("title", title)
        full_text = title + "\n" + _payload_text(payload)
        fp = fingerprint(full_text)
        existing = self.store.get_contribution_by_fingerprint(fp)
        if existing is not None:
            return {"duplicate": True, "contribution_id": existing["id"],
                    "status": existing["status"]}
        item = self.store.add_contribution(
            user_id=user["id"], kind=kind, title=title,
            payload_ciphertext=self.vault.encrypt(json.dumps(payload)),
            fp=fp, jenjang=jenjang)
        self.store.audit(user["id"], "contribution.submitted", item["id"],
                         {"kind": kind})
        return {"duplicate": False, "contribution_id": item["id"], "status": "received"}

    # ---------------- stages ----------------
    def _load(self, contribution_id: str) -> tuple[dict, dict, list]:
        item = self.store.get_contribution(contribution_id)
        if item is None:
            raise ValueError("Kontribusi tidak ditemukan")
        payload = json.loads(self.vault.decrypt(item["payload_ciphertext"]))
        notes = json.loads(item["screen_notes"] or "[]")
        return item, payload, notes

    def _save_notes(self, contribution_id: str, notes: list) -> None:
        self.store.update_contribution(
            contribution_id, screen_notes=json.dumps(notes))

    def screen(self, contribution_id: str) -> dict:
        item, payload, notes = self._load(contribution_id)
        text = _payload_text(payload)
        if _NIK_RE.search(text):
            notes.append({"stage": "screen", "result": "rejected",
                          "reason": "Memuat pola nomor identitas 16 digit"})
            self._save_notes(contribution_id, notes)
            return self.store.update_contribution(contribution_id, status="rejected")
        redacted = _EMAIL_RE.sub("[email disembunyikan]", text)
        redacted = _PHONE_RE.sub("[telepon disembunyikan]", redacted)
        if redacted != text:
            notes.append({"stage": "screen", "result": "redacted",
                          "reason": "Email/nomor telepon diredaksi otomatis"})
            if payload.get("steps"):
                payload["steps"] = [
                    _PHONE_RE.sub("[telepon disembunyikan]",
                                  _EMAIL_RE.sub("[email disembunyikan]", s))
                    for s in payload["steps"]
                ]
            payload["text"] = _PHONE_RE.sub(
                "[telepon disembunyikan]",
                _EMAIL_RE.sub("[email disembunyikan]", payload.get("text", "")))
            self.store.update_contribution(
                contribution_id,
                payload_ciphertext=self.vault.encrypt(json.dumps(payload)))
        score = _quality_heuristic(payload)
        notes.append({"stage": "screen", "result": "ok", "quality_heuristic": score})
        self._save_notes(contribution_id, notes)
        return self.store.update_contribution(
            contribution_id, status="screened", quality_score=score)

    def verify(self, contribution_id: str) -> dict:
        item, payload, notes = self._load(contribution_id)
        steps = payload.get("steps") or []
        if item["kind"] == "steps" and len(steps) >= 2:
            from cfl import isolate_first_fault_breakpoint

            target_var = payload.get("target_var") or payload.get("target_variable") or "x"
            _, info = isolate_first_fault_breakpoint(steps, target_var)
            if info.get("status") == "ALL_STEPS_VALID":
                notes.append({"stage": "verify", "by": "sympy",
                              "result": "ALL_STEPS_VALID"})
                self._save_notes(contribution_id, notes)
                return self.store.update_contribution(
                    contribution_id, status="verified", verified_by="sympy")
            notes.append({"stage": "verify", "by": "sympy",
                          "result": info.get("status", "FAULT"),
                          "detail": info.get("message", "")})
            self._save_notes(contribution_id, notes)
            return self.store.update_contribution(contribution_id, status="held")
        notes.append({"stage": "verify", "by": "none",
                      "result": "not_step_based",
                      "reason": "Materi bukan rantai langkah; menunggu kurasi"})
        self._save_notes(contribution_id, notes)
        return item

    def curate(self, contribution_id: str, user_id: str) -> dict:
        item, payload, notes = self._load(contribution_id)
        text = _payload_text(payload)
        topic, hits = classify_topic(item["title"] + "\n" + text)
        jenjang = infer_jenjang(topic, item.get("jenjang"),
                                self.store.get_user(item["user_id"]).get("jenjang"))
        updates: dict = {"topic": topic, "jenjang": jenjang}
        if self.gateway is not None:
            prompt = (
                "Nilai materi belajar berikut untuk basis pengetahuan sekolah. "
                "Balas HANYA JSON: {\"quality\": 0..1, \"appropriate\": true/false}. "
                "quality menilai kejelasan, kebenaran umum, dan manfaat belajar.\n\n"
                + text[:2000]
            )
            try:
                result = self.gateway.chat(
                    user_id, "gemini",
                    [{"role": "user", "content": prompt}], system=None)
                raw = result["text"]
                match = re.search(r"\{.*\}", raw, re.DOTALL)
                judged = json.loads(match.group(0)) if match else {}
                q = float(judged.get("quality", 0))
                if judged.get("appropriate", True) and q > 0:
                    blended = round(0.5 * (item["quality_score"] or 0) + 0.5 * q, 3)
                    updates["quality_score"] = blended
                    notes.append({"stage": "curation", "by": "llm",
                                  "score": q, "blended": blended})
                else:
                    notes.append({"stage": "curation", "by": "llm",
                                  "score": q, "result": "below_threshold"})
            except Exception as err:  # kurasi LLM gagal tidak menggagalkan pipa
                notes.append({"stage": "curation", "by": "llm",
                              "result": "error", "detail": str(err)[:200]})
        self._save_notes(contribution_id, notes)
        return self.store.update_contribution(contribution_id, **updates)

    def publish(self, contribution_id: str) -> dict:
        item, payload, notes = self._load(contribution_id)
        quality = item["quality_score"] or 0.0
        llm_ok = any(
            n.get("stage") == "curation" and n.get("by") == "llm"
            and float(n.get("score", 0)) >= self.settings.llm_curation_min_score
            for n in notes)
        sympy_ok = item.get("verified_by") == "sympy"
        reasons = []
        if quality < self.settings.publish_min_quality:
            reasons.append(
                f"Skor kualitas {quality:.2f} di bawah ambang "
                f"{self.settings.publish_min_quality:.2f}")
        if not (sympy_ok or llm_ok):
            reasons.append("Belum terverifikasi SymPy dan belum lolos kurasi LLM")
        if reasons:
            notes.append({"stage": "publish", "result": "held", "reasons": reasons})
            self._save_notes(contribution_id, notes)
            return self.store.update_contribution(contribution_id, status="held")
        content = _payload_text(payload)
        kb = self.store.add_knowledge(
            contribution_id=contribution_id, title=item["title"],
            topic=item["topic"] or "umum", jenjang=item["jenjang"] or "SMP",
            content=content,
            tags=",".join(classify_topic(item["title"] + "\n" + content)[1]),
            quality_score=quality,
            verified_by=item["verified_by"] or "llm")
        notes.append({"stage": "publish", "result": "published", "kb_id": kb["id"]})
        self._save_notes(contribution_id, notes)
        updated = self.store.update_contribution(
            contribution_id, status="published", kb_id=kb["id"])
        self.store.audit("system", "knowledge.published", kb["id"],
                         {"contribution": contribution_id})
        return updated

    # ---------------- orkestrasi ----------------
    def run_pipeline(self, contribution_id: str, user_id: str) -> dict:
        item = self.store.get_contribution(contribution_id)
        if item is None:
            raise ValueError("Kontribusi tidak ditemukan")
        if item["status"] == "rejected":
            return self._report(item)
        self.screen(contribution_id)
        item = self.store.get_contribution(contribution_id)
        if item["status"] == "rejected":
            return self._report(item)
        self.verify(contribution_id)
        self.curate(contribution_id, user_id)
        self.publish(contribution_id)
        return self._report(self.store.get_contribution(contribution_id))

    def _report(self, item: dict) -> dict:
        return {
            "contribution_id": item["id"],
            "status": item["status"],
            "topic": item["topic"],
            "jenjang": item["jenjang"],
            "quality_score": item["quality_score"],
            "verified_by": item["verified_by"],
            "kb_id": item["kb_id"],
            "notes": json.loads(item["screen_notes"] or "[]"),
        }

    # ---------------- pemakaian kembali ----------------
    def retrieve_for_tutor(self, query: str = "", jenjang: str | None = None,
                           topic: str | None = None, limit: int = 5) -> list[dict]:
        return self.store.search_knowledge(
            query=query, jenjang=jenjang, topic=topic, limit=limit)
