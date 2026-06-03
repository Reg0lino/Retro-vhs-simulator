/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SimulatorSettings } from "./types";

export const DEFAULT_SETTINGS: SimulatorSettings = {
  sourceType: "colorbars",
  sourceColor: "#050117",
  sourceZoom: "cover",
  gifPlaybackSpeed: 1.0,
  gifPlaying: true,
  blendOverlayGifSpeed: 1.0,
  blendOverlayGifPlaying: true,

  // NEW ADVANCED RETRO DECK CONTROLS
  pixelScale: 1, 
  
  overlayType: "none",
  overlayOpacity: 0.9,
  overlayScale: 1.0,
  overlayX: 0,
  overlayY: 0,
  overlayBlendMode: "normal",

  hWaveAmp: 0, 
  hWaveFreq: 0.02,
  hWaveSpeed: 2.0,
  vWaveAmp: 0,
  vWaveFreq: 0.02,
  vWaveSpeed: 2.0,

  globalBlur: 0,
  globalBrightness: 100,
  globalContrast: 100,
  globalSaturation: 100,
  globalHueRotate: 0,

  webVideoSrc: "https://vjs.zencdn.net/v/oceans.mp4", 

  // X/Y Wobble & Jitter
  globalWobbleSpeed: 0.8,
  globalWobbleAmpX: 3.5,
  globalWobbleAmpY: 1.5,
  globalWobbleFreqX: 3.5,
  globalWobbleFreqY: 2.0,
  lineJitterStrength: 1.2,
  lineJitterFrequency: 0.15,
  hSyncSkew: 2.0,
  vSyncRoll: 0.0,

  // Fuzz & Noise
  fuzzOpacity: 0.09,
  fuzzSize: 2,
  fuzzSpeed: 1.2,
  fuzzColorRatio: 0.20,
  needleNoise: 0.15,
  needleNoiseDensity: 0.2,
  thermalNoiseFreq: 0.05,

  // Tape Tracking Error Block
  trackingLinesCount: 2,
  trackingBlockY: 0.82,
  trackingBlockHeight: 0.04,
  trackingDisplacementX: 12.0,
  trackingScrollSpeed: 0,
  trackingNoiseDensity: 0.65,
  trackingFuzzOpacity: 0.35,

  // Chromatic Aberration & Bleed
  chromaOffsetRedX: -4.0,
  chromaOffsetRedY: 0.0,
  chromaOffsetBlueX: 4.0,
  chromaOffsetBlueY: 1.5,
  chromaOffsetGreenX: 0.0,
  chromaOffsetGreenY: -1.0,
  chromaPhaseShift: 10.0,
  chromaScrollSpeed: 0,
  chromaSmearFactor: 0.40,
  lumaBleedThreshold: 0.70,

  // Ghosting / Multipath reflections
  ghostingCount: 1,
  ghostingOffset: 25,
  ghostingStrength: 0.18,
  phosphorTrails: 0.12,

  // CRT Emulation
  scanlineOpacity: 0.30,
  scanlineDensity: 480,
  crtCurvature: 0.06,
  crtVignette: 0.35,
  grillMask: "slot",
  grillScale: 1.0,

  // On-Screen Display (OSD)
  osdEnabled: true,
  osdText: "PLAY",
  osdChannel: "AV 1",
  osdColor: "#f3f4f6",
  osdSize: 1.0,
  osdDateMode: "1996",
  osdTimeTracking: "clock",
  osdCustomDate: "",
  osdCustomY: 0.90,
  osdTextWobble: 0,
  osdTextWobbleSpeed: 2.0,

  // Dynamic Multi-Exposure Blend overlay
  blendOverlayUrl: "",
  blendOverlayOpacity: 0.0,
  blendOverlayScale: 1.0,
  blendOverlayWobble: 0,
  blendOverlaySpeed: 1.0,
  blendOverlayRotation: 0,
  blendOverlayPulse: 0,
  blendOverlayX: 0,
  blendOverlayY: 0,
  blendOverlayBlendMode: "screen",

  flexToScreen: true,
  canvasWidth: 640,
  canvasHeight: 480,
  exportFps: 24,
  exportFormat: "webm",
  debugModeEnabled: false,
  customSliderSlots: ["hSyncSkew", "vSyncRoll", "fuzzOpacity", "needleNoise", "trackingDisplacementX", "chromaSmearFactor"],
};

