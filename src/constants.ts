import { SimulatorSettings } from "./types";

export interface SliderConfig {
  key: keyof SimulatorSettings;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
  type: "slider" | "toggle";
  category: string;
}

export const SLIDER_OPTIONS: SliderConfig[] = [
  { key: "pixelScale", label: "Pixel Scale (Downscaler)", min: 1, max: 8, step: 1, type: "slider", category: "Base" },
  { key: "overlayOpacity", label: "Overlay Opacity", min: 0, max: 1, step: 0.05, type: "slider", category: "Base" },
  { key: "overlayScale", label: "Overlay Scale", min: 0.1, max: 2, step: 0.05, type: "slider", category: "Base" },
  
  { key: "hWaveAmp", label: "H-Wave Amplitude", min: 0, max: 50, step: 0.5, unit: "px", type: "slider", category: "Wave" },
  { key: "hWaveFreq", label: "H-Wave Frequency", min: 0.001, max: 0.1, step: 0.001, type: "slider", category: "Wave" },
  { key: "hWaveSpeed", label: "H-Wave Speed", min: 0, max: 10, step: 0.2, type: "slider", category: "Wave" },
  { key: "vWaveAmp", label: "V-Wave Amplitude", min: 0, max: 50, step: 0.5, unit: "px", type: "slider", category: "Wave" },
  { key: "vWaveFreq", label: "V-Wave Frequency", min: 0.001, max: 0.1, step: 0.001, type: "slider", category: "Wave" },
  { key: "vWaveSpeed", label: "V-Wave Speed", min: 0, max: 10, step: 0.2, type: "slider", category: "Wave" },

  { key: "globalWobbleSpeed", label: "Global Wobble Speed", min: 0, max: 3, step: 0.1, type: "slider", category: "Wobble" },
  { key: "globalWobbleAmpX", label: "Wobble Amplitude X", min: 0, max: 35, step: 0.5, unit: "px", type: "slider", category: "Wobble" },
  { key: "globalWobbleAmpY", label: "Wobble Amplitude Y", min: 0, max: 15, step: 0.2, unit: "px", type: "slider", category: "Wobble" },
  { key: "globalWobbleFreqX", label: "Wobble Frequency X", min: 0.1, max: 10, step: 0.1, type: "slider", category: "Wobble" },
  { key: "globalWobbleFreqY", label: "Wobble Frequency Y", min: 0.1, max: 10, step: 0.1, type: "slider", category: "Wobble" },
  
  { key: "lineJitterStrength", label: "Line Jitter Strength", min: 0, max: 12, step: 0.2, unit: "px", type: "slider", category: "Sync" },
  { key: "lineJitterFrequency", label: "Line Jitter Frequency", min: 0, max: 0.8, step: 0.05, type: "slider", category: "Sync" },
  { key: "hSyncSkew", label: "H-Sync Skew", min: 0, max: 30, step: 0.5, unit: "px", type: "slider", category: "Sync" },
  { key: "vSyncRoll", label: "V-Sync Roll Rate", min: 0, max: 0.1, step: 0.001, type: "slider", category: "Sync" },

  { key: "fuzzOpacity", label: "Snow (Fuzz) Opacity", min: 0, max: 1, step: 0.05, type: "slider", category: "Noise" },
  { key: "fuzzSize", label: "Fuzz Size", min: 1, max: 10, step: 1, type: "slider", category: "Noise" },
  { key: "fuzzSpeed", label: "Fuzz Speed", min: 0, max: 5, step: 0.1, type: "slider", category: "Noise" },
  { key: "fuzzColorRatio", label: "Fuzz Color Ratio", min: 0, max: 1, step: 0.05, type: "slider", category: "Noise" },
  { key: "needleNoise", label: "Tape Dropouts (Needle)", min: 0, max: 5, step: 0.05, type: "slider", category: "Noise" },
  { key: "needleNoiseDensity", label: "Needle Density", min: 0, max: 5, step: 0.05, type: "slider", category: "Noise" },
  { key: "thermalNoiseFreq", label: "RF Interference Pulse", min: 0, max: 1, step: 0.01, type: "slider", category: "Noise" },

  { key: "trackingLinesCount", label: "Tracking Lines Count", min: 0, max: 10, step: 1, type: "slider", category: "Tracking" },
  { key: "trackingBlockY", label: "Tracking Block Y", min: 0, max: 1, step: 0.01, type: "slider", category: "Tracking" },
  { key: "trackingBlockHeight", label: "Tracking Block Height", min: 0, max: 0.3, step: 0.01, type: "slider", category: "Tracking" },
  { key: "trackingScrollSpeed", label: "Auto Head Roll Speed", min: -40, max: 40, step: 1, type: "slider", category: "Tracking" },
  { key: "trackingDisplacementX", label: "Horizontal Tracking Error", min: -50, max: 50, step: 1, unit: "px", type: "slider", category: "Tracking" },
  { key: "trackingNoiseDensity", label: "Tracking Grain Density", min: 0, max: 1, step: 0.05, type: "slider", category: "Tracking" },
  { key: "trackingFuzzOpacity", label: "Tracking Fuzz Intensity", min: 0, max: 1, step: 0.05, type: "slider", category: "Tracking" },

  { key: "chromaOffsetRedX", label: "Chroma Shift Red X", min: -20, max: 20, step: 0.5, unit: "px", type: "slider", category: "Color" },
  { key: "chromaOffsetRedY", label: "Chroma Shift Red Y", min: -20, max: 20, step: 0.5, unit: "px", type: "slider", category: "Color" },
  { key: "chromaOffsetGreenX", label: "Chroma Shift Green X", min: -20, max: 20, step: 0.5, unit: "px", type: "slider", category: "Color" },
  { key: "chromaOffsetGreenY", label: "Chroma Shift Green Y", min: -20, max: 20, step: 0.5, unit: "px", type: "slider", category: "Color" },
  { key: "chromaOffsetBlueX", label: "Chroma Shift Blue X", min: -20, max: 20, step: 0.5, unit: "px", type: "slider", category: "Color" },
  { key: "chromaOffsetBlueY", label: "Chroma Shift Blue Y", min: -20, max: 20, step: 0.5, unit: "px", type: "slider", category: "Color" },
  { key: "chromaSmearFactor", label: "Chroma Smear (Bleed)", min: 0, max: 1, step: 0.05, type: "slider", category: "Color" },
  { key: "lumaBleedThreshold", label: "Luma Bleed Threshold", min: 0, max: 1, step: 0.05, type: "slider", category: "Color" },
  { key: "chromaPhaseShift", label: "Chroma Phase Shift", min: -180, max: 180, step: 5, unit: "°", type: "slider", category: "Color" },
  { key: "chromaScrollSpeed", label: "Dynamic Hue Swirl Rate", min: -30, max: 30, step: 1, type: "slider", category: "Color" },

  { key: "globalBlur", label: "Image Softness (Blur)", min: 0, max: 10, step: 0.2, unit: "px", type: "slider", category: "Optics" },
  { key: "globalBrightness", label: "Brightness", min: 0, max: 200, step: 5, unit: "%", type: "slider", category: "Optics" },
  { key: "globalContrast", label: "Contrast", min: 0, max: 200, step: 5, unit: "%", type: "slider", category: "Optics" },
  { key: "globalSaturation", label: "Color Saturation", min: 0, max: 200, step: 5, unit: "%", type: "slider", category: "Optics" },
  { key: "globalHueRotate", label: "Global Hue Tint", min: 0, max: 360, step: 5, unit: "°", type: "slider", category: "Optics" },
  { key: "ghostingCount", label: "Ghosting Count", min: 0, max: 5, step: 1, type: "slider", category: "Optics" },
  { key: "ghostingOffsetX", label: "Ghosting Offset X", min: -100, max: 100, step: 1, unit: "px", type: "slider", category: "Optics" },
  { key: "ghostingOffsetY", label: "Ghosting Offset Y", min: -100, max: 100, step: 1, unit: "px", type: "slider", category: "Optics" },
  { key: "ghostingStrength", label: "Ghosting Intensity", min: 0, max: 1, step: 0.05, type: "slider", category: "Optics" },
  { key: "phosphorTrails", label: "Phosphor Trails", min: 0, max: 0.95, step: 0.01, type: "slider", category: "Optics" },

  { key: "scanlineOpacity", label: "Scanline Opacity", min: 0, max: 1, step: 0.05, type: "slider", category: "Display" },
  { key: "scanlineAmount", label: "Scanline Amount", min: 60, max: 680, step: 20, type: "slider", category: "Display" },
  { key: "scanlineDensity", label: "Scanline Density", min: 0.1, max: 2.0, step: 0.1, type: "slider", category: "Display" },
  { key: "scanlinesEnabled", label: "Scanlines Enabled", min: 0, max: 1, step: 1, type: "toggle", category: "Display" },
  { key: "crtCurvature", label: "CRT Curvature", min: 0, max: 1, step: 0.01, type: "slider", category: "Display" },
  { key: "crtVignette", label: "CRT Vignette", min: 0, max: 2, step: 0.05, type: "slider", category: "Display" },
  { key: "grillMask", label: "Grill/Mask Type", min: 0, max: 3, step: 1, type: "toggle", category: "Display" },
  { key: "grillScale", label: "Grill/Mask Scale", min: 1.0, max: 5, step: 0.1, type: "slider", category: "Display" },
  { key: "grillOpacity", label: "Grill Opacity", min: 0, max: 1, step: 0.05, type: "slider", category: "Display" },

  { key: "osdEnabled", label: "OSD Enabled", min: 0, max: 1, step: 1, type: "toggle", category: "OSD" },
  { key: "osdSize", label: "OSD Text Size", min: 0.1, max: 3, step: 0.1, type: "slider", category: "OSD" },
  { key: "osdCustomY", label: "OSD Vertical Pos", min: 0, max: 1, step: 0.01, type: "slider", category: "OSD" },
  { key: "osdTextWobble", label: "OSD Text Drift", min: 0, max: 20, step: 0.5, type: "slider", category: "OSD" },
  { key: "osdTextWobbleSpeed", label: "OSD Drift Speed", min: 0, max: 10, step: 0.1, type: "slider", category: "OSD" },
  { key: "osdBlur", label: "OSD Text Softness", min: 0, max: 5, step: 0.1, unit: "px", type: "slider", category: "OSD" },
  { key: "osdPixelScale", label: "OSD Downscale", min: 1, max: 4, step: 1, type: "slider", category: "OSD" },

  { key: "blendOverlayOpacity", label: "Overlay Mix Intensity", min: 0, max: 1, step: 0.05, type: "slider", category: "Effects" },
  { key: "blendOverlayPulse", label: "Overlay Glow Pulse", min: 0, max: 1, step: 0.05, type: "slider", category: "Effects" },
  { key: "blendOverlayScale", label: "Overlay Scale", min: 0.1, max: 5, step: 0.1, type: "slider", category: "Effects" },
  { key: "blendOverlayRotation", label: "Overlay Spin Rate", min: -20, max: 20, step: 0.5, type: "slider", category: "Effects" },
  { key: "blendOverlayWobble", label: "Overlay Drift Wobble", min: 0, max: 50, step: 1, type: "slider", category: "Effects" },
  { key: "blendOverlaySpeed", label: "Overlay Drift Speed", min: 0, max: 10, step: 0.1, type: "slider", category: "Effects" },

  { key: "gifPlaying", label: "GIF Animation Play", min: 0, max: 1, step: 1, type: "toggle", category: "System" },
  { key: "flexToScreen", label: "Flex to Screen", min: 0, max: 1, step: 1, type: "toggle", category: "System" },
  { key: "flipHorizontal", label: "Flip Horizontal", min: 0, max: 1, step: 1, type: "toggle", category: "System" },
  { key: "flipVertical", label: "Flip Vertical", min: 0, max: 1, step: 1, type: "toggle", category: "System" },
  { key: "debugModeEnabled", label: "Debug Grid", min: 0, max: 1, step: 1, type: "toggle", category: "System" },

  { key: "gateWeave", label: "Gate Weave (Slow Drift)", min: 0, max: 5, step: 0.1, type: "slider", category: "Film" },
  { key: "filmJitter", label: "Film Jitter (Vertical)", min: 0, max: 5, step: 0.1, type: "slider", category: "Film" },
  { key: "filmDust", label: "Dust & Specks Density", min: 0, max: 5, step: 0.1, type: "slider", category: "Film" },
  { key: "filmDustSize", label: "Dust Size", min: 0.5, max: 5, step: 0.1, type: "slider", category: "Film" },
  { key: "filmScratches", label: "Vertical Scratches Density", min: 0, max: 5, step: 0.1, type: "slider", category: "Film" },
  { key: "filmScratchesWidth", label: "Scratch Width", min: 0.1, max: 3, step: 0.1, type: "slider", category: "Film" },
  { key: "filmGrain", label: "Film Grain Density", min: 0, max: 5, step: 0.1, type: "slider", category: "Film" },
  { key: "filmGrainSize", label: "Grain Particle Size", min: 1, max: 4, step: 1, type: "slider", category: "Film" },
  { key: "filmLightLeaks", label: "Light Leaks", min: 0, max: 5, step: 0.1, type: "slider", category: "Film" },
  { key: "filmVignette", label: "Iris Lens Vignette", min: 0, max: 1, step: 0.01, type: "slider", category: "Film" },
  { key: "filmVignetteRadius", label: "Iris Size", min: 0, max: 2, step: 0.01, type: "slider", category: "Film" },
  { key: "filmVignetteSoftness", label: "Iris Edge Sharpness", min: 0, max: 1, step: 0.01, type: "slider", category: "Film" },
  { key: "filmHalation", label: "Film Halation Glow", min: 0, max: 1, step: 0.05, type: "slider", category: "Film" },
  { key: "filmBreath", label: "Film Breath (Flicker)", min: 0, max: 2, step: 0.1, type: "slider", category: "Film" },
  { key: "filmAnamorphic", label: "Anamorphic Streaks", min: 0, max: 5, step: 0.1, type: "slider", category: "Film" },
  { key: "filmEmulsion", label: "Emulsion Damage", min: 0, max: 5, step: 0.1, type: "slider", category: "Film" },
  { key: "filmFrameJump", label: "Frame Vertical Jump", min: 0, max: 5, step: 0.1, type: "slider", category: "Film" },
  { key: "filmFrameBurn", label: "Frame Burn Firing", min: 0, max: 5, step: 0.1, type: "slider", category: "Film" },
  { key: "filmChemicalSpots", label: "Chemical Acid Spots", min: 0, max: 5, step: 0.1, type: "slider", category: "Film" },
];

export const ASSIGNABLE_PARAMS = SLIDER_OPTIONS;
