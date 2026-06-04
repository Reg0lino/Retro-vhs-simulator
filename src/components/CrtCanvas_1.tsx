/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from "react";
import "gifler";
import { SimulatorSettings } from "../types";

interface CrtCanvasProps {
  settings: SimulatorSettings;
  videoElement: HTMLVideoElement | null;
  webVideoElement: HTMLVideoElement | null;
  uploadedImageElement: HTMLImageElement | null;
  blendOverlayElement: HTMLImageElement | null;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isRecording: boolean;
  onFrameUpdate: (frameCount: number) => void;
  videoSpeed: number;
  onCorsError?: (hasError: boolean) => void;
  resetSyncTrigger: number;
  tvPowerState: "on" | "off" | "turning_off" | "turning_on";
  manualGlitch: boolean;
}

export const CrtCanvas: React.FC<CrtCanvasProps> = ({
  settings,
  videoElement,
  webVideoElement,
  uploadedImageElement,
  blendOverlayElement,
  canvasRef,
  isRecording,
  onFrameUpdate,
  videoSpeed,
  onCorsError,
  resetSyncTrigger,
  tvPowerState,
  manualGlitch,
}) => {
  const trailCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const bufferCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const ghostCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const tempWarpCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const tempWarpCanvas2Ref = useRef<HTMLCanvasElement | null>(null);
  const needleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const snowCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rollYRef = useRef<number>(0);
  const trackingOffsetRef = useRef<number>(0);
  const chromaOffsetRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const corsErrorRef = useRef<boolean>(false);

  const lastPowerStateRef = useRef<"on" | "off" | "turning_off" | "turning_on">("on");
  const powerTransitionStartRef = useRef<number>(performance.now());

  // Animated GIF Helper Canvases & Animators
  const bgGifCanvasRef = useRef<HTMLCanvasElement>(document.createElement("canvas"));
  const ovGifCanvasRef = useRef<HTMLCanvasElement>(document.createElement("canvas"));
  const bgGifAnimRef = useRef<any>(null);
  const ovGifAnimRef = useRef<any>(null);
  const lastBgUrlRef = useRef<string>("");
  const lastOvUrlRef = useRef<string>("");

  useEffect(() => {
    // Background GIF Animator
    const bgUrl = (uploadedImageElement as any)?.src || "";
    if (bgUrl && bgUrl.toLowerCase().includes(".gif") && bgUrl !== lastBgUrlRef.current) {
      lastBgUrlRef.current = bgUrl;
      if (bgGifAnimRef.current) bgGifAnimRef.current.stop();
      try {
        const giflerInstance = (window as any).gifler;
        if (giflerInstance) {
          giflerInstance(bgUrl).get((anim: any) => {
            bgGifAnimRef.current = anim;
            anim.animateInCanvas(bgGifCanvasRef.current);
            if (!settings.gifPlaying) anim.stop();
          });
        }
      } catch (e) {
        console.error("Gifler BG fail", e);
      }
    } else if (bgGifAnimRef.current) {
      if (settings.gifPlaying) bgGifAnimRef.current.start();
      else bgGifAnimRef.current.stop();
    }
    
    // Overlay GIF Animator
    const ovUrl = (blendOverlayElement as any)?.src || "";
    if (ovUrl && ovUrl.toLowerCase().includes(".gif") && ovUrl !== lastOvUrlRef.current) {
      lastOvUrlRef.current = ovUrl;
      if (ovGifAnimRef.current) ovGifAnimRef.current.stop();
      try {
        const giflerInstance = (window as any).gifler;
        if (giflerInstance) {
          giflerInstance(ovUrl).get((anim: any) => {
            ovGifAnimRef.current = anim;
            anim.animateInCanvas(ovGifCanvasRef.current);
            if (!settings.blendOverlayGifPlaying) anim.stop();
          });
        }
      } catch (e) {
        console.error("Gifler OV fail", e);
      }
    } else if (ovGifAnimRef.current) {
      if (settings.blendOverlayGifPlaying) ovGifAnimRef.current.start();
      else ovGifAnimRef.current.stop();
    }
  }, [uploadedImageElement, blendOverlayElement, settings.gifPlaying, settings.blendOverlayGifPlaying]);

  useEffect(() => {
	rollYRef.current = 0;
  }, [resetSyncTrigger]);

  const settingsRef = useRef<SimulatorSettings>(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const tvPowerStateRef = useRef<"on" | "off" | "turning_off" | "turning_on">(tvPowerState);
  useEffect(() => {
    tvPowerStateRef.current = tvPowerState;
  }, [tvPowerState]);

  const manualGlitchRef = useRef<boolean>(manualGlitch);
  useEffect(() => {
    manualGlitchRef.current = manualGlitch;
  }, [manualGlitch]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const currentWidth = settings.canvasWidth;
    const currentHeight = settings.canvasHeight;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const scale = settings.pixelScale || 1;
    const activeW = Math.max(16, Math.round(currentWidth / scale));
    const activeH = Math.max(12, Math.round(currentHeight / scale));

    // Create or resize trail canvas/buffer elements
    if (!trailCanvasRef.current) {
      trailCanvasRef.current = document.createElement("canvas");
    }
    const trailCanvas = trailCanvasRef.current;
    if (trailCanvas.width !== activeW || trailCanvas.height !== activeH) {
      trailCanvas.width = activeW;
      trailCanvas.height = activeH;
      (trailCanvas as any)._ctx = null;
    }

    const getHelperCanvas = (ref: React.MutableRefObject<HTMLCanvasElement | null>, wWidth: number, hHeight: number): HTMLCanvasElement => {
      if (!ref.current) {
        ref.current = document.createElement("canvas");
      }
      const c = ref.current;
      if (c.width !== wWidth || c.height !== hHeight) {
        c.width = wWidth;
        c.height = hHeight;
        (c as any)._ctx = null;
      }
      return c;
    };

    const getHelperContext = (ref: React.MutableRefObject<HTMLCanvasElement | null>, wWidth: number, hHeight: number, willReadFrequently = false): CanvasRenderingContext2D | null => {
      const c = getHelperCanvas(ref, wWidth, hHeight);
      if (!(c as any)._ctx) {
        (c as any)._ctx = c.getContext("2d", { willReadFrequently });
      }
      return (c as any)._ctx;
    };

    let animationFrameId: number;

    // Fast static noise cache inside simulation resolution bounding boxes
    const noiseCache: ImageData[] = [];
    const cacheCount = 6;
    const generateStaticCache = () => {
      const activeSettings = settingsRef.current;
      for (let k = 0; k < cacheCount; k++) {
        const cacheImg = ctx.createImageData(activeW, activeH);
        const data = cacheImg.data;
        const colorRatio = activeSettings.fuzzColorRatio;
        for (let i = 0; i < data.length; i += 4) {
          const val = Math.random() * 255;
          const isColor = Math.random() < colorRatio;
          if (isColor) {
            data[i] = val; // R
            data[i + 1] = Math.random() * 255; // G
            data[i + 2] = Math.random() * 255; // B
          } else {
            data[i] = val; // R
            data[i + 1] = val; // G
            data[i + 2] = val; // B
          }
          data[i + 3] = 255; // Alpha
        }
        noiseCache.push(cacheImg);
      }
    };
    generateStaticCache();

    // Create custom drops/needle image pregenerators using simulation values
    const needleCache: ImageData[] = [];
    const generateNeedles = () => {
      const activeSettings = settingsRef.current;
      for (let k = 0; k < 5; k++) {
        const cacheImg = ctx.createImageData(activeW, activeH);
        const data = cacheImg.data;
        const dropsCount = activeSettings.needleNoise * 35;
        for (let s = 0; s < dropsCount; s++) {
          const ry = Math.floor(Math.random() * activeH);
          const rx = Math.floor(Math.random() * (activeW - Math.min(25, activeW - 5)));
          const length = 4 + Math.floor(Math.random() * 30);
          for (let l = 0; l < length; l++) {
            const idx = (ry * activeW + (rx + l)) * 4;
            if (idx >= 0 && idx < data.length) {
              const val = Math.random() > 0.5 ? 255 : 30;
              data[idx] = val;
              data[idx + 1] = val;
              data[idx + 2] = val;
              data[idx + 3] = Math.random() * 200; // semi transparent dirt
            }
          }
        }
        needleCache.push(cacheImg);
      }
    };
    generateNeedles();

    // Main render loop
    const render = () => {
      frameCountRef.current++;
      const frameCount = frameCountRef.current;
      onFrameUpdate(frameCount);

      const baseSettings = settingsRef.current;

      // Dynamic manual glitch overlay
      const settings = { ...baseSettings };
      if (manualGlitchRef.current) {
        const seed = Math.sin(frameCount * 0.9) * 0.5 + 0.5;
        const seedCos = Math.cos(frameCount * 1.3) * 0.5 + 0.5;

        settings.vSyncRoll = Math.max(baseSettings.vSyncRoll || 0, 0.12 + seed * 0.45); 
        settings.hSyncSkew = Math.max(baseSettings.hSyncSkew || 0, 20 + seedCos * 35); 
        settings.fuzzOpacity = Math.max(baseSettings.fuzzOpacity || 0, 0.35 + seed * 0.4); 
        settings.lineJitterStrength = Math.max(baseSettings.lineJitterStrength || 0, 10 + seedCos * 20); 
        settings.trackingDisplacementX = Math.max(baseSettings.trackingDisplacementX || 0, 15 + seed * 45); 
        settings.trackingBlockHeight = Math.max(baseSettings.trackingBlockHeight || 0, 0.2 + seedCos * 0.35); 
        settings.trackingLinesCount = Math.max(baseSettings.trackingLinesCount || 0, 4 + Math.floor(seed * 8)); 
        settings.trackingNoiseDensity = Math.max(baseSettings.trackingNoiseDensity || 0, 0.5 + seedCos * 0.4); 
        if (typeof baseSettings.osdTextWobble === "number") {
          settings.osdTextWobble = Math.max(baseSettings.osdTextWobble, 15);
        }
      }

      const w = settings.canvasWidth;
      const h = settings.canvasHeight;

      // Calculate low-resolution buffer sizing
      const scale = settings.pixelScale || 1;
      const activeW = Math.max(16, Math.round(w / scale));
      const activeH = Math.max(12, Math.round(h / scale));

      // Retrieve pre-allocated offscreen buffer canvas
      const bufferCanvas = getHelperCanvas(bufferCanvasRef, activeW, activeH);
      const bufferCtx = getHelperContext(bufferCanvasRef, activeW, activeH, true);
      if (!bufferCtx) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      // Get the active video element
      const activeVideo = settings.sourceType === "webvideo" ? webVideoElement : videoElement;
      if (activeVideo && !activeVideo.paused) {
        activeVideo.playbackRate = videoSpeed;
      }

      // Handle vertical V-Sync loop slip on small resolution heights
      if (settings.vSyncRoll > 0) {
        rollYRef.current = (rollYRef.current + settings.vSyncRoll * 105) % activeH;
      }

      // Handle Automatic Tracking Band Scrolling
      if (settings.trackingScrollSpeed && settings.trackingScrollSpeed !== 0) {
        // Speed scaling (e.g. 10.0 -> reasonably fast visible motion)
        const scrollDelta = (settings.trackingScrollSpeed * 0.002);
        trackingOffsetRef.current = (trackingOffsetRef.current - scrollDelta);
        // Normalize to 0-1 range
        if (trackingOffsetRef.current > 1.0) trackingOffsetRef.current -= 1.0;
        if (trackingOffsetRef.current < 0) trackingOffsetRef.current += 1.0;
      } else {
        // If speed is 0, we can either keep offset or reset it.
        // User said: "if it is on 0, it will just be one band across wherever the vertical center is"
        // This implies resetting or at least not moving if speed is 0. 
        // But if they change speed to 0, it should stop exactly where it is.
      }

      // Handle Automatic Chroma Phase Cycling (Hue Swirl)
      if (settings.chromaScrollSpeed && settings.chromaScrollSpeed !== 0) {
        // Increment phase offset (0-360 range)
        chromaOffsetRef.current = (chromaOffsetRef.current + settings.chromaScrollSpeed * 0.5) % 360;
        if (chromaOffsetRef.current < 0) chromaOffsetRef.current += 360;
      }

      // X/Y Wobble offset calculations
      const time = frameCount * 0.03 * settings.globalWobbleSpeed;
      const globalOffsetX = (Math.sin(time * settings.globalWobbleFreqX) * settings.globalWobbleAmpX) / scale;
      const globalOffsetY = (Math.cos(time * settings.globalWobbleFreqY) * settings.globalWobbleAmpY) / scale;

      // Apply the global brightness, saturation, contrast, blur, and hue rotate filters natively using GPU-backed filter!
      const blurVal = settings.globalBlur / scale; // scale blur proportionally
      bufferCtx.filter = `blur(${blurVal}px) brightness(${settings.globalBrightness}%) contrast(${settings.globalContrast}%) saturate(${settings.globalSaturation}%) hue-rotate(${settings.globalHueRotate}deg)`;

      // Clean workspace or render background fill state in offscreen buffer
      bufferCtx.fillStyle = settings.sourceType === "bluescreen" 
        ? "#0000a4" 
        : (settings.sourceType === "transparent" ? "rgba(0,0,0,0)" : settings.sourceColor);

      if (settings.sourceType === "transparent") {
        bufferCtx.clearRect(0, 0, activeW, activeH);
      } else {
        bufferCtx.fillRect(0, 0, activeW, activeH);
      }

      // --- STAGE 1: Draw source element inside buffer ---
      bufferCtx.save();
      if (settings.flipHorizontal || settings.flipVertical) {
        bufferCtx.scale(settings.flipHorizontal ? -1 : 1, settings.flipVertical ? -1 : 1);
        if (settings.flipHorizontal) bufferCtx.translate(-activeW, 0);
        if (settings.flipVertical) bufferCtx.translate(0, -activeH);
      }
      drawBaseLayer(bufferCtx, activeW, activeH, globalOffsetX, globalOffsetY, settings);
      bufferCtx.restore();

      // --- NEW: Draw customizable OSD text & UI overlays BEFORE pixel & wave distortions ---
      if (settings.osdEnabled) {
        renderOsdUI(bufferCtx, activeW, activeH, frameCount, settings, scale);
      }

      if (settings.overlayType === "vhs_bezel") {
        renderVhsBezelUI(bufferCtx, activeW, activeH, frameCount, settings, scale);
      } else if (settings.overlayType === "record_osd") {
        renderRecordOsdUI(bufferCtx, activeW, activeH, frameCount, settings, scale);
      }

      if (blendOverlayElement && blendOverlayElement.complete && blendOverlayElement.naturalWidth > 0 && settings.blendOverlayOpacity > 0) {
        bufferCtx.save();
        
        let alpha = settings.blendOverlayOpacity;
        if (settings.blendOverlayPulse && settings.blendOverlayPulse > 0) {
          const pulseT = frameCount * 0.06;
          const factor = 0.5 + 0.5 * Math.sin(pulseT);
          alpha = settings.blendOverlayOpacity * (1.0 - settings.blendOverlayPulse * 0.5 * factor);
        }
        bufferCtx.globalAlpha = Math.max(0, Math.min(1, alpha));
        bufferCtx.globalCompositeOperation = (settings.blendOverlayBlendMode || "screen") as any;

        // Apply magnetic wobble / drift
        let wobbleX = 0;
        let wobbleY = 0;
        if (settings.blendOverlayWobble && settings.blendOverlayWobble > 0) {
          const wobbleT = frameCount * 0.04 * (settings.blendOverlaySpeed !== undefined ? settings.blendOverlaySpeed : 1.0);
          wobbleX = Math.sin(wobbleT * 1.5) * settings.blendOverlayWobble;
          wobbleY = Math.cos(wobbleT * 1.2) * settings.blendOverlayWobble * 0.5;
        }

        const isGif = (blendOverlayElement as any)?.src?.toLowerCase().includes(".gif");
        const drawSource = (isGif && ovGifCanvasRef.current.width > 0) ? ovGifCanvasRef.current : blendOverlayElement;

        const oW = drawSource instanceof HTMLImageElement ? (drawSource as HTMLImageElement).naturalWidth : (drawSource as HTMLCanvasElement).width || 300;
        const oH = drawSource instanceof HTMLImageElement ? (drawSource as HTMLImageElement).naturalHeight : (drawSource as HTMLCanvasElement).height || 200;
        const overlayScale = settings.blendOverlayScale !== undefined ? settings.blendOverlayScale : 1.0;
        const drawW = (oW * overlayScale) / scale;
        const drawH = (oH * overlayScale) / scale;

        // Base aligned position inside low-res buffer
        const offsetX = ((settings.blendOverlayX || 0) / 100) * activeW;
        const offsetY = ((settings.blendOverlayY || 0) / 100) * activeH;
        const centerX = activeW / 2 + offsetX + wobbleX / scale;
        const centerY = activeH / 2 + offsetY + wobbleY / scale;

        bufferCtx.translate(centerX, centerY);
        if (settings.blendOverlayRotation && settings.blendOverlayRotation !== 0) {
          const angle = frameCount * 0.015 * settings.blendOverlayRotation * (settings.blendOverlayGifSpeed || 1);
          bufferCtx.rotate(angle);
        }

        bufferCtx.drawImage(drawSource, -drawW / 2, -drawH / 2, drawW, drawH);
        bufferCtx.restore();
      }

      // --- STAGE 2: CRT Multi-path Ghosting Reflections inside buffer ---
      if (settings.ghostingCount > 0 && settings.ghostingStrength > 0) {
        const ghostTemp = getHelperCanvas(ghostCanvasRef, activeW, activeH);
        const gtCtx = getHelperContext(ghostCanvasRef, activeW, activeH);
        if (gtCtx) {
          gtCtx.clearRect(0, 0, activeW, activeH);
          gtCtx.drawImage(bufferCanvas, 0, 0);

          bufferCtx.save();
          // Under screen blend mode, draw shifted ghosts of the base layer
          bufferCtx.globalCompositeOperation = "screen";
          for (let i = 1; i <= settings.ghostingCount; i++) {
            const shiftX = (i * settings.ghostingOffset) / scale;
            bufferCtx.globalAlpha = settings.ghostingStrength * Math.pow(0.50, i);
            bufferCtx.drawImage(ghostTemp, shiftX, 0);
          }
          bufferCtx.restore();
        }
      }

      // Clear filter to avoid blurring noise & physical overlays
      bufferCtx.filter = "none";

      // --- STAGE 3: Phosphor trails / Decay on low-res scale (super fast!) ---
      if (settings.phosphorTrails > 0) {
        if (!(trailCanvas as any)._ctx) {
          (trailCanvas as any)._ctx = trailCanvas.getContext("2d");
        }
        const trailCtx = (trailCanvas as any)._ctx;
        if (trailCtx) {
          trailCtx.globalAlpha = 1.0 - settings.phosphorTrails;
          trailCtx.drawImage(bufferCanvas, 0, 0);
          
          bufferCtx.globalAlpha = settings.phosphorTrails;
          bufferCtx.drawImage(trailCanvas, 0, 0);
          bufferCtx.globalAlpha = 1.0;
        }
      }

      const effectiveTrackingY = (settings.trackingBlockY + trackingOffsetRef.current) % 1.0;
      const tMinY = Math.round(effectiveTrackingY * activeH);
      const tMaxY = tMinY + Math.round(settings.trackingBlockHeight * activeH);

      // Read image pixel buffer of active scale which integrates tape defects
      let imgData: ImageData | null = null;
      try {
        imgData = bufferCtx.getImageData(0, 0, activeW, activeH);
        if (corsErrorRef.current) {
          corsErrorRef.current = false;
          onCorsError?.(false);
        }
      } catch (e) {
        if (!corsErrorRef.current) {
          corsErrorRef.current = true;
          onCorsError?.(true);
        }
      }

      let accumDisplacement = Math.abs(globalOffsetX) + Math.abs(globalOffsetY);

      if (imgData) {
        const d = imgData.data;

        // --- STAGE 4: Sync skew and Wobbling line bending ---
        const activeLineJitter = ((Math.random() - 0.5) * settings.lineJitterStrength) / scale;

        for (let y = 0; y < activeH; y++) {
          let horizontalShift = 0;

          if (Math.random() < settings.lineJitterFrequency) {
            horizontalShift += activeLineJitter;
          }

          if (settings.hSyncSkew > 0) {
            const skewFactor = (Math.exp(-y / (42.0 / scale)) * settings.hSyncSkew * 3.5) / scale;
            horizontalShift += Math.sin(y / (8 / scale) + frameCount * 0.15) * skewFactor;
          }

          // Wrapping aware tracking block detection
          let isInTrackingBlock = false;
          if (tMaxY < activeH) {
             isInTrackingBlock = y >= tMinY && y <= tMaxY;
          } else {
             // Wrapped around the bottom
             const wrappedMaxY = tMaxY % activeH;
             isInTrackingBlock = y >= tMinY || y <= wrappedMaxY;
          }

          if (isInTrackingBlock && settings.trackingDisplacementX > 0) {
            const blockFactor = (Math.sin(y / (12.0 / scale) + frameCount * 0.25) * settings.trackingDisplacementX) / scale;
            const jitterNoise = ((Math.random() - 0.5) * settings.trackingDisplacementX * 0.4) / scale;
            horizontalShift += (blockFactor + jitterNoise);
            accumDisplacement += Math.abs(horizontalShift);
          }

          if (Math.abs(horizontalShift) > 0.5) {
            shiftRow(d, y, Math.round(horizontalShift), activeW);
          }
        }

        // --- STAGE 5: Vertical roll frame shift ---
        if (rollYRef.current > 0.8) {
          rollVertical(d, Math.round(rollYRef.current), activeW, activeH);
        }

        // --- STAGE 6: Chroma phase rotations & Horizontal chrominance smears ---
        const totalPhase = (settings.chromaPhaseShift + chromaOffsetRef.current) % 360;
        const radPhase = (totalPhase * Math.PI) / 180;
        const cosP = Math.cos(radPhase);
        const sinP = Math.sin(radPhase);
        const smear = settings.chromaSmearFactor * 0.95;
        const lumaThreshold = settings.lumaBleedThreshold * 255;

        for (let y = 0; y < activeH; y++) {
          const rowStart = y * activeW * 4;

          let activeR = d[rowStart];
          let activeG = d[rowStart + 1];
          let activeB = d[rowStart + 2];

          for (let x = 0; x < activeW; x++) {
            const idx = rowStart + x * 4;
            const pixelLuma = 0.299 * d[idx] + 0.587 * d[idx+1] + 0.114 * d[idx+2];

            // 1. Color channel smearing
            if (smear > 0 && x > 0) {
              activeR = d[idx] * (1.0 - smear) + activeR * smear;
              activeG = d[idx+1] * (1.0 - smear) + activeG * smear;
              activeB = d[idx+2] * (1.0 - smear) + activeB * smear;

              d[idx] = Math.min(255, activeR);
              d[idx+1] = Math.min(255, activeG);
              d[idx+2] = Math.min(255, activeB);
            }

            // 2. High-brightness color bleeding
            if (pixelLuma > lumaThreshold && x < activeW - 3) {
              const bleedR = d[idx];
              const bleedG = d[idx+1];
              const bleedB = d[idx+2];
              const nextIdx = idx + 4;

              d[nextIdx] = Math.min(255, Math.max(d[nextIdx], bleedR * 0.65));
              d[nextIdx+1] = Math.min(255, Math.max(d[nextIdx+1], bleedG * 0.65));
              d[nextIdx+2] = Math.min(255, Math.max(d[nextIdx+2], bleedB * 0.65));
            }

            // 3. Fast phase rotation of the NTSC carrier
            if (settings.chromaPhaseShift !== 0 || chromaOffsetRef.current !== 0) {
              const orgR = d[idx];
              const orgG = d[idx+1];
              const orgB = d[idx+2];
              
              d[idx] = Math.max(0, Math.min(255, orgR * cosP - orgG * sinP));
              d[idx+1] = Math.max(0, Math.min(255, orgR * sinP + orgG * cosP));
              d[idx+2] = Math.max(0, Math.min(255, orgB * cosP + orgR * sinP));
            }
          }
        }

        // --- STAGE 6.5: Chromatic Aberration X/Y shift ---
        const rx = Math.round(settings.chromaOffsetRedX / scale);
        const ry = Math.round(settings.chromaOffsetRedY / scale);
        const gx = Math.round(settings.chromaOffsetGreenX / scale);
        const gy = Math.round(settings.chromaOffsetGreenY / scale);
        const bx = Math.round(settings.chromaOffsetBlueX / scale);
        const by = Math.round(settings.chromaOffsetBlueY / scale);

        if (rx !== 0 || ry !== 0 || gx !== 0 || gy !== 0 || bx !== 0 || by !== 0) {
          shiftChromaChannels(d, activeW, activeH, rx, ry, gx, gy, bx, by);
        }

        // Put pixel distortions back to the buffer Canvas!
        bufferCtx.putImageData(imgData, 0, 0);
      }

      // --- STAGE 6.6: Hardware-Accelerated Horizontal & Vertical Sine-Wave Warps! ---
      if (settings.hWaveAmp > 0 || settings.vWaveAmp > 0) {
        const tempCanvas = getHelperCanvas(tempWarpCanvasRef, activeW, activeH);
        const tempCtx = getHelperContext(tempWarpCanvasRef, activeW, activeH);
        if (tempCtx) {
          tempCtx.clearRect(0, 0, activeW, activeH);
          tempCtx.drawImage(bufferCanvas, 0, 0);
          bufferCtx.clearRect(0, 0, activeW, activeH);

          // 1. Horizontal Warp slices
          if (settings.hWaveAmp > 0) {
            const timeH = frameCount * 0.05 * settings.hWaveSpeed;
            const amp = settings.hWaveAmp / scale;
            const freq = settings.hWaveFreq;
            for (let y = 0; y < activeH; y++) {
              const hOffset = Math.sin(y * freq + timeH) * amp;
              bufferCtx.drawImage(
                tempCanvas,
                0, y, activeW, 1,
                hOffset, y, activeW, 1
              );
            }
          } else {
            bufferCtx.drawImage(tempCanvas, 0, 0);
          }

          // 2. Vertical Warp slices
          if (settings.vWaveAmp > 0) {
            const tempCanvas2 = getHelperCanvas(tempWarpCanvas2Ref, activeW, activeH);
            const tempCtx2 = getHelperContext(tempWarpCanvas2Ref, activeW, activeH);
            if (tempCtx2) {
              tempCtx2.clearRect(0, 0, activeW, activeH);
              tempCtx2.drawImage(bufferCanvas, 0, 0);
              bufferCtx.clearRect(0, 0, activeW, activeH);

              const timeV = frameCount * 0.05 * settings.vWaveSpeed;
              const amp = settings.vWaveAmp / scale;
              const freq = settings.vWaveFreq;
              for (let x = 0; x < activeW; x++) {
                const vOffset = Math.sin(x * freq + timeV) * amp;
                bufferCtx.drawImage(
                  tempCanvas2,
                  x, 0, 1, activeH,
                  x, vOffset, 1, activeH
                );
              }
            }
          }
        }
      }

      // --- STAGE 6.7: Foreground Overlay placement inside tape loop (Deprecated - use active blend overlays) ---
      // (Relic code removed to prevent UI conflicts)


      // Sound module removed

      // --- STAGE 6.8: Overlay procedural static fuzz / white-dirt needles inside tape (fat pixelated!) ---
      // 1. Digital and magnetic pixel needles
      if (settings.needleNoise > 0 && needleCache.length > 0) {
        const needleIdx = Math.floor(frameCount * settings.fuzzSpeed * 0.4) % needleCache.length;
        const needles = needleCache[needleIdx];
        if (needles) {
          bufferCtx.save();
          bufferCtx.globalCompositeOperation = "screen";
          bufferCtx.globalAlpha = Math.min(1.0, settings.fuzzOpacity * 1.5);
          const tempNeedle = getHelperCanvas(needleCanvasRef, activeW, activeH);
          const tnCtx = getHelperContext(needleCanvasRef, activeW, activeH);
          if (tnCtx) {
            tnCtx.clearRect(0, 0, activeW, activeH);
            tnCtx.putImageData(needles, 0, 0);
            bufferCtx.drawImage(tempNeedle, 0, 0);
          }
          bufferCtx.restore();
        }
      }

      // 2. Interactive full tape static fuzz loop with dynamic fuzzSize grain scaling
      if (settings.fuzzOpacity > 0) {
        bufferCtx.save();
        bufferCtx.globalAlpha = settings.fuzzOpacity;
        bufferCtx.globalCompositeOperation = "screen";

        // Grain size is driven by settings.fuzzSize.
        // We divide activeW/H by fuzzSize to generate coarser noise, then stretch it without smoothing.
        const fSize = Math.max(1, settings.fuzzSize);
        const noiseW = Math.max(4, Math.round(activeW / fSize));
        const noiseH = Math.max(3, Math.round(activeH / fSize));

        const offscreenSnow = getHelperCanvas(snowCanvasRef, noiseW, noiseH);
        const oskCtx = getHelperContext(snowCanvasRef, noiseW, noiseH);
        if (oskCtx) {
          const noiseImg = oskCtx.createImageData(noiseW, noiseH);
          const data = noiseImg.data;
          const colorRatio = settings.fuzzColorRatio;
          for (let i = 0; i < data.length; i += 4) {
            const val = Math.random() * 255;
            const isColor = Math.random() < colorRatio;
            if (isColor) {
              data[i] = val; // R
              data[i + 1] = Math.random() * 255; // G
              data[i + 2] = Math.random() * 255; // B
            } else {
              data[i] = val; // R
              data[i + 1] = val; // G
              data[i + 2] = val; // B
            }
            data[i + 3] = 255; // Alpha
          }
          oskCtx.putImageData(noiseImg, 0, 0);
          
          bufferCtx.imageSmoothingEnabled = false;
          bufferCtx.drawImage(offscreenSnow, 0, 0, activeW, activeH);
        }
        bufferCtx.restore();
      }

      // 3. Realistic segment tape creases inside tracking regions
      if (settings.trackingLinesCount > 0 && settings.trackingNoiseDensity > 0) {
        bufferCtx.save();
        const tHeight = Math.max(2, settings.trackingBlockHeight * activeH);
        
        // Solid white/gray color dash tape crease blocks
        bufferCtx.fillStyle = "rgba(255, 255, 255, " + (settings.trackingNoiseDensity * 0.85) + ")";
        const linesCount = settings.trackingLinesCount * 3;

        // Calculate tMinY again for this context since it might be wrapped 
        const effectiveTrackingY = (settings.trackingBlockY + trackingOffsetRef.current) % 1.0;
        const currentTMinY = Math.round(effectiveTrackingY * activeH);

        for (let i = 0; i < linesCount; i++) {
          // Drunk offset inside the block boundaries
          const rawSy = currentTMinY + ((Math.sin(frameCount * 0.08 + i) * 0.5 + 0.5) * tHeight);
          const sy = rawSy % activeH;
          
          // Draw horizontal segments that look like actual magnetic dropout tears!
          const segmentCount = 3 + Math.floor(Math.random() * 5);
          for (let s = 0; s < segmentCount; s++) {
            const sx = Math.random() * activeW;
            const sw = 10 + Math.random() * (activeW / 3);
            const sh = 1 + Math.random() * 3;
            bufferCtx.fillRect(sx, sy, sw, sh);
          }
        }
        bufferCtx.restore();
      }

      // --- STAGE 7: Draw the Low-res Tape Buffer Canvas onto the High-res display Canvas with pixelated scale! ---
      // Check for power state changes
      const currentTvPowerState = tvPowerStateRef.current;
      if (currentTvPowerState !== lastPowerStateRef.current) {
        lastPowerStateRef.current = currentTvPowerState;
        powerTransitionStartRef.current = performance.now();
      }

      let powerScaleX = 1.0;
      let powerScaleY = 1.0;
      let powerBrightness = 1.0;
      let powerContrast = 1.0;
      let powerSaturate = 1.0;
      let powerAlpha = 1.0;
      let drawWhiteGlowLine = false;
      let drawWhiteGlowDot = false;
      let isOff = false;

      const now = performance.now();
      if (currentTvPowerState === "off") {
        isOff = true;
      } else if (currentTvPowerState === "turning_off") {
        const elapsed = now - powerTransitionStartRef.current;
        const p = Math.min(1.0, elapsed / 500); // 500ms
        
        if (p < 0.35) {
          const subP = p / 0.35;
          powerScaleY = 1.0 - (1.0 - 0.003) * subP;
          powerScaleX = 1.0;
          powerBrightness = 1.0 + 3.0 * subP;
          powerContrast = 1.0 + 1.0 * subP;
          powerSaturate = 1.0 - 0.8 * subP;
          drawWhiteGlowLine = true;
        } else if (p < 0.75) {
          const subP = (p - 0.35) / 0.40;
          powerScaleY = 0.003;
          powerScaleX = 1.0 - (1.0 - 0.003) * subP;
          powerBrightness = 4.0 + 8.0 * subP;
          powerContrast = 2.0 + 2.0 * subP;
          powerSaturate = 0.2 - 0.2 * subP;
          drawWhiteGlowDot = true;
        } else {
          const subP = (p - 0.75) / 0.25;
          powerScaleY = 0.003;
          powerScaleX = 0.003;
          powerAlpha = Math.max(0, 1.0 - subP);
          if (powerAlpha <= 0) {
            isOff = true;
          }
        }
      } else if (currentTvPowerState === "turning_on") {
        const elapsed = now - powerTransitionStartRef.current;
        const p = Math.min(1.0, elapsed / 550); // 550ms
        
        if (p < 0.25) {
          const subP = p / 0.25;
          powerScaleX = 0.003;
          powerScaleY = 0.003;
          powerAlpha = subP;
          drawWhiteGlowDot = true;
        } else if (p < 0.65) {
          const subP = (p - 0.25) / 0.40;
          powerScaleX = 0.003 + (1.0 - 0.003) * subP;
          powerScaleY = 0.003;
          powerBrightness = 12.0 - 8.0 * subP;
          powerContrast = 4.0 - 2.0 * subP;
          powerSaturate = 0.2 * subP;
          drawWhiteGlowLine = true;
        } else {
          const subP = (p - 0.65) / 0.35;
          powerScaleX = 1.0;
          powerScaleY = 0.003 + (1.0 - 0.003) * subP;
          powerBrightness = 4.0 - 3.0 * subP;
          powerContrast = 2.0 - 1.0 * subP;
          powerSaturate = 0.2 + 0.8 * subP;
        }
      }

      if (isOff) {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, w, h);
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.save();
      ctx.globalAlpha = powerAlpha;

      if (powerScaleX !== 1.0 || powerScaleY !== 1.0) {
        const cx = w / 2;
        const cy = h / 2;
        ctx.translate(cx, cy);
        ctx.scale(powerScaleX, powerScaleY);
        ctx.translate(-cx, -cy);
      }

      if (powerBrightness !== 1.0 || powerContrast !== 1.0 || powerSaturate !== 1.0) {
        ctx.filter = `brightness(${powerBrightness * 100}%) contrast(${powerContrast * 100}%) saturate(${powerSaturate * 100}%)`;
      }

      if (settings.crtCurvature && settings.crtCurvature > 0) {
        ctx.clearRect(0, 0, w, h);
        const slices = 36; // 36 slices is extremely fast and provides perfect rounded curving visually!
        const sliceH = h / slices;
        const curvature = settings.crtCurvature * 0.25; // Ample, realistic barrel sweep

        for (let i = 0; i < slices; i++) {
          const sy = i * sliceH;
          const dy = (sy - h / 2) / (h / 2); // normalized center distance: -1.0 to 1.0
          
          // barrel warp scale: wider in the middle, squeezed on critical vertical boundaries
          const scaleX = 1.0 - curvature * (dy * dy);
          const targetW = w * scaleX;
          const targetX = (w - targetW) / 2;

          // spherical dome wrap displacement
          const domeYOffset = (Math.sin((i / slices) * Math.PI) - 0.5) * curvature * h * 0.35;
          const targetY = sy - domeYOffset;

          ctx.drawImage(
            bufferCanvas,
            0,
            (sy / h) * bufferCanvas.height,
            bufferCanvas.width,
            bufferCanvas.height / slices,
            targetX,
            targetY,
            targetW,
            sliceH + 1.2
          );
        }
      } else {
        ctx.clearRect(0, 0, w, h);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(bufferCanvas, 0, 0, w, h);
      }

      // --- STAGE 8: (Deprecated) ---
      // (Overlay drawing moved to buffer stage for curvature warping)

      // --- STAGE 9: CRT Monitor scanlines & Phosphor Masks ---
      applyCrtPhosphorGrills(ctx, w, h, settings);

      ctx.filter = "none";
      if (drawWhiteGlowLine || drawWhiteGlowDot) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    // Viewfinder and battery procedural overlays helpers
    const renderVhsBezelUI = (g: CanvasRenderingContext2D, w: number, h: number, curFrame: number, settings: SimulatorSettings, scale: number) => {
      g.save();
      g.strokeStyle = "rgba(255, 255, 255, 0.45)";
      g.lineWidth = Math.max(1, Math.round(2 / scale));
      const padX = w * 0.05;
      const padY = h * 0.05;
      g.strokeRect(padX, padY, w - padX * 2, h - padY * 2);

      // Corner markers
      g.strokeStyle = "rgba(255, 255, 255, 0.8)";
      g.lineWidth = Math.max(1, Math.round(3.5 / scale));
      const cl = Math.max(5, Math.round(26 / scale));
      // Top Left
      g.beginPath(); g.moveTo(padX + cl, padY); g.lineTo(padX, padY); g.lineTo(padX, padY + cl); g.stroke();
      // Top Right
      g.beginPath(); g.moveTo(w - padX - cl, padY); g.lineTo(w - padX, padY); g.lineTo(w - padX, padY + cl); g.stroke();
      // Bottom Left
      g.beginPath(); g.moveTo(padX + cl, h - padY); g.lineTo(padX, h - padY); g.lineTo(padX, h - padY - cl); g.stroke();
      // Bottom Right
      g.beginPath(); g.moveTo(w - padX - cl, h - padY); g.lineTo(w - padX, h - padY); g.lineTo(w - padX, h - padY - cl); g.stroke();

      // Center view target
      const cx = w / 2;
      const cy = h / 2;
      g.strokeStyle = "rgba(255, 255, 255, 0.55)";
      g.lineWidth = Math.max(1, Math.round(1 / scale));
      g.beginPath();
      const targetL = Math.max(5, Math.round(20 / scale));
      g.moveTo(cx - targetL, cy); g.lineTo(cx + targetL, cy);
      g.moveTo(cx, cy - targetL); g.lineTo(cx, cy + targetL);
      g.stroke();

      // Flashing battery meter level (low battery red blink)
      const batX = w - padX - Math.max(10, Math.round(60 / scale));
      const batY = padY + Math.max(5, Math.round(18 / scale));
      const bW = Math.max(6, Math.round(24 / scale));
      const bH = Math.max(3, Math.round(12 / scale));
      g.strokeStyle = "rgba(255, 255, 255, 0.85)";
      g.lineWidth = Math.max(1, Math.round(2 / scale));
      g.strokeRect(batX, batY, bW, bH);
      g.fillRect(batX + bW, batY + Math.round(bH * 0.25), Math.max(1, Math.round(3 / scale)), Math.round(bH * 0.5));
      
      const blink = Math.floor(curFrame / 12) % 2 === 0;
      if (blink) {
        g.fillStyle = "#f43f5e"; // bright red
        g.fillRect(batX + Math.max(1, Math.round(3 / scale)), batY + Math.max(1, Math.round(3 / scale)), bW - Math.max(2, Math.round(6 / scale)), bH - Math.max(2, Math.round(6 / scale)));
      }

      g.restore();
    };

    const renderRecordOsdUI = (g: CanvasRenderingContext2D, w: number, h: number, curFrame: number, settings: SimulatorSettings, scale: number) => {
      g.save();
      const fontSize = Math.max(6, Math.round(16 / scale));
      g.font = `bold ${fontSize}px "Courier New", Courier, monospace`;
      
      const dotBlink = Math.floor(curFrame / 25) % 2 === 0;
      if (dotBlink) {
        g.fillStyle = "#f43f5e"; // bright red REC bulb
        g.beginPath();
        g.arc(w * 0.08, h * 0.1, Math.max(2, Math.round(7 / scale)), 0, Math.PI * 2);
        g.fill();
      }
      
      g.fillStyle = "rgba(255, 255, 255, 0.9)";
      g.fillText("● REC", w * 0.08 + Math.max(5, Math.round(15 / scale)), h * 0.1 + Math.max(1, Math.round(5 / scale)));

      // Programmatic recording duration stopwatch
      const totalSecs = Math.floor(curFrame / 30);
      const hStr = String(Math.floor(totalSecs / 3600)).padStart(2, "0");
      const mStr = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, "0");
      const sStr = String(totalSecs % 60).padStart(2, "0");
      const fStr = String(curFrame % 30).padStart(2, "0");
      g.fillText(`0:${hStr}:${mStr}:${sStr}.${fStr}`, w * 0.08, h * 0.1 + Math.max(5, Math.round(32 / scale)));
      g.restore();
    };

    // Subroutine to draw alignment graphics
    const drawBaseLayer = (
      g: CanvasRenderingContext2D,
      w: number,
      h: number,
      offsetX: number,
      offsetY: number,
      settings: SimulatorSettings
    ) => {
      const type = settings.sourceType;
      const zoom = settings.sourceZoom;

      // 1. Draw base video feed (camera, webvideo, or uploaded video) as the background if active & available
      let backgroundMedia: HTMLVideoElement | HTMLImageElement | null = null;
      if (videoElement) {
        backgroundMedia = videoElement;
      } else if (webVideoElement) {
        backgroundMedia = webVideoElement;
      }

      // Draw active background media first (if sourceType is not transparently overridden and we have media)
      if (backgroundMedia && type !== "upload" && type !== "camera" && type !== "webvideo" && type !== "bluescreen") {
        fitImage(g, backgroundMedia, w, h, offsetX, offsetY, zoom);
      }

      // 2. Overlay the chosen sourceType on top (with transparency or blending config, except bluescreen)
      if (type === "solid") {
        g.save();
        if (backgroundMedia) {
          g.globalAlpha = 0.5;
        }
        g.fillStyle = settings.sourceColor;
        g.fillRect(offsetX, offsetY, w, h);
        g.restore();
      } else if (type === "bluescreen") {
        g.fillStyle = "#0000bd";
        g.fillRect(offsetX, offsetY, w, h);
      } else if (type === "colorbars") {
        g.save();
        if (backgroundMedia) {
          g.globalAlpha = 0.45;
        }
        const bars = ["#bfbfbf", "#bfbf00", "#00bfbf", "#00bf00", "#bf00bf", "#bf0000", "#0000bf"];
        const bW = w / 7;
        const tall = h * 0.68;
        
        // Tall bars
        for (let i = 0; i < 7; i++) {
          g.fillStyle = bars[i];
          g.fillRect(offsetX + i * bW, offsetY, bW, tall);
        }
        // Med color blocks
        const medY = tall;
        const medH = h * 0.08;
        const medBars = ["#0000bf", "#111111", "#bf00bf", "#111111", "#00bfbf", "#111111", "#bfbfbf"];
        for (let i = 0; i < 7; i++) {
          g.fillStyle = medBars[i];
          g.fillRect(offsetX + i * bW, offsetY + medY, bW, medH);
        }
        // Sub calibration blocks
        const subY = tall + medH;
        const subH = h * 0.24;
        const subWide = w / 4;
        const subBars = ["#001838", "#ffffff", "#2c005e", "#050505"];
        for (let i = 0; i < 4; i++) {
          g.fillStyle = subBars[i];
          g.fillRect(offsetX + i * subWide, offsetY + subY, subWide, subH);
        }
        g.restore();
      } else if (type === "grid") {
        g.save();
        g.strokeStyle = "rgba(40, 180, 255, 0.55)";
        g.lineWidth = 1;
        g.beginPath();
        const step = Math.round(w / 16);
        for (let x = 0; x < w; x += step) {
          g.moveTo(offsetX + x, offsetY);
          g.lineTo(offsetX + x, offsetY + h);
        }
        for (let y = 0; y < h; y += step) {
          g.moveTo(offsetX, offsetY + y);
          g.lineTo(offsetX + w, offsetY + y);
        }
        g.stroke();

        g.strokeStyle = "#ff007f";
        g.lineWidth = 2;
        g.beginPath();
        g.arc(offsetX + w / 2, offsetY + h / 2, h * 0.38, 0, Math.PI * 2);
        g.arc(offsetX + w / 2, offsetY + h / 2, h * 0.12, 0, Math.PI * 2);
        g.stroke();

        g.strokeStyle = "yellow";
        g.lineWidth = 1;
        g.strokeRect(offsetX + w * 0.05, offsetY + h * 0.05, w * 0.9, h * 0.9);

        g.fillStyle = "#ffffff";
        g.font = `bold 10px monospace`;
        g.fillText("CRT SCAN MATRIX 4:3", offsetX + w / 2 - 60, offsetY + h / 2 - 20);
        g.fillText("PHASE NTSC SYNC", offsetX + w / 2 - 50, offsetY + h / 2 + 5);
        g.restore();
      } else if (type === "upload") {
        const isGif = (uploadedImageElement as any)?.src?.toLowerCase().includes(".gif");
        if (isGif && bgGifCanvasRef.current.width > 0) {
          fitImage(g, bgGifCanvasRef.current, w, h, offsetX, offsetY, zoom);
        } else if (uploadedImageElement) {
          fitImage(g, uploadedImageElement, w, h, offsetX, offsetY, zoom);
        } else if (videoElement) {
          fitImage(g, videoElement, w, h, offsetX, offsetY, zoom);
        }
      } else if (type === "camera" && videoElement) {
        fitImage(g, videoElement, w, h, offsetX, offsetY, zoom);
      } else if (type === "webvideo" && webVideoElement) {
        fitImage(g, webVideoElement, w, h, offsetX, offsetY, zoom);
      }
    };

    const fitImage = (
      g: CanvasRenderingContext2D,
      media: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
      cw: number,
      ch: number,
      ox: number,
      oy: number,
      zoom: "cover" | "contain"
    ) => {
      // Security check: Don't draw broken or uninitialized images/videos
      if (media instanceof HTMLImageElement) {
        if (!media.complete || media.naturalWidth === 0) return;
      } else if (media instanceof HTMLVideoElement) {
        if (media.readyState < 2) return; 
      } else if (media instanceof HTMLCanvasElement) {
        if (media.width === 0) return;
      }

      let mW = 640;
      let mH = 480;

      if (media instanceof HTMLImageElement) {
        mW = media.naturalWidth;
        mH = media.naturalHeight;
      } else if (media instanceof HTMLVideoElement) {
        mW = media.videoWidth || 640;
        mH = media.videoHeight || 480;
      } else if (media instanceof HTMLCanvasElement) {
        mW = media.width;
        mH = media.height;
      }
      
      const aspect = (mW / mH) || 1;

      if (zoom === "cover") {
        let drawW = cw;
        let drawH = cw / aspect;
        if (drawH < ch) {
          drawH = ch;
          drawW = ch * aspect;
        }
        const xOffset = (cw - drawW) / 2;
        const yOffset = (ch - drawH) / 2;
        g.drawImage(media, ox + xOffset, oy + yOffset, drawW, drawH);
      } else {
        let drawW = cw;
        let drawH = cw / aspect;
        if (drawH > ch) {
          drawH = ch;
          drawW = ch * aspect;
        }
        const xOffset = (cw - drawW) / 2;
        const yOffset = (ch - drawH) / 2;
        g.drawImage(media, ox + xOffset, oy + yOffset, drawW, drawH);
      }
    };

    // Low-level pixels array shifts
    const shiftRow = (data: Uint8ClampedArray, y: number, shift: number, width: number) => {
      const offset = y * width * 4;
      const length = width * 4;
      
      const rowCopy = new Uint8ClampedArray(data.buffer, data.byteOffset + offset, length);
      const rowClone = new Uint8ClampedArray(rowCopy);

      for (let x = 0; x < width; x++) {
        const dest = x * 4;
        let src = x - shift;
        if (src < 0) {
          src = width + (src % width);
        } else if (src >= width) {
          src = src % width;
        }
        const srcIdx = src * 4;

        data[offset + dest] = rowClone[srcIdx];
        data[offset + dest + 1] = rowClone[srcIdx + 1];
        data[offset + dest + 2] = rowClone[srcIdx + 2];
        data[offset + dest + 3] = rowClone[srcIdx + 3];
      }
    };

    // Shift screen canvas vertically simulating rolling frames
    const rollVertical = (data: Uint8ClampedArray, shiftY: number, width: number, height: number) => {
      const bytesCount = data.length;
      const shiftBytes = shiftY * width * 4;
      const clone = new Uint8ClampedArray(data);

      for (let i = 0; i < bytesCount; i++) {
        let srcIdx = i - shiftBytes;
        if (srcIdx < 0) {
          srcIdx = bytesCount + (srcIdx % bytesCount);
        }
        data[i] = clone[srcIdx];
      }
    };

    // Sub-pixel channel aberration shifter (X/Y adjustments on each R, G, B individually)
    const shiftChromaChannels = (
      data: Uint8ClampedArray,
      width: number,
      height: number,
      rx: number,
      ry: number,
      gx: number,
      gy: number,
      bx: number,
      by: number
    ) => {
      const totalBytes = data.length;
      const clone = new Uint8ClampedArray(data);
      const rowBytes = width * 4;

      for (let y = 0; y < height; y++) {
        const rowStart = y * rowBytes;

        // Red Y coordinates boundaries
        let srcRedY = y - ry;
        if (srcRedY < 0) srcRedY = 0;
        if (srcRedY >= height) srcRedY = height - 1;
        const srcRedStart = srcRedY * rowBytes;

        // Green Y coordinate boundaries
        let srcGreenY = y - gy;
        if (srcGreenY < 0) srcGreenY = 0;
        if (srcGreenY >= height) srcGreenY = height - 1;
        const srcGreenStart = srcGreenY * rowBytes;

        // Blue Y coordinate boundaries
        let srcBlueY = y - by;
        if (srcBlueY < 0) srcBlueY = 0;
        if (srcBlueY >= height) srcBlueY = height - 1;
        const srcBlueStart = srcBlueY * rowBytes;

        for (let x = 0; x < width; x++) {
          const destIdx = rowStart + x * 4;

          // Red X
          let targetRx = x - rx;
          if (targetRx < 0) targetRx = 0;
          if (targetRx >= width) targetRx = width - 1;
          const srcRedIdx = srcRedStart + targetRx * 4;

          // Green X
          let targetGx = x - gx;
          if (targetGx < 0) targetGx = 0;
          if (targetGx >= width) targetGx = width - 1;
          const srcGreenIdx = srcGreenStart + targetGx * 4;

          // Blue X
          let targetBx = x - bx;
          if (targetBx < 0) targetBx = 0;
          if (targetBx >= width) targetBx = width - 1;
          const srcBlueIdx = srcBlueStart + targetBx * 4;

          // Write split colors back in
          data[destIdx] = clone[srcRedIdx];         // R
          data[destIdx + 1] = clone[srcGreenIdx + 1]; // G
          data[destIdx + 2] = clone[srcBlueIdx + 2]; // B
        }
      }
    };

    // Draw scanlines & CRT glass effects
    const applyCrtPhosphorGrills = (g: CanvasRenderingContext2D, w: number, h: number, settings: SimulatorSettings) => {
      // 1. CRT Raster Scanline gaps
      if (settings.scanlinesEnabled !== false && settings.scanlineOpacity > 0) {
        g.fillStyle = "rgba(0, 0, 0, " + settings.scanlineOpacity + ")";
        const linesCount = settings.scanlineDensity > 0 ? settings.scanlineDensity : 480;
        const thickness = h / linesCount;
        for (let y = 0; y < h; y += thickness * 2) {
          g.fillRect(0, y, w, Math.max(1, thickness));
        }
      }

      // 2. Subpixel Grill textures (aperture, slot or shadow)
      if (settings.grillMask !== "none") {
        g.save();
        g.globalCompositeOperation = "multiply";
        const scale = settings.grillScale;
        
        if (settings.grillMask === "aperture") {
          g.strokeStyle = "rgba(0, 0, 0, 0.15)";
          g.lineWidth = 1;
          g.beginPath();
          for (let x = 0; x < w; x += 3 * scale) {
            g.moveTo(x, 0);
            g.lineTo(x, h);
          }
          g.stroke();
        } else if (settings.grillMask === "shadow") {
          // Shadow Mask dots pattern
          g.fillStyle = "rgba(0, 0, 0, 0.25)";
          g.beginPath();
          for (let y = 0; y < h; y += 4 * scale) {
            const shiftOdd = (y % (8 * scale) === 0 ? 0 : 2 * scale);
            for (let x = shiftOdd; x < w; x += 4 * scale) {
              g.rect(x, y, 1.5 * scale, 1.5 * scale);
            }
          }
          g.fill();
        } else if (settings.grillMask === "slot") {
          // Brick Slot dynamic texture
          g.strokeStyle = "rgba(0, 0, 0, 0.16)";
          g.lineWidth = 1;
          g.beginPath();
          for (let x = 0; x < w; x += 5 * scale) {
            const shiftOdd = (x % (10 * scale) === 0 ? 0 : 3 * scale);
            for (let y = shiftOdd; y < h; y += 6 * scale) {
              g.moveTo(x, y);
              g.lineTo(x, y + 4 * scale);
            }
          }
          g.stroke();
        }
        g.restore();
      }

      // 3. Lens Vignette shadow (CRT Electron beam corner dispersion loss)
      if (settings.crtVignette > 0) {
        g.save();
        const innerRadius = h * Math.max(0.05, 0.44 - Math.max(0, settings.crtVignette - 0.5) * 0.25);
        const outerRadius = w * Math.max(0.4, 0.72 - Math.max(0, settings.crtVignette - 0.5) * 0.15);
        const vign = g.createRadialGradient(
          w / 2, h / 2, innerRadius,
          w / 2, h / 2, outerRadius
        );
        vign.addColorStop(0, "rgba(0,0, 0, 0)");
        vign.addColorStop(1, "rgba(0, 0, 0, " + Math.min(0.99, settings.crtVignette * 0.98) + ")");
        g.fillStyle = vign;
        g.fillRect(0, 0, w, h);
        g.restore();
      }

      // 4. Outer bezel glass highlights
      if (settings.crtCurvature > 0) {
        g.save();
        // Dynamic glossy top beam reflection
        const reflectGrd = g.createLinearGradient(0, 0, 0, h * 0.22);
        reflectGrd.addColorStop(0, "rgba(255, 255, 255, " + settings.crtCurvature * 0.4 + ")");
        reflectGrd.addColorStop(1, "rgba(255, 255, 255, 0)");
        g.fillStyle = reflectGrd;
        g.fillRect(0, 0, w, h * 0.22);

        // Curved reflection edge line
        g.strokeStyle = "rgba(255, 255, 255, 0.05)";
        g.lineWidth = 3;
        g.beginPath();
        g.arc(w / 2, h / 2 + 150, Math.min(w, h) * 0.94, Math.PI * 0.82, Math.PI * 1.18);
        g.stroke();
        g.restore();
      }
    };

    // Render vintage OSD text UI
    const renderOsdUI = (
      g: CanvasRenderingContext2D,
      w: number,
      h: number,
      curFrame: number,
      settings: SimulatorSettings,
      scale: number
    ) => {
      const fontPixelSize = Math.max(6, Math.round((18 * settings.osdSize) / (scale === 1 ? 0.9 : scale * 0.92)));
      g.save();
      g.font = `bold ${fontPixelSize}px "Courier New", Courier, monospace`;
      g.shadowColor = "rgba(0, 0, 0, 0.9)";
      g.shadowBlur = Math.max(1, Math.round(3.5 / scale));
      g.fillStyle = settings.osdColor;

      const paddingLeft = Math.max(6, Math.round(24 / scale));
      const paddingTop = Math.max(8, Math.round(36 / scale));

      // Draw active recording dots (blinking red)
      if (settings.osdText.trim() !== "") {
        if (isRecording) {
          const blink = Math.floor(curFrame / 15) % 2 === 0;
          g.fillStyle = blink ? "#ef4444" : "rgba(0,0,0,0)";
          g.fillText("● REC", paddingLeft, paddingTop);
          g.fillStyle = settings.osdColor;
          g.fillText("  " + settings.osdText.toUpperCase(), paddingLeft, paddingTop);
        } else {
          g.fillText(settings.osdText.toUpperCase(), paddingLeft, paddingTop);
        }
      }

      // Draw Channel metadata
      if (settings.osdChannel.trim() !== "") {
        g.textAlign = "right";
        g.fillText(settings.osdChannel.toUpperCase(), w - paddingLeft, paddingTop);
        g.textAlign = "left"; // Restores alignment
      }

      // Draw historic dates & time tracking
      const now = new Date();
      const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
      
      let displayYear = String(now.getFullYear());
      let displayM = months[now.getMonth()];
      let displayD = String(now.getDate()).padStart(2, "0");

      if (settings.osdDateMode === "1996" || settings.osdDateMode === "random") {
        displayYear = settings.osdRandomYear ? String(settings.osdRandomYear) : "1996";
        displayM = settings.osdRandomMonth ? settings.osdRandomMonth.toUpperCase() : "OCT";
        displayD = settings.osdRandomDay ? String(settings.osdRandomDay).padStart(2, "0") : "31";
      }

      // American AM/PM Clock Standard (e.g. "AM 12:45:02" or "12:45:02 AM")
      const displayHours = String(now.getHours() % 12 || 12).padStart(2, "0");
      const displayMins = String(now.getMinutes()).padStart(2, "0");
      const displaySecs = String(now.getSeconds()).padStart(2, "0");
      const division = now.getHours() >= 12 ? "PM" : "AM";

      // Tape Counter Simulation Standard (e.g. "0:12:34" or "COUNT 0:12:34")
      const totalSecs = Math.floor(curFrame / 60);
      const counterMins = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, "0");
      const counterSecs = String(totalSecs % 60).padStart(2, "0");
      const counterString = `0:${counterMins}:${counterSecs}`;

      g.font = `bold ${Math.round(fontPixelSize * 0.92)}px "Courier New", Courier, monospace`;
      
      // Calculate active wobble offset for bottom lines
      let driftX = 0;
      let driftY = 0;
      if (settings.osdTextWobble && settings.osdTextWobble > 0) {
        const speed = settings.osdTextWobbleSpeed !== undefined ? settings.osdTextWobbleSpeed : 2.0;
        const t = curFrame * 0.04 * speed;
        driftX = (Math.sin(t) * settings.osdTextWobble) / scale;
        driftY = (Math.cos(t * 0.85) * settings.osdTextWobble * 0.8) / scale;
      }

      // Compute custom OSD Y position (default 0.90 corresponds to bottom)
      const osdYPositionRatio = settings.osdCustomY !== undefined ? settings.osdCustomY : 0.90;
      const bottomY = Math.round(h * osdYPositionRatio) + driftY;

      // Determine date content
      const dateStringToWrite = settings.osdCustomDate && settings.osdCustomDate.trim() !== ""
        ? settings.osdCustomDate
        : `${displayM}. ${displayD} ${displayYear}`;

      // Bottom left timestamp date
      g.fillText(dateStringToWrite, paddingLeft + driftX, bottomY);

      // Bottom right clock / elapsed tracking counter (configurable)
      const timeTrackingMode = settings.osdTimeTracking || "clock";
      if (timeTrackingMode !== "none") {
        g.textAlign = "right";
        const timeToDraw = timeTrackingMode === "counter" 
          ? counterString 
          : `${division} ${displayHours}:${displayMins}:${displaySecs}`;
        g.fillText(timeToDraw, w - paddingLeft + driftX, bottomY);
        g.textAlign = "left";
      }

      g.shadowBlur = 0; // Resets shadow for general drawing safety
      g.restore();
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      // Restore video element speed upon unmount
      const activeVideo = settings.sourceType === "webvideo" ? webVideoElement : videoElement;
      if (activeVideo) {
        activeVideo.playbackRate = videoSpeed;
      }
    };
  }, [settings.canvasWidth, settings.canvasHeight, settings.pixelScale, videoElement, webVideoElement, uploadedImageElement, blendOverlayElement, isRecording, canvasRef, videoSpeed]);

  return null;
};
