"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  RotateCcw,
  Layers,
  Eye,
  EyeOff,
  Play,
  Pause,
  Ruler,
} from "lucide-react";

export type MathModelType =
  | "parabola"
  | "conic_slicer"
  | "cylinder"
  | "saddle"
  | "counting_blocks"
  | "solids"
  | "surface";

type SolidKind = "kubus" | "balok" | "bola" | "kerucut" | "prisma" | "limas";
type SurfaceKind = "paraboloid" | "ripple" | "gaussian" | "plane";

interface InteractiveCanvas3DProps {
  initialModel?: MathModelType;
  showComparisonFault?: boolean;
  className?: string;
  onModelChange?: (model: MathModelType) => void;
  isProjectorMode?: boolean;
}

const GRID_Y = -1.5;

function fmt(n: number): string {
  return n.toFixed(2).replace(".", ",");
}

interface InfoRow {
  label: string;
  formula: string;
  value?: string;
}

const SOLID_LABELS: Record<SolidKind, string> = {
  kubus: "Kubus",
  balok: "Balok",
  bola: "Bola",
  kerucut: "Kerucut",
  prisma: "Prisma Segitiga",
  limas: "Limas Segi Empat",
};

const SURFACE_LABELS: Record<SurfaceKind, string> = {
  paraboloid: "Paraboloid",
  ripple: "Riak (Ripple)",
  gaussian: "Lonceng Gauss",
  plane: "Bidang Miring",
};

