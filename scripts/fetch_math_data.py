#!/usr/bin/env python3
"""
ZAP Math Data Harvester & Generator CLI
Fetches open-source math benchmarks and synthesizes procedural SymPy verified datasets from TK to S3.
"""

import sys
import os
import argparse
import json

# Pastikan root direktori proyek ada di sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.data_engine import (
    MATH_TAXONOMY,
    generate_tier_corpus,
    GENERATORS_BY_TIER,
    fetch_open_math_data,
    MathCorpusStore
)

def main():
    parser = argparse.ArgumentParser(description="ZAP Math Knowledge Base & ML Dataset Pipeline (TK to S3)")
    parser.add_argument("--tier", type=str, choices=["TK", "SD", "SMP", "SMA", "S1", "S2", "S3", "ALL"], help="Tier to generate (TK s/d S3)")
    parser.add_argument("--count", type=int, default=50, help="Number of samples to generate per tier")
    parser.add_argument("--fetch-open", action="store_true", help="Fetch open datasets (GSM8K, etc.)")
    parser.add_argument("--stats", action="store_true", help="Display current dataset statistics")
    parser.add_argument("--search", type=str, help="Search the corpus database by keyword or shape")
    parser.add_argument("--export-taxonomy", type=str, help="Export full curriculum taxonomy to JSON file")

    args = parser.parse_args()
    store = MathCorpusStore()

    if args.export_taxonomy:
        out_file = args.export_taxonomy
        with open(out_file, "w", encoding="utf-8") as f:
            dumpable = {k: v.model_dump() for k, v in MATH_TAXONOMY.items()}
            json.dump(dumpable, f, indent=2, ensure_ascii=False)
        print(f"[OK] Full TK-S3 Taxonomy exported to {out_file}")
        return

    if args.stats:
        stats = store.get_statistics()
        print("\n=== ZAP MATHEMATICAL CORPUS STATISTICS ===")
        print(f"Total Records Indexed: {stats['total_records']}")
        print("\nRecords By Educational Tier:")
        for t, cnt in stats["by_tier"].items():
            print(f"  • {t:<6}: {cnt} items")
        print("\nRecords By Geometric Shape:")
        for sh, cnt in stats["by_shape"].items():
            print(f"  • {sh:<16}: {cnt} items")
        print(f"\nSQLite Database: {stats['db_path']}")
        print(f"JSONL Export:    {stats['jsonl_path']}")
        print("==========================================\n")
        return

    if args.search:
        results = store.search_by_keyword(args.search, limit=5)
        print(f"\n=== SEARCH RESULTS FOR '{args.search}' ({len(results)} found) ===")
        for r in results:
            print(f"[{r['tier']}] {r['topic']} -> {r['subtopic']}")
            print(f"Q: {r['question']}")
            if r['shape_kind']:
                print(f"Shape: {r['shape_kind']} ({r['dimension']})")
            print("-" * 50)
        return

    # Fetch open datasets jika diminta
    if args.fetch_open:
        print("[1/2] Fetching open-source math benchmarks (GSM8K)...")
        open_items = fetch_open_math_data("gsm8k_sample", max_items=args.count)
        if open_items:
            store.insert_batch(open_items)
            print(f"[OK] Harvested {len(open_items)} items from GSM8K.")

    # Generate procedural verified datasets
    tiers_to_gen = list(GENERATORS_BY_TIER.keys()) if (not args.tier or args.tier.upper() == "ALL") else [args.tier.upper()]
    print(f"[2/2] Generating procedural SymPy-verified math corpus for tiers: {', '.join(tiers_to_gen)}...")
    total_generated = 0
    for t in tiers_to_gen:
        samples = generate_tier_corpus(t, count=args.count)
        store.insert_batch(samples)
        total_generated += len(samples)
        print(f"  + Generated {len(samples)} verified samples for {t}")

    print(f"\n[SUCCESS] Successfully added {total_generated} mathematical corpus items to SQLite & JSONL!")
    stats = store.get_statistics()
    print(f"Corpus now holds {stats['total_records']} total verified problems across TK to S3.\n")

if __name__ == "__main__":
    main()
