"""
NalarAI - API Integration Verification Suite (Root Forwarder)
"""
import sys
import os

# Tambahkan backend ke path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from backend.tests.test_api import *
