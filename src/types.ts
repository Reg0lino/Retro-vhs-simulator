/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SimulatorSettings {
  // Input Signal SOURCE
  sourceType: "colorbars" | "grid" | "bluescreen" | "upload" | "camera" | "transparent" | "solid" | "webvideo" | "media";
  sourceColor: string;
  sourceZoom: "cover" | "contain";
  gifPlaybackSpeed: number; // For gif source animations
  gifPlaying: boolean;
  blendOverlayGifSpeed: number;
  blendOverlayGifPlaying: boolean;

  // NEW ADVANCED RETRO DECK CONTROLS
  pixelScale: number; // Downscaling factor for 480p/240p simulation (1 = native, 2-8 = downscaled pixels)
  
  // Custom Foreground Overlay System
  overlayType: "none" | "image" | "vhs_bezel" | "record_osd";
  overlayOpacity: number;
  overlayScale: number;
  overlayX: number; // % offset from screen center
  overlayY: number; // % offset from screen center
  overlayBlendMode: "normal" | "screen" | "multiply" | "overlay" | "color-dodge";

  // Bi-directional Sine Wave Warp Controls
  hWaveAmp: number;
  hWaveFreq: number;
  hWaveSpeed: number;
  vWaveAmp: number;
  vWaveFreq: number;
  vWaveSpeed: number;

  // Global & Media Color filters
  globalBlur: number;
  globalBrightness: number;
  globalContrast: number;
  globalSaturation: number;
  globalHueRotate: number;

  webVideoSrc: string; // URL link or designated stock loop
  
  // 1. Line Wobble & Noise (X & Y Granular Control)
  globalWobbleSpeed: number;
  globalWobbleAmpX: number;
  globalWobbleAmpY: number;
  globalWobbleFreqX: number;
  globalWobbleFreqY: number;
  lineJitterStrength: number;
  lineJitterFrequency: number;
  hSyncSkew: number; // Bend top of screen
  vSyncRoll: number; // Vertical screen scrolling
  
  // 2. VHS Fuzz, Static & Tape Dropouts
  fuzzOpacity: number;
  fuzzSize: number;
  fuzzSpeed: number;
  fuzzColorRatio: number; // RGB color static vs grayscale snow
  needleNoise: number; // Tape dropouts / white lines
  needleNoiseDensity: number;
  thermalNoiseFreq: number; // Random horizontal electrical distortion waves

  // 3. Magnetic Tracking Distortions
  trackingLinesCount: number;
  trackingBlockY: number; // Vertical center of the main error block
  trackingBlockHeight: number; // Thickness of distortion band
  trackingDisplacementX: number; // Left/Right jaggedness
  trackingScrollSpeed: number; // Vertical movement speed for the tracking band
  trackingNoiseDensity: number; // Snow density inside tracking area
  trackingFuzzOpacity: number; // Transparency of feedback overlay inside block

  // 4. Advanced Chromatic Aberration & Color Bleeding
  chromaOffsetRedX: number;
  chromaOffsetRedY: number;
  chromaOffsetBlueX: number;
  chromaOffsetBlueY: number;
  chromaOffsetGreenX: number;
  chromaOffsetGreenY: number;
  chromaPhaseShift: number; // Color wheel rotation
  chromaScrollSpeed: number; // Dynamic hue shifting speed
  chromaSmearFactor: number; // Horizontal bleeding to the right
  lumaBleedThreshold: number; // Bright fields bleed into neighbors

  // 5. CRT Phosphor Ghosting & Antenna Multipath (Double imaging)
  ghostingCount: number; // Number of duplicated ghost reflections
  ghostingOffset: number; // Horizontal distance of ghosts
  ghostingStrength: number; // Reflection intensity
  phosphorTrails: number; // Dynamic frame accumulation (phosphor decay lag)

  // 6. CRT Monitor Aesthetics
  scanlineOpacity: number;
  scanlineDensity: number;
  scanlinesEnabled: boolean;
  crtCurvature: number; // Screen lens bend physical simulation
  crtVignette: number; // Corner overshadows
  grillMask: "none" | "aperture" | "shadow" | "slot";
  grillScale: number;

   // 7. On-Screen Display (OSD) Settings
  osdEnabled: boolean;
  osdText: string;
  osdChannel: string;
  osdColor: string;
  osdSize: number;
  osdDateMode: "1996" | "current" | "random"; // VCR Vintage Lock vs Live dynamic date vs Date Randomizer
  osdTimeTracking: "clock" | "counter" | "none"; // Option for clock time tracking vs index/tape counter
  osdRandomYear?: number;
  osdRandomMonth?: string;
  osdRandomDay?: number;
  osdCustomDate: string; // User typed date
  osdCustomY: number; // Y coordinates from 0 to 1
  osdTextWobble: number; // Wobble drift strength
  osdTextWobbleSpeed: number; // Speed of text drift

  // Dynamic Multi-Exposure Blend overlay
  blendOverlayUrl: string; // Custom GIF/Image URL
  blendOverlayOpacity: number; // Transparency slider
  blendOverlayScale: number; // Scale slider
  blendOverlayWobble: number; // Magnetic drift slide
  blendOverlaySpeed: number; // magnetic drift wobble rate
  blendOverlayRotation: number; // continuous spin offset speed
  blendOverlayPulse: number; // glow amplitude pulsating
  blendOverlayX: number; // position x
  blendOverlayY: number; // position y
  blendOverlayBlendMode: "normal" | "screen" | "multiply" | "overlay" | "color-dodge";
  blendOverlayIsGif: boolean;

  // Screen layout
  flexToScreen: boolean; // Stretch/compress to target viewport size directly

  // 9. Video Target Properties
  canvasWidth: number;
  canvasHeight: number;
  exportFps: number; // Frame rate for GIF/WebM exports
  exportFormat: "webm" | "mp4";
  
  // 10. Frame Transformations
  flipHorizontal: boolean;
  flipVertical: boolean;

  // 11. Debugger Diagnostics Mode
  debugModeEnabled: boolean;

  // 11. Custom Quick Sliders
  customSliderSlots: string[];
}

export interface PresetPreset {
  name: string;
  description: string;
  settings: Partial<SimulatorSettings>;
}

export interface ExportConfig {
  format: "mp4" | "webm" | "gif";
  preset: "original" | "485p" | "480p" | "720p" | "1080p" | "4k" | "custom";
  customWidth: number;
  customHeight: number;
  fps: number;
  bitrateLevel: "low" | "medium" | "high" | "cranked" | "ludicrous" | "custom";
  customBitrate: number;
  gifLength: "short" | "medium" | "long";
  stopTrigger: "manual" | "auto";
  autoStopDuration: number;
}

