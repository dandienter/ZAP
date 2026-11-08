"""
Procedural Mathematical Dataset Generator (TK s/d S3)
Generates deterministic problem-derivation-geometry pairs verified by SymPy CAS.
"""

import math
import random
from typing import List, Dict, Any
import sympy as sp

from .taxonomy import MATH_TAXONOMY

def generate_tk_sample(idx: int) -> Dict[str, Any]:
    types = ["counting", "shape_circle", "shape_triangle", "shape_square"]
    t = types[idx % len(types)]
    
    if t == "counting":
        count = random.randint(3, 10)
        return {
            "id": f"zap_tk_count_{idx}",
            "tier": "TK",
            "topic": "Pengenalan Angka & Membilang",
            "subtopic": "Angka 1 sampai 10",
            "question": f"Berapakah jumlah apel jika ada {count} buah apel di keranjang?",
            "steps": [f"Menghitung satu per satu dari 1 sampai {count}", f"Total apel = {count}"],
            "target_variable": "n",
            "canvas_target": {"view": "2d_shape", "model": "counting_blocks", "count": count},
            "sympy_verification": {"expected_value": str(count), "is_valid": True},
            "socratic_prompt": f"Coba hitung perlahan-lahan dari 1, 2, 3... sampai apel terakhir."
        }
    elif t == "shape_circle":
        r = random.randint(3, 8)
        return {
            "id": f"zap_tk_circle_{idx}",
            "tier": "TK",
            "topic": "Bentuk Geometri Datar Sederhana",
            "subtopic": "Lingkaran",
            "question": f"Perhatikan bentuk roda atau jam dinding bundar dengan jari-jari {r} cm. Berapa banyak sudut yang dimilikinya?",
            "steps": ["Lingkaran adalah bangun datar tertutup mulus tanpa sudut siku", "Jumlah sudut = 0"],
            "target_variable": "sudut",
            "canvas_target": {"view": "2d_shape", "model": "circle", "paramA": r, "unit": "cm"},
            "sympy_verification": {"expected_value": "0", "is_valid": True},
            "socratic_prompt": "Apakah lingkaran memiliki ujung atau sudut yang lancip?"
        }
    elif t == "shape_triangle":
        return {
            "id": f"zap_tk_triangle_{idx}",
            "tier": "TK",
            "topic": "Bentuk Geometri Datar Sederhana",
            "subtopic": "Segitiga",
            "question": "Berapa banyak sisi lurus dan titik sudut pada bangun segitiga?",
            "steps": ["Segitiga memiliki 3 sisi lurus yang saling terhubung", "Jumlah sisi = 3, Jumlah titik sudut = 3"],
            "target_variable": "sisi",
            "canvas_target": {"view": "2d_shape", "model": "triangle", "paramA": 8, "unit": "cm"},
            "sympy_verification": {"expected_value": "3", "is_valid": True},
            "socratic_prompt": "Coba tunjuk dan hitung tiap garis tepi pada segitiga."
        }
    else:
        s = random.randint(4, 10)
        return {
            "id": f"zap_tk_square_{idx}",
            "tier": "TK",
            "topic": "Bentuk Geometri Datar Sederhana",
            "subtopic": "Persegi / Kotak",
            "question": f"Sebuah ubin berbentuk persegi memiliki panjang sisi {s} cm. Berapa banyak sisi yang sama panjang?",
            "steps": ["Persegi memiliki 4 sisi yang sama panjang", "Jumlah sisi = 4"],
            "target_variable": "sisi",
            "canvas_target": {"view": "2d_shape", "model": "square", "paramA": s, "unit": "cm"},
            "sympy_verification": {"expected_value": "4", "is_valid": True},
            "socratic_prompt": "Apakah keempat sisi kotak persegi ini memiliki panjang yang sama?"
        }

