/**
 * Starfleet LCARS (Library Computer Access and Retrieval System) Interface
 * Includes Orthographic Schematics & Subsystem Inspect Callouts matching the reference diagram.
 */

import React, { useState } from 'react';
import {
  Rocket,
  Shield,
  Layers,
  Camera,
  Palette,
  Volume2,
  VolumeX,
  RotateCw,
  Maximize2,
  Crosshair,
  Flame,
  ChevronDown,
  ChevronUp,
  Camera as SnapshotIcon,
  Radio,
  Compass,
  Sliders,
  Sun,
  SunMedium,
  Moon,
  Eye,
} from 'lucide-react';
import { AlertMode, HullFinish } from '../models/enterpriseModel';
import { CameraPreset, SceneHandle } from './EnterpriseScene';
import { spaceAudio } from '../audio/spaceAudio';

interface LCARSInterfaceProps {
  sceneHandle: SceneHandle | null;
  alertMode: AlertMode;
  setAlertMode: (mode: AlertMode) => void;
  speedMode: 'sublight' | 'impulse' | 'warp';
  setSpeedMode: (speed: 'sublight' | 'impulse' | 'warp') => void;
  hullFinish: HullFinish;
  setHullFinish: (finish: HullFinish) => void;
  explodedProgress: number;
  setExplodedProgress: (val: number) => void;
  autoRotate: boolean;
  setAutoRotate: (val: boolean) => void;
  autoRotateSpeed: number;
  setAutoRotateSpeed: (spd: number) => void;
  bloomEnabled: boolean;
  setBloomEnabled: (enabled: boolean) => void;
  exposure: number;
  setExposure: (val: number) => void;
  lightIntensity: number;
  setLightIntensity: (val: number) => void;
  ambientFill: number;
  setAmbientFill: (val: number) => void;
  lightingPreset: 'cinematic' | 'deepspace' | 'drydock' | 'solar';
  setLightingPreset: (preset: 'cinematic' | 'deepspace' | 'drydock' | 'solar') => void;
}

type ActiveTab = 'ortho' | 'lighting' | 'flight' | 'tactical' | 'schematic' | 'cameras' | 'livery';

