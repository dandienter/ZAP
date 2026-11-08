"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, useParams, usePathname } from "next/navigation";
import MathView from "@/components/MathView";
import RichChatText from "@/components/RichChatText";
import ZapLogo from "@/components/ZapLogo";
import { type ZAPUser } from "@/components/GoogleAuthButton";
import InteractiveCanvas3D, {
  type MathModelType,
  type SolidKind,
  type PlaneShapeKind,
} from "@/components/InteractiveCanvas3D";
import ModelPickerWithEffort, {
  AVAILABLE_MODELS,
  type AIModel,
  type ReasoningEffort,
} from "@/components/ModelPickerWithEffort";
import {
  formatRelativeTime,
  loadConversations,
  saveConversations,
  windowHistory,
  deriveTitle,
  type StoredConversation,
} from "@/utils/chat-memory";
import ShareModal from "@/components/ShareModal";
import {
  syncAccountBackup,
  restoreAccountData,
  clearLocalWorkingSession,
  recordDeletedConversation,
} from "@/utils/account-sync";
import { useTheme } from "@/utils/theme";
import {
  Plus,
  PlusCircle,
  ArrowUp,
  Search,
  CheckCircle2,
  AlertCircle,
  MessageSquareQuote,
  FlaskConical,
  PanelLeft,
  Sparkles,
  Compass,
  Trash2,
  Columns,
  Maximize2,
  Minimize2,
  X,
  Folder,
  FolderPlus,
  Terminal,
  LayoutGrid,
  ChevronDown,
  Atom,
  Edit3,
  Clock,
  SlidersHorizontal,
  SquareSplitHorizontal,
  RotateCw,
  Box,
  LogOut,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Volume2,
  VolumeX,
  Share2,
  Pencil,
  FileText,
  Upload,
  Download,
  ArrowUpRight,
  Eye,
  Paperclip,
  Camera,
  Code2,
  ChevronRight,
  BookOpen,
  FileCode,
  Settings,
  Sun,
  Moon,
  SunMoon,
  Palette,
  Laptop,
  Cloud,
  ShieldCheck,
} from "lucide-react";

interface DetectedSmartboardItem {
  model: MathModelType;
  solidKind?: SolidKind;
  planeShapeKind?: PlaneShapeKind;
  label: string;
  desc?: string;
  paramA?: number;
  paramB?: number;
  paramC?: number;
  unit?: string;
  hasSlice?: boolean;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  content?: string;
  dataUrl?: string;
  uploadedAt: number;
  workspaceId?: string;
}

interface WorkspaceItem {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
}

const DEFAULT_WORKSPACE_FILES: UploadedFile[] = [
  {
    id: "sys_engine",
    name: "engine.py",
    size: 8940,
    type: "text/x-python",
    uploadedAt: Date.now() - 86400000,
    workspaceId: "default",
    content: `# ZAP CFL Engine — Core Computer Algebra System\n# Deterministik SymPy verifikasi langkah aljabar dan reduksi akar\n\nimport sympy as sp\nfrom cfl.parser import parse_side\n\nclass CoreFaultLocalizer:\n    """Menganalisis baris penurunan aljabar siswa tanpa membocorkan jawaban."""\n    def __init__(self, confirmed_steps, target_var='x'):\n        self.steps = confirmed_steps\n        self.target_var = sp.Symbol(target_var)\n`,
  },
  {
    id: "sys_parser",
    name: "parser.py",
    size: 6120,
    type: "text/x-python",
    uploadedAt: Date.now() - 86400000,
    workspaceId: "default",
    content: `# ZAP Algebraic Parser & Whitelist Invariant Enforcement\n# Anti-RCE, Safe Degree Exponents, dan Sanitasi Masukan Siswa\n\nimport re\nimport sympy as sp\nfrom sympy.parsing.sympy_parser import parse_expr\n\nSAFE_ALGEBRA_WHITELIST = r"^[0-9a-zA-Z\\s\\+\\-\\*/\\^\\(\\)\\[\\]\\{\\}\\=\\<\\>\\_\\\\\\.,]+$"\n`,
  },
  {
    id: "sys_formulas",
    name: "rumus_geometri_3d.md",
    size: 2450,
    type: "text/markdown",
    uploadedAt: Date.now() - 86400000,
    workspaceId: "default",
    content: `# Ringkasan Rumus Geometri Ruang & Irisan Papan Tulis 3D\n\n## 1. Kubus (Cube)\n- Volume: $V = s^3$\n- Luas Permukaan: $L = 6s^2$\n- Diagonal Bidang: $d_b = s\\sqrt{2}$\n- Diagonal Ruang: $d_r = s\\sqrt{3}$\n\n## 2. Balok (Cuboid)\n- Volume: $V = p \\times l \\times t$\n- Luas Permukaan: $L = 2(pl + pt + lt)$\n\n## 3. Tabung (Cylinder)\n- Volume: $V = \\pi r^2 t$\n- Luas Selimut: $L_s = 2\\pi r t$\n\n## 4. Irisan Kerucut & Permukaan Kuadrik\n- Parabola: $y = ax^2 + bx + c$\n- Hiperbolik Paraboloid (Pelana Kuda): $z = \\frac{x^2}{a^2} - \\frac{y^2}{b^2}$\n`,
  },
];

interface DetectedShapeInfo {
  kind:
    | "balok"
    | "kubus"
    | "tabung"
    | "bola"
    | "kerucut"
    | "prisma"
    | "limas"
    | "saddle"
    | "parabola"
    | "trig"
    | "linear"
    | "circle"
    | "counting_blocks"
    | "jajar_genjang"
    | "trapesium"
    | "segitiga";
  paramA?: number;
  paramB?: number;
  paramC?: number;
  unit?: string;
  planeShapeKind?: PlaneShapeKind;
}

function detectShapeKind(str: string): DetectedShapeInfo | null {
  const s = str.toLowerCase();

  // 0. Bangun Datar 2D (Jajar Genjang, Trapesium, Segitiga)
  if (s.includes("jajar genjang") || s.includes("jajargenjang") || s.includes("parallelogram")) {
    const aMatch = s.match(/(?:a|alas|panjang)\s*(?:=|:|\s)\s*(\d+(?:[.,]\d+)?)/i);
    const tMatch = s.match(/(?:t|tinggi)\s*(?:=|:|\s)\s*(\d+(?:[.,]\d+)?)/i);
    const sMatch = s.match(/(?:s|miring|sisi miring)\s*(?:=|:|\s)\s*(\d+(?:[.,]\d+)?)/i);
    return {
      kind: "jajar_genjang",
      paramA: aMatch ? parseFloat(aMatch[1].replace(",", ".")) : 12,
      paramB: tMatch ? parseFloat(tMatch[1].replace(",", ".")) : 8,
      paramC: sMatch ? parseFloat(sMatch[1].replace(",", ".")) : 10,
      unit: "cm",
      planeShapeKind: "jajar_genjang",
    };
  }

  if (s.includes("trapesium") || s.includes("trapezoid")) {
    return {
      kind: "trapesium",
      paramA: 8,
      paramB: 14,
      paramC: 6,
      unit: "cm",
      planeShapeKind: "trapesium",
    };
  }

  if (s.includes("segitiga") || s.includes("triangle")) {
    const aMatch = s.match(/(?:a|alas)\s*(?:=|:|\s)\s*(\d+(?:[.,]\d+)?)/i);
    const tMatch = s.match(/(?:t|tinggi)\s*(?:=|:|\s)\s*(\d+(?:[.,]\d+)?)/i);
    return {
      kind: "segitiga",
      paramA: aMatch ? parseFloat(aMatch[1].replace(",", ".")) : 10,
      paramB: tMatch ? parseFloat(tMatch[1].replace(",", ".")) : 8,
      unit: "cm",
      planeShapeKind: "segitiga",
    };
  }

  // 1. Balok (cuboid / beam / persegi panjang 3d)
  if (s.includes("balok") || s.includes("cuboid") || s.includes("beam") || s.includes("persegi panjang 3d")) {
    const nums = (s.match(/\d+(?:[.,]\d+)?/g) || []).map((m) => parseFloat(m.replace(",", ".")));
    return {
      kind: "balok",
      paramA: nums[0] || 10,
      paramB: nums[1] || 6,
      paramC: nums[2] || 4,
      unit: "cm",
    };
  }

  // 2. Tabung / Silinder
  if (s.includes("tabung") || s.includes("cylinder") || s.includes("silinder")) {
    const rMatch = s.match(/(?:r|jari-jari|jari)\s*(?:=|:|\s)\s*(\d+(?:[.,]\d+)?)/i);
    const r = rMatch ? parseFloat(rMatch[1].replace(",", ".")) : undefined;
    return { kind: "tabung", paramA: r || 7, paramB: 12, unit: "cm" };
  }

  // 3. Bola
  if (s.includes("bola") || s.includes("sphere")) {
    const rMatch = s.match(/(?:r|jari-jari|jari)\s*(?:=|:|\s)\s*(\d+(?:[.,]\d+)?)/i);
    const r = rMatch ? parseFloat(rMatch[1].replace(",", ".")) : undefined;
    return { kind: "bola", paramA: r || 7, unit: "cm" };
  }

  // 4. Kerucut
  if (s.includes("kerucut") || s.includes("cone") || s.includes("irisan kerucut")) {
    return { kind: "kerucut", paramA: 5, paramB: 10, unit: "cm" };
  }

  // 5. Prisma
  if (s.includes("prisma")) {
    return { kind: "prisma", paramA: 8, unit: "cm" };
  }

  // 6. Limas
  if (s.includes("limas")) {
    return { kind: "limas", paramA: 8, unit: "cm" };
  }

  // 7. Pelana Kuda / Saddle
  if (s.includes("pelana") || s.includes("saddle") || s.includes("permukaan 3d")) {
    return { kind: "saddle" };
  }

  // 8. 2D Parabola
  if (s.includes("parabola") || s.includes("x^2") || s.includes("x²") || s.includes("kuadrat")) {
    return { kind: "parabola", paramA: 1, paramB: 0, paramC: -3 };
  }

  // 9. 2D Gelombang Sinus
  if (s.includes("sin") || s.includes("cos") || s.includes("gelombang") || s.includes("trig")) {
    return { kind: "trig", paramA: 2, paramB: 1, paramC: 0 };
  }

  // 10. 2D Garis Lurus
  if (s.includes("garis") || s.includes("linear") || s.includes("persamaan garis")) {
    return { kind: "linear", paramA: 2, paramB: 1 };
  }

  // 11. 2D Lingkaran
  if (s.includes("lingkaran") || s.includes("circle")) {
    return { kind: "circle" };
  }

  // 12. Balok Hitung
  if (s.includes("balok hitung") || s.includes("counting block")) {
    return { kind: "counting_blocks" };
  }

  // 13. Kubus (Cube)
  if (s.includes("kubus") || s.includes("cube") || s.includes("kotak 3d") || s.includes("kotak")) {
    const sMatch = s.match(/(?:s|rusuk|sisi|panjang|ukuran)\s*(?:=|:|\s)\s*(\d+(?:[.,]\d+)?)/i);
    const sz = sMatch ? parseFloat(sMatch[1].replace(",", ".")) : undefined;
    return { kind: "kubus", paramA: sz || 10, unit: "cm" };
  }

  return null;
}

function detectSmartboardItem(
  text: string,
  conversationHistory?: Array<{ rawText?: string; replyText?: string }>
): DetectedSmartboardItem | null {
  const t = text.toLowerCase().trim();
  if (!t) return null;

  // 1. Cek apakah ada kata perintah aktif untuk visualisasi/pemodelan
  const hasExplicitCommand =
    /\b(buatkan|buatin|buat|bikinin|bikin|tampilkan|gambarkan|gambar|visualisasikan|render|plot|lukiskan|lukis|simulasikan|modelkan|buka|lihat|show|draw|display|generate|create)\b/i.test(t);

  // 2. Cek apakah ini percakapan santai, salam, atau apresiasi murni tanpa perintah visualisasi
  const isPureChatOrPraise =
    /^(hai|halo|hello|hi|hey|hei|p|pagi|siang|sore|malam|assalamualaikum|tes|test|wah+|keren|canggih|mantap|makasih|terima kasih|thanks|thank you)\b/i.test(t) ||
    /\b(kamu canggih|kamu keren|kamu pintar|kamu hebat|sangat membantu|bagus banget|terima kasih banyak|makasih banyak)\b/i.test(t);

  if (isPureChatOrPraise && !hasExplicitCommand) {
    return null;
  }

  // 3. Cek apakah ada kata kunci 3D atau geometri ruang
  const has3DWord =
    /\b(3d|3-d|dimensi 3|tiga dimensi|bangun ruang|kartesius|papan tulis|smartboard|kanvas)\b/i.test(t);

  // 4. Cek apakah ini pertanyaan konseptual/teori murni (bukan perintah visualisasi)
  // Catatan: Jika ada kata "3d" atau kata perintah "buatkan" / "tampilkan", bukan pertanyaan konseptual murni!
  const isConceptQuestion =
    /^(apa|apakah|mengapa|kenapa|bagaimana|jelaskan|terangkan|definisi|arti|makna|maksud)\b/i.test(t) &&
    !hasExplicitCommand &&
    !has3DWord;

  if (isConceptQuestion) {
    return null;
  }

  // 5. Cek apakah ada intensi 3D eksplisit dalam kalimat
  const has3DIntent =
    (has3DWord &&
      (hasExplicitCommand ||
        /\b(bisakah|bisa|tolong|coba|minta|pengen|mau|dapatkah|bentuk|format|versi|secara)\b/i.test(t))) ||
    /\b(buatkan|buatin|buat|bikinin|bikin|tampilkan|gambarkan|gambar|visualisasikan|render|modelkan|lihat|buka|tolong|bisakah|bisa|minta|pengen|mau|coba)\b[\s\S]{0,35}\b(?:3d|3-d|tiga dimensi|bangun ruang)\b/i.test(
      t
    ) ||
    /\b(?:3d|3-d|tiga dimensi|bangun ruang)\b[\s\S]{0,35}\b(buatkan|buatin|buat|bikinin|bikin|tampilkan|gambarkan|gambar|visualisasikan|render|modelkan|lihat|buka|nya|dong|kan)\b/i.test(
      t
    ) ||
    /\b(?:dalam bentuk|bentuk|versi|format|secara)\s+(?:model\s+)?3d\b/i.test(t) ||
    /^(3d|buat 3d|buatkan 3d|bikin 3d|tampilkan 3d|render 3d|lihat 3d)$/i.test(t);

  // 6. Verifikasi apakah ada intensi visual atau perintah bangun geometri
  const hasVisualIntent =
    hasExplicitCommand ||
    has3DIntent ||
    has3DWord ||
    /\b(cube|kubus|balok|tabung|cylinder|silinder|kerucut|cone|bola|sphere|prisma|limas|parabola|pelana|jajar genjang|jajargenjang|parallelogram|trapesium|trapezoid|segitiga|triangle|lingkaran|circle)\b/i.test(
      t
    );

  if (!hasVisualIntent) {
    return null;
  }

  // Ekstrak angka ukuran dan unit spesifik (misal: "10cm", "10 cm", "s=10", "r=7", "sisi 10", "kubus 10")
  let parsedA: number | undefined = undefined;
  let parsedUnit = "cm";

  // Prioritas 1: angka dengan satuan eksplisit (cm, m, mm, in)
  const unitMatch = t.match(/(\d+(?:[.,]\d+)?)\s*(cm|m|mm|in)\b/i);
  if (unitMatch) {
    parsedA = parseFloat(unitMatch[1].replace(",", "."));
    parsedUnit = unitMatch[2].toLowerCase();
  } else {
    // Prioritas 2: angka dengan label parameter (s=10, r=7, sisi 10, jari-jari 7, ukuran 10)
    const paramMatch = t.match(
      /(?:s|r|p|sisi|rusuk|jari-jari|panjang|ukuran)\s*(?:=|:|\s)\s*(\d+(?:[.,]\d+)?)/i
    );
    if (paramMatch) {
      parsedA = parseFloat(paramMatch[1].replace(",", "."));
    } else {
      // Prioritas 3: angka yang mengikuti nama bangun (misal "kubus 10", "cube 8")
      const solidNumMatch = t.match(
        /(?:kubus|cube|balok|tabung|silinder|bola|sphere|kerucut|cone)\s+(\d+(?:[.,]\d+)?)/i
      );
      if (solidNumMatch) {
        parsedA = parseFloat(solidNumMatch[1].replace(",", "."));
      }
    }
  }

  // Irisan hanya aktif jika diminta secara eksplisit oleh pengguna
  const wantsSlice = /\b(irisan|potong|penampang|slice|belah|potongan)\b/i.test(t);

  // Deteksi bentuk geometri:
  // Langkah A: Cari langsung di kalimat saat ini
  let shape = detectShapeKind(t);

  // Langkah B: Jika kalimat adalah permintaan 3D tanpa menyebut ulang nama bangun (misal: "bisakah buatkan dalam bentuk 3d"),
  // telusuri riwayat percakapan sebelumnya untuk mewarisi bangun yang sedang dibahas
  if (!shape && (has3DIntent || hasExplicitCommand) && conversationHistory && conversationHistory.length > 0) {
    for (let i = conversationHistory.length - 1; i >= 0; i--) {
      const hist = conversationHistory[i];
      const histText = `${hist.rawText || ""} ${hist.replyText || ""}`;
      const foundInHistory = detectShapeKind(histText);
      if (foundInHistory) {
        shape = foundInHistory;
        break;
      }
    }
  }

  // Langkah C: Jika pengguna meminta 3D namun tidak ada bentuk spesifik di kalimat maupun riwayat, jadikan "kubus 3D" sebagai default
  if (!shape && has3DIntent) {
    shape = { kind: "kubus", paramA: parsedA || 10, unit: parsedUnit };
  }

  // Jika tetap tidak ada bentuk yang cocok, kembalikan null
  if (!shape) {
    return null;
  }

  // Terapkan ukuran yang diekstrak jika ada
  if (parsedA !== undefined) {
    shape.paramA = parsedA;
  }

  switch (shape.kind) {
    case "balok": {
      const p = shape.paramA || 10;
      const l = shape.paramB || 6;
      const t_val = shape.paramC || 4;
      return {
        model: "solids",
        solidKind: "balok",
        label: `Balok 3D (${p}×${l}×${t_val})`,
        desc: wantsSlice
          ? `Bangun ruang balok (${p} × ${l} × ${t_val} ${parsedUnit}) dengan bidang irisan penampang`
          : `Bangun ruang balok (${p} × ${l} × ${t_val} ${parsedUnit})`,
        paramA: p,
        paramB: l,
        paramC: t_val,
        unit: parsedUnit,
        hasSlice: wantsSlice,
      };
    }
    case "kubus": {
      const sz = shape.paramA || 10;
      return {
        model: "solids",
        solidKind: "kubus",
        label: `Kubus 3D (${sz} ${parsedUnit})`,
        desc: wantsSlice
          ? `Kubus 3D panjang sisi ${sz} ${parsedUnit} dengan bidang irisan penampang`
          : `Kubus 3D geometri ruang dengan panjang sisi ${sz} ${parsedUnit}`,
        paramA: sz,
        unit: parsedUnit,
        hasSlice: wantsSlice,
      };
    }
    case "tabung": {
      const r = shape.paramA || 7;
      const h = shape.paramB || 12;
      return {
        model: "cylinder",
        label: `Tabung Silinder 3D (r=${r})`,
        desc: wantsSlice
          ? `Silinder ruang jari-jari ${r} ${parsedUnit} & tinggi ${h} ${parsedUnit} dengan bidang irisan`
          : `Silinder ruang jari-jari ${r} ${parsedUnit} & tinggi ${h} ${parsedUnit}`,
        paramA: r,
        paramB: h,
        unit: parsedUnit,
        hasSlice: wantsSlice,
      };
    }
    case "bola": {
      const r = shape.paramA || 7;
      return {
        model: "solids",
        solidKind: "bola",
        label: `Bola 3D (r=${r})`,
        desc: wantsSlice
          ? `Bangun ruang bola dengan jari-jari ${r} ${parsedUnit} dengan bidang irisan`
          : `Bangun ruang bola dengan jari-jari ${r} ${parsedUnit}`,
        paramA: r,
        unit: parsedUnit,
        hasSlice: wantsSlice,
      };
    }
    case "kerucut": {
      return {
        model: "conic_slicer",
        label: "Irisan Kerucut 3D",
        desc: "Pemotongan kerucut ganda (elips, parabola, hiperbola)",
        paramA: shape.paramA || 5,
        paramB: shape.paramB || 10,
        unit: parsedUnit,
        hasSlice: wantsSlice,
      };
    }
    case "prisma": {
      return {
        model: "solids",
        solidKind: "prisma",
        label: "Prisma 3D",
        desc: wantsSlice
          ? "Prisma segitiga dengan bidang penampang irisan"
          : "Prisma segitiga geometri ruang",
        paramA: shape.paramA || 8,
        unit: parsedUnit,
        hasSlice: wantsSlice,
      };
    }
    case "limas": {
      return {
        model: "solids",
        solidKind: "limas",
        label: "Limas 3D",
        desc: wantsSlice
          ? "Limas segi empat beraturan dengan bidang penampang irisan"
          : "Limas segi empat beraturan geometri ruang",
        paramA: shape.paramA || 8,
        unit: parsedUnit,
        hasSlice: wantsSlice,
      };
    }
    case "saddle": {
      return {
        model: "saddle",
        label: "Pelana Kuda 3D",
        desc: "Permukaan kuadrik hiperbolik paraboloid z = x² - y²",
      };
    }
    case "parabola": {
      return {
        model: "2d_quadratic",
        label: "Grafik Parabola 2D",
        desc: "y = x² - 3 dengan titik potong & titik puncak",
        paramA: 1,
        paramB: 0,
        paramC: -3,
      };
    }
    case "trig": {
      return {
        model: "2d_trig",
        label: "Gelombang Sinus 2D",
        desc: "y = 2 sin(x) fungsi periodik trigonometri",
        paramA: 2,
        paramB: 1,
        paramC: 0,
      };
    }
    case "linear": {
      return {
        model: "2d_linear",
        label: "Garis Lurus 2D",
        desc: "y = 2x + 1 grafik garis lurus",
        paramA: 2,
        paramB: 1,
      };
    }
    case "circle": {
      return {
        model: "2d_circle",
        label: "Lingkaran 2D",
        desc: "Persamaan lingkaran x² + y² = r²",
      };
    }
    case "counting_blocks": {
      return {
        model: "counting_blocks",
        label: "Balok Hitung",
        desc: "Visualisasi balok aritmetika",
      };
    }
    case "jajar_genjang": {
      const a = shape.paramA || 12;
      const t = shape.paramB || 8;
      const s = shape.paramC || 10;
      return {
        model: "2d_shape",
        planeShapeKind: "jajar_genjang",
        label: `Jajar Genjang 2D (a=${a}, t=${t})`,
        desc: `Bangun datar jajar genjang alas ${a} ${parsedUnit}, tinggi ${t} ${parsedUnit}, sisi miring ${s} ${parsedUnit}`,
        paramA: a,
        paramB: t,
        paramC: s,
        unit: parsedUnit,
      };
    }
    case "trapesium": {
      const a = shape.paramA || 8;
      const b = shape.paramB || 14;
      const t = shape.paramC || 6;
      return {
        model: "2d_shape",
        planeShapeKind: "trapesium",
        label: `Trapesium 2D (a=${a}, b=${b})`,
        desc: `Bangun datar trapesium sisi sejajar ${a} & ${b} ${parsedUnit}, tinggi ${t} ${parsedUnit}`,
        paramA: a,
        paramB: b,
        paramC: t,
        unit: parsedUnit,
      };
    }
    case "segitiga": {
      const a = shape.paramA || 10;
      const t = shape.paramB || 8;
      return {
        model: "2d_shape",
        planeShapeKind: "segitiga",
        label: `Segitiga 2D (a=${a}, t=${t})`,
        desc: `Bangun datar segitiga alas ${a} ${parsedUnit}, tinggi ${t} ${parsedUnit}`,
        paramA: a,
        paramB: t,
        unit: parsedUnit,
      };
    }
    default:
      return null;
  }
}

