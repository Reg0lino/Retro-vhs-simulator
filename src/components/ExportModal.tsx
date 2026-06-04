import React from "react";
import { Video } from "lucide-react";
import { ExportConfig } from "../types";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  exportConfig: ExportConfig;
  setExportConfig: React.Dispatch<React.SetStateAction<ExportConfig>>;
  settingsWidth: number;
  settingsHeight: number;
  onStartExport: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  exportConfig,
  setExportConfig,
  settingsWidth,
  settingsHeight,
  onStartExport,
}) => {
  if (!isOpen) return null;

  return (
    <div id="export-master-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-mono select-none">
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg max-w-xl w-full overflow-hidden shadow-[0_0_50px_rgba(14,165,233,0.15)] flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center bg-gradient-to-r from-zinc-900 via-zinc-900 to-sky-955/20">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-sky-400 animate-pulse" />
            <div>
              <h3 className="text-xs uppercase tracking-widest font-extrabold text-zinc-100">CRT Export Master Panel</h3>
              <p className="text-[9px] text-zinc-500 font-bold uppercase mt-0.5">High-Fidelity Deflection Processor</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-xs text-zinc-500 hover:text-zinc-200 cursor-pointer p-1 uppercase focus:outline-none"
          >
            [ESC Close]
          </button>
        </div>

        {/* Modal Content Scroll Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs select-text [scrollbar-width:thin] [scrollbar-color:theme(colors.zinc.800)_theme(colors.zinc.950)] text-left">
          
          {/* Option 1: Format Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-extrabold block">1. Container Format</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "mp4", label: "✨ H.264 MP4", desc: "Best compatibility & pristine quality" },
                { id: "webm", label: "📼 VP9 WebM", desc: "Efficient file size, web standard" },
                { id: "gif", label: "🖼️ Retro Animated GIF", desc: "Classic endless 36-120 frame loops" }
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setExportConfig(prev => ({ ...prev, format: f.id as any }))}
                  className={`p-2.5 rounded border text-left cursor-pointer transition-all flex flex-col justify-between h-20 focus:outline-none ${
                    exportConfig.format === f.id 
                      ? "bg-sky-950/40 border-sky-500 text-sky-300 font-extrabold" 
                      : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:border-zinc-700"
                  }`}
                >
                  <span className="font-extrabold tracking-wider text-[10px] uppercase block">{f.label}</span>
                  <span className="text-[8px] text-zinc-500 leading-tight block mt-1">{f.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Option 2: Resolution Sizing */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-extrabold block">2. Spatial Resolution (Upscaling Engine)</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {(() => {
                const ratio = settingsWidth / settingsHeight;
                const makeEven = (val: number) => {
                  const rounded = Math.round(val);
                  return rounded % 2 === 0 ? rounded : rounded + 1;
                };

                return [
                  { id: "original", label: "Active Viewport", desc: `${makeEven(settingsWidth)}x${makeEven(settingsHeight)} (1:1)` },
                  { id: "480p", label: "480p Classic NTSC", desc: `${makeEven(480 * ratio)}x480 (Retro Ideal)` },
                  { id: "720p", label: "720p HD Standard", desc: `${makeEven(720 * ratio)}x720 (Sharp Video)` },
                  { id: "1080p", label: "1080p Full HD", desc: `${makeEven(1080 * ratio)}x1080 (High Detail)` },
                  { id: "4k", label: "2160p Ultra HD (4K)", desc: `${makeEven(2160 * ratio)}x2160 (Lossless CRT)` },
                  { id: "custom", label: "Custom Bounds", desc: "Define custom dimensions" }
                ];
              })().map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setExportConfig(prev => ({ ...prev, preset: r.id as any }))}
                  className={`p-2 rounded border text-left cursor-pointer transition-all focus:outline-none ${
                    exportConfig.preset === r.id 
                      ? "bg-sky-950/20 border-sky-500/80 text-sky-300 font-bold" 
                      : "bg-zinc-900/30 border-zinc-900 text-zinc-400 hover:bg-zinc-900 hover:border-zinc-800"
                  }`}
                >
                  <span className="font-bold text-[9px] uppercase block">{r.label}</span>
                  <span className="text-[8px] text-zinc-500 block mt-0.5">{r.desc}</span>
                </button>
              ))}
            </div>
            
            {/* Expander for Custom Resolution values */}
            {exportConfig.preset === "custom" && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-900/40 border border-zinc-800 rounded mt-2">
                <div className="space-y-1">
                  <span className="text-[8px] text-zinc-500 uppercase font-bold">Width (Pixels)</span>
                  <input
                    type="number"
                    value={exportConfig.customWidth}
                    onChange={(e) => setExportConfig(prev => ({ ...prev, customWidth: Math.max(16, parseInt(e.target.value) || 0) }))}
                    className="w-full bg-zinc-950 border border-zinc-800 p-1.5 text-zinc-100 font-mono text-[10px] rounded h-[28px] focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] text-zinc-500 uppercase font-bold">Height (Pixels)</span>
                  <input
                    type="number"
                    value={exportConfig.customHeight}
                    onChange={(e) => setExportConfig(prev => ({ ...prev, customHeight: Math.max(12, parseInt(e.target.value) || 0) }))}
                    className="w-full bg-zinc-950 border border-zinc-800 p-1.5 text-zinc-100 font-mono text-[10px] rounded h-[28px] focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Grid 3: Bitrate & FPS Column */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Frame Rate Configuration */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-extrabold block">3. Temporal Frame Rate</label>
              <div className="flex bg-zinc-900 border border-zinc-800 rounded overflow-hidden">
                {[24, 30, 60].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setExportConfig(prev => ({ ...prev, fps: rate }))}
                    className={`flex-1 py-1.5 text-[9px] font-bold text-center cursor-pointer border-r border-zinc-800 last:border-r-0 transition-all focus:outline-none ${
                      exportConfig.fps === rate ? "bg-sky-950 text-sky-400 font-bold" : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {rate} FPS
                  </button>
                ))}
              </div>
            </div>

            {/* Stop Condition: Manual vs Auto-Timer */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-extrabold block">4. Record Length Trigger</label>
              <div className="flex bg-zinc-900 border border-zinc-800 rounded overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExportConfig(prev => ({ ...prev, stopTrigger: "manual" }))}
                  className={`flex-1 py-1.5 text-[9px] font-bold text-center cursor-pointer border-r border-zinc-800 transition-all focus:outline-none ${
                    exportConfig.stopTrigger === "manual" ? "bg-sky-950 text-sky-400 font-bold" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  MANUAL STOP
                </button>
                <button
                  type="button"
                  onClick={() => setExportConfig(prev => ({ ...prev, stopTrigger: "auto" }))}
                  className={`flex-1 py-1.5 text-[9px] font-bold text-center cursor-pointer transition-all focus:outline-none ${
                    exportConfig.stopTrigger === "auto" ? "bg-sky-950 text-sky-400 font-bold" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  AUTO LIMITER
                </button>
              </div>
              
              {exportConfig.stopTrigger === "auto" && (
                <div className="flex items-center gap-2 mt-1.5 p-1 px-2 bg-zinc-900/60 border border-zinc-800 rounded animate-fade-in animate-none">
                  <span className="text-[8px] text-zinc-500 uppercase font-extrabold">Timer:</span>
                  <input
                    type="range"
                    min="2"
                    max="120"
                    value={exportConfig.autoStopDuration}
                    onChange={(e) => setExportConfig(prev => ({ ...prev, autoStopDuration: parseInt(e.target.value) }))}
                    className="flex-1 bg-zinc-800 h-1 rounded appearance-none cursor-pointer accent-sky-500"
                  />
                  <span className="text-[9px] font-extrabold text-sky-400 w-10 text-right">{exportConfig.autoStopDuration}s</span>
                </div>
              )}
            </div>
          </div>

          {/* Bitrate Controls (Conditional on MP4/WebM) */}
          {exportConfig.format !== "gif" ? (
            <div className="space-y-1.5 pt-1.5 border-t border-zinc-900">
              <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-extrabold block">5. Compression Quality / Bitrate (Crank it up!)</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "low", label: "Web Streaming (3 Mbps)", desc: "Quick upload sizes" },
                  { id: "medium", label: "Standard Deck (8 Mbps)", desc: "Default clean rate" },
                  { id: "high", label: "✨ High-Bi (16 Mbps)", desc: "Pristine high signal" },
                  { id: "cranked", label: "Cranked (32 Mbps)", desc: "Incredible detail" },
                  { id: "ludicrous", label: "Master (60 Mbps)", desc: "Perfect subpixel grids" },
                  { id: "custom", label: "Custom Mbps", desc: "Specific bit target" }
                ].map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setExportConfig(prev => ({ ...prev, bitrateLevel: b.id as any }))}
                    className={`p-2 rounded border text-left cursor-pointer transition-all focus:outline-none ${
                      exportConfig.bitrateLevel === b.id 
                        ? "bg-sky-955 bg-sky-950/20 border-sky-500 text-sky-300 font-bold" 
                        : "bg-zinc-900/30 border-zinc-900 text-zinc-400 hover:bg-zinc-900 hover:border-zinc-800"
                    }`}
                  >
                    <span className="font-bold text-[9px] uppercase block">{b.label}</span>
                    <span className="text-[8px] text-zinc-500 block mt-0.5">{b.desc}</span>
                  </button>
                ))}
              </div>

              {exportConfig.bitrateLevel === "custom" && (
                <div className="flex items-center gap-2 mt-2 p-2 bg-zinc-900/40 border border-zinc-800 rounded">
                  <span className="text-[8px] text-zinc-500 uppercase font-bold shrink-0">Custom Rate (Mbps):</span>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={exportConfig.customBitrate}
                    onChange={(e) => setExportConfig(prev => ({ ...prev, customBitrate: Math.max(1, parseInt(e.target.value) || 0) }))}
                    className="w-24 bg-zinc-950 border border-zinc-800 p-1 text-zinc-100 font-mono text-[10px] rounded h-[24px] focus:outline-none focus:border-sky-500"
                  />
                </div>
              )}
            </div>
          ) : (
            /* GIF Length Controls */
            <div className="space-y-1.5 pt-1.5 border-t border-zinc-900">
              <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-extrabold block">5. GIF Sequence Length</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "short", label: "Short (1.5s)", desc: "36 frames @ 24fps" },
                  { id: "medium", label: "Medium (3.0s)", desc: "72 frames @ 24fps" },
                  { id: "long", label: "Extreme (5.0s)", desc: "120 frames @ 24fps" }
                ].map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setExportConfig(prev => ({ ...prev, gifLength: g.id as any }))}
                    className={`p-2.5 rounded border text-left cursor-pointer transition-all flex flex-col justify-between focus:outline-none ${
                      exportConfig.gifLength === g.id 
                        ? "bg-sky-950/40 border-sky-500 text-sky-400 font-extrabold" 
                        : "bg-zinc-900/30 border-zinc-900 text-zinc-500 hover:bg-zinc-900 hover:border-zinc-800"
                    }`}
                  >
                    <span className="text-[9px] uppercase block font-bold">{g.label}</span>
                    <span className="text-[7.5px] mt-1 text-zinc-550 text-zinc-500 block leading-tight">{g.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 bg-zinc-900 border-t border-zinc-800 flex justify-between items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-zinc-700 hover:border-zinc-500 bg-zinc-800 hover:bg-zinc-750 text-zinc-350 hover:text-zinc-200 cursor-pointer rounded text-[11px] font-sans"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={onStartExport}
            className="px-6 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded font-mono text-[10.5px] font-extrabold cursor-pointer uppercase transition-all shadow-md flex items-center gap-2 tracking-wider transform active:translate-y-0.5 focus:outline-none"
          >
            <span>🎬 Initiate Signal Export</span>
          </button>
        </div>

      </div>
    </div>
  );
};