export const PRESETS: Record<string, { name: string; description: string; settings: Partial<SimulatorSettings> }> = {
  testBars: {
    name: "SMPTE TV Calibration",
    description: "Ideal for testing alignments. Zero noise, zero wobble, solid scanlines.",
    settings: {
      sourceType: "colorbars",
      sourceColor: "#05051a",
      globalWobbleAmpX: 0,
      globalWobbleAmpY: 0,
      fuzzOpacity: 0, 
      needleNoise: 0, 
      trackingLinesCount: 0, 
      trackingBlockHeight: 0,
      trackingDisplacementX: 0, 
      trackingNoiseDensity: 0,
      chromaSmearFactor: 0,
      scanlineOpacity: 0.3,
      lineJitterStrength: 0,
      osdEnabled: true,
      osdCustomDate: "CALIBRATION MODE"
    }
  },
  classicVhs: {
    name: "1996 Tape Head Decay",
    description: "Standard VHS flavor. Moderate tracking jitter and head-switching artifacts.",
    settings: {
      globalWobbleAmpX: 1.8,
      globalWobbleAmpY: 1.0,
      fuzzOpacity: 0.05,
      needleNoise: 0.06,
      trackingLinesCount: 2,
      trackingBlockHeight: 0.03,
      trackingBlockY: 0.88,
      trackingDisplacementX: 9.0,
      trackingScrollSpeed: -1.5,
      chromaSmearFactor: 0.45,
      lineJitterStrength: 1.8,
      osdEnabled: true,
    }
  },
  damagedTape: {
    name: "Heavy Tracking Decay",
    description: "Severe hardware alignment failure. Heavy displacement and thick tracking fuzz.",
    settings: {
      globalWobbleAmpX: 10.0,
      globalWobbleAmpY: 5.0,
      fuzzOpacity: 0.28,
      needleNoise: 0.45,
      trackingLinesCount: 6,
      trackingBlockHeight: 0.14,
      trackingBlockY: 0.42,
      trackingDisplacementX: 45.0,
      trackingNoiseDensity: 0.9,
      lineJitterStrength: 9.5,
      vSyncRoll: 0.012,
      trackingScrollSpeed: -10,
      osdEnabled: true,
      osdCustomDate: "TRACKING ERROR"
    }
  },
  lateNightMovie: {
    name: "Late Night RF Signal",
    description: "80s broadcast vibe. Warm colors, slight noise, and low-res scanlines.",
    settings: {
      globalWobbleAmpX: 0.6,
      globalWobbleAmpY: 0.4,
      fuzzOpacity: 0.0,
      needleNoise: 0.0,
      trackingLinesCount: 0,
      trackingDisplacementX: 0,
      phosphorTrails: 0.5,
      chromaOffsetRedX: 2.2,
      chromaSmearFactor: 0.35,
      globalSaturation: 115,
      osdEnabled: false,
    }
  },
  securityCam: {
    name: "CCTV Night Watch",
    description: "Monochrome, high-contrast surveillance bank. Signal jitter and static-heavy.",
    settings: {
      globalSaturation: 0,
      globalContrast: 150,
      globalBrightness: 130,
      globalBlur: 1.2,
      fuzzOpacity: 0.15,
      needleNoise: 0.18,
      trackingLinesCount: 1,
      trackingBlockY: 0.05,
      trackingDisplacementX: 2.0,
      lineJitterStrength: 2.5,
      osdEnabled: true,
      osdCustomDate: "VAULT SEC 04"
    }
  },
  cyberNeon: {
    name: "Neon Glitch City",
    description: "Hypersaturated cyberpunk vibe. Heavy chroma shifts and scanline bloom.",
    settings: {
      globalSaturation: 180,
      globalContrast: 120,
      globalHueRotate: 320,
      chromaOffsetRedX: 12.0,
      chromaOffsetBlueX: -12.0,
      chromaSmearFactor: 0.1,
      scanlineOpacity: 0.8,
      scanlineDensity: 240,
      crtCurvature: 0.15,
      fuzzOpacity: 0.04,
      osdEnabled: true,
      osdCustomDate: "NEO-TOKYO.99"
    }
  },
  deepSea: {
    name: "Abyssal Radar",
    description: "Cold blue underwater probe. Heavy ghosting and slow vertical wave motion.",
    settings: {
      globalHueRotate: 180,
      globalSaturation: 40,
      globalBrightness: 80,
      vWaveAmp: 10,
      vWaveFreq: 0.005,
      vWaveSpeed: 1,
      ghostingCount: 4,
      ghostingOffset: 40,
      ghostingStrength: 0.4,
      phosphorTrails: 0.85,
      fuzzOpacity: 0.08,
      osdEnabled: true,
      osdCustomDate: "SUB-ORBITAL"
    }
  },
  dreamyTape: {
    name: "Dreamscape Memory",
    description: "Soft, hazy nostalgia. High brightness glow and gentle horizontal waves.",
    settings: {
      globalBlur: 4.5,
      globalBrightness: 125,
      globalSaturation: 140,
      hWaveAmp: 8,
      hWaveFreq: 0.01,
      hWaveSpeed: 0.5,
      phosphorTrails: 0.7,
      fuzzOpacity: 0.0,
      scanlineOpacity: 0.1,
      osdEnabled: false,
    }
  },
  brokenMonitor: {
    name: "Vertical Sync Fail",
    description: "Hardware breakdown. Rapid vertical rolling and extreme sync skew.",
    settings: {
      vSyncRoll: 0.045,
      trackingScrollSpeed: 15.0,
      hSyncSkew: 25.0,
      lineJitterStrength: 12.0,
      fuzzOpacity: 0.4,
      needleNoise: 0.6,
      trackingLinesCount: 8,
      trackingBlockHeight: 0.25,
      osdEnabled: true,
      osdCustomDate: "SYSTEM HALT"
    }
  },
  weddingTape: {
    name: "Family Home Movie",
    description: "1988 Camcorder feel. Heavy chroma bleed and typical auto-focus softness.",
    settings: {
      globalBlur: 0.8,
      chromaSmearFactor: 0.65,
      chromaOffsetBlueX: 5,
      fuzzOpacity: 0.12,
      needleNoise: 0.08,
      trackingLinesCount: 1,
      trackingBlockY: 0.92,
      trackingDisplacementX: 4.0,
      osdEnabled: true,
      osdColor: "#ffffff",
      osdSize: 0.8,
      osdDateMode: "random"
    }
  },
  arcticSignal: {
    name: "Arctic Outpost RF",
    description: "Cold, blue-tinted fringe signal. Extreme noise and weak transmission.",
    settings: {
      globalHueRotate: 200,
      globalSaturation: 20,
      globalContrast: 90,
      fuzzOpacity: 0.65,
      fuzzSize: 4,
      fuzzSpeed: 3.5,
      needleNoise: 0.4,
      trackingLinesCount: 3,
      trackingBlockY: 0.12,
      trackingNoiseDensity: 0.9,
      osdEnabled: true,
      osdCustomDate: "OUTPOST 31"
    }
  },
  brutalist: {
    name: "Brutalist Mono",
    description: "Solid black & white. Aggressive contrast and thick scanlines.",
    settings: {
      globalSaturation: 0,
      globalContrast: 200,
      globalBrightness: 80,
      scanlineOpacity: 1.0,
      scanlineDensity: 320,
      grillScale: 2.5,
      crtCurvature: 0,
      fuzzOpacity: 0.05,
      osdEnabled: true,
      osdCustomDate: "OBJECTIVE.01"
    }
  },
  heatHaze: {
    name: "Desert Heat Haze",
    description: "Mirage-like interference. Intense waviness and shimmering color phase.",
    settings: {
      hWaveAmp: 25,
      hWaveFreq: 0.04,
      hWaveSpeed: 5,
      vWaveAmp: 15,
      vWaveFreq: 0.03,
      vWaveSpeed: 4,
      globalHueRotate: 30,
      globalSaturation: 160,
      fuzzOpacity: 0.02,
      osdEnabled: false,
    }
  },
  liquidCrystal: {
    name: "Bad LCD Matrix",
    description: "Faulty digital display. Low frame rate ghosting and fixed pixel bleed.",
    settings: {
      pixelScale: 6,
      phosphorTrails: 0.94,
      ghostingCount: 2,
      ghostingOffset: 5,
      ghostingStrength: 0.8,
      globalContrast: 140,
      fuzzOpacity: 0,
      scanlineOpacity: 0.4,
      scanlineDensity: 720,
      osdEnabled: true,
      osdCustomDate: "MATRIX ERROR"
    }
  },
  orbitalReentry: {
    name: "Orbital Re-Entry",
    description: "Intense heat-shield vibration. Extreme vertical jitter and thermal noise.",
    settings: {
      vWaveAmp: 30,
      vWaveFreq: 0.08,
      vWaveSpeed: 8,
      lineJitterStrength: 15.0,
      needleNoise: 0.8,
      globalBrightness: 160,
      globalSaturation: 40,
      chromaPhaseShift: 90,
      trackingLinesCount: 2,
      trackingBlockY: 0.15,
      osdEnabled: true,
      osdCustomDate: "ALTITUDE CRITICAL"
    }
  },
  vaporwave: {
    name: "Retro Vaporwave",
    description: "Classic aesthetic. Soft pink/cyan hues, gentle waves, and heavy phosphor trails.",
    settings: {
      globalHueRotate: 280,
      globalSaturation: 160,
      globalBrightness: 110,
      hWaveAmp: 12,
      hWaveFreq: 0.015,
      hWaveSpeed: 1.2,
      phosphorTrails: 0.8,
      chromaOffsetRedX: 6,
      chromaOffsetBlueX: -6,
      crtCurvature: 0.08,
      trackingLinesCount: 1,
      trackingBlockY: 0.1,
      osdEnabled: true,
      osdCustomDate: "ＡＥＳＴＨＥＴＩＣ"
    }
  },
  poltergeist: {
    name: "Poltergeist Feed",
    description: "Haunted television signal. Aggressive needle noise and random tracking blocks.",
    settings: {
      globalSaturation: 5,
      globalContrast: 180,
      fuzzOpacity: 0.4,
      needleNoise: 0.95,
      needleNoiseDensity: 0.8,
      trackingLinesCount: 4,
      trackingBlockHeight: 0.08,
      trackingBlockY: 0.65,
      trackingDisplacementX: 60,
      trackingScrollSpeed: 25.0,
      vSyncRoll: 0.005,
      osdEnabled: true,
      osdText: "HELP",
      osdChannel: "CH 00",
      osdCustomDate: "OUT OF TIME"
    }
  },
  surveillanceRetro: {
    name: "1974 Security Reel",
    description: "Low-frame-rate early surveillance. High pixel scale and severe luma bleed.",
    settings: {
      pixelScale: 8,
      globalSaturation: 0,
      globalContrast: 160,
      lumaBleedThreshold: 0.3,
      chromaSmearFactor: 0.9,
      scanlineOpacity: 0.6,
      scanlineDensity: 120,
      globalBlur: 1.5,
      trackingLinesCount: 1,
      trackingBlockY: 0.05,
      osdEnabled: true,
      osdCustomDate: "LOBBY REEL 01"
    }
  },
  acidGlitch: {
    name: "Acid Trip Glitch",
    description: "Hallucinogenic signal feedback. Cycling hues and extreme wave distortion.",
    settings: {
      globalHueRotate: 180,
      globalSaturation: 250,
      hWaveAmp: 40,
      hWaveFreq: 0.05,
      hWaveSpeed: 4,
      vWaveAmp: 25,
      vWaveFreq: 0.04,
      vWaveSpeed: 3,
      chromaPhaseShift: 180,
      fuzzOpacity: 0.1,
      trackingLinesCount: 3,
      trackingBlockY: 0.45,
      osdEnabled: false
    }
  },
  monospaced: {
    name: "Terminal Mono",
    description: "Green phosphorous CRT computer terminal. High scanlines and zero saturation.",
    settings: {
      globalSaturation: 100,
      globalHueRotate: 120,
      globalBrightness: 110,
      globalContrast: 140,
      scanlineOpacity: 0.8,
      scanlineDensity: 600,
      grillMask: "aperture",
      grillScale: 0.5,
      crtCurvature: 0.12,
      fuzzOpacity: 0.02,
      trackingLinesCount: 0,
      osdEnabled: true,
      osdCustomDate: "C:\\>_ SYSTEM"
    }
  },
  forestRanger: {
    name: "Forest Ranger Radio",
    description: "Distant mountain broadcast. Soft signal, warm colors, and light RF fuzz.",
    settings: {
      globalSaturation: 120,
      globalBrightness: 105,
      globalHueRotate: 20,
      fuzzOpacity: 0.15,
      fuzzColorRatio: 0.8,
      needleNoise: 0.05,
      chromaSmearFactor: 0.2,
      scanlineOpacity: 0.2,
      trackingLinesCount: 1,
      trackingBlockY: 0.9,
      osdEnabled: true,
      osdCustomDate: "LOOKOUT 09"
    }
  },
  underwater: {
    name: "Deep Pressure Feed",
    description: "Submarine hull camera. Low visibility, blue tint, and high phosphor residue.",
    settings: {
      globalHueRotate: 210,
      globalSaturation: 30,
      globalBrightness: 70,
      globalBlur: 2.5,
      vWaveAmp: 10,
      vWaveFreq: 0.01,
      hWaveAmp: 5,
      phosphorTrails: 0.98,
      ghostingCount: 3,
      trackingLinesCount: 1,
      trackingBlockY: 0.2,
      osdEnabled: true,
      osdCustomDate: "4000M DEPTH"
    }
  },
  solarFlare: {
    name: "Solar Flare Emission",
    description: "Intense solar radiation interference. Blinding brightness and searing orange trails.",
    settings: {
      globalBrightness: 180,
      globalSaturation: 200,
      globalHueRotate: 20,
      phosphorTrails: 0.9,
      ghostingCount: 5,
      ghostingStrength: 0.6,
      fuzzOpacity: 0.15,
      fuzzColorRatio: 1.0,
      trackingLinesCount: 1,
      trackingBlockY: 0.12,
      osdEnabled: true,
      osdCustomDate: "WARNING: RADIATION"
    }
  },
  nightVision: {
    name: "Gen-1 Night Vision",
    description: "Vintage military optics. High green monochrome gain and visible sensor grain.",
    settings: {
      globalSaturation: 0,
      globalHueRotate: 100,
      globalBrightness: 140,
      globalContrast: 120,
      fuzzOpacity: 0.25,
      fuzzSize: 3,
      needleNoise: 0.05,
      scanlineOpacity: 0.4,
      trackingLinesCount: 1,
      trackingBlockY: 0.88,
      osdEnabled: true,
      osdColor: "#00ff00",
      osdCustomDate: "NVG.ACT 02:41"
    }
  },
  badReception: {
    name: "Fringe Signal Drop",
    description: "Poor RF reception. Constant sync drift and heavy color static.",
    settings: {
      hSyncSkew: 15.0,
      vSyncRoll: 0.002,
      fuzzOpacity: 0.45,
      fuzzColorRatio: 0.5,
      needleNoise: 0.3,
      chromaPhaseShift: 45,
      lumaBleedThreshold: 0.1,
      trackingLinesCount: 2,
      trackingBlockY: 0.05,
      osdEnabled: true,
      osdCustomDate: "CHECK ANTENNA"
    }
  },
  degaussFail: {
    name: "Magnetic Degauss Fail",
    description: "Corrupted CRT shadow mask. Extreme rainbow color distortions and geometric warping.",
    settings: {
      chromaOffsetRedX: 15,
      chromaOffsetBlueX: -15,
      chromaPhaseShift: 120,
      crtCurvature: 0.4,
      globalSaturation: 180,
      hWaveAmp: 5,
      hWaveFreq: 0.005,
      trackingLinesCount: 1,
      trackingBlockY: 0.3,
      osdEnabled: false
    }
  },
  glitchHop: {
    name: "Circuit Bent Feed",
    description: "Faulty hardware glitching. Rapid-fire noise, high-speed waves, and pixel fragmentation.",
    settings: {
      pixelScale: 8,
      hWaveAmp: 50,
      hWaveFreq: 0.1,
      hWaveSpeed: 10,
      needleNoise: 0.8,
      needleNoiseDensity: 0.9,
      trackingLinesCount: 10,
      trackingBlockHeight: 0.05,
      trackingBlockY: 0.25,
      trackingDisplacementX: 50,
      osdEnabled: true,
      osdCustomDate: "F_AA_UUL_T"
    }
  },
  sunsetDrive: {
    name: "Sunset Cruise 84",
    description: "Warm, soft-focus drive into the sun. Golden hour glow with heavy motion trails.",
    settings: {
      globalHueRotate: 340,
      globalSaturation: 130,
      globalBrightness: 115,
      globalBlur: 2.0,
      phosphorTrails: 0.85,
      scanlineOpacity: 0.15,
      crtVignette: 1.2,
      trackingLinesCount: 1,
      trackingBlockY: 0.95,
      osdEnabled: true,
      osdCustomDate: "JULY 1984"
    }
  },
  damagedDvd: {
    name: "Scratch Disc Fail",
    description: "Digital decay on an analog screen. Macroblock ghosting and frozen frame artifacts.",
    settings: {
      pixelScale: 4,
      ghostingCount: 5,
      ghostingOffset: 2,
      ghostingStrength: 0.9,
      lumaBleedThreshold: 0.05,
      chromaSmearFactor: 0.1,
      fuzzOpacity: 0,
      trackingLinesCount: 0,
      osdEnabled: true,
      osdCustomDate: "[READ ERROR]"
    }
  },
  terminalHack: {
    name: "Hacker Manifesto",
    description: "High-contrast amber terminal. Sharp scanlines and vertical text jitter.",
    settings: {
      globalSaturation: 100,
      globalHueRotate: 35,
      globalBrightness: 120,
      globalContrast: 160,
      scanlineOpacity: 0.9,
      scanlineDensity: 400,
      trackingLinesCount: 1,
      trackingBlockY: 0.02,
      osdEnabled: true,
      osdColor: "#ffaa00",
      osdTextWobble: 4,
      osdTextWobbleSpeed: 5,
      osdCustomDate: "ROOT@LOCAL >"
    }
  },
  voyagerProbe: {
    name: "Voyager Probe",
    description: "Deep space transmission. Extreme noise, blue shift, and weak signal tracking.",
    settings: {
      globalHueRotate: 240,
      globalSaturation: 15,
      globalContrast: 80,
      fuzzOpacity: 0.7,
      fuzzSize: 5,
      needleNoise: 0.5,
      trackingLinesCount: 2,
      trackingBlockY: 0.75,
      trackingDisplacementX: 25,
      osdEnabled: true,
      osdCustomDate: "EARTH DISTANT"
    }
  },
  moltenCore: {
    name: "Valve Core Monitor",
    description: "Extreme heat interference. Melting waves and glowing luma bleed.",
    settings: {
      hWaveAmp: 20,
      hWaveFreq: 0.02,
      hWaveSpeed: 3,
      globalHueRotate: 0,
      globalSaturation: 180,
      globalBrightness: 140,
      lumaBleedThreshold: 0.2,
      chromaSmearFactor: 0.8,
      scanlineOpacity: 0.5,
      trackingLinesCount: 1,
      trackingBlockY: 0.55,
      osdEnabled: true,
      osdCustomDate: "TEMP: CRITICAL"
    }
  },
  midnightHaunt: {
    name: "Midnight Haunt",
    description: "Cursed tape aesthetic. Heavy grain and a ghostly slow-crawling tracking band.",
    settings: {
      fuzzOpacity: 0.5,
      needleNoise: 0.4,
      trackingScrollSpeed: -4.0,
      vSyncRoll: 0.002,
      hSyncSkew: 1.5,
      globalSaturation: 40,
      osdEnabled: true,
      osdText: "SEARCHING..."
    }
  },
  broadcastInterfere: {
    name: "Broadcast Interfere",
    description: "High-power antenna failure. Fast upward scrolling and chromatic split pulses.",
    settings: {
      trackingScrollSpeed: 35.0,
      hSyncSkew: 15.0,
      fuzzOpacity: 0.3,
      chromaPhaseShift: 120,
      vWaveAmp: 20,
      lineJitterStrength: 8.0,
      osdEnabled: true,
      osdChannel: "ANT 2"
    }
  },
  deterioratedMemory: {
    name: "Deteriorated Memory",
    description: "Fading magnetic signal. High color bleed and erratic tracking jitter.",
    settings: {
      globalBlur: 1.2,
      chromaSmearFactor: 0.95,
      lumaBleedThreshold: 0.2,
      trackingScrollSpeed: 0,
      trackingDisplacementX: 35.0,
      trackingLinesCount: 5,
      globalSaturation: 140,
      osdEnabled: true,
      osdCustomDate: "MEM RECOVERY"
    }
  },
  psychedelicDrift: {
    name: "Psychedelic Drift",
    description: "Deep magnetic saturation with a continuous shifting color phase cycle.",
    settings: {
      globalSaturation: 160,
      chromaPhaseShift: 0,
      chromaScrollSpeed: 4.5,
      chromaSmearFactor: 0.6,
      hWaveAmp: 8,
      hWaveFreq: 0.05,
      hWaveSpeed: 2.0,
      osdEnabled: true,
      osdText: "COLOR SWIRL"
    }
  }
};

export const RETRO_STOCK_VIDEOS = [
  {
    id: "cozy_arcade",
    name: "[SEA SCENIC] VideoJS Deep Blue Oceans & Reefs Calibration Stream",
    url: "https://vjs.zencdn.net/v/oceans.mp4",
  },
  {
    id: "traffic_tokyo",
    name: "[TRAFFIC SCAN] CodePen Urban Transit Night Loop",
    url: "https://assets.codepen.io/6093409/hub_transit.mp4",
  },
  {
    id: "traffic_aerial",
    name: "[NATURE LOFI] CodePen Serene Forest River Flow Stream",
    url: "https://assets.codepen.io/6093409/river.mp4",
  },
  {
    id: "bunny",
    name: "[SMPTE PATTERN] W3C Big Buck Bunny HD Test Broadcast",
    url: "https://media.w3.org/2010/05/bunny/trailer.mp4",
  }
];
