import React from "react";
import { Sparkles, SlidersHorizontal } from "lucide-react";
import { SimulatorSettings } from "../types";
import { ASSIGNABLE_PARAMS } from "../constants";

interface MacroSlidersProps {
  favKeys: string[];
  setFavKeys: (keys: string[]) => void;
  settings: SimulatorSettings;
  handleSettingsChange: (updates: Partial<SimulatorSettings>) => void;
  isFullscreen?: boolean;
}

export const MacroSliders: React.FC<MacroSlidersProps> = ({
  favKeys,
  setFavKeys,
  settings,
  handleSettingsChange,
  isFullscreen = false,
}) => {
  return (
    <div className={`w-full bg-zinc-900 border border-zinc-800 rounded-sm shadow-xl transition-all ${
      isFullscreen ? 'p-6 mt-6 bg-zinc-900/60' : 'p-4 mt-4'
    }`}>
      <div className={`flex items-center justify-between border-b border-zinc-800 mb-3 ${isFullscreen ? 'pb-3' : 'pb-2'}`}>
        <div className="flex items-center gap-2 text-sky-400 font-bold uppercase tracking-wider font-mono">
          {isFullscreen ? <SlidersHorizontal className="w-5 h-5" /> : <Sparkles className="w-3.5 h-3.5" />}
          <span className={isFullscreen ? 'text-lg' : 'text-[11px]'}>■ ASSIGNABLE HOTKEY MACRO SLIDERS</span>
        </div>
      </div>

      <div className={`grid gap-3 ${
        isFullscreen 
          ? "grid-cols-2 md:grid-cols-3 xl:grid-cols-6" 
          : "grid-cols-2 md:grid-cols-3 lg:grid-cols-6"
      }`}>
        {favKeys.map((keyString, idx) => {
          const paramDef = ASSIGNABLE_PARAMS.find(p => p.key === keyString) || ASSIGNABLE_PARAMS[idx % ASSIGNABLE_PARAMS.length];
          const val = (settings as any)[paramDef.key];
          
          const barColors = [
            "accent-amber-500 text-amber-500",
            "accent-sky-500 text-sky-500",
            "accent-rose-500 text-rose-500",
            "accent-emerald-500 text-emerald-500",
            "accent-indigo-500 text-indigo-500",
            "accent-orange-500 text-orange-500",
          ];
          const colorClass = barColors[idx % barColors.length];

          return (
            <div key={idx} className={`bg-zinc-950 border border-zinc-850 rounded-sm flex flex-col transition-all ${
              isFullscreen ? 'p-4 space-y-4 shadow-2xl border-zinc-800' : 'p-2.5 space-y-2'
            }`}>
              <div className="flex flex-col gap-1">
                <select
                  value={paramDef.key}
                  onChange={(e) => {
                    const nextKeys = [...favKeys];
                    nextKeys[idx] = e.target.value;
                    setFavKeys(nextKeys);
                  }}
                  className={`bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold rounded-sm w-full focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer ${
                    isFullscreen ? 'text-sm px-2 py-2.5' : 'text-[10px] px-1.5 py-1'
                  }`}
                >
                  {Array.from(new Set(ASSIGNABLE_PARAMS.map(p => p.category))).map(cat => (
                    <optgroup key={cat} label={`-- ${cat.toUpperCase()} --`} className="bg-zinc-950 text-sky-500 font-bold text-[10px]">
                      {ASSIGNABLE_PARAMS.filter(p => p.category === cat).map(p => (
                        <option key={p.key} value={p.key} className="bg-zinc-950 text-zinc-200 font-normal">
                          {p.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className={`flex items-center justify-between leading-none pt-1 ${isFullscreen ? 'text-xs' : 'text-[10px]'}`}>
                <span className="text-zinc-500 uppercase tracking-widest font-mono">Value:</span>
                <span className={`font-bold font-mono ${colorClass.split(" ")[1]}`}>
                  {paramDef.type === "toggle" 
                    ? (val ? "ON" : "OFF")
                    : (typeof val === "number" ? val.toFixed(paramDef.step < 0.01 ? 3 : paramDef.step < 0.1 ? 2 : 1) : val)}
                </span>
              </div>

              {paramDef.type === "toggle" ? (
                <button
                  onClick={() => handleSettingsChange({ [paramDef.key]: !val })}
                  className={`w-full font-bold rounded-sm border transition-all ${
                    isFullscreen ? 'py-3.5 text-xs tracking-widest' : 'py-1 text-[9px]'
                  } ${
                    val 
                      ? `${colorClass.split(" ")[1]} border-current bg-zinc-900`
                      : "text-zinc-600 border-zinc-800 hover:text-zinc-400"
                  }`}
                >
                  {val ? "DISABLE" : "ENABLE"}
                </button>
              ) : (
                <input
                  type="range"
                  min={paramDef.min}
                  max={paramDef.max}
                  step={paramDef.step}
                  value={val ?? paramDef.min}
                  onChange={(e) => handleSettingsChange({ [paramDef.key]: Number(e.target.value) })}
                  className={`w-full bg-zinc-950 rounded-none cursor-pointer ${colorClass.split(" ")[0]} ${
                    isFullscreen ? 'h-3' : 'h-1'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
