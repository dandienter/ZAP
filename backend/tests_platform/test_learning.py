import pytest

from zapcore.learning import LearningPipeline, classify_topic
from zapcore.privacy import PrivacyError, set_share_consent

VALID_STEPS_TEXT = (
    "Selesaikan persamaan berikut dengan langkah yang setara. Perhatikan "
    "bahwa setiap langkah harus menjaga kesetaraan kedua ruas persamaan "
    "agar nilai variabel yang dicari tidak berubah."
)
VALID_STEPS = ["x + 2 = 5", "x = 5 - 2", "x = 3"]


class StubGateway:
    """Kurator LLM tiruan: selalu memberi skor tinggi."""

    def chat(self, user_id, provider, messages, system=None, **kw):
        return {"text": '{"quality": 0.92, "appropriate": true}',
                "provider": provider, "model": "stub", "credential": "platform"}


def consenting_user(store, user):
    return set_share_consent(store, user["id"], True)


def test_submit_requires_consent(settings, store, vault, user):
    pipe = LearningPipeline(store, vault, settings)
    with pytest.raises(PrivacyError):
        pipe.submit(user, "material", "Judul materi",
                    {"text": "isi materi", "steps": []})


def test_valid_steps_published_via_sympy(settings, store, vault, user):
    user = consenting_user(store, user)
    pipe = LearningPipeline(store, vault, settings)
    sub = pipe.submit(user, "steps", "Persamaan linear satu variabel",
                      {"text": VALID_STEPS_TEXT, "steps": VALID_STEPS})
    assert sub["duplicate"] is False
    report = pipe.run_pipeline(sub["contribution_id"], user["id"])
    assert report["status"] == "published"
    assert report["verified_by"] == "sympy"
    assert report["topic"] == "aljabar"
    found = pipe.retrieve_for_tutor(query="persamaan", topic="aljabar")
    assert len(found) == 1
    assert found[0]["verified_by"] == "sympy"


def test_duplicate_submission_rejected(settings, store, vault, user):
    user = consenting_user(store, user)
    pipe = LearningPipeline(store, vault, settings)
    payload = {"text": VALID_STEPS_TEXT, "steps": VALID_STEPS}
    first = pipe.submit(user, "steps", "Persamaan linear satu variabel", payload)
    second = pipe.submit(user, "steps", "Persamaan linear satu variabel", payload)
    assert first["duplicate"] is False
    assert second["duplicate"] is True
    assert second["contribution_id"] == first["contribution_id"]


def test_faulty_steps_are_held_not_published(settings, store, vault, user):
    user = consenting_user(store, user)
    pipe = LearningPipeline(store, vault, settings)
    sub = pipe.submit(user, "steps", "Persamaan dengan langkah keliru",
                      {"text": VALID_STEPS_TEXT,
                       "steps": ["x + 2 = 5", "x = 99"]})
    report = pipe.run_pipeline(sub["contribution_id"], user["id"])
    assert report["status"] == "held"
    assert report["verified_by"] is None
    assert pipe.retrieve_for_tutor(query="keliru") == []


def test_nik_rejected_and_email_redacted(settings, store, vault, user):
    user = consenting_user(store, user)
    pipe = LearningPipeline(store, vault, settings)
    nik = pipe.submit(user, "material", "Materi berisi identitas",
                      {"text": "Nomor peserta 3201234567890123 untuk bahan "
                               "latihan statistika kelas.", "steps": []})
    report = pipe.run_pipeline(nik["contribution_id"], user["id"])
    assert report["status"] == "rejected"

    ok = pipe.submit(user, "steps", "Persamaan linear lanjutan",
                     {"text": VALID_STEPS_TEXT +
                              " Hubungi budi@example.com bila bingung.",
                      "steps": VALID_STEPS})
    report2 = pipe.run_pipeline(ok["contribution_id"], user["id"])
    assert report2["status"] == "published"
    kb = store.search_knowledge(query="Persamaan linear lanjutan")
    assert len(kb) == 1
    assert "budi@example.com" not in kb[0]["content"]
    assert "[email disembunyikan]" in kb[0]["content"]


def test_material_needs_llm_curation_to_publish(settings, store, vault, user):
    user = consenting_user(store, user)
    text = (
        "Segitiga siku-siku dan teorema Pythagoras. Pada segitiga siku-siku, "
        "kuadrat sisi miring sama dengan jumlah kuadrat kedua sisi lainnya. "
        "Materi ini dipakai untuk menghitung panjang sisi segitiga, jarak "
        "dua titik, dan berbagai soal bangun ruang sederhana di kelas."
    )
    # Tanpa kurator LLM: materi non-langkah tidak bisa terbit.
    pipe_plain = LearningPipeline(store, vault, settings)
    sub = pipe_plain.submit(user, "material", "Teorema Pythagoras segitiga",
                            {"text": text, "steps": []})
    report = pipe_plain.run_pipeline(sub["contribution_id"], user["id"])
    assert report["status"] == "held"
    assert report["topic"] == "geometri"

    # Dengan kurator LLM yang memberi skor tinggi: terbit, berlabel llm.
    pipe_llm = LearningPipeline(store, vault, settings, gateway=StubGateway())
    sub2 = pipe_llm.submit(user, "material", "Pythagoras untuk jarak titik",
                           {"text": text + " Contoh jarak antar titik dibahas juga.",
                            "steps": []})
    report2 = pipe_llm.run_pipeline(sub2["contribution_id"], user["id"])
    assert report2["status"] == "published"
    kb = store.search_knowledge(topic="geometri")
    assert kb and kb[0]["verified_by"] == "llm"


def test_classify_topic_keywords():
    assert classify_topic("menghitung limit fungsi dan turunan")[0] == "kalkulus"
    assert classify_topic("peluang munculnya dadu dan permutasi")[0] == "peluang"
    assert classify_topic("halo apa kabar")[0] == "umum"