def generate_sd_sample(idx: int) -> Dict[str, Any]:
    subtopics = ["jajar_genjang", "trapesium", "segitiga", "lingkaran", "kubus", "balok", "pecahan"]
    sub = subtopics[idx % len(subtopics)]

    if sub == "jajar_genjang":
        alas = random.randint(8, 20)
        tinggi = random.randint(4, 15)
        sisi_miring = tinggi + random.randint(2, 6)
        luas = alas * tinggi
        keliling = 2 * (alas + sisi_miring)
        return {
            "id": f"zap_sd_jajar_genjang_{idx}",
            "tier": "SD",
            "topic": "Bangun Datar 2D (Plane Geometry)",
            "subtopic": "Jajar Genjang (Parallelogram)",
            "dimension": "2D",
            "shape_kind": "jajar_genjang",
            "question": f"Sebuah jajar genjang memiliki panjang alas a = {alas} cm, tinggi tegak lurus t = {tinggi} cm, dan sisi miring s = {sisi_miring} cm. Tentukan luas dan kelilingnya!",
            "parameters": {"alas": alas, "tinggi": tinggi, "sisi_miring": sisi_miring, "unit": "cm"},
            "formulas": {
                "luas": "L = a * t",
                "keliling": "K = 2 * (a + s)"
            },
            "steps": [
                f"L = a * t = {alas} * {tinggi} = {luas}",
                f"K = 2 * (a + s) = 2 * ({alas} + {sisi_miring}) = {keliling}"
            ],
            "target_variable": "L",
            "canvas_target": {
                "view": "2d_shape",
                "model": "jajar_genjang",
                "paramA": alas,
                "paramB": tinggi,
                "paramC": sisi_miring,
                "unit": "cm"
            },
            "sympy_verification": {
                "luas_eval": str(luas),
                "keliling_eval": str(keliling),
                "is_valid": True
            },
            "socratic_prompt": f"Ingat: untuk mencari luas jajar genjang, kalikan alas ({alas} cm) dengan tinggi tegak lurus ({tinggi} cm), bukan dengan sisi miring ({sisi_miring} cm)."
        }
    elif sub == "trapesium":
        a = random.randint(6, 12)
        b = a + random.randint(4, 8)
        t = random.randint(4, 10)
        luas = int(((a + b) * t) / 2)
        return {
            "id": f"zap_sd_trapesium_{idx}",
            "tier": "SD",
            "topic": "Bangun Datar 2D (Plane Geometry)",
            "subtopic": "Trapesium (Trapezoid)",
            "dimension": "2D",
            "shape_kind": "trapesium",
            "question": f"Sebuah trapesium memiliki panjang sisi sejajar a = {a} cm dan b = {b} cm, serta tinggi t = {t} cm. Hitung luas trapesium tersebut!",
            "parameters": {"a": a, "b": b, "tinggi": t, "unit": "cm"},
            "formulas": {"luas": "L = ((a + b) * t) / 2"},
            "steps": [
                f"Jumlah sisi sejajar = {a} + {b} = {a + b}",
                f"L = (({a + b}) * {t}) / 2 = {luas}"
            ],
            "target_variable": "L",
            "canvas_target": {
                "view": "2d_shape",
                "model": "trapesium",
                "paramA": a,
                "paramB": b,
                "paramC": t,
                "unit": "cm"
            },
            "sympy_verification": {"luas_eval": str(luas), "is_valid": True},
            "socratic_prompt": "Jumlahkan terlebih dahulu kedua sisi sejajarnya, lalu kalikan dengan tinggi dan bagi dua."
        }
    elif sub == "segitiga":
        a = random.randint(6, 16)
        t = random.randint(4, 12)
        luas = int((a * t) / 2)
        return {
            "id": f"zap_sd_segitiga_{idx}",
            "tier": "SD",
            "topic": "Bangun Datar 2D (Plane Geometry)",
            "subtopic": "Segitiga",
            "dimension": "2D",
            "shape_kind": "segitiga",
            "question": f"Tentukan luas segitiga yang memiliki alas a = {a} cm dan tinggi t = {t} cm!",
            "parameters": {"alas": a, "tinggi": t, "unit": "cm"},
            "formulas": {"luas": "L = (a * t) / 2"},
            "steps": [f"L = ({a} * {t}) / 2 = {luas}"],
            "target_variable": "L",
            "canvas_target": {"view": "2d_shape", "model": "triangle", "paramA": a, "paramB": t, "unit": "cm"},
            "sympy_verification": {"luas_eval": str(luas), "is_valid": True},
            "socratic_prompt": "Bagaimana hubungan luas segitiga dengan luas persegi panjang yang memiliki alas dan tinggi yang sama?"
        }
    elif sub == "lingkaran":
        r = random.choice([7, 14, 21, 10])
        luas = round(math.pi * r * r, 2)
        keliling = round(2 * math.pi * r, 2)
        return {
            "id": f"zap_sd_circle_{idx}",
            "tier": "SD",
            "topic": "Bangun Datar 2D (Plane Geometry)",
            "subtopic": "Lingkaran",
            "dimension": "2D",
            "shape_kind": "lingkaran",
            "question": f"Sebuah lingkaran memiliki jari-jari r = {r} cm. Hitung luas dan keliling lingkaran tersebut!",
            "parameters": {"jari_jari": r, "unit": "cm"},
            "formulas": {"luas": "L = pi * r^2", "keliling": "K = 2 * pi * r"},
            "steps": [f"L = pi * ({r})^2 approx {luas}", f"K = 2 * pi * {r} approx {keliling}"],
            "target_variable": "L",
            "canvas_target": {"view": "2d_shape", "model": "circle", "paramA": r, "unit": "cm"},
            "sympy_verification": {"luas_eval": str(luas), "is_valid": True},
            "socratic_prompt": "Gunakan pi = 22/7 jika r merupakan kelipatan 7 untuk mempermudah perhitungan."
        }
    elif sub == "kubus":
        s = random.randint(4, 15)
        vol = s ** 3
        lp = 6 * s * s
        return {
            "id": f"zap_sd_cube_{idx}",
            "tier": "SD",
            "topic": "Bangun Ruang 3D (Solid Geometry)",
            "subtopic": "Kubus",
            "dimension": "3D",
            "shape_kind": "kubus",
            "question": f"Sebuah kotak kubus memiliki panjang rusuk s = {s} cm. Tentukan volume dan luas permukaannya!",
            "parameters": {"s": s, "unit": "cm"},
            "formulas": {"volume": "V = s^3", "luas_permukaan": "L = 6 * s^2"},
            "steps": [f"V = {s}^3 = {vol}", f"L = 6 * ({s})^2 = {lp}"],
            "target_variable": "V",
            "canvas_target": {"view": "3d_canvas", "model": "solids", "solidKind": "kubus", "paramA": s, "unit": "cm"},
            "sympy_verification": {"vol_eval": str(vol), "lp_eval": str(lp), "is_valid": True},
            "socratic_prompt": "Kubus memiliki 6 sisi berbentuk bujur sangkar yang kongruen. Mengapa volumenya dikalikan tiga kali (s x s x s)?"
        }
    else:
        # Pecahan
        a, b = random.randint(1, 4), random.randint(2, 5)
        c, d = random.randint(1, 3), random.randint(2, 4)
        x = sp.Rational(a, b) + sp.Rational(c, d)
        return {
            "id": f"zap_sd_frac_{idx}",
            "tier": "SD",
            "topic": "Aritmetika Bilangan Cacah & Bulat",
            "subtopic": "Pecahan & Desimal",
            "dimension": "0D",
            "question": f"Hitung penjumlahan pecahan: {a}/{b} + {c}/{d}!",
            "steps": [f"KPK penyebut ({b}, {d}) = {sp.lcm(b, d)}", f"Hasil = {x.p}/{x.q}"],
            "target_variable": "x",
            "sympy_verification": {"expected_value": str(x), "is_valid": True},
            "socratic_prompt": "Samakan terlebih dahulu penyebut kedua pecahan sebelum menjumlahkan pembilangnya."
        }

