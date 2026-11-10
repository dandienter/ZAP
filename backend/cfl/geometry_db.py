"""
ZAP Geometry Database & CAS Dimension Intent Engine
Provides indexed access to 2D shapes, 3D solids, 2D nets, formulas, and KaTeX notation.
"""

import os
import json
import math
from typing import Dict, Any, Optional, List

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "zap_geometry_database.json")

class GeometryDatabase:
    _instance: Optional["GeometryDatabase"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(GeometryDatabase, cls).__new__(cls)
            cls._instance._load_db()
        return cls._instance

    def _load_db(self):
        if os.path.exists(DB_PATH):
            with open(DB_PATH, "r", encoding="utf-8") as f:
                self.data = json.load(f)
        else:
            self.data = {"shapes_2d": [], "shapes_3d": [], "nets_2d": []}

        # Build alias lookup
        self.lookup: Dict[str, Dict[str, Any]] = {}
        for category in ["shapes_2d", "shapes_3d", "nets_2d"]:
            for item in self.data.get(category, []):
                self.lookup[item["id"].lower()] = item
                for alias in item.get("aliases", []):
                    self.lookup[alias.lower().strip()] = item

    def get_shape(self, name_or_alias: str) -> Optional[Dict[str, Any]]:
        return self.lookup.get(name_or_alias.lower().strip())

    def list_all_shapes(self) -> List[Dict[str, Any]]:
        results = []
        for cat in ["shapes_2d", "shapes_3d", "nets_2d"]:
            results.extend(self.data.get(cat, []))
        return results

    def resolve_intent(self, text: str) -> Optional[Dict[str, Any]]:
        t = text.lower().strip()
        has_2d = any(k in t for k in ["2d", "2-d", "dua dimensi", "bangun datar", "jaring-jaring", "jaring jaring", "alas"])
        has_3d = any(k in t for k in ["3d", "3-d", "tiga dimensi", "bangun ruang", "ruang", "solid"])

        # Prioritas 2D
        if has_2d:
            if "prisma" in t:
                return self.get_shape("jaring_prisma")
            if "kubus" in t:
                return self.get_shape("jaring_kubus")
            if "limas" in t or "piramid" in t:
                return self.get_shape("jaring_limas")
            if "balok" in t:
                return self.get_shape("jaring_balok")
            if "tabung" in t:
                return self.get_shape("jaring_tabung")

            for item in self.data.get("shapes_2d", []):
                if any(alias in t for alias in item["aliases"]):
                    return item

        # Prioritas 3D
        if has_3d or not has_2d:
            for item in self.data.get("shapes_3d", []):
                if any(alias in t for alias in item["aliases"]):
                    return item

        # Cek sisa bangun datar
        for item in self.data.get("shapes_2d", []):
            if any(alias in t for alias in item["aliases"]):
                return item

        return None

# Singleton accessor
geometry_db = GeometryDatabase()
