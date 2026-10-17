/**
 * Interactive 3D WebGL Scene Container for the USS Enterprise NCC-1701
 * Features:
 * - Free 360-degree unconstrained OrbitControls
 * - Cinematic lighting rig: strong nearby star key light + cool blue rim light
 * - UnrealBloomPass post-processing for soft cinematic optical glow
 * - 3D Tactical Sensor Waypoints matching reference image
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {
  createKelvinEnterprise,
  createDynamicStarfield,
  EnterpriseController,
  AlertMode,
  HullFinish,
} from '../models/enterpriseModel';

export type CameraPreset =
  | 'beauty'
  | 'bridge'
  | 'deflector'
  | 'engines'
  | 'flyby'
  | 'tactical'
  | 'dorsal'
  | 'elevation'
  | 'bow'
  | 'stern'
  | 'registry';

export interface SceneHandle {
  setCameraPreset: (preset: CameraPreset) => void;
  focusSubsystem: (subsystem: string) => void;
  setAlertMode: (mode: AlertMode) => void;
  setSpeedMode: (speed: 'sublight' | 'impulse' | 'warp') => void;
  setHullFinish: (finish: HullFinish) => void;
  setExploded: (factor: number) => void;
  setAutoRotate: (enabled: boolean) => void;
  setAutoRotateSpeed: (speed: number) => void;
  setBloomEnabled: (enabled: boolean) => void;
  setExposure: (val: number) => void;
  setLightIntensity: (val: number) => void;
  setAmbientFill: (val: number) => void;
  fireTorpedo: () => void;
  firePhaser: () => void;
  takeScreenshot: () => string | null;
}

export interface WaypointTag {
  id: string;
  label: string;
  distance: string;
  pos: THREE.Vector3;
}

interface EnterpriseSceneProps {
  onSceneReady?: (handle: SceneHandle) => void;
  alertMode: AlertMode;
  speedMode: 'sublight' | 'impulse' | 'warp';
  hullFinish: HullFinish;
  explodedProgress: number;
  autoRotate: boolean;
  autoRotateSpeed: number;
  bloomEnabled?: boolean;
  showWaypoints?: boolean;
  exposure?: number;
  lightIntensity?: number;
  ambientFill?: number;
}

interface ActiveProjectile {
  mesh: THREE.Object3D;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  type: 'torpedo' | 'phaser';
}

export const EnterpriseScene: React.FC<EnterpriseSceneProps> = ({
  onSceneReady,
  alertMode,
  speedMode,
  hullFinish,
  explodedProgress,
  autoRotate,
  autoRotateSpeed,
  bloomEnabled = true,
  showWaypoints = true,
  exposure = 0.85,
  lightIntensity = 0.85,
  ambientFill = 0.15,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<EnterpriseController | null>(null);
  const starfieldRef = useRef<ReturnType<typeof createDynamicStarfield> | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const bloomEnabledRef = useRef<boolean>(bloomEnabled);
  const keyStarRef = useRef<THREE.DirectionalLight | null>(null);
  const rimLightRef = useRef<THREE.DirectionalLight | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);

  // 3D Tactical Sensor Waypoints matching reference image
  const waypoints = useRef<WaypointTag[]>([
    {
      id: 'klingon',
      label: 'Klingon Homeworld',
      distance: '260M km',
      pos: new THREE.Vector3(-1.8, 3.8, 4.2),
    },
    {
      id: 'starbase',
      label: 'Starbase 11',
      distance: '4.2 AU',
      pos: new THREE.Vector3(14.0, 7.5, -9.0),
    },
    {
      id: 'vulcan',
      label: 'Vulcan',
      distance: '16.5 ly',
      pos: new THREE.Vector3(-16.0, -4.5, 12.0),
    },
  ]);
  const waypointRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Free camera vs Preset animation tracking
  const isTransitioningCamera = useRef<boolean>(false);
  const targetCamPos = useRef(new THREE.Vector3(16, 5.0, 18));
  const targetLookAt = useRef(new THREE.Vector3(0, 0.4, 0));
  const projectiles = useRef<ActiveProjectile[]>([]);

  // Projectile materials & geometries
  const torpedoGeo = useRef(new THREE.SphereGeometry(0.28, 16, 16));
  const torpedoMat = useRef(
    new THREE.MeshStandardMaterial({
      color: 0xff3300,
      emissive: new THREE.Color(0xff4400),
      emissiveIntensity: 6.0,
      roughness: 0.1,
    })
  );

  const phaserMat = useRef(
    new THREE.LineBasicMaterial({
      color: 0xffaa22,
      linewidth: 3,
    })
  );

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene & Renderer Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020306);
    scene.fog = new THREE.FogExp2(0x020306, 0.0016);
    sceneRef.current = scene;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 4000);
    camera.position.copy(targetCamPos.current);
    camera.lookAt(targetLookAt.current);
    cameraRef.current = camera;

    const isHeadless =
      typeof navigator !== 'undefined' &&
      (Boolean(navigator.webdriver) || /HeadlessChrome/i.test(navigator.userAgent));

    const renderer = new THREE.WebGLRenderer({
      antialias: !isHeadless,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = exposure;
    renderer.debug.checkShaderErrors = false;
    renderer.shadowMap.enabled = !isHeadless;
    if (renderer.shadowMap.enabled) {
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // 2. RoomEnvironment for Subtle Metallic Reflections (calibrated low so it never floods the ship)
    try {
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      const roomEnv = new RoomEnvironment();
      scene.environment = pmremGenerator.fromScene(roomEnv, 0.04).texture;
      if ('environmentIntensity' in scene) {
        (scene as any).environmentIntensity = 0.06;
      }
      pmremGenerator.dispose();
      roomEnv.dispose();
    } catch {
      // Fallback
    }

    // 3. Balanced Cinematic Star Lighting Rig (calibrated for deep space contrast)
    // Key Star Directional Light (crisp, high-contrast illumination)
    const keyStar = new THREE.DirectionalLight(0xfffbf2, lightIntensity);
    keyStar.position.set(38, 44, 28);
    keyStar.castShadow = !isHeadless;
    keyStar.shadow.mapSize.width = 2048;
    keyStar.shadow.mapSize.height = 2048;
    keyStar.shadow.bias = -0.0004;
    keyStar.shadow.normalBias = 0.02;
    keyStarRef.current = keyStar;
    scene.add(keyStar);

    // Cool Blue Rim Light for crisp edge definition against deep space
    const rimBlue = new THREE.DirectionalLight(0x4488ff, ambientFill * 2.2);
    rimBlue.position.set(-42, 18, -32);
    rimLightRef.current = rimBlue;
    scene.add(rimBlue);

    // Subtle Deep-Space Fill
    const hemiLight = new THREE.HemisphereLight(0x182436, 0x020406, ambientFill);
    hemiLightRef.current = hemiLight;
    scene.add(hemiLight);

    const underWarm = new THREE.DirectionalLight(0xff8833, 0.08);
    underWarm.position.set(0, -32, 12);
    scene.add(underWarm);

    // 4. UnrealBloomPass Post-Processing Pipeline
    // threshold: 1.08 ensures ONLY high-emissive engines/grilles/dish bloom, NEVER the metallic hull!
    let composer: EffectComposer | null = null;
    try {
      composer = new EffectComposer(renderer);
      const renderPass = new RenderPass(scene, camera);
      composer.addPass(renderPass);

      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(width, height),
        0.36, // strength: subtle optical glow
        0.3,  // radius
        1.08  // threshold: > 1.0 prevents hull from blooming white
      );
      composer.addPass(bloomPass);
      composerRef.current = composer;
    } catch {
      composerRef.current = null;
    }

    // 5. Starfield & Dynamic Warp Streaks
    const starfield = createDynamicStarfield(8000);
    scene.add(starfield.points);
    scene.add(starfield.lines);
    starfieldRef.current = starfield;

    // Cosmic Dust Cloud / Distant Nebula
    const nebulaGeo = new THREE.BufferGeometry();
    const nebulaCount = 500;
    const nebPos = new Float32Array(nebulaCount * 3);
    const nebCol = new Float32Array(nebulaCount * 3);
    for (let i = 0; i < nebulaCount; i++) {
      nebPos[i * 3] = (Math.random() - 0.5) * 900;
      nebPos[i * 3 + 1] = (Math.random() - 0.5) * 450;
      nebPos[i * 3 + 2] = (Math.random() - 0.5) * 900;
      nebCol[i * 3] = 0.16 + Math.random() * 0.28;
      nebCol[i * 3 + 1] = 0.22 + Math.random() * 0.32;
      nebCol[i * 3 + 2] = 0.55 + Math.random() * 0.42;
    }
    nebulaGeo.setAttribute('position', new THREE.BufferAttribute(nebPos, 3));
    nebulaGeo.setAttribute('color', new THREE.BufferAttribute(nebCol, 3));
    const nebulaMat = new THREE.PointsMaterial({
      size: 4.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.38,
    });
    const nebulaPoints = new THREE.Points(nebulaGeo, nebulaMat);
    scene.add(nebulaPoints);

    // 6. Build Movie-Accurate Enterprise Model
    const enterprise = createKelvinEnterprise();
    scene.add(enterprise.group);
    controllerRef.current = enterprise;

    // 7. Free 360-Degree OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2.5;
    controls.maxDistance = 180;
    controls.minPolarAngle = 0.01;
    controls.maxPolarAngle = Math.PI - 0.01;
    controls.target.copy(targetLookAt.current);
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = autoRotateSpeed;
    controlsRef.current = controls;

    controls.addEventListener('start', () => {
      isTransitioningCamera.current = false;
    });

    // Camera preset handler
    const setCameraPreset = (preset: CameraPreset) => {
      isTransitioningCamera.current = true;
      switch (preset) {
        case 'beauty':
          targetCamPos.current.set(16, 5.0, 18);
          targetLookAt.current.set(0, 0.4, 0);
          break;
        case 'bridge':
          targetCamPos.current.set(0, 3.8, 8.2);
          targetLookAt.current.set(0, 2.5, 4.2);
          break;
        case 'deflector':
          targetCamPos.current.set(0, -1.8, 11.2);
          targetLookAt.current.set(0, -1.45, 3.2);
          break;
        case 'engines':
          targetCamPos.current.set(-10.5, 6.0, -18.5);
          targetLookAt.current.set(0, 2.2, -6.5);
          break;
        case 'flyby':
          targetCamPos.current.set(-19, -3.0, 9.0);
          targetLookAt.current.set(0, 0.2, 0);
          break;
        case 'tactical':
          targetCamPos.current.set(0, 22.0, 2.0);
          targetLookAt.current.set(0, 0, 1.5);
          break;
        case 'dorsal':
          targetCamPos.current.set(0, 32.0, 0.6);
          targetLookAt.current.set(0, 0.4, 0.6);
          break;
        case 'elevation':
          // Port view with bow facing left, matching reference schematic
          targetCamPos.current.set(-30.0, 0.5, 0);
          targetLookAt.current.set(0, 0.5, 0);
          break;
        case 'bow':
          // Front bow view matching reference schematic
          targetCamPos.current.set(0, 0.4, 28.0);
          targetLookAt.current.set(0, 0.4, 0);
          break;
        case 'stern':
          // Rear stern view matching reference schematic
          targetCamPos.current.set(0, 0.6, -28.0);
          targetLookAt.current.set(0, 0.6, 0);
          break;
        case 'registry':
          targetCamPos.current.set(0, 7.8, 11.5);
          targetLookAt.current.set(0, 2.8, 7.2);
          break;
      }
    };

    const focusSubsystem = (subsystem: string) => {
      if (!controllerRef.current) return;
      isTransitioningCamera.current = true;
      const pos = controllerRef.current.getSubsystemPosition(subsystem);
      targetLookAt.current.copy(pos);

      switch (subsystem.toLowerCase()) {
        case 'saucer':
          targetCamPos.current.set(pos.x + 10, pos.y + 6, pos.z + 10);
          break;
        case 'deflector':
          targetCamPos.current.set(pos.x, pos.y - 0.5, pos.z + 8);
          break;
        case 'bussard':
          targetCamPos.current.set(pos.x - 3, pos.y + 1, pos.z + 6);
          break;
        case 'grills':
        case 'nacelles':
          targetCamPos.current.set(pos.x + 6, pos.y + 2, pos.z - 4);
          break;
        case 'impulse':
          targetCamPos.current.set(pos.x, pos.y + 2, pos.z - 7);
          break;
        case 'shuttlebay':
          targetCamPos.current.set(pos.x, pos.y + 1.5, pos.z - 8);
          break;
        default:
          targetCamPos.current.set(pos.x + 14, pos.y + 5, pos.z + 14);
      }
    };

    // Projectile Spawners
    const fireTorpedo = () => {
      if (!controllerRef.current || !sceneRef.current) return;
      const origin = controllerRef.current.getTorpedoOrigin();

      const mesh = new THREE.Mesh(torpedoGeo.current, torpedoMat.current);
      mesh.position.copy(origin);

      const light = new THREE.PointLight(0xff3300, 4.0, 20);
      mesh.add(light);

      sceneRef.current.add(mesh);

      const forward = new THREE.Vector3(0, 0.02, 1.0)
        .applyQuaternion(controllerRef.current.group.quaternion)
        .normalize();

      projectiles.current.push({
        mesh,
        velocity: forward.multiplyScalar(44),
        life: 0,
        maxLife: 2.5,
        type: 'torpedo',
      });
    };

    const firePhaser = () => {
      if (!controllerRef.current || !sceneRef.current) return;
      const [leftOrigin, rightOrigin] = controllerRef.current.getPhaserOrigins();

      const forwardDir = new THREE.Vector3(0, -0.15, 1.0)
        .applyQuaternion(controllerRef.current.group.quaternion)
        .normalize();

      [leftOrigin, rightOrigin].forEach((origin) => {
        const endPoint = origin.clone().add(forwardDir.clone().multiplyScalar(70));
        const lineGeo = new THREE.BufferGeometry().setFromPoints([origin, endPoint]);
        const line = new THREE.Line(lineGeo, phaserMat.current);
        sceneRef.current!.add(line);

        projectiles.current.push({
          mesh: line,
          velocity: new THREE.Vector3(),
          life: 0,
          maxLife: 0.35,
          type: 'phaser',
        });
      });
    };

    const takeScreenshot = (): string | null => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return null;
      if (composerRef.current) {
        composerRef.current.render();
      } else {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      return rendererRef.current.domElement.toDataURL('image/png');
    };

    if (onSceneReady) {
      onSceneReady({
        setCameraPreset,
        focusSubsystem,
        setAlertMode: (m) => controllerRef.current?.setAlertMode(m),
        setSpeedMode: (s) => controllerRef.current?.setWarpActive(s === 'warp'),
        setHullFinish: (f) => controllerRef.current?.setHullFinish(f),
        setExploded: (factor) => controllerRef.current?.setExploded(factor),
        setAutoRotate: (enabled) => {
          if (controlsRef.current) controlsRef.current.autoRotate = enabled;
        },
        setAutoRotateSpeed: (spd) => {
          if (controlsRef.current) controlsRef.current.autoRotateSpeed = spd;
        },
        setBloomEnabled: (enabled: boolean) => {
          bloomEnabledRef.current = enabled;
        },
        setExposure: (val: number) => {
          if (rendererRef.current) rendererRef.current.toneMappingExposure = val;
        },
        setLightIntensity: (val: number) => {
          if (keyStarRef.current) keyStarRef.current.intensity = val;
        },
        setAmbientFill: (val: number) => {
          if (hemiLightRef.current) hemiLightRef.current.intensity = val;
          if (rimLightRef.current) rimLightRef.current.intensity = val * 2.2;
        },
        fireTorpedo,
        firePhaser,
        takeScreenshot,
      });
    }

    // 8. Render Loop
    const clock = new THREE.Clock();
    let animId = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      if (isTransitioningCamera.current) {
        camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamPos.current.x, 3.5, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCamPos.current.y, 3.5, delta);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCamPos.current.z, 3.5, delta);

        controls.target.x = THREE.MathUtils.damp(controls.target.x, targetLookAt.current.x, 3.5, delta);
        controls.target.y = THREE.MathUtils.damp(controls.target.y, targetLookAt.current.y, 3.5, delta);
        controls.target.z = THREE.MathUtils.damp(controls.target.z, targetLookAt.current.z, 3.5, delta);

        if (camera.position.distanceTo(targetCamPos.current) < 0.1) {
          isTransitioningCamera.current = false;
        }
      }

      controls.update();
      controllerRef.current?.update(delta, elapsed);

      const speedVal = speedMode === 'warp' ? 4.5 : speedMode === 'impulse' ? 1.0 : 0.2;
      starfieldRef.current?.update(speedVal, delta);

      // Projectiles update
      for (let i = projectiles.current.length - 1; i >= 0; i--) {
        const p = projectiles.current[i];
        p.life += delta;
        if (p.life >= p.maxLife) {
          scene.remove(p.mesh);
          if ('geometry' in p.mesh && p.type === 'phaser') {
            (p.mesh as THREE.Line).geometry.dispose();
          }
          projectiles.current.splice(i, 1);
        } else {
          if (p.type === 'torpedo') {
            p.mesh.position.addScaledVector(p.velocity, delta);
          } else if (p.type === 'phaser') {
            const mat = (p.mesh as THREE.Line).material as THREE.LineBasicMaterial;
            mat.opacity = 1 - p.life / p.maxLife;
          }
        }
      }

      // Post-Processing Bloom Render
      if (bloomEnabledRef.current && composerRef.current) {
        composerRef.current.render();
      } else {
        renderer.render(scene, camera);
      }
    };

    animate();

    // Resize Handler
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composerRef.current?.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      controllerRef.current?.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  // Update dynamic props
  useEffect(() => {
    controllerRef.current?.setAlertMode(alertMode);
  }, [alertMode]);

  useEffect(() => {
    controllerRef.current?.setWarpActive(speedMode === 'warp');
  }, [speedMode]);

  useEffect(() => {
    controllerRef.current?.setHullFinish(hullFinish);
  }, [hullFinish]);

  useEffect(() => {
    controllerRef.current?.setExploded(explodedProgress);
  }, [explodedProgress]);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
      controlsRef.current.autoRotateSpeed = autoRotateSpeed;
    }
  }, [autoRotate, autoRotateSpeed]);

  useEffect(() => {
    bloomEnabledRef.current = bloomEnabled;
  }, [bloomEnabled]);

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.toneMappingExposure = exposure;
    }
  }, [exposure]);

  useEffect(() => {
    if (keyStarRef.current) {
      keyStarRef.current.intensity = lightIntensity;
    }
  }, [lightIntensity]);

  useEffect(() => {
    if (hemiLightRef.current) {
      hemiLightRef.current.intensity = ambientFill;
    }
    if (rimLightRef.current) {
      rimLightRef.current.intensity = ambientFill * 2.2;
    }
  }, [ambientFill]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* 3D WebGL Canvas */}
      <div
        ref={mountRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
      />
    </div>
  );
};
