
import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { AppMode } from '../types';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

interface Props {
  mode: AppMode;
  onLoaded: () => void;
  onGestureChange: (mode: AppMode) => void;
  uploadedPhotos: string[];
}

const ChristmasTreeScene: React.FC<Props> = ({ mode, onLoaded, onGestureChange, uploadedPhotos }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    composer: EffectComposer;
    mainGroup: THREE.Group;
    particles: THREE.Mesh[];
    photos: THREE.Group[];
  } | null>(null);

  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const lastModeRef = useRef<AppMode>(mode);

  // Constants
  const TOTAL_PARTICLES = 1500;
  const DUST_PARTICLES = 2500;
  const TREE_HEIGHT = 15;
  const MAX_RADIUS = 8;

  // Sync mode ref
  useEffect(() => {
    lastModeRef.current = mode;
  }, [mode]);

  // Load MediaPipe
  useEffect(() => {
    const initCV = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 160, height: 120 } });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        }
      } catch (e) {
        console.warn("CV Initialization failed, falling back to mouse interaction.", e);
      }
    };
    initCV();
  }, []);

  // Three.js Init
  useEffect(() => {
    if (!containerRef.current) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 2.2;
    containerRef.current.appendChild(renderer.domElement);

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 40);
    camera.lookAt(0, 5, 0);

    // Environment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

    // Post processing
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.45, 0.4, 0.7
    );
    composer.addPass(bloomPass);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const pointLight = new THREE.PointLight(0xffa500, 2, 50);
    pointLight.position.set(0, 10, 0);
    scene.add(pointLight);

    const spot1 = new THREE.SpotLight(0xd4af37, 1200, 100, Math.PI / 4, 0.5);
    spot1.position.set(30, 40, 40);
    scene.add(spot1);

    const spot2 = new THREE.SpotLight(0x1e90ff, 600, 100, Math.PI / 4, 0.5);
    spot2.position.set(-30, 20, -30);
    scene.add(spot2);

    // Main Group
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // Particles Generation
    const particles: THREE.Mesh[] = [];
    const geometries = [
      new THREE.BoxGeometry(0.3, 0.3, 0.3),
      new THREE.SphereGeometry(0.15, 8, 8),
      createCandyCaneGeometry()
    ];
    
    const materials = [
      new THREE.MeshStandardMaterial({ color: 0xd4af37 }), // Gold
      new THREE.MeshStandardMaterial({ color: 0x006400 }), // Dark Green
      new THREE.MeshPhysicalMaterial({ color: 0xd4af37, clearcoat: 1 }), // Reflective Gold
      new THREE.MeshPhysicalMaterial({ color: 0xff0000, clearcoat: 1 }), // Red
      createCandyCaneMaterial()
    ];

    for (let i = 0; i < TOTAL_PARTICLES + DUST_PARTICLES; i++) {
      const isMain = i < TOTAL_PARTICLES;
      const geoIdx = isMain ? Math.floor(Math.random() * geometries.length) : 1;
      const matIdx = isMain ? Math.floor(Math.random() * materials.length) : 1;
      
      const mesh = new THREE.Mesh(geometries[geoIdx], materials[matIdx]);
      mesh.userData.randomSpeed = 0.02 + Math.random() * 0.05;
      mesh.userData.randomOffset = Math.random() * Math.PI * 2;
      mesh.userData.scatterPos = new THREE.Vector3(
          (Math.random() - 0.5) * 40,
          (Math.random() - 0.5) * 40,
          (Math.random() - 0.5) * 40
      );
      
      mesh.position.set(
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 50
      );
      
      mainGroup.add(mesh);
      particles.push(mesh);
    }

    const photos: THREE.Group[] = [];
    sceneRef.current = { scene, camera, renderer, composer, mainGroup, particles, photos };
    
    onLoaded();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    let clock = new THREE.Clock();
    let frameId: number;
    
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Flexible Hand Tracking & Rotation Logic
      if (landmarkerRef.current && videoRef.current && videoRef.current.readyState >= 2) {
        const results = landmarkerRef.current.detectForVideo(videoRef.current, performance.now());
        if (results.landmarks && results.landmarks.length > 0) {
          const landmarks = results.landmarks[0];
          
          // Enhanced responsiveness for mainGroup rotation
          const wrist = landmarks[0];
          // Map wrist position to a wider rotation range for better accessibility
          // Horizontal: 720 degrees (2 full turns), Vertical: 144 degrees
          const targetRY = (wrist.x - 0.5) * Math.PI * 4; 
          const targetRX = (wrist.y - 0.5) * Math.PI * 0.8;
          
          mainGroup.rotation.y += (targetRY - mainGroup.rotation.y) * 0.15;
          mainGroup.rotation.x += (targetRX - mainGroup.rotation.x) * 0.15;

          // Gesture Logic Implementation (Strictly following thresholds)
          const thumbTip = landmarks[4];
          const indexTip = landmarks[8];
          const midTip = landmarks[12];
          const ringTip = landmarks[16];
          const pinkyTip = landmarks[20];
          
          // 1. Pinch Detection (Thumb 4 + Index 8)
          const pinchDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
          
          // 2. Fist / Open Hand Detection (Tips 8,12,16,20 relative to wrist 0)
          const fingerTips = [indexTip, midTip, ringTip, pinkyTip];
          const avgFingerDist = fingerTips.reduce((sum, tip) => sum + Math.hypot(tip.x - wrist.x, tip.y - wrist.y), 0) / 4;

          // Threshold-based mode switching
          if (pinchDist < 0.05) {
             if (lastModeRef.current !== AppMode.FOCUS) onGestureChange(AppMode.FOCUS);
          } else if (avgFingerDist < 0.25) {
             if (lastModeRef.current !== AppMode.TREE) onGestureChange(AppMode.TREE);
          } else if (avgFingerDist > 0.4) {
             if (lastModeRef.current !== AppMode.SCATTER) onGestureChange(AppMode.SCATTER);
          }
        }
      }

      // Update Particles
      particles.forEach((p, i) => {
        const target = new THREE.Vector3();
        const mode = lastModeRef.current;

        if (mode === AppMode.TREE) {
          if (i < TOTAL_PARTICLES) {
            const t = i / TOTAL_PARTICLES;
            const radius = MAX_RADIUS * (1 - t);
            const angle = t * 50 * Math.PI + time * 0.2;
            const y = t * TREE_HEIGHT;
            target.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
          } else {
            const t = (i - TOTAL_PARTICLES) / DUST_PARTICLES;
            target.copy(p.userData.scatterPos).multiplyScalar(1.5);
            target.y += Math.sin(time + p.userData.randomOffset) * 2;
          }
        } else if (mode === AppMode.SCATTER) {
          target.copy(p.userData.scatterPos);
          target.applyAxisAngle(new THREE.Vector3(0, 1, 0), time * 0.1);
        } else if (mode === AppMode.FOCUS) {
          const t = i / (TOTAL_PARTICLES + DUST_PARTICLES);
          const radius = 25 + Math.sin(time + t * 10) * 5;
          const angle = t * Math.PI * 2 + time * 0.5;
          target.set(Math.cos(angle) * radius, Math.sin(time * 0.3 + t * 5) * 10, Math.sin(angle) * radius);
        }

        p.position.lerp(target, 0.05);
        p.rotation.x += p.userData.randomSpeed;
        p.rotation.y += p.userData.randomSpeed;
      });

      // Update Photos Animation & Orientation
      photos.forEach((photoGroup, idx) => {
        const mode = lastModeRef.current;
        const isLatest = idx === photos.length - 1;

        if (mode === AppMode.FOCUS && isLatest) { 
          // Move focused photo to a central "inspection" position
          // Using a local offset that remains relative to mainGroup's orientation if needed,
          // but here we target a specific world-viewable spot
          photoGroup.position.lerp(new THREE.Vector3(0, 5, 28), 0.1);
          photoGroup.scale.lerp(new THREE.Vector3(5, 5, 5), 0.1);
          photoGroup.rotation.y = Math.sin(time * 0.5) * 0.1;
        } else {
          // Standard Orbiting
          const count = photos.length;
          const t = idx / Math.max(count, 1);
          const orbitRadius = mode === AppMode.FOCUS ? 20 : 12;
          // Slow down orbit in FOCUS mode to let user appreciate details
          const orbitSpeed = mode === AppMode.FOCUS ? 0.05 : 0.15;
          const angle = t * Math.PI * 2 + time * orbitSpeed;
          
          const orbitPos = new THREE.Vector3(Math.cos(angle) * orbitRadius, 5 + Math.sin(time + idx) * 2, Math.sin(angle) * orbitRadius);
          photoGroup.position.lerp(orbitPos, 0.05);
          photoGroup.scale.lerp(new THREE.Vector3(1.2, 1.2, 1.2), 0.05);
          
          // CRITICAL: Make all photos face the CAMERA directly for better appreciation
          photoGroup.lookAt(camera.position);
        }
      });

      composer.render();
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (containerRef.current) containerRef.current.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    if (uploadedPhotos.length > 0 && sceneRef.current) {
      const currentPhotoCount = sceneRef.current.photos.length;
      if (uploadedPhotos.length > currentPhotoCount) {
        const newPhotoUrl = uploadedPhotos[uploadedPhotos.length - 1];
        new THREE.TextureLoader().load(newPhotoUrl, (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          addPhoto(sceneRef.current!.scene, sceneRef.current!.photos, sceneRef.current!.mainGroup, tex);
        });
      }
    }
  }, [uploadedPhotos]);

  function createCandyCaneGeometry() {
    const points = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.5, 1, 0),
      new THREE.Vector3(1, 1.5, 0),
      new THREE.Vector3(1.5, 1.2, 0),
      new THREE.Vector3(1.7, 0.8, 0),
    ];
    const path = new THREE.CatmullRomCurve3(points);
    return new THREE.TubeGeometry(path, 32, 0.1, 8, false);
  }

  function createCandyCaneMaterial() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 64, 64);
    ctx.strokeStyle = '#f00';
    ctx.lineWidth = 8;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 8, 0);
      ctx.lineTo(i * 8 + 8, 64);
      ctx.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 1);
    return new THREE.MeshStandardMaterial({ map: texture });
  }

  function addPhoto(scene: THREE.Scene, photosArr: THREE.Group[], parent: THREE.Group, texture: THREE.Texture) {
    const group = new THREE.Group();
    // Fix: Cast texture.image to any to resolve 'unknown' property access errors for width and height
    const img = texture.image as any;
    const aspect = img ? (img.width / img.height) : 1;
    const w = 4;
    const h = w / aspect;

    const frameGeo = new THREE.BoxGeometry(w + 0.4, h + 0.4, 0.1);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.2 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    group.add(frame);

    const photoGeo = new THREE.PlaneGeometry(w, h);
    const photoMat = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
    const photo = new THREE.Mesh(photoGeo, photoMat);
    photo.position.z = 0.06;
    group.add(photo);

    group.position.set(0, 0, 0);
    parent.add(group);
    photosArr.push(group);
  }

  return (
    <div className="w-full h-full relative">
        <div ref={containerRef} className="w-full h-full" />
        <video 
            ref={videoRef} 
            className="absolute bottom-2 right-2 w-40 h-30 rounded-lg border border-gold-500 opacity-0 pointer-events-none" 
            autoPlay 
            muted 
        />
    </div>
  );
};

export default ChristmasTreeScene;
