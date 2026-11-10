"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  RotateCcw,
  Sparkles,
  Pencil,
  Eraser,
  Trash2,
  Tv,
  Box,
  X,
  Layers,
  RotateCw,
  ChevronDown,
  ChevronUp,
  Scissors,
  Eye,
  EyeOff,
  Type,
  Move,
  Edit3,
  Send,
  Check,
} from "lucide-react";
import { useTheme } from "@/utils/theme";
import MathView from "@/components/MathView";
import ZapLogo from "@/components/ZapLogo";

export type MathModelType =
  | "empty"
  | "2d_shape"
  | "2d_quadratic"
  | "2d_trig"
  | "2d_linear"
  | "2d_circle"
  | "parabola"
  | "conic_slicer"
  | "cylinder"
  | "saddle"
  | "counting_blocks"
  | "solids"
  | "surface";

export type SolidKind = "kubus" | "balok" | "bola" | "kerucut" | "prisma" | "limas";

export type PlaneShapeKind =
  | "jajar_genjang"
  | "trapesium"
  | "segitiga"
  | "belah_ketupat"
  | "layang_layang"
  | "persegi"
  | "persegi_panjang"
  | "lingkaran"
  | "jaring_prisma"
  | "jaring_kubus"
  | "jaring_limas"
  | "jaring_balok"
  | "jaring_tabung";

export interface BoardFormulaItem {
  id: string;
  latex: string;
  rawText?: string;
  x: number; // percentage 0-100% dari lebar kanvas
  y: number; // percentage 0-100% dari tinggi kanvas
  color?: "default" | "amber" | "emerald" | "blue" | "rose" | "purple";
  fontSize?: "sm" | "base" | "lg" | "xl";
}

/**
 * Otomatis mendeteksi notasi matematika umum dari ketikan keyboard dan mengubahnya ke KaTeX
 */
export function autoFormatToLatex(input: string): string {
  if (!input || !input.trim()) return "";
  let s = input.trim();

  // Jika sudah berformat LaTeX murni (mengandung backslash), pertahankan
  if (s.includes("\\frac") || s.includes("\\sqrt") || s.includes("\\sum") || s.includes("\\int") || s.includes("\\pi")) {
    return s;
  }

  // 1. Pangkat unicode superscripts
  s = s.replace(/²/g, "^2").replace(/³/g, "^3");

  // 2. Pecahan sederhana: e.g. 1/2 atau a/b (hindari path atau tanggal)
  s = s.replace(/(\b\d+|\b[a-zA-Z])\s*\/\s*(\b\d+|\b[a-zA-Z])/g, "\\frac{$1}{$2}");

  // 3. Akar kuadrat: sqrt(x) atau akar(x)
  s = s.replace(/\bsqrt\(([^)]+)\)/gi, "\\sqrt{$1}");
  s = s.replace(/\bakar\(([^)]+)\)/gi, "\\sqrt{$1}");

  // 4. Trigonometri
  s = s.replace(/\bsin\b/gi, "\\sin");
  s = s.replace(/\bcos\b/gi, "\\cos");
  s = s.replace(/\btan\b/gi, "\\tan");

  // 5. Huruf Yunani
  s = s.replace(/\bpi\b/gi, "\\pi");
  s = s.replace(/\btheta\b/gi, "\\theta");
  s = s.replace(/\balpha\b/gi, "\\alpha");
  s = s.replace(/\bbeta\b/gi, "\\beta");

  // 6. Operator aritmatika
  s = s.replace(/\s*\*\s*/g, " \\cdot ");
  s = s.replace(/\+\-/g, "\\pm");
  s = s.replace(/<=/g, "\\le");
  s = s.replace(/>=/g, "\\ge");
  s = s.replace(/!=/g, "\\neq");

  return s;
}

/**
 * Deteksi intensi transformasi formula/teks: Grafik 2D, 3D Solid, atau Bangun Datar 2D
 */
export function detectMathTransform(text: string): "graph" | "3d" | "2d_shape" | null {
  const lower = text.toLowerCase().trim();
  // 3D Solids
  if (
    /\b(kubus|balok|bola|silinder|tabung|kerucut|prisma|limas|piramida|pelana|saddle|3d|ruang)\b/i.test(lower) &&
    !lower.includes("jaring")
  ) {
    return "3d";
  }
  // 2D Nets atau bangun datar
  if (
    /\b(jaring|jaring-jaring|net|persegi panjang|persegi|segitiga|lingkaran|belah ketupat|layang-layang|jajar genjang|trapesium|2d)\b/i.test(
      lower
    )
  ) {
    return "2d_shape";
  }
  // Fungsi kurva aljabar 2D (parabola, sinus, linear)
  if (
    lower.includes("y =") ||
    lower.includes("y=") ||
    lower.includes("f(x)") ||
    lower.includes("x^2") ||
    lower.includes("x²") ||
    lower.includes("sin") ||
    lower.includes("cos") ||
    lower.includes("tan") ||
    lower.includes("parabola") ||
    lower.includes("grafik")
  ) {
    return "graph";
  }
  return null;
}

export const FORMULA_SYMBOLS = [
  { label: "a/b", insert: "\\frac{a}{b}" },
  { label: "√x", insert: "\\sqrt{x}" },
  { label: "x²", insert: "x^2" },
  { label: "xₙ", insert: "x_n" },
  { label: "π", insert: "\\pi" },
  { label: "θ", insert: "\\theta" },
  { label: "α", insert: "\\alpha" },
  { label: "β", insert: "\\beta" },
  { label: "Δ", insert: "\\Delta" },
  { label: "±", insert: "\\pm" },
  { label: "×", insert: "\\times" },
  { label: "÷", insert: "\\div" },
  { label: "≈", insert: "\\approx" },
  { label: "≤", insert: "\\le" },
  { label: "≥", insert: "\\ge" },
  { label: "≠", insert: "\\neq" },
  { label: "∫", insert: "\\int_{a}^{b} f(x) \\, dx" },
  { label: "∑", insert: "\\sum_{i=1}^{n}" },
  { label: "∞", insert: "\\infty" },
  { label: "·", insert: "\\cdot" },
];

export const FORMULA_TEMPLATES = [
  { name: "Teorema Pythagoras", latex: "a^2 + b^2 = c^2" },
  { name: "Luas Segitiga", latex: "L = \\frac{1}{2} \\times a \\times t" },
  { name: "Luas Lingkaran", latex: "L = \\pi r^2" },
  { name: "Keliling Lingkaran", latex: "K = 2\\pi r" },
  { name: "Volume Kubus", latex: "V = s^3" },
  { name: "Luas Permukaan Kubus", latex: "L_p = 6s^2" },
  { name: "Volume Balok", latex: "V = p \\times l \\times t" },
  { name: "Volume Prisma Segitiga", latex: "V = L_a \\times t_p = \\left(\\frac{1}{2} a \\cdot t_a\\right) t_p" },
  { name: "Luas Permukaan Prisma", latex: "L_p = 2L_a + (s_1 + s_2 + s_3) \\times t_p" },
  { name: "Volume Limas Segi Empat", latex: "V = \\frac{1}{3} \\times L_a \\times t" },
  { name: "Volume Tabung", latex: "V = \\pi r^2 t" },
  { name: "Luas Tabung", latex: "L = 2\\pi r (r + t)" },
  { name: "Rumus Kuadrat ABC", latex: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}" },
  { name: "Identitas Trigonometri", latex: "\\sin^2(\\theta) + \\cos^2(\\theta) = 1" },
];

interface InteractiveCanvas3DProps {
  initialModel?: MathModelType;
  initialSolidKind?: SolidKind;
  initialPlaneShapeKind?: PlaneShapeKind;
  initialParamA?: number;
  initialParamB?: number;
  initialParamC?: number;
  initialUnit?: string;
  initialShowSlice?: boolean;
  showComparisonFault?: boolean;
  className?: string;
  onModelChange?: (model: MathModelType) => void;
  onSolidKindChange?: (solid: SolidKind) => void;
  onPlaneShapeChange?: (shape: PlaneShapeKind) => void;
  onParamsChange?: (a: number, b: number, c: number, unit?: string) => void;
  isProjectorMode?: boolean;
  onToggleProjector?: () => void;
  onClose?: () => void;
}

const GRID_Y = -1.5;