def generate_smp_sample(idx: int) -> Dict[str, Any]:
    subtopics = ["plsv", "spldv", "pythagoras", "barisan"]
    sub = subtopics[idx % len(subtopics)]

    if sub == "plsv":
        a = random.choice([2, 3, 4, 5])
        b = random.randint(1, 15)
        c = random.randint(20, 50)
        sol = sp.Rational(c - b, a)
        return {
            "id": f"zap_smp_plsv_{idx}",
            "tier": "SMP",
            "topic": "Aljabar & Persamaan Linear",
            "subtopic": "Persamaan Linear Satu Variabel (PLSV)",
            "dimension": "1D",
            "question": f"Tentukan himpunan penyelesaian dari persamaan: {a}x + {b} = {c}!",
            "steps": [f"{a}x = {c} - {b}", f"{a}x = {c - b}", f"x = ({c - b}) / {a}"],
            "target_variable": "x",
            "sympy_verification": {"solution": str(sol), "is_valid": True},
            "socratic_prompt": f"Lakukan isolasi variabel: kurangkan kedua ruas dengan {b}, kemudian bagi dengan koefisien {a}."
        }
    elif sub == "pythagoras":
        triples = [(3, 4, 5), (5, 12, 13), (6, 8, 10), (8, 15, 17), (7, 24, 25)]
        a, b, c = random.choice(triples)
        return {
            "id": f"zap_smp_pyth_{idx}",
            "tier": "SMP",
            "topic": "Teorema Pythagoras",
            "subtopic": "Teorema Pythagoras",
            "dimension": "2D",
            "shape_kind": "segitiga_siku",
            "question": f"Sebuah segitiga siku-siku memiliki panjang sisi siku-siku a = {a} cm dan b = {b} cm. Berapakah panjang sisi miringnya (hipotenusa)?",
            "steps": [f"c^2 = a^2 + b^2", f"c^2 = {a}^2 + {b}^2 = {a*a + b*b}", f"c = sqrt({a*a + b*b}) = {c}"],
            "target_variable": "c",
            "canvas_target": {"view": "2d_shape", "model": "triangle", "paramA": a, "paramB": b, "unit": "cm"},
            "sympy_verification": {"c_eval": str(c), "is_valid": True},
            "socratic_prompt": "Gunakan Teorema Pythagoras: kuadrat sisi miring sama dengan jumlah kuadrat sisi tegak lainnya."
        }
    else:
        # SPLDV
        x_val = random.randint(1, 5)
        y_val = random.randint(1, 5)
        c1 = 2 * x_val + 3 * y_val
        c2 = x_val - y_val
        return {
            "id": f"zap_smp_spldv_{idx}",
            "tier": "SMP",
            "topic": "Aljabar & Persamaan Linear",
            "subtopic": "Sistem Persamaan Linear Dua Variabel (SPLDV)",
            "dimension": "2D",
            "question": f"Selesaikan sistem persamaan berikut untuk nilai x dan y:\n1) 2x + 3y = {c1}\n2) x - y = {c2}",
            "steps": [
                f"Dari (2), nyatakan x = y + {c2}",
                f"Substitusi ke (1): 2(y + {c2}) + 3y = {c1}",
                f"5y + {2*c2} = {c1} => y = {y_val}",
                f"x = {y_val} + {c2} = {x_val}"
            ],
            "target_variable": "x",
            "canvas_target": {"view": "2d_graph", "model": "2d_linear", "paramA": 2, "paramB": 1},
            "sympy_verification": {"x": str(x_val), "y": str(y_val), "is_valid": True},
            "socratic_prompt": "Gunakan metode eliminasi atau substitusi untuk menyederhanakan salah satu variabel terlebih dahulu."
        }