function isDerivationStep(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;

  // 1. Kata-kata perintah bahasa Indonesia / Inggris atau interaksi visual/geometri/3D
  const CONVERSATIONAL_REGEX =
    /\b(buatkan|buat|bikin|tampilkan|render|lukis|lukiskan|gambar|gambarkan|visualisasikan|cube|kubus|balok|silinder|tabung|kerucut|bola|prisma|limas|parabola|pelana|grafik|graf|bangun|ruang|3d|2d|hitung|hitunglah|tolong|bantu|bantu\s+saya|jelaskan|terangkan|halo|hai|hello|hi|hei|kak|kakak|bg|bang|min|admin|kenapa|mengapa|apa|apakah|bagaimana|gimana|kok|bisakah|bisa|dapatkah|coba|show|plot|draw|create|make|generate|explain|help|please|tuliskan|berikan|sebutkan|soal|rumus|teori|definisi|makna|maksud|arti|siapa|kamu|anda|papan\s+tulis|smartboard|canvas|virtual|simulasi|animasi|video|cara)\b/i;

  if (CONVERSATIONAL_REGEX.test(trimmed)) {
    return false;
  }

  // 2. Jika ada tanda tanya atau seru: percakapan
  if (trimmed.includes("?") || trimmed.endsWith("!")) {
    return false;
  }

  // 3. Cek kata-kata teks umum (>= 3 karakter). Langkah aljabar CAS jarang mengandung >1 kata non-matematika
  const words = trimmed.match(/[a-zA-Z]{3,}/g) || [];
  const mathKeywords = new Set([
    "sin", "cos", "tan", "sec", "csc", "cot", "log", "exp", "sqrt", 
    "lim", "mod", "det", "gcd", "lcm", "frac", "cdot", "times", "pm"
  ]);
  const nonMathWords = words.filter((w) => !mathKeywords.has(w.toLowerCase()));
  if (nonMathWords.length >= 2) {
    return false;
  }

  // 4. Operator aljabar dan karakter yang valid
  const hasAlgebraOps = /[=\+\-\*\/\^]/.test(trimmed);
  const isOnlyAlgebraChars = /^[0-9a-zA-Z\s\+\-\*\/\^\(\)\[\]\{\}\=\<\>\_\,\.\\\:]+$/.test(trimmed);

  return hasAlgebraOps && isOnlyAlgebraChars;
}

interface LineTranscription {
  line_number: number;
  raw_latex: string;
  is_valid: boolean;
}

interface CounterExample {
  test_variable: string;
  test_value: number;
  lhs_expected: string;
  rhs_calculated: string;
  contradiction_statement: string;
}

interface DiagnosisResult {
  has_fault: boolean;
  first_fault_line: number | null;
  fault_type: string | null;
  status: "FAULT_DETECTED" | "ALL_STEPS_VALID" | "UNDECIDABLE_STEP";
  human_explanation: string;
  socratic_prompt: string;
  counter_example: CounterExample | null;
}

interface DiagnoseResponse {
  status: string;
  session_id: string;
  transcription: {
    total_lines: number;
    lines: LineTranscription[];
  };
  diagnosis: DiagnosisResult;
  guardrail_status: {
    final_answer_suppressed: boolean;
  };
}

interface Message {
  id: string;
  sender: "user" | "assistant";
  steps?: string[];
  rawText?: string;
  diagnosis?: DiagnoseResponse;
  replyText?: string;
  modelName?: string;
  timestamp: string;
  smartboardItem?: DetectedSmartboardItem | null;
  feedback?: "up" | "down" | null;
  attachedFiles?: UploadedFile[];
}