function fmt(n: number): string {
  return n.toLocaleString("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface InfoRow {
  label: string;
  formula: string;
  value?: string;
}

const SOLID_LABELS: Record<SolidKind, string> = {
  kubus: "Kubus 3D",
  balok: "Balok 3D",
  bola: "Bola 3D",
  kerucut: "Kerucut 3D",
  prisma: "Prisma Segitiga 3D",
  limas: "Limas Segi Empat 3D (Piramida)",
};

// Quick formula suggestions
const SMART_PRESETS = [
  { label: "Persegi Panjang", model: "2d_shape" as MathModelType, planeShape: "persegi_panjang" as PlaneShapeKind, paramA: 14, paramB: 8, unit: "cm", desc: "Persegi panjang p=14, l=8" },
  { label: "Persegi", model: "2d_shape" as MathModelType, planeShape: "persegi" as PlaneShapeKind, paramA: 10, unit: "cm", desc: "Persegi sisi s=10" },
  { label: "Lingkaran", model: "2d_shape" as MathModelType, planeShape: "lingkaran" as PlaneShapeKind, paramA: 7, unit: "cm", desc: "Lingkaran r=7, diameter=14" },
  { label: "Belah Ketupat", model: "2d_shape" as MathModelType, planeShape: "belah_ketupat" as PlaneShapeKind, paramA: 12, paramB: 16, unit: "cm", desc: "Belah ketupat d₁=12, d₂=16" },
  { label: "Layang-Layang", model: "2d_shape" as MathModelType, planeShape: "layang_layang" as PlaneShapeKind, paramA: 12, paramB: 16, unit: "cm", desc: "Layang-layang d₁=12, d₂=16" },
  { label: "Jajar Genjang", model: "2d_shape" as MathModelType, planeShape: "jajar_genjang" as PlaneShapeKind, paramA: 12, paramB: 8, paramC: 10, unit: "cm", desc: "Jajar genjang alas, tinggi & sisi miring" },
  { label: "Trapesium", model: "2d_shape" as MathModelType, planeShape: "trapesium" as PlaneShapeKind, paramA: 8, paramB: 14, paramC: 6, unit: "cm", desc: "Trapesium sisi sejajar & tinggi" },
  { label: "Segitiga", model: "2d_shape" as MathModelType, planeShape: "segitiga" as PlaneShapeKind, paramA: 10, paramB: 8, unit: "cm", desc: "Segitiga alas & tinggi" },
  { label: "Jaring Prisma 2D", model: "2d_shape" as MathModelType, planeShape: "jaring_prisma" as PlaneShapeKind, paramA: 8, paramB: 10, unit: "cm", desc: "Bentangan jaring-jaring 2D prisma segitiga" },
  { label: "Jaring Kubus 2D", model: "2d_shape" as MathModelType, planeShape: "jaring_kubus" as PlaneShapeKind, paramA: 10, unit: "cm", desc: "Bentangan jaring-jaring 2D kubus" },
  { label: "Jaring Limas 2D", model: "2d_shape" as MathModelType, planeShape: "jaring_limas" as PlaneShapeKind, paramA: 8, paramB: 10, unit: "cm", desc: "Bentangan jaring-jaring 2D limas segi empat" },
  { label: "y = x² - 3", model: "2d_quadratic" as MathModelType, desc: "Grafik parabola & akar real" },
  { label: "y = 2 sin(x)", model: "2d_trig" as MathModelType, desc: "Gelombang trigonometri & amplitudo" },
  { label: "Kubus 10cm", model: "solids" as MathModelType, solid: "kubus" as SolidKind, paramA: 10, unit: "cm", hasSlice: false, desc: "Kubus sisi 10 cm geometri ruang" },
  { label: "Kubus + Irisan", model: "solids" as MathModelType, solid: "kubus" as SolidKind, paramA: 10, unit: "cm", hasSlice: true, desc: "Kubus sisi 10 cm dengan bidang irisan" },
  { label: "Balok 10×6×4", model: "solids" as MathModelType, solid: "balok" as SolidKind, paramA: 10, paramB: 6, paramC: 4, unit: "cm", desc: "Balok ruang p×l×t" },
  { label: "Prisma Segitiga", model: "solids" as MathModelType, solid: "prisma" as SolidKind, paramA: 8, paramB: 10, unit: "cm", desc: "Prisma segitiga geometri ruang" },
  { label: "Piramida / Limas", model: "solids" as MathModelType, solid: "limas" as SolidKind, paramA: 8, paramB: 10, unit: "cm", desc: "Limas tegak segi empat (piramida) p×l×t" },
  { label: "Bola r=7", model: "solids" as MathModelType, solid: "bola" as SolidKind, paramA: 7, unit: "cm", desc: "Bola 3D jari-jari 7 cm" },
  { label: "Tabung r=7", model: "cylinder" as MathModelType, paramA: 7, paramB: 12, unit: "cm", desc: "Silinder ruang radius & tinggi" },
  { label: "Irisan Kerucut", model: "conic_slicer" as MathModelType, desc: "Pemotongan elips, parabola & hiperbola" },
  { label: "Pelana Kuda 3D", model: "saddle" as MathModelType, desc: "Permukaan kuadrik z = x² - y²" },
];

export default function InteractiveCanvas3D({
  initialModel = "empty",
  initialSolidKind,
  initialPlaneShapeKind,
  initialParamA,
  initialParamB,
  initialParamC,
  initialUnit,
  initialShowSlice = false,
  className = "",
  onModelChange,
  onSolidKindChange,
  onPlaneShapeChange,
  onParamsChange,
  isProjectorMode = false,
  onToggleProjector,
  onClose,
}: InteractiveCanvas3DProps) {
  // Main mode: "empty" | "2d_graph" | "3d_model"
  const [activeModel, setActiveModel] = useState<MathModelType>(initialModel);
  const [planeShapeKind, setPlaneShapeKind] = useState<PlaneShapeKind>(initialPlaneShapeKind || "jajar_genjang");

  const { isDark } = useTheme();

  // Drawing Canvas (Coret-coret kapur/stylus & Penghapus)
  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawingToolActive, setIsDrawingToolActive] = useState(false);
  const [drawingMode, setDrawingMode] = useState<"pen" | "eraser">("pen");
  const [drawColor, setDrawColor] = useState<string>(isDark ? "#f8fafc" : "#0f172a");
  const [brushSize, setBrushSize] = useState<number>(3);
  const [eraserSize, setEraserSize] = useState<number>(24);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawings, setHasDrawings] = useState(false);
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!hasDrawings) {
      setDrawColor(isDark ? "#f8fafc" : "#0f172a");
    }
  }, [isDark, hasDrawings]);

  // 2D Graph Canvas
  const graph2DCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Board Workspace Container Ref (for calculating percentage drag coordinates)
  const boardWorkspaceRef = useRef<HTMLDivElement | null>(null);

  // KaTeX Keyboard Formula Notes on Board
  const [formulaNotes, setFormulaNotes] = useState<BoardFormulaItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem("zap_board_formulas");
        if (saved) return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("zap_board_formulas", JSON.stringify(formulaNotes));
      } catch {
        // ignore
      }
    }
  }, [formulaNotes]);

  // KaTeX Formula Composer Modal State
  const [isFormulaModalOpen, setIsFormulaModalOpen] = useState(false);
  const [editingFormulaId, setEditingFormulaId] = useState<string | null>(null);
  const [latexDraft, setLatexDraft] = useState("");
  const [formulaColor, setFormulaColor] = useState<"default" | "amber" | "emerald" | "blue" | "rose" | "purple">("default");
  const [formulaFontSize, setFormulaFontSize] = useState<"sm" | "base" | "lg" | "xl">("base");

  // Floating ZAP AI Copilot Assistant Widget State (Bottom-Right)
  const [isAiWidgetOpen, setIsAiWidgetOpen] = useState(false);
  const [aiWidgetInput, setAiWidgetInput] = useState("");
  const [aiWidgetFeedback, setAiWidgetFeedback] = useState<string | null>(null);

  // On-Canvas Direct Typing & Selection State
  const [isTypingToolActive, setIsTypingToolActive] = useState(false);
  const [selectedFormulaId, setSelectedFormulaId] = useState<string | null>(null);

  // Inline On-Canvas Composer (creates/edits directly where clicked on the canvas)
  const [inlineComposer, setInlineComposer] = useState<{
    x: number; // percentage
    y: number; // percentage
    text: string;
    id?: string;
  } | null>(null);

  // Drag selection marquee (lasso / drag to select components)
  const [selectionMarquee, setSelectionMarquee] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  // Formula input bar (legacy & synced with AI widget)
  const [formulaInput, setFormulaInput] = useState("");

  // 3D Three.js Refs
  const container3DRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshGroupRef = useRef<THREE.Group | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Interactive corner handles for direct mouse drag resizing
  const cornerHandlesRef = useRef<THREE.Mesh[]>([]);
  const isDraggingCornerRef = useRef<boolean>(false);
  const dragStartDataRef = useRef<{ clientX: number; clientY: number; initialParamA: number }>({
    clientX: 0,
    clientY: 0,
    initialParamA: 10,
  });
  const hoveredCornerRef = useRef<THREE.Mesh | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseVecRef = useRef<THREE.Vector2>(new THREE.Vector2());

  // 3D State
  const [autoRotate, setAutoRotate] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [solidKind, setSolidKind] = useState<SolidKind>(initialSolidKind || "kubus");

  // Dynamic Math Parameters (A, B, C) & Unit (cm, m)
  const [paramA, setParamA] = useState(initialParamA !== undefined ? initialParamA : 10);
  const [paramB, setParamB] = useState(initialParamB !== undefined ? initialParamB : 6);
  const [paramC, setParamC] = useState(initialParamC !== undefined ? initialParamC : -3);
  const [unit, setUnit] = useState<string>(initialUnit || "cm");

  const paramARef = useRef<number>(paramA);
  const paramBRef = useRef<number>(paramB);
  const paramCRef = useRef<number>(paramC);
  const unitRef = useRef<string>(unit);
  const onParamsChangeRef = useRef(onParamsChange);
  const isDrawingToolActiveRef = useRef<boolean>(isDrawingToolActive);

  useEffect(() => {
    paramARef.current = paramA;
    paramBRef.current = paramB;
    paramCRef.current = paramC;
  }, [paramA, paramB, paramC]);

  useEffect(() => {
    unitRef.current = unit;
  }, [unit]);

  useEffect(() => {
    onParamsChangeRef.current = onParamsChange;
  }, [onParamsChange]);

  useEffect(() => {
    isDrawingToolActiveRef.current = isDrawingToolActive;
  }, [isDrawingToolActive]);

  // Cutting plane: NOT on by default! Only active if user requests or toggles it
  const [showSlicePlane, setShowSlicePlane] = useState<boolean>(Boolean(initialShowSlice));
  const [sliceProgress, setSliceProgress] = useState(0.5);

  // HUD card minimize / hide feature
  const [isHudVisible, setIsHudVisible] = useState<boolean>(true);
  const [isHudMinimized, setIsHudMinimized] = useState<boolean>(false);

  useEffect(() => {
    setActiveModel(initialModel);
    if (initialModel === "2d_shape" && initialPlaneShapeKind) {
      setPlaneShapeKind(initialPlaneShapeKind);
      onPlaneShapeChange?.(initialPlaneShapeKind);
      const label =
        initialPlaneShapeKind === "jaring_prisma"
          ? "Jaring Prisma 2D"
          : initialPlaneShapeKind === "jaring_kubus"
          ? "Jaring Kubus 2D"
          : initialPlaneShapeKind === "jaring_limas"
          ? "Jaring Limas 2D"
          : initialPlaneShapeKind === "persegi_panjang"
          ? "Persegi Panjang 2D"
          : initialPlaneShapeKind === "persegi"
          ? "Persegi 2D"
          : initialPlaneShapeKind === "segitiga"
          ? "Segitiga 2D"
          : initialPlaneShapeKind === "lingkaran"
          ? "Lingkaran 2D"
          : initialPlaneShapeKind === "jajar_genjang"
          ? "Jajar Genjang 2D"
          : initialPlaneShapeKind === "trapesium"
          ? "Trapesium 2D"
          : initialPlaneShapeKind;
      setFormulaInput(`${label} ${initialParamA || 10}${initialUnit || "cm"}`);
    } else if (initialSolidKind) {
      setSolidKind(initialSolidKind);
      onSolidKindChange?.(initialSolidKind);
      if (SOLID_LABELS[initialSolidKind]) {
        setFormulaInput(`${SOLID_LABELS[initialSolidKind]} ${initialParamA || 10}${initialUnit || "cm"}`);
      }
    }
  }, [initialModel, initialSolidKind, initialPlaneShapeKind, initialParamA, initialUnit, onSolidKindChange, onPlaneShapeChange]);

  useEffect(() => {
    if (initialParamA !== undefined) setParamA(initialParamA);
    if (initialParamB !== undefined) setParamB(initialParamB);
    if (initialParamC !== undefined) setParamC(initialParamC);
    if (initialUnit) setUnit(initialUnit);
    if (initialShowSlice !== undefined) setShowSlicePlane(initialShowSlice);
  }, [initialParamA, initialParamB, initialParamC, initialUnit, initialShowSlice]);

  const selectModel = useCallback(
    (model: MathModelType) => {
      setActiveModel(model);
      onModelChange?.(model);
    },
    [onModelChange]
  );

  // =========================================================================
  // 1. FREEHAND DRAWING CANVAS (CORET-CORET)
  // =========================================================================
  const clearDrawCanvas = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawings(false);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingToolActive) return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setPointerPos({ x, y });

    ctx.save();
    if (drawingMode === "pen") {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, eraserSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    setHasDrawings(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setPointerPos({ x, y });

    if (!isDrawing || !isDrawingToolActive) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.save();
    if (drawingMode === "pen") {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, eraserSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
  };

  const handlePointerLeave = () => {
    setIsDrawing(false);
    setPointerPos(null);
  };

  useEffect(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const syncSize = () => {
      if (canvas.width !== parent.clientWidth || canvas.height !== parent.clientHeight) {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext("2d");
        if (tempCtx) tempCtx.drawImage(canvas, 0, 0);

        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;

        const ctx = canvas.getContext("2d");
        if (ctx && tempCanvas.width > 0) {
          ctx.drawImage(tempCanvas, 0, 0);
        }
      }
    };

    syncSize();
    const observer = new ResizeObserver(syncSize);
    observer.observe(parent);
    return () => observer.disconnect();
  }, []);

  // =========================================================================
  // 2. PARSE FORMULA OR TEXT QUERY -> AUTOMATIC 2D/3D GENERATION
  // =========================================================================
  const handleSynthesizeFormula = (inputQuery: string) => {
    const raw = (inputQuery || formulaInput).toLowerCase().trim();
    if (!raw) return;

    // Check if user specifically requests slicing / irisan
    const wantsSlice = /\b(irisan|potong|penampang|slice|belah|potongan)\b/i.test(raw);
    const is2DRequested = /\b(2d|2-d|dua dimensi|jaring|jaring-jaring|net|bangun datar)\b/i.test(raw);

    // Parse dimensions & unit (e.g. "10cm", "10 cm", "r=7")
    const numMatch = raw.match(/(\d+(?:[.,]\d+)?)\s*(cm|m|mm|in)?/i);
    const parsedA = numMatch ? parseFloat(numMatch[1].replace(",", ".")) : undefined;
    const parsedUnit = numMatch ? (numMatch[2] || "cm") : "cm";

    // 2D Nets (Jaring-jaring bangun ruang jika diminta dalam format 2D)
    if (is2DRequested && (raw.includes("prisma") || raw.includes("prism"))) {
      const s = parsedA || 8;
      const t = 10;
      setParamA(s);
      setParamB(t);
      setUnit(parsedUnit);
      setPlaneShapeKind("jaring_prisma");
      selectModel("2d_shape");
      onPlaneShapeChange?.("jaring_prisma");
      onParamsChange?.(s, t, paramC, parsedUnit);
      return;
    }

    if (is2DRequested && (raw.includes("kubus") || raw.includes("cube"))) {
      const s = parsedA || 10;
      setParamA(s);
      setUnit(parsedUnit);
      setPlaneShapeKind("jaring_kubus");
      selectModel("2d_shape");
      onPlaneShapeChange?.("jaring_kubus");
      onParamsChange?.(s, paramB, paramC, parsedUnit);
      return;
    }

    if (is2DRequested && (raw.includes("limas") || raw.includes("piramid") || raw.includes("pyramid"))) {
      const s = parsedA || 8;
      const t = 10;
      setParamA(s);
      setParamB(t);
      setUnit(parsedUnit);
      setPlaneShapeKind("jaring_limas");
      selectModel("2d_shape");
      onPlaneShapeChange?.("jaring_limas");
      onParamsChange?.(s, t, paramC, parsedUnit);
      return;
    }

    // Detect 2D Plane Geometry Shapes (Jajar Genjang, Trapesium, Segitiga, etc.)
    if (raw.includes("jajar genjang") || raw.includes("jajargenjang") || raw.includes("parallelogram")) {
      const a = parsedA || 12;
      setParamA(a);
      setParamB(8); // tinggi t
      setParamC(10); // sisi miring s
      setUnit(parsedUnit);
      setPlaneShapeKind("jajar_genjang");
      selectModel("2d_shape");
      onPlaneShapeChange?.("jajar_genjang");
      onParamsChange?.(a, 8, 10, parsedUnit);
      return;
    }

    if (raw.includes("trapesium") || raw.includes("trapezoid")) {
      const a = parsedA || 8;
      setParamA(a);
      setParamB(14); // b
      setParamC(6); // t
      setUnit(parsedUnit);
      setPlaneShapeKind("trapesium");
      selectModel("2d_shape");
      onPlaneShapeChange?.("trapesium");
      onParamsChange?.(a, 14, 6, parsedUnit);
      return;
    }

    if (raw.includes("segitiga") || raw.includes("triangle")) {
      const a = parsedA || 10;
      setParamA(a);
      setParamB(8); // t
      setUnit(parsedUnit);
      setPlaneShapeKind("segitiga");
      selectModel("2d_shape");
      onPlaneShapeChange?.("segitiga");
      onParamsChange?.(a, 8, paramC, parsedUnit);
      return;
    }

    if (raw.includes("lingkaran") || raw.includes("circle")) {
      const r = parsedA || 7;
      setParamA(r);
      setUnit(parsedUnit);
      setPlaneShapeKind("lingkaran");
      selectModel("2d_shape");
      onPlaneShapeChange?.("lingkaran");
      onParamsChange?.(r, paramB, paramC, parsedUnit);
      return;
    }

    if (raw.includes("belah ketupat") || raw.includes("belahketupat") || raw.includes("rhombus")) {
      const numbers = (raw.match(/\d+(?:[.,]\d+)?/g) || []).map((m) => parseFloat(m.replace(",", ".")));
      const d1 = numbers[0] || 12;
      const d2 = numbers[1] || 16;
      setParamA(d1);
      setParamB(d2);
      setUnit(parsedUnit);
      setPlaneShapeKind("belah_ketupat");
      selectModel("2d_shape");
      onPlaneShapeChange?.("belah_ketupat");
      onParamsChange?.(d1, d2, paramC, parsedUnit);
      return;
    }

    if (raw.includes("layang layang") || raw.includes("layang-layang") || raw.includes("layanglayang") || raw.includes("kite")) {
      const numbers = (raw.match(/\d+(?:[.,]\d+)?/g) || []).map((m) => parseFloat(m.replace(",", ".")));
      const d1 = numbers[0] || 12;
      const d2 = numbers[1] || 16;
      setParamA(d1);
      setParamB(d2);
      setUnit(parsedUnit);
      setPlaneShapeKind("layang_layang");
      selectModel("2d_shape");
      onPlaneShapeChange?.("layang_layang");
      onParamsChange?.(d1, d2, paramC, parsedUnit);
      return;
    }

    if (raw.includes("persegi panjang") || raw.includes("persegipanjang") || raw.includes("rectangle")) {
      const numbers = (raw.match(/\d+(?:[.,]\d+)?/g) || []).map((m) => parseFloat(m.replace(",", ".")));
      const p = numbers[0] || 14;
      const l = numbers[1] || 8;
      setParamA(p);
      setParamB(l);
      setUnit(parsedUnit);
      setPlaneShapeKind("persegi_panjang");
      selectModel("2d_shape");
      onPlaneShapeChange?.("persegi_panjang");
      onParamsChange?.(p, l, paramC, parsedUnit);
      return;
    }

    if (raw.includes("persegi") || raw.includes("bujur sangkar") || raw.includes("square")) {
      const s = parsedA || 10;
      setParamA(s);
      setUnit(parsedUnit);
      setPlaneShapeKind("persegi");
      selectModel("2d_shape");
      onPlaneShapeChange?.("persegi");
      onParamsChange?.(s, paramB, paramC, parsedUnit);
      return;
    }

    // Detect 2D quadratic / parabola
    if (raw.includes("x^2") || raw.includes("x²") || raw.includes("kuadrat") || raw.includes("parabola")) {
      if (raw.includes("- 3") || raw.includes("-3")) {
        setParamA(1);
        setParamB(0);
        setParamC(-3);
      } else if (raw.includes("+ 3") || raw.includes("+3")) {
        setParamA(1);
        setParamB(0);
        setParamC(3);
      } else {
        setParamA(1);
        setParamB(0);
        setParamC(0);
      }
      selectModel("2d_quadratic");
      return;
    }

    // Detect 2D Trigonometry
    if (raw.includes("sin") || raw.includes("cos") || raw.includes("gelombang") || raw.includes("trig")) {
      setParamA(2);
      setParamB(1);
      setParamC(0);
      selectModel("2d_trig");
      return;
    }

    // Detect 2D Linear
    if (raw.includes("2x") || raw.includes("mx") || raw.includes("linear") || raw.includes("garis")) {
      setParamA(2);
      setParamB(1);
      selectModel("2d_linear");
      return;
    }

    // Detect 3D Shapes
    if (raw.includes("kubus") || raw.includes("cube")) {
      const size = parsedA || 10;
      setParamA(size);
      setUnit(parsedUnit);
      setSolidKind("kubus");
      setShowSlicePlane(wantsSlice);
      selectModel("solids");
      onParamsChange?.(size, paramB, paramC, parsedUnit);
      return;
    }

    if (raw.includes("balok") || raw.includes("beam") || raw.includes("persegi panjang 3d") || raw.includes("cuboid")) {
      const numbers = (raw.match(/\d+(?:[.,]\d+)?/g) || []).map((m) => parseFloat(m.replace(",", ".")));
      const p = numbers[0] || 10;
      const l = numbers[1] || 6;
      const t_val = numbers[2] || 4;
      setParamA(p);
      setParamB(l);
      setParamC(t_val);
      setUnit(parsedUnit);
      setSolidKind("balok");
      setShowSlicePlane(wantsSlice);
      selectModel("solids");
      onParamsChange?.(p, l, t_val, parsedUnit);
      return;
    }

    if (raw.includes("tabung") || raw.includes("cylinder") || raw.includes("silinder")) {
      const r = parsedA || 7;
      setParamA(r);
      setParamB(12);
      setUnit(parsedUnit);
      selectModel("cylinder");
      onParamsChange?.(r, 12, paramC, parsedUnit);
      return;
    }

    if (raw.includes("kerucut") || raw.includes("cone") || raw.includes("irisan kerucut")) {
      selectModel("conic_slicer");
      setShowSlicePlane(true);
      return;
    }

    if (raw.includes("prisma") || raw.includes("prism")) {
      const p = parsedA || 8;
      const t = 10;
      setParamA(p);
      setParamB(t);
      setUnit(parsedUnit);
      setSolidKind("prisma");
      setShowSlicePlane(wantsSlice);
      selectModel("solids");
      onParamsChange?.(p, t, paramC, parsedUnit);
      return;
    }

    if (raw.includes("limas") || raw.includes("piramida") || raw.includes("piramid") || raw.includes("pyramid")) {
      const s = parsedA || 8;
      const t = 10;
      setParamA(s);
      setParamB(t);
      setUnit(parsedUnit);
      setSolidKind("limas");
      setShowSlicePlane(wantsSlice);
      selectModel("solids");
      onParamsChange?.(s, t, paramC, parsedUnit);
      return;
    }

    if (raw.includes("bola") || raw.includes("sphere")) {
      const diameterMatch = raw.match(/diameter\s*(?:=|:|\s)?\s*(\d+(?:[.,]\d+)?)/i);
      let r = parsedA || 7;
      if (diameterMatch) {
        r = parseFloat(diameterMatch[1].replace(",", ".")) / 2;
      }
      setParamA(r);
      setUnit(parsedUnit);
      setSolidKind("bola");
      setShowSlicePlane(false);
      selectModel("solids");
      onParamsChange?.(r, paramB, paramC, parsedUnit);
      return;
    }

    if (raw.includes("pelana") || raw.includes("saddle")) {
      selectModel("saddle");
      return;
    }

    // Default to 3D Solids
    setSolidKind("kubus");
    setShowSlicePlane(wantsSlice);
    selectModel("solids");
  };

  // =========================================================================
  // 3. ZAP AI COPILOT & KATEX FORMULA ANNOTATION HANDLERS
  // =========================================================================
  const triggerAiSynthesize = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    handleSynthesizeFormula(trimmed);
    setFormulaInput(trimmed);
    setAiWidgetFeedback(`Berhasil membuat: "${trimmed}"`);
    setTimeout(() => {
      setAiWidgetFeedback(null);
      setIsAiWidgetOpen(false);
    }, 1200);
  };

  const handleFormulaPointerDown = (id: string, e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const boardEl = boardWorkspaceRef.current;
    if (!boardEl) return;
    const boardRect = boardEl.getBoundingClientRect();

    const note = formulaNotes.find((n) => n.id === id);
    if (!note) return;

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const startPercentX = note.x;
    const startPercentY = note.y;

    const onPointerMove = (moveEvt: PointerEvent) => {
      const deltaX = moveEvt.clientX - startClientX;
      const deltaY = moveEvt.clientY - startClientY;
      const deltaPercentX = (deltaX / boardRect.width) * 100;
      const deltaPercentY = (deltaY / boardRect.height) * 100;

      const newX = Math.max(1, Math.min(85, startPercentX + deltaPercentX));
      const newY = Math.max(1, Math.min(85, startPercentY + deltaPercentY));

      setFormulaNotes((prev) =>
        prev.map((item) => (item.id === id ? { ...item, x: newX, y: newY } : item))
      );
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  const handleOpenNewFormula = () => {
    setEditingFormulaId(null);
    setLatexDraft("");
    setFormulaColor("default");
    setFormulaFontSize("base");
    setIsFormulaModalOpen(true);
  };

  const handleOpenEditFormula = (note: BoardFormulaItem) => {
    setEditingFormulaId(note.id);
    setLatexDraft(note.latex);
    setFormulaColor(note.color || "default");
    setFormulaFontSize(note.fontSize || "base");
    setIsFormulaModalOpen(true);
  };

  const handleDeleteFormula = (id: string) => {
    setFormulaNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const handleSaveFormula = () => {
    const trimmed = latexDraft.trim();
    if (!trimmed) return;
    if (editingFormulaId) {
      setFormulaNotes((prev) =>
        prev.map((item) =>
          item.id === editingFormulaId
            ? {
                ...item,
                latex: trimmed,
                color: formulaColor,
                fontSize: formulaFontSize,
              }
            : item
        )
      );
    } else {
      const offsetIndex = formulaNotes.length % 5;
      const newNote: BoardFormulaItem = {
        id: `formula_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        latex: trimmed,
        x: 8 + offsetIndex * 5,
        y: 12 + offsetIndex * 12,
        color: formulaColor,
        fontSize: formulaFontSize,
      };
      setFormulaNotes((prev) => [...prev, newNote]);
    }
    setIsFormulaModalOpen(false);
    setLatexDraft("");
    setEditingFormulaId(null);
  };

  const handleInsertSymbol = (symbolStr: string) => {
    setLatexDraft((prev) => (prev ? `${prev} ${symbolStr}` : symbolStr));
  };

  // =========================================================================
  // ON-CANVAS COMPONENT TRANSFORMATION (TO 2D GRAPH, 3D SOLID, OR 2D NET)
  // =========================================================================
  const handleTransformToGraph = (expr: string) => {
    const raw = expr.toLowerCase();
    if (raw.includes("sin") || raw.includes("cos")) {
      const numMatch = raw.match(/(\d+(?:[.,]\d+)?)\s*(?:\\sin|sin)/i);
      const amp = numMatch ? parseFloat(numMatch[1].replace(",", ".")) : 2;
      setParamA(amp);
      setParamB(1);
      selectModel("2d_trig");
    } else if (raw.includes("x^2") || raw.includes("x²") || raw.includes("parabola") || raw.includes("kuadrat")) {
      let cVal = -3;
      if (raw.includes("- 3") || raw.includes("-3")) cVal = -3;
      else if (raw.includes("+ 3") || raw.includes("+3")) cVal = 3;
      else {
        const cMatch = raw.match(/([+-]\s*\d+(?:[.,]\d+)?)\s*$/);
        if (cMatch) cVal = parseFloat(cMatch[1].replace(/\s+/g, "").replace(",", "."));
      }
      setParamA(1);
      setParamB(0);
      setParamC(cVal);
      selectModel("2d_quadratic");
    } else {
      setParamA(2);
      setParamB(1);
      selectModel("2d_linear");
    }
  };

  const handleTransformTo3D = (expr: string) => {
    handleSynthesizeFormula(expr);
  };

  const handleTransformTo2D = (expr: string) => {
    handleSynthesizeFormula(expr);
  };

  const commitInlineComposer = () => {
    if (!inlineComposer || !inlineComposer.text.trim()) {
      setInlineComposer(null);
      return;
    }
    const raw = inlineComposer.text.trim();
    const formattedLatex = autoFormatToLatex(raw);

    if (inlineComposer.id) {
      setFormulaNotes((prev) =>
        prev.map((item) =>
          item.id === inlineComposer.id
            ? { ...item, latex: formattedLatex, rawText: raw }
            : item
        )
      );
      setSelectedFormulaId(inlineComposer.id);
    } else {
      const newId = `formula_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newNote: BoardFormulaItem = {
        id: newId,
        latex: formattedLatex,
        rawText: raw,
        x: Math.max(2, Math.min(80, inlineComposer.x)),
        y: Math.max(2, Math.min(80, inlineComposer.y)),
        color: "default",
        fontSize: "base",
      };
      setFormulaNotes((prev) => [...prev, newNote]);
      setSelectedFormulaId(newId);
    }
    setInlineComposer(null);
  };

  // =========================================================================
  // 3. 2D CARTESIAN & PLANE GEOMETRY VIEW (JAJAR GENJANG, TRAPESIUM, SEGITIGA)
  // =========================================================================
  const is2DGraphModel =
    activeModel === "2d_shape" ||
    activeModel === "2d_quadratic" ||
    activeModel === "2d_trig" ||
    activeModel === "2d_linear" ||
    activeModel === "2d_circle";

  useEffect(() => {
    if (!is2DGraphModel) return;
    const canvas = graph2DCanvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const originX = width / 2;
    const originY = height / 2;
    const scale = Math.min(width, height) / 18;

    ctx.fillStyle = isProjectorMode ? "#0c101d" : isDark ? "#080a0f" : "#ffffff";
    ctx.fillRect(0, 0, width, height);

    const isCartesianGraph = activeModel !== "2d_shape";

    if (isCartesianGraph) {
      // 1. Grid lines kartesius untuk fungsi aljabar (parabola, trig, linear)
      ctx.lineWidth = 1;
      ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(148, 163, 184, 0.25)";
      const minX = -Math.ceil(originX / scale);
      const maxX = Math.ceil((width - originX) / scale);
      const minY = -Math.ceil((height - originY) / scale);
      const maxY = Math.ceil(originY / scale);

      for (let x = minX; x <= maxX; x++) {
        const cx = originX + x * scale;
        ctx.beginPath();
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx, height);
        ctx.stroke();
      }
      for (let y = minY; y <= maxY; y++) {
        const cy = originY - y * scale;
        ctx.beginPath();
        ctx.moveTo(0, cy);
        ctx.lineTo(width, cy);
        ctx.stroke();
      }

      // Sumbu X dan Y
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.25)" : "rgba(100, 116, 139, 0.4)";
      ctx.beginPath();
      ctx.moveTo(0, originY);
      ctx.lineTo(width, originY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(originX, 0);
      ctx.lineTo(originX, height);
      ctx.stroke();

      // Angka koordinat
      ctx.fillStyle = isDark ? "rgba(255, 255, 255, 0.55)" : "#475569";
      ctx.font = "11px monospace";
      for (let x = minX; x <= maxX; x += 2) {
        if (x !== 0) ctx.fillText(x.toString(), originX + x * scale - 4, originY + 14);
      }
      for (let y = minY; y <= maxY; y += 2) {
        if (y !== 0) ctx.fillText(y.toString(), originX + 6, originY - y * scale + 3);
      }
      ctx.fillText("0", originX + 5, originY + 12);
      ctx.fillText("X", width - 15, originY - 6);
      ctx.fillText("Y", originX + 6, 15);
    } else {
      // 2. Blueprint chalkboard grid halus untuk Bangun Datar 2D & Jaring-Jaring (TANPA Sumbu X/Y atau angka tabrakan)
      ctx.lineWidth = 1;
      ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(148, 163, 184, 0.12)";
      const step = 40;
      for (let cx = 0; cx <= width; cx += step) {
        ctx.beginPath();
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx, height);
        ctx.stroke();
      }
      for (let cy = 0; cy <= height; cy += step) {
        ctx.beginPath();
        ctx.moveTo(0, cy);
        ctx.lineTo(width, cy);
        ctx.stroke();
      }
    }

    ctx.lineWidth = 2.5;
    if (activeModel === "2d_quadratic") {
      ctx.strokeStyle = isDark ? "#38bdf8" : "#0284c7";
      ctx.beginPath();
      let started = false;
      for (let px = 0; px <= width; px += 2) {
        const x = (px - originX) / scale;
        const y = paramA * x * x + paramB * x + paramC;
        const py = originY - y * scale;
        if (!started) {
          ctx.moveTo(px, py);
          started = true;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();

      const vertexX = -paramB / (2 * paramA);
      const vertexY = paramC - (paramB * paramB) / (4 * paramA);
      const pvx = originX + vertexX * scale;
      const pvy = originY - vertexY * scale;

      ctx.fillStyle = isDark ? "#fb7185" : "#be123c";
      ctx.beginPath();
      ctx.arc(pvx, pvy, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isDark ? "#ffffff" : "#0f172a";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText(`Puncak (${fmt(vertexX)}, ${fmt(vertexY)})`, pvx + 8, pvy - 8);
    } else if (activeModel === "2d_trig") {
      ctx.strokeStyle = isDark ? "#c084fc" : "#7e22ce";
      ctx.beginPath();
      for (let px = 0; px <= width; px += 2) {
        const x = (px - originX) / scale;
        const y = paramA * Math.sin(paramB * x);
        const py = originY - y * scale;
        if (px === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    } else if (activeModel === "2d_shape") {
      // =====================================================================
      // BANGUN DATAR 2D (JAJAR GENJANG, TRAPESIUM, SEGITIGA, DLL.)
      // =====================================================================
      const u = unit || "cm";

      if (planeShapeKind === "jajar_genjang") {
        const a = paramA || 12;
        const t = paramB || 8;
        const s = paramC || 10;
        const angleDeg = 60;
        const angleRad = (angleDeg * Math.PI) / 180;
        const dx = t / Math.tan(angleRad);

        const totalW = a + dx;
        const totalH = t;
        const sc = Math.min((width * 0.65) / totalW, (height * 0.6) / totalH);

        const leftX = originX - (totalW * sc) / 2;
        const botY = originY + (totalH * sc) / 2;

        const Ax = leftX;
        const Ay = botY;
        const Bx = leftX + a * sc;
        const By = botY;
        const Cx = Bx + dx * sc;
        const Cy = botY - t * sc;
        const Dx = leftX + dx * sc;
        const Dy = botY - t * sc;

        // 1. Fill polygon with soft translucent cyan
        ctx.fillStyle = isDark ? "rgba(56, 189, 248, 0.14)" : "rgba(14, 165, 233, 0.16)";
        ctx.beginPath();
        ctx.moveTo(Ax, Ay);
        ctx.lineTo(Bx, By);
        ctx.lineTo(Cx, Cy);
        ctx.lineTo(Dx, Dy);
        ctx.closePath();
        ctx.fill();

        // 2. Outline stroke
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = isDark ? "#38bdf8" : "#0284c7";
        ctx.stroke();

        // 3. Dashed height line from D down to base line
        ctx.save();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = isDark ? "#fb7185" : "#be123c";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(Dx, Dy);
        ctx.lineTo(Dx, Ay);
        ctx.stroke();

        // Right angle indicator at the foot of height
        const sqSize = 10;
        ctx.setLineDash([]);
        ctx.strokeStyle = isDark ? "#fb7185" : "#be123c";
        ctx.lineWidth = 1.2;
        ctx.strokeRect(Dx, Ay - sqSize, sqSize, sqSize);
        ctx.restore();

        // 4. Labels
        ctx.font = "bold 13px sans-serif";
        ctx.fillStyle = isDark ? "#ffffff" : "#0f172a";

        // Vertices A, B, C, D
        ctx.fillText("A", Ax - 16, Ay + 16);
        ctx.fillText("B", Bx + 6, By + 16);
        ctx.fillText("C", Cx + 8, Cy - 6);
        ctx.fillText("D", Dx - 16, Dy - 6);

        // Base label: a = ...
        ctx.font = "bold 12px sans-serif";
        ctx.fillStyle = isDark ? "#38bdf8" : "#0369a1";
        ctx.textAlign = "center";
        ctx.fillText(`alas (a) = ${a} ${u}`, (Ax + Bx) / 2, Ay + 22);

        // Height label: t = ... (inside parallelogram, to the right of red dashed line)
        ctx.fillStyle = isDark ? "#fb7185" : "#be123c";
        ctx.textAlign = "left";
        ctx.fillText(`tinggi (t) = ${t} ${u}`, Dx + 10, (Dy + Ay) / 2);

        // Slant side label: s = ... (outside parallelogram, to the left of side AD)
        ctx.fillStyle = isDark ? "#34d399" : "#047857";
        ctx.textAlign = "right";
        ctx.fillText(`sisi miring (s) = ${s} ${u}`, (Ax + Dx) / 2 - 14, (Ay + Dy) / 2 - 6);

        // Angle indicator at vertex A
        ctx.strokeStyle = isDark ? "#fbbf24" : "#b45309";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(Ax, Ay, 24, -angleRad, 0);
        ctx.stroke();

        ctx.fillStyle = isDark ? "#fbbf24" : "#b45309";
        ctx.textAlign = "left";
        ctx.font = "bold 11px sans-serif";
        ctx.fillText("θ = 60°", Ax + 28, Ay - 8);

        // Vertex Dots
        [[Ax, Ay], [Bx, By], [Cx, Cy], [Dx, Dy]].forEach(([vx, vy]) => {
          ctx.fillStyle = isDark ? "#38bdf8" : "#0284c7";
          ctx.beginPath();
          ctx.arc(vx, vy, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(vx, vy, 2, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (planeShapeKind === "trapesium") {
        const topW = paramA || 8;
        const botW = paramB || 14;
        const h = paramC || 6;
        const sc = Math.min((width * 0.65) / botW, (height * 0.6) / h);

        const diff = (botW - topW) / 2;
        const leftX = originX - (botW * sc) / 2;
        const botY = originY + (h * sc) / 2;

        const Ax = leftX;
        const Ay = botY;
        const Bx = leftX + botW * sc;
        const By = botY;
        const Cx = leftX + (botW - diff) * sc;
        const Cy = botY - h * sc;
        const Dx = leftX + diff * sc;
        const Dy = botY - h * sc;

        ctx.fillStyle = isDark ? "rgba(168, 85, 247, 0.14)" : "rgba(168, 85, 247, 0.16)";
        ctx.beginPath();
        ctx.moveTo(Ax, Ay);
        ctx.lineTo(Bx, By);
        ctx.lineTo(Cx, Cy);
        ctx.lineTo(Dx, Dy);
        ctx.closePath();
        ctx.fill();

        ctx.lineWidth = 2.5;
        ctx.strokeStyle = isDark ? "#c084fc" : "#7e22ce";
        ctx.stroke();

        ctx.save();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = isDark ? "#fb7185" : "#be123c";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(Dx, Dy);
        ctx.lineTo(Dx, Ay);
        ctx.stroke();
        ctx.restore();

        ctx.font = "bold 12px sans-serif";
        ctx.fillStyle = isDark ? "#c084fc" : "#6b21a8";
        ctx.textAlign = "center";
        ctx.fillText(`sisi atas (a) = ${topW} ${u}`, (Dx + Cx) / 2, Dy - 10);
        ctx.fillText(`sisi bawah (b) = ${botW} ${u}`, (Ax + Bx) / 2, Ay + 22);
        ctx.fillStyle = isDark ? "#fb7185" : "#be123c";
        ctx.textAlign = "left";
        ctx.fillText(`tinggi (t) = ${h} ${u}`, Dx + 8, (Dy + Ay) / 2);
      } else if (planeShapeKind === "segitiga") {
        const a = paramA || 10;
        const h = paramB || 8;
        const sc = Math.min((width * 0.65) / a, (height * 0.6) / h);

        const leftX = originX - (a * sc) / 2;
        const botY = originY + (h * sc) / 2;

        const Ax = leftX;
        const Ay = botY;
        const Bx = leftX + a * sc;
        const By = botY;
        const Cx = leftX + (a * sc) / 2;
        const Cy = botY - h * sc;

        ctx.fillStyle = isDark ? "rgba(52, 211, 153, 0.14)" : "rgba(16, 185, 129, 0.16)";
        ctx.beginPath();
        ctx.moveTo(Ax, Ay);
        ctx.lineTo(Bx, By);
        ctx.lineTo(Cx, Cy);
        ctx.closePath();
        ctx.fill();

        ctx.lineWidth = 2.5;
        ctx.strokeStyle = isDark ? "#34d399" : "#047857";
        ctx.stroke();

        ctx.save();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = isDark ? "#fb7185" : "#be123c";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(Cx, Cy);
        ctx.lineTo(Cx, Ay);
        ctx.stroke();
        ctx.restore();

        ctx.font = "bold 12px sans-serif";
        ctx.fillStyle = isDark ? "#34d399" : "#047857";
        ctx.textAlign = "center";
        ctx.fillText(`alas (a) = ${a} ${u}`, (Ax + Bx) / 2, Ay + 22);
        ctx.fillStyle = isDark ? "#fb7185" : "#be123c";
        ctx.textAlign = "right";
        ctx.fillText(`t = ${h} ${u}`, Cx - 6, (Cy + Ay) / 2);
      } else if (planeShapeKind === "persegi_panjang") {
        const p = paramA || 14;
        const l = paramB || 8;
        const sc = Math.min((width * 0.65) / p, (height * 0.6) / l);

        const leftX = originX - (p * sc) / 2;
        const topY = originY - (l * sc) / 2;
        const rectW = p * sc;
        const rectH = l * sc;

        const Ax = leftX;
        const Ay = topY + rectH;
        const Bx = leftX + rectW;
        const By = topY + rectH;
        const Cx = leftX + rectW;
        const Cy = topY;
        const Dx = leftX;
        const Dy = topY;

        // Fill translucent indigo
        ctx.fillStyle = isDark ? "rgba(99, 102, 241, 0.14)" : "rgba(99, 102, 241, 0.16)";
        ctx.beginPath();
        ctx.rect(leftX, topY, rectW, rectH);
        ctx.fill();

        // Stroke outline
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = isDark ? "#818cf8" : "#4f46e5";
        ctx.stroke();

        // Right angle squares at 4 corners
        const sqSize = 10;
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = isDark ? "#818cf8" : "#4f46e5";
        ctx.strokeRect(Ax, Ay - sqSize, sqSize, sqSize);
        ctx.strokeRect(Bx - sqSize, By - sqSize, sqSize, sqSize);
        ctx.strokeRect(Cx - sqSize, Cy, sqSize, sqSize);
        ctx.strokeRect(Dx, Dy, sqSize, sqSize);

        // Labels
        ctx.font = "bold 13px sans-serif";
        ctx.fillStyle = isDark ? "#ffffff" : "#0f172a";
        ctx.fillText("A", Ax - 16, Ay + 16);
        ctx.fillText("B", Bx + 6, By + 16);
        ctx.fillText("C", Cx + 6, Cy - 6);
        ctx.fillText("D", Dx - 16, Dy - 6);

        // Dimensions: p on bottom, l on right
        ctx.font = "bold 12px sans-serif";
        ctx.fillStyle = isDark ? "#818cf8" : "#4338ca";
        ctx.textAlign = "center";
        ctx.fillText(`panjang (p) = ${p} ${u}`, (Ax + Bx) / 2, Ay + 24);

        ctx.textAlign = "left";
        ctx.fillText(`lebar (l) = ${l} ${u}`, Bx + 10, (Cy + By) / 2);

        // Vertex dots
        [[Ax, Ay], [Bx, By], [Cx, Cy], [Dx, Dy]].forEach(([vx, vy]) => {
          ctx.fillStyle = isDark ? "#818cf8" : "#4f46e5";
          ctx.beginPath();
          ctx.arc(vx, vy, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(vx, vy, 2, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (planeShapeKind === "persegi") {
        const s = paramA || 10;
        const sc = Math.min((width * 0.65) / s, (height * 0.6) / s);

        const leftX = originX - (s * sc) / 2;
        const topY = originY - (s * sc) / 2;
        const sidePx = s * sc;

        const Ax = leftX;
        const Ay = topY + sidePx;
        const Bx = leftX + sidePx;
        const By = topY + sidePx;
        const Cx = leftX + sidePx;
        const Cy = topY;
        const Dx = leftX;
        const Dy = topY;

        ctx.fillStyle = isDark ? "rgba(16, 185, 129, 0.14)" : "rgba(16, 185, 129, 0.16)";
        ctx.beginPath();
        ctx.rect(leftX, topY, sidePx, sidePx);
        ctx.fill();

        ctx.lineWidth = 2.5;
        ctx.strokeStyle = isDark ? "#34d399" : "#059669";
        ctx.stroke();

        const sqSize = 10;
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = isDark ? "#34d399" : "#059669";
        ctx.strokeRect(Ax, Ay - sqSize, sqSize, sqSize);
        ctx.strokeRect(Bx - sqSize, By - sqSize, sqSize, sqSize);
        ctx.strokeRect(Cx - sqSize, Cy, sqSize, sqSize);
        ctx.strokeRect(Dx, Dy, sqSize, sqSize);

        ctx.font = "bold 13px sans-serif";
        ctx.fillStyle = isDark ? "#ffffff" : "#0f172a";
        ctx.fillText("A", Ax - 16, Ay + 16);
        ctx.fillText("B", Bx + 6, By + 16);
        ctx.fillText("C", Cx + 6, Cy - 6);
        ctx.fillText("D", Dx - 16, Dy - 6);

        ctx.font = "bold 12px sans-serif";
        ctx.fillStyle = isDark ? "#34d399" : "#047857";
        ctx.textAlign = "center";
        ctx.fillText(`sisi (s) = ${s} ${u}`, (Ax + Bx) / 2, Ay + 24);

        ctx.textAlign = "left";
        ctx.fillText(`sisi (s) = ${s} ${u}`, Bx + 10, (Cy + By) / 2);

        [[Ax, Ay], [Bx, By], [Cx, Cy], [Dx, Dy]].forEach(([vx, vy]) => {
          ctx.fillStyle = isDark ? "#34d399" : "#059669";
          ctx.beginPath();
          ctx.arc(vx, vy, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(vx, vy, 2, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (planeShapeKind === "lingkaran") {
        const r = paramA || 7;
        const sc = Math.min((width * 0.65) / (2 * r), (height * 0.6) / (2 * r));
        const rPx = r * sc;

        // Fill translucent cyan / sky
        ctx.fillStyle = isDark ? "rgba(14, 165, 233, 0.14)" : "rgba(14, 165, 233, 0.16)";
        ctx.beginPath();
        ctx.arc(originX, originY, rPx, 0, Math.PI * 2);
        ctx.fill();

        // Stroke outline
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = isDark ? "#38bdf8" : "#0284c7";
        ctx.stroke();

        // Center dot O
        ctx.fillStyle = isDark ? "#38bdf8" : "#0284c7";
        ctx.beginPath();
        ctx.arc(originX, originY, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(originX, originY, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = "bold 13px sans-serif";
        ctx.fillStyle = isDark ? "#ffffff" : "#0f172a";
        ctx.fillText("O", originX - 12, originY - 10);

        // Radius line (O to right boundary)
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = isDark ? "#38bdf8" : "#0284c7";
        ctx.setLineDash([5, 3]);
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.lineTo(originX + rPx, originY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Radius end dot
        ctx.fillStyle = isDark ? "#38bdf8" : "#0284c7";
        ctx.beginPath();
        ctx.arc(originX + rPx, originY, 4, 0, Math.PI * 2);
        ctx.fill();

        // Labels
        ctx.font = "bold 12px sans-serif";
        ctx.fillStyle = isDark ? "#38bdf8" : "#0369a1";
        ctx.textAlign = "center";
        ctx.fillText(`jari-jari (r) = ${r} ${u}`, originX + rPx / 2, originY - 10);

        ctx.fillStyle = isDark ? "#94a3b8" : "#64748b";
        ctx.fillText(`diameter (d) = ${2 * r} ${u}`, originX, originY + rPx + 24);
      } else if (planeShapeKind === "belah_ketupat") {
        const d1 = paramA || 12;
        const d2 = paramB || 16;
        const sc = Math.min((width * 0.65) / d1, (height * 0.6) / d2);
        const wHalf = (d1 * sc) / 2;
        const hHalf = (d2 * sc) / 2;

        const Ax = originX;
        const Ay = originY + hHalf; // bottom
        const Bx = originX + wHalf; // right
        const By = originY;
        const Cx = originX;
        const Cy = originY - hHalf; // top
        const Dx = originX - wHalf; // left
        const Dy = originY;

        // Fill translucent amber
        ctx.fillStyle = isDark ? "rgba(245, 158, 11, 0.14)" : "rgba(245, 158, 11, 0.16)";
        ctx.beginPath();
        ctx.moveTo(Ax, Ay);
        ctx.lineTo(Bx, By);
        ctx.lineTo(Cx, Cy);
        ctx.lineTo(Dx, Dy);
        ctx.closePath();
        ctx.fill();

        // Stroke
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = isDark ? "#fbbf24" : "#d97706";
        ctx.stroke();

        // Dashed diagonals d1 and d2
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = isDark ? "#fb7185" : "#e11d48";
        ctx.setLineDash([5, 3]);
        ctx.beginPath();
        ctx.moveTo(Dx, Dy);
        ctx.lineTo(Bx, By);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(Ax, Ay);
        ctx.lineTo(Cx, Cy);
        ctx.stroke();
        ctx.setLineDash([]);

        // Right angle at center
        const sq = 8;
        ctx.strokeStyle = isDark ? "#fb7185" : "#e11d48";
        ctx.strokeRect(originX, originY - sq, sq, sq);

        // Vertices
        ctx.font = "bold 13px sans-serif";
        ctx.fillStyle = isDark ? "#ffffff" : "#0f172a";
        ctx.fillText("A", Ax, Ay + 18);
        ctx.fillText("B", Bx + 14, By + 4);
        ctx.fillText("C", Cx, Cy - 10);
        ctx.fillText("D", Dx - 16, Dy + 4);

        // Diagonal labels & side label
        const s = Math.sqrt(Math.pow(d1 / 2, 2) + Math.pow(d2 / 2, 2)).toFixed(1);
        ctx.font = "bold 12px sans-serif";
        ctx.fillStyle = isDark ? "#fb7185" : "#be123c";
        ctx.textAlign = "center";
        ctx.fillText(`d₁ = ${d1} ${u}`, (originX + Bx) / 2, originY - 8);
        ctx.textAlign = "left";
        ctx.fillText(`d₂ = ${d2} ${u}`, originX + 8, (originY + Cy) / 2);

        ctx.fillStyle = isDark ? "#fbbf24" : "#b45309";
        ctx.textAlign = "center";
        ctx.fillText(`s = ${s} ${u}`, (Bx + Cx) / 2 + 16, (By + Cy) / 2 - 4);

        [[Ax, Ay], [Bx, By], [Cx, Cy], [Dx, Dy]].forEach(([vx, vy]) => {
          ctx.fillStyle = isDark ? "#fbbf24" : "#d97706";
          ctx.beginPath();
          ctx.arc(vx, vy, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(vx, vy, 2, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (planeShapeKind === "layang_layang") {
        const d1 = paramA || 12;
        const d2 = paramB || 16;
        const sc = Math.min((width * 0.65) / d1, (height * 0.6) / d2);
        const wHalf = (d1 * sc) / 2;
        const topH = (d2 * sc) * 0.35;
        const botH = (d2 * sc) * 0.65;

        const Ax = originX;
        const Ay = originY + botH; // bottom
        const Bx = originX + wHalf; // right
        const By = originY;
        const Cx = originX;
        const Cy = originY - topH; // top
        const Dx = originX - wHalf; // left
        const Dy = originY;

        // Fill translucent violet
        ctx.fillStyle = isDark ? "rgba(168, 85, 247, 0.14)" : "rgba(168, 85, 247, 0.16)";
        ctx.beginPath();
        ctx.moveTo(Ax, Ay);
        ctx.lineTo(Bx, By);
        ctx.lineTo(Cx, Cy);
        ctx.lineTo(Dx, Dy);
        ctx.closePath();
        ctx.fill();

        // Stroke
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = isDark ? "#c084fc" : "#9333ea";
        ctx.stroke();

        // Dashed diagonals
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = isDark ? "#fb7185" : "#e11d48";
        ctx.setLineDash([5, 3]);
        ctx.beginPath();
        ctx.moveTo(Dx, Dy);
        ctx.lineTo(Bx, By);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(Ax, Ay);
        ctx.lineTo(Cx, Cy);
        ctx.stroke();
        ctx.setLineDash([]);

        // Right angle at center
        const sq = 8;
        ctx.strokeStyle = isDark ? "#fb7185" : "#e11d48";
        ctx.strokeRect(originX, originY - sq, sq, sq);

        // Vertices
        ctx.font = "bold 13px sans-serif";
        ctx.fillStyle = isDark ? "#ffffff" : "#0f172a";
        ctx.fillText("A", Ax, Ay + 18);
        ctx.fillText("B", Bx + 14, By + 4);
        ctx.fillText("C", Cx, Cy - 10);
        ctx.fillText("D", Dx - 16, Dy + 4);

        // Labels
        ctx.font = "bold 12px sans-serif";
        ctx.fillStyle = isDark ? "#fb7185" : "#be123c";
        ctx.textAlign = "center";
        ctx.fillText(`d₁ = ${d1} ${u}`, (originX + Bx) / 2, originY - 8);
        ctx.textAlign = "left";
        ctx.fillText(`d₂ = ${d2} ${u}`, originX + 8, (originY + Cy) / 2);

        [[Ax, Ay], [Bx, By], [Cx, Cy], [Dx, Dy]].forEach(([vx, vy]) => {
          ctx.fillStyle = isDark ? "#c084fc" : "#9333ea";
          ctx.beginPath();
          ctx.arc(vx, vy, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(vx, vy, 2, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (planeShapeKind === "jaring_prisma") {
        // Jaring-Jaring 2D Prisma Segitiga (Bentangan 3 persegi panjang sisi tegak + 2 segitiga alas/tutup)
        const s = paramA || 8;
        const t = paramB || 10;
        const u = unit || "cm";
        const hTri = (Math.sqrt(3) / 2) * s;

        // Healthy aspect ratio clamping so columns never collapse into skinny overlapping slits
        const totalW = 3 * s;
        const totalH = t + 2 * hTri;
        const sc = Math.min((width * 0.65) / totalW, (height * 0.70) / totalH);

        // Ensure each rectangular column is at least 65px wide and total height is at least 120px
        let w = Math.max(65, s * sc);
        let h = Math.max(120, t * sc);
        let ht = Math.max(38, hTri * sc);

        // Fit within canvas safely
        if (3 * w > width * 0.8) {
          w = (width * 0.8) / 3;
        }
        if (h + 2 * ht > height * 0.75) {
          const factor = (height * 0.75) / (h + 2 * ht);
          h *= factor;
          ht *= factor;
        }

        const leftX = originX - 1.5 * w;
        const topY = originY - h / 2;

        // Fill all 3 rectangles (sisi tegak)
        ctx.fillStyle = isDark ? "rgba(56, 189, 248, 0.12)" : "rgba(14, 165, 233, 0.14)";
        ctx.fillRect(leftX, topY, 3 * w, h);

        // Fill 2 triangular bases (alas & tutup)
        ctx.beginPath();
        // Top triangle (Tutup)
        ctx.moveTo(originX - 0.5 * w, topY);
        ctx.lineTo(originX + 0.5 * w, topY);
        ctx.lineTo(originX, topY - ht);
        ctx.closePath();
        // Bottom triangle (Alas)
        ctx.moveTo(originX - 0.5 * w, topY + h);
        ctx.lineTo(originX + 0.5 * w, topY + h);
        ctx.lineTo(originX, topY + h + ht);
        ctx.closePath();
        ctx.fill();

        // Stroke Outer Perimeter
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = isDark ? "#38bdf8" : "#0284c7";
        ctx.strokeRect(leftX, topY, 3 * w, h);

        ctx.beginPath();
        // Top triangle outer edges
        ctx.moveTo(originX - 0.5 * w, topY);
        ctx.lineTo(originX, topY - ht);
        ctx.lineTo(originX + 0.5 * w, topY);
        // Bottom triangle outer edges
        ctx.moveTo(originX - 0.5 * w, topY + h);
        ctx.lineTo(originX, topY + h + ht);
        ctx.lineTo(originX + 0.5 * w, topY + h);
        ctx.stroke();

        // Interior Folding Lines (garis lipatan putus-putus)
        ctx.setLineDash([5, 4]);
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = isDark ? "#fb7185" : "#e11d48";
        ctx.beginPath();
        // Between rect 1 and 2
        ctx.moveTo(leftX + w, topY);
        ctx.lineTo(leftX + w, topY + h);
        // Between rect 2 and 3
        ctx.moveTo(leftX + 2 * w, topY);
        ctx.lineTo(leftX + 2 * w, topY + h);
        // Top fold line
        ctx.moveTo(originX - 0.5 * w, topY);
        ctx.lineTo(originX + 0.5 * w, topY);
        // Bottom fold line
        ctx.moveTo(originX - 0.5 * w, topY + h);
        ctx.lineTo(originX + 0.5 * w, topY + h);
        ctx.stroke();
        ctx.setLineDash([]);

        // Helper to draw clean pill text badge without any background collision
        const drawPillBadge = (text: string, bx: number, by: number, isPrimary = false) => {
          ctx.font = isPrimary ? "bold 12px sans-serif" : "bold 11px sans-serif";
          const tw = ctx.measureText(text).width;
          const pw = tw + 14;
          const ph = 20;

          ctx.fillStyle = isDark ? "rgba(15, 23, 42, 0.9)" : "rgba(255, 255, 255, 0.95)";
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(bx - pw / 2, by - ph / 2, pw, ph, 6);
          else ctx.rect(bx - pw / 2, by - ph / 2, pw, ph);
          ctx.fill();

          ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.12)";
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = isPrimary ? (isDark ? "#38bdf8" : "#0284c7") : (isDark ? "#e2e8f0" : "#1e293b");
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(text, bx, by);
        };

        // Triangles labels
        drawPillBadge("Tutup Segitiga", originX, topY - ht * 0.45);
        drawPillBadge("Alas Segitiga", originX, topY + h + ht * 0.45);

        // Rectangles labels (using adaptive numbering if narrow, full label if wide)
        if (w >= 90) {
          drawPillBadge("Sisi Tegak 1", leftX + 0.5 * w, originY);
          drawPillBadge("Sisi Tegak 2 (Tengah)", originX, originY);
          drawPillBadge("Sisi Tegak 3", leftX + 2.5 * w, originY);
        } else {
          drawPillBadge("Bidang 1", leftX + 0.5 * w, originY);
          drawPillBadge("Bidang 2", originX, originY);
          drawPillBadge("Bidang 3", leftX + 2.5 * w, originY);
        }

        // Side length (s) label below alas
        drawPillBadge(`s = ${s} ${u}`, originX, topY + h + ht + 20, true);

        // Height (t) dimension with dedicated vertical arrow line on the right
        const dimX = leftX + 3 * w + 20;
        ctx.strokeStyle = isDark ? "#38bdf8" : "#0284c7";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(dimX, topY);
        ctx.lineTo(dimX, topY + h);
        ctx.moveTo(dimX - 4, topY);
        ctx.lineTo(dimX + 4, topY);
        ctx.moveTo(dimX - 4, topY + h);
        ctx.lineTo(dimX + 4, topY + h);
        ctx.stroke();

        drawPillBadge(`t = ${t} ${u}`, dimX + 34, originY, true);

        // Clean title badge above top triangle
        drawPillBadge("Jaring-Jaring 2D Prisma Segitiga", originX, topY - ht - 20, true);
      } else if (planeShapeKind === "jaring_kubus") {
        // Jaring-Jaring 2D Kubus (Pola Salib / T-Cross)
        const s = paramA || 10;
        const sc = Math.min((width * 0.7) / (4 * s), (height * 0.7) / (3 * s));
        const box = s * sc;

        const startX = originX - 2 * box;
        const startY = originY - 0.5 * box;

        // Fill 6 squares
        ctx.fillStyle = isDark ? "rgba(16, 185, 129, 0.12)" : "rgba(16, 185, 129, 0.14)";
        // 4 in horizontal row
        ctx.fillRect(startX, startY, 4 * box, box);
        // 1 above (col 1)
        ctx.fillRect(startX + box, startY - box, box, box);
        // 1 below (col 1)
        ctx.fillRect(startX + box, startY + box, box, box);

        // Stroke Outer Perimeter
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = isDark ? "#34d399" : "#059669";
        ctx.strokeRect(startX, startY, 4 * box, box);
        ctx.strokeRect(startX + box, startY - box, box, box);
        ctx.strokeRect(startX + box, startY + box, box, box);

        // Folding lines (dashed)
        ctx.setLineDash([5, 4]);
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = isDark ? "#fb7185" : "#e11d48";
        ctx.beginPath();
        for (let i = 1; i < 4; i++) {
          ctx.moveTo(startX + i * box, startY);
          ctx.lineTo(startX + i * box, startY + box);
        }
        ctx.moveTo(startX + box, startY);
        ctx.lineTo(startX + 2 * box, startY);
        ctx.moveTo(startX + box, startY + box);
        ctx.lineTo(startX + 2 * box, startY + box);
        ctx.stroke();
        ctx.setLineDash([]);

        // Labels
        ctx.font = "bold 11px sans-serif";
        ctx.fillStyle = isDark ? "#ffffff" : "#0f172a";
        ctx.textAlign = "center";
        ctx.fillText("Atas", startX + 1.5 * box, startY - 0.5 * box + 4);
        ctx.fillText("Kiri", startX + 0.5 * box, startY + 0.5 * box + 4);
        ctx.fillText("Depan", startX + 1.5 * box, startY + 0.5 * box + 4);
        ctx.fillText("Kanan", startX + 2.5 * box, startY + 0.5 * box + 4);
        ctx.fillText("Belakang", startX + 3.5 * box, startY + 0.5 * box + 4);
        ctx.fillText("Bawah (Alas)", startX + 1.5 * box, startY + 1.5 * box + 4);

        ctx.font = "bold 12px sans-serif";
        ctx.fillStyle = isDark ? "#34d399" : "#047857";
        ctx.fillText(`rusuk (s) = ${s} ${u}`, originX, startY + 2.2 * box);
        ctx.font = "bold 13px sans-serif";
        ctx.fillText("Jaring-Jaring 2D Kubus", originX, startY - 1.3 * box);
      } else if (planeShapeKind === "jaring_limas") {
        // Jaring-Jaring 2D Limas Segi Empat (Piramida)
        const s = paramA || 8;
        const t = paramB || 10;
        const ts = Math.sqrt((s / 2) ** 2 + t ** 2);
        const total = s + 2 * ts;
        const sc = Math.min((width * 0.7) / total, (height * 0.7) / total);

        const sq = s * sc;
        const petal = ts * sc;

        const leftX = originX - sq / 2;
        const topY = originY - sq / 2;

        // Central Square
        ctx.fillStyle = isDark ? "rgba(245, 158, 11, 0.12)" : "rgba(245, 158, 11, 0.14)";
        ctx.fillRect(leftX, topY, sq, sq);

        // 4 Triangular Petals
        ctx.beginPath();
        // Top
        ctx.moveTo(leftX, topY);
        ctx.lineTo(leftX + sq, topY);
        ctx.lineTo(originX, topY - petal);
        ctx.closePath();
        // Bottom
        ctx.moveTo(leftX, topY + sq);
        ctx.lineTo(leftX + sq, topY + sq);
        ctx.lineTo(originX, topY + sq + petal);
        ctx.closePath();
        // Left
        ctx.moveTo(leftX, topY);
        ctx.lineTo(leftX, topY + sq);
        ctx.lineTo(leftX - petal, originY);
        ctx.closePath();
        // Right
        ctx.moveTo(leftX + sq, topY);
        ctx.lineTo(leftX + sq, topY + sq);
        ctx.lineTo(leftX + sq + petal, originY);
        ctx.closePath();
        ctx.fill();

        // Stroke Outer
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = isDark ? "#fbbf24" : "#d97706";
        ctx.beginPath();
        ctx.moveTo(leftX, topY);
        ctx.lineTo(originX, topY - petal);
        ctx.lineTo(leftX + sq, topY);
        ctx.lineTo(leftX + sq + petal, originY);
        ctx.lineTo(leftX + sq, topY + sq);
        ctx.lineTo(originX, topY + sq + petal);
        ctx.lineTo(leftX, topY + sq);
        ctx.lineTo(leftX - petal, originY);
        ctx.closePath();
        ctx.stroke();

        // Folding lines (dashed around central square)
        ctx.setLineDash([5, 4]);
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = isDark ? "#fb7185" : "#e11d48";
        ctx.strokeRect(leftX, topY, sq, sq);
        ctx.setLineDash([]);

        // Labels
        ctx.font = "bold 11px sans-serif";
        ctx.fillStyle = isDark ? "#ffffff" : "#0f172a";
        ctx.textAlign = "center";
        ctx.fillText("Alas Persegi", originX, originY + 4);

        ctx.font = "bold 12px sans-serif";
        ctx.fillStyle = isDark ? "#fbbf24" : "#b45309";
        ctx.fillText(`s = ${s} ${u}`, originX, topY + sq + 16);
        ctx.fillText(`t_s = ${ts.toFixed(1)} ${u}`, originX, topY - petal - 8);
        ctx.font = "bold 13px sans-serif";
        ctx.fillText("Jaring-Jaring 2D Limas (Piramida)", originX, topY - petal - 24);
      }
    }
  }, [activeModel, planeShapeKind, paramA, paramB, paramC, unit, isProjectorMode, is2DGraphModel, isDark]);

  // =========================================================================
  // 4. THREE.JS 3D MESH GENERATOR (KUBUS SOLID, BALOK, SILINDER, KERUCUT)
  // =========================================================================
  const is3DModel =
    activeModel === "parabola" ||
    activeModel === "conic_slicer" ||
    activeModel === "cylinder" ||
    activeModel === "saddle" ||
    activeModel === "counting_blocks" ||
    activeModel === "solids" ||
    activeModel === "surface";

  const solidMetrics = useCallback((): { volume: number; surface: number; rows: InfoRow[] } => {
    const A = paramA || 10;
    const B = paramB || 6;
    const C = paramC || 4;
    const u = unit || "cm";

    if (activeModel === "2d_shape") {
      if (planeShapeKind === "jajar_genjang") {
        const a = paramA !== undefined ? paramA : 12;
        const t = paramB !== undefined ? paramB : 8;
        const s = paramC !== undefined ? paramC : 10;
        const luas = a * t;
        const keliling = 2 * (a + s);
        return {
          volume: 0,
          surface: luas,
          rows: [
            { label: "Panjang Alas (a)", formula: "a", value: `${fmt(a)} ${u}` },
            { label: "Tinggi Tegak (t)", formula: "t", value: `${fmt(t)} ${u}` },
            { label: "Sisi Miring (s)", formula: "s", value: `${fmt(s)} ${u}` },
            { label: "Luas Jajar Genjang", formula: "L = a · t", value: `${fmt(luas)} ${u}²` },
            { label: "Keliling Jajar Genjang", formula: "K = 2(a + s)", value: `${fmt(keliling)} ${u}` },
          ],
        };
      } else if (planeShapeKind === "trapesium") {
        const a = paramA !== undefined ? paramA : 8;
        const b = paramB !== undefined ? paramB : 14;
        const t = paramC !== undefined ? paramC : 6;
        const luas = ((a + b) * t) / 2;
        return {
          volume: 0,
          surface: luas,
          rows: [
            { label: "Sisi Atas (a)", formula: "a", value: `${fmt(a)} ${u}` },
            { label: "Sisi Bawah (b)", formula: "b", value: `${fmt(b)} ${u}` },
            { label: "Tinggi (t)", formula: "t", value: `${fmt(t)} ${u}` },
            { label: "Luas Trapesium", formula: "L = ½(a + b)t", value: `${fmt(luas)} ${u}²` },
          ],
        };
      } else if (planeShapeKind === "segitiga") {
        const a = paramA !== undefined ? paramA : 10;
        const t = paramB !== undefined ? paramB : 8;
        const luas = (a * t) / 2;
        return {
          volume: 0,
          surface: luas,
          rows: [
            { label: "Alas Segitiga (a)", formula: "a", value: `${fmt(a)} ${u}` },
            { label: "Tinggi Segitiga (t)", formula: "t", value: `${fmt(t)} ${u}` },
            { label: "Luas Segitiga", formula: "L = ½ a · t", value: `${fmt(luas)} ${u}²` },
          ],
        };
      } else if (planeShapeKind === "persegi_panjang") {
        const p = paramA !== undefined ? paramA : 14;
        const l = paramB !== undefined ? paramB : 8;
        const luas = p * l;
        const keliling = 2 * (p + l);
        const diagonal = Math.sqrt(p * p + l * l);
        return {
          volume: 0,
          surface: luas,
          rows: [
            { label: "Panjang (p)", formula: "p", value: `${fmt(p)} ${u}` },
            { label: "Lebar (l)", formula: "l", value: `${fmt(l)} ${u}` },
            { label: "Luas Persegi Panjang", formula: "L = p · l", value: `${fmt(luas)} ${u}²` },
            { label: "Keliling Persegi Panjang", formula: "K = 2(p + l)", value: `${fmt(keliling)} ${u}` },
            { label: "Panjang Diagonal", formula: "d = √(p² + l²)", value: `${fmt(Number(diagonal.toFixed(2)))} ${u}` },
          ],
        };
      } else if (planeShapeKind === "persegi") {
        const s = paramA !== undefined ? paramA : 10;
        const luas = s * s;
        const keliling = 4 * s;
        const diagonal = s * Math.sqrt(2);
        return {
          volume: 0,
          surface: luas,
          rows: [
            { label: "Panjang Sisi (s)", formula: "s", value: `${fmt(s)} ${u}` },
            { label: "Luas Persegi", formula: "L = s²", value: `${fmt(luas)} ${u}²` },
            { label: "Keliling Persegi", formula: "K = 4s", value: `${fmt(keliling)} ${u}` },
            { label: "Panjang Diagonal", formula: "d = s√2", value: `${fmt(Number(diagonal.toFixed(2)))} ${u}` },
          ],
        };
      } else if (planeShapeKind === "lingkaran") {
        const r = paramA !== undefined ? paramA : 7;
        const luas = Math.PI * r * r;
        const keliling = 2 * Math.PI * r;
        const diameter = 2 * r;
        return {
          volume: 0,
          surface: luas,
          rows: [
            { label: "Jari-jari (r)", formula: "r", value: `${fmt(r)} ${u}` },
            { label: "Diameter (d)", formula: "d = 2r", value: `${fmt(diameter)} ${u}` },
            { label: "Luas Lingkaran", formula: "L = πr²", value: `${fmt(Number(luas.toFixed(2)))} ${u}²` },
            { label: "Keliling Lingkaran", formula: "K = 2πr", value: `${fmt(Number(keliling.toFixed(2)))} ${u}` },
          ],
        };
      } else if (planeShapeKind === "belah_ketupat") {
        const d1 = paramA !== undefined ? paramA : 12;
        const d2 = paramB !== undefined ? paramB : 16;
        const s = Math.sqrt(Math.pow(d1 / 2, 2) + Math.pow(d2 / 2, 2));
        const luas = (d1 * d2) / 2;
        const keliling = 4 * s;
        return {
          volume: 0,
          surface: luas,
          rows: [
            { label: "Diagonal 1 (d₁)", formula: "d₁", value: `${fmt(d1)} ${u}` },
            { label: "Diagonal 2 (d₂)", formula: "d₂", value: `${fmt(d2)} ${u}` },
            { label: "Sisi Miring (s)", formula: "s = √((d₁/2)² + (d₂/2)²)", value: `${fmt(Number(s.toFixed(2)))} ${u}` },
            { label: "Luas Belah Ketupat", formula: "L = ½ d₁ · d₂", value: `${fmt(luas)} ${u}²` },
            { label: "Keliling Belah Ketupat", formula: "K = 4s", value: `${fmt(Number(keliling.toFixed(2)))} ${u}` },
          ],
        };
      } else if (planeShapeKind === "layang_layang") {
        const d1 = paramA !== undefined ? paramA : 12;
        const d2 = paramB !== undefined ? paramB : 16;
        const luas = (d1 * d2) / 2;
        return {
          volume: 0,
          surface: luas,
          rows: [
            { label: "Diagonal Utama (d₁)", formula: "d₁", value: `${fmt(d1)} ${u}` },
            { label: "Diagonal Melintang (d₂)", formula: "d₂", value: `${fmt(d2)} ${u}` },
            { label: "Luas Layang-Layang", formula: "L = ½ d₁ · d₂", value: `${fmt(luas)} ${u}²` },
          ],
        };
      } else if (planeShapeKind === "jaring_prisma") {
        const s = paramA !== undefined ? paramA : 8;
        const t = paramB !== undefined ? paramB : 10;
        const luasAlas = (Math.sqrt(3) / 4) * s * s;
        const luasSelimut = 3 * s * t;
        const totalNet = 2 * luasAlas + luasSelimut;
        return {
          volume: 0,
          surface: totalNet,
          rows: [
            { label: "Sisi Alas Segitiga (s)", formula: "s", value: `${fmt(s)} ${u}` },
            { label: "Tinggi Sisi Tegak (t)", formula: "t", value: `${fmt(t)} ${u}` },
            { label: "Luas 1 Alas Segitiga", formula: "La = (√3/4)s²", value: `${fmt(Number(luasAlas.toFixed(2)))} ${u}²` },
            { label: "Luas 3 Sisi Tegak", formula: "Ls = 3st", value: `${fmt(Number(luasSelimut.toFixed(2)))} ${u}²` },
            { label: "Total Luas Jaring-Jaring", formula: "L = 2La + Ls", value: `${fmt(Number(totalNet.toFixed(2)))} ${u}²` },
          ],
        };
      } else if (planeShapeKind === "jaring_kubus") {
        const s = paramA !== undefined ? paramA : 10;
        const totalNet = 6 * s * s;
        return {
          volume: 0,
          surface: totalNet,
          rows: [
            { label: "Panjang Rusuk (s)", formula: "s", value: `${fmt(s)} ${u}` },
            { label: "Luas 1 Bidang Persegi", formula: "L₁ = s²", value: `${fmt(s * s)} ${u}²` },
            { label: "Total Luas Jaring-Jaring", formula: "L = 6s²", value: `${fmt(totalNet)} ${u}²` },
          ],
        };
      } else if (planeShapeKind === "jaring_limas") {
        const s = paramA !== undefined ? paramA : 8;
        const t = paramB !== undefined ? paramB : 10;
        const ts = Math.sqrt((s / 2) ** 2 + t ** 2);
        const luasAlas = s * s;
        const luas4Segitiga = 2 * s * ts;
        const totalNet = luasAlas + luas4Segitiga;
        return {
          volume: 0,
          surface: totalNet,
          rows: [
            { label: "Sisi Alas Persegi (s)", formula: "s", value: `${fmt(s)} ${u}` },
            { label: "Tinggi Limas (t)", formula: "t", value: `${fmt(t)} ${u}` },
            { label: "Tinggi Sisi Miring (ts)", formula: "ts = √((s/2)²+t²)", value: `${fmt(Number(ts.toFixed(2)))} ${u}` },
            { label: "Luas Alas Persegi", formula: "La = s²", value: `${fmt(luasAlas)} ${u}²` },
            { label: "Luas 4 Segitiga Selimut", formula: "Ls = 2·s·ts", value: `${fmt(Number(luas4Segitiga.toFixed(2)))} ${u}²` },
            { label: "Total Luas Jaring-Jaring", formula: "L = La + Ls", value: `${fmt(Number(totalNet.toFixed(2)))} ${u}²` },
          ],
        };
      }
    }

    if (activeModel === "cylinder") {
      const r = paramA !== undefined ? paramA : 7;
      const h = paramB !== undefined ? paramB : 12;
      const v = Math.PI * r * r * h;
      const ls = 2 * Math.PI * r * h;
      const lp = 2 * Math.PI * r * (r + h);
      return {
        volume: v,
        surface: lp,
        rows: [
          { label: "Jari-jari Alas (r)", formula: "r", value: `${fmt(r)} ${u}` },
          { label: "Tinggi Silinder (t)", formula: "t", value: `${fmt(h)} ${u}` },
          { label: "Luas Selimut", formula: "2πrt", value: `${fmt(ls)} ${u}²` },
          { label: "Luas Permukaan", formula: "2πr(r+t)", value: `${fmt(lp)} ${u}²` },
          { label: "Volume Tabung", formula: "V = πr²t", value: `${fmt(v)} ${u}³` },
        ],
      };
    }

    switch (solidKind) {
      case "kubus": {
        const v = A ** 3;
        const lp = 6 * A * A;
        const diagRuang = A * Math.sqrt(3);
        const rows: InfoRow[] = [
          { label: "Panjang Sisi (s)", formula: "s", value: `${fmt(A)} ${u}` },
          { label: "Luas Permukaan", formula: "L = 6s²", value: `${fmt(lp)} ${u}²` },
          { label: "Volume", formula: "V = s³", value: `${fmt(v)} ${u}³` },
          { label: "Diagonal Ruang", formula: "d = s√3", value: `${fmt(diagRuang)} ${u}` },
        ];
        if (showSlicePlane) {
          rows.push({
            label: "Irisan Bidang",
            formula: "Potongan",
            value: `${Math.round(sliceProgress * 100)}%`,
          });
        }
        return { volume: v, surface: lp, rows };
      }
      case "balok": {
        const v = A * B * C;
        const lp = 2 * (A * B + A * C + B * C);
        return {
          volume: v,
          surface: lp,
          rows: [
            { label: "Ukuran", formula: "p × l × t", value: `${fmt(A)} × ${fmt(B)} × ${fmt(C)} ${u}` },
            { label: "Luas Permukaan", formula: "2(pl + pt + lt)", value: `${fmt(lp)} ${u}²` },
            { label: "Volume", formula: "V = p × l × t", value: `${fmt(v)} ${u}³` },
          ],
        };
      }
      case "bola": {
        const v = (4 / 3) * Math.PI * A ** 3;
        const lp = 4 * Math.PI * A * A;
        return {
          volume: v,
          surface: lp,
          rows: [
            { label: "Jari-jari (r)", formula: "r", value: `${fmt(A)} ${u}` },
            { label: "Luas Permukaan", formula: "L = 4πr²", value: `${fmt(lp)} ${u}²` },
            { label: "Volume", formula: "V = 4/3 π r³", value: `${fmt(v)} ${u}³` },
          ],
        };
      }
      case "prisma": {
        const s = A;
        const h = B || Math.round(A * 1.25);
        const luasAlas = (Math.sqrt(3) / 4) * s * s;
        const kelilingAlas = 3 * s;
        const luasSelimut = kelilingAlas * h;
        const lp = 2 * luasAlas + luasSelimut;
        const v = luasAlas * h;
        return {
          volume: v,
          surface: lp,
          rows: [
            { label: "Sisi Alas Segitiga", formula: "s", value: `${fmt(s)} ${u}` },
            { label: "Tinggi Prisma", formula: "t", value: `${fmt(h)} ${u}` },
            { label: "Luas Alas", formula: "(√3/4)s²", value: `${fmt(luasAlas)} ${u}²` },
            { label: "Luas Permukaan", formula: "2·La + 3st", value: `${fmt(lp)} ${u}²` },
            { label: "Volume", formula: "La × t", value: `${fmt(v)} ${u}³` },
          ],
        };
      }
      case "limas": {
        const s = A;
        const h = B || Math.round(A * 1.25);
        const luasAlas = s * s;
        const tinggiSegitiga = Math.sqrt((s / 2) ** 2 + h ** 2);
        const luasSelimut = 4 * (0.5 * s * tinggiSegitiga);
        const lp = luasAlas + luasSelimut;
        const v = (1 / 3) * luasAlas * h;
        return {
          volume: v,
          surface: lp,
          rows: [
            { label: "Sisi Alas Persegi", formula: "s", value: `${fmt(s)} ${u}` },
            { label: "Tinggi Limas", formula: "t", value: `${fmt(h)} ${u}` },
            { label: "Luas Permukaan", formula: "s² + 4·(½s·hs)", value: `${fmt(lp)} ${u}²` },
            { label: "Volume", formula: "⅓ · s² · t", value: `${fmt(v)} ${u}³` },
          ],
        };
      }
      default:
        return {
          volume: A * B,
          surface: 2 * (A + B),
          rows: [
            { label: "Parameter A", formula: "A", value: `${fmt(A)} ${u}` },
            { label: "Parameter B", formula: "B", value: `${fmt(B)} ${u}` },
          ],
        };
    }
  }, [activeModel, planeShapeKind, solidKind, paramA, paramB, paramC, unit, showSlicePlane, sliceProgress]);

  const rebuildMeshes = useCallback(() => {
    if (!meshGroupRef.current) return;
    const group = meshGroupRef.current;

    while (group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);
      obj.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else if (mat) mat.dispose();
      });
    }

    if (!is3DModel) return;

    const addEdges = (mesh: THREE.Mesh, geometry: THREE.BufferGeometry, color = 0x38bdf8) => {
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geometry, 24),
        new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.85 })
      );
      mesh.add(edges);
    };

    // 1. SOLIDS: KUBUS DENGAN CORNER RESIZING HANDLES
    if (activeModel === "solids" && solidKind === "kubus") {
      // Skala visual proporsional dengan panjang sisi paramA (baseline 10 unit = 3.0 satuan 3D)
      const displaySize = Math.max(1.2, Math.min(5.2, (paramA / 10) * 3.0));

      // Translucent Glassmorphic Outer Cube
      const cubeGeo = new THREE.BoxGeometry(displaySize, displaySize, displaySize);
      const cubeMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        transparent: true,
        opacity: wireframe ? 0.05 : 0.32,
        roughness: 0.12,
        metalness: 0.08,
        depthWrite: false,
      });
      const cubeMesh = new THREE.Mesh(cubeGeo, cubeMat);
      cubeMesh.position.set(0, displaySize / 2 + GRID_Y, 0);
      addEdges(cubeMesh, cubeGeo, 0x38bdf8);
      group.add(cubeMesh);

      // Interactive 8 Corner Vertex Handle Spheres for Direct Mouse Drag-to-Resize
      cornerHandlesRef.current = [];
      const hs = displaySize / 2;
      const corners = [
        [-hs, -hs, -hs], [hs, -hs, -hs], [-hs, -hs, hs], [hs, -hs, hs],
        [-hs, hs, -hs], [hs, hs, -hs], [-hs, hs, hs], [hs, hs, hs],
      ];

      corners.forEach(([cx, cy, cz], idx) => {
        const dotGeo = new THREE.SphereGeometry(0.12, 16, 16);
        const dotMat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0x38bdf8,
          emissiveIntensity: 0.4,
          roughness: 0.2,
        });
        const dot = new THREE.Mesh(dotGeo, dotMat);
        dot.position.set(cx, cy + displaySize / 2 + GRID_Y, cz);
        dot.userData = { isCornerHandle: true, index: idx };
        group.add(dot);
        cornerHandlesRef.current.push(dot);
      });

      // Dimension indicator line on front edge
      const dimPoints = [
        new THREE.Vector3(-hs, GRID_Y - 0.1, hs + 0.15),
        new THREE.Vector3(hs, GRID_Y - 0.1, hs + 0.15),
      ];
      const dimGeo = new THREE.BufferGeometry().setFromPoints(dimPoints);
      const dimMat = new THREE.LineBasicMaterial({ color: 0x60a5fa });
      group.add(new THREE.Line(dimGeo, dimMat));

      // Slicing Plane: ONLY RENDER IF USER SPECIFICALLY REQUESTED IT!
      if (showSlicePlane) {
        const planeSize = displaySize * 1.35;
        const sliceGeo = new THREE.PlaneGeometry(planeSize, planeSize);
        const sliceMat = new THREE.MeshStandardMaterial({
          color: 0xf43f5e,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.68,
          roughness: 0.2,
        });
        const sliceMesh = new THREE.Mesh(sliceGeo, sliceMat);
        sliceMesh.rotation.x = Math.PI / 4;
        sliceMesh.rotation.z = Math.PI / 6;
        sliceMesh.position.set(0, (sliceProgress - 0.5) * displaySize + displaySize / 2 + GRID_Y, 0);

        const sliceEdges = new THREE.LineSegments(
          new THREE.EdgesGeometry(sliceGeo),
          new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 })
        );
        sliceMesh.add(sliceEdges);
        group.add(sliceMesh);
      }
    }

    // 2. BALOK (CUBOID)
    else if (activeModel === "solids" && solidKind === "balok") {
      const w = Math.max(1.4, Math.min(5.5, (paramA / 10) * 3.6));
      const h = Math.max(1.0, Math.min(4.5, (paramB / 6) * 2.2));
      const d = Math.max(1.0, Math.min(4.5, (paramC / 4) * 2.0));
      const geo = new THREE.BoxGeometry(w, h, d);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        transparent: true,
        opacity: wireframe ? 0.05 : 0.35,
        roughness: 0.15,
        metalness: 0.05,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(0, h / 2 + GRID_Y, 0);
      addEdges(mesh, geo, 0x38bdf8);
      group.add(mesh);

      // Interactive 8 Corner Vertex Handles for Balok
      cornerHandlesRef.current = [];
      const hw = w / 2;
      const hh = h / 2;
      const hd = d / 2;
      const corners = [
        [-hw, -hh, -hd], [hw, -hh, -hd], [-hw, -hh, hd], [hw, -hh, hd],
        [-hw, hh, -hd], [hw, hh, -hd], [-hw, hh, hd], [hw, hh, hd],
      ];
      corners.forEach(([cx, cy, cz], idx) => {
        const dotGeo = new THREE.SphereGeometry(0.11, 16, 16);
        const dotMat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0x38bdf8,
          emissiveIntensity: 0.4,
          roughness: 0.2,
        });
        const dot = new THREE.Mesh(dotGeo, dotMat);
        dot.position.set(cx, cy + hh + GRID_Y, cz);
        dot.userData = { isCornerHandle: true, index: idx };
        group.add(dot);
        cornerHandlesRef.current.push(dot);
      });
    }

    // 3. CYLINDER / TABUNG
    else if (activeModel === "cylinder") {
      const r = Math.max(0.8, Math.min(2.8, (paramA / 7) * 1.6));
      const h = Math.max(1.2, Math.min(4.8, (paramB / 12) * 3.2));
      const geo = new THREE.CylinderGeometry(r, r, h, 48);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        transparent: true,
        opacity: wireframe ? 0.05 : 0.55,
        roughness: 0.15,
        metalness: 0.05,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(0, h / 2 + GRID_Y, 0);
      addEdges(mesh, geo, 0x22d3ee);
      group.add(mesh);

      cornerHandlesRef.current = [];
      const handleGeo = new THREE.SphereGeometry(0.12, 16, 16);
      const handleMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x22d3ee, emissiveIntensity: 0.4 });
      const topHandle = new THREE.Mesh(handleGeo, handleMat);
      topHandle.position.set(r, h + GRID_Y, 0);
      topHandle.userData = { isCornerHandle: true, index: 0 };
      group.add(topHandle);
      cornerHandlesRef.current.push(topHandle);
    }

    // 4. CONIC SLICER (IRISAN KERUCUT)
    else if (activeModel === "conic_slicer") {
      const coneR = 2.4;
      const coneH = 4.8;
      const coneGeo = new THREE.ConeGeometry(coneR, coneH, 36, 1, true);
      const coneMat = new THREE.MeshStandardMaterial({
        color: 0x6366f1,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      });
      const coneMesh = new THREE.Mesh(coneGeo, coneMat);
      coneMesh.position.set(0, coneH / 2 + GRID_Y, 0);
      addEdges(coneMesh, coneGeo, 0x818cf8);
      group.add(coneMesh);

      if (showSlicePlane) {
        const planeGeo = new THREE.PlaneGeometry(3.6, 3.6);
        const planeMat = new THREE.MeshStandardMaterial({
          color: 0x10b981,
          transparent: true,
          opacity: 0.65,
          side: THREE.DoubleSide,
        });
        const planeMesh = new THREE.Mesh(planeGeo, planeMat);
        planeMesh.position.set(0, 2.2 + GRID_Y, 0);
        planeMesh.rotation.x = sliceProgress * 1.5;
        group.add(planeMesh);
      }
    }

    // 5. SADDLE SURFACE (PELANA z = x^2 - y^2)
    else if (activeModel === "saddle") {
      const size = 3.6;
      const segments = 40;
      const geo = new THREE.PlaneGeometry(size, size, segments, segments);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = 0.35 * (x * x - y * y);
        pos.setZ(i, z);
      }
      geo.computeVertexNormals();
      const mat = new THREE.MeshStandardMaterial({
        color: 0xa855f7,
        side: THREE.DoubleSide,
        wireframe,
        roughness: 0.25,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(0, 1.5 + GRID_Y, 0);
      group.add(mesh);
    }

    // 6. SOLIDS LAINNYA (BOLA, KERUCUT, LIMAS)
    else if (activeModel === "solids") {
      let geo: THREE.BufferGeometry;
      const radius = Math.max(0.8, Math.min(3.0, (paramA / 7) * 2.0));
      if (solidKind === "bola") {
        geo = new THREE.SphereGeometry(radius, 48, 36);
        const mat = new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: wireframe ? 0.05 : 0.6,
          depthWrite: false,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(0, radius + GRID_Y, 0);
        addEdges(mesh, geo, 0x67e8f9);
        group.add(mesh);

        cornerHandlesRef.current = [];
        const sphereDotGeo = new THREE.SphereGeometry(0.12, 16, 16);
        const sphereDotMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x38bdf8, emissiveIntensity: 0.4 });
        const dot = new THREE.Mesh(sphereDotGeo, sphereDotMat);
        dot.position.set(radius, radius + GRID_Y, 0);
        dot.userData = { isCornerHandle: true, index: 0 };
        group.add(dot);
        cornerHandlesRef.current.push(dot);
      } else if (solidKind === "kerucut") {
        geo = new THREE.ConeGeometry(1.8, 3.2, 36);
        const mat = new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: wireframe ? 0.05 : 0.6,
          depthWrite: false,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(0, 1.6 + GRID_Y, 0);
        addEdges(mesh, geo, 0x67e8f9);
        group.add(mesh);
      } else if (solidKind === "prisma") {
        const prismR = Math.max(1.2, Math.min(3.5, (paramA / 8) * 1.8));
        const prismH = Math.max(1.8, Math.min(5.0, ((paramB || 10) / 10) * 3.0));
        geo = new THREE.CylinderGeometry(prismR, prismR, prismH, 3);
        const mat = new THREE.MeshStandardMaterial({
          color: 0x0284c7,
          transparent: true,
          opacity: wireframe ? 0.05 : 0.45,
          roughness: 0.15,
          metalness: 0.08,
          depthWrite: false,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(0, prismH / 2 + GRID_Y, 0);
        mesh.rotation.y = Math.PI / 6;
        addEdges(mesh, geo, 0x38bdf8);
        group.add(mesh);

        // 6 Corner handles (3 top vertices, 3 bottom vertices)
        cornerHandlesRef.current = [];
        const dotGeo = new THREE.SphereGeometry(0.11, 16, 16);
        const dotMat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0x38bdf8,
          emissiveIntensity: 0.4,
          roughness: 0.2,
        });
        for (let i = 0; i < 3; i++) {
          const angle = (i * 2 * Math.PI) / 3 + Math.PI / 6;
          const vx = prismR * Math.sin(angle);
          const vz = prismR * Math.cos(angle);
          // Bottom
          const bDot = new THREE.Mesh(dotGeo, dotMat);
          bDot.position.set(vx, GRID_Y, vz);
          bDot.userData = { isCornerHandle: true, index: i };
          group.add(bDot);
          cornerHandlesRef.current.push(bDot);
          // Top
          const tDot = new THREE.Mesh(dotGeo, dotMat);
          tDot.position.set(vx, prismH + GRID_Y, vz);
          tDot.userData = { isCornerHandle: true, index: i + 3 };
          group.add(tDot);
          cornerHandlesRef.current.push(tDot);
        }

        if (showSlicePlane) {
          const planeSize = Math.max(prismR, prismH) * 1.8;
          const sliceGeo = new THREE.PlaneGeometry(planeSize, planeSize);
          const sliceMat = new THREE.MeshStandardMaterial({
            color: 0xf43f5e,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.68,
            roughness: 0.2,
          });
          const sliceMesh = new THREE.Mesh(sliceGeo, sliceMat);
          sliceMesh.rotation.x = Math.PI / 4;
          sliceMesh.position.set(0, (sliceProgress - 0.5) * prismH + prismH / 2 + GRID_Y, 0);
          addEdges(sliceMesh, sliceGeo, 0xffffff);
          group.add(sliceMesh);
        }
      } else if (solidKind === "limas") {
        const pyrR = Math.max(1.4, Math.min(3.8, (paramA / 8) * 2.0));
        const pyrH = Math.max(1.8, Math.min(5.0, ((paramB || 10) / 10) * 3.0));
        geo = new THREE.ConeGeometry(pyrR, pyrH, 4);
        const mat = new THREE.MeshStandardMaterial({
          color: 0x0284c7,
          transparent: true,
          opacity: wireframe ? 0.05 : 0.45,
          roughness: 0.15,
          metalness: 0.08,
          depthWrite: false,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(0, pyrH / 2 + GRID_Y, 0);
        mesh.rotation.y = Math.PI / 4;
        addEdges(mesh, geo, 0x38bdf8);
        group.add(mesh);

        // 5 Corner handles (1 apex + 4 base corners)
        cornerHandlesRef.current = [];
        const dotGeo = new THREE.SphereGeometry(0.11, 16, 16);
        const dotMat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0x38bdf8,
          emissiveIntensity: 0.4,
          roughness: 0.2,
        });
        const apex = new THREE.Mesh(dotGeo, dotMat);
        apex.position.set(0, pyrH + GRID_Y, 0);
        apex.userData = { isCornerHandle: true, index: 0 };
        group.add(apex);
        cornerHandlesRef.current.push(apex);

        for (let i = 0; i < 4; i++) {
          const angle = (i * Math.PI) / 2 + Math.PI / 4;
          const bx = pyrR * Math.cos(angle);
          const bz = pyrR * Math.sin(angle);
          const dot = new THREE.Mesh(dotGeo, dotMat);
          dot.position.set(bx, GRID_Y, bz);
          dot.userData = { isCornerHandle: true, index: i + 1 };
          group.add(dot);
          cornerHandlesRef.current.push(dot);
        }

        if (showSlicePlane) {
          const planeSize = Math.max(pyrR, pyrH) * 1.8;
          const sliceGeo = new THREE.PlaneGeometry(planeSize, planeSize);
          const sliceMat = new THREE.MeshStandardMaterial({
            color: 0xf43f5e,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.68,
            roughness: 0.2,
          });
          const sliceMesh = new THREE.Mesh(sliceGeo, sliceMat);
          sliceMesh.rotation.x = Math.PI / 4;
          sliceMesh.position.set(0, (sliceProgress - 0.5) * pyrH + pyrH / 2 + GRID_Y, 0);
          addEdges(sliceMesh, sliceGeo, 0xffffff);
          group.add(sliceMesh);
        }
      } else {
        geo = new THREE.BoxGeometry(2.5, 2.5, 2.5);
        const mat = new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: wireframe ? 0.05 : 0.6,
          depthWrite: false,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(0, 1.25 + GRID_Y, 0);
        addEdges(mesh, geo, 0x67e8f9);
        group.add(mesh);
      }
    }
  }, [activeModel, solidKind, showSlicePlane, sliceProgress, wireframe, is3DModel, paramA, paramB, paramC]);

  // Init Three.js container
  useEffect(() => {
    const container = container3DRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const isDarkInitial = typeof document !== "undefined" ? document.documentElement.classList.contains("dark") : true;
    const bgColor = isProjectorMode ? 0x0a101f : isDarkInitial ? 0x080a0f : 0xf8fafc;
    scene.background = new THREE.Color(bgColor);
    sceneRef.current = scene;

    const initialWidth = container.clientWidth > 0 ? container.clientWidth : 600;
    const initialHeight = container.clientHeight > 0 ? container.clientHeight : 400;

    const camera = new THREE.PerspectiveCamera(45, initialWidth / initialHeight, 0.1, 1000);
    camera.position.set(6.5, 5.5, 8.5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(initialWidth, initialHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = autoRotate;
    controlsRef.current = controls;

    // Studio Lighting
    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x0f172a, 0.75);
    scene.add(hemiLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight1.position.set(10, 16, 12);
    scene.add(dirLight1);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.85);
    rimLight.position.set(-10, 8, -10);
    scene.add(rimLight);

    const gridColor1 = isDarkInitial ? 0x1e293b : 0xcbd5e1;
    const gridColor2 = isDarkInitial ? 0x0f172a : 0xe2e8f0;
    const gridHelper = new THREE.GridHelper(10, 20, gridColor1, gridColor2);
    gridHelper.position.y = GRID_Y;
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    const meshGroup = new THREE.Group();
    scene.add(meshGroup);
    meshGroupRef.current = meshGroup;

    // Synchronously populate the newly mounted meshGroup
    rebuildMeshes();

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // =========================================================================
    // Direct Mouse Corner Drag to Scale
    // =========================================================================
    const onPointerMove = (e: PointerEvent) => {
      if (isDraggingCornerRef.current) {
        const dx = e.clientX - dragStartDataRef.current.clientX;
        const dy = e.clientY - dragStartDataRef.current.clientY;
        const diff = (dx - dy) * 0.06;
        const newA = Math.max(1, Math.min(50, Math.round(dragStartDataRef.current.initialParamA + diff)));
        if (newA !== paramARef.current) {
          paramARef.current = newA;
          setParamA(newA);
          onParamsChangeRef.current?.(newA, paramBRef.current, paramCRef.current, unitRef.current);
        }
        return;
      }

      if (!container || !camera || isDrawingToolActiveRef.current) return;
      const rect = container.getBoundingClientRect();
      mouseVecRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseVecRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseVecRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(cornerHandlesRef.current, false);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        container.style.cursor = "nwse-resize";
        if (hoveredCornerRef.current !== hit) {
          if (hoveredCornerRef.current) {
            hoveredCornerRef.current.scale.set(1, 1, 1);
            const m = hoveredCornerRef.current.material as THREE.MeshStandardMaterial;
            m.emissive.setHex(0x38bdf8);
            m.emissiveIntensity = 0.4;
          }
          hoveredCornerRef.current = hit;
          hit.scale.set(1.6, 1.6, 1.6);
          const m = hit.material as THREE.MeshStandardMaterial;
          m.emissive.setHex(0xf43f5e);
          m.emissiveIntensity = 0.9;
        }
      } else {
        container.style.cursor = isDrawingToolActiveRef.current ? "crosshair" : "default";
        if (hoveredCornerRef.current) {
          hoveredCornerRef.current.scale.set(1, 1, 1);
          const m = hoveredCornerRef.current.material as THREE.MeshStandardMaterial;
          m.emissive.setHex(0x38bdf8);
          m.emissiveIntensity = 0.4;
          hoveredCornerRef.current = null;
        }
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (!container || !camera || isDrawingToolActiveRef.current) return;
      const rect = container.getBoundingClientRect();
      mouseVecRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseVecRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseVecRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(cornerHandlesRef.current, false);

      if (intersects.length > 0) {
        isDraggingCornerRef.current = true;
        dragStartDataRef.current = {
          clientX: e.clientX,
          clientY: e.clientY,
          initialParamA: paramARef.current,
        };
        controls.enabled = false;
        container.style.cursor = "nwse-resize";
      }
    };

    const onPointerUp = () => {
      if (isDraggingCornerRef.current) {
        isDraggingCornerRef.current = false;
        controls.enabled = true;
        if (container) {
          container.style.cursor = isDrawingToolActiveRef.current ? "crosshair" : "default";
        }
      }
    };

    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth > 0 ? container.clientWidth : 600;
      const h = container.clientHeight > 0 ? container.clientHeight : 400;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    const observer = new ResizeObserver(handleResize);
    observer.observe(container);

    handleResize();
    const t1 = setTimeout(handleResize, 60);
    const t2 = setTimeout(handleResize, 220);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      observer.disconnect();
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      meshGroupRef.current = null;
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      controlsRef.current = null;
    };
  }, []);

  // Update autoRotate without re-mounting Three.js
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  // Update background and grid when projector mode or theme changes
  useEffect(() => {
    if (sceneRef.current) {
      const bgColor = isProjectorMode ? 0x0a101f : isDark ? 0x080a0f : 0xf8fafc;
      sceneRef.current.background = new THREE.Color(bgColor);

      if (gridHelperRef.current) {
        sceneRef.current.remove(gridHelperRef.current);
        gridHelperRef.current.geometry.dispose();
        const mat = gridHelperRef.current.material as THREE.Material | THREE.Material[];
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else if (mat) mat.dispose();

        const gridColor1 = isDark ? 0x1e293b : 0xcbd5e1;
        const gridColor2 = isDark ? 0x0f172a : 0xe2e8f0;
        const nextGrid = new THREE.GridHelper(10, 20, gridColor1, gridColor2);
        nextGrid.position.y = GRID_Y;
        sceneRef.current.add(nextGrid);
        gridHelperRef.current = nextGrid;
      }
    }
  }, [isProjectorMode, isDark]);

  // When model switches to 3D, ensure dimensions are fresh
  useEffect(() => {
    if (is3DModel && container3DRef.current && rendererRef.current && cameraRef.current) {
      const container = container3DRef.current;
      const w = container.clientWidth > 0 ? container.clientWidth : 600;
      const h = container.clientHeight > 0 ? container.clientHeight : 400;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    }
  }, [is3DModel]);

  useEffect(() => {
    rebuildMeshes();
  }, [rebuildMeshes]);

  // Board workspace pointer handlers (inline composer on click / marquee selection on drag)
  const handleBoardPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDrawingToolActive) return;
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("input") || target.closest("textarea") || target.closest(".liquid-glass-popup")) return;

    const boardEl = boardWorkspaceRef.current;
    if (!boardEl) return;
    const rect = boardEl.getBoundingClientRect();
    const pctX = ((e.clientX - rect.left) / rect.width) * 100;
    const pctY = ((e.clientY - rect.top) / rect.height) * 100;

    // If Typing tool is active, clicking canvas opens inline composer!
    if (isTypingToolActive) {
      setInlineComposer({ x: Math.max(2, Math.min(75, pctX)), y: Math.max(2, Math.min(75, pctY)), text: "" });
      setSelectedFormulaId(null);
      return;
    }

    // If clicked outside any formula note, deselect and start marquee drag
    if (!target.closest("[data-formula-card]")) {
      setSelectedFormulaId(null);
      setSelectionMarquee({
        startX: pctX,
        startY: pctY,
        currentX: pctX,
        currentY: pctY,
      });
    }
  };

  const handleBoardPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!selectionMarquee) return;
    const boardEl = boardWorkspaceRef.current;
    if (!boardEl) return;
    const rect = boardEl.getBoundingClientRect();
    const pctX = ((e.clientX - rect.left) / rect.width) * 100;
    const pctY = ((e.clientY - rect.top) / rect.height) * 100;

    setSelectionMarquee((prev) => (prev ? { ...prev, currentX: pctX, currentY: pctY } : null));
  };

  const handleBoardPointerUp = () => {
    if (selectionMarquee) {
      const minX = Math.min(selectionMarquee.startX, selectionMarquee.currentX);
      const maxX = Math.max(selectionMarquee.startX, selectionMarquee.currentX);
      const minY = Math.min(selectionMarquee.startY, selectionMarquee.currentY);
      const maxY = Math.max(selectionMarquee.startY, selectionMarquee.currentY);

      if (maxX - minX > 2 || maxY - minY > 2) {
        const hit = formulaNotes.find((note) => {
          return note.x >= minX - 12 && note.x <= maxX && note.y >= minY - 6 && note.y <= maxY;
        });
        if (hit) {
          setSelectedFormulaId(hit.id);
        }
      }
      setSelectionMarquee(null);
    }
  };

  const handleBoardDoubleClick = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDrawingToolActive) return;
    const boardEl = boardWorkspaceRef.current;
    if (!boardEl) return;
    const rect = boardEl.getBoundingClientRect();
    const pctX = ((e.clientX - rect.left) / rect.width) * 100;
    const pctY = ((e.clientY - rect.top) / rect.height) * 100;
    setInlineComposer({ x: Math.max(2, Math.min(75, pctX)), y: Math.max(2, Math.min(75, pctY)), text: "" });
  };

  // =========================================================================
  // RENDER PANDANGAN UTAMA PAPAN TULIS VIRTUAL
  // =========================================================================
  return (
    <div className={`relative w-full h-full flex flex-col dark:bg-[#080a0f] bg-slate-50 dark:text-zinc-100 text-slate-800 select-none overflow-hidden font-sans ${className}`}>
      {/* 1. TOP HEADER & SMART COMMAND BAR (Zero Button Collision) */}
      <div className="h-12 px-2.5 sm:px-4 border-b dark:border-white/[0.08] border-slate-200 dark:bg-[#0d0f17] bg-white flex items-center justify-between gap-1.5 sm:gap-2 shrink-0 z-20">
        {/* Left: Mode Picker Segmented Buttons + Reset */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center dark:bg-white/[0.04] bg-slate-100 p-0.5 rounded-xl border dark:border-white/[0.08] border-slate-200">
            <button
              type="button"
              onClick={() => selectModel("solids")}
              className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition cursor-pointer ${
                is3DModel
                  ? "bg-white dark:bg-white/[0.16] text-slate-900 dark:text-white shadow-sm font-semibold"
                  : "dark:text-zinc-400 text-slate-600 dark:hover:text-white hover:text-slate-900"
              }`}
              title="Geometri 3D Ruang"
            >
              <Box className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">3D</span>
            </button>
            <button
              type="button"
              onClick={() => selectModel("2d_quadratic")}
              className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition cursor-pointer ${
                is2DGraphModel
                  ? "bg-white dark:bg-white/[0.16] text-slate-900 dark:text-white shadow-sm font-semibold"
                  : "dark:text-zinc-400 text-slate-600 dark:hover:text-white hover:text-slate-900"
              }`}
              title="Grafik 2D Kartesius"
            >
              <span className="font-mono text-xs">2D</span>
            </button>
            <button
              type="button"
              onClick={() => selectModel("empty")}
              className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition cursor-pointer ${
                activeModel === "empty"
                  ? "bg-white dark:bg-white/[0.16] text-slate-900 dark:text-white shadow-sm font-semibold"
                  : "dark:text-zinc-400 text-slate-600 dark:hover:text-white hover:text-slate-900"
              }`}
              title="Papan Tulis Kosong"
            >
              <span className="text-xs">Papan</span>
            </button>
          </div>

          {activeModel !== "empty" && (
            <button
              type="button"
              onClick={() => selectModel("empty")}
              className="p-1.5 rounded-xl dark:bg-white/[0.04] bg-slate-100 hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white border dark:border-white/[0.08] border-slate-200 transition cursor-pointer"
              title="Reset / Bersihkan Kanvas"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Center: Flexible Spacer (Komponen teks status di header telah dihapus sesuai permintaan) */}
        <div className="flex-1" />

        {/* Right: Tools Cluster */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Tombol Mode Ketik Langsung di Kanvas */}
          <button
            type="button"
            onClick={() => {
              if (isTypingToolActive) {
                setIsTypingToolActive(false);
              } else {
                setIsTypingToolActive(true);
                setIsDrawingToolActive(false);
              }
            }}
            className={`p-1.5 px-2.5 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer ${
              isTypingToolActive
                ? "bg-amber-500 text-white shadow-sm font-semibold"
                : "dark:bg-white/[0.04] bg-slate-100 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white border dark:border-white/[0.06] border-slate-200"
            }`}
            title="Mode Ketik di Kanvas (Klik di mana saja pada papan untuk mengetik rumus/teks)"
          >
            <Type className="w-3.5 h-3.5" />
            <span className="text-[11px] font-mono font-medium hidden sm:inline">Ketik Rumus</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsTypingToolActive(false);
              if (isDrawingToolActive && drawingMode === "pen") setIsDrawingToolActive(false);
              else {
                setIsDrawingToolActive(true);
                setDrawingMode("pen");
              }
            }}
            className={`p-1.5 rounded-xl text-xs transition cursor-pointer ${
              isDrawingToolActive && drawingMode === "pen"
                ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm font-semibold"
                : "dark:bg-white/[0.04] bg-slate-100 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white border dark:border-white/[0.06] border-slate-200"
            }`}
            title="Pena Kapur Tulis"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (isDrawingToolActive && drawingMode === "eraser") setIsDrawingToolActive(false);
              else {
                setIsDrawingToolActive(true);
                setDrawingMode("eraser");
              }
            }}
            className={`p-1.5 rounded-xl text-xs transition cursor-pointer ${
              isDrawingToolActive && drawingMode === "eraser"
                ? "bg-slate-800 text-white shadow-sm font-semibold"
                : "dark:bg-white/[0.04] bg-slate-100 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white border dark:border-white/[0.06] border-slate-200"
            }`}
            title="Penghapus Kapur"
          >
            <Eraser className="w-3.5 h-3.5" />
          </button>

          {hasDrawings && (
            <button
              type="button"
              onClick={clearDrawCanvas}
              className="p-1.5 rounded-xl dark:bg-white/[0.04] bg-slate-100 hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white border dark:border-white/[0.06] border-slate-200 transition cursor-pointer"
              title="Hapus Semua Coretan"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {is3DModel && (
            <>
              <button
                type="button"
                onClick={() => setWireframe(!wireframe)}
                className={`p-1.5 rounded-xl text-xs transition border cursor-pointer ${
                  wireframe
                    ? "bg-slate-200 dark:bg-white/[0.16] text-slate-900 dark:text-white border-slate-300 dark:border-white/[0.2]"
                    : "dark:bg-white/[0.04] bg-slate-100 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white dark:border-white/[0.06] border-slate-200"
                }`}
                title="Toggle Wireframe Rangka Kawat"
              >
                <Layers className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setAutoRotate(!autoRotate)}
                className={`p-1.5 rounded-xl text-xs transition border cursor-pointer ${
                  autoRotate
                    ? "bg-slate-200 dark:bg-white/[0.16] text-slate-900 dark:text-white border-slate-300 dark:border-white/[0.2]"
                    : "dark:bg-white/[0.04] bg-slate-100 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white dark:border-white/[0.06] border-slate-200"
                }`}
                title="Toggle Rotasi Otomatis 360°"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsHudVisible(!isHudVisible)}
                className={`p-1.5 rounded-xl text-xs transition border cursor-pointer ${
                  isHudVisible
                    ? "bg-slate-200 dark:bg-white/[0.16] text-slate-900 dark:text-white border-slate-300 dark:border-white/[0.2]"
                    : "dark:bg-white/[0.04] bg-slate-100 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white dark:border-white/[0.06] border-slate-200"
                }`}
                title={isHudVisible ? "Sembunyikan Panel Kontrol Metrik" : "Tampilkan Panel Kontrol Metrik"}
              >
                {isHudVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
            </>
          )}

          {onToggleProjector && (
            <button
              type="button"
              onClick={onToggleProjector}
              className={`p-1.5 rounded-xl border transition cursor-pointer ${
                isProjectorMode
                  ? "bg-slate-200 dark:bg-white/[0.16] text-slate-900 dark:text-white border-slate-300 dark:border-white/[0.2]"
                  : "bg-white/[0.04] text-zinc-400 hover:text-white border-white/[0.06]"
              }`}
              title="Mode Layar Proyektor"
            >
              <Tv className="w-3.5 h-3.5" />
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-white/[0.06] transition cursor-pointer"
              title="Tutup Papan Tulis"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. MAIN BOARD WORKSPACE */}
      <div
        ref={boardWorkspaceRef}
        onPointerDown={handleBoardPointerDown}
        onPointerMove={handleBoardPointerMove}
        onPointerUp={handleBoardPointerUp}
        onDoubleClick={handleBoardDoubleClick}
        className={`flex-1 relative w-full h-full min-h-0 bg-slate-50 dark:bg-[#080a0f] overflow-hidden ${
          isTypingToolActive ? "cursor-text" : ""
        }`}
      >
        {/* A. EMPTY STATE */}
        {activeModel === "empty" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-0 select-none">
            <div className="w-full max-w-md space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center mx-auto text-slate-700 dark:text-zinc-300 shadow-sm">
                <Pencil className="w-6 h-6" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Papan Tulis Pintar ZAP
                </h3>
                <p className="text-xs text-slate-600 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
                  Papan tulis interaktif untuk simulasi geometri 2D/3D, penulisan rumus KaTeX keyboard rapi tanpa stylus, dan coretan kapur.
                </p>
              </div>

              {/* Action shortcuts */}
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsTypingToolActive(true);
                    setInlineComposer({ x: 30, y: 35, text: "" });
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300/60 dark:border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Type className="w-3.5 h-3.5" />
                  <span>Ketik Rumus di Kanvas</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAiWidgetOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Buat dengan ZAP AI</span>
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-center gap-2 max-w-md mx-auto">
                {SMART_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      if (preset.solid) setSolidKind(preset.solid);
                      if (preset.paramA !== undefined) setParamA(preset.paramA);
                      if (preset.paramB !== undefined) setParamB(preset.paramB);
                      if (preset.paramC !== undefined) setParamC(preset.paramC);
                      if (preset.unit) setUnit(preset.unit);
                      if (preset.hasSlice !== undefined) setShowSlicePlane(preset.hasSlice);
                      else setShowSlicePlane(false);
                      selectModel(preset.model);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-[#121520] dark:hover:bg-[#1a1f30] border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20 text-xs font-medium text-slate-700 dark:text-zinc-200 transition cursor-pointer shadow-xs"
                  >
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* B. 2D CARTESIAN GRAPH VIEW */}
        <div
          className={`absolute inset-0 transition-opacity duration-200 ${
            is2DGraphModel ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >
          <canvas ref={graph2DCanvasRef} className="w-full h-full block" />

          {/* 2D Equation & Coefficients Bar (Hanya untuk fungsi kurva aljabar 2D, bukan bangun datar geometri) */}
          {(activeModel === "2d_quadratic" || activeModel === "2d_trig" || activeModel === "2d_linear" || activeModel === "2d_circle") && (
            <div className="absolute bottom-3 inset-x-4 flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-white/95 dark:bg-[#0f121d]/90 border border-slate-200 dark:border-white/[0.08] backdrop-blur-md shadow-xl z-20 text-xs text-slate-800 dark:text-zinc-200">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-900 dark:text-white font-mono text-[13px]">
                  {activeModel === "2d_quadratic"
                    ? `y = ${paramA}x² ${paramB >= 0 ? `+ ${paramB}x` : `- ${Math.abs(paramB)}x`} ${paramC >= 0 ? `+ ${paramC}` : `- ${Math.abs(paramC)}`}`
                    : activeModel === "2d_trig"
                    ? `y = ${paramA} sin(${paramB}x)`
                    : `y = ${paramA}x + ${paramB}`}
                </span>
              </div>

              {/* Sliders for Coefficients */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 dark:text-zinc-400 font-mono font-medium">A: {paramA}</span>
                  <input
                    type="range"
                    min="-4"
                    max="4"
                    step="0.5"
                    value={paramA}
                    onChange={(e) => setParamA(parseFloat(e.target.value))}
                    className="w-20 accent-slate-900 dark:accent-white cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-600 dark:text-zinc-400 font-mono font-medium">
                    {activeModel === "2d_quadratic" ? `C: ${paramC}` : `B: ${paramB}`}
                  </span>
                  <input
                    type="range"
                    min="-6"
                    max="6"
                    step="0.5"
                    value={activeModel === "2d_quadratic" ? paramC : paramB}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (activeModel === "2d_quadratic") setParamC(val);
                      else setParamB(val);
                    }}
                    className="w-20 accent-slate-900 dark:accent-white cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* C. THREE.JS 3D VIEWPORT */}
        <div
          ref={container3DRef}
          className={`absolute inset-0 transition-opacity duration-200 ${
            is3DModel ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        />

        {/* 3D Geometry HUD Overlay Card (With Minimize/Hide Toggle) */}
        {(is3DModel || activeModel === "2d_shape") && isHudVisible && (
          isHudMinimized ? (
            <div className="absolute top-3 right-3 flex items-center gap-1 z-20">
              <button
                type="button"
                onClick={() => setIsHudMinimized(false)}
                className="px-3 py-1.5 rounded-xl dark:bg-[#0f121d]/90 bg-white/95 dark:hover:bg-[#151928] hover:bg-slate-50 border dark:border-white/[0.1] border-slate-200 hover:border-slate-400 dark:hover:border-white/20 backdrop-blur-md shadow-xl text-xs dark:text-zinc-200 text-slate-800 flex items-center gap-2 transition cursor-pointer"
                title="Tampilkan Panel Metrik & Kontrol"
              >
                <Box className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-300" />
                <span className="font-medium">
                  {activeModel === "2d_shape"
                    ? planeShapeKind === "persegi_panjang"
                      ? `Persegi Panjang (${paramA}×${paramB} ${unit})`
                      : planeShapeKind === "persegi"
                      ? `Persegi (${paramA} ${unit})`
                      : planeShapeKind === "lingkaran"
                      ? `Lingkaran (r=${paramA} ${unit})`
                      : planeShapeKind === "belah_ketupat"
                      ? `Belah Ketupat (${paramA}×${paramB} ${unit})`
                      : planeShapeKind === "layang_layang"
                      ? `Layang-Layang (${paramA}×${paramB} ${unit})`
                      : planeShapeKind === "jaring_prisma"
                      ? `Jaring Prisma (${paramA}×${paramB} ${unit})`
                      : planeShapeKind === "jaring_kubus"
                      ? `Jaring Kubus (${paramA} ${unit})`
                      : planeShapeKind === "jaring_limas"
                      ? `Jaring Limas (${paramA}×${paramB} ${unit})`
                      : planeShapeKind === "jajar_genjang"
                      ? `Jajar Genjang (${paramA} ${unit})`
                      : planeShapeKind === "trapesium"
                      ? `Trapesium (${paramA} ${unit})`
                      : `Segitiga (${paramA} ${unit})`
                    : `Metrik (${paramA} ${unit})`}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-400" />
              </button>
              <button
                type="button"
                onClick={() => setIsHudVisible(false)}
                className="p-1.5 rounded-xl dark:bg-[#0f121d]/90 bg-white/95 dark:hover:bg-[#151928] hover:bg-slate-50 border dark:border-white/[0.1] border-slate-200 text-slate-400 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                title="Sembunyikan Panel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="absolute top-3 right-3 p-3.5 rounded-2xl liquid-glass-popup z-20 text-xs w-64 space-y-2.5 text-slate-800 dark:text-zinc-200 animate-liquid-pop origin-top-right">
              <div className="flex items-center justify-between border-b dark:border-white/[0.08] border-slate-200/80 pb-2">
                <span className="font-semibold dark:text-white text-slate-900 flex items-center gap-1.5">
                  <Box className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-300" />
                  {activeModel === "2d_shape"
                    ? planeShapeKind === "persegi_panjang"
                      ? "Persegi Panjang 2D"
                      : planeShapeKind === "persegi"
                      ? "Persegi 2D"
                      : planeShapeKind === "lingkaran"
                      ? "Lingkaran 2D"
                      : planeShapeKind === "belah_ketupat"
                      ? "Belah Ketupat 2D"
                      : planeShapeKind === "layang_layang"
                      ? "Layang-Layang 2D"
                      : planeShapeKind === "jaring_prisma"
                      ? "Jaring-Jaring Prisma 2D"
                      : planeShapeKind === "jaring_kubus"
                      ? "Jaring-Jaring Kubus 2D"
                      : planeShapeKind === "jaring_limas"
                      ? "Jaring-Jaring Limas 2D"
                      : planeShapeKind === "jajar_genjang"
                      ? "Jajar Genjang 2D"
                      : planeShapeKind === "trapesium"
                      ? "Trapesium 2D"
                      : planeShapeKind === "segitiga"
                      ? "Segitiga 2D"
                      : "Bangun Datar 2D"
                    : activeModel === "cylinder"
                    ? "Tabung Silinder 3D"
                    : solidKind === "kubus"
                    ? showSlicePlane
                      ? "Kubus 3D (Irisan)"
                      : "Kubus 3D"
                    : SOLID_LABELS[solidKind] || "Geometri 3D"}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (activeModel === "2d_shape") {
                        if (planeShapeKind === "persegi_panjang") {
                          setParamA(14);
                          setParamB(8);
                          onParamsChange?.(14, 8, paramC, unit);
                        } else if (planeShapeKind === "persegi") {
                          setParamA(10);
                          onParamsChange?.(10, paramB, paramC, unit);
                        } else if (planeShapeKind === "jajar_genjang") {
                          setParamA(12);
                          setParamB(8);
                          setParamC(10);
                          onParamsChange?.(12, 8, 10, unit);
                        } else if (planeShapeKind === "trapesium") {
                          setParamA(8);
                          setParamB(14);
                          setParamC(6);
                          onParamsChange?.(8, 14, 6, unit);
                        } else if (planeShapeKind === "lingkaran") {
                          setParamA(7);
                          onParamsChange?.(7, paramB, paramC, unit);
                        } else if (planeShapeKind === "belah_ketupat" || planeShapeKind === "layang_layang") {
                          setParamA(12);
                          setParamB(16);
                          onParamsChange?.(12, 16, paramC, unit);
                        } else if (planeShapeKind === "jaring_prisma" || planeShapeKind === "jaring_limas") {
                          setParamA(8);
                          setParamB(10);
                          onParamsChange?.(8, 10, paramC, unit);
                        } else if (planeShapeKind === "jaring_kubus") {
                          setParamA(10);
                          onParamsChange?.(10, paramB, paramC, unit);
                        } else {
                          setParamA(10);
                          setParamB(8);
                          onParamsChange?.(10, 8, paramC, unit);
                        }
                      } else {
                        setParamA(10);
                        setSliceProgress(0.5);
                        onParamsChange?.(10, paramB, paramC, unit);
                      }
                    }}
                    className="text-[10px] text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/[0.04] cursor-pointer"
                    title="Reset Parameter"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsHudMinimized(true)}
                    className="p-1 rounded-lg text-slate-400 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition cursor-pointer"
                    title="Kecilkan Panel"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsHudVisible(false)}
                    className="p-1 rounded-lg text-slate-400 dark:text-zinc-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition cursor-pointer"
                    title="Sembunyikan Panel (Bisa dibuka lagi dari toolbar)"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Sisi / Radius Slider & Input */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-700 dark:text-zinc-300 font-medium">
                  <span>
                    {activeModel === "2d_shape"
                      ? planeShapeKind === "persegi_panjang"
                        ? "Panjang (p):"
                        : planeShapeKind === "persegi" || planeShapeKind === "jaring_kubus"
                        ? "Panjang Sisi (s):"
                        : planeShapeKind === "lingkaran"
                        ? "Jari-jari (r):"
                        : planeShapeKind === "belah_ketupat" || planeShapeKind === "layang_layang"
                        ? "Diagonal 1 (d₁):"
                        : planeShapeKind === "jaring_prisma"
                        ? "Sisi Segitiga Alas (s):"
                        : planeShapeKind === "jaring_limas"
                        ? "Sisi Alas Persegi (s):"
                        : planeShapeKind === "jajar_genjang" || planeShapeKind === "segitiga"
                        ? "Panjang Alas (a):"
                        : planeShapeKind === "trapesium"
                        ? "Sisi Atas (a):"
                        : "Alas (a):"
                      : activeModel === "cylinder" || solidKind === "bola"
                      ? "Jari-jari (r):"
                      : solidKind === "balok"
                      ? "Panjang (p):"
                      : solidKind === "prisma"
                      ? "Sisi Alas Segitiga (s):"
                      : solidKind === "limas"
                      ? "Sisi Alas Persegi (s):"
                      : "Panjang Sisi (s):"}
                  </span>
                  <span className="font-mono text-slate-900 dark:text-white font-semibold">{paramA} {unit}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={paramA}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setParamA(val);
                    onParamsChange?.(val, paramB, paramC, unit);
                  }}
                  className="w-full accent-slate-900 dark:accent-white cursor-pointer"
                />
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 italic">
                  {activeModel === "2d_shape"
                    ? "💡 Tip: Geser slider untuk mengubah dimensi; rumus luas & keliling terhitung otomatis."
                    : "💡 Tip: Arahkan kursor & tarik sudut objek untuk resize langsung."}
                </p>
              </div>

              {/* Tinggi / Lebar Slider (Untuk Tabung, Balok, Prisma, Limas, 2D) */}
              {((activeModel === "2d_shape" && planeShapeKind !== "persegi" && planeShapeKind !== "lingkaran" && planeShapeKind !== "jaring_kubus") || activeModel === "cylinder" || solidKind === "balok" || solidKind === "prisma" || solidKind === "limas") && (
                <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-white/[0.06]">
                  <div className="flex justify-between text-slate-700 dark:text-zinc-300 font-medium">
                    <span>
                      {activeModel === "2d_shape"
                        ? planeShapeKind === "persegi_panjang"
                          ? "Lebar (l):"
                          : planeShapeKind === "trapesium"
                          ? "Sisi Bawah (b):"
                          : planeShapeKind === "belah_ketupat" || planeShapeKind === "layang_layang"
                          ? "Diagonal 2 (d₂):"
                          : planeShapeKind === "jaring_prisma"
                          ? "Tinggi Sisi Tegak (t):"
                          : planeShapeKind === "jaring_limas"
                          ? "Tinggi Limas (t):"
                          : "Tinggi Tegak (t):"
                        : activeModel === "cylinder" || solidKind === "prisma" || solidKind === "limas"
                        ? "Tinggi (t):"
                        : "Lebar (l):"}
                    </span>
                    <span className="font-mono text-slate-900 dark:text-white font-semibold">{paramB} {unit}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    step="1"
                    value={paramB}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setParamB(val);
                      onParamsChange?.(paramA, val, paramC, unit);
                    }}
                    className="w-full accent-slate-900 dark:accent-white cursor-pointer"
                  />
                </div>
              )}

              {/* Slider 3 untuk Jajar Genjang (Sisi Miring) atau Trapesium (Tinggi) */}
              {activeModel === "2d_shape" && (planeShapeKind === "jajar_genjang" || planeShapeKind === "trapesium") && (
                <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-white/[0.06]">
                  <div className="flex justify-between text-slate-700 dark:text-zinc-300 font-medium">
                    <span>
                      {planeShapeKind === "jajar_genjang" ? "Sisi Miring (s):" : "Tinggi Tegak (t):"}
                    </span>
                    <span className="font-mono text-slate-900 dark:text-white font-semibold">{paramC} {unit}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    step="1"
                    value={paramC}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setParamC(val);
                      onParamsChange?.(paramA, paramB, val, unit);
                    }}
                    className="w-full accent-slate-900 dark:accent-white cursor-pointer"
                  />
                </div>
              )}

              {/* Toggle & Slider Irisan Bidang (Hanya untuk bangun ruang 3D) */}
              {activeModel === "solids" && (solidKind === "kubus" || solidKind === "balok" || solidKind === "prisma" || solidKind === "limas") && (
                showSlicePlane ? (
                  <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-white/[0.06]">
                    <div className="flex justify-between items-center text-slate-700 dark:text-zinc-300 font-medium">
                      <span>Bidang Potongan:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-slate-900 dark:text-white font-semibold">{Math.round(sliceProgress * 100)}%</span>
                        <button
                          type="button"
                          onClick={() => setShowSlicePlane(false)}
                          className="text-[10px] text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white px-1 py-0.5 rounded cursor-pointer"
                          title="Hapus bidang irisan"
                        >
                          Tutup
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.02"
                      value={sliceProgress}
                      onChange={(e) => setSliceProgress(parseFloat(e.target.value))}
                      className="w-full accent-slate-900 dark:accent-white cursor-pointer"
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowSlicePlane(true)}
                    className="w-full py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-700 hover:text-slate-900 dark:text-zinc-300 dark:hover:text-white border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20 flex items-center justify-center gap-1.5 transition text-xs font-medium cursor-pointer"
                    title="Tambahkan bidang irisan penampang 3D"
                  >
                    <Scissors className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
                    <span>+ Tambah Irisan Bidang</span>
                  </button>
                )
              )}

              {/* Dynamic Calculated Metrics */}
              <div className="pt-1.5 border-t border-slate-100 dark:border-white/[0.08] space-y-1.5">
                {solidMetrics().rows.map((row) => (
                  <div key={row.label} className="flex justify-between text-xs">
                    <span className="text-slate-600 dark:text-zinc-400">{row.label}:</span>
                    <span className="font-mono text-slate-900 dark:text-white font-semibold">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        )}

        {/* D. FREEHAND DRAWING CANVAS OVERLAY */}
        <canvas
          ref={drawCanvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          className={`absolute inset-0 w-full h-full z-10 ${
            isDrawingToolActive ? "cursor-crosshair pointer-events-auto" : "pointer-events-none"
          }`}
        />

        {/* Visual Eraser Indicator Circle */}
        {isDrawingToolActive && drawingMode === "eraser" && pointerPos && (
          <div
            className="pointer-events-none absolute rounded-full border-2 border-white/60 bg-white/10 shadow-sm z-30 transform -translate-x-1/2 -translate-y-1/2 transition-none"
            style={{
              left: pointerPos.x,
              top: pointerPos.y,
              width: eraserSize,
              height: eraserSize,
            }}
          />
        )}

        {/* Floating Drawing Tool Palette (Docked when Drawing Active) */}
        {isDrawingToolActive && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 p-1.5 rounded-2xl liquid-glass-popup z-20 text-slate-800 dark:text-zinc-200 animate-liquid-pop origin-top-left">
            {/* Mode Switcher: Pen vs Eraser */}
            <div className="flex items-center bg-slate-100 dark:bg-white/[0.04] p-0.5 rounded-xl border border-slate-200 dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => setDrawingMode("pen")}
                className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition cursor-pointer ${
                  drawingMode === "pen"
                    ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm font-semibold"
                    : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
                }`}
                title="Pena Kapur (Menulis / Menggambar)"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Pena</span>
              </button>

              <button
                type="button"
                onClick={() => setDrawingMode("eraser")}
                className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition cursor-pointer ${
                  drawingMode === "eraser"
                    ? "bg-slate-900 text-white dark:bg-slate-700 dark:text-white shadow-sm font-semibold"
                    : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
                }`}
                title="Penghapus Kapur (Hapus Goresan)"
              >
                <Eraser className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Penghapus</span>
              </button>
            </div>

            <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/[0.1] mx-0.5" />

            {/* Tools Specific to Mode */}
            {drawingMode === "pen" ? (
              <>
                {/* Color Swatches */}
                {[
                  { color: isDark ? "#f8fafc" : "#0f172a", name: isDark ? "Kapur Putih" : "Tinta Hitam" },
                  { color: "#3b82f6", name: "Biru" },
                  { color: "#10b981", name: "Hijau" },
                  { color: "#f43f5e", name: "Merah" },
                  { color: "#f59e0b", name: "Kuning / Oranye" },
                ].map((swatch) => (
                  <button
                    key={swatch.color}
                    type="button"
                    onClick={() => setDrawColor(swatch.color)}
                    className={`w-5 h-5 rounded-full transition-transform cursor-pointer flex items-center justify-center border border-black/10 dark:border-white/20 ${
                      drawColor === swatch.color ? "scale-110 ring-2 ring-slate-400 dark:ring-white/60" : "opacity-80 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: swatch.color }}
                    title={swatch.name}
                  />
                ))}

                <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/[0.1] mx-0.5" />

                {/* Brush Sizes */}
                {[2, 4, 8].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setBrushSize(size)}
                    className={`px-1.5 py-0.5 rounded text-xs transition cursor-pointer font-mono ${
                      brushSize === size
                        ? "bg-slate-900 text-white dark:bg-white/[0.1] dark:text-white font-medium"
                        : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
                    }`}
                    title={`Ukuran Pena ${size}px`}
                  >
                    {size}px
                  </button>
                ))}
              </>
            ) : (
              <div className="flex items-center gap-1 px-1">
                <span className="text-[11px] text-slate-600 dark:text-zinc-400 font-medium">Ukuran:</span>
                {[
                  { size: 14, label: "Kecil" },
                  { size: 28, label: "Sedang" },
                  { size: 52, label: "Besar" },
                ].map((item) => (
                  <button
                    key={item.size}
                    type="button"
                    onClick={() => setEraserSize(item.size)}
                    className={`px-2 py-0.5 rounded text-xs transition cursor-pointer font-mono ${
                      eraserSize === item.size
                        ? "bg-slate-900 text-white dark:bg-white/[0.12] dark:text-white font-medium border border-slate-700 dark:border-white/[0.2]"
                        : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]"
                    }`}
                    title={`Penghapus ${item.label} (${item.size}px)`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* E. KATEX FORMULA CARDS OVERLAY (Draggable, Selectable, Auto-Latex Typography) */}
        {formulaNotes.map((note) => {
          const isSelected = selectedFormulaId === note.id;
          const detected = detectMathTransform(note.rawText || note.latex);

          return (
            <div
              key={note.id}
              data-formula-card="true"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFormulaId(note.id);
              }}
              style={{ left: `${note.x}%`, top: `${note.y}%` }}
              className={`absolute z-20 group rounded-2xl p-3.5 shadow-xl backdrop-blur-md select-none border transition-all duration-150 ${
                isSelected
                  ? "ring-2 ring-amber-500 shadow-2xl scale-[1.02]"
                  : "hover:border-slate-400 dark:hover:border-white/30"
              } ${
                note.color === "amber"
                  ? "bg-amber-500/10 dark:bg-amber-950/40 border-amber-300/80 dark:border-amber-500/30 text-amber-950 dark:text-amber-100"
                  : note.color === "emerald"
                  ? "bg-emerald-500/10 dark:bg-emerald-950/40 border-emerald-300/80 dark:border-emerald-500/30 text-emerald-950 dark:text-emerald-100"
                  : note.color === "blue"
                  ? "bg-blue-500/10 dark:bg-blue-950/40 border-blue-300/80 dark:border-blue-500/30 text-blue-950 dark:text-blue-100"
                  : note.color === "rose"
                  ? "bg-rose-500/10 dark:bg-rose-950/40 border-rose-300/80 dark:border-rose-500/30 text-rose-950 dark:text-rose-100"
                  : note.color === "purple"
                  ? "bg-purple-500/10 dark:bg-purple-950/40 border-purple-300/80 dark:border-purple-500/30 text-purple-950 dark:text-purple-100"
                  : "bg-white/95 dark:bg-[#121520]/95 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
              }`}
            >
              {/* Contextual Floating Transformation Bar (When Selected - Like Video) */}
              {isSelected && (
                <>
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute -top-11 left-0 flex items-center gap-1 p-1 rounded-xl liquid-glass-popup border border-slate-200/90 dark:border-white/15 shadow-2xl z-30 animate-fadeIn whitespace-nowrap text-xs text-slate-800 dark:text-zinc-200"
                  >
                    {/* Transform to 2D Graph */}
                    {(detected === "graph" || note.latex.includes("x") || note.latex.includes("sin")) && (
                      <button
                        type="button"
                        onClick={() => handleTransformToGraph(note.rawText || note.latex)}
                        className="px-2.5 py-1 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                        title="Ubah formula ini menjadi Grafik Kartesius 2D"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Ubah ke Grafik 2D</span>
                      </button>
                    )}

                    {/* Transform to 3D Solid */}
                    {(detected === "3d" || /kubus|prisma|limas|balok|bola|tabung/i.test(note.rawText || note.latex)) && (
                      <button
                        type="button"
                        onClick={() => handleTransformTo3D(note.rawText || note.latex)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                        title="Ubah teks ini menjadi Model Geometri 3D"
                      >
                        <Box className="w-3 h-3" />
                        <span>Ubah ke Model 3D</span>
                      </button>
                    )}

                    {/* Transform to 2D Net/Shape */}
                    {(detected === "2d_shape" || /jaring|persegi|segitiga|lingkaran/i.test(note.rawText || note.latex)) && (
                      <button
                        type="button"
                        onClick={() => handleTransformTo2D(note.rawText || note.latex)}
                        className="px-2.5 py-1 rounded-lg bg-purple-500 hover:bg-purple-600 text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                        title="Ubah teks ini menjadi Bentangan / Jaring-Jaring 2D"
                      >
                        <Layers className="w-3 h-3" />
                        <span>Ubah ke Diagram 2D</span>
                      </button>
                    )}

                    {/* Fallback buttons if type is not specifically detected */}
                    {!detected && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleTransformToGraph(note.rawText || note.latex)}
                          className="px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.08] text-[11px] font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1 transition cursor-pointer"
                        >
                          📈 Grafik 2D
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTransformTo3D(note.rawText || note.latex)}
                          className="px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.08] text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 transition cursor-pointer"
                        >
                          🧊 3D Solid
                        </button>
                      </>
                    )}

                    <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/10 mx-0.5" />

                    {/* Edit inline button */}
                    <button
                      type="button"
                      onClick={() =>
                        setInlineComposer({
                          x: note.x,
                          y: note.y,
                          text: note.rawText || note.latex,
                          id: note.id,
                        })
                      }
                      className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition cursor-pointer"
                      title="Edit Rumus Langsung"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteFormula(note.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition cursor-pointer"
                      title="Hapus Rumus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* 4 Corner Anchors for Active Selection (Matching Smartboard in Video) */}
                  <span className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full bg-amber-500 ring-2 ring-white dark:ring-[#080a0f] pointer-events-none" />
                  <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-amber-500 ring-2 ring-white dark:ring-[#080a0f] pointer-events-none" />
                  <span className="absolute -bottom-1.5 -left-1.5 w-3 h-3 rounded-full bg-amber-500 ring-2 ring-white dark:ring-[#080a0f] pointer-events-none" />
                  <span className="absolute -bottom-1.5 -right-1.5 w-3 h-3 rounded-full bg-amber-500 ring-2 ring-white dark:ring-[#080a0f] pointer-events-none" />
                </>
              )}

              {/* Card mini-toolbar */}
              <div className="flex items-center justify-between gap-3 mb-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                <div
                  onPointerDown={(e) => handleFormulaPointerDown(note.id, e)}
                  className="cursor-grab active:cursor-grabbing p-1 -ml-1 rounded hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-1 text-[10px] font-mono text-slate-500 dark:text-zinc-400"
                  title="Tahan & geser untuk memindahkan posisi rumus di kanvas"
                >
                  <Move className="w-3 h-3 text-slate-500 dark:text-zinc-400" />
                  <span className="text-[9px] uppercase tracking-wider font-semibold">KaTeX</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setInlineComposer({
                        x: note.x,
                        y: note.y,
                        text: note.rawText || note.latex,
                        id: note.id,
                      })
                    }
                    className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                    title="Edit Rumus Langsung"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteFormula(note.id)}
                    className="p-1 rounded hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition cursor-pointer"
                    title="Hapus Rumus"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Sharp KaTeX Formula Rendering */}
              <div
                className={`cursor-pointer overflow-x-auto ${
                  note.fontSize === "sm"
                    ? "text-xs"
                    : note.fontSize === "lg"
                    ? "text-lg font-medium"
                    : note.fontSize === "xl"
                    ? "text-2xl font-bold"
                    : "text-base font-normal"
                }`}
                onDoubleClick={() =>
                  setInlineComposer({
                    x: note.x,
                    y: note.y,
                    text: note.rawText || note.latex,
                    id: note.id,
                  })
                }
                title="Klik untuk memilih, atau klik dua kali untuk mengedit"
              >
                <MathView math={note.latex} block />
              </div>
            </div>
          );
        })}

        {/* Marquee Drag-to-Select Box */}
        {selectionMarquee && (
          <div
            style={{
              left: `${Math.min(selectionMarquee.startX, selectionMarquee.currentX)}%`,
              top: `${Math.min(selectionMarquee.startY, selectionMarquee.currentY)}%`,
              width: `${Math.abs(selectionMarquee.currentX - selectionMarquee.startX)}%`,
              height: `${Math.abs(selectionMarquee.currentY - selectionMarquee.startY)}%`,
            }}
            className="absolute z-30 border-2 border-dashed border-amber-500 bg-amber-500/10 rounded-xl pointer-events-none transition-none"
          />
        )}

        {/* Inline On-Canvas Direct Typing Box */}
        {inlineComposer && (
          <div
            style={{ left: `${inlineComposer.x}%`, top: `${inlineComposer.y}%` }}
            className="absolute z-40 -translate-x-2 -translate-y-2 min-w-[280px] max-w-md p-3 rounded-2xl liquid-glass-popup border-2 border-amber-500/80 shadow-2xl animate-liquid-pop select-none text-slate-800 dark:text-zinc-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-100 dark:border-white/[0.08] text-[11px] font-medium text-slate-500 dark:text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-amber-500" />
                <span>Ketik Rumus di Kanvas</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const text = inlineComposer.text;
                    const editingId = inlineComposer.id;
                    setInlineComposer(null);
                    if (editingId) {
                      const note = formulaNotes.find((n) => n.id === editingId);
                      if (note) {
                        handleOpenEditFormula(note);
                        return;
                      }
                    }
                    handleOpenNewFormula();
                    if (text) setLatexDraft(autoFormatToLatex(text));
                  }}
                  className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                  title="Buka panel simbol matematika lengkap dan palet warna"
                >
                  Simbol &amp; Palet ↗
                </button>
                <span className="text-[10px] text-slate-400">Otomatis KaTeX</span>
              </div>
            </div>

            {/* Live Auto-KaTeX Preview */}
            <div className="min-h-[36px] px-3 py-2 mb-2 rounded-xl bg-slate-100/90 dark:bg-black/40 border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-sm font-medium overflow-x-auto text-slate-900 dark:text-white">
              {inlineComposer.text.trim() ? (
                <MathView math={autoFormatToLatex(inlineComposer.text)} block={false} />
              ) : (
                <span className="text-xs text-slate-400 dark:text-zinc-500 italic">
                  Ketik rumus, misal: y = x^2 - 3, a^2 + b^2 = c^2, atau kubus 10cm...
                </span>
              )}
            </div>

            {/* Direct Input Field */}
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={inlineComposer.text}
                onChange={(e) => setInlineComposer({ ...inlineComposer, text: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitInlineComposer();
                  } else if (e.key === "Escape") {
                    setInlineComposer(null);
                  }
                }}
                placeholder="Ketik rumus matematika..."
                className="flex-1 bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition shadow-inner"
                autoFocus
              />
              <button
                type="button"
                onClick={commitInlineComposer}
                disabled={!inlineComposer.text.trim()}
                className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-30 text-white text-xs font-semibold shadow-xs transition cursor-pointer flex items-center gap-1"
                title="Simpan ke Papan (Enter)"
              >
                <Check className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Pasang</span>
              </button>
              <button
                type="button"
                onClick={() => setInlineComposer(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition cursor-pointer"
                title="Batal (Esc)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* F. FLOATING ZAP AI COPILOT ASSISTANT (Bottom-Right Chatbot Widget) */}
        <div className="absolute bottom-4 right-4 z-30 flex flex-col items-end">
          {isAiWidgetOpen ? (
            <div className="w-[360px] max-w-[calc(100vw-32px)] rounded-2xl liquid-glass-popup border border-slate-200 dark:border-white/10 shadow-2xl p-4 animate-liquid-pop origin-bottom-right space-y-3.5 select-none text-slate-800 dark:text-zinc-200">
              {/* Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 dark:bg-amber-400/15 flex items-center justify-center text-amber-500 dark:text-amber-400">
                    <ZapLogo className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      ZAP Geometry Copilot
                      <span className="text-[9px] px-1.5 py-0.2 bg-amber-500/15 text-amber-600 dark:text-amber-300 rounded font-mono font-medium">
                        AI
                      </span>
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                      Sekali minta, langsung digambar di papan
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAiWidgetOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition cursor-pointer"
                  title="Tutup ZAP AI Copilot"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Suggestion Chips */}
              <div className="space-y-1.5">
                <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 dark:text-zinc-500">
                  Pilihan Cepat:
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto no-scrollbar">
                  {[
                    { label: "Prisma Segitiga 3D", query: "prisma segitiga 3d 10cm" },
                    { label: "Jaring Prisma 2D", query: "jaring-jaring prisma 2d" },
                    { label: "Kubus 10cm", query: "kubus 10cm" },
                    { label: "Jaring Kubus 2D", query: "jaring-jaring kubus 2d" },
                    { label: "Piramida Limas 3D", query: "limas segi empat 3d" },
                    { label: "Jaring Limas 2D", query: "jaring limas 2d" },
                    { label: "Lingkaran 2D", query: "lingkaran r=7cm" },
                    { label: "Persegi Panjang", query: "persegi panjang 14x8" },
                    { label: "Parabola y=x²-3", query: "y=x^2-3" },
                    { label: "Tabung Silinder", query: "tabung r=7 t=12" },
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => {
                        setAiWidgetInput(chip.query);
                        triggerAiSynthesize(chip.query);
                      }}
                      className="px-2 py-1 rounded-lg text-[11px] bg-slate-100 dark:bg-white/[0.06] hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-500/20 dark:hover:text-amber-200 text-slate-700 dark:text-zinc-300 border border-slate-200/80 dark:border-white/[0.06] transition cursor-pointer"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  triggerAiSynthesize(aiWidgetInput);
                }}
                className="space-y-2 pt-1"
              >
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={aiWidgetInput}
                    onChange={(e) => setAiWidgetInput(e.target.value)}
                    placeholder="Misal: buatkan prisma segitiga 3d 10cm..."
                    className="w-full bg-slate-100/90 dark:bg-[#0c0e16] border border-slate-200 dark:border-white/10 rounded-xl pl-3 pr-10 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 transition"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!aiWidgetInput.trim()}
                    className="absolute right-1.5 p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-200 disabled:opacity-30 text-white dark:text-zinc-950 transition cursor-pointer"
                    title="Kirim dan buat di papan"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
                {aiWidgetFeedback && (
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5 animate-fadeIn">
                    <Check className="w-3.5 h-3.5" />
                    <span>{aiWidgetFeedback}</span>
                  </div>
                )}
              </form>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAiWidgetOpen(true)}
              className="group flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white/95 dark:bg-[#121520]/95 hover:bg-white dark:hover:bg-[#181c2b] border border-slate-200 dark:border-white/10 shadow-xl hover:shadow-2xl backdrop-blur-md transition-all duration-200 cursor-pointer active:scale-95"
              title="Buka ZAP AI Copilot untuk membuat bangun 2D/3D & rumus"
            >
              <div className="w-6 h-6 rounded-lg bg-amber-500/10 dark:bg-amber-400/15 flex items-center justify-center text-amber-500 dark:text-amber-400 group-hover:scale-110 transition-transform">
                <ZapLogo className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-900 dark:text-white leading-tight flex items-center gap-1">
                  ZAP AI Copilot
                  <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
                </span>
                <span className="text-[10px] text-slate-500 dark:text-zinc-400 leading-tight">
                  Buat 2D, 3D, atau Rumus
                </span>
              </div>
            </button>
          )}
        </div>

        {/* G. KATEX FORMULA COMPOSER MODAL */}
        {isFormulaModalOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none">
            <div className="w-full max-w-lg rounded-2xl liquid-glass-popup border border-slate-200 dark:border-white/10 shadow-2xl p-5 space-y-4 animate-liquid-pop text-slate-800 dark:text-zinc-200 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 dark:bg-amber-400/15 flex items-center justify-center text-amber-500 dark:text-amber-400">
                    <Type className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {editingFormulaId ? "Edit Rumus KaTeX" : "Tulis Rumus KaTeX"}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Ketik rumus rapi menggunakan keyboard tanpa stylus
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormulaModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Live Rendered KaTeX Preview Box */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Pratinjau Hasil Rumus:
                </span>
                <div className="min-h-[64px] p-4 rounded-xl bg-slate-100/90 dark:bg-[#0c0e16] border border-slate-200/80 dark:border-white/[0.08] flex items-center justify-center text-center overflow-x-auto">
                  {latexDraft.trim() ? (
                    <div
                      className={
                        formulaFontSize === "sm"
                          ? "text-xs"
                          : formulaFontSize === "lg"
                          ? "text-lg font-medium"
                          : formulaFontSize === "xl"
                          ? "text-2xl font-bold"
                          : "text-base font-normal"
                      }
                    >
                      <MathView math={latexDraft} block />
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 dark:text-zinc-500 italic">
                      Ketik rumus di bawah atau klik simbol/template untuk melihat pratinjau...
                    </span>
                  )}
                </div>
              </div>

              {/* Keyboard LaTeX Input Field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center justify-between">
                  <span>Kode KaTeX / LaTeX (Ketik via Keyboard):</span>
                  <span className="text-[10px] lowercase text-slate-400 font-mono">
                    {"contoh: \\frac{a}{b}, x^2, \\sqrt{x}"}
                  </span>
                </label>
                <textarea
                  value={latexDraft}
                  onChange={(e) => setLatexDraft(e.target.value)}
                  placeholder="Misal: L = \frac{1}{2} \times a \times t atau a^2 + b^2 = c^2"
                  rows={2}
                  className="w-full bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/10 rounded-xl p-3 text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 transition resize-none"
                  autoFocus
                />
              </div>

              {/* Quick Math Symbols Palette */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Simbol Cepat (Klik untuk Sisipkan):
                </div>
                <div className="flex flex-wrap gap-1">
                  {FORMULA_SYMBOLS.map((sym) => (
                    <button
                      key={sym.label}
                      type="button"
                      onClick={() => handleInsertSymbol(sym.insert)}
                      className="px-2 py-1 rounded-lg text-xs font-mono bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.1] text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-white/[0.06] transition cursor-pointer"
                      title={`Sisipkan ${sym.insert}`}
                    >
                      {sym.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Math Formula Templates */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Template Rumus Populer:
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto no-scrollbar">
                  {FORMULA_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.name}
                      type="button"
                      onClick={() => setLatexDraft(tmpl.latex)}
                      className="px-2 py-1 rounded-lg text-[11px] bg-slate-100 hover:bg-amber-50 hover:text-amber-700 dark:bg-white/[0.04] dark:hover:bg-amber-500/15 dark:hover:text-amber-300 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-white/[0.06] transition cursor-pointer"
                    >
                      {tmpl.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Style Controls: Color & Font Size */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-white/[0.06]">
                {/* Color Swatches */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400">Warna:</span>
                  {(
                    [
                      { id: "default", bg: "bg-slate-700 dark:bg-zinc-200", label: "Standar" },
                      { id: "amber", bg: "bg-amber-500", label: "Kuning / Amber" },
                      { id: "emerald", bg: "bg-emerald-500", label: "Hijau" },
                      { id: "blue", bg: "bg-blue-500", label: "Biru" },
                      { id: "rose", bg: "bg-rose-500", label: "Merah" },
                      { id: "purple", bg: "bg-purple-500", label: "Ungu" },
                    ] as const
                  ).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setFormulaColor(c.id)}
                      className={`w-5 h-5 rounded-full ${c.bg} transition-all cursor-pointer ${
                        formulaColor === c.id
                          ? "ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-110"
                          : "opacity-70 hover:opacity-100"
                      }`}
                      title={c.label}
                    />
                  ))}
                </div>

                {/* Font Size Selector */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/[0.04] p-0.5 rounded-xl border border-slate-200 dark:border-white/[0.06]">
                  {(
                    [
                      { id: "sm", label: "S" },
                      { id: "base", label: "M" },
                      { id: "lg", label: "L" },
                      { id: "xl", label: "XL" },
                    ] as const
                  ).map((sz) => (
                    <button
                      key={sz.id}
                      type="button"
                      onClick={() => setFormulaFontSize(sz.id)}
                      className={`px-2 py-0.5 rounded-lg text-xs font-mono font-medium transition cursor-pointer ${
                        formulaFontSize === sz.id
                          ? "bg-white dark:bg-white/[0.16] text-slate-900 dark:text-white shadow-xs font-bold"
                          : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      {sz.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormulaModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={!latexDraft.trim()}
                  onClick={handleSaveFormula}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-200 disabled:opacity-40 text-white dark:text-zinc-950 text-xs font-semibold shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingFormulaId ? "Perbarui Rumus" : "Pasang ke Papan"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