export default function InteractiveCanvas3D({
  initialModel = "parabola",
  showComparisonFault = false,
  className = "",
  onModelChange,
  isProjectorMode = false,
}: InteractiveCanvas3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshGroupRef = useRef<THREE.Group | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const [activeModel, setActiveModel] = useState<MathModelType>(initialModel);
  const [wireframe, setWireframe] = useState(false);
  const [showComparison, setShowComparison] = useState(showComparisonFault);
  const [autoRotate, setAutoRotate] = useState(false);
  const [solidKind, setSolidKind] = useState<SolidKind>("balok");
  const [surfaceKind, setSurfaceKind] = useState<SurfaceKind>("paraboloid");

  // Parameter dinamis: A/B dipakai semua model, C khusus bangun ruang.
  const [paramA, setParamA] = useState(1);
  const [paramB, setParamB] = useState(0);
  const [paramC, setParamC] = useState(1.4);

  useEffect(() => {
    setShowComparison(showComparisonFault);
  }, [showComparisonFault]);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
      controlsRef.current.autoRotateSpeed = 1.4;
    }
  }, [autoRotate]);

  // ---- Perhitungan bangun ruang (dipakai mesh + panel ukur) ----
  const solidMetrics = useCallback((): { volume: number; surface: number; rows: InfoRow[] } => {
    const A = paramA;
    const B = paramB;
    const C = paramC;
    switch (solidKind) {
      case "kubus": {
        const v = A ** 3;
        const lp = 6 * A * A;
        return {
          volume: v,
          surface: lp,
          rows: [
            { label: "Sisi (s)", formula: "s", value: fmt(A) },
            { label: "Volume", formula: "V = s³", value: fmt(v) },
            { label: "Luas Permukaan", formula: "LP = 6 × s²", value: fmt(lp) },
          ],
        };
      }
      case "balok": {
        const v = A * B * C;
        const lp = 2 * (A * B + A * C + B * C);
        return {
          volume: v,
          surface: lp,
          rows: [
            { label: "Ukuran", formula: "p × l × t", value: `${fmt(A)} × ${fmt(B)} × ${fmt(C)}` },
            { label: "Volume", formula: "V = p × l × t", value: fmt(v) },
            { label: "Luas Permukaan", formula: "LP = 2(pl + pt + lt)", value: fmt(lp) },
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
            { label: "Jari-jari (r)", formula: "r", value: fmt(A) },
            { label: "Volume", formula: "V = 4/3 × π × r³", value: fmt(v) },
            { label: "Luas Permukaan", formula: "LP = 4 × π × r²", value: fmt(lp) },
          ],
        };
      }
      case "kerucut": {
        const s = Math.sqrt(A * A + B * B);
        const v = (1 / 3) * Math.PI * A * A * B;
        const lp = Math.PI * A * (A + s);
        return {
          volume: v,
          surface: lp,
          rows: [
            { label: "Jari-jari & Tinggi", formula: "r, t", value: `${fmt(A)}, ${fmt(B)}` },
            { label: "Garis Pelukis", formula: "s = √(r² + t²)", value: fmt(s) },
            { label: "Volume", formula: "V = 1/3 × π × r² × t", value: fmt(v) },
            { label: "Luas Permukaan", formula: "LP = π × r × (r + s)", value: fmt(lp) },
          ],
        };
      }
      case "prisma": {
        // Penampang segitiga sama sisi dari silinder 3 sisi berjari-jari A.
        const sisi = A * Math.sqrt(3);
        const tinggiSegitiga = 1.5 * A;
        const luasAlas = 0.5 * sisi * tinggiSegitiga;
        const v = luasAlas * C;
        const lp = 2 * luasAlas + 3 * sisi * C;
        return {
          volume: v,
          surface: lp,
          rows: [
            { label: "Sisi Alas", formula: "a = R√3", value: fmt(sisi) },
            { label: "Panjang Prisma", formula: "L", value: fmt(C) },
            { label: "Volume", formula: "V = Luas alas × L", value: fmt(v) },
            { label: "Luas Permukaan", formula: "LP = 2×alas + keliling×L", value: fmt(lp) },
          ],
        };
      }
      case "limas": {
        const apotema = Math.sqrt((A / 2) ** 2 + B * B);
        const v = (1 / 3) * A * A * B;
        const lp = A * A + 2 * A * apotema;
        return {
          volume: v,
          surface: lp,
          rows: [
            { label: "Sisi Alas & Tinggi", formula: "s, t", value: `${fmt(A)}, ${fmt(B)}` },
            { label: "Volume", formula: "V = 1/3 × s² × t", value: fmt(v) },
            { label: "Luas Permukaan", formula: "LP = s² + 2 × s × apotema", value: fmt(lp) },
          ],
        };
      }
    }
  }, [solidKind, paramA, paramB, paramC]);

  const buildSurfaceZ = useCallback(
    (x: number, y: number): number => {
      const A = paramA;
      const B = paramB;
      let z = 0;
      switch (surfaceKind) {
        case "paraboloid":
          z = 0.22 * (x * x + y * y) * A - 2;
          break;
        case "ripple": {
          const r = Math.sqrt(x * x + y * y);
          z = A * Math.sin(r * (1.2 + B)) * Math.exp(-r * 0.22) * 1.6;
          break;
        }
        case "gaussian":
          z = A * 3.2 * Math.exp(-(x * x + y * y) / 3) - 1;
          break;
        case "plane":
          z = 0.35 * A * x + 0.25 * B * y;
          break;
      }
      return Math.max(-4, Math.min(5.5, z));
    },
    [surfaceKind, paramA, paramB]
  );

  // Bangun ulang mesh berdasarkan model + parameter aktif
  const rebuildMeshes = useCallback(() => {
    if (!meshGroupRef.current) return;
    const group = meshGroupRef.current;

    const disposeObject = (obj: THREE.Object3D) => {
      obj.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else if (mat) mat.dispose();
      });
    };

    while (group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);
      disposeObject(obj);
    }

    const addEdges = (mesh: THREE.Mesh, geometry: THREE.BufferGeometry) => {
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geometry, 24),
        new THREE.LineBasicMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.35 })
      );
      mesh.add(edges);
    };

    if (activeModel === "parabola") {
      const segments = 40;
      const geom = new THREE.PlaneGeometry(8, 8, segments, segments);
      const pos = geom.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = ((x + 1.5) ** 2 - 2) * 0.4;
        pos.setZ(i, z);
      }
      geom.computeVertexNormals();

      const matCorrect = new THREE.MeshStandardMaterial({
        color: 0x2563eb,
        wireframe,
        side: THREE.DoubleSide,
        roughness: 0.3,
        metalness: 0.2,
        transparent: true,
        opacity: 0.85,
      });
      const meshCorrect = new THREE.Mesh(geom, matCorrect);
      meshCorrect.rotation.x = -Math.PI / 2;
      group.add(meshCorrect);

      const vertexGeom = new THREE.SphereGeometry(0.18, 16, 16);
      const vertexMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
      const vertexPoint = new THREE.Mesh(vertexGeom, vertexMat);
      vertexPoint.position.set(-1.5, -0.8, 0);
      group.add(vertexPoint);

      if (showComparison) {
        const geomFault = new THREE.PlaneGeometry(8, 8, segments, segments);
        const posFault = geomFault.attributes.position;
        for (let i = 0; i < posFault.count; i++) {
          const x = posFault.getX(i);
          const z = (x ** 2 + 1) * 0.4;
          posFault.setZ(i, z);
        }
        geomFault.computeVertexNormals();

        const matFault = new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          wireframe: true,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.7,
        });
        const meshFault = new THREE.Mesh(geomFault, matFault);
        meshFault.rotation.x = -Math.PI / 2;
        group.add(meshFault);
      }
    } else if (activeModel === "conic_slicer") {
      const coneHeight = 4;
      const coneRadius = 2.5;

      const coneMat = new THREE.MeshStandardMaterial({
        color: 0x3b82f6,
        wireframe,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      });
      const topConeGeom = new THREE.ConeGeometry(coneRadius, coneHeight, 32, 1, true);
      const topCone = new THREE.Mesh(topConeGeom, coneMat);
      topCone.position.y = coneHeight / 2;
      group.add(topCone);

      const btmConeGeom = new THREE.ConeGeometry(coneRadius, coneHeight, 32, 1, true);
      const btmCone = new THREE.Mesh(btmConeGeom, coneMat);
      btmCone.rotation.x = Math.PI;
      btmCone.position.y = -coneHeight / 2;
      group.add(btmCone);

      const planeGeom = new THREE.PlaneGeometry(5, 5);
      const planeMat = new THREE.MeshStandardMaterial({
        color: 0xf43f5e,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75,
      });
      const slicePlane = new THREE.Mesh(planeGeom, planeMat);
      slicePlane.rotation.x = Math.PI / 2 + (paramB * Math.PI) / 180;
      slicePlane.position.y = paramA - 1;
      group.add(slicePlane);
    } else if (activeModel === "cylinder") {
      const radius = 1 + paramA * 0.8;
      const height = 2 + paramB * 0.05;

      const cylGeom = new THREE.CylinderGeometry(radius, radius, height, 40);
      const cylMat = new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        wireframe,
        transparent: true,
        opacity: 0.7,
        roughness: 0.2,
      });
      const cylMesh = new THREE.Mesh(cylGeom, cylMat);
      group.add(cylMesh);

      const liquidGeom = new THREE.CylinderGeometry(radius * 0.98, radius * 0.98, height * 0.6, 40);
      const liquidMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        transparent: true,
        opacity: 0.85,
      });
      const liquidMesh = new THREE.Mesh(liquidGeom, liquidMat);
      liquidMesh.position.y = -height * 0.2;
      group.add(liquidMesh);
    } else if (activeModel === "saddle") {
      const segments = 36;
      const geom = new THREE.PlaneGeometry(6, 6, segments, segments);
      const pos = geom.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = (x ** 2 - y ** 2) * 0.25;
        pos.setZ(i, z);
      }
      geom.computeVertexNormals();

      const mat = new THREE.MeshStandardMaterial({
        color: 0x8b5cf6,
        wireframe,
        side: THREE.DoubleSide,
        roughness: 0.4,
      });
      const saddleMesh = new THREE.Mesh(geom, mat);
      saddleMesh.rotation.x = -Math.PI / 2;
      group.add(saddleMesh);
    } else if (activeModel === "counting_blocks") {
      const blockColors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0x8b5cf6];
      const count = Math.max(1, Math.min(10, Math.round(paramA * 5)));

      for (let i = 0; i < count; i++) {
        const boxGeom = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        const boxMat = new THREE.MeshStandardMaterial({
          color: blockColors[i % blockColors.length],
          wireframe,
          roughness: 0.2,
        });
        const box = new THREE.Mesh(boxGeom, boxMat);
        box.position.set((i % 5) * 1 - 2, Math.floor(i / 5) * 1, 0);
        group.add(box);
      }
    } else if (activeModel === "solids") {
      const mat = new THREE.MeshStandardMaterial({
        color: 0x0ea5e9,
        wireframe,
        transparent: true,
        opacity: 0.82,
        roughness: 0.25,
        metalness: 0.1,
      });
      let geom: THREE.BufferGeometry | null = null;
      let centerY = 0;

      if (solidKind === "kubus") {
        geom = new THREE.BoxGeometry(paramA, paramA, paramA);
        centerY = GRID_Y + paramA / 2;
      } else if (solidKind === "balok") {
        geom = new THREE.BoxGeometry(paramA, paramC, paramB);
        centerY = GRID_Y + paramC / 2;
      } else if (solidKind === "bola") {
        geom = new THREE.SphereGeometry(paramA, 44, 30);
        centerY = GRID_Y + paramA;
      } else if (solidKind === "kerucut") {
        geom = new THREE.ConeGeometry(paramA, paramB, 44);
        centerY = GRID_Y + paramB / 2;
      } else if (solidKind === "prisma") {
        geom = new THREE.CylinderGeometry(paramA, paramA, paramC, 3, 1);
        centerY = GRID_Y + paramA * 0.62;
      } else if (solidKind === "limas") {
        const radius = paramA / Math.SQRT2;
        geom = new THREE.ConeGeometry(radius, paramB, 4, 1);
        centerY = GRID_Y + paramB / 2;
      }

      if (geom) {
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.y = centerY;
        if (solidKind === "prisma") {
          mesh.rotation.x = Math.PI / 2;
          mesh.rotation.y = Math.PI / 6;
          mesh.position.y = GRID_Y + paramA * 0.55;
        }
        if (solidKind === "limas") {
          mesh.rotation.y = Math.PI / 4;
        }
        if (!wireframe) addEdges(mesh, geom);
        group.add(mesh);
      }
    } else if (activeModel === "surface") {
      const segments = 52;
      const geom = new THREE.PlaneGeometry(8, 8, segments, segments);
      const pos = geom.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        pos.setZ(i, buildSurfaceZ(x, y));
      }
      geom.computeVertexNormals();

      const mat = new THREE.MeshStandardMaterial({
        color: 0x7c3aed,
        wireframe,
        side: THREE.DoubleSide,
        roughness: 0.35,
        metalness: 0.15,
        transparent: true,
        opacity: 0.92,
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.rotation.x = -Math.PI / 2;
      group.add(mesh);
    }
  }, [activeModel, wireframe, showComparison, paramA, paramB, paramC, solidKind, buildSurfaceZ]);

  // Setup scene Three.js
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(6, 5, 8);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 25;
    controls.minDistance = 2;
    controls.autoRotate = autoRotate;
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(10, 15, 10);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.6);
    dirLight2.position.set(-10, -5, -10);
    scene.add(dirLight2);

    const gridHelper = new THREE.GridHelper(10, 20, 0x334155, 0x1e293b);
    gridHelper.position.y = GRID_Y;
    scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(3);
    scene.add(axesHelper);

    const meshGroup = new THREE.Group();
    scene.add(meshGroup);
    meshGroupRef.current = meshGroup;

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    rebuildMeshes();
  }, [rebuildMeshes]);

  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.background = new THREE.Color(isProjectorMode ? 0x0a1120 : 0x020617);
    }
  }, [isProjectorMode]);

  const handleResetCamera = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(6, 5, 8);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  };

  const selectModel = (model: MathModelType) => {
    setActiveModel(model);
    onModelChange?.(model);
    if (model === "conic_slicer") {
      setParamA(1);
      setParamB(30);
    } else if (model === "cylinder") {
      setParamA(1);
      setParamB(20);
    } else if (model === "solids") {
      selectSolidKind(solidKind);
    } else if (model === "surface") {
      setParamA(1);
      setParamB(1);
    } else {
      setParamA(1);
      setParamB(0);
    }
  };

  const selectSolidKind = (kind: SolidKind) => {
    setSolidKind(kind);
    if (kind === "kubus") {
      setParamA(2);
    } else if (kind === "balok") {
      setParamA(2.6);
      setParamB(1.8);
      setParamC(1.4);
    } else if (kind === "bola") {
      setParamA(1.5);
    } else if (kind === "kerucut") {
      setParamA(1.6);
      setParamB(2.6);
    } else if (kind === "prisma") {
      setParamA(1.2);
      setParamC(3.2);
    } else if (kind === "limas") {
      setParamA(2.4);
      setParamB(2.4);
    }
  };

  // ---- Panel ukur: rumus + nilai hidup per model ----
  const infoRows: InfoRow[] | null = (() => {
    if (activeModel === "solids") return solidMetrics().rows;
    if (activeModel === "cylinder") {
      const r = 1 + paramA * 0.8;
      const h = 2 + paramB * 0.05;
      return [
        { label: "Jari-jari & Tinggi", formula: "r, h", value: `${fmt(r)}, ${fmt(h)}` },
        { label: "Volume", formula: "V = π × r² × h", value: fmt(Math.PI * r * r * h) },
        { label: "Luas Permukaan", formula: "LP = 2πr(r + h)", value: fmt(2 * Math.PI * r * (r + h)) },
      ];
    }
    if (activeModel === "surface") {
      const eq: Record<SurfaceKind, string> = {
        paraboloid: "z = a(x² + y²)",
        ripple: "z = a · sin(r·k) · e^(−0,22r)",
        gaussian: "z = a · e^(−(x²+y²)/3)",
        plane: "z = 0,35a·x + 0,25b·y",
      };
      return [{ label: "Persamaan", formula: eq[surfaceKind] }];
    }
    if (activeModel === "parabola") {
      return [
        { label: "Benar (biru)", formula: "z = (x + 3)² − 4" },
        { label: "Titik Puncak", formula: "(−3, −4)" },
      ];
    }
    if (activeModel === "saddle") {
      return [{ label: "Persamaan", formula: "z = x² − y²" }];
    }
    return null;
  })();

  const infoTitle =
    activeModel === "solids"
      ? SOLID_LABELS[solidKind]
      : activeModel === "surface"
        ? SURFACE_LABELS[surfaceKind]
        : activeModel === "cylinder"
          ? "Tabung"
          : "Model";

  const board = isProjectorMode;
  const tabCls = (active: boolean) =>
    `rounded-lg font-medium transition-all whitespace-nowrap ${
      board ? "px-3.5 py-2.5 text-sm min-h-[48px]" : "px-2.5 py-1 text-xs"
    } ${
      active
        ? "bg-blue-600 text-white shadow-sm"
        : "text-slate-400 hover:text-slate-200"
    }`;
  const iconBtnCls = (active: boolean) =>
    `rounded-xl backdrop-blur-md border transition-all ${
      board ? "p-3 min-w-[48px] min-h-[48px]" : "p-2"
    } ${
      active
        ? "bg-blue-600/30 border-blue-500 text-blue-300"
        : "bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200"
    }`;

  const sliderRow = (
    label: string,
    value: number,
    min: number,
    max: number,
    step: number,
    onChange: (v: number) => void,
    accent: string,
    display?: string
  ) => (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-slate-400 uppercase font-semibold whitespace-nowrap">
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`${board ? "w-32 h-2" : "w-20"} ${accent} cursor-pointer`}
      />
      {display !== undefined && (
        <span className="text-[10px] font-mono text-slate-300">{display}</span>
      )}
    </div>
  );

  return (
    <div
      className={`relative w-full h-full flex flex-col bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 ${className}`}
    >
      {/* Bar atas: pemilih model + aksi */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-start justify-between pointer-events-none gap-2">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl pointer-events-auto shadow-lg max-w-[78%]">
          <button onClick={() => selectModel("parabola")} className={tabCls(activeModel === "parabola")}>
            Fungsi Kuadrat
          </button>
          <button onClick={() => selectModel("conic_slicer")} className={tabCls(activeModel === "conic_slicer")}>
            Irisan Kerucut
          </button>
          <button onClick={() => selectModel("cylinder")} className={tabCls(activeModel === "cylinder")}>
            Tabung
          </button>
          <button onClick={() => selectModel("solids")} className={tabCls(activeModel === "solids")}>
            Bangun Ruang
          </button>
          <button onClick={() => selectModel("surface")} className={tabCls(activeModel === "surface")}>
            Permukaan f(x,y)
          </button>
          <button onClick={() => selectModel("saddle")} className={tabCls(activeModel === "saddle")}>
            Pelana
          </button>
          <button onClick={() => selectModel("counting_blocks")} className={tabCls(activeModel === "counting_blocks")}>
            Balok CPA
          </button>
        </div>

        <div className="flex items-center gap-1.5 pointer-events-auto flex-shrink-0">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            title={autoRotate ? "Hentikan putar otomatis" : "Putar otomatis (mode presentasi)"}
            className={iconBtnCls(autoRotate)}
          >
            {autoRotate ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setWireframe(!wireframe)}
            title="Kerangka garis (wireframe)"
            className={iconBtnCls(wireframe)}
          >
            <Layers className="w-4 h-4" />
          </button>
          <button onClick={handleResetCamera} title="Atur ulang sudut kamera" className={iconBtnCls(false)}>
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Panel ukur: rumus + nilai hidup */}
      {infoRows && (
        <div className="absolute top-16 right-3 z-10 w-60 max-w-[70%] p-3 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl shadow-xl pointer-events-none">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
            <Ruler className="w-3.5 h-3.5 text-sky-400" />
            <span>{infoTitle}</span>
          </div>
          <div className="space-y-1">
            {infoRows.map((row) => (
              <div key={row.label} className="flex items-baseline justify-between gap-2 text-[11px]">
                <span className="text-slate-400">{row.label}</span>
                <span className="text-right">
                  <span className="font-mono text-slate-300">{row.formula}</span>
                  {row.value !== undefined && (
                    <span className="font-mono font-semibold text-sky-300"> = {row.value}</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kontainer WebGL */}
      <div ref={containerRef} className="w-full flex-1 relative cursor-grab active:cursor-grabbing" />

      {/* Bar bawah: parameter dinamis */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex items-end justify-between pointer-events-none gap-2">
        <div className="flex flex-col gap-2 pointer-events-auto max-w-full">
          {activeModel === "solids" && (
            <div className="flex items-center gap-1.5 p-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl shadow-xl overflow-x-auto">
              {(Object.keys(SOLID_LABELS) as SolidKind[]).map((kind) => (
                <button
                  key={kind}
                  onClick={() => selectSolidKind(kind)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
                    solidKind === kind
                      ? "bg-sky-600 text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {SOLID_LABELS[kind]}
                </button>
              ))}
            </div>
          )}

          {activeModel === "surface" && (
            <div className="flex items-center gap-1.5 p-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl shadow-xl overflow-x-auto">
              {(Object.keys(SURFACE_LABELS) as SurfaceKind[]).map((kind) => (
                <button
                  key={kind}
                  onClick={() => setSurfaceKind(kind)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
                    surfaceKind === kind
                      ? "bg-violet-600 text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {SURFACE_LABELS[kind]}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 p-2 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl text-xs text-slate-300 shadow-xl overflow-x-auto">
            {activeModel === "conic_slicer" && (
              <>
                {sliderRow("Tinggi Iris", paramA, 0, 3, 0.1, setParamA, "accent-blue-500")}
                {sliderRow("Sudut", paramB, 0, 60, 1, setParamB, "accent-rose-500", `${paramB}°`)}
              </>
            )}

            {activeModel === "cylinder" && (
              <>
                {sliderRow("Radius (r)", paramA, 0.5, 2, 0.1, setParamA, "accent-cyan-500", fmt(1 + paramA * 0.8))}
                {sliderRow("Tinggi (h)", paramB, 0, 40, 1, setParamB, "accent-blue-500", fmt(2 + paramB * 0.05))}
              </>
            )}

            {activeModel === "counting_blocks" && (
              <>{sliderRow("Jumlah Balok", paramA, 0.2, 2, 0.2, setParamA, "accent-emerald-500", `${Math.round(paramA * 5)} Balok`)}</>
            )}

            {activeModel === "solids" && solidKind === "kubus" && (
              <>{sliderRow("Sisi (s)", paramA, 1, 3, 0.1, setParamA, "accent-sky-500", fmt(paramA))}</>
            )}
            {activeModel === "solids" && solidKind === "balok" && (
              <>
                {sliderRow("Panjang", paramA, 1.2, 4, 0.1, setParamA, "accent-sky-500", fmt(paramA))}
                {sliderRow("Lebar", paramB, 0.8, 3, 0.1, setParamB, "accent-cyan-500", fmt(paramB))}
                {sliderRow("Tinggi", paramC, 0.6, 3, 0.1, setParamC, "accent-blue-500", fmt(paramC))}
              </>
            )}
            {activeModel === "solids" && solidKind === "bola" && (
              <>{sliderRow("Jari-jari (r)", paramA, 0.8, 2.2, 0.1, setParamA, "accent-sky-500", fmt(paramA))}</>
            )}
            {activeModel === "solids" && (solidKind === "kerucut" || solidKind === "limas") && (
              <>
                {sliderRow(solidKind === "kerucut" ? "Jari-jari (r)" : "Sisi Alas (s)", paramA, 1, 3.2, 0.1, setParamA, "accent-sky-500", fmt(paramA))}
                {sliderRow("Tinggi (t)", paramB, 1, 4, 0.1, setParamB, "accent-blue-500", fmt(paramB))}
              </>
            )}
            {activeModel === "solids" && solidKind === "prisma" && (
              <>
                {sliderRow("Skala Alas (R)", paramA, 0.8, 1.8, 0.1, setParamA, "accent-sky-500", fmt(paramA))}
                {sliderRow("Panjang (L)", paramC, 2, 4.5, 0.1, setParamC, "accent-blue-500", fmt(paramC))}
              </>
            )}

            {activeModel === "surface" && (
              <>
                {sliderRow("Koefisien (a)", paramA, 0.3, 1.8, 0.05, setParamA, "accent-violet-500", fmt(paramA))}
                {sliderRow("Parameter (b)", paramB, 0, 2, 0.1, setParamB, "accent-purple-500", fmt(paramB))}
              </>
            )}

            {activeModel === "parabola" && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowComparison(!showComparison)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium transition-all ${
                    showComparison
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "bg-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {showComparison ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>Bandingkan Coretan Keliru</span>
                </button>
                {showComparison && (
                  <span className="text-[10px] text-amber-400 animate-pulse whitespace-nowrap">
                    Kuning: x² + 5 (Keliru) vs Biru: (x+3)² - 4
                  </span>
                )}
              </div>
            )}

            {(activeModel === "saddle" || activeModel === "surface") && activeModel !== "surface" && (
              <span className="text-[10px] text-slate-400">Geser untuk memutar permukaan dari semua sudut.</span>
            )}
            {activeModel !== "parabola" &&
              activeModel !== "conic_slicer" &&
              activeModel !== "cylinder" &&
              activeModel !== "counting_blocks" &&
              activeModel !== "solids" &&
              activeModel !== "surface" && (
                <span className="text-[10px] text-slate-400">Geser untuk memutar, cubit untuk zoom.</span>
              )}
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-lg text-[10px] text-slate-400 pointer-events-none flex-shrink-0">
          <span>Putar: 1 Jari / Klik Kiri</span>
          <span>•</span>
          <span>Zoom: Scroll / Cubit</span>
        </div>
      </div>
    </div>
  );
}
