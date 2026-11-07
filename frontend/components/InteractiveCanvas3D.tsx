"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  RotateCcw,
  Layers,
  Eye,
  EyeOff,
} from "lucide-react";

export type MathModelType =
  | "parabola"
  | "conic_slicer"
  | "cylinder"
  | "saddle"
  | "counting_blocks";

interface InteractiveCanvas3DProps {
  initialModel?: MathModelType;
  showComparisonFault?: boolean;
  className?: string;
  onModelChange?: (model: MathModelType) => void;
  isProjectorMode?: boolean;
}

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

  // Dynamic parameters
  const [paramA, setParamA] = useState(1); // e.g., radius / coefficient
  const [paramB, setParamB] = useState(0); // e.g., height / tilt angle

  // Sync external prop changes
  useEffect(() => {
    setShowComparison(showComparisonFault);
  }, [showComparisonFault]);

  // Build 3D mesh based on active model and parameters
  const rebuildMeshes = useCallback(() => {
    if (!meshGroupRef.current) return;
    const group = meshGroupRef.current;

    // Clear existing children and release GPU resources
    while (group.children.length > 0) {
      const obj = group.children[0] as THREE.Mesh;
      group.remove(obj);
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    }

    if (activeModel === "parabola") {
      // 1. Correct Parabola: z = (x + 3)^2 - 4
      const segments = 40;
      const geom = new THREE.PlaneGeometry(8, 8, segments, segments);
      const pos = geom.attributes.position;

      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        // z = (x + 3)^2 - 4 (scaled for view)
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

      // Vertex point marker at (-1.5, 0, -0.8)
      const vertexGeom = new THREE.SphereGeometry(0.18, 16, 16);
      const vertexMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
      const vertexPoint = new THREE.Mesh(vertexGeom, vertexMat);
      vertexPoint.position.set(-1.5, -0.8, 0);
      group.add(vertexPoint);

      // Faulty comparison mesh: z = x^2 + 5 (without cross term)
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
      // 2. Conic Section Slicer: Double Cone + Slicing Plane
      const coneHeight = 4;
      const coneRadius = 2.5;

      // Top Cone
      const topConeGeom = new THREE.ConeGeometry(coneRadius, coneHeight, 32, 1, true);
      const coneMat = new THREE.MeshStandardMaterial({
        color: 0x3b82f6,
        wireframe,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      });
      const topCone = new THREE.Mesh(topConeGeom, coneMat);
      topCone.position.y = coneHeight / 2;
      group.add(topCone);

      // Bottom Inverted Cone
      const btmConeGeom = new THREE.ConeGeometry(coneRadius, coneHeight, 32, 1, true);
      const btmCone = new THREE.Mesh(btmConeGeom, coneMat);
      btmCone.rotation.x = Math.PI;
      btmCone.position.y = -coneHeight / 2;
      group.add(btmCone);

      // Slicing Plane with dynamic tilt angle (paramB)
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
      // 3. Cylinder Volume Simulation
      const radius = 1 + paramA * 0.8;
      const height = 2 + paramB * 0.05;

      const cylGeom = new THREE.CylinderGeometry(radius, radius, height, 32);
      const cylMat = new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        wireframe,
        transparent: true,
        opacity: 0.7,
        roughness: 0.2,
      });
      const cylMesh = new THREE.Mesh(cylGeom, cylMat);
      group.add(cylMesh);

      // Liquid base fill
      const liquidGeom = new THREE.CylinderGeometry(radius * 0.98, radius * 0.98, height * 0.6, 32);
      const liquidMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        transparent: true,
        opacity: 0.85,
      });
      const liquidMesh = new THREE.Mesh(liquidGeom, liquidMat);
      liquidMesh.position.y = -height * 0.2;
      group.add(liquidMesh);
    } else if (activeModel === "saddle") {
      // 4. Saddle Surface (z = x^2 - y^2)
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
      // 5. CPA Blocks for Elementary (TK / SD)
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
    }
  }, [activeModel, wireframe, showComparison, paramA, paramB]);

  // Setup Three.js Scene, Camera, Renderer, Controls
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(6, 5, 8);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 25;
    controls.minDistance = 2;
    controlsRef.current = controls;

    // 5. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(10, 15, 10);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.6);
    dirLight2.position.set(-10, -5, -10);
    scene.add(dirLight2);

    // 6. Grid & Coordinate Axes
    const gridHelper = new THREE.GridHelper(10, 20, 0x334155, 0x1e293b);
    gridHelper.position.y = -1.5;
    scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(3);
    scene.add(axesHelper);

    // 7. Mesh Group
    const meshGroup = new THREE.Group();
    scene.add(meshGroup);
    meshGroupRef.current = meshGroup;

    // 8. Animation loop
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 9. Resize Observer
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
  }, []);

  // Rebuild mesh when model or params change
  useEffect(() => {
    rebuildMeshes();
  }, [rebuildMeshes]);

  // Adjust background contrast for Projector Mode
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.background = new THREE.Color(isProjectorMode ? 0x0a1120 : 0x020617);
    }
  }, [isProjectorMode]);

  // Reset Camera View
  const handleResetCamera = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(6, 5, 8);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  };

  const selectModel = (model: MathModelType) => {
    setActiveModel(model);
    onModelChange?.(model);
    // Adjust default parameter ranges
    if (model === "conic_slicer") {
      setParamA(1);
      setParamB(30);
    } else if (model === "cylinder") {
      setParamA(1);
      setParamB(20);
    } else {
      setParamA(1);
      setParamB(0);
    }
  };

  return (
    <div
      className={`relative w-full h-full flex flex-col bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 ${className}`}
    >
      {/* Top Overlay Bar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        {/* Model Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl pointer-events-auto shadow-lg overflow-x-auto max-w-[80%]">
          <button
            onClick={() => selectModel("parabola")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              activeModel === "parabola"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Fungsi Kuadrat 3D
          </button>
          <button
            onClick={() => selectModel("conic_slicer")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              activeModel === "conic_slicer"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Irisan Kerucut
          </button>
          <button
            onClick={() => selectModel("cylinder")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              activeModel === "cylinder"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Volume Tabung
          </button>
          <button
            onClick={() => selectModel("saddle")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              activeModel === "saddle"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Pelana (S1/S2)
          </button>
          <button
            onClick={() => selectModel("counting_blocks")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              activeModel === "counting_blocks"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Balok CPA (TK/SD)
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={() => setWireframe(!wireframe)}
            title="Toggle Wireframe"
            className={`p-2 rounded-xl backdrop-blur-md border transition-all ${
              wireframe
                ? "bg-blue-600/30 border-blue-500 text-blue-300"
                : "bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetCamera}
            title="Reset Sudut Kamera"
            className="p-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 text-slate-400 hover:text-slate-200 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* WebGL Canvas Container */}
      <div ref={containerRef} className="w-full flex-1 relative cursor-grab active:cursor-grabbing" />

      {/* Bottom Parameter Sliders & Status Info */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        {/* Dynamic Parameter Sliders */}
        <div className="flex items-center gap-3 p-2 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl pointer-events-auto text-xs text-slate-300 shadow-xl">
          {activeModel === "conic_slicer" && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Tinggi Iris:</span>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.1"
                  value={paramA}
                  onChange={(e) => setParamA(parseFloat(e.target.value))}
                  className="w-20 accent-blue-500 cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Sudut Kemiringan:</span>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={paramB}
                  onChange={(e) => setParamB(parseFloat(e.target.value))}
                  className="w-20 accent-rose-500 cursor-pointer"
                />
                <span className="text-[10px] font-mono text-rose-400">{paramB}°</span>
              </div>
            </>
          )}

          {activeModel === "cylinder" && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Radius (r):</span>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={paramA}
                  onChange={(e) => setParamA(parseFloat(e.target.value))}
                  className="w-20 accent-cyan-500 cursor-pointer"
                />
                <span className="text-[10px] font-mono text-cyan-400">{paramA.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Tinggi (h):</span>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={paramB}
                  onChange={(e) => setParamB(parseFloat(e.target.value))}
                  className="w-20 accent-blue-500 cursor-pointer"
                />
              </div>
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
                <span className="text-[10px] text-amber-400 animate-pulse">
                  🟠 Kuning: x² + 5 (Keliru) vs 🔵 Biru: (x+3)² - 4
                </span>
              )}
            </div>
          )}

          {activeModel === "counting_blocks" && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Jumlah Balok:</span>
              <input
                type="range"
                min="0.2"
                max="2"
                step="0.2"
                value={paramA}
                onChange={(e) => setParamA(parseFloat(e.target.value))}
                className="w-24 accent-emerald-500 cursor-pointer"
              />
              <span className="text-[11px] font-bold text-emerald-400">
                {Math.round(paramA * 5)} Balok
              </span>
            </div>
          )}
        </div>

        {/* Gestures hint */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-lg text-[10px] text-slate-400">
          <span>Putar: 1-Jari / Klik Kiri</span>
          <span>•</span>
          <span>Zoom: Scroll / Cubit</span>
        </div>
      </div>
    </div>
  );
}
