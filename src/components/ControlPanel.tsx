/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Tv, Sliders, Layers, SlidersHorizontal, Eye, 
  Volume2, Film, RefreshCw, Upload, Camera, Mic, Info,
  Play, Pause, Square, RotateCcw, VolumeX, ShieldAlert, Sparkles
} from "lucide-react";
import { SimulatorSettings } from "../types";
import { RETRO_STOCK_VIDEOS } from "../presets";

interface ControlPanelProps {
  settings: SimulatorSettings;
  onChange: (updates: Partial<SimulatorSettings>) => void;
  onApplyPreset: (key: string) => void;
  activePreset: string;
  presetsList: Record<string, { name: string; description: string }>;
  onUploadClick: () => void;
  onCameraClick: () => void;
  isCameraActive: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  
  // Media playback controls
  vidPlayState: boolean;
  vidCurrentTime: number;
  vidDuration: number;
  vidVolume: number;
  vidLoop: boolean;
  vidSpeed: number;
  vidHasCorsError: boolean;
  onTogglePlay: () => void;
  onStopVideo: () => void;
  onSeekVideo: (time: number) => void;
  onVolumeChange: (vol: number) => void;
  onSpeedChange: (speed: number) => void;
  onToggleLoop: () => void;
  onRandomize?: () => void;
  randomConfirm?: boolean;
  
  // Custom presets extensions
  customPresets?: Record<string, { label: string; description: string; settings: Partial<SimulatorSettings> }>;
  onSaveCustomPreset?: (name: string, description: string) => void;
  onDeleteCustomPreset?: (key: string, e: React.MouseEvent) => void;
  onExportPresets?: () => void;
  onImportPresets?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOverlayUploadClick?: () => void;
  uploadedMediaSrc: string | null;
  uploadedMediaType: "image" | "video" | null;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  settings,
  onChange,
  onApplyPreset,
  activePreset,
  presetsList,
  onUploadClick,
  onCameraClick,
  isCameraActive,
  activeTab,
  setActiveTab,
  
  vidPlayState,
  vidCurrentTime,
  vidDuration,
  vidVolume,
  vidLoop,
  vidSpeed,
  vidHasCorsError,
  onTogglePlay,
  onStopVideo,
  onSeekVideo,
  onVolumeChange,
  onSpeedChange,
  onToggleLoop,
  onRandomize,
  randomConfirm,
  
