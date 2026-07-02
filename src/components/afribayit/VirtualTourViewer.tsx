'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';
import type * as THREE from 'three';
import type { OrbitControls as OrbitControlsType } from 'three/examples/jsm/controls/OrbitControls.js';

// Types for virtual tour data
export interface VirtualTourData {
  id: string;
  tourType: string; // matterport, 360_photo, drone, video
  url: string;
  thumbnailUrl?: string | null;
  duration?: number | null;
}

export interface VirtualTourViewerProps {
  tours: VirtualTourData[];
  propertyId: string;
  hasVR?: boolean;
  onClose?: () => void;
}

// Demo panoramic scenes — always used as fallback when tours array is empty
const DEMO_SCENES = [
  {
    id: 'demo-salon',
    label: 'Salon / Séjour',
    url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=4096&h=2048&fit=crop',
    hotspots: [
      { x: -25, y: -5, z: -45, targetScene: 'demo-cuisine', label: 'Cuisine →' },
      { x: 45, y: -5, z: -15, targetScene: 'demo-chambre', label: 'Chambre →' },
      { x: -35, y: -5, z: 35, targetScene: 'demo-jardin', label: 'Jardin →' },
    ],
  },
  {
    id: 'demo-cuisine',
    label: 'Cuisine',
    url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=4096&h=2048&fit=crop',
    hotspots: [
      { x: 25, y: -5, z: 45, targetScene: 'demo-salon', label: '← Salon' },
      { x: 45, y: -5, z: -15, targetScene: 'demo-chambre', label: 'Chambre →' },
    ],
  },
  {
    id: 'demo-chambre',
    label: 'Chambre Principale',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=4096&h=2048&fit=crop',
    hotspots: [
      { x: -45, y: -5, z: 15, targetScene: 'demo-salon', label: '← Salon' },
      { x: -35, y: -5, z: -35, targetScene: 'demo-salle-de-bain', label: 'Salle de bain →' },
    ],
  },
  {
    id: 'demo-salle-de-bain',
    label: 'Salle de bain',
    url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=4096&h=2048&fit=crop',
    hotspots: [
      { x: 35, y: -5, z: 35, targetScene: 'demo-chambre', label: '← Chambre' },
    ],
  },
  {
    id: 'demo-jardin',
    label: 'Jardin / Vue drone',
    url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=4096&h=2048&fit=crop',
    hotspots: [
      { x: 35, y: -5, z: -35, targetScene: 'demo-salon', label: '← Salon' },
    ],
  },
];

function getTourTypeLabel(type: string, index: number): string {
  const labels: Record<string, string> = {
    matterport: 'Scan Matterport',
    '360_photo': 'Photo 360°',
    drone: 'Vue drone',
    video: 'Vidéo',
  };
  return labels[type] || `Pièce ${index + 1}`;
}

// Refs for accessing Three.js objects outside the init effect
interface ThreeRefs {
  scene: THREE.Scene | null;
  camera: THREE.PerspectiveCamera | null;
  renderer: THREE.WebGLRenderer | null;
  controls: OrbitControlsType | null;
  sphere: THREE.Mesh | null;
  hotspotMeshes: THREE.Mesh[];
  ringMeshes: THREE.Mesh[];
}

