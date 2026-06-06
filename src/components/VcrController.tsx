/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  Tv, Play, Pause, Square, ShieldAlert, Camera, RefreshCw, Video 
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
  handleTogglePlay: () => void;
  handleStopVideo: () => void;
  handleSeekVideo: (time: number) => void;
  
  // Panic stabilization
  panicConfirm: boolean;
  setPanicConfirm: (val: boolean) => void;
  handleStabilizeImage: () => void;
  
  // Export states
  isRecording: boolean;
  recDuration: number;
  exportConfig: { format: string; preset: string };
  stopRecordingVideo: () => void;
  setShowExportModal: (val: boolean) => void;
}

export const VcrController: React.FC<VcrControllerProps> = ({
  isFullscreen,
  settings,
  handleSettingsChange,
  
  vidPlayState,
  vidCurrentTime,
  vidDuration,
  handleTogglePlay,
  handleStopVideo,
  handleSeekVideo,
  
  panicConfirm,
  setPanicConfirm,
  handleStabilizeImage,
  
  isRecording,
  recDuration,
  exportConfig,
  stopRecordingVideo,
  setShowExportModal,
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
      {/* MEDIA DECK */}
      {!isFullscreen && (
        <div className="w-full bg-zinc-900 border border-zinc-800 rounded-sm p-2 mt-2 px-3 shadow-lg font-mono text-xs flex flex-wrap items-center justify-center gap-3 transition-all">
          {/* Main Deck Controls Row */}
          <div className="flex items-center gap-3 w-full justify-center lg:w-auto">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-sky-450 uppercase tracking-wider shrink-0">
              <Tv className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
              <span>MASTER DECK</span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleTogglePlay}
                className={`flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold rounded-sm transition-all cursor-pointer ${
                  vidPlayState 
                    ? "bg-amber-500 text-zinc-950" 
                    : "bg-zinc-800 text-zinc-250 hover:bg-zinc-750"
                }`}
              >
                {vidPlayState ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
                <span>{vidPlayState ? "PAUSE" : "PLAY"}</span>
              </button>
              <button
                onClick={handleStopVideo}
                className="px-2 py-1 bg-zinc-800 hover:bg-rose-950/40 text-zinc-350 hover:text-rose-400 border border-zinc-750 rounded-sm transition-all"
              >
                <Square className="w-3 h-3 fill-current" />
              </button>
            </div>

            <div className="flex items-center gap-2 flex-grow max-w-[200px]">
              <input
                type="range"
                min="0"
                max={vidDuration || 1}
                step="0.1"
                value={vidCurrentTime}
                onChange={(e) => handleSeekVideo(Number(e.target.value))}
                className="w-full h-1 bg-zinc-950 accent-amber-500 rounded cursor-pointer"
                disabled={!vidDuration}
              />
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center gap-3 justify-center w-full lg:w-auto mt-1 lg:mt-0 pt-1 lg:pt-0 border-t lg:border-t-0 border-zinc-800">
            {/* PANIC STABILIZE */}
            <div className="flex items-center">
              {!panicConfirm ? (
                <button
                  onClick={() => setPanicConfirm(true)}
                  className="px-3 py-1 bg-sky-950 border border-sky-800 text-sky-300 rounded-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer uppercase text-[10px]"
                >
                  <ShieldAlert className="w-3 h-3 text-sky-400" />
                  <span>PANIC STABILIZE</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-sky-950 border border-sky-800 p-1 px-2 rounded-sm text-[10px]">
                  <span className="text-sky-300 font-bold">Stabilize?</span>
                  <button
                    onClick={handleStabilizeImage}
                    className="px-2 py-0.5 bg-sky-600 text-white font-extrabold rounded-sm cursor-pointer uppercase transition-all text-[9px]"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setPanicConfirm(false)}
                    className="px-1.5 py-0.5 bg-zinc-700 text-zinc-300 rounded-sm cursor-pointer uppercase transition-all text-[9px]"
                  >
                    No
                  </button>
                </div>
              )}
            </div>

            {/* RECORD & EXPORT */}
            {isRecording ? (
              <button
                onClick={stopRecordingVideo}
                className="flex items-center gap-1.5 bg-rose-950 border border-rose-800 px-3 py-1 text-[10px] font-bold text-white rounded-sm transition-all cursor-pointer"
              >
                <Square className="w-2.5 h-2.5 fill-current animate-pulse text-white" />
                <span>STOP ({parseSeconds(recDuration)})</span>
              </button>
            ) : (
              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-1.5 bg-rose-950 border border-rose-800 px-3 py-1 text-[10px] text-white rounded-sm transition-all cursor-pointer font-bold"
              >
                <Video className="w-2.5 h-2.5 text-white" />
                <span>🔴 RECORD & EXPORT</span>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};