export const LCARSInterface: React.FC<LCARSInterfaceProps> = ({
  sceneHandle,
  alertMode,
  setAlertMode,
  speedMode,
  setSpeedMode,
  hullFinish,
  setHullFinish,
  explodedProgress,
  setExplodedProgress,
  autoRotate,
  setAutoRotate,
  autoRotateSpeed,
  setAutoRotateSpeed,
  bloomEnabled,
  setBloomEnabled,
  exposure,
  setExposure,
  lightIntensity,
  setLightIntensity,
  ambientFill,
  setAmbientFill,
  lightingPreset,
  setLightingPreset,
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('ortho');
  const [showSchematicsHUD, setShowSchematicsHUD] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedSubsystem, setSelectedSubsystem] = useState<string>('saucer');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 2500);
  };

  const handleAudioToggle = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    spaceAudio.setMuted(nextMuted);
    if (!nextMuted) {
      spaceAudio.startEngines();
      spaceAudio.playChirp('high');
    }
  };

  const handleAlertChange = (mode: AlertMode) => {
    spaceAudio.playChirp(mode === 'red' ? 'high' : 'mid');
    setAlertMode(mode);
    spaceAudio.setAlertKlaxon(mode === 'red');
    showToast(`ALERT STATUS: CONDITION ${mode.toUpperCase()}`);
  };

  const handleSpeedChange = (speed: 'sublight' | 'impulse' | 'warp') => {
    spaceAudio.startEngines();
    spaceAudio.playChirp('mid');
    setSpeedMode(speed);
    spaceAudio.setWarpSpeed(speed === 'warp');
    showToast(
      speed === 'warp'
        ? 'WARP FIELD ENGAGED • FACTOR 8.2'
        : speed === 'impulse'
        ? 'IMPULSE ENGINES AT FULL AHEAD'
        : 'MANEUVERING THRUSTERS ACTIVE'
    );
  };

  const handleFireTorpedo = () => {
    spaceAudio.playPhotonTorpedo();
    sceneHandle?.fireTorpedo();
    showToast('PHOTON TORPEDO LAUNCHED');
  };

  const handleFirePhaser = () => {
    spaceAudio.playPhaserPulse();
    sceneHandle?.firePhaser();
    showToast('VENTRAL PHASERS DISCHARGED');
  };

  const handleCameraChange = (preset: CameraPreset) => {
    spaceAudio.playChirp('low');
    sceneHandle?.setCameraPreset(preset);
  };

  const handleSubsystemClick = (name: string) => {
    setSelectedSubsystem(name);
    spaceAudio.playChirp('mid');
    sceneHandle?.focusSubsystem(name);
    showToast(`TELEMETRY LOCK: ${name.toUpperCase()}`);
  };

  const handleScreenshot = () => {
    const dataUrl = sceneHandle?.takeScreenshot();
    if (dataUrl) {
      const link = document.createElement('a');
      link.download = `USS-Enterprise-NCC1701-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      showToast('HIGH-RES 3D CAPTURE SAVED');
    }
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 sm:p-5 overflow-hidden">
      {/* Top Header: Starship Schematics & Telemetry Badge */}
      <div className="flex items-start justify-between w-full">
        <div className="pointer-events-auto bg-slate-950/85 border border-slate-700/60 rounded-xl px-4 py-2.5 shadow-2xl flex items-center gap-3.5">
          <div className="w-2.5 h-10 rounded-full bg-amber-500 flex-shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm uppercase tracking-widest text-amber-400 font-extrabold">
                USS ENTERPRISE
              </span>
              <span className="text-[11px] bg-slate-800 text-slate-200 px-2 py-0.5 rounded font-mono font-bold border border-slate-700">
                NCC-1701
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono tracking-wide">
              CONSTITUTION CLASS HEAVY CRUISER • ORBITAL TURNTABLE 360°
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 border-l border-slate-700/80 pl-3">
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                alertMode === 'red'
                  ? 'bg-red-950 text-red-300 border border-red-700'
                  : alertMode === 'yellow'
                  ? 'bg-amber-950 text-amber-300 border border-amber-700'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
              }`}
            >
              {alertMode === 'red' ? 'RED ALERT' : alertMode === 'yellow' ? 'YELLOW ALERT' : 'CONDITION GREEN'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              DEFLECTOR: 100%
            </span>
          </div>
        </div>

        {/* Top-Right Quick Utilities */}
        <div className="pointer-events-auto flex items-center gap-2">
          {toastMessage && (
            <div className="bg-amber-500/90 text-slate-950 font-mono text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg border border-amber-400">
              {toastMessage}
            </div>
          )}

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/85 border border-slate-700/60 text-slate-300 text-xs font-mono">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Drag to rotate 360°</span>
          </div>

          <button
            onClick={() => {
              setActiveTab('lighting');
              setIsCollapsed(false);
              spaceAudio.playChirp('mid');
            }}
            title="Adjust Lighting, Exposure & Contrast"
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-mono font-bold transition-colors shadow-lg flex items-center gap-1.5 ${
              activeTab === 'lighting'
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : 'bg-slate-950/85 text-amber-400 border-slate-700/60 hover:text-amber-300'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span className="hidden md:inline">LIGHT:</span>
            <span className="uppercase text-[11px] font-extrabold">{lightingPreset}</span>
          </button>

          <button
            onClick={() => {
              const next = !bloomEnabled;
              setBloomEnabled(next);
              showToast(next ? 'OPTICAL BLOOM GLOW: ACTIVE' : 'BLOOM GLOW: DISABLED');
            }}
            title={bloomEnabled ? 'Disable Optical Bloom Glow' : 'Enable Optical Bloom Glow'}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-mono font-bold transition-colors shadow-lg flex items-center gap-1.5 ${
              bloomEnabled
                ? 'bg-cyan-950/90 text-cyan-300 border-cyan-500/60'
                : 'bg-slate-950/85 text-slate-400 border-slate-700/60 hover:text-slate-200'
            }`}
          >
            <span className="text-[10px]">GLOW</span>
            <span className={bloomEnabled ? 'text-cyan-400' : 'text-slate-500'}>
              {bloomEnabled ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            onClick={handleAudioToggle}
            title={isMuted ? 'Unmute Audio Engine' : 'Mute Audio Engine'}
            className="p-2.5 rounded-xl bg-slate-950/85 border border-slate-700/60 text-slate-300 hover:text-amber-400 hover:border-amber-500/50 transition-colors shadow-lg"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={handleFullscreen}
            title="Toggle Fullscreen"
            className="p-2.5 rounded-xl bg-slate-950/85 border border-slate-700/60 text-slate-300 hover:text-amber-400 hover:border-amber-500/50 transition-colors shadow-lg hidden sm:block"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Unified Bottom Control Dock */}
      <div
        className={`pointer-events-auto w-full max-w-[940px] mx-auto transition-transform duration-300 ease-out flex flex-col items-center ${
          isCollapsed ? 'translate-y-[calc(100%-36px)]' : 'translate-y-0'
        }`}
      >
        {/* Collapse Drawer Bar */}
        <button
          onClick={() => {
            setIsCollapsed(!isCollapsed);
            spaceAudio.playChirp('low');
          }}
          className="flex items-center gap-1.5 px-3.5 py-1 rounded-t-lg bg-slate-950/90 border-t border-x border-slate-700/70 text-slate-400 hover:text-amber-400 font-mono text-[11px] transition-colors shadow-md"
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
              <span>EXPAND SCHEMATICS & BRIDGE CONTROLS</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
              <span>COLLAPSE HUD (ZEN 360° VIEW)</span>
            </>
          )}
        </button>

        {/* Main Dock Container */}
        <div className="w-full bg-slate-950/95 border border-slate-700/80 rounded-2xl p-3 sm:p-4 shadow-2xl">
          {/* LCARS Nav Tabs */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3 gap-1 overflow-x-auto">
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => {
                  setActiveTab('lighting');
                  spaceAudio.playChirp('mid');
                }}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                  activeTab === 'lighting'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>LIGHTING & CONTRAST</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('ortho');
                  spaceAudio.playChirp('mid');
                }}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                  activeTab === 'ortho'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>ORTHOGRAPHIC</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('flight');
                  spaceAudio.playChirp('mid');
                }}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                  activeTab === 'flight'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Rocket className="w-3.5 h-3.5" />
                <span>FLIGHT & 360°</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('tactical');
                  spaceAudio.playChirp('mid');
                }}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                  activeTab === 'tactical'
                    ? 'bg-red-500 text-slate-950'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>TACTICAL</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('schematic');
                  spaceAudio.playChirp('mid');
                }}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                  activeTab === 'schematic'
                    ? 'bg-sky-500 text-slate-950'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>EXPLODED DECKS</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('cameras');
                  spaceAudio.playChirp('mid');
                }}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                  activeTab === 'cameras'
                    ? 'bg-purple-500 text-slate-950'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>CINEMATIC</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('livery');
                  spaceAudio.playChirp('mid');
                }}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                  activeTab === 'livery'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>FINISH</span>
              </button>
            </div>

            <button
              onClick={handleScreenshot}
              title="Capture 3D Render"
              className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-amber-400 px-2 py-1 rounded bg-slate-900 border border-slate-800 flex-shrink-0"
            >
              <SnapshotIcon className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">CAPTURE</span>
            </button>
          </div>

          {/* Active Tab Body */}
          <div className="min-h-[58px] flex items-center">
            {/* LIGHTING, EXPOSURE & SHIP CONTRAST CONTROLS */}
            {activeTab === 'lighting' && (
              <div className="w-full flex flex-col gap-3">
                {/* Row 1: Lighting Presets */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    <span className="text-[10px] font-mono text-amber-400 font-bold uppercase mr-1 flex items-center gap-1">
                      <Sun className="w-3 h-3" />
                      PRESETS:
                    </span>
                    <button
                      onClick={() => {
                        setLightingPreset('cinematic');
                        spaceAudio.playChirp('mid');
                        showToast('LIGHTING: 🎬 MOVIE CINEMATIC (OPTIMAL BALANCED CONTRAST)');
                      }}
                      className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold transition-colors whitespace-nowrap border ${
                        lightingPreset === 'cinematic'
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                          : 'bg-slate-900 text-slate-300 hover:text-white border-slate-800'
                      }`}
                    >
                      🎬 CINEMATIC SPACE (DEFAULT)
                    </button>
                    <button
                      onClick={() => {
                        setLightingPreset('deepspace');
                        spaceAudio.playChirp('mid');
                        showToast('LIGHTING: 🌌 DEEP SPACE (HIGH CONTRAST SHADOWS)');
                      }}
                      className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold transition-colors whitespace-nowrap border ${
                        lightingPreset === 'deepspace'
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                          : 'bg-slate-900 text-slate-300 hover:text-white border-slate-800'
                      }`}
                    >
                      🌌 DEEP SPACE SHADOW
                    </button>
                    <button
                      onClick={() => {
                        setLightingPreset('drydock');
                        spaceAudio.playChirp('mid');
                        showToast('LIGHTING: 🛰️ STARBASE DRYDOCK (SOFT STUDIO FILL)');
                      }}
                      className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold transition-colors whitespace-nowrap border ${
                        lightingPreset === 'drydock'
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                          : 'bg-slate-900 text-slate-300 hover:text-white border-slate-800'
                      }`}
                    >
                      🛰️ STARBASE DRYDOCK
                    </button>
                    <button
                      onClick={() => {
                        setLightingPreset('solar');
                        spaceAudio.playChirp('mid');
                        showToast('LIGHTING: ☀️ SOLAR HIGH-KEY');
                      }}
                      className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold transition-colors whitespace-nowrap border ${
                        lightingPreset === 'solar'
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                          : 'bg-slate-900 text-slate-300 hover:text-white border-slate-800'
                      }`}
                    >
                      ☀️ SOLAR HIGH-KEY
                    </button>
                  </div>

                  {/* Contrast Status Telemetry */}
                  <div className="flex items-center gap-1.5 text-[10px] font-mono bg-slate-900/90 border border-slate-800 px-2 py-0.5 rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-slate-400">HULL CONTRAST:</span>
                    <span className="text-emerald-400 font-bold">100% VISIBLE (ANTI-WASHOUT)</span>
                  </div>
                </div>

                {/* Row 2: Precision Calibration Sliders */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-800/80">
                  {/* Exposure Slider */}
                  <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 px-2.5 py-1 rounded-lg">
                    <SunMedium className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span className="text-[10px] font-mono text-slate-400 flex-shrink-0">
                      EXPOSURE:
                    </span>
                    <input
                      type="range"
                      min="0.30"
                      max="1.50"
                      step="0.05"
                      value={exposure}
                      onChange={(e) => setExposure(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-400"
                      title="Adjust camera tone mapping exposure"
                    />
                    <span className="text-[10px] font-mono text-amber-400 font-bold w-9 text-right">
                      {Math.round(exposure * 100)}%
                    </span>
                  </div>

                  {/* Sun Key Light Slider */}
                  <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 px-2.5 py-1 rounded-lg">
                    <Sun className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span className="text-[10px] font-mono text-slate-400 flex-shrink-0">
                      STAR SUNLIGHT:
                    </span>
                    <input
                      type="range"
                      min="0.20"
                      max="1.60"
                      step="0.05"
                      value={lightIntensity}
                      onChange={(e) => setLightIntensity(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-400"
                      title="Adjust directional star illumination"
                    />
                    <span className="text-[10px] font-mono text-amber-400 font-bold w-9 text-right">
                      {Math.round(lightIntensity * 100)}%
                    </span>
                  </div>

                  {/* Deep Space Ambient Fill Slider */}
                  <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 px-2.5 py-1 rounded-lg">
                    <Moon className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    <span className="text-[10px] font-mono text-slate-400 flex-shrink-0">
                      AMBIENT FILL:
                    </span>
                    <input
                      type="range"
                      min="0.02"
                      max="0.45"
                      step="0.02"
                      value={ambientFill}
                      onChange={(e) => setAmbientFill(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
                      title="Adjust deep space shadow fill"
                    />
                    <span className="text-[10px] font-mono text-cyan-400 font-bold w-9 text-right">
                      {Math.round(ambientFill * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 0. ORTHOGRAPHIC VIEWS & SUBSYSTEM CALLOUTS (matching user reference diagram) */}
            {activeTab === 'ortho' && (
              <div className="w-full flex flex-col gap-2.5">
                {/* 4 Orthographic Views from the User's Image */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    <span className="text-[10px] font-mono text-amber-400 font-bold uppercase mr-1">
                      VIEWS:
                    </span>
                    <button
                      onClick={() => handleCameraChange('dorsal')}
                      className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] font-mono font-bold transition-colors whitespace-nowrap"
                    >
                      TOP (DORSAL)
                    </button>
                    <button
                      onClick={() => handleCameraChange('elevation')}
                      className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] font-mono font-bold transition-colors whitespace-nowrap"
                    >
                      SIDE (ELEVATION)
                    </button>
                    <button
                      onClick={() => handleCameraChange('bow')}
                      className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] font-mono font-bold transition-colors whitespace-nowrap"
                    >
                      FRONT (BOW)
                    </button>
                    <button
                      onClick={() => handleCameraChange('stern')}
                      className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] font-mono font-bold transition-colors whitespace-nowrap"
                    >
                      BACK (STERN)
                    </button>
                    <button
                      onClick={() => handleCameraChange('beauty')}
                      className="px-2.5 py-1 rounded bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 border border-amber-800 text-[11px] font-mono font-bold transition-colors whitespace-nowrap"
                    >
                      3/4 BEAUTY
                    </button>
                    <button
                      onClick={() => handleCameraChange('registry')}
                      className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-mono font-extrabold transition-colors whitespace-nowrap shadow"
                      title="Zoom directly to NCC-1701 hull text matching reference photo"
                    >
                      NCC-1701 CLOSE-UP
                    </button>
                  </div>

                  {/* Subsystem Hotspots (matching graphic callout labels) */}
                  <div className="flex items-center gap-1 overflow-x-auto">
                    <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase mr-1">
                      HOTSPOTS:
                    </span>
                    <button
                      onClick={() => handleSubsystemClick('saucer')}
                      className={`px-2 py-1 rounded text-[10px] font-mono font-bold border transition-colors ${
                        selectedSubsystem === 'saucer'
                          ? 'bg-cyan-600 text-slate-950 border-cyan-400'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      SAUCER
                    </button>
                    <button
                      onClick={() => handleSubsystemClick('deflector')}
                      className={`px-2 py-1 rounded text-[10px] font-mono font-bold border transition-colors ${
                        selectedSubsystem === 'deflector'
                          ? 'bg-amber-600 text-slate-950 border-amber-400'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      DEFLECTOR
                    </button>
                    <button
                      onClick={() => handleSubsystemClick('bussard')}
                      className={`px-2 py-1 rounded text-[10px] font-mono font-bold border transition-colors ${
                        selectedSubsystem === 'bussard'
                          ? 'bg-red-600 text-slate-950 border-red-400'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      BUSSARD
                    </button>
                    <button
                      onClick={() => handleSubsystemClick('nacelles')}
                      className={`px-2 py-1 rounded text-[10px] font-mono font-bold border transition-colors ${
                        selectedSubsystem === 'nacelles'
                          ? 'bg-blue-600 text-slate-950 border-blue-400'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      WARP GRILLS
                    </button>
                    <button
                      onClick={() => handleSubsystemClick('impulse')}
                      className={`px-2 py-1 rounded text-[10px] font-mono font-bold border transition-colors ${
                        selectedSubsystem === 'impulse'
                          ? 'bg-orange-600 text-slate-950 border-orange-400'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      IMPULSE
                    </button>
                    <button
                      onClick={() => handleSubsystemClick('shuttlebay')}
                      className={`px-2 py-1 rounded text-[10px] font-mono font-bold border transition-colors ${
                        selectedSubsystem === 'shuttlebay'
                          ? 'bg-purple-600 text-slate-950 border-purple-400'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      SHUTTLEBAY
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 1. FLIGHT & 360° TURNTABLE CONTROLS */}
            {activeTab === 'flight' && (
              <div className="w-full flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-mono text-slate-500 mr-1 uppercase">DRIVE:</span>
                  <button
                    onClick={() => handleSpeedChange('sublight')}
                    className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-colors ${
                      speedMode === 'sublight'
                        ? 'bg-slate-700 text-slate-100 border border-slate-500'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    THRUSTERS
                  </button>
                  <button
                    onClick={() => handleSpeedChange('impulse')}
                    className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-colors ${
                      speedMode === 'impulse'
                        ? 'bg-amber-600 text-slate-950 font-extrabold border border-amber-400'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    FULL IMPULSE
                  </button>
                  <button
                    onClick={() => handleSpeedChange('warp')}
                    className={`px-3.5 py-1.5 rounded-md text-xs font-mono font-bold transition-colors flex items-center gap-1.5 ${
                      speedMode === 'warp'
                        ? 'bg-cyan-500 text-slate-950 font-extrabold border border-cyan-300 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-900 text-cyan-400 hover:bg-cyan-950/30 border border-cyan-900/60'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>WARP 8.2</span>
                  </button>
                </div>

                {/* 360 Turntable Orbit Controls */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      const next = !autoRotate;
                      setAutoRotate(next);
                      showToast(next ? '360° TURNTABLE ACTIVE' : 'FREE CAM: DRAG FREELY IN 360°');
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-semibold border transition-colors ${
                      autoRotate
                        ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
                    }`}
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
                    <span>AUTO-ROTATE 360°</span>
                  </button>

                  {autoRotate && (
                    <div className="flex items-center gap-2">
                      <Sliders className="w-3 h-3 text-slate-400" />
                      <input
                        type="range"
                        min="0.2"
                        max="3.0"
                        step="0.1"
                        value={autoRotateSpeed}
                        onChange={(e) => setAutoRotateSpeed(parseFloat(e.target.value))}
                        className="w-16 h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-400"
                        title="Rotation Speed"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. TACTICAL & WEAPONS */}
            {activeTab === 'tactical' && (
              <div className="w-full flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-mono text-slate-500 mr-1 uppercase">ALERT:</span>
                  <button
                    onClick={() => handleAlertChange('normal')}
                    className={`px-2.5 py-1.5 rounded-md text-xs font-mono font-bold border transition-colors ${
                      alertMode === 'normal'
                        ? 'bg-emerald-600 text-slate-950 border-emerald-400'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    NORMAL
                  </button>
                  <button
                    onClick={() => handleAlertChange('yellow')}
                    className={`px-2.5 py-1.5 rounded-md text-xs font-mono font-bold border transition-colors ${
                      alertMode === 'yellow'
                        ? 'bg-amber-600 text-slate-950 border-amber-400'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    YELLOW
                  </button>
                  <button
                    onClick={() => handleAlertChange('red')}
                    className={`px-2.5 py-1.5 rounded-md text-xs font-mono font-bold border transition-colors ${
                      alertMode === 'red'
                        ? 'bg-red-600 text-slate-950 border-red-400'
                        : 'bg-slate-900 text-red-400 border-slate-800 hover:bg-red-950/20'
                    }`}
                  >
                    RED ALERT
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleFireTorpedo}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-950 text-red-200 border border-red-700/80 hover:bg-red-900 hover:border-red-500 text-xs font-mono font-bold transition-colors active:scale-95"
                  >
                    <Crosshair className="w-3.5 h-3.5 text-red-400" />
                    <span>TORPEDOES</span>
                  </button>
                  <button
                    onClick={handleFirePhaser}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-950 text-amber-200 border border-amber-700/80 hover:bg-amber-900 hover:border-amber-500 text-xs font-mono font-bold transition-colors active:scale-95"
                  >
                    <Radio className="w-3.5 h-3.5 text-amber-400" />
                    <span>PHASERS</span>
                  </button>
                </div>
              </div>
            )}

            {/* 3. SCHEMATIC EXPLODED VIEW */}
            {activeTab === 'schematic' && (
              <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 max-w-md">
                  <span className="text-[11px] font-mono text-slate-400 flex-shrink-0">
                    DECK SEPARATION:
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={explodedProgress}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setExplodedProgress(val);
                    }}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                  />
                  <span className="font-mono text-xs text-sky-400 w-10 text-right">
                    {Math.round(explodedProgress * 100)}%
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 overflow-x-auto">
                  <span className="bg-slate-900 px-2 py-1 rounded border border-slate-800">
                    1. Primary Saucer
                  </span>
                  <span className="bg-slate-900 px-2 py-1 rounded border border-slate-800">
                    2. Dorsal Neck
                  </span>
                  <span className="bg-slate-900 px-2 py-1 rounded border border-slate-800">
                    3. Secondary Hull
                  </span>
                  <span className="bg-slate-900 px-2 py-1 rounded border border-slate-800">
                    4. Warp Nacelles
                  </span>
                </div>
              </div>
            )}

            {/* 4. CINEMATIC CAMERA VIEWS */}
            {activeTab === 'cameras' && (
              <div className="w-full flex items-center gap-1.5 overflow-x-auto">
                <button
                  onClick={() => handleCameraChange('beauty')}
                  className="px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-mono font-bold transition-colors whitespace-nowrap"
                >
                  STARFLEET SHOWCASE
                </button>
                <button
                  onClick={() => handleCameraChange('bridge')}
                  className="px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-mono font-bold transition-colors whitespace-nowrap"
                >
                  BRIDGE MODULE
                </button>
                <button
                  onClick={() => handleCameraChange('deflector')}
                  className="px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-mono font-bold transition-colors whitespace-nowrap"
                >
                  DEFLECTOR DISH
                </button>
                <button
                  onClick={() => handleCameraChange('engines')}
                  className="px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-mono font-bold transition-colors whitespace-nowrap"
                >
                  WARP NACELLES & BAY
                </button>
                <button
                  onClick={() => handleCameraChange('flyby')}
                  className="px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-mono font-bold transition-colors whitespace-nowrap"
                >
                  DEEP-SPACE FLYBY
                </button>
                <button
                  onClick={() => handleCameraChange('registry')}
                  className="px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 border border-amber-400 text-xs font-mono font-extrabold transition-colors whitespace-nowrap shadow"
                >
                  NCC-1701 HULL CLOSE-UP
                </button>
              </div>
            )}

            {/* 5. HULL FINISH / LIVERY */}
            {activeTab === 'livery' && (
              <div className="w-full flex items-center gap-2 overflow-x-auto">
                <button
                  onClick={() => {
                    setHullFinish('standard');
                    spaceAudio.playChirp('mid');
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono font-bold border transition-colors ${
                    hullFinish === 'standard'
                      ? 'bg-slate-700 text-white border-amber-400'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full bg-[#e2e6ed] border border-slate-500" />
                  <span>STARFLEET MATTE PEARL</span>
                </button>

                <button
                  onClick={() => {
                    setHullFinish('classic');
                    spaceAudio.playChirp('mid');
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono font-bold border transition-colors ${
                    hullFinish === 'classic'
                      ? 'bg-slate-700 text-white border-amber-400'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full bg-[#ebf0f7] border border-slate-400" />
                  <span>CONSTITUTION 1966</span>
                </button>

                <button
                  onClick={() => {
                    setHullFinish('section31');
                    spaceAudio.playChirp('mid');
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono font-bold border transition-colors ${
                    hullFinish === 'section31'
                      ? 'bg-slate-700 text-white border-amber-400'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full bg-[#15181d] border border-slate-600" />
                  <span>SECTION 31 STEALTH</span>
                </button>

                <button
                  onClick={() => {
                    setHullFinish('wireframe');
                    spaceAudio.playChirp('mid');
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono font-bold border transition-colors ${
                    hullFinish === 'wireframe'
                      ? 'bg-slate-700 text-white border-cyan-400'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full bg-cyan-400 border border-cyan-200" />
                  <span>HOLO-DIAGNOSTIC</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