export default function VirtualTourViewer({ tours, propertyId: _propertyId, hasVR: _hasVR, onClose }: VirtualTourViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const threeRefs = useRef<ThreeRefs>({
    scene: null, camera: null, renderer: null, controls: null, sphere: null, hotspotMeshes: [], ringMeshes: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [vrSupported, setVrSupported] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const [showSceneList, setShowSceneList] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [tooltip, setTooltip] = useState<{ label: string; x: number; y: number } | null>(null);

  // Stable refs for imperative access (avoid stale closures in callbacks)
  const transitioningRef = useRef(false);
  const currentSceneIndexRef = useRef(0);
  const sceneSwitchRef = useRef<((targetId: string) => void) | null>(null);
  const loadSceneRef = useRef<((index: number) => Promise<void>) | null>(null);

  // Build scenes from tour data, or fallback to DEMO_SCENES when tours is empty
  const scenes = useMemo(() => {
    if (tours.length === 0) {
      return DEMO_SCENES.map(s => ({
        id: s.id,
        label: s.label,
        url: s.url,
        hotspots: s.hotspots.map(h => ({ ...h })),
      }));
    }
    return tours.map((t, i) => ({
      id: t.id,
      label: getTourTypeLabel(t.tourType, i),
      url: t.url,
      hotspots: i < DEMO_SCENES.length
        ? DEMO_SCENES[i].hotspots.map(h => ({ ...h }))
        : [],
    }));
  }, [tours]);

  // Stable key that only changes when scene data actually changes (content-based)
  const scenesKey = useMemo(() => {
    if (tours.length === 0) return 'demo';
    return tours.map(t => `${t.id}::${t.url}::${t.tourType}`).join('||');
  }, [tours]);

  // Keep scenes in a ref so effects can access latest version without stale closures
  const scenesRef = useRef(scenes);
  scenesRef.current = scenes;

  const currentScene = scenes[currentSceneIndex];

  // ─── Scene switching with smooth transition ────────────────────────────
  // Clicking a hotspot or thumbnail calls this:
  //   1. Set transitioning=true → black overlay fades in
  //   2. Wait 400ms (overlay fully opaque)
  //   3. Switch to new scene index + load panorama
  //   4. Wait 200ms
  //   5. Set transitioning=false → black overlay fades out
  const switchToScene = useCallback((index: number) => {
    if (transitioningRef.current) return;
    if (index < 0 || index >= scenesRef.current.length) return;
    if (index === currentSceneIndexRef.current) return;

    transitioningRef.current = true;
    setTransitioning(true);

    setTimeout(() => {
      currentSceneIndexRef.current = index;
      setCurrentSceneIndex(index);
      loadSceneRef.current?.(index);

      setTimeout(() => {
        transitioningRef.current = false;
        setTransitioning(false);
      }, 200);
    }, 400);
  }, []);

  // Handle hotspot click → find scene index and switch
  const handleSceneSwitch = useCallback((targetId: string) => {
    const index = scenesRef.current.findIndex(s => s.id === targetId);
    if (index >= 0) switchToScene(index);
  }, [switchToScene]);

  // Keep sceneSwitchRef in sync
  useEffect(() => {
    sceneSwitchRef.current = handleSceneSwitch;
  }, [handleSceneSwitch]);

  // ─── Three.js initialization — reinitializes when scenes data changes ──
  useEffect(() => {
    if (!containerRef.current) return;
    let disposed = false;
    const container = containerRef.current;
    let animationFrameId: number | null = null;

    const currentScenes = scenesRef.current;

    const initScene = async () => {
      try {
        const THREE = await import('three');
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
        if (disposed || !containerRef.current) return;

        const width = container.clientWidth;
        const height = container.clientHeight;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.set(0, 0, 0.1);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        container.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableZoom = true;
        controls.enablePan = false;
        controls.rotateSpeed = -0.3;
        controls.zoomSpeed = 0.8;
        controls.minDistance = 0.1;
        controls.maxDistance = 0.1;
        controls.enableDamping = true;
        controls.dampingFactor = 0.1;
        controls.target.set(0, 0, 0);

        // Store refs
        threeRefs.current = {
          scene, camera, renderer, controls,
          sphere: null, hotspotMeshes: [], ringMeshes: [],
        };

        // WebXR check
        if ('xr' in navigator) {
          try {
            const ok = await (navigator as unknown as { xr: { isSessionSupported: (m: string) => Promise<boolean> } }).xr.isSessionSupported('immersive-vr');
            if (!disposed) setVrSupported(ok);
          } catch { /* no VR */ }
        }

        // Animation loop
        function animate() {
          if (disposed) return;
          animationFrameId = requestAnimationFrame(animate);
          controls.update();
          // Pulse hotspots
          const t = Date.now() * 0.003;
          threeRefs.current.hotspotMeshes.forEach((m, i) => {
            const s = 1 + Math.sin(t + i * 1.5) * 0.15;
            m.scale.set(s, s, s);
          });
          renderer.render(scene, camera);
        }
        animate();

        // Load first panorama
        setIsLoading(true);
        setLoadingProgress(0);
        const firstScene = currentScenes[0];
        if (firstScene) {
          await loadPanorama(firstScene.url);
          addHotspots(firstScene.hotspots);
        }

        // Reset scene index
        currentSceneIndexRef.current = 0;
        setCurrentSceneIndex(0);

        if (!disposed) setIsLoading(false);
      } catch (err) {
        console.error('Three.js init error:', err);
        if (!disposed) {
          setError('Impossible d\'initialiser le lecteur 3D. Vérifiez que WebGL est supporté.');
          setIsLoading(false);
        }
      }
    };

    // Load panorama texture onto the sphere
    async function loadPanorama(url: string): Promise<void> {
      const THREE = await import('three');
      if (disposed) return;

      return new Promise((resolve) => {
        const loader = new THREE.TextureLoader();
        loader.load(
          url,
          (texture) => {
            if (disposed) { resolve(); return; }
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;

            const refs = threeRefs.current;
            // Remove old sphere
            if (refs.sphere) {
              refs.scene?.remove(refs.sphere);
              (refs.sphere.material as THREE.MeshBasicMaterial).dispose();
              (refs.sphere.geometry as THREE.SphereGeometry).dispose();
            }

            // Inverted sphere for panoramic view
            const geometry = new THREE.SphereGeometry(50, 64, 32);
            geometry.scale(-1, 1, 1);
            const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.FrontSide });
            const mesh = new THREE.Mesh(geometry, material);
            refs.scene?.add(mesh);
            refs.sphere = mesh;

            setLoadingProgress(100);
            resolve();
          },
          (progress) => {
            if (progress.total > 0) setLoadingProgress(Math.round((progress.loaded / progress.total) * 100));
          },
          () => {
            if (!disposed) { setError('Erreur de chargement de l\'image panoramique.'); setIsLoading(false); }
            resolve();
          },
        );
      });
    }

    // Add hotspot markers with clickable geometry
    async function addHotspots(hotspots: readonly { x: number; y: number; z: number; targetScene: string; label: string }[]) {
      const THREE = await import('three');
      if (disposed) return;

      const refs = threeRefs.current;
      // Remove existing hotspots
      [...refs.hotspotMeshes, ...refs.ringMeshes].forEach((m) => {
        refs.scene?.remove(m);
        (m.geometry as THREE.BufferGeometry).dispose();
        (m.material as THREE.Material).dispose();
      });
      refs.hotspotMeshes = [];
      refs.ringMeshes = [];

      for (const hs of hotspots) {
        // Visible golden sphere marker (larger for easier clicking)
        const g = new THREE.SphereGeometry(2.0, 16, 16);
        const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#D4AF37'), transparent: true, opacity: 0.85 });
        const mesh = new THREE.Mesh(g, mat);
        mesh.position.set(hs.x, hs.y, hs.z);
        mesh.userData = { type: 'hotspot', targetScene: hs.targetScene, label: hs.label };
        refs.scene?.add(mesh);
        refs.hotspotMeshes.push(mesh);

        // Glow ring
        const rg = new THREE.RingGeometry(2.8, 3.8, 32);
        const rm = new THREE.MeshBasicMaterial({ color: new THREE.Color('#D4AF37'), transparent: true, opacity: 0.35, side: THREE.DoubleSide });
        const ring = new THREE.Mesh(rg, rm);
        ring.position.copy(mesh.position);
        ring.lookAt(0, 0, 0);
        refs.scene?.add(ring);
        refs.ringMeshes.push(ring);
      }
    }

    // Expose imperative scene loading function for switchToScene
    loadSceneRef.current = async (sceneIndex: number) => {
      const sc = currentScenes[sceneIndex];
      if (!sc) return;
      setIsLoading(true);
      setLoadingProgress(0);
      await loadPanorama(sc.url);
      if (!disposed) await addHotspots(sc.hotspots);
      if (!disposed) setIsLoading(false);
    };

    // ─── Click handler for hotspots ──────────────────────────────────────
    const handleClick = async (event: MouseEvent | Touch) => {
      if (transitioningRef.current) return;
      const THREE = await import('three');
      const refs = threeRefs.current;
      if (!refs.camera || !refs.scene) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, refs.camera);
      const intersects = raycaster.intersectObjects(refs.hotspotMeshes);
      if (intersects.length > 0 && intersects[0].object.userData?.targetScene) {
        sceneSwitchRef.current?.(intersects[0].object.userData.targetScene);
      }
    };

    // ─── Mousemove handler for hotspot hover tooltip ─────────────────────
    const handleMouseMove = async (event: MouseEvent) => {
      const THREE = await import('three');
      const refs = threeRefs.current;
      if (!refs.camera || !refs.scene) {
        setTooltip(null);
        return;
      }

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) {
        setTooltip(null);
        return;
      }

      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, refs.camera);
      const intersects = raycaster.intersectObjects(refs.hotspotMeshes);

      if (intersects.length > 0 && intersects[0].object.userData?.label) {
        setTooltip({
          label: intersects[0].object.userData.label,
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        });
        if (containerRef.current) containerRef.current.style.cursor = 'pointer';
      } else {
        setTooltip(null);
        if (containerRef.current) containerRef.current.style.cursor = 'grab';
      }
    };

    const onMouse = (e: MouseEvent) => handleClick(e);
    const onTouch = (e: TouchEvent) => { if (e.changedTouches.length > 0) handleClick(e.changedTouches[0]); };
    const onMouseMove = (e: MouseEvent) => handleMouseMove(e);
    const onResize = () => {
      const refs = threeRefs.current;
      if (!containerRef.current || !refs.renderer || !refs.camera) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      refs.camera.aspect = w / h;
      refs.camera.updateProjectionMatrix();
      refs.renderer.setSize(w, h);
    };
    const onFSChange = () => setIsFullscreen(!!document.fullscreenElement);

    initScene();
    container.addEventListener('click', onMouse);
    container.addEventListener('touchend', onTouch);
    container.addEventListener('mousemove', onMouseMove);
    window.addEventListener('resize', onResize);
    document.addEventListener('fullscreenchange', onFSChange);

    return () => {
      disposed = true;
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
      const refs = threeRefs.current;
      [...refs.hotspotMeshes, ...refs.ringMeshes].forEach((m) => {
        refs.scene?.remove(m);
        (m.geometry as import('three').BufferGeometry).dispose();
        (m.material as import('three').Material).dispose();
      });
      if (refs.sphere) {
        refs.scene?.remove(refs.sphere);
        (refs.sphere.material as import('three').MeshBasicMaterial).dispose();
        (refs.sphere.geometry as import('three').SphereGeometry).dispose();
      }
      refs.controls?.dispose();
      refs.renderer?.dispose();
      if (refs.renderer?.domElement && container.contains(refs.renderer.domElement)) {
        container.removeChild(refs.renderer.domElement);
      }
      container.removeEventListener('click', onMouse);
      container.removeEventListener('touchend', onTouch);
      container.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('fullscreenchange', onFSChange);

      // Clear refs
      threeRefs.current = {
        scene: null, camera: null, renderer: null, controls: null,
        sphere: null, hotspotMeshes: [], ringMeshes: [],
      };
      loadSceneRef.current = null;
    };
  }, [scenesKey]); // Re-initialize when scene data changes

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) containerRef.current.requestFullscreen?.();
    else document.exitFullscreen?.();
  }, []);

  // VR mode toggle
  const toggleVR = useCallback(async () => {
    if (!('xr' in navigator)) return;
    try {
      if (!document.fullscreenElement && containerRef.current) await containerRef.current.requestFullscreen();
      const xr = (navigator as unknown as { xr: { requestSession: (m: string) => Promise<XRSession> } }).xr;
      await xr.requestSession('immersive-vr');
    } catch (err) { console.error('VR error:', err); }
  }, []);

  return (
    <div className="relative w-full h-full bg-black rounded-xl overflow-hidden">
      {/* Three.js Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-full min-h-[400px] cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
      />

      {/* ─── Transition Overlay (fade to black between scenes) ──────── */}
      <AnimatePresence>
        {transitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-black z-30 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* ─── Hotspot Tooltip (CSS overlay, not 3D text) ─────────────── */}
      <AnimatePresence>
        {tooltip && !transitioning && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-10 pointer-events-none"
            style={{
              left: tooltip.x,
              top: tooltip.y - 40,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="px-3 py-1.5 bg-black/80 backdrop-blur-md rounded-lg border border-[#D4AF37]/40 whitespace-nowrap shadow-lg">
              <span className="text-[#D4AF37] text-xs font-semibold">{tooltip.label}</span>
            </div>
            <div className="flex justify-center -mt-px">
              <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-black/80" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Loading Overlay ────────────────────────────────────────── */}
      <AnimatePresence>
        {isLoading && !transitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10 backdrop-blur-sm"
          >
            <div className="w-20 h-20 rounded-full border-4 border-[#D4AF37]/30 flex items-center justify-center mb-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-12 h-12 rounded-full border-4 border-transparent border-t-[#D4AF37] border-r-[#D4AF37]"
              />
            </div>
            <p className="text-white/80 text-sm font-medium mb-2">Chargement de la visite...</p>
            {loadingProgress > 0 && (
              <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${loadingProgress}%` }}
                  className="h-full bg-[#D4AF37] rounded-full"
                  transition={{ duration: 0.3 }}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Error Overlay ──────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10"
          >
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <p className="text-white/80 text-sm text-center max-w-xs">{error}</p>
            <button
              onClick={() => { setError(null); window.location.reload(); }}
              className="mt-4 px-4 py-2 bg-[#D4AF37] text-white text-sm font-medium rounded-full hover:bg-[#b8961f] transition-colors"
            >
              Réessayer
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Top Controls ───────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between z-20 pointer-events-none">
        <div className="pointer-events-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-full">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
            <span className="text-white text-xs font-medium">{currentScene?.label || 'Chargement'}</span>
            <span className="text-white/50 text-[10px]">360°</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Scene List */}
          <button onClick={() => setShowSceneList(!showSceneList)} className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white hover:bg-black/70 transition-colors" aria-label="Liste des pièces">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
          </button>
          {/* Minimap */}
          <button onClick={() => setShowMinimap(!showMinimap)} className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white hover:bg-black/70 transition-colors" aria-label="Plan">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" /></svg>
          </button>
          {/* VR */}
          {vrSupported && (
            <button onClick={toggleVR} className="w-9 h-9 rounded-full bg-[#003087]/70 backdrop-blur-md flex items-center justify-center text-white hover:bg-[#003087] transition-colors" aria-label="Mode VR">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
          )}
          {/* Fullscreen */}
          <button onClick={toggleFullscreen} className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white hover:bg-black/70 transition-colors" aria-label={isFullscreen ? 'Quitter plein écran' : 'Plein écran'}>
            {isFullscreen ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>
            )}
          </button>
          {/* Close */}
          {onClose && (
            <button onClick={onClose} className="w-9 h-9 rounded-full bg-red-500/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-red-500/70 transition-colors" aria-label="Fermer">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
      </div>

      {/* ─── Bottom Scene Thumbnails ────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
        <div className="p-3">
          <div className="flex items-center justify-center mb-2">
            <span className="text-white/40 text-[10px]">Glissez pour tourner • Cliquez les points dorés pour changer de pièce</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pointer-events-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(212,175,55,0.3) transparent' }}>
            {scenes.map((scene, i) => (
              <button
                key={scene.id}
                onClick={() => switchToScene(i)}
                className={`shrink-0 relative rounded-lg overflow-hidden transition-all duration-200 ${
                  i === currentSceneIndex ? 'ring-2 ring-[#D4AF37] ring-offset-1 ring-offset-black scale-105' : 'opacity-60 hover:opacity-90'
                }`}
                aria-label={`Voir ${scene.label}`}
              >
                <div className="w-20 h-14 sm:w-24 sm:h-16 bg-gray-800">
                  {scene.url && <ImageWithFallback src={scene.url} alt={scene.label} className="w-full h-full" fallbackType="generic" />}
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-1.5 py-0.5">
                  <span className="text-[9px] sm:text-[10px] text-white font-medium truncate block">{scene.label}</span>
                </div>
                {i === currentSceneIndex && <div className="absolute top-1 left-1"><span className="w-2 h-2 rounded-full bg-[#D4AF37] block" /></div>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Scene List Panel ───────────────────────────────────────── */}
      <AnimatePresence>
        {showSceneList && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="absolute top-14 right-3 z-30 w-52 bg-black/80 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden">
            <div className="p-3 border-b border-white/10"><h3 className="text-white text-xs font-semibold">Pièces</h3></div>
            <div className="max-h-64 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}>
              {scenes.map((scene, i) => (
                <button key={scene.id} onClick={() => { switchToScene(i); setShowSceneList(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${i === currentSceneIndex ? 'bg-[#D4AF37]/20' : 'hover:bg-white/5'}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${i === currentSceneIndex ? 'bg-[#D4AF37] text-white' : 'bg-white/10 text-white/60'}`}>{i + 1}</span>
                  <span className={`text-xs ${i === currentSceneIndex ? 'text-[#D4AF37] font-semibold' : 'text-white/70'}`}>{scene.label}</span>
                  {scene.id.includes('drone') && <span className="ml-auto text-[8px] px-1.5 py-0.5 bg-[#009CDE]/20 text-[#009CDE] rounded-full">DRONE</span>}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Minimap ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showMinimap && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-28 left-3 z-30">
            <div className="bg-black/80 backdrop-blur-xl rounded-xl border border-white/10 p-3 w-40">
              <h4 className="text-white/50 text-[9px] font-medium mb-2 uppercase tracking-wider">Plan</h4>
              <div className="relative w-full aspect-square">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <rect x="10" y="10" width="80" height="80" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" rx="2" />
                  <line x1="50" y1="10" x2="50" y2="55" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                  <line x1="10" y1="55" x2="70" y2="55" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                  {scenes.map((scene, i) => {
                    const positions = [
                      { x: 12, y: 12, w: 36, h: 41 },
                      { x: 52, y: 12, w: 36, h: 41 },
                      { x: 12, y: 57, w: 36, h: 31 },
                      { x: 52, y: 57, w: 36, h: 31 },
                      { x: 52, y: 57, w: 36, h: 31 },
                    ];
                    const p = positions[i % positions.length];
                    if (!p) return null;
                    const active = i === currentSceneIndex;
                    return (
                      <g key={scene.id}>
                        <rect x={p.x} y={p.y} width={p.w} height={p.h} fill={active ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.05)'} stroke={active ? '#D4AF37' : 'rgba(255,255,255,0.1)'} strokeWidth={active ? 1.5 : 0.5} rx="1" />
                        <text x={p.x + p.w / 2} y={p.y + p.h / 2 + 3} textAnchor="middle" fill={active ? '#D4AF37' : 'rgba(255,255,255,0.4)'} fontSize="5" fontWeight={active ? 'bold' : 'normal'}>{scene.label}</text>
                      </g>
                    );
                  })}
                  {(() => {
                    const pos = [
                      { x: 30, y: 32 },
                      { x: 70, y: 32 },
                      { x: 30, y: 72 },
                      { x: 70, y: 72 },
                      { x: 70, y: 72 },
                    ][currentSceneIndex % 5];
                    return pos ? <circle cx={pos.x} cy={pos.y} r="3" fill="#D4AF37"><animate attributeName="r" values="2;4;2" dur="2s" repeatCount="indefinite" /><animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" /></circle> : null;
                  })()}
                </svg>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── VR Badge ───────────────────────────────────────────────── */}
      <div className="absolute top-14 left-3 z-20">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#003087]/70 backdrop-blur-md rounded-full">
          <svg className="w-3.5 h-3.5 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <span className="text-[10px] text-white font-semibold">Visite VR disponible</span>
        </div>
      </div>
    </div>
  );
}