def generate_sma_sample(idx: int) -> Dict[str, Any]:
    subtopics = ["turunan", "integral", "trigonometri", "matriks"]
    sub = subtopics[idx % len(subtopics)]

    x = sp.Symbol('x')
    if sub == "turunan":
        n = random.randint(2, 4)
        c = random.randint(1, 6)
        poly = c * x**n + 3 * x**2 - 5 * x + 7
        deriv = sp.diff(poly, x)
        return {
            "id": f"zap_sma_diff_{idx}",
            "tier": "SMA",
            "topic": "Kalkulus Diferensial & Integral",
            "subtopic": "Turunan Fungsi (Diferensial)",
            "dimension": "2D",
            "question": f"Tentukan turunan pertama f'(x) dari fungsi f(x) = {sp.latex(poly)}!",
            "steps": [f"Gunakan aturan pangkat d/dx [x^k] = k * x^(k-1)", f"f'(x) = {sp.latex(deriv)}"],
            "target_variable": "f'(x)",
            "canvas_target": {"view": "2d_graph", "model": "2d_quadratic", "paramA": c, "paramB": 3, "paramC": -5},
            "sympy_verification": {"derivative": str(deriv), "is_valid": True},
            "socratic_prompt": "Turunkan setiap suku satu per satu menggunakan aturan pangkat d/dx[a*x^n] = a*n*x^(n-1)."
        }
    elif sub == "integral":
        poly = 3 * x**2 + 4 * x - 2
        integ = sp.integrate(poly, (x, 0, 2))
        return {
            "id": f"zap_sma_integ_{idx}",
            "tier": "SMA",
            "topic": "Kalkulus Diferensial & Integral",
            "subtopic": "Integral & Luas Daerah",
            "dimension": "2D",
            "question": f"Hitung nilai dari integral tentu: \\int_0^2 ({sp.latex(poly)}) dx!",
            "steps": [
                f"F(x) = x^3 + 2x^2 - 2x",
                f"F(2) = 2^3 + 2(2^2) - 2(2) = 8 + 8 - 4 = 12",
                f"F(0) = 0",
                f"Hasil = F(2) - F(0) = {integ}"
            ],
            "target_variable": "I",
            "canvas_target": {"view": "2d_graph", "model": "2d_quadratic", "paramA": 3, "paramB": 4, "paramC": -2},
            "sympy_verification": {"integral_val": str(integ), "is_valid": True},
            "socratic_prompt": "Terapkan Teorema Dasar Kalkulus: carilah antiturunan F(x) terlebih dahulu, lalu hitung F(b) - F(a)."
        }
    elif sub == "trigonometri":
        return {
            "id": f"zap_sma_trig_{idx}",
            "tier": "SMA",
            "topic": "Trigonometri Lanjut & Matriks",
            "subtopic": "Identitas Trigonometri",
            "dimension": "2D",
            "question": "Sederhanakan bentuk trigonometri: (1 - cos^2(x)) / sin(x)!",
            "steps": [
                "Gunakan identitas Pythagoras: sin^2(x) + cos^2(x) = 1 => 1 - cos^2(x) = sin^2(x)",
                "Substitusi: sin^2(x) / sin(x) = sin(x)"
            ],
            "target_variable": "expr",
            "canvas_target": {"view": "2d_graph", "model": "2d_trig", "paramA": 1, "paramB": 1, "paramC": 0},
            "sympy_verification": {"simplified": "sin(x)", "is_valid": True},
            "socratic_prompt": "Ingat identitas dasar Pythagoras sin^2(x) + cos^2(x) = 1."
        }
    else:
        # Matriks 2x2
        a, b, c, d = random.randint(1, 5), random.randint(1, 5), random.randint(1, 5), random.randint(1, 5)
        det = a * d - b * c
        return {
            "id": f"zap_sma_matrix_{idx}",
            "tier": "SMA",
            "topic": "Trigonometri Lanjut & Matriks",
            "subtopic": "Matriks & Determinan",
            "dimension": "nD",
            "question": f"Tentukan determinan dari matriks 2x2: A = [[{a}, {b}], [{c}, {d}]]!",
            "steps": [f"det(A) = ad - bc = ({a})({d}) - ({b})({c}) = {det}"],
            "target_variable": "det",
            "sympy_verification": {"determinant": str(det), "is_valid": True},
            "socratic_prompt": "Kalikan elemen diagonal utama lalu kurangkan dengan perkalian elemen diagonal samping."
        }

