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
} from "lucide-react";
import { useTheme } from "@/utils/theme";

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
  | "lingkaran";

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
  limas: "Limas Segi Empat 3D",
};

// Quick formula suggestions
const SMART_PRESETS = [
  { label: "Persegi Panjang", model: "2d_shape" as MathModelType, planeShape: "persegi_panjang" as PlaneShapeKind, paramA: 14, paramB: 8, unit: "cm", desc: "Persegi panjang p=14, l=8" },
  { label: "Persegi", model: "2d_shape" as MathModelType, planeShape: "persegi" as PlaneShapeKind, paramA: 10, unit: "cm", desc: "Persegi sisi s=10" },
  { label: "Jajar Genjang", model: "2d_shape" as MathModelType, planeShape: "jajar_genjang" as PlaneShapeKind, paramA: 12, paramB: 8, paramC: 10, unit: "cm", desc: "Jajar genjang alas, tinggi & sisi miring" },
  { label: "Trapesium", model: "2d_shape" as MathModelType, planeShape: "trapesium" as PlaneShapeKind, paramA: 8, paramB: 14, paramC: 6, unit: "cm", desc: "Trapesium sisi sejajar & tinggi" },
  { label: "Segitiga", model: "2d_shape" as MathModelType, planeShape: "segitiga" as PlaneShapeKind, paramA: 10, paramB: 8, unit: "cm", desc: "Segitiga alas & tinggi" },
  { label: "y = x² - 3", model: "2d_quadratic" as MathModelType, desc: "Grafik parabola & akar real" },
  { label: "y = 2 sin(x)", model: "2d_trig" as MathModelType, desc: "Gelombang trigonometri & amplitudo" },
  { label: "Kubus 10cm", model: "solids" as MathModelType, solid: "kubus" as SolidKind, paramA: 10, unit: "cm", hasSlice: false, desc: "Kubus sisi 10 cm geometri ruang" },
  { label: "Kubus + Irisan", model: "solids" as MathModelType, solid: "kubus" as SolidKind, paramA: 10, unit: "cm", hasSlice: true, desc: "Kubus sisi 10 cm dengan bidang irisan" },
  { label: "Balok 10×6×4", model: "solids" as MathModelType, solid: "balok" as SolidKind, paramA: 10, paramB: 6, paramC: 4, unit: "cm", desc: "Balok ruang p×l×t" },
  { label: "Prisma Segitiga", model: "solids" as MathModelType, solid: "prisma" as SolidKind, paramA: 8, paramB: 10, unit: "cm", desc: "Prisma segitiga geometri ruang" },
  { label: "Limas Segi Empat", model: "solids" as MathModelType, solid: "limas" as SolidKind, paramA: 8, paramB: 10, unit: "cm", desc: "Limas tegak segi empat p×l×t" },
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

  // Formula input bar
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
    if (initialPlaneShapeKind) {
      setPlaneShapeKind(initialPlaneShapeKind);
      onPlaneShapeChange?.(initialPlaneShapeKind);
    }
    if (initialSolidKind) {
      setSolidKind(initialSolidKind);
      onSolidKindChange?.(initialSolidKind);
      if (SOLID_LABELS[initialSolidKind]) {
        setFormulaInput(`${SOLID_LABELS[initialSolidKind]} ${initialParamA || 10}${initialUnit || "cm"}`);
      }
    }
  }, [initialModel, initialSolidKind, initialParamA, initialUnit, onSolidKindChange]);

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

    // Parse dimensions & unit (e.g. "10cm", "10 cm", "r=7")
    const numMatch = raw.match(/(\d+(?:[.,]\d+)?)\s*(cm|m|mm|in)?/i);
    const parsedA = numMatch ? parseFloat(numMatch[1].replace(",", ".")) : undefined;
    const parsedUnit = numMatch ? (numMatch[2] || "cm") : "cm";

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

    if (raw.includes("limas") || raw.includes("pyramid")) {
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

        {/* Center: Command / Formula input bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSynthesizeFormula(formulaInput);
          }}
          className="flex-1 min-w-0 max-w-xs relative flex items-center"
        >
          <Sparkles className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 dark:text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={formulaInput}
            onChange={(e) => setFormulaInput(e.target.value)}
            placeholder="Ketik: cube 10cm, y=x²-3..."
            className="w-full dark:bg-[#141724] bg-slate-100 border dark:border-white/[0.08] border-slate-200 rounded-xl pl-8 pr-14 py-1 text-xs dark:text-white text-slate-900 dark:placeholder-zinc-500 placeholder-slate-400 focus:outline-none focus:border-slate-400 dark:focus:border-white/30 transition truncate"
          />
          <button
            type="submit"
            className="absolute right-1 px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-[11px] font-semibold transition cursor-pointer"
            title="Render bangun geometri atau rumus"
          >
            Gambar
          </button>
        </form>

        {/* Right: Tools Cluster */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
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
      <div className="flex-1 relative w-full h-full min-h-0 bg-slate-50 dark:bg-[#080a0f] overflow-hidden">
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
                  Papan tulis interaktif untuk simulasi geometri 3D, grafik 2D, dan coretan kapur. Pilih preset di bawah atau ketik perintah di atas.
                </p>
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
                        : planeShapeKind === "persegi"
                        ? "Panjang Sisi (s):"
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
              {((activeModel === "2d_shape" && planeShapeKind !== "persegi") || activeModel === "cylinder" || solidKind === "balok" || solidKind === "prisma" || solidKind === "limas") && (
                <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-white/[0.06]">
                  <div className="flex justify-between text-slate-700 dark:text-zinc-300 font-medium">
                    <span>
                      {activeModel === "2d_shape"
                        ? planeShapeKind === "persegi_panjang"
                          ? "Lebar (l):"
                          : planeShapeKind === "trapesium"
                          ? "Sisi Bawah (b):"
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
      </div>
    </div>
  );
}
