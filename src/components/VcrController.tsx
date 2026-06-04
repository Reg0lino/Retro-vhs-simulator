/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  Tv, Play, Pause, Square, Volume2, VolumeX, ShieldAlert, Camera, RefreshCw 
} from "lucide-react";
import { SimulatorSettings } from "../types";

interface VcrControllerProps {
  isFullscreen: boolean;
  settings: SimulatorSettings;
  handleSettingsChange: (updates: Partial<SimulatorSettings>) => void;
  
  // VCR Actions & States
  vidPlayState: boolean;
  vidCurrentTime: number;
  vidDuration: number;
  vidVolume: number;
  handleTogglePlay: () => void;
  handleStopVideo: () => void;
  handleSeekVideo: (time: number) => void;
  handleVolumeChange: (vol: number) => void;
  
  // Panic stabilization
  panicConfirm: boolean;
  setPanicConfirm: (val: boolean) => void;
  handleStabilizeImage: () => void;

  // Camera settings
  cameraError: string | null;
  setCameraError: (val: string | null) => void;
  isCameraActive: boolean;
  handleToggleCamera: () => void;
  handleCycleCamera: () => void;
}

export const VcrController: React.FC<VcrControllerProps> = ({
  isFullscreen,
  settings,
  handleSettingsChange,
  
  vidPlayState,
  vidCurrentTime,
  vidDuration,
  vidVolume,
  handleTogglePlay,
  handleStopVideo,
  handleSeekVideo,
  handleVolumeChange,
  
  panicConfirm,
  setPanicConfirm,
  handleStabilizeImage,
  
  cameraError,
  setCameraError,
  isCameraActive,
  handleToggleCamera,
  handleCycleCamera,
}) => {
  // Duration parser helper
  const parseSeconds = (s: number) => {
    if (!isFinite(s) || isNaN(s)) return "Live";
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <>
      {/* TRINITRON ANALOG MEDIA DECK */}
      {!isFullscreen && (
        <div className="w-full bg-zinc-900 border border-zinc-800 rounded-sm p-2 mt-2 px-3 shadow-lg font-mono text-xs flex flex-col space-y-2 transition-all">
          {/* Row 1: Deck Title */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-1.5 gap-2 text-left">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-sky-450 uppercase tracking-wider">
              <Tv className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
              <span>■ ANALOG VCR MEDIA CONTROLLER</span>
            </div>

            {/* PANIC IMAGE STABILIZER BUTTON */}
            <div className="flex items-center font-mono text-[11px]">
              {!panicConfirm ? (
                <button
                  onClick={() => setPanicConfirm(true)}
                  className="px-2.5 py-1 bg-red-955 bg-red-950/70 hover:bg-red-900 border border-red-805 border-red-800/80 hover:border-red-500 text-red-500 hover:text-red-100 rounded-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer uppercase shadow-lg text-[10px]"
                  title="Instantly stop image wobbling and rolling/drifting anomalies"
                >
                  <ShieldAlert className="w-3 h-3 text-red-400 animate-pulse" />
                  <span>🚨 PANIC STABILIZE</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-red-955 bg-red-950/95 border border-red-800 p-1 px-2 rounded-sm text-[10px]">
                  <span className="text-red-300 font-bold">Reset Wobble & V-Sync?</span>
                  <button
                    onClick={handleStabilizeImage}
                    className="px-2 py-0.5 bg-red-650 hover:bg-red-500 text-white font-extrabold rounded-sm cursor-pointer uppercase transition-all text-[9px]"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setPanicConfirm(false)}
                    className="px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-sm cursor-pointer uppercase transition-all text-[9px]"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Deck mechanical status or progress bar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
            {/* Play & Stop Buttons */}
            <div className="md:col-span-4 flex items-center gap-1.5 my-0.5 animate-none">
              <button
                onClick={handleTogglePlay}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1 text-[10px] font-bold rounded-sm transition-all cursor-pointer shadow-sm relative top-0 active:top-0.5 ${
                  vidPlayState 
                    ? "bg-amber-500 text-zinc-950 hover:bg-amber-400 font-extrabold shadow-[0_0_8px_rgba(245,158,11,0.4)]" 
                    : "bg-zinc-800 text-zinc-250 hover:bg-zinc-750 hover:text-white"
                }`}
                title={vidPlayState ? "Pause playback" : "Start playback"}
              >
                {vidPlayState ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
                <span>{vidPlayState ? "PAUSE" : "PLAY VCR"}</span>
              </button>
              <button
                onClick={handleStopVideo}
                className="flex-none flex items-center justify-center gap-1 bg-zinc-800 hover:bg-rose-950/40 hover:text-rose-455 hover:text-rose-400 border border-zinc-755 border-zinc-750 px-2 py-1 text-[10px] text-zinc-350 font-bold rounded-sm transition-all cursor-pointer relative top-0 active:top-0.5"
                title="Reset video to begin"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>STOP</span>
              </button>
            </div>

            {/* Volume Slider Section */}
            <div className="md:col-span-4 flex items-center gap-2 bg-zinc-955 bg-zinc-955/65 border border-zinc-850 p-1 rounded-sm text-left">
              <button 
                onClick={() => handleVolumeChange(vidVolume > 0 ? 0 : 0.8)}
                className="text-zinc-400 hover:text-sky-400 cursor-pointer transition-colors shrink-0"
              >
                {vidVolume === 0 ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
              </button>
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between text-[8px] font-bold text-zinc-550 mb-0.5 leading-none">
                  <span>DECK VOL</span>
                  <span className="text-sky-455 text-sky-450">{Math.round(vidVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={vidVolume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-900 accent-sky-400 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Progressive track timeline scrubber or GIPHY paste form */}
            <div className="md:col-span-4 flex items-center gap-2 bg-zinc-955 bg-zinc-955/65 border border-zinc-850 p-1 rounded-sm text-left">
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between text-[8px] font-bold text-zinc-550 mb-0.5 leading-none">
                  <span>PLAYHEAD</span>
                  <span className="text-amber-400">{parseSeconds(vidCurrentTime)} / {parseSeconds(vidDuration)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={vidDuration || 1}
                  step="0.1"
                  value={vidCurrentTime}
                  onChange={(e) => handleSeekVideo(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-900 accent-amber-500 rounded cursor-pointer"
                  disabled={!vidDuration}
                />
              </div>
            </div>
          </div>

          {/* Drag & drop anywhere in player to load */}
          <div className="pt-1.5 border-t border-zinc-850 flex items-center justify-center p-1">
            <p className="text-[9px] text-zinc-550 font-mono italic">
              (Drag & drop any media files or web links directly onto the player to load)
            </p>
          </div>
        </div>
      )}

      {/* Camera Access Error Alert */}
      {cameraError && (
        <div className="w-full mt-4 bg-rose-955 bg-rose-950/40 border border-rose-800 p-3 rounded-sm flex items-start gap-3 text-rose-200 animate-in fade-in slide-in-from-top-2 duration-300 text-left">
          <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-[11px] font-bold uppercase tracking-tight font-mono">Lens Access Error</p>
            <p className="text-[10px] opacity-80 font-mono">{cameraError}</p>
          </div>
          <button 
            onClick={() => setCameraError(null)}
            className="text-rose-400 hover:text-white cursor-pointer"
          >
            <Square className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* ■ VHS CAMERA - SINGLE ROW COMPACT MODE */}
      {!isFullscreen && (
        <div className="w-full bg-zinc-900 border border-zinc-800 rounded-sm p-1.5 mt-2 px-3 shadow-md flex flex-row items-center justify-between gap-3 transition-all animate-none text-left">
          <div className="flex items-center gap-1.5 shrink-0 font-mono">
            <Camera className="w-3.5 h-3.5 text-sky-450 text-sky-400 shrink-0" />
            <span className="text-[9px] font-bold text-sky-455 uppercase tracking-wider">CAMERA:</span>
            {isCameraActive && (
              <span className="text-[8px] text-emerald-450 font-extrabold bg-emerald-950/20 px-1.5 py-px rounded-sm border border-emerald-900/60 animate-pulse">
                ● ON
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 justify-end flex-wrap sm:flex-nowrap font-mono">
            <button
              onClick={handleToggleCamera}
              className={`flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold rounded-sm transition-all border cursor-pointer relative top-0 active:top-px ${
                isCameraActive && settings.sourceType === "camera"
                  ? "bg-rose-950 text-rose-400 border-rose-900"
                  : "bg-emerald-700 text-zinc-950 hover:bg-emerald-600 font-extrabold"
              }`}
            >
              <RefreshCw className="w-2.5 h-2.5" />
              <span>{(isCameraActive && settings.sourceType === "camera") ? "OFF" : "ON"}</span>
            </button>

            <button
              onClick={handleCycleCamera}
              disabled={!isCameraActive}
              className={`flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold rounded-sm transition-all border relative top-0 active:top-px ${
                isCameraActive
                  ? "bg-zinc-800 border-zinc-700 hover:bg-zinc-755 text-sky-400 hover:text-sky-300 cursor-pointer"
                  : "bg-zinc-950/45 border-zinc-900 text-zinc-650 cursor-not-allowed"
              }`}
            >
              <RefreshCw className="w-2.5 h-2.5" />
              <span>LENS</span>
            </button>

            <button
              onClick={() => handleSettingsChange({ flipHorizontal: !settings.flipHorizontal })}
              className={`px-1.5 py-0.5 text-[9px] font-mono rounded-sm border transition-all relative top-0 active:top-px cursor-pointer ${
                settings.flipHorizontal
                  ? "bg-sky-955 bg-sky-955/40 border-sky-600 text-sky-300 font-bold"
                  : "bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-400"
              }`}
            >
              Flip X
            </button>

            <button
              onClick={() => handleSettingsChange({ flipVertical: !settings.flipVertical })}
              className={`px-1.5 py-0.5 text-[9px] font-mono rounded-sm border transition-all relative top-0 active:top-px cursor-pointer ${
                settings.flipVertical
                  ? "bg-sky-955 bg-sky-955/40 border-sky-600 text-sky-300 font-bold"
                  : "bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-400"
              }`}
            >
              Flip Y
            </button>
          </div>
        </div>
      )}
    </>
  );
};