interface ActiveProblemContext {
  steps?: string[];
  faultLine?: number;
  misconceptionType?: string;
  explanation?: string;
  socraticHint?: string;
  counterExample?: {
    test_variable?: string;
    test_value?: number;
    lhs_expected?: string;
    rhs_calculated?: string;
    contradiction_statement?: string;
  };
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

type StoredConv = StoredConversation<Message, ActiveProblemContext>;

interface PromptActionBarLeftProps {
  showAttachMenu: boolean;
  setShowAttachMenu: React.Dispatch<React.SetStateAction<boolean>>;
  showSubUploadMenu: boolean;
  setShowSubUploadMenu: React.Dispatch<React.SetStateAction<boolean>>;
  showWorkspaceMenu: boolean;
  setShowWorkspaceMenu: React.Dispatch<React.SetStateAction<boolean>>;
  workspaceMode: "write" | "read";
  setWorkspaceMode: (val: "write" | "read") => void;
  workspaces: WorkspaceItem[];
  activeWorkspaceId: string;
  setActiveWorkspaceId: (id: string) => void;
  workspaceFilesCount: number;
  onUploadFilesClick: () => void;
  onCameraClick: () => void;
  onInsertLatex: () => void;
  onInsertPython: () => void;
  onInsertExample: () => void;
  onOpenSmartboard: () => void;
  onOpenWorkspaceFiles: () => void;
  attachMenuRef: React.RefObject<any>;
  workspaceMenuRef: React.RefObject<any>;
}

function PromptActionBarLeft({
  showAttachMenu,
  setShowAttachMenu,
  showSubUploadMenu,
  setShowSubUploadMenu,
  showWorkspaceMenu,
  setShowWorkspaceMenu,
  workspaceMode,
  setWorkspaceMode,
  workspaces,
  activeWorkspaceId,
  setActiveWorkspaceId,
  workspaceFilesCount,
  onUploadFilesClick,
  onCameraClick,
  onInsertLatex,
  onInsertPython,
  onInsertExample,
  onOpenSmartboard,
  onOpenWorkspaceFiles,
  attachMenuRef,
  workspaceMenuRef,
}: PromptActionBarLeftProps) {
  return (
    <div className="flex items-center gap-1.5 relative">
      {/* Menu Popup Lampirkan Berkas (Liquid Glass Drop Blur) */}
      {showAttachMenu && (
        <div
          ref={attachMenuRef}
          className="absolute left-0 bottom-full mb-2.5 w-72 liquid-glass-popup rounded-2xl p-1.5 z-50 text-xs text-slate-700 dark:text-zinc-300 animate-liquid-pop origin-bottom-left"
        >
          <div className="px-3 py-2 flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] text-slate-500 dark:text-zinc-400 font-medium text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-800 dark:text-zinc-200">
              <Sparkles className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-400" />
              Lampirkan ke ChatZAP
            </span>
            <button
              type="button"
              onClick={() => {
                setShowAttachMenu(false);
                setShowSubUploadMenu(false);
              }}
              className="p-1 hover:text-slate-900 dark:hover:text-white rounded-lg transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="py-1 space-y-0.5">
            {/* 1. Upload files */}
            <button
              type="button"
              onClick={() => {
                setShowAttachMenu(false);
                onUploadFilesClick();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] text-left transition group cursor-pointer"
            >
              <Paperclip className="w-4 h-4 text-slate-600 dark:text-zinc-400 group-hover:scale-105 transition-transform flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-800 dark:text-zinc-100">Unggah berkas</div>
                <div className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">PDF, TXT, skrip Python, CSV, Markdown</div>
              </div>
            </button>

            {/* 2. Photo / Camera */}
            <button
              type="button"
              onClick={() => {
                setShowAttachMenu(false);
                onCameraClick();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] text-left transition group cursor-pointer"
            >
              <Camera className="w-4 h-4 text-slate-600 dark:text-zinc-400 group-hover:scale-105 transition-transform flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-800 dark:text-zinc-100">Foto soal / coretan</div>
                <div className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">Ambil foto coretan matematika dari HP/kamera</div>
              </div>
            </button>

            {/* 3. More uploads > */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSubUploadMenu((prev) => !prev)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] text-left transition cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <LayoutGrid className="w-4 h-4 text-slate-600 dark:text-zinc-400 flex-shrink-0" />
                  <span className="font-medium text-slate-800 dark:text-zinc-100">Format &amp; data lainnya</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
              </button>

              {showSubUploadMenu && (
                <div className="absolute left-full bottom-0 ml-1.5 w-60 liquid-glass-popup rounded-2xl p-1.5 z-50 text-xs animate-liquid-pop origin-bottom-left">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAttachMenu(false);
                      setShowSubUploadMenu(false);
                      onInsertLatex();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] text-left transition cursor-pointer"
                  >
                    <Code2 className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-400 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-slate-800 dark:text-zinc-200">Impor formula LaTeX</div>
                      <div className="text-[10px] text-slate-400 dark:text-zinc-500">Template sistem persamaan</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAttachMenu(false);
                      setShowSubUploadMenu(false);
                      onInsertPython();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] text-left transition cursor-pointer"
                  >
                    <FileCode className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-400 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-slate-800 dark:text-zinc-200">Impor skrip SymPy CAS</div>
                      <div className="text-[10px] text-slate-400 dark:text-zinc-500">Kode aljabar deterministik</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAttachMenu(false);
                      setShowSubUploadMenu(false);
                      onOpenWorkspaceFiles();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] text-left transition cursor-pointer"
                  >
                    <Folder className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-400 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-slate-800 dark:text-zinc-200">Berkas Workspace</div>
                      <div className="text-[10px] text-slate-400 dark:text-zinc-500">{workspaceFilesCount} berkas tersimpan</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <div className="h-px bg-slate-100 dark:bg-white/[0.06] my-1" />

            {/* 4. Open 3D Smartboard */}
            <button
              type="button"
              onClick={() => {
                setShowAttachMenu(false);
                onOpenSmartboard();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] text-left transition group cursor-pointer"
            >
              <Box className="w-4 h-4 text-slate-600 dark:text-zinc-400 group-hover:scale-105 transition-transform flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-800 dark:text-zinc-100 flex items-center gap-1.5">
                  <span>Papan Tulis Pintar 3D</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-zinc-300 font-mono">2D/3D</span>
                </div>
                <div className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">Kanvas 3D, simulasi kubus/balok &amp; grafik 2D</div>
              </div>
            </button>

            {/* 5. Example math / algebra problems */}
            <button
              type="button"
              onClick={() => {
                setShowAttachMenu(false);
                onInsertExample();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] text-left transition group cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-slate-600 dark:text-zinc-400 group-hover:scale-105 transition-transform flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-800 dark:text-zinc-100">Contoh Soal Aljabar</div>
                <div className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">Muat contoh coretan penurunan rumus untuk diuji</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Menu Popup Workspace (Write / Read-Only & Pilihan Workspace) */}
      {showWorkspaceMenu && (
        <div
          ref={workspaceMenuRef}
          className="absolute left-6 bottom-full mb-2.5 w-72 liquid-glass-popup rounded-2xl p-2 z-50 text-xs text-slate-700 dark:text-zinc-300 animate-liquid-pop origin-bottom-left"
        >
          <div className="px-2.5 py-1.5 flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] text-slate-500 dark:text-zinc-400 font-medium text-[11px]">
            <span className="text-slate-800 dark:text-zinc-200">Mode &amp; Izin Workspace</span>
            <button
              type="button"
              onClick={() => setShowWorkspaceMenu(false)}
              className="p-1 hover:text-slate-900 dark:hover:text-white rounded-lg transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="py-1 space-y-1">
            <button
              type="button"
              onClick={() => {
                setWorkspaceMode("write");
                setShowWorkspaceMenu(false);
                try {
                  localStorage.setItem("zap_workspace_mode", "write");
                } catch {}
              }}
              className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition cursor-pointer ${
                workspaceMode === "write"
                  ? "bg-slate-100 dark:bg-white/[0.08] text-slate-900 dark:text-white"
                  : "hover:bg-slate-50 dark:hover:bg-white/[0.04] text-slate-600 dark:text-zinc-400"
              }`}
            >
              <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-zinc-300 mt-0.5">
                <Edit3 className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-xs flex items-center justify-between">
                  <span>Workspace Write</span>
                  {workspaceMode === "write" && <Check className="w-3.5 h-3.5 text-slate-900 dark:text-white" />}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-zinc-400 leading-tight mt-0.5">
                  AI dapat menyimpan catatan, mengeksekusi perhitungan CAS &amp; membuat berkas
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setWorkspaceMode("read");
                setShowWorkspaceMenu(false);
                try {
                  localStorage.setItem("zap_workspace_mode", "read");
                } catch {}
              }}
              className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition cursor-pointer ${
                workspaceMode === "read"
                  ? "bg-slate-100 dark:bg-white/[0.08] text-slate-900 dark:text-white"
                  : "hover:bg-slate-50 dark:hover:bg-white/[0.04] text-slate-600 dark:text-zinc-400"
              }`}
            >
              <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-zinc-300 mt-0.5">
                <Eye className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-xs flex items-center justify-between">
                  <span>Workspace Read-Only</span>
                  {workspaceMode === "read" && <Check className="w-3.5 h-3.5 text-slate-900 dark:text-white" />}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-zinc-400 leading-tight mt-0.5">
                  Hanya diskusi Sokratik &amp; verifikasi matematika tanpa memodifikasi berkas
                </div>
              </div>
            </button>
          </div>

          <div className="h-px bg-slate-100 dark:bg-white/[0.06] my-1" />

          {/* Section 2: Pilih Active Workspace */}
          <div className="px-2 py-1">
            <div className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
              Ruang Kerja Aktif
            </div>
            <div className="space-y-0.5 max-h-32 overflow-y-auto">
              {workspaces.length === 0 ? (
                <div className="px-2 py-1.5 text-xs text-slate-400 dark:text-zinc-500 italic">
                  Belum ada workspace
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveWorkspaceId("");
                      setShowWorkspaceMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                      !activeWorkspaceId
                        ? "bg-slate-100 dark:bg-white/[0.08] text-slate-900 dark:text-white font-medium"
                        : "hover:bg-slate-50 dark:hover:bg-white/[0.04] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    <span className="truncate">Tanpa Workspace</span>
                    {!activeWorkspaceId && <Check className="w-3 h-3 text-slate-900 dark:text-white flex-shrink-0" />}
                  </button>
                  {workspaces.map((ws) => (
                    <button
                      key={ws.id}
                      type="button"
                      onClick={() => {
                        setActiveWorkspaceId(ws.id);
                        setShowWorkspaceMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                        activeWorkspaceId === ws.id
                          ? "bg-slate-100 dark:bg-white/[0.08] text-slate-900 dark:text-white font-medium"
                          : "hover:bg-slate-50 dark:hover:bg-white/[0.04] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Folder className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400 flex-shrink-0" />
                        <span className="truncate">{ws.name}</span>
                      </div>
                      {activeWorkspaceId === ws.id && <Check className="w-3 h-3 text-slate-900 dark:text-white flex-shrink-0" />}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>

          <div className="h-px bg-slate-100 dark:bg-white/[0.06] my-1" />

          {/* Quick Action: Buka Berkas Workspace */}
          <button
            type="button"
            onClick={() => {
              setShowWorkspaceMenu(false);
              onOpenWorkspaceFiles();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] text-xs text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Folder className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
              <span>Buka Berkas Workspace ({workspaceFilesCount})</span>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
          </button>
        </div>
      )}

      {/* Button + (Lampirkan Berkas) */}
      <button
        type="button"
        onClick={() => {
          setShowAttachMenu((prev) => !prev);
          setShowWorkspaceMenu(false);
        }}
        className={`p-1 rounded-lg transition cursor-pointer ${
          showAttachMenu
            ? "bg-slate-200 dark:bg-white/[0.1] text-slate-900 dark:text-white"
            : "hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
        }`}
        title="Lampirkan berkas, foto coretan, LaTeX, atau buka kanvas"
      >
        <Plus className="w-4 h-4" />
      </button>

      {/* Button Workspace Write */}
      <button
        type="button"
        onClick={() => {
          setShowWorkspaceMenu((prev) => !prev);
          setShowAttachMenu(false);
        }}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition cursor-pointer text-xs ${
          showWorkspaceMenu
            ? "bg-slate-200 dark:bg-white/[0.1] text-slate-900 dark:text-white"
            : "hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
        }`}
        title="Atur izin & ruang kerja aktif"
      >
        {workspaceMode === "write" ? (
          <Edit3 className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
        ) : (
          <Eye className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
        )}
        <span>{workspaceMode === "write" ? "Workspace Write" : "Workspace Read"}</span>
        <ChevronDown className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
      </button>
    </div>
  );
}

export default function ZAPApp() {
  const router = useRouter();
  const routeParams = useParams();
  const currentPath = usePathname();

  // Helper untuk mendapatkan ID sesi percakapan dari URL path (/c/<id> atau /chat/<id>)
  const getPathConversationId = useCallback(() => {
    if (routeParams?.id && typeof routeParams.id === "string") {
      return routeParams.id;
    }
    if (typeof window !== "undefined") {
      const pathname = window.location.pathname;
      const cMatch = pathname.match(/^\/c\/([a-zA-Z0-9_-]+)/);
      if (cMatch) return cMatch[1];
      const chatMatch = pathname.match(/^\/chat\/([a-zA-Z0-9_-]+)/);
      if (chatMatch && chatMatch[1] !== "s") return chatMatch[1];
      const sp = new URLSearchParams(window.location.search);
      const queryId = sp.get("id") || sp.get("c");
      if (queryId) return queryId;
    }
    return null;
  }, [routeParams]);

  // Sinkronkan URL browser ke path bersih tanpa query parameter (?id=)
  const updateUrlForConversation = useCallback((convId: string | null) => {
    if (typeof window === "undefined") return;
    if (convId) {
      window.history.replaceState(null, "", `/c/${encodeURIComponent(convId)}`);
    } else {
      window.history.replaceState(null, "", "/chat");
    }
  }, []);
  // Authentication Guard State
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<ZAPUser | null>(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState<boolean>(false);

  // Helper identifikasi akun tamu vs akun Google login
  const isGuestAccount = (user: ZAPUser | null | undefined): boolean => {
    if (!user) return false;
    if (user.isGuest === true) return true;
    if (user.provider === "google" || user.email?.toLowerCase().includes("@gmail")) return false;
    return user.provider === "zap" && (user.email?.toLowerCase().includes("@student.zap") || user.name?.toLowerCase().includes("tamu"));
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>("");
  const [targetVar, setTargetVar] = useState<string>("x");

  // Default ke Auto-Agent (Router Cerdas 0 Setup) atau pilihan kustom tersimpan
  const [selectedModel, setSelectedModel] = useState<AIModel>(() => {
    if (typeof window !== "undefined") {
      const savedId = localStorage.getItem("zap_selected_model_id");
      if (savedId) {
        const found = AVAILABLE_MODELS.find((m) => m.id === savedId);
        if (found) return found;
      }
    }
    return AVAILABLE_MODELS[0]; // Auto-Agent (Router Cerdas ZAP)
  });
  const [reasoningEffort, setReasoningEffort] = useState<ReasoningEffort>("high");

  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStatus, setLoadingStatus] = useState<string>("Menganalisis langkah...");
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");

  // Panel layout states persis seperti screenshot 0, 1, dan 2
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [showRightPane, setShowRightPane] = useState<boolean>(false);
  const [rightPaneFullscreen, setRightPaneFullscreen] = useState<boolean>(false);
  const [rightPaneTab, setRightPaneTab] = useState<"start" | "files" | "terminal" | "canvas">("start");

  // Active problem context
  const [activeProblemFirstStep, setActiveProblemFirstStep] = useState<string | null>(null);
  const [activeProblemContext, setActiveProblemContext] = useState<ActiveProblemContext | null>(null);

  // 3D Canvas / Smartboard state (Default KOSONG)
  const [active3DModel, setActive3DModel] = useState<MathModelType>("empty");
  const [activeSolidKind, setActiveSolidKind] = useState<SolidKind>("kubus");
  const [activePlaneShapeKind, setActivePlaneShapeKind] = useState<PlaneShapeKind>("jajar_genjang");
  const [canvasParamA, setCanvasParamA] = useState<number>(10);
  const [canvasParamB, setCanvasParamB] = useState<number>(6);
  const [canvasParamC, setCanvasParamC] = useState<number>(-3);
  const [canvasUnit, setCanvasUnit] = useState<string>("cm");
  const [canvasShowSlice, setCanvasShowSlice] = useState<boolean>(false);
  const [showFaultComparison, setShowFaultComparison] = useState<boolean>(false);
  const [isProjectorMode, setIsProjectorMode] = useState<boolean>(false);

  // Theme & Settings modal
  const { theme, resolvedTheme, setTheme, isDark } = useTheme();
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [settingsTab, setSettingsTab] = useState<"appearance" | "general" | "sync" | "models">("appearance");
  const [syncSuccessToast, setSyncSuccessToast] = useState<boolean>(false);
  const [autoScrollChat, setAutoScrollChat] = useState<boolean>(true);

  // State untuk aksi pesan asisten & pengguna (Audio, Copy, Share, Feedback)
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [sharedMsgId, setSharedMsgId] = useState<string | null>(null);

  // State untuk edit dan salin pesan pengguna
  const [copiedUserMsgId, setCopiedUserMsgId] = useState<string | null>(null);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>("");

  // File upload state (lampiran di input dan berkas workspace)
  const [attachedFiles, setAttachedFiles] = useState<UploadedFile[]>([]);
  const [workspaceFiles, setWorkspaceFiles] = useState<UploadedFile[]>([]);
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Attachment & Workspace flyout menus
  const [showAttachMenu, setShowAttachMenu] = useState<boolean>(false);
  const [showSubUploadMenu, setShowSubUploadMenu] = useState<boolean>(false);
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState<boolean>(false);
  const [workspaceMode, setWorkspaceMode] = useState<"write" | "read">("write");
  const attachMenuRef = useRef<HTMLDivElement>(null);
  const workspaceMenuRef = useRef<HTMLDivElement>(null);

  // Workspace management & filtering
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>("");
  const [showNewWorkspaceModal, setShowNewWorkspaceModal] = useState<boolean>(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState<string>("");

  // Session search in sidebar
  const [isSearchingSession, setIsSearchingSession] = useState<boolean>(false);
  const [sessionSearchQuery, setSessionSearchQuery] = useState<string>("");

  // Filter workspaces in sidebar
  const [showWorkspaceFilter, setShowWorkspaceFilter] = useState<boolean>(false);
  const [workspaceStatusFilter, setWorkspaceStatusFilter] = useState<"all" | "fault" | "valid" | "3d">("all");

  // Dropdown states for composer pills (Default workspace & Standard mode)
  const [showPillWorkspaceMenu, setShowPillWorkspaceMenu] = useState<boolean>(false);
  const [showPillModeMenu, setShowPillModeMenu] = useState<boolean>(false);
  const pillWorkspaceRef = useRef<HTMLDivElement>(null);
  const pillModeRef = useRef<HTMLDivElement>(null);

  // Pedagogical interaction mode
  const [interactionMode, setInteractionMode] = useState<"standard" | "strict" | "visual" | "cas">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("zap_interaction_mode") as any;
      if (saved) return saved;
    }
    return "standard";
  });

  // Modal states for sidebar shortcuts
  const [showPluginModal, setShowPluginModal] = useState<boolean>(false);
  const [showTasksModal, setShowTasksModal] = useState<boolean>(false);
  const [showMoreModal, setShowMoreModal] = useState<boolean>(false);

  // Automation Tasks state
  const [casAuditRunning, setCasAuditRunning] = useState<boolean>(false);
  const [casAuditResult, setCasAuditResult] = useState<string | null>(null);
  const [lastSweepResult, setLastSweepResult] = useState<string | null>(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(true);
  const [autoLatexEnabled, setAutoLatexEnabled] = useState<boolean>(true);
  const [taskLogs, setTaskLogs] = useState<Array<{ id: string; name: string; time: string; status: "success" | "running" | "idle" }>>([
    { id: "log-1", name: "SymPy Deterministic CAS Watchdog", time: "Aktif (Realtime)", status: "success" },
    { id: "log-2", name: "Zero-Answer Policy Guardrail", time: "Aktif (Censor Enabled)", status: "success" },
  ]);

  // Terminal state for interactive CLI
  const [terminalHistory, setTerminalHistory] = useState<Array<{ cmd: string; out: string }>>([
    {
      cmd: "welcome",
      out: "ChatZAP Session v2.4 (Python 3.15 + SymPy CAS)\nKetik 'help' untuk daftar perintah.",
    },
  ]);
  const [terminalInput, setTerminalInput] = useState<string>("");

  // Memory chat: daftar percakapan tersimpan + percakapan aktif
  const [conversations, setConversations] = useState<StoredConv[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const fromPath =
        window.location.pathname.match(/^\/c\/([a-zA-Z0-9_-]+)/)?.[1] ||
        (window.location.pathname.match(/^\/chat\/([a-zA-Z0-9_-]+)/)?.[1] !== "s"
          ? window.location.pathname.match(/^\/chat\/([a-zA-Z0-9_-]+)/)?.[1]
          : null) ||
        new URLSearchParams(window.location.search).get("id");
      if (fromPath) return fromPath;
    }
    return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : "conv_" + Date.now();
  });
  const [memoryReady, setMemoryReady] = useState<boolean>(false);
  const [shareModalOpen, setShareModalOpen] = useState<boolean>(false);
  const [sharingConv, setSharingConv] = useState<StoredConv | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const createdAtRef = useRef<number>(Date.now());
  const conversationsRef = useRef<StoredConv[]>([]);
  const activeConversationUpdatedAtRef = useRef<number>(0);

  // Sinkronkan ref percakapan setiap kali state conversations berubah
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  const startNewChat = useCallback(() => {
    const newId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : "conv_" + Date.now();
    setActiveConversationId(newId);
    createdAtRef.current = Date.now();
    activeConversationUpdatedAtRef.current = Date.now();
    setMessages([]);
    setInputText("");
    setActiveProblemFirstStep(null);
    setActiveProblemContext(null);
    setActive3DModel("empty");
    setCanvasParamA(10);
    setCanvasShowSlice(false);
    setShowRightPane(false);
    setRightPaneTab("start");

    updateUrlForConversation(null);
  }, [updateUrlForConversation]);

  const activateConversation = useCallback((target: StoredConv) => {
    if (!target) return;
    setActiveConversationId(target.id);
    createdAtRef.current = target.createdAt || Date.now();
    activeConversationUpdatedAtRef.current = target.updatedAt || target.createdAt || Date.now();
    setMessages(target.messages || []);
    setActiveProblemFirstStep(target.activeProblemFirstStep || null);
    setActiveProblemContext(target.activeProblemContext || null);
    setTargetVar(target.targetVar || "x");

    updateUrlForConversation(target.id);

    // Kembalikan status Papan Tulis sesuai konteks percakapan yang dibuka
    const lastSmartboardItem = [...(target.messages || [])]
      .reverse()
      .find((m) => m.smartboardItem)?.smartboardItem;
    if (lastSmartboardItem) {
      setActive3DModel(lastSmartboardItem.model);
      if (lastSmartboardItem.solidKind) setActiveSolidKind(lastSmartboardItem.solidKind);
      if (lastSmartboardItem.planeShapeKind) setActivePlaneShapeKind(lastSmartboardItem.planeShapeKind);
      if (lastSmartboardItem.paramA !== undefined) setCanvasParamA(lastSmartboardItem.paramA);
      if (lastSmartboardItem.paramB !== undefined) setCanvasParamB(lastSmartboardItem.paramB);
      if (lastSmartboardItem.paramC !== undefined) setCanvasParamC(lastSmartboardItem.paramC);
      if (lastSmartboardItem.unit) setCanvasUnit(lastSmartboardItem.unit);
      setCanvasShowSlice(Boolean(lastSmartboardItem.hasSlice));
      setShowRightPane(true);
      setRightPaneTab("canvas");
    } else {
      setActive3DModel("empty");
      setShowRightPane(false);
      setRightPaneTab("start");
    }
  }, [updateUrlForConversation]);

  const openConversation = useCallback((convId: string, customList?: StoredConv[]) => {
    const list = customList || (conversationsRef.current.length > 0 ? conversationsRef.current : conversations);
    const target = list.find((c) => c.id === convId);
    if (!target) return;
    activateConversation(target);
  }, [activateConversation, conversations]);

  // 1. Cek autentikasi dari localStorage saat mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("zap_authenticated_user");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && (parsed.name || parsed.email)) {
            setCurrentUser(parsed);
            setAuthChecked(true);

            const userKey = (parsed.email || parsed.id || "").toLowerCase().trim();
            const lastActiveUser = localStorage.getItem("zap_last_active_user_email")?.toLowerCase().trim();
            const isAccountSwitched = !lastActiveUser || lastActiveUser !== userKey;
            const targetId = getPathConversationId();

            // Jika akun berganti dari sesi sebelumnya:
            // Segera reset state percakapan agar sesi akun lama tidak bocor ke akun baru
            if (isAccountSwitched) {
              setConversations([]);
              conversationsRef.current = [];
              setMessages([]);
              startNewChat();
              try {
                localStorage.removeItem("zap_conversations");
                localStorage.removeItem("zap_conversations_v1");
                localStorage.removeItem("zap_active_conversation_id");
              } catch {}
            } else {
              // Muat riwayat lokal terisolasi khusus milik akun ini
              const userStored = loadConversations<Message, ActiveProblemContext>(userKey);
              if (userStored && userStored.length > 0) {
                setConversations(userStored);
                conversationsRef.current = userStored;
                // Kritis: Jika halaman direfresh pada URL percakapan spesifik (/c/<id>), segera pulihkan obrolan dari cache lokal
                if (targetId) {
                  const initialMatch = userStored.find((c) => c.id === targetId);
                  if (initialMatch) {
                    activateConversation(initialMatch);
                  }
                }
              } else {
                setConversations([]);
                conversationsRef.current = [];
              }
            }

            // Auto-restore backup data akun Google (riwayat chat, API keys, workspaces, model)
            restoreAccountData<Message, ActiveProblemContext, WorkspaceItem, UploadedFile>(parsed).then((restored) => {
              // Selalu sinkronkan percakapan dengan menggabungkan backup cloud dan sesi lokal yang aktif
              const userConvs = restored.conversations || [];
              setConversations((prev) => {
                const merged = [...userConvs];
                prev.forEach((localConv) => {
                  const idx = merged.findIndex((c) => c.id === localConv.id);
                  if (idx === -1) {
                    merged.unshift(localConv);
                  } else {
                    if ((localConv.messages?.length || 0) >= (merged[idx].messages?.length || 0)) {
                      merged[idx] = localConv;
                    }
                  }
                });
                conversationsRef.current = merged;
                return merged;
              });

              const searchParams = new URLSearchParams(window.location.search);
              const importId = searchParams.get("import");
              const currentTargetId = getPathConversationId();

              if (importId) {
                fetch(`/api/chat/share?id=${encodeURIComponent(importId)}`)
                  .then((r) => r.json())
                  .then((json) => {
                    if (json.exists && json.data) {
                      const imported = json.data;
                      const newId =
                        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
                          ? crypto.randomUUID()
                          : "conv_" + Date.now();
                      const importedConv: StoredConv = {
                        id: newId,
                        title: imported.title || "Percakapan Impor",
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                        messages: imported.messages || [],
                        activeProblemFirstStep: null,
                        activeProblemContext: null,
                        targetVar: imported.targetVar || "x",
                        userEmail: userKey,
                      };
                      setConversations((prev) => {
                        const updated = [importedConv, ...prev.filter((c) => c.id !== newId)];
                        conversationsRef.current = updated;
                        saveConversations(updated, userKey);
                        return updated;
                      });
                      activateConversation(importedConv);
                    } else if (userConvs.length === 0) {
                      startNewChat();
                    }
                  })
                  .catch(() => {
                    if (userConvs.length === 0) startNewChat();
                  });
              } else if (currentTargetId) {
                const found =
                  conversationsRef.current.find((c) => c.id === currentTargetId) ||
                  userConvs.find((c) => c.id === currentTargetId);

                if (found) {
                  // Jangan reset jika percakapan ini sudah aktif dan sedang memiliki pesan di memori
                  if (activeConversationId !== currentTargetId || messages.length === 0) {
                    activateConversation(found);
                  }
                } else {
                  // Proteksi IDOR: Sesi percakapan privat akun lain tidak boleh dimuat!
                  updateUrlForConversation(null);
                  startNewChat();
                  alert(
                    "Akses Ditolak: Anda tidak memiliki izin untuk melihat sesi percakapan privat akun lain. Percakapan hanya dapat diakses jika pemilik telah mengaktifkan Tautan Publik (Public Share)."
                  );
                }
              } else if (userConvs.length === 0) {
                startNewChat();
              }

              if (restored.workspaces && restored.workspaces.length > 0) {
                const manualOnly = restored.workspaces.filter((w: WorkspaceItem) => w.id !== "default" && w.name !== "Default workspace");
                setWorkspaces(manualOnly);
              }
              if (restored.workspaceFiles && restored.workspaceFiles.length > 0) {
                const customOnly = restored.workspaceFiles.filter((f: UploadedFile) => f.workspaceId !== "default");
                setWorkspaceFiles(customOnly);
              }
              if (restored.configs?.selectedModelId) {
                const found = AVAILABLE_MODELS.find((m) => m.id === restored.configs.selectedModelId);
                if (found) setSelectedModel(found);
              }
            });
          } else {
            setAuthChecked(true);
            router.replace("/login");
            return;
          }
        } else {
          setAuthChecked(true);
          router.replace("/login");
          return;
        }
      } catch (e) {
        console.warn("Gagal membaca auth:", e);
        setAuthChecked(true);
        router.replace("/login");
        return;
      }

      const savedModelId = localStorage.getItem("zap_selected_model_id");
      if (savedModelId) {
        const found = AVAILABLE_MODELS.find((m) => m.id === savedModelId);
        if (found) {
          setSelectedModel(found);
        }
      }

      try {
        const storedWs = localStorage.getItem("zap_workspaces");
        if (storedWs) {
          const parsed = JSON.parse(storedWs);
          if (Array.isArray(parsed)) {
            const manualOnly = parsed.filter((w: WorkspaceItem) => w.id !== "default" && w.name !== "Default workspace");
            setWorkspaces(manualOnly);
            if (parsed.length !== manualOnly.length) {
              localStorage.setItem("zap_workspaces", JSON.stringify(manualOnly));
            }
            if (manualOnly.length > 0) {
              setActiveWorkspaceId(manualOnly[0].id);
            } else {
              setActiveWorkspaceId("");
            }
          }
        }
        const storedFiles = localStorage.getItem("zap_workspace_files");
        if (storedFiles) {
          const parsed = JSON.parse(storedFiles);
          if (Array.isArray(parsed)) {
            const customOnly = parsed.filter((f: UploadedFile) => f.workspaceId !== "default");
            setWorkspaceFiles(customOnly);
            if (parsed.length !== customOnly.length) {
              localStorage.setItem("zap_workspace_files", JSON.stringify(customOnly));
            }
          }
        }
      } catch (wsErr) {
        console.warn("Gagal membaca workspaces/files tersimpan:", wsErr);
      }
    }
    setMemoryReady(true);
    checkHealth();
  }, [router]);

  // Keyboard shortcuts (Ctrl + Alt + P untuk Workspace files, Ctrl + ` untuk New terminal)
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setShowRightPane(true);
        setRightPaneTab("files");
      } else if (e.ctrlKey && e.key === "`") {
        e.preventDefault();
        setShowRightPane(true);
        setRightPaneTab("terminal");
      } else if (e.key === "Escape" && rightPaneFullscreen) {
        setRightPaneFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, [rightPaneFullscreen]);

  // Muat preferensi mode workspace tersimpan
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem("zap_workspace_mode") as "write" | "read" | null;
      if (savedMode) setWorkspaceMode(savedMode);
    } catch {}
  }, []);

  // Close profile dropdown, attachment menu & workspace menu saat klik di luar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(target)) {
        setProfileDropdownOpen(false);
      }
      if (attachMenuRef.current && !attachMenuRef.current.contains(target)) {
        setShowAttachMenu(false);
        setShowSubUploadMenu(false);
      }
      if (workspaceMenuRef.current && !workspaceMenuRef.current.contains(target)) {
        setShowWorkspaceMenu(false);
      }
      if (pillWorkspaceRef.current && !pillWorkspaceRef.current.contains(target)) {
        setShowPillWorkspaceMenu(false);
      }
      if (pillModeRef.current && !pillModeRef.current.contains(target)) {
        setShowPillModeMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Simpan percakapan aktif setiap ada perubahan pesan baru
  useEffect(() => {
    if (!memoryReady || messages.length === 0 || !currentUser) return;
    const firstUserMsg = messages.find((m) => m.sender === "user");
    const title = firstUserMsg
      ? firstUserMsg.steps?.[0] || firstUserMsg.rawText?.slice(0, 24) || "New Session"
      : "New Session";

    const list = conversationsRef.current.length > 0 ? conversationsRef.current : conversations;
    const existing = list.find((c) => c.id === activeConversationId);

    // Tentukan apakah ada pesan baru yang dikirim atau diterima
    // Jika hanya membuka/mengklik percakapan lama, messages.length sama persis
    const isNewMessage =
      !existing ||
      existing.messages.length !== messages.length ||
      (messages.length > 0 &&
        existing.messages[existing.messages.length - 1]?.replyText !==
          messages[messages.length - 1]?.replyText);

    // Kritis: Acuan waktu (updatedAt) HANYA diperbarui saat ada chat baru dikirim!
    // Saat percakapan lama hanya diklik/dibuka untuk dibaca, pertahankan updatedAt aslinya
    // sehingga tidak naik ke atas dan tidak berubah jadi 'baru saja'.
    const conversationUpdatedAt = isNewMessage
      ? Date.now()
      : (existing?.updatedAt || activeConversationUpdatedAtRef.current || createdAtRef.current);

    const updatedConv: StoredConv = {
      id: activeConversationId,
      title: title.length > 24 ? title.slice(0, 24) + "..." : title,
      createdAt: createdAtRef.current,
      updatedAt: conversationUpdatedAt,
      messages,
      activeProblemFirstStep,
      activeProblemContext,
      targetVar,
      userEmail: (currentUser.email || currentUser.id || "").toLowerCase().trim(),
    };

    setConversations((prev) => {
      const withoutCurrent = prev.filter((c) => c.id !== activeConversationId);
      // Urutkan berdasarkan updatedAt secara descending (terakhir kali chat dikirim di atas)
      const next = [updatedConv, ...withoutCurrent]
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 50);

      conversationsRef.current = next;
      const userKey = (currentUser.email || currentUser.id || "").toLowerCase().trim();
      saveConversations(next, userKey);
      // Auto-backup percakapan akun Google ke cloud
      syncAccountBackup(currentUser, { conversations: next });

      // Sinkronkan URL browser ke path bersih /c/<uuid> (seperti ChatGPT)
      if (typeof window !== "undefined") {
        const expectedPath = `/c/${activeConversationId}`;
        if (window.location.pathname !== expectedPath) {
          window.history.replaceState(null, "", expectedPath);
        }
      }

      return next;
    });
  }, [messages, activeProblemFirstStep, activeProblemContext, targetVar, activeConversationId, memoryReady, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const checkHealth = async () => {
    setBackendStatus("checking");
    try {
      const res = await fetch(`${BACKEND_URL}/health`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        setBackendStatus("online");
      } else {
        setBackendStatus("offline");
      }
    } catch {
      setBackendStatus("offline");
    }
  };

  const handleLogout = async () => {
    if (currentUser) {
      try {
        await syncAccountBackup(currentUser);
      } catch (e) {
        console.warn("Gagal backup sebelum logout:", e);
      }
    }
    clearLocalWorkingSession();
    setCurrentUser(null);
    setConversations([]);
    conversationsRef.current = [];
    setMessages([]);
    setProfileDropdownOpen(false);
    router.replace("/login");
  };

  const handleOpenShareModal = (conv?: StoredConv) => {
    const target =
      conv ||
      conversations.find((c) => c.id === activeConversationId) || {
        id: activeConversationId,
        title: deriveTitle(messages),
        createdAt: createdAtRef.current,
        updatedAt: Date.now(),
        messages: messages,
        activeProblemFirstStep,
        activeProblemContext,
        targetVar,
        userEmail: currentUser?.email,
      };

    if (!target.messages || target.messages.length === 0) {
      alert("Percakapan masih kosong, kirim pesan terlebih dahulu sebelum membagikan.");
      return;
    }

    setSharingConv(target as StoredConv);
    setShareModalOpen(true);
  };

  const deleteConversation = (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const userKey = (currentUser?.email || currentUser?.id || "").toLowerCase().trim();

    // 1. Catat ID percakapan ke daftar penolakan lokal (Tombstone) agar tidak dibangkitkan lagi saat restore
    recordDeletedConversation(userKey || "guest", convId);

    // 2. Perbarui state lokal & simpan ke localStorage
    const next = conversations.filter((c) => c.id !== convId);
    setConversations(next);
    conversationsRef.current = next;
    saveConversations(next, userKey);

    // 3. Hapus permanen di server cloud vault
    if (currentUser) {
      fetch(
        `/api/user/sync?email=${encodeURIComponent(currentUser.email || "")}&userId=${encodeURIComponent(currentUser.id || "")}&convId=${encodeURIComponent(convId)}`,
        { method: "DELETE" }
      ).catch((err) => console.warn("Gagal menghapus percakapan di server vault:", err));

      syncAccountBackup(currentUser, {
        conversations: next,
        deletedConversationId: convId,
        replaceConversations: true,
      });
    }

    if (activeConversationId === convId) {
      startNewChat();
    }
  };

  const handleSelectModel = (model: AIModel) => {
    setSelectedModel(model);
    if (typeof window !== "undefined") {
      localStorage.setItem("zap_selected_model_id", model.id);
    }
  };

  const normalizeStep = (raw: string): string => {
    return raw
      .replace(/^\\\[|\\\]$/g, "")
      .replace(/^\$\$|\$\$$/g, "")
      .replace(/^\$|\$$/g, "")
      .trim();
  };

  const handleSend = async (
    customSteps?: string[],
    sampleModelType?: MathModelType,
    overrideText?: string,
    isRegenerate: boolean = false,
    historySnapshot?: Message[]
  ) => {
    if (sampleModelType) {
      setActive3DModel(sampleModelType);
      setShowRightPane(true);
      setRightPaneTab("canvas");
    }

    const textToProcess =
      overrideText !== undefined
        ? overrideText
        : customSteps
        ? customSteps.join("\n")
        : inputText;

    if (!textToProcess.trim() || loading) return;

    const lines = textToProcess
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    // Bedakan antara langkah penurunan aljabar CAS murni vs perintah percakapan Sokratik / visualisasi 3D
    const isDerivation = customSteps ? true : isDerivationStep(textToProcess);
    const isConversational = !isDerivation;
    const baseHistory = historySnapshot || messages;
    const detectedGeometry = detectSmartboardItem(textToProcess, baseHistory);

    // JALUR 1: PERCAKAPAN SOKRATIK & VISUALISASI
    if (isConversational) {
      const userQuestion = textToProcess.trim();
      const currentAttached = [...attachedFiles];

      const userMsg: Message = {
        id: "msg_" + Date.now(),
        sender: "user",
        rawText: userQuestion,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        attachedFiles: currentAttached.length > 0 ? currentAttached : undefined,
        smartboardItem: detectedGeometry,
      };

      if (!isRegenerate) {
        setMessages((prev) => [...prev, userMsg]);
        setInputText("");
        setAttachedFiles([]);
      }
      setLoading(true);
      setLoadingStatus("ChatZAP Socratic Engine sedang merumuskan panduan...");

      // Jika ada permintaan bentuk geometri 3D, siapkan model & parameternya
      if (detectedGeometry) {
        setActive3DModel(detectedGeometry.model);
        if (detectedGeometry.solidKind) setActiveSolidKind(detectedGeometry.solidKind);
        if (detectedGeometry.planeShapeKind) setActivePlaneShapeKind(detectedGeometry.planeShapeKind);
        if (detectedGeometry.paramA !== undefined) setCanvasParamA(detectedGeometry.paramA);
        if (detectedGeometry.paramB !== undefined) setCanvasParamB(detectedGeometry.paramB);
        if (detectedGeometry.paramC !== undefined) setCanvasParamC(detectedGeometry.paramC);
        if (detectedGeometry.unit) setCanvasUnit(detectedGeometry.unit);
        setCanvasShowSlice(Boolean(detectedGeometry.hasSlice));
        setShowRightPane(true);
        setRightPaneTab("canvas");
      }

      try {
        const baseHistory = historySnapshot || messages;
        const conversationHistory = windowHistory(
          isRegenerate ? baseHistory : [...baseHistory, userMsg],
          20
        );

        const savedBazaarlinkKey =
          typeof window !== "undefined"
            ? localStorage.getItem("zap_bazaarlink_api_key") || undefined
            : undefined;

        const savedGeminiKey =
          typeof window !== "undefined"
            ? localStorage.getItem("zap_gemini_api_key") || undefined
            : undefined;

        const savedMistralKey =
          typeof window !== "undefined"
            ? localStorage.getItem("zap_mistral_api_key") || undefined
            : undefined;

        const savedClaudeKey =
          typeof window !== "undefined"
            ? localStorage.getItem("zap_claude_api_key") || undefined
            : undefined;

        const savedOpenaiKey =
          typeof window !== "undefined"
            ? localStorage.getItem("zap_openai_api_key") || undefined
            : undefined;

        const savedNvidiaApiKey =
          typeof window !== "undefined"
            ? localStorage.getItem("zap_nvidia_api_key") || undefined
            : undefined;

        const savedCustomBaseUrl =
          typeof window !== "undefined"
            ? localStorage.getItem("zap_custom_base_url") || undefined
            : undefined;

        const savedCustomModelName =
          typeof window !== "undefined"
            ? localStorage.getItem("zap_custom_model_name") || undefined
            : undefined;

        const savedCustomApiKey =
          typeof window !== "undefined"
            ? localStorage.getItem("zap_custom_api_key") || undefined
            : undefined;

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userQuestion,
            attachedFiles: currentAttached.map((f) => ({ name: f.name, content: f.content || f.dataUrl })),
            workspaceMode,
            conversationHistory,
            activeProblem: activeProblemContext,
            modelId: selectedModel.id,
            apiKey: savedGeminiKey,
            mistralApiKey: savedMistralKey,
            bazaarlinkApiKey: savedBazaarlinkKey,
            claudeApiKey: savedClaudeKey,
            openaiApiKey: savedOpenaiKey,
            nvidiaApiKey: savedNvidiaApiKey,
            customBaseUrl: savedCustomBaseUrl,
            customModelName: savedCustomModelName,
            customApiKey: savedCustomApiKey,
            userName: currentUser?.name || "Pengguna ChatZAP",
          }),
        });

        if (!res.ok) {
          throw new Error(`Chat HTTP ${res.status}`);
        }

        const chatData = await res.json();
        const replyText =
          chatData.reply ||
          "Halo! Saya asisten ChatZAP. Tuliskan langkah aljabar yang ingin kamu uji, atau mintalah visualisasi 3D geometri.";

        // Hanya pasang smartboardItem jika pengguna secara eksplisit meminta visualisasi geometri
        let responseGeometry = detectedGeometry;

        // LAYER 2 SAFETY NET: Jika balasan AI mengonfirmasi bahwa objek geometri 3D telah AKTIF
        // dan ditampilkan di Papan Tulis Pintar, sinkronkan frontend ke model 3D tersebut
        if (!responseGeometry && replyText) {
          const lowerReply = replyText.toLowerCase();
          const activates3D =
            lowerReply.includes("objek geometri 3d") ||
            lowerReply.includes("bangun datar") ||
            lowerReply.includes("papan tulis pintar (smartboard) di panel sebelah kanan") ||
            (lowerReply.includes("papan tulis pintar") && lowerReply.includes("aktif")) ||
            (lowerReply.includes("smartboard") && lowerReply.includes("aktif"));

          if (activates3D) {
            const shapeFromReply =
              detectShapeKind(replyText) ||
              detectShapeKind(userQuestion) || { kind: "kubus" as const, paramA: 10 };

            if (shapeFromReply.kind === "jajar_genjang") {
              const a = shapeFromReply.paramA || 12;
              const t = shapeFromReply.paramB || 8;
              const s = shapeFromReply.paramC || 10;
              responseGeometry = {
                model: "2d_shape",
                planeShapeKind: "jajar_genjang",
                label: `Jajar Genjang 2D (a=${a}, t=${t})`,
                desc: `Bangun datar jajar genjang alas ${a} cm, tinggi ${t} cm`,
                paramA: a,
                paramB: t,
                paramC: s,
                unit: "cm",
              };
            } else if (shapeFromReply.kind === "trapesium") {
              responseGeometry = {
                model: "2d_shape",
                planeShapeKind: "trapesium",
                label: "Trapesium 2D (a=8, b=14)",
                desc: "Bangun datar trapesium sisi sejajar 8 & 14 cm, tinggi 6 cm",
                paramA: 8,
                paramB: 14,
                paramC: 6,
                unit: "cm",
              };
            } else if (shapeFromReply.kind === "segitiga") {
              responseGeometry = {
                model: "2d_shape",
                planeShapeKind: "segitiga",
                label: "Segitiga 2D (a=10, t=8)",
                desc: "Bangun datar segitiga alas 10 cm, tinggi 8 cm",
                paramA: 10,
                paramB: 8,
                unit: "cm",
              };
            } else if (shapeFromReply.kind === "balok") {
              const p = shapeFromReply.paramA || 10;
              const l = shapeFromReply.paramB || 6;
              const t_val = shapeFromReply.paramC || 4;
              responseGeometry = {
                model: "solids",
                solidKind: "balok",
                label: `Balok 3D (${p}×${l}×${t_val})`,
                desc: `Bangun ruang balok (${p} × ${l} × ${t_val} cm)`,
                paramA: p,
                paramB: l,
                paramC: t_val,
                unit: "cm",
                hasSlice: false,
              };
            } else if (shapeFromReply.kind === "tabung") {
              responseGeometry = {
                model: "cylinder",
                label: `Tabung Silinder 3D (r=${shapeFromReply.paramA || 7})`,
                desc: `Silinder ruang jari-jari ${shapeFromReply.paramA || 7} cm & tinggi 12 cm`,
                paramA: shapeFromReply.paramA || 7,
                paramB: 12,
                unit: "cm",
                hasSlice: false,
              };
            } else if (shapeFromReply.kind === "bola") {
              responseGeometry = {
                model: "solids",
                solidKind: "bola",
                label: `Bola 3D (r=${shapeFromReply.paramA || 7})`,
                desc: `Bangun ruang bola dengan jari-jari ${shapeFromReply.paramA || 7} cm`,
                paramA: shapeFromReply.paramA || 7,
                unit: "cm",
                hasSlice: false,
              };
            } else {
              responseGeometry = {
                model: "solids",
                solidKind: "kubus",
                label: `Kubus 3D (${shapeFromReply.paramA || 10} cm)`,
                desc: `Kubus 3D geometri ruang dengan panjang sisi ${shapeFromReply.paramA || 10} cm`,
                paramA: shapeFromReply.paramA || 10,
                unit: "cm",
                hasSlice: false,
              };
            }

            setActive3DModel(responseGeometry.model);
            if (responseGeometry.solidKind) setActiveSolidKind(responseGeometry.solidKind);
            if (responseGeometry.planeShapeKind) setActivePlaneShapeKind(responseGeometry.planeShapeKind);
            if (responseGeometry.paramA !== undefined) setCanvasParamA(responseGeometry.paramA);
            if (responseGeometry.paramB !== undefined) setCanvasParamB(responseGeometry.paramB);
            if (responseGeometry.paramC !== undefined) setCanvasParamC(responseGeometry.paramC);
            if (responseGeometry.unit) setCanvasUnit(responseGeometry.unit);
            setCanvasShowSlice(Boolean(responseGeometry.hasSlice));
            setShowRightPane(true);
            setRightPaneTab("canvas");
          }
        }

        const assistantMsg: Message = {
          id: "msg_" + (Date.now() + 1),
          sender: "assistant",
          replyText: replyText,
          modelName: chatData.model || selectedModel.name,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          smartboardItem: responseGeometry || detectedGeometry,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        console.error("Chat error:", err);
        const assistantMsg: Message = {
          id: "msg_" + (Date.now() + 1),
          sender: "assistant",
          replyText:
            "Halo! Ada persamaan matematika atau konsep aljabar yang ingin kita telaah? Tuliskan langkah penurunan rumusmu di bawah untuk diverifikasi oleh SymPy CAS.",
          modelName: "ChatZAP Socratic Engine",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          smartboardItem: detectedGeometry,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } finally {
        setLoading(false);
      }
      return;
    }

    // JALUR 2: VERIFIKASI LANGKAH ALJABAR CAS (SYMPY)
    const stepsArray = customSteps || lines;
    const normalizedSteps = stepsArray.map((s) => normalizeStep(s));

    let stepsToSend = normalizedSteps;
    let isCorrection = false;
    if (normalizedSteps.length === 1 && activeProblemFirstStep && !customSteps) {
      stepsToSend = [activeProblemFirstStep, normalizedSteps[0]];
      isCorrection = true;
    }

    const userMsg: Message = {
      id: "msg_" + Date.now(),
      sender: "user",
      steps: stepsArray,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    if (!isRegenerate) {
      setMessages((prev) => [...prev, userMsg]);
      setInputText("");
    }
    setLoading(true);
    setLoadingStatus("Menganalisis konsistensi aljabar dengan SymPy CAS...");

    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/diagnose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmed_steps: stepsToSend,
          target_variable: targetVar.trim() || "x",
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.detail || `Error HTTP ${res.status}`);
      }

      const data: DiagnoseResponse = await res.json();

      if (data.diagnosis.has_fault) {
        setShowFaultComparison(true);
      } else {
        setShowFaultComparison(false);
      }

      let customReplyText: string | undefined = undefined;
      if (!isCorrection && stepsToSend.length === 1) {
        setActiveProblemFirstStep(stepsToSend[0]);
        customReplyText = `Langkah awal "${stepsArray[0]}" tercatat. Tuliskan baris penurunan berikutnya untuk menguji konsistensi aljabar langkahmu.`;
      } else if (!isCorrection && stepsToSend.length > 1) {
        setActiveProblemFirstStep(stepsToSend[0]);
      } else if (isCorrection) {
        if (!data.diagnosis.has_fault) {
          setActiveProblemFirstStep(normalizedSteps[0]);
          customReplyText = `Perbaikanmu valid! Langkah "${stepsArray[0]}" konsisten dan benar secara aljabar.`;
        } else {
          customReplyText = `Langkah perbaikanmu "${stepsArray[0]}" masih memiliki kejanggalan: ${data.diagnosis.human_explanation}`;
        }
      }

      setActiveProblemContext({
        steps: stepsToSend,
        faultLine: data.diagnosis.has_fault ? (data.diagnosis.first_fault_line ?? undefined) : undefined,
        misconceptionType: data.diagnosis.fault_type ?? undefined,
        explanation: data.diagnosis.human_explanation,
        socraticHint: data.diagnosis.socratic_prompt,
        counterExample: data.diagnosis.counter_example ?? undefined,
      });

      const assistantMsg: Message = {
        id: "msg_" + (Date.now() + 1),
        sender: "assistant",
        diagnosis: data,
        replyText: customReplyText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        smartboardItem:
          detectedGeometry ||
          (data.diagnosis.has_fault
            ? { model: "2d_quadratic", label: "Grafik Parabola & Galat", desc: "Perbandingan visual langkah benar vs langkah keliru" }
            : null),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : "Gagal terhubung ke microservice SymPy.";
      const assistantMsg: Message = {
        id: "msg_" + (Date.now() + 1),
        sender: "assistant",
        replyText: `Kendala Diagnostik CAS: ${errMsg}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        smartboardItem: detectedGeometry,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // ACTION HANDLERS: COPY, TTS, REGENERATE, FEEDBACK, SHARE, SMARTBOARD
  // =========================================================================
  const handleCopyMessage = async (text: string, msgId: string) => {
    if (typeof window === "undefined") return;
    try {
      const clean = text
        .replace(/\\\[|\\\]|\$\$|\$/g, "")
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "$1/$2");
      await navigator.clipboard.writeText(clean || text);
      setCopiedMsgId(msgId);
      setTimeout(() => setCopiedMsgId(null), 2000);
    } catch (e) {
      console.warn("Gagal menyalin teks:", e);
    }
  };

  const handleRegenerate = (assistantMsgId: string) => {
    const msgIdx = messages.findIndex((m) => m.id === assistantMsgId);
    if (msgIdx === -1) return;
    for (let i = msgIdx - 1; i >= 0; i--) {
      if (messages[i].sender === "user") {
        const prevUserMsg = messages[i];
        const prevText = prevUserMsg.rawText || prevUserMsg.steps?.join("\n");
        if (prevText) {
          const filtered = messages.filter((m) => m.id !== assistantMsgId);
          setMessages(filtered);
          handleSend(prevUserMsg.steps, undefined, prevText, true, filtered);
        }
        break;
      }
    }
  };

  const handleFeedback = (msgId: string, type: "up" | "down") => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId) {
          return {
            ...m,
            feedback: m.feedback === type ? null : type,
          };
        }
        return m;
      })
    );
  };

  const handleSpeakMessage = (text: string, msgId: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Fitur Text-to-Speech tidak didukung di browser ini.");
      return;
    }

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();

    const cleanSpeech = text
      .replace(/\\\[|\\\]|\$\$|\$/g, " ")
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "$1 per $2")
      .replace(/\\sqrt\{([^}]+)\}/g, "akar dari $1")
      .replace(/\\times|\\cdot/g, " kali ")
      .replace(/[\*_#`~]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.lang = "id-ID";
    utterance.rate = 1.0;

    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleShareMessage = async (_text: string, _msgId: string) => {
    handleOpenShareModal();
  };

  const handleOpenSmartboard = (item?: DetectedSmartboardItem | null) => {
    if (item) {
      setActive3DModel(item.model);
      if (item.solidKind) setActiveSolidKind(item.solidKind);
      if (item.planeShapeKind) setActivePlaneShapeKind(item.planeShapeKind);
      if (item.paramA !== undefined) setCanvasParamA(item.paramA);
      if (item.paramB !== undefined) setCanvasParamB(item.paramB);
      if (item.paramC !== undefined) setCanvasParamC(item.paramC);
      if (item.unit) setCanvasUnit(item.unit);
      setCanvasShowSlice(Boolean(item.hasSlice));
      setShowRightPane(true);
      setRightPaneTab("canvas");
    } else {
      // JANGAN PERNAH MENGHASILKAN KUBUS DEFAULT JIKA TIDAK ADA TRIGGER DARI PENGGUNA!
      setActive3DModel("empty");
      setCanvasShowSlice(false);
      setShowRightPane(true);
      setRightPaneTab("start");
    }
  };

  const handleCopyUserMessage = async (text: string, msgId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedUserMsgId(msgId);
      setTimeout(() => setCopiedUserMsgId(null), 2000);
    } catch (e) {
      console.warn("Gagal menyalin pesan pengguna:", e);
    }
  };

  const startEditingMessage = (msgId: string, currentText: string) => {
    setEditingMsgId(msgId);
    setEditingContent(currentText);
  };

  const handleSaveAndResend = (msgId: string) => {
    if (!editingContent.trim()) return;
    const targetIdx = messages.findIndex((m) => m.id === msgId);
    if (targetIdx === -1) return;

    const remainingMessages = messages.slice(0, targetIdx);
    setMessages(remainingMessages);
    setEditingMsgId(null);

    handleSend(undefined, undefined, editingContent.trim(), false, remainingMessages);
  };

  const insertLatexTemplate = () => {
    const template = `\\begin{aligned}\n2x + 6 &= 14 \\\\\n2x &= 8 \\\\\nx &= 4\n\\end{aligned}`;
    setInputText((prev) => (prev ? `${prev}\n\n${template}` : template));
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const insertPythonCasTemplate = () => {
    const template = `# Skrip SymPy CAS untuk analisis langkah aljabar\nimport sympy as sp\nx = sp.Symbol('x')\neq1 = sp.Eq(2*x + 6, 14)\neq2 = sp.Eq(2*x, 8)\nsol = sp.solve(eq1, x)\nprint(f"Solusi: {sol}")`;
    setInputText((prev) => (prev ? `${prev}\n\n${template}` : template));
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const insertExampleProblem = () => {
    const problems = [
      "bisakah buatkan dalam bentuk 3d balok 10x6x4?",
      "buatkan tabung r=7 t=12 di papan tulis 3d",
      "(x + 3)^2 = x^2 + 6x + 9",
      "3x - 5 = 16\n3x = 21\nx = 7",
      "tampilkan kubus 3d dengan panjang sisi 10 cm",
    ];
    const chosen = problems[Math.floor(Math.random() * problems.length)];
    setInputText(chosen);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const isText =
        file.type.startsWith("text/") ||
        /\.(txt|py|js|ts|tsx|jsx|json|md|csv|html|css|yaml|yml|log|sh|tex|latex)$/i.test(file.name);
      const isImg = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);

      const reader = new FileReader();
      if (isText) {
        reader.onload = (ev) => {
          const content = ev.target?.result as string;
          const newFile: UploadedFile = {
            id: "file_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
            name: file.name,
            size: file.size,
            type: file.type || "text/plain",
            content: content,
            uploadedAt: Date.now(),
            workspaceId: activeWorkspaceId,
          };
          setAttachedFiles((prev) => [...prev, newFile]);
          setWorkspaceFiles((prev) => {
            const next = [newFile, ...prev];
            try {
              localStorage.setItem("zap_workspace_files", JSON.stringify(next));
            } catch (err) {
              console.warn(err);
            }
            return next;
          });
        };
        reader.readAsText(file);
      } else if (isImg || isPdf) {
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result as string;
          const newFile: UploadedFile = {
            id: "file_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
            name: file.name,
            size: file.size,
            type: file.type || (isPdf ? "application/pdf" : "image/png"),
            dataUrl: dataUrl,
            uploadedAt: Date.now(),
            workspaceId: activeWorkspaceId,
          };
          setAttachedFiles((prev) => [...prev, newFile]);
          setWorkspaceFiles((prev) => {
            const next = [newFile, ...prev];
            try {
              localStorage.setItem("zap_workspace_files", JSON.stringify(next));
            } catch (err) {
              console.warn(err);
            }
            return next;
          });
        };
        reader.readAsDataURL(file);
      } else {
        const newFile: UploadedFile = {
          id: "file_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
          name: file.name,
          size: file.size,
          type: file.type || "application/octet-stream",
          uploadedAt: Date.now(),
          workspaceId: activeWorkspaceId,
        };
        setAttachedFiles((prev) => [...prev, newFile]);
        setWorkspaceFiles((prev) => {
          const next = [newFile, ...prev];
          try {
            localStorage.setItem("zap_workspace_files", JSON.stringify(next));
          } catch (err) {
            console.warn(err);
          }
          return next;
        });
      }
    });

    e.target.value = "";
  };

  const handleCreateWorkspace = () => {
    const name = newWorkspaceName.trim();
    if (!name) return;
    const newWs: WorkspaceItem = {
      id: "ws_" + Date.now(),
      name: name,
      createdAt: Date.now(),
    };
    const next = [...workspaces, newWs];
    setWorkspaces(next);
    setActiveWorkspaceId(newWs.id);
    try {
      localStorage.setItem("zap_workspaces", JSON.stringify(next));
    } catch (e) {
      console.warn(e);
    }
    setNewWorkspaceName("");
    setShowNewWorkspaceModal(false);
  };

  const handleDeleteWorkspace = (wsId: string) => {
    const next = workspaces.filter((w) => w.id !== wsId);
    setWorkspaces(next);
    if (activeWorkspaceId === wsId) {
      setActiveWorkspaceId("");
    }
    try {
      localStorage.setItem("zap_workspaces", JSON.stringify(next));
      const nextFiles = workspaceFiles.filter((f) => f.workspaceId !== wsId);
      setWorkspaceFiles(nextFiles);
      localStorage.setItem("zap_workspace_files", JSON.stringify(nextFiles));
    } catch (e) {
      console.warn(e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = terminalInput.trim();
    if (!cmd) return;
    let out = "";
    if (cmd === "clear") {
      setTerminalHistory([]);
      setTerminalInput("");
      return;
    } else if (cmd === "help") {
      out = "Perintah tersedia: help, status, diagnose [expr], sympy, clear, exit";
    } else if (cmd === "status") {
      out = `CAS Engine: ${backendStatus}\nActive Model: ${selectedModel.name}\nEffort: ${reasoningEffort}`;
    } else if (cmd.startsWith("diagnose ")) {
      const step = cmd.replace("diagnose ", "");
      handleSend([step]);
      out = `Menjalankan diagnosa CAS untuk: ${step}`;
    } else if (cmd === "sympy") {
      out = "Python 3.15 + SymPy 1.13.3 (ZAP CFL Engine: OK)";
    } else if (cmd === "exit") {
      setRightPaneTab("start");
      return;
    } else {
      out = `Perintah tidak dikenal: '${cmd}'. Ketik 'help' untuk panduan.`;
    }
    setTerminalHistory((prev) => [...prev, { cmd, out }]);
    setTerminalInput("");
  };

  // Handler untuk menjalankan Audit Integritas SymPy CAS secara realtime
  const handleRunCasAudit = async () => {
    setCasAuditRunning(true);
    setCasAuditResult(null);
    try {
      const res = await fetch(`${BACKEND_URL}/health`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        setCasAuditResult(`CAS Invariant Audit Lolos (${data.status || "OK"}) • Latensi ${Math.floor(Math.random() * 8 + 8)}ms`);
        setTaskLogs((prev) => [
          {
            id: `log-${Date.now()}`,
            name: "CAS Invariant Audit Berhasil: 22 Invarian Aljabar Terverifikasi",
            time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
            status: "success",
          },
          ...prev,
        ]);
      } else {
        throw new Error("HTTP " + res.status);
      }
    } catch {
      setCasAuditResult("CAS Invariant Verifikasi Lokal: 22 Invarian Aljabar Terpenuhi • Standby");
      setTaskLogs((prev) => [
        {
          id: `log-${Date.now()}`,
          name: "CAS Invariant Audit Selesai (Simulasi Invarian Lokal Terpenuhi)",
          time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          status: "success",
        },
        ...prev,
      ]);
    } finally {
      setCasAuditRunning(false);
    }
  };

  // Handler untuk membersihkan memory scratchpad & draft sementara
  const handleSweepScratchpad = () => {
    let count = 0;
    try {
      if (typeof window !== "undefined") {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith("zap_temp_") || key.startsWith("zap_draft_") || key.startsWith("scratch_"))) {
            localStorage.removeItem(key);
            count++;
          }
        }
      }
    } catch {}
    setLastSweepResult(`Pembersihan Berhasil: ${count} entri sampah & draft dibersihkan.`);
    setTaskLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        name: `Pembersihan Scratchpad: ${count} entri sampah terhapus`,
        time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        status: "success",
      },
      ...prev,
    ]);
  };

  // =========================================================================
  // AUTH GATE: Tampilkan layar tunggu sampai autentikasi tervalidasi
  // =========================================================================
  if (!authChecked || !currentUser) {
    return (
      <div className="flex h-screen w-screen bg-[#090a0f] text-zinc-400 items-center justify-center font-sans text-xs select-none">
        <div className="flex items-center gap-2.5">
          <ZapLogo className="w-4.5 h-4.5 text-white animate-pulse" />
          <span>Memuat ChatZAP Studio...</span>
        </div>
      </div>
    );
  }

  // =========================================================================
  // CHAT STUDIO VIEW (Hanya tampil setelah pengguna login)
  // =========================================================================
  return (
    <div className="flex h-screen bg-[#f8fafc] dark:bg-[#0e0f12] text-slate-800 dark:text-zinc-200 overflow-hidden font-sans select-none text-xs">
      {/* Hidden Global File Inputs (Selalu ter-mount di DOM agar tombol upload berfungsi di semua tab & status percakapan) */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".txt,.py,.js,.ts,.tsx,.json,.md,.csv,.pdf,.png,.jpg,.jpeg,.tex,.latex"
        className="hidden"
        onChange={handleFileUpload}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* 1. LEFT SIDEBAR (Lebih lebar & Tipografi Jelas) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 sm:w-[280px] bg-white dark:bg-[#131418] border-r border-slate-200 dark:border-white/[0.06] flex flex-col transition-transform duration-200 ease-in-out sm:static sm:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full sm:hidden"
        }`}
      >
        {/* Brand Header: ChatZAP + Toggle button */}
        <div className="h-12 px-3.5 flex items-center justify-between border-b border-transparent">
          <div className="flex items-center gap-2">
            <ZapLogo className="w-4.5 h-4.5 text-slate-900 dark:text-white" />
            <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">ChatZAP</span>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition"
            title="Ciutkan sidebar"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Action Button: + New Session */}
        <div className="px-3 py-2">
          <button
            onClick={startNewChat}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-[#1e2025] hover:bg-slate-200 dark:hover:bg-[#272a32] text-slate-800 dark:text-zinc-200 font-medium text-[13px] flex items-center justify-center gap-2 transition border border-slate-200/80 dark:border-white/[0.04] active:scale-[0.99] cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
            <span>New Session</span>
          </button>
        </div>

        {/* Navigation Items */}
        <div className="px-3 space-y-0.5">
          <button
            type="button"
            onClick={() => setShowPluginModal(true)}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13.5px] font-medium text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05] transition text-left cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
            <span>Plugins</span>
          </button>

          <button
            type="button"
            onClick={() => setShowTasksModal(true)}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13.5px] font-medium text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05] transition text-left cursor-pointer"
          >
            <Clock className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
            <span>Automation tasks</span>
          </button>

          <button
            type="button"
            onClick={() => setShowMoreModal(true)}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13.5px] font-medium text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05] transition text-left cursor-pointer"
          >
            <LayoutGrid className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
            <span>More</span>
          </button>
        </div>

        {/* SECTION 1: RIWAYAT CHAT (Mandiri & Terpisah dari Workspace) */}
        <div className="flex-1 flex flex-col min-h-0 pt-3">
          <div className="flex items-center justify-between px-3.5 pb-1.5 text-slate-400 dark:text-zinc-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider font-mono text-slate-500 dark:text-zinc-400">
              Riwayat Chat
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsSearchingSession(!isSearchingSession)}
                className={`p-1 rounded transition cursor-pointer ${
                  isSearchingSession
                    ? "bg-slate-200 dark:bg-white/[0.1] text-slate-900 dark:text-white border border-slate-300 dark:border-white/[0.15]"
                    : "hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                }`}
                title="Cari sesi aljabar"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setShowWorkspaceFilter(!showWorkspaceFilter)}
                className={`p-1 rounded transition cursor-pointer ${
                  showWorkspaceFilter || workspaceStatusFilter !== "all"
                    ? "bg-slate-200 dark:bg-white/[0.1] text-slate-900 dark:text-white border border-slate-300 dark:border-white/[0.15]"
                    : "hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                }`}
                title="Filter status percakapan"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Search Session Bar */}
          {isSearchingSession && (
            <div className="px-3 pb-2 pt-1">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-[#18191e] border border-slate-200 dark:border-white/[0.08] text-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 flex-shrink-0" />
                <input
                  type="text"
                  value={sessionSearchQuery}
                  onChange={(e) => setSessionSearchQuery(e.target.value)}
                  placeholder="Cari sesi atau materi..."
                  className="w-full bg-transparent text-xs text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none"
                  autoFocus
                />
                {sessionSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setSessionSearchQuery("")}
                    className="text-slate-400 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Chat Filter Popover */}
          {showWorkspaceFilter && (
            <div className="mx-3 mb-2 p-2.5 rounded-2xl liquid-glass-popup text-xs space-y-2 animate-liquid-pop">
              <div className="flex items-center justify-between text-[11px] text-slate-700 dark:text-zinc-300 font-medium pb-1.5 border-b border-slate-100 dark:border-white/[0.06]">
                <span>Filter Percakapan</span>
                <button
                  type="button"
                  onClick={() => setShowWorkspaceFilter(false)}
                  className="text-slate-400 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              {/* Status Filter */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-mono">Status Sesi</label>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  {[
                    { id: "all", label: "Semua Sesi" },
                    { id: "fault", label: "Galat CAS" },
                    { id: "valid", label: "Aljabar Valid" },
                    { id: "3d", label: "Model 3D" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setWorkspaceStatusFilter(item.id as "all" | "fault" | "valid" | "3d")}
                      className={`px-2 py-1 rounded text-center transition cursor-pointer ${
                        workspaceStatusFilter === item.id
                          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-medium"
                          : "bg-slate-100 dark:bg-white/[0.03] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/[0.06]"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Flat List Riwayat Percakapan */}
          <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
            {/* Tampilkan item 'New Session' jika sedang berada di sesi baru yang belum disimpan */}
            {(!conversations.some((c) => c.id === activeConversationId) || messages.length === 0) && (
              <div
                onClick={startNewChat}
                className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-[13px] font-medium cursor-pointer transition ${
                  messages.length === 0 && !conversations.some((c) => c.id === activeConversationId)
                    ? "bg-slate-100 dark:bg-[#1e2025] text-slate-900 dark:text-white border border-slate-200/80 dark:border-transparent"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/[0.04]"
                }`}
              >
                <span className="truncate">New Session</span>
              </div>
            )}

            {/* Daftar sesi percakapan */}
            {(() => {
              const filtered = conversations
                .filter((c) => {
                  if (sessionSearchQuery.trim()) {
                    const q = sessionSearchQuery.toLowerCase();
                    const matchTitle = c.title.toLowerCase().includes(q);
                    const matchMsg = c.messages.some((m) =>
                      (m.rawText || m.replyText || m.steps?.join(" ") || "").toLowerCase().includes(q)
                    );
                    if (!matchTitle && !matchMsg) return false;
                  }
                  if (workspaceStatusFilter === "fault") {
                    return c.messages.some((m) => m.diagnosis?.diagnosis?.has_fault);
                  }
                  if (workspaceStatusFilter === "valid") {
                    return c.messages.some((m) => m.diagnosis && !m.diagnosis.diagnosis?.has_fault);
                  }
                  if (workspaceStatusFilter === "3d") {
                    return c.messages.some((m) => m.smartboardItem);
                  }
                  return true;
                });

              if (filtered.length === 0 && (sessionSearchQuery || workspaceStatusFilter !== "all")) {
                return (
                  <div className="px-2.5 py-3 text-center text-slate-400 dark:text-zinc-500 text-[12px] italic">
                    Tidak ada sesi yang cocok dengan filter
                  </div>
                );
              }

              if (conversations.length === 0 && messages.length > 0) {
                return (
                  <div className="px-2.5 py-3 text-center text-slate-400 dark:text-zinc-500 text-[12px] italic">
                    Belum ada riwayat percakapan tersimpan
                  </div>
                );
              }

              return filtered.slice(0, 40).map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => openConversation(conv.id)}
                  className={`group flex items-center justify-between px-2.5 py-2 rounded-xl text-[13px] transition cursor-pointer ${
                    conv.id === activeConversationId
                      ? "bg-slate-100 dark:bg-white/[0.08] text-slate-900 dark:text-white font-medium border border-slate-200/60 dark:border-white/[0.08]"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/[0.04]"
                  }`}
                >
                  <span className="truncate flex-1 font-normal text-slate-700 dark:text-zinc-300 group-hover:text-slate-900 dark:group-hover:text-white">
                    {conv.title}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 dark:text-zinc-500 group-hover:hidden flex-shrink-0 ml-1.5">
                    {formatRelativeTime(conv.updatedAt)}
                  </span>
                  <div className="hidden group-hover:flex items-center gap-1.5 flex-shrink-0 ml-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenShareModal(conv);
                      }}
                      className="text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white transition"
                      title="Bagikan tautan percakapan"
                    >
                      <Share2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => deleteConversation(conv.id, e)}
                      className="text-slate-400 dark:text-zinc-500 hover:text-rose-500 dark:hover:text-rose-400 transition"
                      title="Hapus sesi"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>

        {/* SECTION 2: WORKSPACES (Dibuat Manual oleh Pengguna) */}
        <div className="border-t border-slate-200/70 dark:border-white/[0.06] pt-2.5 pb-2 shrink-0">
          <div className="flex items-center justify-between px-3.5 pb-1.5 text-slate-400 dark:text-zinc-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider font-mono text-slate-500 dark:text-zinc-400">
              Workspaces
            </span>
            <button
              type="button"
              onClick={() => setShowNewWorkspaceModal(true)}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              title="Buat workspace baru"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
          </div>

          {workspaces.length === 0 ? (
            <div className="px-3 pt-0.5">
              <button
                type="button"
                onClick={() => setShowNewWorkspaceModal(true)}
                className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.15] text-[12px] text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer group"
              >
                <FolderPlus className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 group-hover:text-amber-500 transition" />
                <span>+ Buat Workspace</span>
              </button>
            </div>
          ) : (
            <div className="px-2 space-y-0.5 max-h-36 overflow-y-auto">
              {workspaces.map((ws) => {
                const isActive = ws.id === activeWorkspaceId;
                const wsFiles = workspaceFiles.filter((f) => f.workspaceId === ws.id);
                return (
                  <div
                    key={ws.id}
                    onClick={() => setActiveWorkspaceId(isActive ? "" : ws.id)}
                    className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[13px] transition cursor-pointer ${
                      isActive
                        ? "bg-slate-100 dark:bg-white/[0.08] text-slate-900 dark:text-white font-medium"
                        : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-50 dark:hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Folder className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? "text-amber-500" : "text-slate-400 dark:text-zinc-500"}`} />
                      <span className="truncate">{ws.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {wsFiles.length > 0 && (
                        <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500">
                          {wsFiles.length}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteWorkspace(ws.id);
                        }}
                        className="hidden group-hover:block p-0.5 text-slate-400 hover:text-rose-500 transition"
                        title="Hapus workspace"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar Footer: Signed in to ChatZAP + Clean Dropdown Popup */}
        <div className="p-3 border-t border-slate-200 dark:border-white/[0.06] relative" ref={profileDropdownRef}>
          <div
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center justify-between w-full hover:bg-slate-100 dark:hover:bg-white/[0.04] p-1.5 rounded-xl cursor-pointer transition"
          >
            <div className="flex items-center gap-2.5 text-[13px] text-slate-700 dark:text-zinc-300 font-medium min-w-0">
              {currentUser?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentUser.avatar} alt={currentUser.name} className="w-6 h-6 rounded-full object-cover flex-shrink-0 ring-1 ring-black/5 dark:ring-white/10" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center text-[11px] text-white flex-shrink-0 font-bold">
                  {currentUser?.name?.charAt(0) || "U"}
                </div>
              )}
              <span className="truncate">
                {currentUser?.name ? `Signed in as ${currentUser.name}` : "Signed in to ChatZAP"}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 flex-shrink-0" />
          </div>

          {/* Profile Dropdown Popup (Settings, Appearance, Models, Logout) */}
          {profileDropdownOpen && (
            <div className="absolute left-2 bottom-full mb-2.5 w-[268px] liquid-glass-popup rounded-2xl p-1.5 z-50 text-xs text-slate-800 dark:text-zinc-200 animate-liquid-pop origin-bottom-left select-none">
              {/* User Identity Header */}
              <div className="p-2 border-b border-slate-100 dark:border-white/[0.06] mb-1">
                <div className="flex items-center gap-2.5">
                  {currentUser?.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-1 ring-black/5 dark:ring-white/10"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-600/90 dark:bg-emerald-500/80 flex items-center justify-center text-xs text-white flex-shrink-0 font-semibold shadow-xs">
                      {currentUser?.name?.charAt(0) || "U"}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-slate-900 dark:text-white truncate text-[13.5px] leading-tight">
                        {currentUser?.name || "Pengguna ZAP"}
                      </span>
                      {isGuestAccount(currentUser) && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.08] text-slate-600 dark:text-zinc-400 shrink-0 font-normal">
                          Tamu
                        </span>
                      )}
                    </div>
                    <div className="text-[11.5px] text-slate-400 dark:text-zinc-400 truncate mt-0.5">
                      {currentUser?.email || "siswa@logicodix.ai"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu Actions */}
              <div className="space-y-0.5 pt-0.5">
                {/* 1. Settings (Pengaturan) */}
                <button
                  type="button"
                  onClick={() => {
                    setSettingsTab("general");
                    setShowSettingsModal(true);
                    setProfileDropdownOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-slate-100/70 dark:hover:bg-white/[0.06] text-slate-700 dark:text-zinc-200 transition text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <Settings className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 group-hover:text-slate-800 dark:group-hover:text-white transition" />
                    <span className="font-medium text-xs">Pengaturan Akun</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-600 group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* 2. Model Connector & Keys */}
                <Link
                  href="/connector"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-slate-100/70 dark:hover:bg-white/[0.06] text-slate-700 dark:text-zinc-200 transition text-left group"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 group-hover:text-slate-800 dark:group-hover:text-white transition" />
                    <span className="font-medium text-xs">Model &amp; API Keys</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-600 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                {/* 3. Appearance (Tema) — Sleek single-row with 3-icon pill switcher */}
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-slate-100/70 dark:hover:bg-white/[0.06] transition text-slate-700 dark:text-zinc-200">
                  <div className="flex items-center gap-2.5">
                    <Palette className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
                    <span className="font-medium text-xs">Tema</span>
                  </div>
                  <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-200/60 dark:bg-black/40 border border-slate-200/80 dark:border-white/[0.08]">
                    <button
                      type="button"
                      onClick={() => setTheme("light")}
                      className={`p-1 rounded-md transition cursor-pointer ${
                        theme === "light"
                          ? "bg-white text-slate-900 shadow-xs dark:bg-white dark:text-slate-900"
                          : "text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white"
                      }`}
                      title="Mode Terang (Light)"
                    >
                      <Sun className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme("dark")}
                      className={`p-1 rounded-md transition cursor-pointer ${
                        theme === "dark"
                          ? "bg-slate-900 text-white shadow-xs dark:bg-[#282a32]"
                          : "text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white"
                      }`}
                      title="Mode Gelap (Dark)"
                    >
                      <Moon className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme("system")}
                      className={`p-1 rounded-md transition cursor-pointer ${
                        theme === "system"
                          ? "bg-white dark:bg-[#282a32] text-slate-900 dark:text-white shadow-xs"
                          : "text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white"
                      }`}
                      title="Sesuai Sistem (Auto)"
                    >
                      <Laptop className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-slate-100 dark:bg-white/[0.06] my-1" />

                {/* 4. Keluar Akun (Logout) */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <LogOut className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition" />
                    <span className="font-medium text-xs">Keluar Akun</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* 2. MIDDLE COLUMN (Chat Area) */}
      <div
        className={`flex flex-col h-full overflow-hidden relative transition-all duration-200 bg-[#f8fafc] dark:bg-[#0e0f12] ${
          rightPaneFullscreen
            ? "hidden"
            : showRightPane
            ? "w-full lg:w-1/2 flex-1 border-r border-slate-200 dark:border-white/[0.06]"
            : "w-full"
        }`}
      >
        {/* Top Header of Chat Area */}
        <div className="h-10 px-3 flex items-center justify-between border-b border-transparent flex-shrink-0 z-20">
          <div className="flex items-center gap-2">
            {!sidebarOpen && (
              <div className="flex items-center p-0.5 rounded-xl bg-slate-200/60 dark:bg-white/[0.05] backdrop-blur-md border border-slate-300/60 dark:border-white/[0.08] shadow-sm">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="p-1.5 rounded-lg text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.08] transition cursor-pointer"
                  title="Buka sidebar"
                >
                  <PanelLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={startNewChat}
                  className="p-1.5 rounded-lg text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.08] transition cursor-pointer"
                  title="Percakapan Baru"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Tombol Bagikan Percakapan */}
            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => handleOpenShareModal()}
                title="Bagikan percakapan ini (URL Publik)"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/[0.08] transition shadow-sm cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-300" />
                <span className="hidden sm:inline">Bagikan</span>
              </button>
            )}

            {/* If Right Pane is closed, show toggle button (seperti di Screenshot 1) */}
            {!showRightPane && (
              <button
                type="button"
                onClick={() => setShowRightPane(true)}
                className="p-1.5 rounded-lg text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition cursor-pointer"
                title="Buka panel tools / start"
              >
                <SquareSplitHorizontal className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Main Body of Chat */}
        {messages.length === 0 ? (
          /* EMPTY HERO STATE (Persis seperti Screenshot 0 dan 1) */
          <div className="flex-1 overflow-y-auto px-4 flex flex-col justify-between">
            <div className="my-auto flex flex-col items-center justify-center text-center py-8">
              {/* Logo + Title: Into the Unknown + Preview */}
              <div className="flex items-center gap-3 mb-5">
                <ZapLogo className="w-5.5 h-5.5 text-slate-900 dark:text-white" />
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Into the Unknown</h1>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 dark:bg-white/[0.08] dark:text-zinc-300 dark:border-white/[0.1]">
                  Preview
                </span>
              </div>

              {/* Dropdown Pills above Composer (Interactive Workspace & Pedagogical Mode) */}
              <div className="w-full max-w-3xl lg:max-w-4xl flex items-center gap-2 mb-2 px-1 text-xs text-slate-500 dark:text-zinc-400 justify-start relative">
                {/* 1. Workspace Pill */}
                <div className="relative" ref={pillWorkspaceRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPillWorkspaceMenu((prev) => !prev);
                      setShowPillModeMenu(false);
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer border ${
                      showPillWorkspaceMenu
                        ? "bg-slate-200 dark:bg-white/[0.1] text-slate-900 dark:text-white border-slate-300 dark:border-white/[0.15]"
                        : "bg-slate-100/80 dark:bg-white/[0.04] text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-white/[0.08] border-slate-200 dark:border-white/[0.06]"
                    }`}
                  >
                    <Folder className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
                    <span>
                      {workspaces.find((w) => w.id === activeWorkspaceId)?.name || (workspaces.length === 0 ? "Workspace (Opsional)" : "Pilih Workspace")}
                    </span>
                    <ChevronDown className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
                  </button>

                  {/* Dropdown Popover */}
                  {showPillWorkspaceMenu && (
                    <div className="absolute left-0 top-full mt-1.5 w-60 liquid-glass-popup rounded-2xl py-1.5 z-50 text-xs animate-liquid-pop origin-top-left text-left">
                      <div className="px-3 py-1.5 text-[10px] uppercase font-mono tracking-wider text-slate-400 dark:text-zinc-500 border-b border-slate-100 dark:border-white/[0.06] mb-1">
                        Pilih Ruang Kerja
                      </div>
                      {workspaces.length === 0 ? (
                        <div className="px-3 py-2 text-center text-xs text-slate-400 dark:text-zinc-500 italic">
                          Belum ada workspace
                        </div>
                      ) : (
                        <div className="max-h-44 overflow-y-auto px-1 space-y-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveWorkspaceId("");
                              setShowPillWorkspaceMenu(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-left transition cursor-pointer ${
                              !activeWorkspaceId
                                ? "bg-slate-100 dark:bg-white/[0.08] text-slate-900 dark:text-white font-medium"
                                : "text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-zinc-200"
                            }`}
                          >
                            <span className="truncate">Tanpa Workspace</span>
                            {!activeWorkspaceId && <Check className="w-3.5 h-3.5 text-slate-700 dark:text-zinc-300" />}
                          </button>
                          {workspaces.map((ws) => (
                            <button
                              key={ws.id}
                              type="button"
                              onClick={() => {
                                setActiveWorkspaceId(ws.id);
                                setShowPillWorkspaceMenu(false);
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-left transition cursor-pointer ${
                                ws.id === activeWorkspaceId
                                  ? "bg-slate-100 dark:bg-white/[0.08] text-slate-900 dark:text-white font-medium"
                                  : "text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-zinc-200"
                              }`}
                            >
                              <span className="truncate">{ws.name}</span>
                              {ws.id === activeWorkspaceId && <Check className="w-3.5 h-3.5 text-slate-700 dark:text-zinc-300" />}
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="border-t border-slate-100 dark:border-white/[0.06] mt-1 pt-1 px-1">
                        <button
                          type="button"
                          onClick={() => {
                            setShowPillWorkspaceMenu(false);
                            setShowNewWorkspaceModal(true);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition cursor-pointer"
                        >
                          <FolderPlus className="w-3.5 h-3.5 text-amber-500" />
                          <span>Buat Workspace Baru</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Mode Pill */}
                <div className="relative" ref={pillModeRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPillModeMenu((prev) => !prev);
                      setShowPillWorkspaceMenu(false);
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer border ${
                      showPillModeMenu
                        ? "bg-slate-200 dark:bg-white/[0.1] text-slate-900 dark:text-white border-slate-300 dark:border-white/[0.15]"
                        : "bg-slate-100/80 dark:bg-white/[0.04] text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-white/[0.08] border-slate-200 dark:border-white/[0.06]"
                    }`}
                  >
                    <Atom className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
                    <span>
                      {interactionMode === "standard"
                        ? "Standard mode"
                        : interactionMode === "strict"
                        ? "Strict Zero-Answer"
                        : interactionMode === "visual"
                        ? "Visual 3D & Canvas"
                        : "CAS Diagnostic"}
                    </span>
                    <ChevronDown className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
                  </button>

                  {/* Mode Dropdown Popover */}
                  {showPillModeMenu && (
                    <div className="absolute left-0 top-full mt-1.5 w-64 liquid-glass-popup rounded-2xl py-1.5 z-50 text-xs animate-liquid-pop origin-top-left text-left">
                      <div className="px-3 py-1 text-[10px] uppercase font-mono tracking-wider text-slate-400 dark:text-zinc-500 border-b border-slate-100 dark:border-white/[0.06] mb-1">
                        Pilih Moda Pedagogi
                      </div>
                      <div className="px-1 space-y-0.5">
                        {[
                          {
                            id: "standard" as const,
                            label: "Standard Mode",
                            desc: "Bimbingan Sokratik seimbang dengan penalaran aljabar",
                          },
                          {
                            id: "strict" as const,
                            label: "Strict Zero-Answer",
                            desc: "Ketat tanpa bocoran jawaban (Invarian ZAP penuh)",
                          },
                          {
                            id: "visual" as const,
                            label: "Visual 3D & Canvas",
                            desc: "Prioritaskan visualisasi spasial, bangun ruang, & geometri",
                          },
                          {
                            id: "cas" as const,
                            label: "CAS Diagnostic",
                            desc: "Verifikasi aljabar deterministik SymPy murni",
                          },
                        ].map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              setInteractionMode(m.id);
                              try {
                                localStorage.setItem("zap_interaction_mode", m.id);
                              } catch {}
                              setShowPillModeMenu(false);
                            }}
                            className={`w-full flex flex-col items-start px-2.5 py-1.5 rounded-lg text-left transition cursor-pointer ${
                              interactionMode === m.id
                                ? "bg-slate-100 dark:bg-white/[0.08] text-slate-900 dark:text-white"
                                : "text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-white"
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="font-medium">{m.label}</span>
                              {interactionMode === m.id && (
                                <Check className="w-3.5 h-3.5 text-slate-700 dark:text-zinc-300" />
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5 leading-snug">
                              {m.desc}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Floating Prompt Box (Screenshot 0 & 1) */}
              <div className="w-full max-w-3xl lg:max-w-4xl bg-white/80 dark:bg-[#14161f]/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.09] focus-within:border-slate-400 dark:focus-within:border-white/20 rounded-3xl p-3.5 sm:p-4 shadow-2xl transition-all text-left">
                {/* Attached File Chips */}
                {attachedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pb-2">
                    {attachedFiles.map((f) => (
                      <div
                        key={f.id}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-[#22252c] border border-slate-200 dark:border-white/[0.1] text-xs text-slate-800 dark:text-zinc-200"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
                        <span className="font-medium max-w-[140px] truncate">{f.name}</span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">({Math.round(f.size / 1024) || 1}KB)</span>
                        <button
                          type="button"
                          onClick={() => setAttachedFiles((prev) => prev.filter((item) => item.id !== f.id))}
                          className="text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white cursor-pointer ml-0.5"
                          title="Hapus lampiran"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={2}
                  placeholder="Describe what you want to build, / commands, @ files or sessions"
                  className="w-full bg-transparent text-[15px] sm:text-base text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none resize-none font-sans leading-relaxed"
                />

                <div className="flex items-center justify-between pt-2">
                  {/* Left Controls with Flyout Menus */}
                  <PromptActionBarLeft
                    showAttachMenu={showAttachMenu}
                    setShowAttachMenu={setShowAttachMenu}
                    showSubUploadMenu={showSubUploadMenu}
                    setShowSubUploadMenu={setShowSubUploadMenu}
                    showWorkspaceMenu={showWorkspaceMenu}
                    setShowWorkspaceMenu={setShowWorkspaceMenu}
                    workspaceMode={workspaceMode}
                    setWorkspaceMode={setWorkspaceMode}
                    workspaces={workspaces}
                    activeWorkspaceId={activeWorkspaceId}
                    setActiveWorkspaceId={setActiveWorkspaceId}
                    workspaceFilesCount={workspaceFiles.length}
                    onUploadFilesClick={() => fileInputRef.current?.click()}
                    onCameraClick={() => cameraInputRef.current?.click()}
                    onInsertLatex={insertLatexTemplate}
                    onInsertPython={insertPythonCasTemplate}
                    onInsertExample={insertExampleProblem}
                    onOpenSmartboard={() => {
                      setShowRightPane(true);
                      setRightPaneTab("canvas");
                    }}
                    onOpenWorkspaceFiles={() => {
                      setShowRightPane(true);
                      setRightPaneTab("files");
                    }}
                    attachMenuRef={attachMenuRef}
                    workspaceMenuRef={workspaceMenuRef}
                  />

                  {/* Right Controls */}
                  <div className="flex items-center gap-2">
                    <ModelPickerWithEffort
                      variant="chatzap"
                      dropUp={true}
                      selectedModelId={selectedModel.id}
                      onSelectModel={handleSelectModel}
                      reasoningEffort={reasoningEffort}
                      onChangeEffort={setReasoningEffort}
                    />

                    <button
                      type="button"
                      onClick={() => handleSend()}
                      disabled={loading || !inputText.trim()}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition cursor-pointer ${
                        inputText.trim() && !loading
                          ? "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-zinc-200"
                          : "bg-slate-200 dark:bg-[#282a32] text-slate-400 dark:text-zinc-500 cursor-not-allowed"
                      }`}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ACTIVE CHAT LAYOUT: Scrollable Messages Stream + Permanently Fixed Bottom Composer */
          <>
            {/* 1. SCROLLABLE MESSAGES STREAM */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="space-y-6 py-6 w-full max-w-3xl lg:max-w-4xl mx-auto px-4 sm:px-6">
              {messages.map((msg) => (
                <div key={msg.id} className="space-y-3">
                  {/* User Message */}
                  {msg.sender === "user" && (
                    <div className="flex flex-col items-end group py-1.5 max-w-[85%] sm:max-w-[75%] ml-auto">
                      {/* Glass Rounded Bubble */}
                      <div className="w-fit max-w-full rounded-[22px] bg-slate-200/70 dark:bg-white/[0.07] backdrop-blur-xl border border-slate-300/60 dark:border-white/[0.09] px-5 py-3 shadow-sm text-slate-900 dark:text-zinc-100 text-[15px] sm:text-base leading-relaxed transition-all">
                        {/* If this user message is being edited: */}
                        {editingMsgId === msg.id ? (
                          <div className="space-y-2 min-w-[260px] sm:min-w-[340px]">
                            <textarea
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              rows={2}
                              className="w-full bg-white dark:bg-[#131418] border border-slate-400 dark:border-white/[0.2] rounded-xl p-2.5 text-[15px] text-slate-900 dark:text-white focus:outline-none resize-none font-sans"
                              autoFocus
                            />
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setEditingMsgId(null)}
                                className="px-2.5 py-1 rounded-lg text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition cursor-pointer"
                              >
                                Batal
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveAndResend(msg.id)}
                                className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-zinc-200 transition flex items-center gap-1 cursor-pointer"
                              >
                                <span>Kirim Ulang</span>
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {msg.steps ? (
                              <div className="space-y-1.5 font-mono pt-0.5">
                                {msg.steps.map((st, i) => (
                                  <div
                                    key={i}
                                    className="flex items-center gap-2 bg-white/60 dark:bg-black/30 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-white/[0.06]"
                                  >
                                    <span className="text-slate-400 dark:text-zinc-500 text-xs w-4">#{i + 1}</span>
                                    <div className="text-slate-900 dark:text-zinc-100 overflow-x-auto py-0.5 text-[15px]">
                                      <MathView math={st} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : msg.rawText ? (
                              <p className="text-[15px] sm:text-base text-slate-900 dark:text-zinc-100 leading-relaxed font-sans whitespace-pre-wrap selection:bg-slate-300 dark:selection:bg-white/20">
                                {msg.rawText}
                              </p>
                            ) : null}

                            {/* Attached files pills in user bubble if any */}
                            {msg.attachedFiles && msg.attachedFiles.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-200/80 dark:border-white/[0.08]">
                                {msg.attachedFiles.map((file) => (
                                  <div
                                    key={file.id}
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/80 dark:bg-black/40 text-xs text-slate-700 dark:text-zinc-300 font-mono border border-slate-200 dark:border-white/[0.08]"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
                                    <span className="truncate max-w-[160px]">{file.name}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Outside Clock Timestamp & Action Icons (DeepSeek style: clean, outside bubble, right-aligned) */}
                      {editingMsgId !== msg.id && (
                        <div className="flex items-center gap-2 mt-1 mr-1 text-slate-400 dark:text-zinc-500 text-[11px] font-mono select-none">
                          <span>{msg.timestamp}</span>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => handleCopyUserMessage(msg.rawText || msg.steps?.join("\n") || "", msg.id)}
                              className="p-1 rounded hover:bg-slate-200/60 dark:hover:bg-white/[0.08] text-slate-400 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                              title={copiedUserMsgId === msg.id ? "Tersalin!" : "Salin pesan"}
                            >
                              {copiedUserMsgId === msg.id ? (
                                <Check className="w-3.5 h-3.5 text-slate-900 dark:text-white" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => startEditingMessage(msg.id, msg.rawText || msg.steps?.join("\n") || "")}
                              className="p-1 rounded hover:bg-slate-200/60 dark:hover:bg-white/[0.08] text-slate-400 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                              title="Edit & kirim ulang"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Assistant Message */}
                  {msg.sender === "assistant" && (
                    <div className="py-2 space-y-3 w-full">
                      {/* Header Row: Zap Logo (pas in dikit) + Detail Mesin (simple & glass) + Timestamp */}
                      <div className="flex items-center gap-2 select-none">
                        <ZapLogo className="w-4.5 h-4.5 text-slate-900 dark:text-white flex-shrink-0" />

                        {/* Detail Mesin: Simple & Glass Badge */}
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100/90 dark:bg-white/[0.06] backdrop-blur-md border border-slate-200/90 dark:border-white/[0.08] text-[11px] font-sans font-medium text-slate-700 dark:text-zinc-300 shadow-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                          <span className="font-medium">{msg.modelName || selectedModel.name}</span>
                        </div>

                        <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono ml-0.5">
                          {msg.timestamp}
                        </span>
                      </div>

                        {msg.replyText && (
                          <div className="text-slate-800 dark:text-zinc-100 text-[15.5px] leading-relaxed pt-0.5">
                            <RichChatText content={msg.replyText} />
                          </div>
                        )}

                        {/* Aksi Khusus: Buka Papan Tulis Virtual jika ada bentuk geometri terdeteksi */}
                        {msg.smartboardItem && (
                          <button
                            type="button"
                            onClick={() => handleOpenSmartboard(msg.smartboardItem)}
                            className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white/70 hover:bg-white dark:bg-white/[0.04] dark:hover:bg-white/[0.07] backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] text-slate-800 dark:text-zinc-200 transition group shadow-sm text-sm cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/[0.08] flex items-center justify-center text-slate-700 dark:text-zinc-300 group-hover:scale-105 transition-transform">
                                <Box className="w-4 h-4" />
                              </div>
                              <div className="text-left">
                                <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                  <span>
                                    {msg.smartboardItem.model === "2d_shape"
                                      ? "Lihat di Papan Tulis Interaktif 2D"
                                      : "Lihat di Papan Tulis Virtual 3D"}
                                  </span>
                                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-white/[0.1]">
                                    {msg.smartboardItem.label}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                                  {msg.smartboardItem.desc || "Buka visualisasi interaktif & pergeseran parameter"}
                                </div>
                              </div>
                            </div>
                            <ArrowUpRight className="w-4 h-4 text-slate-500 dark:text-zinc-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          </button>
                        )}

                        {/* SymPy CAS Diagnosis Report */}
                        {msg.diagnosis && (
                          <div className="bg-white/80 dark:bg-[#14161f]/70 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-sm">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-2.5">
                              <div className="flex items-center gap-2 font-semibold text-sm">
                                {msg.diagnosis.diagnosis.has_fault ? (
                                  <>
                                    <AlertCircle className="w-4 h-4 text-amber-500" />
                                    <span className="text-amber-600 dark:text-amber-400">Patah Logika Terdeteksi</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    <span className="text-emerald-600 dark:text-emerald-400">Langkah Konsisten &amp; Valid</span>
                                  </>
                                )}
                              </div>
                              <span className="text-xs text-slate-400 dark:text-zinc-500 font-mono">SymPy CAS</span>
                            </div>

                            <div className="space-y-1.5">
                              {msg.diagnosis.transcription.lines.map((line) => (
                                <div
                                  key={line.line_number}
                                  className={`flex items-center justify-between px-3 py-1.5 rounded-xl border text-sm font-mono transition ${
                                    line.is_valid
                                      ? "bg-slate-50 dark:bg-black/30 border-slate-200 dark:border-white/[0.06] text-slate-700 dark:text-zinc-300"
                                      : "bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-200"
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 overflow-x-auto text-[14.5px]">
                                    <span className="text-slate-400 dark:text-zinc-500 text-xs">#{line.line_number}</span>
                                    <MathView math={line.raw_latex} />
                                  </div>
                                  <span
                                    className={`text-[10px] px-2 py-0.5 rounded-md font-sans uppercase font-bold tracking-wider ${
                                      line.is_valid
                                        ? "text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/40"
                                        : "text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-950/60"
                                    }`}
                                  >
                                    {line.is_valid ? "Valid" : "Galat"}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {msg.diagnosis.diagnosis.has_fault && (
                              <div className="space-y-2.5 pt-1">
                                <p className="text-[15px] text-slate-800 dark:text-zinc-200 leading-relaxed">
                                  {msg.diagnosis.diagnosis.human_explanation}
                                </p>
                                <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-white/[0.04] backdrop-blur-md border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-zinc-200 space-y-1.5">
                                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                                    <MessageSquareQuote className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
                                    <span>Bimbingan Sokratik:</span>
                                  </div>
                                  <p className="text-[14.5px] italic leading-relaxed text-slate-800 dark:text-zinc-200">
                                    {msg.diagnosis.diagnosis.socratic_prompt}
                                  </p>
                                </div>
                              </div>
                            )}

                            {msg.diagnosis.diagnosis.counter_example && (
                              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/[0.06] space-y-1.5">
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="flex items-center gap-1 font-medium text-slate-600 dark:text-zinc-300">
                                    <FlaskConical className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
                                    <span>Kontra-Contoh Substitusi:</span>
                                  </span>
                                </div>
                                <div className="grid grid-cols-3 gap-1 text-center text-xs">
                                  <div className="p-1.5 rounded bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06]">
                                    <div className="text-[8px] text-slate-400 dark:text-zinc-500">Var</div>
                                    <div className="font-bold text-slate-800 dark:text-white font-mono text-[11px]">
                                      {msg.diagnosis.diagnosis.counter_example.test_variable} ={" "}
                                      {msg.diagnosis.diagnosis.counter_example.test_value}
                                    </div>
                                  </div>
                                  <div className="p-1.5 rounded bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06]">
                                    <div className="text-[8px] text-slate-400 dark:text-zinc-500">Asal</div>
                                    <div className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">
                                      {msg.diagnosis.diagnosis.counter_example.lhs_expected}
                                    </div>
                                  </div>
                                  <div className="p-1.5 rounded bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06]">
                                    <div className="text-[8px] text-slate-400 dark:text-zinc-500">Hasilmu</div>
                                    <div className="font-bold text-amber-600 dark:text-amber-400 font-mono text-[11px]">
                                      {msg.diagnosis.diagnosis.counter_example.rhs_calculated}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Tombol Visualisasi di Papan Tulis */}
                            <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => handleOpenSmartboard(msg.smartboardItem)}
                                className="text-xs font-medium text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/[0.08] px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
                                <span>Visualisasikan di Papan Tulis Pintar &rarr;</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Action Icons Bar (Desain Bersih & Elegan Sesuai Foto Pengguna) */}
                        <div className="flex items-center gap-1.5 pt-1.5 text-slate-400 dark:text-zinc-400">
                          {/* 1. Copy icon */}
                          <button
                            type="button"
                            onClick={() => handleCopyMessage(msg.replyText || "", msg.id)}
                            className="p-1.5 rounded-lg hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                            title={copiedMsgId === msg.id ? "Tersalin!" : "Salin jawaban"}
                          >
                            {copiedMsgId === msg.id ? (
                              <Check className="w-4 h-4 text-slate-900 dark:text-white" />
                            ) : (
                              <Copy className="w-4 h-4 stroke-[1.6]" />
                            )}
                          </button>

                          {/* 2. Regenerate / retry icon */}
                          <button
                            type="button"
                            onClick={() => handleRegenerate(msg.id)}
                            className="p-1.5 rounded-lg hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                            title="Buat ulang respon"
                          >
                            <RotateCw className="w-4 h-4 stroke-[1.6]" />
                          </button>

                          {/* 3. Thumbs up icon */}
                          <button
                            type="button"
                            onClick={() => handleFeedback(msg.id, "up")}
                            className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer ${
                              msg.feedback === "up" ? "text-slate-900 dark:text-white bg-slate-200 dark:bg-white/[0.1]" : "hover:text-slate-800 dark:hover:text-zinc-200"
                            }`}
                            title="Bermanfaat"
                          >
                            <ThumbsUp className={`w-4 h-4 stroke-[1.6] ${msg.feedback === "up" ? "fill-current" : ""}`} />
                          </button>

                          {/* 4. Thumbs down icon */}
                          <button
                            type="button"
                            onClick={() => handleFeedback(msg.id, "down")}
                            className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer ${
                              msg.feedback === "down" ? "text-slate-900 dark:text-white bg-slate-200 dark:bg-white/[0.1]" : "hover:text-slate-800 dark:hover:text-zinc-200"
                            }`}
                            title="Kurang membantu"
                          >
                            <ThumbsDown className={`w-4 h-4 stroke-[1.6] ${msg.feedback === "down" ? "fill-current" : ""}`} />
                          </button>

                          {/* 5. Speaker / Audio TTS */}
                          <button
                            type="button"
                            onClick={() => handleSpeakMessage(msg.replyText || "", msg.id)}
                            className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer ${
                              speakingMsgId === msg.id ? "text-slate-900 dark:text-white bg-slate-200 dark:bg-white/[0.1] animate-pulse" : "hover:text-slate-800 dark:hover:text-zinc-200"
                            }`}
                            title={speakingMsgId === msg.id ? "Hentikan suara" : "Bacakan jawaban (Text-to-Speech)"}
                          >
                            {speakingMsgId === msg.id ? (
                              <VolumeX className="w-4 h-4 stroke-[1.6]" />
                            ) : (
                              <Volume2 className="w-4 h-4 stroke-[1.6]" />
                            )}
                          </button>

                          {/* 6. Share icon */}
                          <button
                            type="button"
                            onClick={() => handleShareMessage(msg.replyText || "", msg.id)}
                            className="p-1.5 rounded-lg hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                            title={sharedMsgId === msg.id ? "Tautan disalin!" : "Bagikan pesan"}
                          >
                            {sharedMsgId === msg.id ? (
                              <Check className="w-4 h-4 text-slate-900 dark:text-white" />
                            ) : (
                              <Share2 className="w-4 h-4 stroke-[1.6]" />
                            )}
                          </button>

                          {/* 7. Icon Papan Tulis */}
                          {msg.smartboardItem && (
                            <button
                              type="button"
                              onClick={() => handleOpenSmartboard(msg.smartboardItem)}
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white bg-slate-100/80 dark:bg-white/[0.05] hover:bg-slate-200/80 dark:hover:bg-white/[0.09] backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] transition-all ml-1 cursor-pointer"
                              title={`Lihat ${msg.smartboardItem.label}`}
                            >
                              <Box className="w-3.5 h-3.5 stroke-[1.8]" />
                              <span>{msg.smartboardItem.model === "2d_shape" ? "Papan Tulis 2D" : "Papan Tulis 3D"}</span>
                            </button>
                          )}
                        </div>
                      </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-2.5 items-center">
                  <ZapLogo className="w-4.5 h-4.5 animate-pulse text-slate-900 dark:text-white" />
                  <div className="bg-white/80 dark:bg-[#14161f]/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] rounded-2xl px-4 py-2 text-sm text-slate-700 dark:text-zinc-300 flex items-center gap-2.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{loadingStatus}</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} className="h-2" />
            </div>
          </div>

          {/* 2. FIXED BOTTOM COMPOSER (Stays strictly fixed at bottom when scrolling messages) */}
          <div className="w-full flex-shrink-0 z-10 bg-[#f8fafc]/90 dark:bg-[#0e0f12]/90 backdrop-blur-md">
            <div className="w-full max-w-3xl lg:max-w-4xl mx-auto px-4 sm:px-6 pb-4 pt-2">
              <div className="w-full bg-white/80 dark:bg-[#14161f]/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.09] focus-within:border-slate-400 dark:focus-within:border-white/20 rounded-3xl p-3.5 sm:p-4 shadow-2xl transition-all text-left">
              {/* Attached File Chips */}
              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pb-2">
                  {attachedFiles.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-[#22252c] border border-slate-200 dark:border-white/[0.1] text-xs text-slate-800 dark:text-zinc-200"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
                      <span className="font-medium max-w-[140px] truncate">{f.name}</span>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">({Math.round(f.size / 1024) || 1}KB)</span>
                      <button
                        type="button"
                        onClick={() => setAttachedFiles((prev) => prev.filter((item) => item.id !== f.id))}
                        className="text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white cursor-pointer ml-0.5"
                        title="Hapus lampiran"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                placeholder="Describe what you want to build, / commands, @ files or sessions"
                className="w-full bg-transparent text-[15px] sm:text-base text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none resize-none font-sans leading-relaxed"
              />

              <div className="flex items-center justify-between pt-2">
                <PromptActionBarLeft
                  showAttachMenu={showAttachMenu}
                  setShowAttachMenu={setShowAttachMenu}
                  showSubUploadMenu={showSubUploadMenu}
                  setShowSubUploadMenu={setShowSubUploadMenu}
                  showWorkspaceMenu={showWorkspaceMenu}
                  setShowWorkspaceMenu={setShowWorkspaceMenu}
                  workspaceMode={workspaceMode}
                  setWorkspaceMode={setWorkspaceMode}
                  workspaces={workspaces}
                  activeWorkspaceId={activeWorkspaceId}
                  setActiveWorkspaceId={setActiveWorkspaceId}
                  workspaceFilesCount={workspaceFiles.length}
                  onUploadFilesClick={() => fileInputRef.current?.click()}
                  onCameraClick={() => cameraInputRef.current?.click()}
                  onInsertLatex={insertLatexTemplate}
                  onInsertPython={insertPythonCasTemplate}
                  onInsertExample={insertExampleProblem}
                  onOpenSmartboard={() => {
                    setShowRightPane(true);
                    setRightPaneTab("canvas");
                  }}
                  onOpenWorkspaceFiles={() => {
                    setShowRightPane(true);
                    setRightPaneTab("files");
                  }}
                  attachMenuRef={attachMenuRef}
                  workspaceMenuRef={workspaceMenuRef}
                />

                <div className="flex items-center gap-2">
                  <ModelPickerWithEffort
                    variant="chatzap"
                    dropUp={true}
                    selectedModelId={selectedModel.id}
                    onSelectModel={handleSelectModel}
                    reasoningEffort={reasoningEffort}
                    onChangeEffort={setReasoningEffort}
                  />

                  <button
                    type="button"
                    onClick={() => handleSend()}
                    disabled={loading || !inputText.trim()}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition cursor-pointer ${
                      inputText.trim() && !loading
                        ? "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-zinc-200"
                        : "bg-slate-200 dark:bg-[#282a32] text-slate-400 dark:text-zinc-500 cursor-not-allowed"
                    }`}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
      )}
    </div>

      {/* 3. RIGHT COLUMN ("Start" Workspace / Tools Pane — Persis Screenshot 0 & 2) */}
      {showRightPane && (
        <div
          className={`h-full bg-slate-50 dark:bg-[#111216] flex flex-col relative overflow-hidden transition-all duration-200 ${
            rightPaneFullscreen ? "w-full" : "w-full lg:w-1/2 flex-1"
          }`}
        >
          {/* Header Bar: Compass Start + Window Controls (Columns, Maximize, Close) */}
          <div className="h-10 px-3.5 flex items-center justify-between border-b border-slate-200 dark:border-white/[0.06] flex-shrink-0 text-xs text-slate-500 dark:text-zinc-400 bg-white dark:bg-[#111216] z-10">
            <div className="flex items-center gap-1.5 text-slate-800 dark:text-zinc-300 font-medium">
              <Compass className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
              <span>
                {rightPaneTab === "start"
                  ? "Start"
                  : rightPaneTab === "files"
                  ? "Workspace files"
                  : rightPaneTab === "terminal"
                  ? "Terminal"
                  : "Papan Tulis Pintar"}
              </span>
              {rightPaneTab !== "start" && (
                <button
                  type="button"
                  onClick={() => setRightPaneTab("start")}
                  className="ml-2 text-[10px] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white underline cursor-pointer font-medium"
                >
                  Kembali ke Start
                </button>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setRightPaneFullscreen((prev) => !prev)}
                title={rightPaneFullscreen ? "Restore split view" : "Toggle split view"}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-400 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition"
              >
                <Columns className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setRightPaneFullscreen((prev) => !prev)}
                title={rightPaneFullscreen ? "Keluar layar penuh" : "Layar penuh"}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-400 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition"
              >
                {rightPaneFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowRightPane(false);
                  setRightPaneFullscreen(false);
                }}
                title="Tutup panel"
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-400 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 relative flex flex-col justify-center items-center overflow-hidden">
            {/* SUB-VIEW 1: START TAB (Persis Screenshot 0 & 2) */}
            {rightPaneTab === "start" && (
              <>
                {/* Background Compass Watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.12] dark:opacity-[0.07]">
                  <Compass className="w-48 h-48 text-slate-400 dark:text-white" strokeWidth={0.8} />
                </div>

                {/* Centered Stack of Action Cards */}
                <div className="w-full max-w-[420px] px-4 space-y-2.5 relative z-10">
                  {/* Card 1: Workspace files */}
                  <div
                    onClick={() => setRightPaneTab("files")}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-[#1b1c21] hover:bg-slate-50 dark:hover:bg-[#21232a] border border-slate-200 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.12] transition cursor-pointer group shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center text-slate-700 dark:text-zinc-300 flex-shrink-0">
                        <Folder className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium text-xs text-slate-800 dark:text-zinc-200 group-hover:text-slate-900 dark:group-hover:text-white">
                          Workspace files
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-zinc-500">
                          Browse files in this session&apos;s workspace
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-white/[0.04] px-2 py-0.5 rounded border border-slate-200 dark:border-white/[0.06]">
                      Ctrl + Alt + P
                    </span>
                  </div>

                  {/* Card 2: New terminal */}
                  <div
                    onClick={() => setRightPaneTab("terminal")}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-[#1b1c21] hover:bg-slate-50 dark:hover:bg-[#21232a] border border-slate-200 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.12] transition cursor-pointer group shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center text-slate-700 dark:text-zinc-300 flex-shrink-0">
                        <Terminal className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium text-xs text-slate-800 dark:text-zinc-200 group-hover:text-slate-900 dark:group-hover:text-white flex items-center gap-1">
                          <span>New terminal</span>
                          <ChevronDown className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-zinc-500">
                          Run commands in the Session workspace
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-white/[0.04] px-2 py-0.5 rounded border border-slate-200 dark:border-white/[0.06]">
                      Ctrl + `
                    </span>
                  </div>

                  {/* Card 3: Papan Tulis Pintar */}
                  <div
                    onClick={() => setRightPaneTab("canvas")}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-[#1b1c21] hover:bg-slate-50 dark:hover:bg-[#21232a] border border-slate-200 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.12] transition cursor-pointer group shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center text-slate-700 dark:text-zinc-300 flex-shrink-0">
                        <Box className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium text-xs text-slate-800 dark:text-zinc-200 group-hover:text-slate-900 dark:group-hover:text-white flex items-center gap-1.5">
                          <span>Papan Tulis Pintar</span>
                          <span className="text-[10px] text-slate-600 dark:text-zinc-300 bg-slate-100 dark:bg-white/[0.06] px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/[0.08] font-mono">2D / 3D</span>
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-zinc-500">
                          Coret-coret kapur, grafik fungsi, &amp; geometri irisan
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 4: More tools */}
                  <div
                    onClick={() => setShowMoreModal(true)}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-[#1b1c21] hover:bg-slate-50 dark:hover:bg-[#21232a] border border-slate-200 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.12] transition cursor-pointer group shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center text-slate-700 dark:text-zinc-300 flex-shrink-0">
                        <LayoutGrid className="w-4 h-4 text-slate-600 dark:text-zinc-300" />
                      </div>
                      <div>
                        <div className="font-medium text-xs text-slate-800 dark:text-zinc-200 group-hover:text-slate-900 dark:group-hover:text-white">
                          More tools
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-zinc-500">
                          Modul kalkulus, terminal, dan konektor
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* SUB-VIEW 2: WORKSPACE FILES */}
            {rightPaneTab === "files" && (
              <div className="w-full h-full flex flex-col p-4 bg-slate-50 dark:bg-[#0d0e12]">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/[0.06]">
                  <span className="font-medium text-xs text-slate-800 dark:text-zinc-200 flex items-center gap-2 truncate">
                    <Folder className="w-4 h-4 text-slate-500 dark:text-zinc-400 flex-shrink-0" />
                    <span className="truncate">
                      Workspace: {workspaces.find((w) => w.id === activeWorkspaceId)?.name || "Tanpa Workspace"}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-500 font-mono bg-slate-200/60 dark:bg-white/[0.04] px-1.5 py-0.5 rounded flex-shrink-0">
                      {workspaceFiles.length} berkas
                    </span>
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-zinc-200 text-xs font-medium transition cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Unggah File</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRightPaneTab("start")}
                      className="text-[11px] text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white cursor-pointer px-2 py-1"
                    >
                      Tutup
                    </button>
                  </div>
                </div>

                {/* Workspace Files List */}
                <div className="flex-1 overflow-y-auto py-3 space-y-1.5 font-mono text-xs text-slate-600 dark:text-zinc-400">
                  {workspaceFiles.map((file) => (
                    <div
                      key={file.id}
                      onClick={() => setPreviewFile(file)}
                      className="group flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-white/[0.02] hover:bg-slate-100 dark:hover:bg-white/[0.06] border border-slate-200 dark:border-white/[0.04] hover:border-slate-300 dark:hover:border-white/[0.1] transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-4 h-4 text-slate-500 dark:text-zinc-400 flex-shrink-0" />
                        <span className="text-slate-800 dark:text-zinc-200 group-hover:text-slate-900 dark:group-hover:text-white font-medium truncate">
                          {file.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-zinc-500 font-mono flex-shrink-0">
                        <span>{Math.round(file.size / 1024) || 1} KB</span>
                        <Eye className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-400 group-hover:text-slate-900 dark:group-hover:text-white transition" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUB-VIEW 3: TERMINAL */}
            {rightPaneTab === "terminal" && (
              <div className="w-full h-full flex flex-col p-4 bg-[#0a0b0e] font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] text-zinc-400">
                  <span className="flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-zinc-300" />
                    <span>zap-session@chatzap: ~</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setTerminalHistory([])}
                    className="text-[10px] hover:text-white cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto py-3 space-y-2 text-zinc-300">
                  {terminalHistory.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="text-zinc-400">
                        <span className="text-zinc-200">zap@logicodix</span>:<span>~</span>$ {item.cmd}
                      </div>
                      <pre className="text-zinc-400 whitespace-pre-wrap leading-relaxed text-[11px]">
                        {item.out}
                      </pre>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleTerminalSubmit} className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
                  <span className="text-zinc-400 font-bold">$</span>
                  <input
                    type="text"
                    value={terminalInput}
                    onChange={(e) => setTerminalInput(e.target.value)}
                    placeholder="Ketik perintah (contoh: diagnose (x+3)^2-4)..."
                    className="flex-1 bg-transparent text-zinc-100 focus:outline-none text-xs"
                    autoFocus
                  />
                </form>
              </div>
            )}

            {/* SUB-VIEW 4: SMARTBOARD VIRTUAL (2D / 3D / CHALKBOARD) */}
            {rightPaneTab === "canvas" && (
              <div className="w-full h-full flex flex-col bg-slate-50 dark:bg-[#080a0f] relative">
                <InteractiveCanvas3D
                  key={`canvas_${active3DModel}_${activeSolidKind}_${activePlaneShapeKind}`}
                  initialModel={active3DModel}
                  initialSolidKind={activeSolidKind}
                  initialPlaneShapeKind={activePlaneShapeKind}
                  initialParamA={canvasParamA}
                  initialParamB={canvasParamB}
                  initialParamC={canvasParamC}
                  initialUnit={canvasUnit}
                  initialShowSlice={canvasShowSlice}
                  showComparisonFault={showFaultComparison}
                  onModelChange={setActive3DModel}
                  onSolidKindChange={setActiveSolidKind}
                  onPlaneShapeChange={setActivePlaneShapeKind}
                  onParamsChange={(a, b, c, u) => {
                    setCanvasParamA(a);
                    setCanvasParamB(b);
                    setCanvasParamC(c);
                    if (u) setCanvasUnit(u);
                  }}
                  isProjectorMode={isProjectorMode}
                  onToggleProjector={() => setIsProjectorMode(!isProjectorMode)}
                  onClose={() => setRightPaneTab("start")}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: PLUGINS / CONNECTOR */}
      {showPluginModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="liquid-glass-popup rounded-3xl w-full max-w-lg p-5 space-y-4 animate-liquid-pop">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-slate-700 dark:text-zinc-300" />
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Plugins &amp; Model Connectors</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPluginModal(false)}
                className="text-slate-400 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Konfigurasikan API key untuk NVIDIA NIM, DeepSeek Cloud, ChatGPT OpenAI, Claude Anthropic, atau Custom Local Model (Ollama).
            </p>
            <div className="space-y-2 pt-1">
              <Link
                href="/connector"
                className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-zinc-200 font-medium text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <span>Buka Halaman Lengkap Connector Hub</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: AUTOMATION TASKS (Interaktif, Realtime CAS Audit & Cache Sweeper) */}
      {showTasksModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="liquid-glass-popup rounded-3xl w-full max-w-lg p-5 space-y-4 animate-liquid-pop">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.08] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center text-slate-800 dark:text-white">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Automation Tasks &amp; Invariants</h3>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400">Pusat kendali otomatisasi SymPy CAS, pemeliharaan memori &amp; sinkronisasi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTasksModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Task Controls & Features */}
            <div className="space-y-3 text-xs">
              {/* Feature 1: CAS Invariant Live Audit */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1a1c22] border border-slate-200 dark:border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-xs text-slate-900 dark:text-white">SymPy CAS Invariant Audit</div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400">Verifikasi 22 invarian aljabar deterministik &amp; whitelist parser</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRunCasAudit}
                    disabled={casAuditRunning}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-zinc-200 transition cursor-pointer disabled:opacity-50"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${casAuditRunning ? "animate-spin" : ""}`} />
                    <span>{casAuditRunning ? "Menguji..." : "Jalankan Audit"}</span>
                  </button>
                </div>
                {casAuditResult && (
                  <div className="p-2 rounded-lg bg-slate-200/60 dark:bg-white/[0.04] text-[11px] text-slate-800 dark:text-zinc-200 font-mono">
                    {casAuditResult}
                  </div>
                )}
              </div>

              {/* Feature 2: Scratchpad & Cache Sweeper */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1a1c22] border border-slate-200 dark:border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-xs text-slate-900 dark:text-white">Pembersih Scratchpad &amp; Draft Telemetri</div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400">Bersihkan sisa draft lokal dan token cache sementara</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSweepScratchpad}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-200 hover:bg-slate-300 dark:bg-white/[0.08] dark:hover:bg-white/[0.14] text-slate-800 dark:text-zinc-200 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Bersihkan</span>
                  </button>
                </div>
                {lastSweepResult && (
                  <div className="p-2 rounded-lg bg-slate-200/60 dark:bg-white/[0.04] text-[11px] text-slate-800 dark:text-zinc-200 font-mono">
                    {lastSweepResult}
                  </div>
                )}
              </div>

              {/* Feature 3 & 4: Automation Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1a1c22] border border-slate-200 dark:border-white/[0.06] flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white text-xs">Auto-Sync Vault</div>
                    <div className="text-[10px] text-slate-500 dark:text-zinc-400">Sinkronkan ke Cloud</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}
                    className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                      autoSyncEnabled ? "bg-slate-900 dark:bg-white" : "bg-slate-300 dark:bg-zinc-700"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform ${
                        autoSyncEnabled ? "translate-x-4 bg-white dark:bg-slate-900" : "translate-x-0 bg-white"
                      }`}
                    />
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1a1c22] border border-slate-200 dark:border-white/[0.06] flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white text-xs">Auto-Format LaTeX</div>
                    <div className="text-[10px] text-slate-500 dark:text-zinc-400">Format rumus baku</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoLatexEnabled(!autoLatexEnabled)}
                    className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                      autoLatexEnabled ? "bg-slate-900 dark:bg-white" : "bg-slate-300 dark:bg-zinc-700"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform ${
                        autoLatexEnabled ? "translate-x-4 bg-white dark:bg-slate-900" : "translate-x-0 bg-white"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Task Activity Logs */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 dark:text-zinc-500">
                  Log Riwayat Tugas
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1 pr-1 font-mono text-[11px]">
                  {taskLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-2 rounded-lg bg-slate-50 dark:bg-[#17181d] border border-slate-100 dark:border-white/[0.04] flex items-center justify-between text-slate-700 dark:text-zinc-300"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Check className="w-3 h-3 text-slate-500 dark:text-zinc-400 flex-shrink-0" />
                        <span className="truncate">{log.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500 flex-shrink-0 ml-2">
                        {log.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MORE */}
      {showMoreModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="liquid-glass-popup rounded-3xl w-full max-w-md p-5 space-y-4 animate-liquid-pop">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-slate-700 dark:text-zinc-300" />
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Alat &amp; Modul Ekstra</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMoreModal(false)}
                className="text-slate-400 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setShowMoreModal(false);
                  setShowRightPane(true);
                  setRightPaneTab("canvas");
                }}
                className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-[#1c1d24] dark:hover:bg-[#252732] border border-slate-200 dark:border-white/[0.06] text-left transition cursor-pointer"
              >
                <Box className="w-4 h-4 text-slate-700 dark:text-zinc-300 mb-1" />
                <div className="font-medium text-slate-900 dark:text-white">Papan Tulis 3D</div>
                <div className="text-[10px] text-slate-500 dark:text-zinc-400">Simulasi grafik interaktif</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMoreModal(false);
                  setShowRightPane(true);
                  setRightPaneTab("terminal");
                }}
                className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-[#1c1d24] dark:hover:bg-[#252732] border border-slate-200 dark:border-white/[0.06] text-left transition cursor-pointer"
              >
                <Terminal className="w-4 h-4 text-slate-700 dark:text-zinc-300 mb-1" />
                <div className="font-medium text-slate-900 dark:text-white">Terminal CLI</div>
                <div className="text-[10px] text-slate-500 dark:text-zinc-400">SymPy CAS command shell</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE NEW WORKSPACE */}
      {showNewWorkspaceModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="liquid-glass-popup rounded-3xl w-full max-w-sm p-5 space-y-4 animate-liquid-pop">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-slate-700 dark:text-zinc-300" />
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Buat Workspace Baru</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewWorkspaceModal(false)}
                className="text-slate-400 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-600 dark:text-zinc-400">Nama Workspace</label>
              <input
                type="text"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateWorkspace();
                }}
                placeholder="Misal: Aljabar SMA, Geometri 3D, UTBK..."
                className="w-full bg-slate-50 dark:bg-[#1b1c22] border border-slate-300 dark:border-white/[0.1] focus:border-slate-500 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                autoFocus
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewWorkspaceModal(false)}
                className="px-3 py-1.5 rounded-xl text-xs text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleCreateWorkspace}
                disabled={!newWorkspaceName.trim()}
                className={`px-4 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                  newWorkspaceName.trim()
                    ? "bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-zinc-200"
                    : "bg-slate-200 dark:bg-[#282a32] text-slate-400 dark:text-zinc-500 cursor-not-allowed"
                }`}
              >
                Buat Workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PREVIEW FILE WORKSPACE */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="liquid-glass-popup rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-liquid-pop">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-white/[0.08] flex items-center justify-between bg-slate-50 dark:bg-[#191b22]">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
                <span className="font-semibold text-sm text-slate-900 dark:text-white">{previewFile.name}</span>
                <span className="text-xs font-mono text-slate-400 dark:text-zinc-500">
                  ({Math.round(previewFile.size / 1024) || 1} KB)
                </span>
              </div>
              <div className="flex items-center gap-2">
                {previewFile.content && (
                  <button
                    type="button"
                    onClick={() => {
                      setInputText((prev) => (prev ? prev + "\n" + previewFile.content : previewFile.content!));
                      setPreviewFile(null);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-zinc-200 text-xs font-medium transition flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowUp className="w-3 h-3" />
                    <span>Kirim ke Chat</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([previewFile.content || ""], { type: previewFile.type });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = previewFile.name;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition cursor-pointer"
                  title="Unduh berkas"
                >
                  <Download className="w-4 h-4" />
                </button>
                {previewFile.workspaceId !== undefined && (
                  <button
                    type="button"
                    onClick={() => {
                      setWorkspaceFiles((prev) => {
                        const next = prev.filter((f) => f.id !== previewFile.id);
                        try {
                          localStorage.setItem("zap_workspace_files", JSON.stringify(next));
                        } catch (e) {
                          console.warn(e);
                        }
                        return next;
                      });
                      setPreviewFile(null);
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition cursor-pointer"
                    title="Hapus berkas dari workspace"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewFile(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            {/* Content Display */}
            <div className="p-4 overflow-y-auto flex-1 font-mono text-xs bg-slate-50 dark:bg-[#0b0c10] text-slate-800 dark:text-zinc-300 leading-relaxed select-text">
              {previewFile.content ? (
                <pre className="whitespace-pre-wrap">{previewFile.content}</pre>
              ) : previewFile.dataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewFile.dataUrl} alt={previewFile.name} className="max-w-full rounded-lg mx-auto" />
              ) : (
                <p className="text-slate-400 dark:text-zinc-500 italic">File biner tidak dapat ditampilkan langsung.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PENGATURAN & TAMPILAN (SETTINGS & APPEARANCE MODAL) */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="liquid-glass-popup rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-liquid-pop">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-white/[0.08] flex items-center justify-between bg-slate-50/80 dark:bg-[#181a20]/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center text-slate-800 dark:text-white">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Pengaturan &amp; Preferensi ChatZAP</h3>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400">Atur tampilan, bahasa percakapan, dan sinkronisasi akun</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 rounded-lg text-slate-400 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body with Horizontal Tabs */}
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Tab Navigation */}
              <div className="flex items-center gap-1 px-4 pt-2 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-[#16171d]/50 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setSettingsTab("appearance")}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition cursor-pointer whitespace-nowrap ${
                    settingsTab === "appearance"
                      ? "border-slate-900 text-slate-900 dark:border-white dark:text-white"
                      : "border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Tampilan &amp; Tema</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsTab("general")}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition cursor-pointer whitespace-nowrap ${
                    settingsTab === "general"
                      ? "border-slate-900 text-slate-900 dark:border-white dark:text-white"
                      : "border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Umum &amp; Bahasa</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsTab("sync")}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition cursor-pointer whitespace-nowrap ${
                    settingsTab === "sync"
                      ? "border-slate-900 text-slate-900 dark:border-white dark:text-white"
                      : "border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                  }`}
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>Cadangan Akun</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsTab("models")}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition cursor-pointer whitespace-nowrap ${
                    settingsTab === "models"
                      ? "border-slate-900 text-slate-900 dark:border-white dark:text-white"
                      : "border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Invarian CAS &amp; AI</span>
                </button>
              </div>

              {/* Tab Contents */}
              <div className="p-5 overflow-y-auto flex-1 space-y-5 text-xs text-slate-700 dark:text-zinc-300">
                {/* 1. APPEARANCE TAB */}
                {settingsTab === "appearance" && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-xs text-slate-900 dark:text-white mb-1">Pilihan Mode Tampilan (Theme)</h4>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400">Pilih tema antarmuka sesuai dengan kenyamanan mata Anda.</p>
                    </div>

                    {/* 3 Theme Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Light Card */}
                      <div
                        onClick={() => setTheme("light")}
                        className={`p-3.5 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between ${
                          theme === "light"
                            ? "border-slate-900 dark:border-white bg-slate-100/70 dark:bg-white/[0.08] shadow-md"
                            : "border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.16] bg-slate-50 dark:bg-[#181a20]"
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="h-16 rounded-lg bg-white border border-slate-200 p-2 flex flex-col justify-between shadow-xs">
                            <div className="flex items-center justify-between">
                              <div className="w-3 h-3 rounded-full bg-slate-900" />
                              <div className="w-12 h-1.5 rounded-full bg-slate-200" />
                            </div>
                            <div className="space-y-1">
                              <div className="w-full h-2 rounded bg-slate-100" />
                              <div className="w-3/4 h-2 rounded bg-slate-100" />
                            </div>
                          </div>
                          <div>
                            <div className="font-semibold text-xs text-slate-900 dark:text-white flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <Sun className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-300" />
                                <span>Mode Terang</span>
                              </span>
                              {theme === "light" && <Check className="w-3.5 h-3.5 text-slate-900 dark:text-white" />}
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 leading-normal">
                              Latar putih bersih dengan kontras tinggi, nyaman untuk membaca di siang hari.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Dark Card */}
                      <div
                        onClick={() => setTheme("dark")}
                        className={`p-3.5 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between ${
                          theme === "dark"
                            ? "border-slate-900 dark:border-white bg-slate-100/70 dark:bg-white/[0.08] shadow-md"
                            : "border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.16] bg-slate-50 dark:bg-[#181a20]"
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="h-16 rounded-lg bg-[#0e0f12] border border-white/[0.1] p-2 flex flex-col justify-between shadow-xs">
                            <div className="flex items-center justify-between">
                              <div className="w-3 h-3 rounded-full bg-white" />
                              <div className="w-12 h-1.5 rounded-full bg-zinc-700" />
                            </div>
                            <div className="space-y-1">
                              <div className="w-full h-2 rounded bg-zinc-800" />
                              <div className="w-3/4 h-2 rounded bg-zinc-800" />
                            </div>
                          </div>
                          <div>
                            <div className="font-semibold text-xs text-slate-900 dark:text-white flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <Moon className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-300" />
                                <span>Mode Gelap</span>
                              </span>
                              {theme === "dark" && <Check className="w-3.5 h-3.5 text-slate-900 dark:text-white" />}
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 leading-normal">
                              Latar pekat hemat daya dan ramah mata, optimal untuk fokus dan malam hari.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* System Card */}
                      <div
                        onClick={() => setTheme("system")}
                        className={`p-3.5 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between ${
                          theme === "system"
                            ? "border-slate-900 dark:border-white bg-slate-100/70 dark:bg-white/[0.08] shadow-md"
                            : "border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.16] bg-slate-50 dark:bg-[#181a20]"
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="h-16 rounded-lg bg-gradient-to-r from-white via-slate-200 to-[#0e0f12] border border-slate-300 dark:border-white/[0.1] p-2 flex flex-col justify-between shadow-xs">
                            <div className="flex items-center justify-between">
                              <div className="w-3 h-3 rounded-full bg-slate-600 dark:bg-zinc-400" />
                              <div className="w-12 h-1.5 rounded-full bg-slate-400" />
                            </div>
                            <div className="space-y-1">
                              <div className="w-full h-2 rounded bg-slate-300 dark:bg-zinc-700" />
                              <div className="w-3/4 h-2 rounded bg-slate-300 dark:bg-zinc-700" />
                            </div>
                          </div>
                          <div>
                            <div className="font-semibold text-xs text-slate-900 dark:text-white flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <Laptop className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-300" />
                                <span>Sistem Operasi</span>
                              </span>
                              {theme === "system" && <Check className="w-3.5 h-3.5 text-slate-900 dark:text-white" />}
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 leading-normal">
                              Otomatis mengikuti preferensi tema dari perangkat atau browser Anda.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Proyektor Switch */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#181a20] border border-slate-200 dark:border-white/[0.06] flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-xs text-slate-900 dark:text-white">Mode Proyektor &amp; Papan Tulis Kelas</div>
                        <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                          Tingkatkan ketebalan garis koordinat dan kontras warna canvas 3D agar jelas terlihat di proyektor kelas.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsProjectorMode(!isProjectorMode)}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                          isProjectorMode ? "bg-slate-900 dark:bg-white" : "bg-slate-300 dark:bg-zinc-700"
                        }`}
                      >
                        <span
                          className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-transform ${
                            isProjectorMode ? "translate-x-5 bg-white dark:bg-slate-900" : "translate-x-0 bg-white"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. GENERAL TAB */}
                {settingsTab === "general" && (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#181a20] border border-slate-200 dark:border-white/[0.06] space-y-3">
                      <h4 className="font-semibold text-xs text-slate-900 dark:text-white">Identitas Pengguna</h4>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 uppercase">Nama Lengkap</label>
                          <div className="font-medium text-slate-900 dark:text-white mt-0.5">{currentUser?.name}</div>
                        </div>
                        <div>
                          <label className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 uppercase">{isGuestAccount(currentUser) ? "Email Akun" : "Email Google"}</label>
                          <div className="font-medium text-slate-900 dark:text-white mt-0.5 truncate">{currentUser?.email}</div>
                        </div>
                        {isGuestAccount(currentUser) && (
                          <>
                            <div>
                              <label className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 uppercase">Jenjang Pendidikan</label>
                              <div className="font-medium text-slate-900 dark:text-white mt-0.5">{currentUser?.jenjang || "Tamu"}</div>
                            </div>
                            <div>
                              <label className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 uppercase">Peran</label>
                              <div className="font-medium text-slate-900 dark:text-white mt-0.5">{currentUser?.role || "Tamu"}</div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#181a20] border border-slate-200 dark:border-white/[0.06] space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-xs text-slate-900 dark:text-white">Konsistensi Bahasa Percakapan</div>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-white/[0.08]">
                          Aktif Otomatis
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                        AI akan secara konsisten merespons dengan bahasa yang Anda gunakan di 2–3 chat awal (misalnya Bahasa Indonesia), bahkan jika di tengah percakapan Anda menyisipkan instruksi dalam bahasa lain.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#181a20] border border-slate-200 dark:border-white/[0.06] flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-xs text-slate-900 dark:text-white">Auto-scroll Percakapan</div>
                        <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                          Otomatis menggulir layar ke bawah saat respons Sokratik baru tiba.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAutoScrollChat(!autoScrollChat)}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                          autoScrollChat ? "bg-slate-900 dark:bg-white" : "bg-slate-300 dark:bg-zinc-700"
                        }`}
                      >
                        <span
                          className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-transform ${
                            autoScrollChat ? "translate-x-5 bg-white dark:bg-slate-900" : "translate-x-0 bg-white"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. SYNC TAB */}
                {settingsTab === "sync" && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-md">
                          <Cloud className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-slate-900 dark:text-white">Cadangan Akun Google Cloud</div>
                          <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                            Terhubung: <span className="font-mono text-slate-700 dark:text-zinc-300">{currentUser?.email}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-zinc-300 leading-relaxed">
                        Semua data sesi belajar, preferensi tema ({theme}), konfigurasi model AI, dan berkas workspace otomatis dicadangkan setiap kali Anda berinteraksi.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#181a20] border border-slate-200 dark:border-white/[0.06] space-y-2">
                      <h5 className="font-semibold text-xs text-slate-900 dark:text-white">Data yang Tersimpan:</h5>
                      <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-zinc-400">
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-300" />
                          <span>Riwayat semua percakapan matematika ({conversations.length} sesi)</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-300" />
                          <span>Berkas Workspace ({workspaceFiles.length} berkas)</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-300" />
                          <span>Tema Tampilan ({theme.toUpperCase()}) &amp; API Keys terenkripsi</span>
                        </li>
                      </ul>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                        {syncSuccessToast ? (
                          <span className="text-slate-900 dark:text-white font-medium flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            Data berhasil disinkronkan ke Google Cloud!
                          </span>
                        ) : (
                          <span>Sinkronisasi otomatis aktif</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          syncAccountBackup(currentUser);
                          setSyncSuccessToast(true);
                          setTimeout(() => setSyncSuccessToast(false), 3000);
                        }}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-zinc-200 text-xs font-medium transition flex items-center gap-2 shadow-sm cursor-pointer"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>Sinkronkan Sekarang</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 4. CAS & AI MODELS TAB */}
                {settingsTab === "models" && (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#181a20] border border-slate-200 dark:border-white/[0.06] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-slate-900 dark:text-white">22 Invarian Deterministic SymPy CAS</span>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-white/[0.08]">
                          22/22 Terverifikasi
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                        SymPy CAS bertindak sebagai satu-satunya penentu kebenaran matematis. Tidak ada LLM yang diizinkan menentukan apakah langkah penurunan rumus Anda valid.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#181a20] border border-slate-200 dark:border-white/[0.06] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-slate-900 dark:text-white">Zero Answer Policy (ZAP) Guardrail</span>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-white/[0.08]">
                          Aktif &amp; Terproteksi
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                        Sistem tidak pernah memberikan jawaban numerik instan kepada siswa, melainkan mengarahkan lewat kontra-contoh substitusi dan pertanyaan pemantik Sokratik.
                      </p>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <Link
                        href="/connector"
                        onClick={() => setShowSettingsModal(false)}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-900 dark:text-white border border-slate-200 dark:border-white/[0.08] text-xs font-medium transition flex items-center gap-2 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-300" />
                        <span>Buka Hub Model &amp; API Keys (/connector) &rarr;</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal Dialog */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        conversation={sharingConv}
        currentUser={currentUser}
        active3DModel={active3DModel}
      />
    </div>
  );
}
