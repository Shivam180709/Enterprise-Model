/**
 * USS Enterprise (NCC-1701) 3D Flight Simulation
 * Main Application Root
 */

import React, { useState, useEffect, useCallback } from 'react';
import { EnterpriseScene, SceneHandle } from './components/EnterpriseScene';
import { LCARSInterface } from './components/LCARSInterface';
import { AlertMode, HullFinish } from './models/enterpriseModel';
import { spaceAudio } from './audio/spaceAudio';

export default function App() {
  const [sceneHandle, setSceneHandle] = useState<SceneHandle | null>(null);
  const [alertMode, setAlertMode] = useState<AlertMode>('normal');
  const [speedMode, setSpeedMode] = useState<'sublight' | 'impulse' | 'warp'>('impulse');
  const [hullFinish, setHullFinish] = useState<HullFinish>('standard');
  const [explodedProgress, setExplodedProgress] = useState<number>(0);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [autoRotateSpeed, setAutoRotateSpeed] = useState<number>(0.8);
  const [bloomEnabled, setBloomEnabled] = useState<boolean>(true);
  const [exposure, setExposure] = useState<number>(0.80);
  const [lightIntensity, setLightIntensity] = useState<number>(0.75);
  const [ambientFill, setAmbientFill] = useState<number>(0.12);
  const [lightingPreset, setLightingPreset] = useState<'cinematic' | 'deepspace' | 'drydock' | 'solar'>('cinematic');

  const handleLightingPresetChange = (preset: 'cinematic' | 'deepspace' | 'drydock' | 'solar') => {
    setLightingPreset(preset);
    switch (preset) {
      case 'cinematic':
        setExposure(0.80);
        setLightIntensity(0.75);
        setAmbientFill(0.12);
        break;
      case 'deepspace':
        setExposure(0.68);
        setLightIntensity(0.65);
        setAmbientFill(0.06);
        break;
      case 'drydock':
        setExposure(0.88);
        setLightIntensity(0.60);
        setAmbientFill(0.28);
        break;
      case 'solar':
        setExposure(1.00);
        setLightIntensity(0.95);
        setAmbientFill(0.20);
        break;
    }
  };

  // Keyboard navigation shortcuts for bridge officers
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger if user is interacting with an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 't':
          spaceAudio.playPhotonTorpedo();
          sceneHandle?.fireTorpedo();
          break;
        case ' ':
          e.preventDefault();
          spaceAudio.playPhaserPulse();
          sceneHandle?.firePhaser();
          break;
        case 'w':
          setSpeedMode((prev) => {
            const next = prev === 'warp' ? 'impulse' : 'warp';
            spaceAudio.setWarpSpeed(next === 'warp');
            return next;
          });
          break;
        case 'r':
          setAlertMode((prev) => {
            const next = prev === 'red' ? 'normal' : 'red';
            spaceAudio.setAlertKlaxon(next === 'red');
            return next;
          });
          break;
        case '1':
          sceneHandle?.setCameraPreset('beauty');
          break;
        case '2':
          sceneHandle?.setCameraPreset('bridge');
          break;
        case '3':
          sceneHandle?.setCameraPreset('deflector');
          break;
        case '4':
          sceneHandle?.setCameraPreset('engines');
          break;
        case '5':
          sceneHandle?.setCameraPreset('flyby');
          break;
      }
    },
    [sceneHandle]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="relative w-screen h-screen bg-[#020306] overflow-hidden select-none font-sans">
      {/* 3D WebGL Canvas Viewport */}
      <EnterpriseScene
        onSceneReady={setSceneHandle}
        alertMode={alertMode}
        speedMode={speedMode}
        hullFinish={hullFinish}
        explodedProgress={explodedProgress}
        autoRotate={autoRotate}
        autoRotateSpeed={autoRotateSpeed}
        bloomEnabled={bloomEnabled}
        exposure={exposure}
        lightIntensity={lightIntensity}
        ambientFill={ambientFill}
      />

      {/* Starfleet Bridge LCARS Overlay */}
      <LCARSInterface
        sceneHandle={sceneHandle}
        alertMode={alertMode}
        setAlertMode={setAlertMode}
        speedMode={speedMode}
        setSpeedMode={setSpeedMode}
        hullFinish={hullFinish}
        setHullFinish={setHullFinish}
        explodedProgress={explodedProgress}
        setExplodedProgress={setExplodedProgress}
        autoRotate={autoRotate}
        setAutoRotate={setAutoRotate}
        autoRotateSpeed={autoRotateSpeed}
        setAutoRotateSpeed={setAutoRotateSpeed}
        bloomEnabled={bloomEnabled}
        setBloomEnabled={setBloomEnabled}
        exposure={exposure}
        setExposure={setExposure}
        lightIntensity={lightIntensity}
        setLightIntensity={setLightIntensity}
        ambientFill={ambientFill}
        setAmbientFill={setAmbientFill}
        lightingPreset={lightingPreset}
        setLightingPreset={handleLightingPresetChange}
      />
    </div>
  );
}
