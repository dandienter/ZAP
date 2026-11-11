"""
ZAP Mathematical Knowledge, Continuous Memory Harness & ML Data Engine
"""

from .taxonomy import MATH_TAXONOMY, TierDefinition, TopicDefinition, SubtopicDefinition
from .generators import generate_tier_corpus, GENERATORS_BY_TIER
from .harvester import fetch_open_math_data, crawl_all_verified_sources, OPEN_MATH_SOURCES
from .store import MathCorpusStore
from .agent_harness import (
    ZAPAgentHarness,
    seed_foundational_agent_memories,
    extract_math_steps_from_text,
    redact_pii,
)

__all__ = [
    "MATH_TAXONOMY",
    "TierDefinition",
    "TopicDefinition",
    "SubtopicDefinition",
    "generate_tier_corpus",
    "GENERATORS_BY_TIER",
    "fetch_open_math_data",
    "crawl_all_verified_sources",
    "OPEN_MATH_SOURCES",
    "MathCorpusStore",
    "ZAPAgentHarness",
    "seed_foundational_agent_memories",
    "extract_math_steps_from_text",
    "redact_pii",
]