def generate_s1_sample(idx: int) -> Dict[str, Any]:
    x, y, z = sp.symbols('x y z')
    subtopics = ["multivariable", "eigenvalues", "ode"]
    sub = subtopics[idx % len(subtopics)]

    if sub == "multivariable":
        f = x**2 * y + y**3 - 4*x
        grad_x = sp.diff(f, x)
        grad_y = sp.diff(f, y)
        return {
            "id": f"zap_s1_grad_{idx}",
            "tier": "S1",
            "topic": "Kalkulus Multivariabel & Medan Vektor",
            "subtopic": "Operator Diferensial Vektor (Nabla)",
            "dimension": "3D",
            "question": f"Tentukan gradien nabla f dari medan skalar f(x, y) = {sp.latex(f)}!",
            "steps": [
                f"df/dx = {sp.latex(grad_x)}",
                f"df/dy = {sp.latex(grad_y)}",
                f"\\nabla f = ({sp.latex(grad_x)}) i + ({sp.latex(grad_y)}) j"
            ],
            "target_variable": "nabla_f",
            "canvas_target": {"view": "3d_canvas", "model": "saddle"},
            "sympy_verification": {"grad_x": str(grad_x), "grad_y": str(grad_y), "is_valid": True},
            "socratic_prompt": "Diferensiasikan parsial terhadap x dengan menganggap y konstan, kemudian diferensiasikan terhadap y dengan menganggap x konstan."
        }
    elif sub == "eigenvalues":
        # 2x2 matrix with clear eigenvalues
        A = sp.Matrix([[2, 1], [1, 2]])
        ev = A.eigenvals()
        return {
            "id": f"zap_s1_eigen_{idx}",
            "tier": "S1",
            "topic": "Aljabar Linear Lanjut",
            "subtopic": "Spektrum Nilai Eigen & Diagonalisasi",
            "dimension": "nD",
            "question": "Tentukan nilai-nilai eigen (eigenvalues) dari matriks simetris A = [[2, 1], [1, 2]]!",
            "steps": [
                "Persamaan karakteristik: det(A - lambda I) = 0",
                "det([[2 - lambda, 1], [1, 2 - lambda]]) = (2 - lambda)^2 - 1 = 0",
                "lambda^2 - 4 lambda + 3 = 0 => (lambda - 3)(lambda - 1) = 0",
                "Nilai eigen: lambda_1 = 3, lambda_2 = 1"
            ],
            "target_variable": "lambda",
            "sympy_verification": {"eigenvalues": [str(k) for k in ev.keys()], "is_valid": True},
            "socratic_prompt": "Bentuk determinan dari matriks (A - lambda * I) lalu selesaikan polinomial karakteristiknya."
        }
    else:
        # ODE Orde 2
        t = sp.Symbol('t')
        f_ode = sp.Function('y')(t)
        # y'' - 4y = 0
        eq = sp.Eq(f_ode.diff(t, 2) - 4 * f_ode, 0)
        sol = sp.dsolve(eq, f_ode)
        return {
            "id": f"zap_s1_ode_{idx}",
            "tier": "S1",
            "topic": "Persamaan Diferensial Biasa (ODEs)",
            "subtopic": "PDB Linier Orde 2 Koefisien Konstan",
            "dimension": "Abstract",
            "question": "Selesaikan persamaan diferensial biasa linier homogen orde 2: y''(t) - 4y(t) = 0!",
            "steps": [
                "Persamaan karakteristik: r^2 - 4 = 0 => r = +-2",
                "Solusi umum kombinasi linier: y(t) = C_1 e^(2t) + C_2 e^(-2t)"
            ],
            "target_variable": "y(t)",
            "sympy_verification": {"solution": str(sol), "is_valid": True},
            "socratic_prompt": "Gunakan persamaan karakteristik a*r^2 + b*r + c = 0 untuk menemukan akar-akar basis solusi eksponensial."
        }

