"""
ZAP Math Database & Storage Engine
Stores mathematical corpus in SQLite and JSONL with indexed querying capabilities.
"""

import os
import json
import sqlite3
from typing import List, Dict, Any, Optional

DEFAULT_DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "zap_math_corpus.db")
DEFAULT_JSONL_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "zap_math_corpus.jsonl")

class MathCorpusStore:
    def __init__(self, db_path: str = DEFAULT_DB_PATH, jsonl_path: str = DEFAULT_JSONL_PATH):
        self.db_path = db_path
        self.jsonl_path = jsonl_path
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        """Koneksi SQLite berkinerja tinggi: WAL mode, synchronous NORMAL, dan timeout 5000ms."""
        conn = sqlite3.connect(self.db_path, timeout=5.0)
        conn.execute("PRAGMA journal_mode = WAL")
        conn.execute("PRAGMA synchronous = NORMAL")
        conn.execute("PRAGMA busy_timeout = 5000")
        return conn

    def _init_db(self):
        with self._get_connection() as conn:
            cur = conn.cursor()
            cur.execute("""
                CREATE TABLE IF NOT EXISTS math_corpus (
                    id TEXT PRIMARY KEY,
                    tier TEXT NOT NULL,
                    topic TEXT NOT NULL,
                    subtopic TEXT NOT NULL,
                    dimension TEXT DEFAULT 'Abstract',
                    shape_kind TEXT,
                    question TEXT NOT NULL,
                    steps TEXT NOT NULL,
                    target_variable TEXT,
                    canvas_target TEXT,
                    sympy_verification TEXT,
                    socratic_prompt TEXT,
                    source TEXT DEFAULT 'ZAP SymPy Procedural Synthesis',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cur.execute("CREATE INDEX IF NOT EXISTS idx_math_tier ON math_corpus(tier)")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_math_shape ON math_corpus(shape_kind)")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_math_topic ON math_corpus(topic)")
            conn.commit()

    def insert_batch(self, items: List[Dict[str, Any]]):
        with self._get_connection() as conn:
            cur = conn.cursor()
            for it in items:
                cur.execute("""
                    INSERT OR REPLACE INTO math_corpus 
                    (id, tier, topic, subtopic, dimension, shape_kind, question, steps, target_variable, canvas_target, sympy_verification, socratic_prompt, source)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    it["id"],
                    it["tier"],
                    it.get("topic", "General"),
                    it.get("subtopic", "General"),
                    it.get("dimension", "Abstract"),
                    it.get("shape_kind"),
                    it["question"],
                    json.dumps(it.get("steps", [])),
                    it.get("target_variable"),
                    json.dumps(it.get("canvas_target")) if it.get("canvas_target") else None,
                    json.dumps(it.get("sympy_verification")) if it.get("sympy_verification") else None,
                    it.get("socratic_prompt"),
                    it.get("source", "ZAP Procedural Engine")
                ))
            conn.commit()

        # Update JSONL
        with open(self.jsonl_path, "a", encoding="utf-8") as f:
            for it in items:
                f.write(json.dumps(it, ensure_ascii=False) + "\n")

    def query_by_tier(self, tier: str, limit: int = 50) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            conn.row_factory = sqlite3.Row
            cur = conn.cursor()
            cur.execute("SELECT * FROM math_corpus WHERE tier = ? ORDER BY id LIMIT ?", (tier.upper(), limit))
            rows = cur.fetchall()
            return [dict(r) for r in rows]

    def query_by_shape(self, shape_kind: str) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            conn.row_factory = sqlite3.Row
            cur = conn.cursor()
            cur.execute("SELECT * FROM math_corpus WHERE shape_kind = ?", (shape_kind.lower(),))
            rows = cur.fetchall()
            return [dict(r) for r in rows]

    def search_by_keyword(self, query: str, limit: int = 20) -> List[Dict[str, Any]]:
        pattern = f"%{query}%"
        with self._get_connection() as conn:
            conn.row_factory = sqlite3.Row
            cur = conn.cursor()
            cur.execute("""
                SELECT * FROM math_corpus 
                WHERE question LIKE ? OR topic LIKE ? OR subtopic LIKE ? OR shape_kind LIKE ?
                LIMIT ?
            """, (pattern, pattern, pattern, pattern, limit))
            rows = cur.fetchall()
            return [dict(r) for r in rows]

    def get_statistics(self) -> Dict[str, Any]:
        with self._get_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT COUNT(*) FROM math_corpus")
            total = cur.fetchone()[0]

            cur.execute("SELECT tier, COUNT(*) FROM math_corpus GROUP BY tier")
            by_tier = dict(cur.fetchall())

            cur.execute("SELECT shape_kind, COUNT(*) FROM math_corpus WHERE shape_kind IS NOT NULL GROUP BY shape_kind")
            by_shape = dict(cur.fetchall())

            return {
                "total_records": total,
                "by_tier": by_tier,
                "by_shape": by_shape,
                "db_path": self.db_path,
                "jsonl_path": self.jsonl_path
            }