  customPresets = {},
  onSaveCustomPreset,
  onDeleteCustomPreset,
  onExportPresets,
  onImportPresets,
  onOverlayUploadClick,
  uploadedMediaSrc,
  uploadedMediaType,
}) => {
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [tempPresetName, setTempPresetName] = useState("");
  const [tempPresetDesc, setTempPresetDesc] = useState("");

  // Navigation tabs configuration
  const tabs = [
    { id: "signal", label: "Media & Signal", icon: Tv },
    { id: "wobble", label: "Wobble & Jitter", icon: Sliders },
    { id: "static", label: "Static & Drops", icon: Layers },
    { id: "color", label: "Color splits & Phase", icon: SlidersHorizontal },
    { id: "crt", label: "CRT & Ghosts", icon: Eye },
    { id: "osd", label: "Overlays & OSD Text", icon: Film },
  ];

  return (
    <div className="w-full flex flex-col bg-zinc-900 border border-zinc-800 rounded-sm overflow-hidden shadow-2xl h-full font-sans">
      {/* 1. Header Toolbar */}
      <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-mono text-emerald-400 tracking-wider font-semibold uppercase">
            Simulation Matrix System
          </span>
        </div>
        
        {/* Preset Selector and Randomize trigger */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <span className="text-xs text-zinc-400 font-medium font-mono">Preset:</span>
          <select
            value={activePreset}
            onChange={(e) => onApplyPreset(e.target.value)}
            className="text-xs bg-zinc-900 border border-zinc-700 text-zinc-100 px-2 py-1.5 rounded focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono cursor-pointer"
          >
            <optgroup label="Factory Presets" className="bg-zinc-950 text-sky-400 font-bold font-mono">
              {Object.entries(presetsList).map(([key, item]) => {
                const p = item as { name: string; description: string };
                return (
                  <option key={key} value={key} className="bg-zinc-900 text-zinc-100 font-sans font-normal">
                    {p.name}
                  </option>
                );
              })}
            </optgroup>
            {Object.keys(customPresets).length > 0 && (
              <optgroup label="Custom User Presets" className="bg-zinc-950 text-emerald-400 font-bold font-mono">
                {Object.entries(customPresets).map(([key, item]) => {
                  const p = item as { label: string; description: string };
                  return (
                    <option key={key} value={key} className="bg-zinc-900 text-emerald-300 font-sans font-normal">
                      ⭐ {p.label}
                    </option>
                  );
                })}
              </optgroup>
            )}
          </select>

          {onRandomize && (
            <button
              onClick={onRandomize}
              className={`px-2.5 py-1.5 bg-gradient-to-r transition-all rounded font-mono text-[10px] font-bold uppercase cursor-pointer flex items-center gap-1 shadow-2xl active:scale-95 ${
                randomConfirm 
                  ? "from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white animate-pulse" 
                  : "from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white shadow-[0_0_10px_rgba(236,72,153,0.3)] hover:shadow-[0_0_15px_rgba(236,72,153,0.5)]"
              }`}
              title={randomConfirm ? "Confirm: Proceed with full signal randomization?" : "Procedurally randomize all retro VHS coefficients, wave speeds, skews, and color-splits at random!"}
            >
              {randomConfirm ? (
                <>
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>CONFIRM RANDOM?</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>🎲 RANDOMIZE</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Preset Details Banner */}
      <div className="px-4 py-2.5 bg-zinc-950/50 border-b border-zinc-800 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-zinc-400 leading-relaxed font-mono">
          {customPresets[activePreset]?.description || presetsList[activePreset]?.description || "Select a preset setup to preconfigure the retro video parameters instantly."}
        </p>
      </div>

      {/* Custom Presets QoL Toolbar */}
      <div className="px-4 py-2 bg-zinc-950 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-[10px] font-mono text-zinc-300 uppercase tracking-wider font-semibold">User Presets:</span>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap text-left">
          {/* Save input form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (onSaveCustomPreset && tempPresetName) {
                onSaveCustomPreset(tempPresetName, tempPresetDesc || "User saved custom template");
                setTempPresetName("");
                setTempPresetDesc("");
                setShowSaveForm(false);
              }
            }}
            className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap"
          >
            {showSaveForm ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                <input
                  type="text"
                  placeholder="Preset label (e.g., Chillwave 92)..."
                  value={tempPresetName}
                  onChange={(e) => setTempPresetName(e.target.value)}
                  className="text-[10px] font-mono bg-zinc-900 border border-emerald-800 text-zinc-100 rounded px-2 h-7 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-36"
                  maxLength={24}
                  required
                />
                <input
                  type="text"
                  placeholder="Optional brief description..."
                  value={tempPresetDesc}
                  onChange={(e) => setTempPresetDesc(e.target.value)}
                  className="text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 rounded px-2 h-7 focus:outline-none w-36"
                  maxLength={60}
                />
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[9px] font-bold px-2 py-1 rounded h-7 cursor-pointer transition-all uppercase"
                >
                  SAVE
                </button>
                <button
                  type="button"
                  onClick={() => setShowSaveForm(false)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-mono text-[9px] px-2 py-1 rounded h-7 cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowSaveForm(true)}
                className="bg-emerald-950/40 hover:bg-emerald-950/80 border border-emerald-900 text-emerald-400 font-mono text-[10px] font-bold px-2.5 py-1 rounded cursor-pointer transition-all flex items-center gap-1 uppercase"
              >
                <span>💾 Save Custom Preset</span>
              </button>
            )}
          </form>

          {/* Export custom presets JSON */}
          <button
            onClick={onExportPresets}
            type="button"
            className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-700 text-zinc-350 font-mono text-[10px] px-2 py-1 rounded cursor-pointer transition-all h-7"
            title="Download your custom presets as a backup JSON file."
          >
            📤 Export File
          </button>

          {/* Import custom presets JSON */}
          <label className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-700 text-zinc-350 font-mono text-[10px] px-2 py-1 rounded cursor-pointer transition-all h-7 flex items-center shrink-0" title="Load custom presets from a backup JSON file.">
            Import File
            <input
              type="file"
              accept=".json"
              onChange={onImportPresets}
              className="hidden"
            />
          </label>

          {/* Delete active Custom Preset */}
          {activePreset.startsWith("custom_") && (
            <button
              onClick={(e) => onDeleteCustomPreset && onDeleteCustomPreset(activePreset, e)}
              type="button"
              className="bg-rose-950/40 hover:bg-rose-950/80 border border-rose-900/60 text-rose-400 font-mono text-[10px] font-bold px-2 py-1 rounded cursor-pointer transition-all flex items-center gap-1 h-7"
            >
              🗑️ Delete
            </button>
          )}
        </div>
      </div>

      {/* 2. Side/Top Tab Navigators */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-3 gap-1.5 p-2.5 bg-zinc-950 border-b border-zinc-800">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-2.5 py-2 text-xs font-mono rounded-sm border transition-all cursor-pointer ${
                isActive
                  ? "border-sky-500 text-sky-400 bg-zinc-950/30 shadow-[0_0_10px_rgba(56,189,248,0.15)] font-bold"
                  : "border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0 text-sky-500/80" />
              <span className="truncate">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Sliders Panels content */}
      <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-zinc-900/50 min-h-0 [scrollbar-width:thin] [scrollbar-color:theme(colors.zinc.800)_theme(colors.zinc.950)]">
        
        {/* TAB 1: MEDIA & SIGNAL */}
        {activeTab === "signal" && (
          <div className="space-y-4">
            <h3 className="text-xs font-mono uppercase text-sky-450 tracking-wider border-b border-zinc-800 pb-1.5 font-bold">
              Input Signal Configuration
            </h3>

            <p className="text-[10px] font-mono text-amber-500 leading-normal bg-amber-950/25 p-2.5 border border-amber-900/40 rounded-sm">
              ⚡ <strong>Performance Tip:</strong> Slower configurations can slow down 30 FPS recording exports. Adjusting the <strong>CRT Decimation Downscaler (pixelScale)</strong> to 2 or 3 gives a highly authentic, period-accurate 240p analog lofi look while running up to <strong>400% faster</strong>!
            </p>

            {/* Input Type selection */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { id: "colorbars", label: "SMPTE Bars" },
                { id: "grid", label: "Align Grid" },
                { id: "bluescreen", label: "VCR Blue" },
                { id: "transparent", label: "Transparent Layer" },
                { id: "solid", label: "Solid Field" },
                { id: "media", label: "Live / Media" }
              ].map((src) => (
                <button
                  key={src.id}
                  onClick={() => onChange({ sourceType: src.id as any })}
                  className={`px-3 py-2 text-xs font-mono rounded-sm border transition-all text-left ${
                    settings.sourceType === src.id
                      ? "bg-sky-950 border-sky-505 text-sky-300 shadow-md font-semibold"
                      : "bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-300"
                  }`}
                >
                  {src.label}
                </button>
              ))}
            </div>

            {/* Custom Background Color Field */}
            {settings.sourceType === "solid" && (
              <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-sm border border-zinc-800">
                <span className="text-xs font-mono text-zinc-300">Background Hex Color:</span>
                <input
                  type="color"
                  value={settings.sourceColor}
                  onChange={(e) => onChange({ sourceColor: e.target.value })}
                  className="w-10 h-6 bg-transparent border-0 cursor-pointer rounded-sm"
                />
              </div>
            )}

            {/* Custom uploads and Webcam feed selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={onUploadClick}
                className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-sm hover:border-zinc-700 text-sky-300 transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4 text-sky-400" />
                <span>Upload Custom Media Files</span>
              </button>

              <button
                onClick={onCameraClick}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-mono border rounded-sm transition-all cursor-pointer ${
                  isCameraActive
                    ? "bg-rose-950 border-rose-505 text-rose-300 font-semibold"
                    : "bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-emerald-400"
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>{isCameraActive ? "Disconnect Video Feed" : "Source live Camera Feed"}</span>
              </button>
            </div>

            {/* 💾 VHS CASSETTE PLAYER DECK CONTROLS */}
            {["webvideo", "upload", "camera"].includes(settings.sourceType) && (
              <div className="space-y-3.5 p-4 bg-zinc-950/80 rounded-sm border border-zinc-800 shadow-md">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                  <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-sky-450 uppercase">
                    <span className="w-2 h-2 rounded-full bg-sky-500 shadow-[0_0_6px_rgba(56,189,248,0.6)] animate-pulse" />
                    <span>📼 Integrated VCR Tape Deck</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 font-semibold tracking-wider">
                    {vidPlayState ? "● VHS RUNNING" : "■ VHS STOPPED"}
                  </span>
                </div>

                {/* Warning for YouTube or potential CORS links */}
                {settings.sourceType === "webvideo" && (settings.webVideoSrc.includes("youtube.com") || settings.webVideoSrc.includes("youtu.be")) && (
                  <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-sm flex gap-2.5">
                    <ShieldAlert className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-[11px] font-mono leading-relaxed text-amber-300">
                      <span className="font-bold">YouTube CORS Policy Restriction:</span> YouTube prevents direct pixel-level reading in canvas engines. 
                      Please select an <span className="text-sky-300 font-bold">Online Loop Preset</span>, paste a direct web file link (ending in <span className="text-emerald-300">.mp4</span>), or upload your local clip!
                    </div>
                  </div>
                )}

                {vidHasCorsError && settings.sourceType === "webvideo" && !(settings.webVideoSrc.includes("youtube.com") || settings.webVideoSrc.includes("youtu.be")) && (
                  <div className="p-3 bg-rose-950/40 border border-rose-900/60 rounded-sm flex gap-2.5">
                    <ShieldAlert className="w-4.5 h-4.5 text-rose-500 shrink-0 mt-0.5" />
                    <div className="text-[11px] font-mono leading-relaxed text-rose-300">
                      <span className="font-bold">Cross-Origin (CORS) Warning:</span> This video URL does not authorize canvas pixel reads. 
                      To apply CRT static/jitter, use a CORS-friendly URL or download it and click "Upload Custom Media Files" to process offline!
                    </div>
                  </div>
                )}

                {/* Progress / Seek bar */}
                {vidDuration > 0 && (
                  <div className="space-y-1.5 font-mono">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Tape Elapsed:</span>
                      <span className="text-sky-400 bg-sky-950/40 px-2 py-0.5 rounded font-bold">
                        {Math.floor(vidCurrentTime / 60)}:{String(Math.floor(vidCurrentTime % 60)).padStart(2, "0")} / {Math.floor(vidDuration / 60)}:{String(Math.floor(vidDuration % 60)).padStart(2, "0")}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={vidDuration || 100}
                      step="0.1"
                      value={vidCurrentTime}
                      onChange={(e) => onSeekVideo(Number(e.target.value))}
                      className="w-full h-1 bg-slate-900 accent-sky-500 rounded appearance-none cursor-pointer animate-none"
                    />
                  </div>
                )}

                {/* Play, Pause, Stop buttons */}
                <div className="flex items-center gap-2 pt-1 font-mono">
                  <button
                    onClick={onTogglePlay}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs bg-slate-900 hover:bg-slate-800 border border-slate-750 text-slate-100 transition-all font-bold cursor-pointer"
                  >
                    {vidPlayState ? <Pause className="w-3.5 h-3.5 text-sky-400 fill-sky-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />}
                    <span>{vidPlayState ? "PAUSE" : "PLAY"}</span>
                  </button>

                  <button
                    onClick={onStopVideo}
                    className="px-4 py-1.5 rounded text-xs bg-slate-900 hover:bg-slate-800 border border-slate-755 text-rose-400 hover:text-rose-300 transition-all cursor-pointer"
                    title="Stop & Rewind Tape"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                  </button>

                  <button
                    onClick={onToggleLoop}
                    className={`px-3 py-1.5 rounded text-xs border transition-all cursor-pointer ${
                      vidLoop
                        ? "bg-sky-950 border-sky-500 text-sky-300 font-bold"
                        : "bg-slate-900 border-slate-750 text-slate-500 hover:text-slate-400"
                    }`}
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${vidLoop ? "animate-spin [animation-duration:8s]" : ""}`} />
                  </button>
                </div>

                {/* Speed & Volume controls */}
                <div className="grid grid-cols-2 gap-3.5 pt-1.5 border-t border-slate-900">
                  {/* Media volume */}
                  <div className="space-y-1 font-mono">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Sound Volume:</span>
                      <span className="text-sky-300 font-bold">{Math.round(vidVolume * 100)}%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <VolumeX className="w-3.5 h-3.5 text-slate-500 mr-0.5" />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={vidVolume}
                        onChange={(e) => onVolumeChange(Number(e.target.value))}
                        className="w-full h-1 bg-slate-900 accent-sky-500 rounded appearance-none cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Playback rate */}
                  <div className="space-y-1 font-mono">
                    {uploadedMediaType === "image" && uploadedMediaSrc?.toLowerCase().endsWith(".gif") ? (
                      <>
                        <div className="flex justify-between text-[11px] text-slate-400">
                          <span>GIF Anim Speed:</span>
                          <span className="text-sky-350 font-bold">{settings.gifPlaybackSpeed.toFixed(1)}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="5.0"
                          step="0.1"
                          value={settings.gifPlaybackSpeed}
                          onChange={(e) => onChange({ gifPlaybackSpeed: Number(e.target.value) })}
                          className="w-full h-1 bg-slate-900 accent-sky-500 rounded appearance-none cursor-pointer mt-2"
                        />
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between text-[11px] text-slate-400">
                          <span>Feed Speed:</span>
                          <span className="text-sky-350 font-bold">{vidSpeed}x</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1">
                          {[0.5, 1.0, 1.5, 2.0].map((rate) => (
                            <button
                              key={rate}
                              onClick={() => onSpeedChange(rate)}
                              className={`py-0.5 text-[9px] font-mono rounded border transition-all ${
                                vidSpeed === rate
                                  ? "bg-sky-950 border-sky-600 text-sky-300 font-bold"
                                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              {rate}x
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-800 space-y-4">
              <h4 className="text-xs font-mono text-slate-400">Fitting & Export Dimensions</h4>
              
              {/* Zoom toggle selection */}
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-slate-300 font-medium">Aspect Scaling Layout:</span>
                <div className="flex gap-1.5 p-0.5 bg-slate-950 rounded border border-slate-800">
                  <button
                    onClick={() => onChange({ sourceZoom: "cover" })}
                    className={`px-2 py-1 text-[11px] font-mono rounded ${
                      settings.sourceZoom === "cover" ? "bg-slate-800 text-sky-400" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Crop-Cover
                  </button>
                  <button
                    onClick={() => onChange({ sourceZoom: "contain" })}
                    className={`px-2 py-1 text-[11px] font-mono rounded ${
                      settings.sourceZoom === "contain" ? "bg-slate-800 text-sky-400" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Fit-Contain
                  </button>
                </div>
              </div>

              {/* Target Resolutions select constraints */}
              <div className="flex items-center justify-between gap-4 py-1">
                <span className="text-xs text-slate-300 font-medium">Target Grid Resolution:</span>
                <select
                  value={`${settings.canvasWidth}x${settings.canvasHeight}`}
                  onChange={(e) => {
                    const [w, h] = e.target.value.split("x").map(Number);
                    onChange({ canvasWidth: w, canvasHeight: h });
                  }}
                  className="text-xs font-mono bg-slate-950 border border-slate-800 text-slate-200 px-2 py-1.5 rounded focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="640x480">Vintage Standard (640x480 - 4:3)</option>
                  <option value="800x600">Retro SVGA (800x600 - 4:3)</option>
                  <option value="1024x768">High Sharp TV (1024x768 - 4:3)</option>
                  <option value="1280x720">HD Retro Wide (1280x720 - 16:9)</option>
                </select>
              </div>

              {/* Export Video Format select */}
              <div className="flex items-center justify-between gap-4 py-1">
                <span className="text-xs text-slate-300 font-medium">Export Video Container:</span>
                <select
                  value={settings.exportFormat}
                  onChange={(e) => {
                    onChange({ exportFormat: e.target.value as "webm" | "mp4" });
                  }}
                  className="text-xs font-mono bg-slate-950 border border-slate-800 text-slate-200 px-2 py-1.5 rounded focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="webm">WebM (VP9 + Opus)</option>
                  <option value="mp4">MP4 (H.264 - If Supported)</option>
                </select>
              </div>

              {/* Pixel Resolution Scaling Downscaler */}
              <div className="space-y-1.5 py-1.5 border-t border-slate-900 pt-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300">Analog Tape Capture Scale:</span>
                  <span className="text-sky-400 bg-sky-950/60 px-1.5 py-0.5 rounded font-bold">
                    {settings.pixelScale === 1 ? "1x (Native Sharp)" : `${settings.pixelScale}x (Pixelated ${Math.round(settings.canvasHeight / settings.pixelScale)}p Feel)`}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="8"
                  step="1"
                  value={settings.pixelScale || 1}
                  onChange={(e) => onChange({ pixelScale: Number(e.target.value) })}
                  className="w-full accent-sky-500 h-1 bg-slate-900 rounded appearance-none cursor-pointer"
                />
                <p className="text-[10px] font-mono text-slate-500 leading-normal">
                  Simulates low-quality cathode ray tubes by decimation rendering, merging pixels into large physical TV scanlines!
                </p>
              </div>

              {/* Overlay Graphics were moved to the consolidated Overlay tab */}
            </div>
          </div>
        )}

        {/* TAB 2: WOBBLE & JITTER */}
        {activeTab === "wobble" && (
          <div className="space-y-4">
            <h3 className="text-xs font-mono uppercase text-sky-400 tracking-wider border-b border-slate-800 pb-1.5 font-bold">
              Magnetic Wobbles & Subharmonic Drifts
            </h3>

            {/* Wobble Speed */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300">VCR Mechanical Motor Speed:</span>
                <span className="text-sky-300 bg-sky-950/60 px-1.5 py-0.5 rounded font-bold">
                  {settings.globalWobbleSpeed.toFixed(1)}x
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="3"
                step="0.1"
                value={settings.globalWobbleSpeed}
                onChange={(e) => onChange({ globalWobbleSpeed: Number(e.target.value) })}
                className="w-full accent-sky-500 bg-slate-950 h-5 border-none outline-none rounded"
              />
            </div>

            {/* Slider list X Axis & Y Axis amplitudes */}
            <div className="p-3 bg-slate-950/60 rounded-md border border-slate-800 space-y-4">
              <h4 className="text-xs font-mono text-slate-400 uppercase font-semibold">
                X-Axis Sweep (Horizontal Waves Bending)
              </h4>

              {/* Wobble Amp X */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-300">Wobble Amplitude X (displacement):</span>
                  <span className="text-sky-400">{settings.globalWobbleAmpX.toFixed(1)}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="35"
                  step="0.5"
                  value={settings.globalWobbleAmpX}
                  onChange={(e) => onChange({ globalWobbleAmpX: Number(e.target.value) })}
                  className="w-full accent-sky-500 bg-slate-900 h-1 rounded"
                />
              </div>

              {/* Wobble Freq X */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-300">Wobble Frequency X (wave count):</span>
                  <span className="text-sky-400">{settings.globalWobbleFreqX.toFixed(1)}Hz</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="20"
                  step="0.5"
                  value={settings.globalWobbleFreqX}
                  onChange={(e) => onChange({ globalWobbleFreqX: Number(e.target.value) })}
                  className="w-full accent-sky-500 bg-slate-900 h-1 rounded"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-md border border-slate-800 space-y-4">
              <h4 className="text-xs font-mono text-slate-400 uppercase font-semibold">
                Y-Axis Sync Jitter (Screen Jump & Roll)
              </h4>

              {/* Wobble Amp Y */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-300">Wobble Amplitude Y (displace v-sync):</span>
                  <span className="text-sky-400">{settings.globalWobbleAmpY.toFixed(1)}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="0.2"
                  value={settings.globalWobbleAmpY}
                  onChange={(e) => onChange({ globalWobbleAmpY: Number(e.target.value) })}
                  className="w-full accent-sky-500 bg-slate-900 h-1 rounded"
                />
              </div>

              {/* Wobble Freq Y */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-300">Wobble Frequency Y (oscillation rate):</span>
                  <span className="text-sky-400">{settings.globalWobbleFreqY.toFixed(1)}Hz</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="12"
                  step="0.2"
                  value={settings.globalWobbleFreqY}
                  onChange={(e) => onChange({ globalWobbleFreqY: Number(e.target.value) })}
                  className="w-full accent-sky-500 bg-slate-900 h-1 rounded"
                />
              </div>
            </div>

            {/* High frequency line micro jitter controls */}
            <div className="p-3 bg-slate-950/60 rounded-md border border-slate-800 space-y-4">
              <h4 className="text-xs font-mono text-slate-400 uppercase font-semibold">
                High-Frequency Scanline Shaking
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-slate-300">
                    <span>Lines Jitter Size:</span>
                    <span>{settings.lineJitterStrength.toFixed(1)}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="12"
                    step="0.2"
                    value={settings.lineJitterStrength}
                    onChange={(e) => onChange({ lineJitterStrength: Number(e.target.value) })}
                    className="w-full accent-sky-500 bg-slate-900 h-1.5 rounded"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-slate-300">
                    <span>Shaking Frequency:</span>
                    <span>{Math.round(settings.lineJitterFrequency * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.8"
                    step="0.05"
                    value={settings.lineJitterFrequency}
                    onChange={(e) => onChange({ lineJitterFrequency: Number(e.target.value) })}
                    className="w-full accent-sky-500 bg-slate-900 h-1.5 rounded"
                  />
                </div>
              </div>
            </div>

            {/* Sinks Skews & Rolling */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Head Switch Bend (H-Sync) */}
              <div className="space-y-2 p-3 bg-slate-950/60 rounded border border-slate-800">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300">Tape Head Sync Bend:</span>
                  <span className="text-pink-400 font-bold">{settings.hSyncSkew.toFixed(1)}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="0.5"
                  value={settings.hSyncSkew}
                  onChange={(e) => onChange({ hSyncSkew: Number(e.target.value) })}
                  className="w-full accent-pink-500 bg-slate-900 h-1 rounded"
                />
              </div>

              {/* VSync vertical rolling */}
              <div className="space-y-2 p-3 bg-slate-950/60 rounded border border-slate-800">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300">V-Sync Roll Slip Rate:</span>
                  <span className="text-rose-400 font-bold">{settings.vSyncRoll.toFixed(3)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5.0"
                  step="0.005"
                  value={settings.vSyncRoll}
                  onChange={(e) => onChange({ vSyncRoll: Number(e.target.value) })}
                  className="w-full accent-rose-500 bg-slate-900 h-1 rounded"
                />
              </div>
            </div>

            {/* Global & Granular Sine-Wave Warping (Wavy Wobble) Block */}
            <div className="p-3 bg-slate-950/60 rounded-md border border-slate-800 space-y-4">
              <h4 className="text-xs font-mono text-sky-400 uppercase font-bold tracking-wide border-b border-slate-900 pb-1.5">
                Analog Tape Warping & Wavy Instability
              </h4>
              <p className="text-[10px] font-mono text-slate-500 leading-normal">
                Granular mechanical wave displacement sliders that wobble all shapes and video tracks in a wavy sinusoidal pattern globally.
              </p>

              {/* Horizontal Wave Controls */}
              <div className="space-y-3.5 border-t border-slate-900 pt-3">
                <span className="text-xs font-semibold text-slate-300 font-mono">Horizontal Wave Wobble (X-Axis):</span>
                
                {/* Amplitude */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Wave Amplitude (Waviness X):</span>
                    <span className="text-sky-400 font-bold">{settings.hWaveAmp.toFixed(1)}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="0.5"
                    value={settings.hWaveAmp}
                    onChange={(e) => onChange({ hWaveAmp: Number(e.target.value) })}
                    className="w-full accent-sky-500 bg-slate-905 h-1 rounded"
                  />
                </div>

                {/* Frequency */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Wave Frequency (Wave Density):</span>
                    <span className="text-sky-400 font-bold">{settings.hWaveFreq.toFixed(3)}px</span>
                  </div>
                  <input
                    type="range"
                    min="0.001"
                    max="0.1"
                    step="0.001"
                    value={settings.hWaveFreq}
                    onChange={(e) => onChange({ hWaveFreq: Number(e.target.value) })}
                    className="w-full accent-sky-500 bg-slate-905 h-1 rounded"
                  />
                </div>

                {/* Speed */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Wave Speed (Oscillation Speed):</span>
                    <span className="text-sky-400 font-bold">{settings.hWaveSpeed.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.2"
                    value={settings.hWaveSpeed}
                    onChange={(e) => onChange({ hWaveSpeed: Number(e.target.value) })}
                    className="w-full accent-sky-500 bg-slate-905 h-1 rounded"
                  />
                </div>
              </div>

              {/* Vertical Wave Controls */}
              <div className="space-y-3.5 border-t border-slate-900 pt-3">
                <span className="text-xs font-semibold text-slate-300 font-mono">Vertical Wave Wobble (Y-Axis):</span>
                
                {/* Amplitude */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Wave Amplitude (Waviness Y):</span>
                    <span className="text-sky-400 font-bold">{settings.vWaveAmp.toFixed(1)}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="0.5"
                    value={settings.vWaveAmp}
                    onChange={(e) => onChange({ vWaveAmp: Number(e.target.value) })}
                    className="w-full accent-sky-500 bg-slate-905 h-1 rounded"
                  />
                </div>

                {/* Frequency */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Wave Frequency (Wave Density):</span>
                    <span className="text-sky-400 font-bold">{settings.vWaveFreq.toFixed(3)}px</span>
                  </div>
                  <input
                    type="range"
                    min="0.001"
                    max="0.1"
                    step="0.001"
                    value={settings.vWaveFreq}
                    onChange={(e) => onChange({ vWaveFreq: Number(e.target.value) })}
                    className="w-full accent-sky-500 bg-slate-905 h-1 rounded"
                  />
                </div>

                {/* Speed */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Wave Speed (Oscillation Speed):</span>
                    <span className="text-sky-400 font-bold">{settings.vWaveSpeed.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.2"
                    value={settings.vWaveSpeed}
                    onChange={(e) => onChange({ vWaveSpeed: Number(e.target.value) })}
                    className="w-full accent-sky-500 bg-slate-905 h-1 rounded"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: STATIC & TAPE DROPOUTS */}
        {activeTab === "static" && (
          <div className="space-y-4">
            <h3 className="text-xs font-mono uppercase text-sky-400 tracking-wider border-b border-slate-800 pb-1.5 font-bold">
              Magnetic Oxide Noise & Dropouts
            </h3>

            {/* Tape Snow / Fuzz Opacity */}
            <div className="space-y-2 p-3 bg-slate-950/60 rounded border border-slate-800">
              <div className="flex justify-between text-xs font-mono text-slate-300">
                <span>Tape Fuzz Snow Transparency:</span>
                <span className="text-teal-400 bg-slate-900 px-2 py-0.5 rounded font-bold">
                  {Math.round(settings.fuzzOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="0.9"
                step="0.01"
                value={settings.fuzzOpacity}
                onChange={(e) => onChange({ fuzzOpacity: Number(e.target.value) })}
                className="w-full accent-teal-500 bg-slate-950 h-5"
              />
            </div>

            {/* Static Granular Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 p-3 bg-slate-950/40 rounded border border-slate-800">
                <div className="flex justify-between text-[11px] font-mono text-slate-300">
                  <span>Static Snow Dot Size:</span>
                  <span className="text-teal-400">{settings.fuzzSize}px</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={settings.fuzzSize}
                  onChange={(e) => onChange({ fuzzSize: Number(e.target.value) })}
                  className="w-full accent-teal-500 bg-slate-900 h-1 rounded"
                />
              </div>

              <div className="space-y-1.5 p-3 bg-slate-950/40 rounded border border-slate-800">
                <div className="flex justify-between text-[11px] font-mono text-slate-300">
                  <span>Static Noise Speed:</span>
                  <span className="text-teal-400">{settings.fuzzSpeed.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="3"
                  step="0.1"
                  value={settings.fuzzSpeed}
                  onChange={(e) => onChange({ fuzzSpeed: Number(e.target.value) })}
                  className="w-full accent-teal-500 bg-slate-900 h-1 rounded"
                />
              </div>
            </div>

            {/* Colors ratio inside static */}
            <div className="space-y-1.5 p-3 bg-slate-950/60 rounded border border-slate-800">
              <div className="flex justify-between text-xs font-mono text-slate-300">
                <span>Color Chrominance Noise Blend (RF vs Thermal):</span>
                <span className="text-teal-400">{Math.round(settings.fuzzColorRatio * 100)}% Color</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.fuzzColorRatio}
                onChange={(e) => onChange({ fuzzColorRatio: Number(e.target.value) })}
                className="w-full accent-teal-500 bg-slate-900 h-1.5 rounded"
              />
            </div>

            <h4 className="text-xs font-mono uppercase text-sky-400 tracking-wider border-b border-slate-800 pt-3 pb-1.5 font-bold">
              VHS Tape Oxide Scratches & Dropouts
            </h4>

            {/* Needle Noise Dropouts */}
            <div className="space-y-2 p-3 bg-slate-950/60 rounded border border-slate-800">
              <div className="flex justify-between text-xs font-mono text-slate-300">
                <span>Tape Dropout Streaks (Needle Drops):</span>
                <span className="text-teal-400 font-bold">{Math.round(settings.needleNoise * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.needleNoise}
                onChange={(e) => onChange({ needleNoise: Number(e.target.value) })}
                className="w-full accent-teal-500 bg-slate-950 h-5"
              />
            </div>

            {/* Major Tracking distortion blocks detailed sliders */}
            <div className="p-3 bg-slate-950/60 rounded border border-slate-800 space-y-4">
              <h4 className="text-xs font-mono text-yellow-500 font-bold uppercase">
                Hardware Tracking Alignment Errors
              </h4>

              {/* Tracking Block Center Y */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono text-slate-300">
                  <span>Tracking Block Position (Vertical Center):</span>
                  <span>{Math.round(settings.trackingBlockY * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.0"
                  step="0.01"
                  value={settings.trackingBlockY}
                  onChange={(e) => onChange({ trackingBlockY: Number(e.target.value) })}
                  className="w-full accent-yellow-500 bg-slate-900 h-1 rounded"
                />
              </div>

              {/* Vertical Scroll Auto Speed */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono text-slate-300">
                  <span>Automatic Head Roll Speed:</span>
                  <span className={`font-bold ${settings.trackingScrollSpeed === 0 ? "text-slate-500" : (settings.trackingScrollSpeed > 0 ? "text-emerald-400" : "text-rose-400")}`}>
                    {settings.trackingScrollSpeed === 0 ? "STATIONARY" : (settings.trackingScrollSpeed > 0 ? "SCROLLING UP" : "SCROLLING DOWN")}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-1">
                   <span className="text-[10px] text-rose-500 font-bold font-mono opacity-60">DN</span>
                   <input
                     type="range"
                     min="-40.0"
                     max="40.0"
                     step="1.0"
                     value={settings.trackingScrollSpeed}
                     onChange={(e) => onChange({ trackingScrollSpeed: Number(e.target.value) })}
                     className="flex-1 accent-yellow-500 bg-slate-900 h-1.5 rounded appearance-none cursor-pointer"
                   />
                   <span className="text-[10px] text-emerald-500 font-bold font-mono opacity-60">UP</span>
                </div>
              </div>

              {/* Tracking Block height */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono text-slate-300">
                  <span>Tracking Block Size (Height):</span>
                  <span>{Math.round(settings.trackingBlockHeight * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.01"
                  max="0.5"
                  step="0.01"
                  value={settings.trackingBlockHeight}
                  onChange={(e) => onChange({ trackingBlockHeight: Number(e.target.value) })}
                  className="w-full accent-yellow-500 bg-slate-900 h-1 rounded"
                />
              </div>

              {/* Displacement X displacement strength */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono text-slate-300">
                  <span>Edge Jaggedness Displacement (Tracking X):</span>
                  <span>{settings.trackingDisplacementX}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="1"
                  value={settings.trackingDisplacementX}
                  onChange={(e) => onChange({ trackingDisplacementX: Number(e.target.value) })}
                  className="w-full accent-yellow-500 bg-slate-900 h-1 rounded"
                />
              </div>

              {/* Tracking line count & Noise triggers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-slate-400 block">Interference Lines Count:</span>
                  <input
                    type="number"
                    min="0"
                    max="15"
                    value={settings.trackingLinesCount}
                    onChange={(e) => onChange({ trackingLinesCount: Math.max(0, Number(e.target.value)) })}
                    className="w-full text-xs font-mono bg-slate-900 border border-slate-800 text-slate-200 px-2.5 py-1.5 rounded focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-slate-400 block">Snow Interference Level:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.trackingNoiseDensity}
                    onChange={(e) => onChange({ trackingNoiseDensity: Number(e.target.value) })}
                    className="w-full accent-yellow-500 bg-slate-900 h-5"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CHROMATIC SEPARATION & COLOR PHASE */}
        {activeTab === "color" && (
          <div className="space-y-4">
            <h3 className="text-xs font-mono uppercase text-sky-400 tracking-wider border-b border-slate-800 pb-1.5 font-bold">
              Subpixel Chromatic Aberration X/Y Controls
            </h3>

            {/* Red Channel displacements */}
            <div className="p-3 bg-red-950/15 border border-red-900/40 rounded-md space-y-3">
              <h4 className="text-xs font-mono font-bold text-red-400 uppercase">Red Channel Offsets</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-slate-300">
                    <span>Shift Red Horizontal X:</span>
                    <span className="text-red-400">{settings.chromaOffsetRedX.toFixed(1)}px</span>
                  </div>
                  <input
                    type="range"
                    min="-25"
                    max="25"
                    step="0.5"
                    value={settings.chromaOffsetRedX}
                    onChange={(e) => onChange({ chromaOffsetRedX: Number(e.target.value) })}
                    className="w-full accent-red-500 bg-slate-950 h-1 rounded"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-slate-300">
                    <span>Shift Red Vertical Y:</span>
                    <span className="text-red-400">{settings.chromaOffsetRedY.toFixed(1)}px</span>
                  </div>
                  <input
                    type="range"
                    min="-25"
                    max="25"
                    step="0.5"
                    value={settings.chromaOffsetRedY}
                    onChange={(e) => onChange({ chromaOffsetRedY: Number(e.target.value) })}
                    className="w-full accent-red-500 bg-slate-950 h-1 rounded"
                  />
                </div>
              </div>
            </div>

            {/* Blue Channel displacements */}
            <div className="p-3 bg-blue-950/15 border border-blue-900/40 rounded-md space-y-3">
              <h4 className="text-xs font-mono font-bold text-blue-400 uppercase">Blue Channel Offsets</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-slate-300">
                    <span>Shift Blue Horizontal X:</span>
                    <span className="text-blue-400">{settings.chromaOffsetBlueX.toFixed(1)}px</span>
                  </div>
                  <input
                    type="range"
                    min="-25"
                    max="25"
                    step="0.5"
                    value={settings.chromaOffsetBlueX}
                    onChange={(e) => onChange({ chromaOffsetBlueX: Number(e.target.value) })}
                    className="w-full accent-blue-500 bg-slate-950 h-1 rounded"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-slate-300">
                    <span>Shift Blue Vertical Y:</span>
                    <span className="text-blue-400">{settings.chromaOffsetBlueY.toFixed(1)}px</span>
                  </div>
                  <input
                    type="range"
                    min="-25"
                    max="25"
                    step="0.5"
                    value={settings.chromaOffsetBlueY}
                    onChange={(e) => onChange({ chromaOffsetBlueY: Number(e.target.value) })}
                    className="w-full accent-blue-500 bg-slate-950 h-1 rounded"
                  />
                </div>
              </div>
            </div>

            {/* Green Channel displacements */}
            <div className="p-3 bg-emerald-950/15 border border-emerald-900/40 rounded-md space-y-3">
              <h4 className="text-xs font-mono font-bold text-emerald-400 uppercase">Green Channel Offsets</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-slate-300">
                    <span>Shift Green Horizontal X:</span>
                    <span className="text-emerald-400">{settings.chromaOffsetGreenX.toFixed(1)}px</span>
                  </div>
                  <input
                    type="range"
                    min="-25"
                    max="25"
                    step="0.5"
                    value={settings.chromaOffsetGreenX}
                    onChange={(e) => onChange({ chromaOffsetGreenX: Number(e.target.value) })}
                    className="w-full accent-emerald-500 bg-slate-950 h-1 rounded"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-slate-300">
                    <span>Shift Green Vertical Y:</span>
                    <span className="text-emerald-400">{settings.chromaOffsetGreenY.toFixed(1)}px</span>
                  </div>
                  <input
                    type="range"
                    min="-25"
                    max="25"
                    step="0.5"
                    value={settings.chromaOffsetGreenY}
                    onChange={(e) => onChange({ chromaOffsetGreenY: Number(e.target.value) })}
                    className="w-full accent-emerald-500 bg-slate-950 h-1 rounded"
                  />
                </div>
              </div>
            </div>

            <h3 className="text-xs font-mono uppercase text-sky-400 tracking-wider border-b border-slate-800 pt-3 pb-1.5 font-bold">
              Analog Phase & Bandwidth Smearing
            </h3>

            {/* Chrominance Phase shift degree wheel */}
            <div className="space-y-2 p-3 bg-slate-950/60 rounded border border-slate-800">
              <div className="flex justify-between text-xs font-mono text-slate-300">
                <span>NTSC Magnetic Color Phase Shift:</span>
                <span className="text-pink-400 font-bold">{settings.chromaPhaseShift}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                step="5"
                value={settings.chromaPhaseShift}
                onChange={(e) => onChange({ chromaPhaseShift: Number(e.target.value) })}
                className="w-full accent-pink-500 bg-slate-950 h-5"
              />

              {/* Dynamic Phase Scrolling Rate */}
              <div className="pt-2">
                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>Dynamic Phase Rotation (Hue Swirl):</span>
                   <span className={`font-bold ${settings.chromaScrollSpeed === 0 ? "text-slate-500" : (settings.chromaScrollSpeed > 0 ? "text-cyan-400" : "text-amber-400")}`}>
                    {settings.chromaScrollSpeed === 0 ? "STATIONARY" : (settings.chromaScrollSpeed > 0 ? "CYCLING FWD" : "CYCLING BACK")}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-1 mt-1">
                   <span className="text-[10px] text-amber-500 font-bold font-mono opacity-60">REV</span>
                   <input
                     type="range"
                     min="-30"
                     max="30"
                     step="1"
                     value={settings.chromaScrollSpeed}
                     onChange={(e) => onChange({ chromaScrollSpeed: Number(e.target.value) })}
                     className="flex-1 accent-cyan-500 bg-slate-900 h-1.5 rounded appearance-none cursor-pointer"
                   />
                   <span className="text-[10px] text-cyan-500 font-bold font-mono opacity-60">FWD</span>
                </div>
              </div>
            </div>

            {/* Low-pass smear factor line */}
            <div className="space-y-2 p-3 bg-slate-950/60 rounded border border-slate-800">
              <div className="flex justify-between text-xs font-mono text-slate-300">
                <span>Horizontal Color Smearing (Bandwidth attenuation):</span>
                <span className="text-purple-400 font-bold">{Math.round(settings.chromaSmearFactor * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.95"
                step="0.05"
                value={settings.chromaSmearFactor}
                onChange={(e) => onChange({ chromaSmearFactor: Number(e.target.value) })}
                className="w-full accent-purple-500 bg-slate-950 h-5"
              />
            </div>

            {/* Luma dependent bleeding */}
            <div className="space-y-2 p-3 bg-slate-950/60 rounded border border-slate-800">
              <div className="flex justify-between text-xs font-mono text-slate-300">
                <span>Luminance Dependent Leak (High bright border bleeds):</span>
                <span className="text-rose-400 font-bold">Luma Threshold &gt; {Math.round(settings.lumaBleedThreshold * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.95"
                step="0.05"
                value={settings.lumaBleedThreshold}
                onChange={(e) => onChange({ lumaBleedThreshold: Number(e.target.value) })}
                className="w-full accent-rose-500 bg-slate-950 h-5"
              />
            </div>

            {/* Global Display Color Filters & Blur Block */}
            <div className="p-3 bg-slate-950/60 rounded-md border border-slate-800 space-y-4">
              <h4 className="text-xs font-mono text-sky-400 uppercase font-bold tracking-wide border-b border-slate-900 pb-1.5">
                Global Color Postprocessing & Blur Filters
              </h4>
              <p className="text-[10px] font-mono text-slate-500 leading-normal">
                Adjust the overall color values, brightness, contrast, saturations, and soft blur of the entire source signal.
              </p>

              {/* Blur slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono text-slate-300">
                  <span>Analog Soft Signal Blur:</span>
                  <span className="text-sky-400 font-bold">{settings.globalBlur.toFixed(1)}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="12"
                  step="0.2"
                  value={settings.globalBlur}
                  onChange={(e) => onChange({ globalBlur: Number(e.target.value) })}
                  className="w-full accent-sky-500 bg-slate-900 h-1.5 rounded"
                />
              </div>

              {/* Brightness slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono text-slate-300">
                  <span>Signal Brightness:</span>
                  <span className="text-sky-400 font-bold">{settings.globalBrightness}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="180"
                  step="5"
                  value={settings.globalBrightness}
                  onChange={(e) => onChange({ globalBrightness: Number(e.target.value) })}
                  className="w-full accent-sky-500 bg-slate-900 h-1.5 rounded"
                />
              </div>

              {/* Contrast slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono text-slate-300">
                  <span>Signal Contrast:</span>
                  <span className="text-sky-400 font-bold">{settings.globalContrast}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="180"
                  step="5"
                  value={settings.globalContrast}
                  onChange={(e) => onChange({ globalContrast: Number(e.target.value) })}
                  className="w-full accent-sky-500 bg-slate-900 h-1.5 rounded"
                />
              </div>

              {/* Saturation slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono text-slate-300">
                  <span>Signal Saturation:</span>
                  <span className="text-sky-400 font-bold">{settings.globalSaturation}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  step="5"
                  value={settings.globalSaturation}
                  onChange={(e) => onChange({ globalSaturation: Number(e.target.value) })}
                  className="w-full accent-sky-500 bg-slate-900 h-1.5 rounded"
                />
              </div>

              {/* Hue Rotate slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono text-slate-300">
                  <span>Carrier Hue Rotation:</span>
                  <span className="text-sky-400 font-bold">{settings.globalHueRotate}°</span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="5"
                  value={settings.globalHueRotate}
                  onChange={(e) => onChange({ globalHueRotate: Number(e.target.value) })}
                  className="w-full accent-sky-500 bg-slate-900 h-1.5 rounded"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: CRT PHOSPHORS & ANTENNA GHOSTS */}
        {activeTab === "crt" && (
          <div className="space-y-4">
            <h3 className="text-xs font-mono uppercase text-sky-400 tracking-wider border-b border-slate-800 pb-1.5 font-bold">
              UHF Antenna Mutipath Reflections (Ghosting)
            </h3>

            {/* Ghost Count */}
            <div className="space-y-2 p-3 bg-slate-950/60 rounded border border-slate-800">
              <div className="flex justify-between text-xs font-mono text-slate-300">
                <span>Phantom Shadows Count:</span>
                <span className="text-indigo-400 font-bold">{settings.ghostingCount} channels</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="1"
                value={settings.ghostingCount}
                onChange={(e) => onChange({ ghostingCount: Number(e.target.value) })}
                className="w-full accent-indigo-500 bg-slate-950 h-5"
              />
            </div>

            {/* Ghost Offset & Strength */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 p-3 bg-slate-950/45 rounded border border-slate-800">
                <div className="flex justify-between text-[11px] font-mono text-slate-300">
                  <span>Multipathing Gap Span:</span>
                  <span className="text-indigo-400">{settings.ghostingOffset}px</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="70"
                  step="1"
                  value={settings.ghostingOffset}
                  onChange={(e) => onChange({ ghostingOffset: Number(e.target.value) })}
                  className="w-full accent-indigo-500 bg-slate-900 h-1.5 rounded"
                />
              </div>

              <div className="space-y-1.5 p-3 bg-slate-950/45 rounded border border-slate-800">
                <div className="flex justify-between text-[11px] font-mono text-slate-300">
                  <span>Reflection Intensity:</span>
                  <span className="text-indigo-400">{Math.round(settings.ghostingStrength * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.8"
                  step="0.05"
                  value={settings.ghostingStrength}
                  onChange={(e) => onChange({ ghostingStrength: Number(e.target.value) })}
                  className="w-full accent-indigo-500 bg-slate-900 h-1.5 rounded"
                />
              </div>
            </div>

            <h3 className="text-xs font-mono uppercase text-sky-400 tracking-wider border-b border-slate-800 pt-3 pb-1.5 font-bold">
              CRT Monitor Aesthetics
            </h3>

            {/* Phosphor Decay persistent trails */}
            <div className="space-y-2 p-3 bg-slate-950/60 rounded border border-slate-800">
              <div className="flex justify-between text-xs font-mono text-slate-300">
                <span>Radioactive Phosphor Decay Persistence (Trails):</span>
                <span className="text-sky-400 font-bold">{Math.round(settings.phosphorTrails * 100)}% lag</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.75"
                step="0.05"
                value={settings.phosphorTrails}
                onChange={(e) => onChange({ phosphorTrails: Number(e.target.value) })}
                className="w-full accent-sky-500 bg-slate-950 h-5"
              />
            </div>

            {/* Scanlines parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 p-3 bg-slate-950/40 rounded border border-slate-800">
                <div className="flex justify-between text-[11px] font-mono text-slate-300">
                  <span>Scanlines Opacity:</span>
                  <span className="text-sky-400">{Math.round(settings.scanlineOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.scanlineOpacity}
                  onChange={(e) => onChange({ scanlineOpacity: Number(e.target.value) })}
                  className="w-full accent-sky-500 bg-slate-900 h-1 rounded"
                />
              </div>

              <div className="space-y-1.5 p-3 bg-slate-950/40 rounded border border-slate-800">
                <div className="flex justify-between text-[11px] font-mono text-slate-300">
                  <span>Lines Scan Density:</span>
                  <span className="text-sky-400">{settings.scanlineDensity} lines</span>
                </div>
                <input
                  type="range"
                  min="120"
                  max="1024"
                  step="40"
                  value={settings.scanlineDensity}
                  onChange={(e) => onChange({ scanlineDensity: Number(e.target.value) })}
                  className="w-full accent-sky-500 bg-slate-900 h-1 id-scanlines"
                />
              </div>
            </div>

            {/* Phosphor Mask Mode (Select Aperture/Shadow dot / Slot blocks) */}
            <div className="p-3 bg-slate-950/60 rounded border border-slate-800 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-slate-300 font-mono font-bold">CRT Subpixel Phosphor Grill:</span>
                <div className="flex gap-1 p-0.5 bg-slate-900 rounded border border-slate-800">
                  {["none", "aperture", "slot", "shadow"].map((mask) => (
                    <button
                      key={mask}
                      onClick={() => onChange({ grillMask: mask as any })}
                      className={`px-2 py-1 text-[11px] font-mono rounded capitalize ${
                        settings.grillMask === mask ? "bg-slate-800 text-sky-400" : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {mask}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono text-slate-300">
                  <span>Grill Subpixel Scale size:</span>
                  <span>{settings.grillScale.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.5"
                  value={settings.grillScale}
                  onChange={(e) => onChange({ grillScale: Number(e.target.value) })}
                  className="w-full accent-sky-400 bg-slate-900 h-1 rounded"
                />
              </div>
            </div>

            {/* Curved lens and vignette sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5 p-3 bg-slate-950/60 rounded border border-slate-800">
                <div className="flex justify-between text-[11px] font-mono text-slate-300">
                  <span>CRT Screen Curvature Refl:</span>
                  <span className="text-emerald-400">{Math.round(settings.crtCurvature * 100)}% gloss</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.2"
                  step="0.04"
                  value={settings.crtCurvature}
                  onChange={(e) => onChange({ crtCurvature: Number(e.target.value) })}
                  className="w-full accent-emerald-500 bg-slate-900 h-1 rounded"
                />
              </div>

              <div className="space-y-1.5 p-3 bg-slate-950/60 rounded border border-slate-800">
                <div className="flex justify-between text-[11px] font-mono text-slate-300">
                  <span>Bezel Corner Vignette darken:</span>
                  <span className="text-emerald-400">{Math.round(settings.crtVignette * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.6"
                  step="0.05"
                  value={settings.crtVignette}
                  onChange={(e) => onChange({ crtVignette: Number(e.target.value) })}
                  className="w-full accent-emerald-500 bg-slate-900 h-1"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: ON-SCREEN DISPLAY TEXT */}
        {activeTab === "osd" && (
          <div className="space-y-6">
            <h3 className="text-xs font-mono uppercase text-sky-400 tracking-wider border-b border-zinc-800 pb-1.5 font-bold">
              Post-Process Graphic Overlays
            </h3>

            {/* 🛸 PRIMARY IMAGE/GIF OVERLAY LOADER */}
            <div className="p-4 bg-zinc-950/60 border border-zinc-850 rounded-md space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-850 pb-1.5">
                <span className="text-xs font-mono uppercase text-teal-400 font-bold flex items-center gap-1.5">
                  <span>🛸 Visual Overlay (GIF/PNG)</span>
                </span>
                {settings.blendOverlayUrl && (
                  <button
                    onClick={() => onChange({ blendOverlayUrl: "", blendOverlayOpacity: 0 })}
                    className="text-[9px] text-rose-500 hover:text-rose-400 font-bold uppercase transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    REMOVE / CLEAR
                  </button>
                )}
              </div>
              
              <p className="text-[10px] text-zinc-400 leading-relaxed font-mono">
                Upload a transparent image/GIF from your device to overlay over the feed, emulating multi-exposure bleeding or custom branding.
              </p>

              <div className="bg-sky-950/20 border border-sky-900/40 p-2 text-[10px] text-sky-400 font-mono rounded">
                💡 DRAG TO POSITION: You can click and drag anywhere directly on the video screen preview above to visually position this element!
              </div>
              
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={onOverlayUploadClick}
                  className="flex items-center justify-center gap-2 w-full px-3 py-2 text-xs font-mono bg-zinc-950 border border-zinc-850 text-sky-400 hover:border-sky-800 transition-all rounded-sm cursor-pointer shadow-sm group"
                >
                  <Upload className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  <span>{settings.blendOverlayUrl ? "CHANGE OVERLAY FILE" : "UPLOAD OVERLAY (GIF/PNG)"}</span>
                </button>
                {settings.blendOverlayUrl && (
                  <p className="text-[9px] text-emerald-500/80 font-mono text-center animate-pulse">
                    ✓ Custom file active in viewport
                  </p>
                )}
              </div>

              {settings.blendOverlayUrl && (
                <div className="space-y-3.5 pt-2 border-t border-zinc-900/60">
                  {/* Opacity */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                      <span>Blend Opacity:</span>
                      <span>{Math.round((settings.blendOverlayOpacity || 0) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1.0"
                      step="0.05"
                      value={settings.blendOverlayOpacity || 0}
                      onChange={(e) => onChange({ blendOverlayOpacity: Number(e.target.value) })}
                      className="w-full accent-teal-400 bg-zinc-900 h-5"
                    />
                  </div>

                  {/* Scale */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                      <span>Scale Factor:</span>
                      <span>{Math.round((settings.blendOverlayScale !== undefined ? settings.blendOverlayScale : 1.0) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="4.0"
                      step="0.05"
                      value={settings.blendOverlayScale !== undefined ? settings.blendOverlayScale : 1.0}
                      onChange={(e) => onChange({ blendOverlayScale: Number(e.target.value) })}
                      className="w-full accent-teal-400 bg-zinc-900 h-5"
                    />
                  </div>

                  {/* GIF Playback Controls for Overlay */}
                  {settings.blendOverlayUrl && settings.blendOverlayUrl.toLowerCase().endsWith(".gif") && (
                    <div className="pt-2 mt-2 border-t border-zinc-900 space-y-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onChange({ blendOverlayGifPlaying: !settings.blendOverlayGifPlaying })}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs border transition-all font-bold cursor-pointer ${
                            settings.blendOverlayGifPlaying 
                              ? "bg-teal-950/40 border-teal-800 text-teal-400" 
                              : "bg-zinc-900 border-zinc-800 text-zinc-500"
                          }`}
                        >
                          {settings.blendOverlayGifPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                          <span>{settings.blendOverlayGifPlaying ? "PAUSE OVERLAY GIF" : "RESUME OVERLAY GIF"}</span>
                        </button>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                          <span>Overlay GIF Speed:</span>
                          <span className="text-teal-400">{settings.blendOverlayGifSpeed.toFixed(1)}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="5.0"
                          step="0.1"
                          value={settings.blendOverlayGifSpeed}
                          onChange={(e) => onChange({ blendOverlayGifSpeed: Number(e.target.value) })}
                          className="w-full accent-teal-500 bg-zinc-900 h-4 appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <h3 className="text-xs font-mono uppercase text-sky-450 tracking-wider border-b border-zinc-800 pb-1.5 font-bold">
              Secondary Overlays & Text Stamps
            </h3>

            {/* OVERLAY GRAPHICS & MONITOR VIEWFINDERS (Unified!) */}
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-md space-y-4">
              <span className="text-xs font-mono uppercase text-sky-400 font-bold block border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
                <span>Active UI Viewfinder / Overlay Type</span>
              </span>

              {/* Overlay Selector */}
              <div className="space-y-1.5">
                <span className="text-xs text-slate-300 font-medium font-mono">Active UI Overlay:</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "none", label: "No Overlay" },
                    { id: "vhs_bezel", label: "CAM Viewfinder Bezel" },
                    { id: "record_osd", label: "● REC Monitor OSD" }
                  ].map((ov) => (
                    <button
                      key={ov.id}
                      type="button"
                      onClick={() => onChange({ overlayType: ov.id as any })}
                      className={`px-3 py-2 text-xs font-mono rounded border transition-all text-left ${
                        settings.overlayType === ov.id
                          ? "bg-sky-950 border-sky-500 text-sky-300 shadow-md font-semibold"
                          : "bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300"
                      }`}
                    >
                      {ov.label}
                    </button>
                  ))}
                </div>
              </div>


            </div>

            {/* OSD Enable */}
            <div className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-800 rounded-md">
              <div className="space-y-0.5">
                <span className="text-xs font-mono text-slate-300 block font-bold">Enable VCR Info On-Screen:</span>
                <span className="text-[10px] text-slate-500">Includes blinking recorder indicators and classic green/white text stamps.</span>
              </div>
              <input
                type="checkbox"
                checked={settings.osdEnabled}
                onChange={(e) => onChange({ osdEnabled: e.target.checked })}
                className="w-5 h-5 accent-sky-500 cursor-pointer"
              />
            </div>

            {/* Debug Telemetry Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-800 rounded-md">
              <div className="space-y-0.5">
                <span className="text-xs font-mono text-amber-500 block font-bold">Enable Debug Telemetry HUD:</span>
                <span className="text-[10px] text-slate-500">Renders high-precision real-time wave calibration grids, frame rate counters, and slider record sequences.</span>
              </div>
              <input
                type="checkbox"
                checked={!!settings.debugModeEnabled}
                onChange={(e) => onChange({ debugModeEnabled: e.target.checked })}
                className="w-5 h-5 accent-amber-500 cursor-pointer"
              />
            </div>

            {settings.osdEnabled && (
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-md space-y-4">
                
                {/* Custom Label */}
                <div className="space-y-1">
                  <span className="text-xs font-mono text-slate-300 block">Active Status Overlay String:</span>
                  <input
                    type="text"
                    maxLength={16}
                    value={settings.osdText}
                    onChange={(e) => onChange({ osdText: e.target.value })}
                    className="w-full text-xs font-mono bg-slate-900 border border-slate-800 text-slate-200 px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-sky-500 uppercase"
                    placeholder="e.g. PLAY, RECORD, TAPE ERROR"
                  />
                </div>

                {/* Custom Channel */}
                <div className="space-y-1">
                  <span className="text-xs font-mono text-slate-300 block">Television Channel Label:</span>
                  <input
                    type="text"
                    maxLength={8}
                    value={settings.osdChannel}
                    onChange={(e) => onChange({ osdChannel: e.target.value })}
                    className="w-full text-xs font-mono bg-slate-900 border border-slate-800 text-slate-200 px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-sky-500 uppercase"
                    placeholder="e.g. CH 03, AV 1"
                  />
                </div>

                {/* Custom Date Overriding text */}
                <div className="space-y-1">
                  <span className="text-xs font-mono text-slate-300 block">Override Date Stamp (Free text VLC style):</span>
                  <input
                    type="text"
                    maxLength={28}
                    value={settings.osdCustomDate || ""}
                    onChange={(e) => onChange({ osdCustomDate: e.target.value })}
                    className="w-full text-xs font-mono bg-slate-900 border border-slate-800 text-slate-200 px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-sky-500 uppercase"
                    placeholder="e.g. JUN. 02 1996, OCT. 31 1988, SYSTEM LIVE"
                  />
                </div>

                {/* Custom Y alignments and Wobbles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-mono text-slate-400">
                      <span>OSD Text Y Alignment:</span>
                      <span>{Math.round((settings.osdCustomY !== undefined ? settings.osdCustomY : 0.90) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.95"
                      step="0.01"
                      value={settings.osdCustomY !== undefined ? settings.osdCustomY : 0.90}
                      onChange={(e) => onChange({ osdCustomY: Number(e.target.value) })}
                      className="w-full accent-sky-500 bg-slate-900 h-5"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-mono text-slate-400">
                      <span>OSD Text Wobble Jitter:</span>
                      <span>{settings.osdTextWobble || 0}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      step="1"
                      value={settings.osdTextWobble || 0}
                      onChange={(e) => onChange({ osdTextWobble: Number(e.target.value) })}
                      className="w-full accent-emerald-500 bg-slate-900 h-5"
                    />
                  </div>
                </div>

                {/* Color and text scale parameters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-mono text-slate-400 block">Text Character Color:</span>
                    <input
                      type="color"
                      value={settings.osdColor}
                      onChange={(e) => onChange({ osdColor: e.target.value })}
                      className="w-full h-8 bg-slate-900 border border-slate-800 rounded cursor-pointer p-0.5"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-mono text-slate-400">
                      <span>Overlay Text Size:</span>
                      <span>{Math.round(settings.osdSize * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="1.8"
                      step="0.05"
                      value={settings.osdSize}
                      onChange={(e) => onChange({ osdSize: Number(e.target.value) })}
                      className="w-full accent-sky-500 bg-slate-900 h-5"
                    />
                  </div>
                </div>

                {/* Date & Time Camcorder Stamp Configuration */}
                <div className="pt-3 border-t border-slate-900/80 space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-mono text-slate-300">OSD Date Calendar Stamp:</span>
                    <div className="grid grid-cols-3 gap-1.5 bg-slate-900 p-0.5 rounded border border-slate-800">
                      <button
                        type="button"
                        onClick={() => onChange({ osdDateMode: "1996" })}
                        className={`px-1.5 py-1 text-[10px] font-mono rounded text-center transition-all ${
                          settings.osdDateMode === "1996" ? "bg-slate-800 text-teal-400 font-bold shadow" : "text-slate-400 hover:text-slate-200"
                        }`}
                        title="Randomized Date (1975–2001) like vintage camera tapes"
                      >
                        1996 model (Random)
                      </button>
                      <button
                        type="button"
                        onClick={() => onChange({ osdDateMode: "random" })}
                        className={`px-1.5 py-1 text-[10px] font-mono rounded text-center transition-all ${
                          settings.osdDateMode === "random" ? "bg-slate-800 text-teal-400 font-bold shadow" : "text-slate-400 hover:text-slate-200"
                        }`}
                        title="Choose another random date 1975-2001"
                      >
                        Random 1975-2001
                      </button>
                      <button
                        type="button"
                        onClick={() => onChange({ osdDateMode: "current" })}
                        className={`px-1.5 py-1 text-[10px] font-mono rounded text-center transition-all ${
                          settings.osdDateMode === "current" ? "bg-slate-800 text-teal-400 font-bold shadow" : "text-slate-400 hover:text-slate-200"
                        }`}
                        title="Lock to active live browser clock and year"
                      >
                        Live Current Year
                      </button>
                    </div>
                  </div>

                  {/* Active Randomized Date details display + reroll button */}
                  {(settings.osdDateMode === "1996" || settings.osdDateMode === "random") && (
                    <div className="flex items-center justify-between p-2 bg-slate-950/60 border border-slate-900/80 rounded font-mono text-[11px]">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-500 uppercase">Active Camcorder Date Stamp:</span>
                        <span className="text-teal-400 font-bold uppercase tracking-wide">
                          {settings.osdRandomMonth || "OCT"}. {settings.osdRandomDay || 31} {settings.osdRandomYear || 1996}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const years = Array.from({ length: 2001 - 1975 + 1 }, (_, i) => 1975 + i);
                          const randomYear = years[Math.floor(Math.random() * years.length)];
                          const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
                          const randomMonth = months[Math.floor(Math.random() * months.length)];
                          const randomDay = Math.floor(Math.random() * 28) + 1;
                          onChange({
                            osdRandomYear: randomYear,
                            osdRandomMonth: randomMonth,
                            osdRandomDay: randomDay
                          });
                        }}
                        className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-850 hover:border-slate-700 text-slate-300 font-bold rounded text-[10px] uppercase cursor-pointer transition-all flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3 text-slate-400 animate-spin-once" />
                        <span>Reroll Date</span>
                      </button>
                    </div>
                  )}

                  {/* Time tracking mode block */}
                  <div className="flex flex-col gap-1.5 pt-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-mono text-slate-300">Camcorder Time Tracking Display:</span>
                      <span className="text-[10px] text-slate-500 font-mono">American Camcorder Standard</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 bg-slate-900 p-0.5 rounded border border-slate-800">
                      {[
                        { id: "clock", label: "Real Time Clock" },
                        { id: "counter", label: "VHS Tape Counter" },
                        { id: "none", label: "Hidden" }
                      ].map((tStyle) => (
                        <button
                          key={tStyle.id}
                          type="button"
                          onClick={() => onChange({ osdTimeTracking: tStyle.id as any })}
                          className={`px-1 py-1 text-[10px] font-mono rounded text-center transition-all ${
                            (settings.osdTimeTracking || "clock") === tStyle.id
                              ? "bg-slate-850 text-teal-400 font-bold shadow border border-slate-700/60"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          {tStyle.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}


          </div>
        )}
      </div>
    </div>
  );
};