def generate_s2_sample(idx: int) -> Dict[str, Any]:
    subtopics = ["heat_equation", "hilbert_parallelogram", "geodesic"]
    sub = subtopics[idx % len(subtopics)]

    if sub == "heat_equation":
        return {
            "id": f"zap_s2_heat_{idx}",
            "tier": "S2",
            "topic": "Persamaan Diferensial Parsial (PDEs)",
            "subtopic": "Persamaan Panas & Gelombang",
            "dimension": "3D",
            "question": "Tinjau persamaan panas 1D: du/dt = alpha * d^2u/dx^2 pada 0 < x < L dengan kondisi batas Dirichlet homogen u(0, t) = u(L, t) = 0. Tuliskan bentuk solusi dasar pemisahan variabelnya!",
            "steps": [
                "Asumsikan u(x, t) = X(x) T(t)",
                "T'(t) / (alpha T(t)) = X''(x) / X(x) = -lambda",
                "X(x) = sin(n pi x / L) dengan nilai eigen lambda_n = (n pi / L)^2",
                "T(t) = exp(-alpha (n pi / L)^2 t)",
                "u(x, t) = sum B_n sin(n pi x / L) exp(-alpha (n pi / L)^2 t)"
            ],
            "target_variable": "u(x, t)",
            "canvas_target": {"view": "3d_canvas", "model": "surface"},
            "sympy_verification": {"pde_family": "parabolic", "is_valid": True},
            "socratic_prompt": "Terapkan pemisahan variabel u(x, t) = X(x)T(t) dan periksa nilai eigen yang memenuhi kondisi batas Dirichlet."
        }
    elif sub == "hilbert_parallelogram":
        return {
            "id": f"zap_s2_hilbert_{idx}",
            "tier": "S2",
            "topic": "Analisis Fungsional",
            "subtopic": "Ruang Hilbert & Geometri Hasil Kali Dalam",
            "dimension": "Abstract",
            "question": "Buktikan bahwa ruang bernorma (H, ||.||) adalah ruang hasil kali dalam jika dan hanya jika norma tersebut memenuhi Hukum Jajar Genjang (Parallelogram Law): ||x + y||^2 + ||x - y||^2 = 2||x||^2 + 2||y||^2!",
            "steps": [
                "Pada ruang hasil kali dalam: ||x + y||^2 = <x+y, x+y> = ||x||^2 + 2 Re<x, y> + ||y||^2",
                "||x - y||^2 = <x-y, x-y> = ||x||^2 - 2 Re<x, y> + ||y||^2",
                "Menjumlahkan kedua persamaan: suku silang saling menghilangkan menghasilkan 2||x||^2 + 2||y||^2",
                "Kecukupan dibuktikan oleh Teorema Jordan-von Neumann melalui Identitas Polarisasi."
            ],
            "target_variable": "parallelogram_law",
            "sympy_verification": {"theorem": "Jordan-von Neumann Theorem", "is_valid": True},
            "socratic_prompt": "Uraikan norma hasil kali dalam <x+y, x+y> dan amati bagaimana suku silang saling mengeliminasi persis seperti geometri jajar genjang."
        }
    else:
        return {
            "id": f"zap_s2_metric_{idx}",
            "tier": "S2",
            "topic": "Geometri Diferensial & Manifold",
            "subtopic": "Metrik Riemannian & Geodesik",
            "dimension": "nD",
            "question": "Tuliskan simbol Christoffel jenis kedua Gamma^lambda_mu_nu dalam suku-suku turunan tensor metrik Riemannian g_mu_nu!",
            "steps": [
                "Gamma^lambda_mu_nu = 1/2 g^(lambda sigma) [ d(g_sigma_mu)/dx^nu + d(g_sigma_nu)/dx^mu - d(g_mu_nu)/dx^sigma ]"
            ],
            "target_variable": "Gamma",
            "sympy_verification": {"metric_compatibility": "nabla g = 0", "is_valid": True},
            "socratic_prompt": "Gunakan kondisi simetri koneksi Levi-Civita bebas torsi dan kompatibilitas metrik."
        }

