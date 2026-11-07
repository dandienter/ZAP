"""
Titik masuk layanan platform ZAP (autentikasi, gateway AI, privasi,
self-learning). Berjalan terpisah dari layanan diagnostik CFL di main.py.

Jalankan:
    uvicorn platform_main:app --port 8001

Konfigurasi lewat variabel lingkungan ZAP_* (lihat zapcore/config.py).
"""

from zapcore.api import create_app

app = create_app()
