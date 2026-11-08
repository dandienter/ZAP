"""
ZAP Math Taxonomy & Knowledge Hierarchy (TK s/d S3)
Universal mathematical ontology bridging pedagogical curricula with SymPy CAS verification.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class SubtopicDefinition(BaseModel):
    id: str
    name: str
    dimension: str = "Abstract"  # "0D", "1D", "2D", "3D", "nD", "Abstract"
    shape_kind: Optional[str] = None  # e.g., "jajar_genjang", "kubus", "tabung"
    key_formulas: List[Dict[str, str]] = Field(default_factory=list)
    common_misconceptions: List[str] = Field(default_factory=list)
    canvas_target: Optional[Dict[str, str]] = None  # {"view": "2d_shape", "model": "jajar_genjang"}

class TopicDefinition(BaseModel):
    id: str
    name: str
    description: str
    subtopics: List[SubtopicDefinition] = Field(default_factory=list)

class TierDefinition(BaseModel):
    tier: str  # TK, SD, SMP, SMA, S1, S2, S3
    level_name: str
    target_audience: str
    curriculum_standards: List[str]
    topics: List[TopicDefinition] = Field(default_factory=list)

MATH_TAXONOMY: Dict[str, TierDefinition] = {
    "TK": TierDefinition(
        tier="TK",
        level_name="Taman Kanak-Kanak / Early Childhood Mathematics",
        target_audience="Anak Usia 4-6 Tahun (PAUD/TK A/TK B)",
        curriculum_standards=["Kurikulum Merdeka PAUD", "Early Math Foundation (NAEYC)"],
        topics=[
            TopicDefinition(
                id="tk_counting",
                name="Pengenalan Angka & Membilang",
                description="Mengenal simbol angka 1-20, membilang objek konkret, dan mencocokkan jumlah.",
                subtopics=[
                    SubtopicDefinition(
                        id="tk_num_1_10",
                        name="Angka 1 sampai 10",
                        dimension="0D",
                        key_formulas=[{"label": "Kardinalitas", "formula": "n = 1, 2, ..., 10"}],
                        common_misconceptions=["Tertukar antara simbol angka 6 dan 9", "Melewatkan angka saat mencacah."]
                    ),
                    SubtopicDefinition(
                        id="tk_comparison",
                        name="Perbandingan Kuantitas & Ukuran",
                        dimension="1D",
                        key_formulas=[{"label": "Relasi", "formula": "Lebih Banyak / Lebih Sedikit, Besar / Kecil"}],
                        common_misconceptions=["Menganggap susunan objek yang lebih renggang selalu lebih banyak."]
                    )
                ]
            ),
            TopicDefinition(
                id="tk_basic_shapes",
                name="Bentuk Geometri Datar Sederhana",
                description="Mengenal bentuk 2D dasar melalui persepsi visual dan perabaan.",
                subtopics=[
                    SubtopicDefinition(
                        id="tk_shape_circle",
                        name="Lingkaran",
                        dimension="2D",
                        shape_kind="lingkaran",
                        canvas_target={"view": "2d_shape", "model": "circle"},
                        key_formulas=[{"label": "Karakteristik", "formula": "Bentuk bundar mulus tanpa sudut"}]
                    ),
                    SubtopicDefinition(
                        id="tk_shape_triangle",
                        name="Segitiga",
                        dimension="2D",
                        shape_kind="segitiga",
                        canvas_target={"view": "2d_shape", "model": "triangle"},
                        key_formulas=[{"label": "Karakteristik", "formula": "Memiliki 3 sisi dan 3 titik sudut"}]
                    ),
                    SubtopicDefinition(
                        id="tk_shape_square",
                        name="Persegi / Kotak",
                        dimension="2D",
                        shape_kind="persegi",
                        canvas_target={"view": "2d_shape", "model": "square"},
                        key_formulas=[{"label": "Karakteristik", "formula": "Memiliki 4 sisi sama panjang dan 4 sudut"}]
                    )
                ]
            )
        ]
    ),

    "SD": TierDefinition(
        tier="SD",
        level_name="Sekolah Dasar / Elementary Mathematics",
        target_audience="Siswa Kelas 1 - 6 SD (Usia 7-12 Tahun)",
        curriculum_standards=["Kurikulum Merdeka SD", "Kurikulum 2013 (K13) SD"],
        topics=[
            TopicDefinition(
                id="sd_arithmetic",
                name="Aritmetika Bilangan Cacah & Bulat",
                description="Operasi penjumlahan, pengurangan, perkalian, pembagian, FPB dan KPK.",
                subtopics=[
                    SubtopicDefinition(
                        id="sd_ops_basic",
                        name="Operasi Dasar 4 Pilar (+, -, x, /)",
                        dimension="0D",
                        key_formulas=[
                            {"label": "Sifat Komutatif", "formula": "a + b = b + a,\\quad a \\times b = b \\times a"},
                            {"label": "Sifat Asosiatif", "formula": "(a + b) + c = a + (b + c)"},
                            {"label": "Sifat Distributif", "formula": "a \\times (b + c) = (a \\times b) + (a \\times c)"}
                        ],
                        common_misconceptions=["Mendahulukan penjumlahan daripada perkalian pada operasi campuran."]
                    ),
                    SubtopicDefinition(
                        id="sd_fractions",
                        name="Pecahan & Desimal",
                        dimension="1D",
                        key_formulas=[
                            {"label": "Penjumlahan Pecahan", "formula": "\\frac{a}{b} + \\frac{c}{d} = \\frac{ad + bc}{bd}"},
                            {"label": "Perkalian Pecahan", "formula": "\\frac{a}{b} \\times \\frac{c}{d} = \\frac{ac}{bd}"}
                        ],
                        common_misconceptions=["Menjumlahkan pembilang dengan pembilang dan penyebut dengan penyebut: (a/b)+(c/d) != (a+c)/(b+d)."]
                    )
                ]
            ),
            TopicDefinition(
                id="sd_plane_geometry",
                name="Bangun Datar 2D (Plane Geometry)",
                description="Konsep luas dan keliling poligon beraturan dan tak beraturan.",
                subtopics=[
                    SubtopicDefinition(
                        id="sd_parallelogram",
                        name="Jajar Genjang (Parallelogram)",
                        dimension="2D",
                        shape_kind="jajar_genjang",
                        canvas_target={"view": "2d_shape", "model": "jajar_genjang"},
                        key_formulas=[
                            {"label": "Luas Jajar Genjang", "formula": "L = a \\times t"},
                            {"label": "Keliling Jajar Genjang", "formula": "K = 2(a + s)"}
                        ],
                        common_misconceptions=[
                            "Menghitung luas dengan mengalikan alas dengan sisi miring (L != a * s, harus dikali tinggi tegak lurus t).",
                            "Mengira jajar genjang adalah bangun 3D."
                        ]
                    ),
                    SubtopicDefinition(
                        id="sd_trapezoid",
                        name="Trapesium (Trapezoid)",
                        dimension="2D",
                        shape_kind="trapesium",
                        canvas_target={"view": "2d_shape", "model": "trapesium"},
                        key_formulas=[
                            {"label": "Luas Trapesium", "formula": "L = \\frac{(a + b) \\times t}{2}"},
                            {"label": "Keliling Trapesium", "formula": "K = a + b + c + d"}
                        ],
                        common_misconceptions=["Lupa membagi 2 saat menghitung luas trapesium."]
                    ),
                    SubtopicDefinition(
                        id="sd_triangle",
                        name="Segitiga (Triangle)",
                        dimension="2D",
                        shape_kind="segitiga",
                        canvas_target={"view": "2d_shape", "model": "segitiga"},
                        key_formulas=[
                            {"label": "Luas Segitiga", "formula": "L = \\frac{1}{2} \\times a \\times t"},
                            {"label": "Keliling Segitiga", "formula": "K = a + b + c"}
                        ],
                        common_misconceptions=["Menggunakan sisi miring sebagai tinggi pada segitiga sembarang."]
                    ),
                    SubtopicDefinition(
                        id="sd_rhombus_kite",
                        name="Belah Ketupat & Layang-Layang",
                        dimension="2D",
                        shape_kind="belah_ketupat",
                        canvas_target={"view": "2d_shape", "model": "belah_ketupat"},
                        key_formulas=[
                            {"label": "Luas Belah Ketupat / Layang-Layang", "formula": "L = \\frac{1}{2} \\times d_1 \\times d_2"},
                            {"label": "Keliling Belah Ketupat", "formula": "K = 4s"}
                        ]
                    ),
                    SubtopicDefinition(
                        id="sd_circle",
                        name="Lingkaran (Circle)",
                        dimension="2D",
                        shape_kind="lingkaran",
                        canvas_target={"view": "2d_shape", "model": "circle"},
                        key_formulas=[
                            {"label": "Luas Lingkaran", "formula": "L = \\pi r^2 = \\frac{1}{4}\\pi d^2"},
                            {"label": "Keliling Lingkaran", "formula": "K = 2\\pi r = \\pi d"}
                        ],
                        common_misconceptions=["Tertukar antara rumus luas pi*r^2 dan keliling 2*pi*r."]
                    )
                ]
            ),
            TopicDefinition(
                id="sd_solid_geometry",
                name="Bangun Ruang 3D (Solid Geometry)",
                description="Volume dan luas permukaan kubus, balok, tabung, kerucut, bola.",
                subtopics=[
                    SubtopicDefinition(
                        id="sd_cube",
                        name="Kubus",
                        dimension="3D",
                        shape_kind="kubus",
                        canvas_target={"view": "3d_canvas", "model": "solids", "solidKind": "kubus"},
                        key_formulas=[
                            {"label": "Volume Kubus", "formula": "V = s^3"},
                            {"label": "Luas Permukaan Kubus", "formula": "L = 6s^2"}
                        ]
                    ),
                    SubtopicDefinition(
                        id="sd_cuboid",
                        name="Balok",
                        dimension="3D",
                        shape_kind="balok",
                        canvas_target={"view": "3d_canvas", "model": "solids", "solidKind": "balok"},
                        key_formulas=[
                            {"label": "Volume Balok", "formula": "V = p \\times l \\times t"},
                            {"label": "Luas Permukaan Balok", "formula": "L = 2(pl + pt + lt)"}
                        ]
                    ),
                    SubtopicDefinition(
                        id="sd_cylinder",
                        name="Tabung",
                        dimension="3D",
                        shape_kind="tabung",
                        canvas_target={"view": "3d_canvas", "model": "cylinder"},
                        key_formulas=[
                            {"label": "Volume Tabung", "formula": "V = \\pi r^2 t"},
                            {"label": "Luas Permukaan Tabung", "formula": "L = 2\\pi r(r + t)"}
                        ]
                    )
                ]
            )
        ]
    ),

    "SMP": TierDefinition(
        tier="SMP",
        level_name="Sekolah Menengah Pertama / Junior High Mathematics",
        target_audience="Siswa Kelas 7 - 9 SMP (Usia 13-15 Tahun)",
        curriculum_standards=["Kurikulum Merdeka SMP", "K13 SMP"],
        topics=[
            TopicDefinition(
                id="smp_algebra",
                name="Aljabar & Persamaan Linear",
                description="Persamaan dan pertidaksamaan linear satu & dua variabel (PLSV, SPLDV).",
                subtopics=[
                    SubtopicDefinition(
                        id="smp_plsv",
                        name="Persamaan Linear Satu Variabel (PLSV)",
                        dimension="1D",
                        key_formulas=[{"label": "Bentuk Baku", "formula": "ax + b = c \\implies x = \\frac{c - b}{a}"}],
                        common_misconceptions=["Lupa membalik tanda pertidaksamaan saat mengalikan atau membagi dengan bilangan negatif."]
                    ),
                    SubtopicDefinition(
                        id="smp_spldv",
                        name="Sistem Persamaan Linear Dua Variabel (SPLDV)",
                        dimension="2D",
                        canvas_target={"view": "2d_graph", "model": "2d_linear"},
                        key_formulas=[
                            {"label": "Bentuk Umum SPLDV", "formula": "a_1 x + b_1 y = c_1,\\quad a_2 x + b_2 y = c_2"},
                            {"label": "Metode Eliminasi & Substitusi", "formula": "\\Delta = a_1 b_2 - a_2 b_1 \\neq 0"}
                        ]
                    )
                ]
            ),
            TopicDefinition(
                id="smp_pythagoras",
                name="Teorema Pythagoras & Pola Bilangan",
                description="Relasi kuadrat sisi segitiga siku-siku dan pola barisan aritmetika.",
                subtopics=[
                    SubtopicDefinition(
                        id="smp_pythagoras_theorem",
                        name="Teorema Pythagoras",
                        dimension="2D",
                        key_formulas=[
                            {"label": "Sisi Miring", "formula": "c^2 = a^2 + b^2 \\implies c = \\sqrt{a^2 + b^2}"},
                            {"label": "Sisi Tegak", "formula": "a = \\sqrt{c^2 - b^2}"}
                        ],
                        common_misconceptions=["Menjumlahkan sisi siku-siku tanpa menguadratkannya: c != a + b."]
                    ),
                    SubtopicDefinition(
                        id="smp_arithmetic_seq",
                        name="Barisan & Deret Aritmetika",
                        dimension="1D",
                        key_formulas=[
                            {"label": "Suku ke-n", "formula": "U_n = a + (n - 1)b"},
                            {"label": "Jumlah n Suku", "formula": "S_n = \\frac{n}{2}(2a + (n - 1)b)"}
                        ]
                    )
                ]
            )
        ]
    ),

    "SMA": TierDefinition(
        tier="SMA",
        level_name="Sekolah Menengah Atas & Kejuruan / Senior High & Vocational",
        target_audience="Siswa Kelas 10 - 12 SMA/SMK (Usia 16-18 Tahun)",
        curriculum_standards=["Kurikulum Merdeka SMA Fase E & F", "K13 SMA", "AP Calculus AB/BC"],
        topics=[
            TopicDefinition(
                id="sma_calculus",
                name="Kalkulus Diferensial & Integral",
                description="Limit fungsi, turunan fungsi aljabar & trigonometri, integral tak tentu & tentu.",
                subtopics=[
                    SubtopicDefinition(
                        id="sma_derivative",
                        name="Turunan Fungsi (Diferensial)",
                        dimension="2D",
                        key_formulas=[
                            {"label": "Definisi Limit Turunan", "formula": "f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}"},
                            {"label": "Aturan Pangkat", "formula": "\\frac{d}{dx}[x^n] = n x^{n-1}"},
                            {"label": "Aturan Rantai", "formula": "\\frac{d}{dx}[f(g(x))] = f'(g(x)) \\cdot g'(x)"}
                        ]
                    ),
                    SubtopicDefinition(
                        id="sma_integral",
                        name="Integral & Luas Daerah",
                        dimension="2D",
                        key_formulas=[
                            {"label": "Teorema Dasar Kalkulus", "formula": "\\int_a^b f(x) dx = F(b) - F(a)"},
                            {"label": "Luas Daerah Antara Dua Kurva", "formula": "L = \\int_a^b |f(x) - g(x)| dx"}
                        ]
                    )
                ]
            ),
            TopicDefinition(
                id="sma_trig_matrix",
                name="Trigonometri Lanjut & Matriks",
                description="Identitas trigonometri, persamaan kuadrat trigonometri, determinan & invers matriks.",
                subtopics=[
                    SubtopicDefinition(
                        id="sma_trig_identity",
                        name="Identitas Trigonometri",
                        dimension="2D",
                        canvas_target={"view": "2d_graph", "model": "2d_trig"},
                        key_formulas=[
                            {"label": "Identitas Pythagoras", "formula": "\\sin^2(x) + \\cos^2(x) = 1"},
                            {"label": "Sudut Rangkap", "formula": "\\sin(2x) = 2\\sin(x)\\cos(x),\\quad \\cos(2x) = \\cos^2(x) - \\sin^2(x)"}
                        ]
                    ),
                    SubtopicDefinition(
                        id="sma_matrix_2x2",
                        name="Matriks & Determinan",
                        dimension="nD",
                        key_formulas=[
                            {"label": "Determinan 2x2", "formula": "\\det \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} = ad - bc"},
                            {"label": "Invers Matriks 2x2", "formula": "A^{-1} = \\frac{1}{ad - bc} \\begin{pmatrix} d & -b \\\\ -c & a \\end{pmatrix}"}
                        ]
                    )
                ]
            )
        ]
    ),

    "S1": TierDefinition(
        tier="S1",
        level_name="Perguruan Tinggi Strata 1 (Sarjana / Undergraduate)",
        target_audience="Mahasiswa Matematika, Sains, Teknik, & Komputer",
        curriculum_standards=["ACM/IEEE Math for Computing", "BSc Mathematics Curriculum"],
        topics=[
            TopicDefinition(
                id="s1_multivariable",
                name="Kalkulus Multivariabel & Medan Vektor",
                description="Turunan parsial, gradien, divergensi, curl, integral lipat, dan teorema integral medan.",
                subtopics=[
                    SubtopicDefinition(
                        id="s1_grad_div_curl",
                        name="Operator Diferensial Vektor (Nabla)",
                        dimension="3D",
                        canvas_target={"view": "3d_canvas", "model": "saddle"},
                        key_formulas=[
                            {"label": "Gradien", "formula": "\\nabla f = \\left( \\frac{\\partial f}{\\partial x}, \\frac{\\partial f}{\\partial y}, \\frac{\\partial f}{\\partial z} \\right)"},
                            {"label": "Divergensi", "formula": "\\nabla \\cdot \\mathbf{F} = \\frac{\\partial F_x}{\\partial x} + \\frac{\\partial F_y}{\\partial y} + \\frac{\\partial F_z}{\\partial z}"},
                            {"label": "Curl", "formula": "\\nabla \\times \\mathbf{F} = \\det \\begin{pmatrix} \\mathbf{i} & \\mathbf{j} & \\mathbf{k} \\\\ \\partial_x & \\partial_y & \\partial_z \\\\ F_x & F_y & F_z \\end{pmatrix}"}
                        ]
                    ),
                    SubtopicDefinition(
                        id="s1_integral_theorems",
                        name="Teorema Stokes & Divergensi Gauss",
                        dimension="3D",
                        key_formulas=[
                            {"label": "Teorema Gauss", "formula": "\\iiint_V (\\nabla \\cdot \\mathbf{F}) dV = \\iint_{\\partial V} \\mathbf{F} \\cdot \\mathbf{n} dS"},
                            {"label": "Teorema Stokes", "formula": "\\iint_S (\\nabla \\times \\mathbf{F}) \\cdot d\\mathbf{S} = \\oint_{\\partial S} \\mathbf{F} \\cdot d\\mathbf{r}"}
                        ]
                    )
                ]
            ),
            TopicDefinition(
                id="s1_linear_algebra",
                name="Aljabar Linear Lanjut",
                description="Ruang vektor abstrak, transformasi linear, nilai eigen & vektor eigen, dekomposisi matriks.",
                subtopics=[
                    SubtopicDefinition(
                        id="s1_eigenvalues",
                        name="Spektrum Nilai Eigen & Diagonalisasi",
                        dimension="nD",
                        key_formulas=[
                            {"label": "Persamaan Karakteristik", "formula": "\\det(A - \\lambda I) = 0"},
                            {"label": "Diagonalisasi", "formula": "A = P D P^{-1}"}
                        ]
                    ),
                    SubtopicDefinition(
                        id="s1_svd",
                        name="Singular Value Decomposition (SVD)",
                        dimension="nD",
                        key_formulas=[{"label": "Dekomposisi SVD", "formula": "A = U \\Sigma V^T"}]
                    )
                ]
            ),
            TopicDefinition(
                id="s1_ode",
                name="Persamaan Diferensial Biasa (ODEs)",
                description="PDB linier orde 1 dan 2, sistem PDB, transformasi Laplace, dan trayektori fase.",
                subtopics=[
                    SubtopicDefinition(
                        id="s1_second_order_ode",
                        name="PDB Linier Orde 2 Koefisien Konstan",
                        dimension="Abstract",
                        key_formulas=[
                            {"label": "Bentuk Baku", "formula": "a y'' + b y' + c y = f(x)"},
                            {"label": "Persamaan Karakteristik", "formula": "a r^2 + b r + c = 0"}
                        ]
                    )
                ]
            )
        ]
    ),

    "S2": TierDefinition(
        tier="S2",
        level_name="Perguruan Tinggi Strata 2 (Magister / Master's Degree)",
        target_audience="Mahasiswa Magister Matematika Terapan, Fisika Teoretis, & AI Research",
        curriculum_standards=["MSc Mathematics & Theoretical Physics Core"],
        topics=[
            TopicDefinition(
                id="s2_pde",
                name="Persamaan Diferensial Parsial (PDEs)",
                description="Persamaan gelombang, persamaan panas, persamaan Laplace, metode pemisahan variabel, dan ruang Sobolev.",
                subtopics=[
                    SubtopicDefinition(
                        id="s2_heat_wave",
                        name="Persamaan Panas & Gelombang",
                        dimension="3D",
                        key_formulas=[
                            {"label": "Persamaan Panas", "formula": "\\frac{\\partial u}{\\partial t} = \\alpha \\nabla^2 u"},
                            {"label": "Persamaan Gelombang", "formula": "\\frac{\\partial^2 u}{\\partial t^2} = c^2 \\nabla^2 u"}
                        ]
                    )
                ]
            ),
            TopicDefinition(
                id="s2_functional_analysis",
                name="Analisis Fungsional",
                description="Ruang Banach, ruang Hilbert, operator linier kontinu, dan teorema Hahn-Banach.",
                subtopics=[
                    SubtopicDefinition(
                        id="s2_hilbert_spaces",
                        name="Ruang Hilbert & Geometri Hasil Kali Dalam",
                        dimension="Abstract",
                        key_formulas=[
                            {"label": "Ketaksamaan Cauchy-Schwarz", "formula": "|\\langle x, y \\rangle|^2 \\le \\langle x, x \\rangle \\cdot \\langle y, y \\rangle"},
                            {"label": "Identitas Jajar Genjang Ruang Hilbert", "formula": "\\|x + y\\|^2 + \\|x - y\\|^2 = 2\\|x\\|^2 + 2\\|y\\|^2"}
                        ]
                    )
                ]
            ),
            TopicDefinition(
                id="s2_diff_geometry",
                name="Geometri Diferensial & Manifold",
                description="Manifold mulus, ruang tangen, bentuk diferensial, dan metrik Riemannian.",
                subtopics=[
                    SubtopicDefinition(
                        id="s2_riemannian_metric",
                        name="Metrik Riemannian & Geodesik",
                        dimension="nD",
                        key_formulas=[
                            {"label": "Elemen Garis", "formula": "ds^2 = g_{\\mu\\nu} dx^\\mu dx^\\nu"},
                            {"label": "Persamaan Geodesik", "formula": "\\frac{d^2 x^\\lambda}{dt^2} + \\Gamma^\\lambda_{\\mu\\nu} \\frac{dx^\\mu}{dt} \\frac{dx^\\nu}{dt} = 0"}
                        ]
                    )
                ]
            )
        ]
    ),

    "S3": TierDefinition(
        tier="S3",
        level_name="Perguruan Tinggi Strata 3 (Doktoral / Doctoral Research)",
        target_audience="Peneliti Matematika Murni, Geometri Aljabar, Teori Kategori, Fisika Kuantum",
        curriculum_standards=["PhD Pure Mathematics & Advanced Research Frontiers"],
        topics=[
            TopicDefinition(
                id="s3_algebraic_topology",
                name="Topologi Aljabar & Teori Homotopi",
                description="Grup fundamental, homologi singular, kohomologi de Rham, bundel serat, dan kelas karakteristik.",
                subtopics=[
                    SubtopicDefinition(
                        id="s3_homology_cohomology",
                        name="Kompleks Rantai & Grup Homologi",
                        dimension="Abstract",
                        key_formulas=[
                            {"label": "Batas Operator", "formula": "\\partial_n \\circ \\partial_{n+1} = 0"},
                            {"label": "Grup Homologi ke-n", "formula": "H_n(X) = \\ker(\\partial_n) / \\operatorname{im}(\\partial_{n+1})"}
                        ]
                    )
                ]
            ),
            TopicDefinition(
                id="s3_algebraic_geometry",
                name="Geometri Aljabar Modern & Skema",
                description="Skema Grothendieck, berkas (sheaves), kohomologi berkas, dan kurva eliptik di atas medan bilangan.",
                subtopics=[
                    SubtopicDefinition(
                        id="s3_sheaf_schemes",
                        name="Struktur Skema & Kohomologi Berkas",
                        dimension="Abstract",
                        key_formulas=[
                            {"label": "Spektrum Ring", "formula": "X = \\operatorname{Spec}(R)"},
                            {"label": "Kurva Eliptik Weierstrass", "formula": "y^2 = x^3 + ax + b,\\quad \\Delta = -16(4a^3 + 27b^2) \\neq 0"}
                        ]
                    )
                ]
            ),
            TopicDefinition(
                id="s3_category_theory",
                name="Teori Kategori & Higher Category",
                description="Kategori, fungtor, transformasi alami, adjunction, monad, dan topos.",
                subtopics=[
                    SubtopicDefinition(
                        id="s3_adjunction",
                        name="Fungtor Adjungsi & Transformasi Alami",
                        dimension="Abstract",
                        key_formulas=[
                            {"label": "Isomorfisme Adjungsi", "formula": "\\operatorname{Hom}_{\\mathcal{D}}(F(A), B) \\cong \\operatorname{Hom}_{\\mathcal{C}}(A, G(B))"}
                        ]
                    )
                ]
            )
        ]
    )
}