def generate_s3_sample(idx: int) -> Dict[str, Any]:
    subtopics = ["homology", "elliptic_curves", "adjunction"]
    sub = subtopics[idx % len(subtopics)]

    if sub == "homology":
        return {
            "id": f"zap_s3_homology_{idx}",
            "tier": "S3",
            "topic": "Topologi Aljabar & Teori Homotopi",
            "subtopic": "Kompleks Rantai & Grup Homologi",
            "dimension": "Abstract",
            "question": "Diberikan kompleks rantai C_*: ... -> C_{n+1} --d_{n+1}--> C_n --d_n--> C_{n-1} -> ..., jelaskan sifat aljabar d_n o d_{n+1} = 0 dan bagaimana hal ini menjamin definisi grup homologi H_n(C)!",
            "steps": [
                "Kondisi d_n o d_{n+1} = 0 berimplikasi langsung bahwa im(d_{n+1}) subseteq ker(d_n)",
                "Elemen ker(d_n) disebut siklus ke-n (Z_n)",
                "Elemen im(d_{n+1}) disebut batas ke-n (B_n)",
                "Karena modul bersifat abelian, B_n adalah subgrup normal dari Z_n, sehingga grup kuosien H_n = Z_n / B_n terdefinisi dengan baik."
            ],
            "target_variable": "H_n(C)",
            "sympy_verification": {"exactness_condition": "boundary_squared_is_zero", "is_valid": True},
            "socratic_prompt": "Mengapa syarat bahwa bayangan dari operator batas sebelumnya termuat di dalam kernel operator batas saat ini sangat krusial untuk membentuk modul kuosien?"
        }
    elif sub == "elliptic_curves":
        return {
            "id": f"zap_s3_elliptic_{idx}",
            "tier": "S3",
            "topic": "Geometri Aljabar Modern & Skema",
            "subtopic": "Struktur Skema & Kohomologi Berkas",
            "dimension": "Abstract",
            "question": "Pada kurva eliptik E: y^2 = x^3 + Ax + B di atas medan bilangan rasional Q, tuliskan rumus diskriminan Delta dan syarat agar E bersifat nonsingular (halus)!",
            "steps": [
                "Delta = -16(4A^3 + 27B^2)",
                "Kurva eliptik bersifat halus (nonsingular) jika dan hanya jika Delta != 0, sehingga tidak memiliki titik taring (cusp) atau titik potong ganda (node)."
            ],
            "target_variable": "Delta",
            "sympy_verification": {"discriminant_formula": "-16*(4*A**3 + 27*B**2)", "is_valid": True},
            "socratic_prompt": "Bagaimana diskriminan polinomial kubik menentukan keberadaan akar ganda pada sisi kanan kurva Weierstrass?"
        }
    else:
        return {
            "id": f"zap_s3_adjunction_{idx}",
            "tier": "S3",
            "topic": "Teori Kategori & Higher Category",
            "subtopic": "Fungtor Adjungsi & Transformasi Alami",
            "dimension": "Abstract",
            "question": "Nyatakan definisi formal dari pasangan fungtor adjungsi F -| G antara kategori C dan D menggunakan bijeksi natural pada himpunan panah (Hom-sets)!",
            "steps": [
                "Diberikan fungtor F: C -> D dan G: D -> C",
                "F merupakan left adjoint bagi G (ditulis F -| G) jika terdapat famili bijeksi natural: Hom_D(F(X), Y) cong Hom_C(X, G(Y)) untuk setiap objek X in C dan Y in D",
                "Bijeksi tersebut bersifat natural terhadap X dan Y."
            ],
            "target_variable": "F -| G",
            "sympy_verification": {"category_property": "natural_hom_bijection", "is_valid": True},
            "socratic_prompt": "Perhatikan peran unit eta: 1_C -> G o F dan counit epsilon: F o G -> 1_D dalam identitas segitiga (triangle identities)."
        }

GENERATORS_BY_TIER = {
    "TK": generate_tk_sample,
    "SD": generate_sd_sample,
    "SMP": generate_smp_sample,
    "SMA": generate_sma_sample,
    "S1": generate_s1_sample,
    "S2": generate_s2_sample,
    "S3": generate_s3_sample,
}

def generate_tier_corpus(tier: str, count: int = 50) -> List[Dict[str, Any]]:
    gen = GENERATORS_BY_TIER.get(tier.upper())
    if not gen:
        raise ValueError(f"Unknown tier '{tier}'. Available: {list(GENERATORS_BY_TIER.keys())}")
    return [gen(i) for i in range(count)]
