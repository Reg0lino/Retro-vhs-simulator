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
  filmFxActive: boolean;
  restartGifTrigger: number;
  filmCountdownActive?: boolean;
  onCountdownComplete?: () => void;
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
  filmFxActive,
  restartGifTrigger,
  filmCountdownActive = false,
  onCountdownComplete,
}) => {
  const trailCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const bufferCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const ghostCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const tempWarpCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const tempWarpCanvas2Ref = useRef<HTMLCanvasElement | null>(null);
  const needleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const snowCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const glowCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const osdCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const tempOsdCanvasRef = useRef<HTMLCanvasElement | null>(null);
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
  
  // Manual GIF Frame Control
  const ovFramesRef = useRef<any[]>([]);
  const ovTotalDurationRef = useRef<number>(0);
  const ovFrameStartRef = useRef<number>(0);
  const ovPausedTimeRef = useRef<number>(0);
  const lastGifPlayingRef = useRef<boolean>(false);

  const settingsRef = useRef(settings);
  
  useEffect(() => {
	settingsRef.current = settings;
  }, [settings]);
  
  const lastBgUrlRef = useRef<string>("");
  const lastOvUrlRef = useRef<string>("");
  const lastRestartRef = useRef<number>(0);

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
    // Allow reload if URL changed OR restart triggered
    const shouldReload = ovUrl && settingsRef.current.blendOverlayIsGif && (ovUrl !== lastOvUrlRef.current || restartGifTrigger !== lastRestartRef.current);
    
    if (shouldReload) {
      if (ovUrl !== lastOvUrlRef.current) lastOvUrlRef.current = ovUrl;
      
      if (ovGifAnimRef.current) {
        ovGifAnimRef.current.stop();
        ovGifAnimRef.current = null;
      }
      ovFramesRef.current = [];
      ovTotalDurationRef.current = 0;
      ovFrameStartRef.current = performance.now();
      ovPausedTimeRef.current = 0;

      try {
        const giflerInstance = (window as any).gifler;
        if (giflerInstance) {
          console.log("CrtCanvas: Attempting to load GIF via frame extractor", ovUrl);
          giflerInstance(ovUrl).get((anim: any) => {
            if (anim && anim.frames) {
              console.log("CrtCanvas: GIF frames decoded successfully", anim.frames.length);
              ovGifAnimRef.current = anim;
              ovFramesRef.current = anim.frames;
              
              // Calculate total duration for looping
              let total = 0;
              anim.frames.forEach((f: any) => {
                total += f.delay || 100;
              });
              ovTotalDurationRef.current = total;
            } else {
              console.warn("CrtCanvas: GIF loaded but frames are missing", anim);
            }
            
            // We do NOT call anim.animateInCanvas here anymore. 
            // We will manualy draw frames in the loop.
            anim.stop(); 
          });
          if (restartGifTrigger !== lastRestartRef.current) lastRestartRef.current = restartGifTrigger;
        }
      } catch (e) {
        console.error("Gifler OV fail", e);
      }
    }

    // Handle Pause/Play state transitions for the internal "clock"
    if (settings.blendOverlayGifPlaying !== lastGifPlayingRef.current) {
      if (settings.blendOverlayGifPlaying) {
        // Resuming: Adjust the start time so the animation continues from where it was
        const pauseDuration = performance.now() - ovPausedTimeRef.current;
        ovFrameStartRef.current += pauseDuration;
      } else {
        // Pausing: Record when we stopped
        ovPausedTimeRef.current = performance.now();
      }
      lastGifPlayingRef.current = settings.blendOverlayGifPlaying;
    }
  }, [uploadedImageElement, blendOverlayElement, settings.gifPlaying, settings.blendOverlayGifPlaying, restartGifTrigger]);

  useEffect(() => {
    rollYRef.current = 0;
    chromaOffsetRef.current = 0;
  }, [resetSyncTrigger]);


  const tvPowerStateRef = useRef<"on" | "off" | "turning_off" | "turning_on">(tvPowerState);
  useEffect(() => {
    tvPowerStateRef.current = tvPowerState;
  }, [tvPowerState]);

  const manualGlitchRef = useRef<boolean>(manualGlitch);
  useEffect(() => {
    // Detect glitch trigger RELEASE to reset vertical sync roll to zero
    if (manualGlitchRef.current === true && manualGlitch === false) {
      rollYRef.current = 0;
    }
    manualGlitchRef.current = manualGlitch;
  }, [manualGlitch]);

  const filmCountdownActiveRef = useRef<boolean>(filmCountdownActive);
  const countdownStartRef = useRef<number | null>(null);
  const lastCountdownFinishedTimeRef = useRef<number>(0);

  useEffect(() => {
    if (filmCountdownActiveRef.current && !filmCountdownActive) {
      lastCountdownFinishedTimeRef.current = performance.now();
    }
    filmCountdownActiveRef.current = filmCountdownActive;
    if (!filmCountdownActive) {
      countdownStartRef.current = null;
    }
  }, [filmCountdownActive]);

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
        const dropsCount = activeSettings.needleNoise * 150; // Increased base count significantly
        const maxLen = 4 + (activeSettings.needleNoiseDensity || 0.5) * 150; // Much longer streaks
        const heightDev = activeSettings.needleNoiseDensity > 1 ? Math.floor(activeSettings.needleNoiseDensity) : 0;
        for (let s = 0; s < dropsCount; s++) {
          const ry = Math.floor(Math.random() * activeH);
          const rx = Math.floor(Math.random() * (activeW - 5));
          const length = 4 + Math.floor(Math.random() * maxLen);
          for (let l = 0; l < length; l++) {
            // Draw possibly multiple lines of height for "fat" streaks
            for(let hOffset = 0; hOffset <= heightDev; hOffset++) {
                const idx = ((ry + hOffset) * activeW + (rx + l)) * 4;
                if (idx >= 0 && idx < data.length) {
                  const val = Math.random() > 0.3 ? 255 : 40; // Higher contrast
                  data[idx] = val;
                  data[idx + 1] = val;
                  data[idx + 2] = val;
                  data[idx + 3] = 200 + Math.random() * 55; // Much more opaque
                }
            }
          }
        }
        needleCache.push(cacheImg);
      }
    };
    generateNeedles();

    const drawFilmCountdown = (
      g: CanvasRenderingContext2D,
      w: number,
      h: number,
      frameCount: number,
      offsetX: number,
      offsetY: number
    ) => {
      const now = performance.now();
      if (!countdownStartRef.current) {
        countdownStartRef.current = now;
      }
      const elapsed = (now - countdownStartRef.current) / 1000;
      
      if (elapsed >= 9.0) {
        if (onCountdownComplete) {
          setTimeout(() => {
            onCountdownComplete();
          }, 0);
        }
        return;
      }

      g.fillStyle = "#111111";
      g.fillRect(0, 0, w, h);

      // During the final second (8.0 to 9.0), display a clean black frame
      if (elapsed >= 8.0) {
        return;
      }

      g.save();
      g.translate(offsetX, offsetY);

      const num = 8 - Math.floor(elapsed);
      const cx = w / 2;
      const cy = h / 2;

      const r1 = Math.min(w, h) * 0.38;
      const r2 = Math.min(w, h) * 0.34;

      g.strokeStyle = "rgba(220, 220, 220, 0.55)";
      g.lineWidth = 1.5;

      g.beginPath();
      g.arc(cx, cy, r1, 0, Math.PI * 2);
      g.stroke();

      g.beginPath();
      g.arc(cx, cy, r2, 0, Math.PI * 2);
      g.stroke();

      g.beginPath();
      g.moveTo(cx - r1 * 1.3, cy);
      g.lineTo(cx - r1 * 0.2, cy);
      g.moveTo(cx + r1 * 0.2, cy);
      g.lineTo(cx + r1 * 1.3, cy);
      
      g.moveTo(cx, cy - r1 * 1.3);
      g.lineTo(cx, cy - r1 * 0.2);
      g.moveTo(cx, cy + r1 * 0.2);
      g.lineTo(cx, cy + r1 * 1.3);
      g.stroke();

      const theta = (elapsed % 1.0) * 2 * Math.PI - Math.PI / 2;

      g.fillStyle = "rgba(255, 255, 255, 0.08)";
      g.beginPath();
      g.moveTo(cx, cy);
      g.arc(cx, cy, r1, -Math.PI / 2, theta, false);
      g.closePath();
      g.fill();

      // Sweeping hand: a few pixels wide (5.5px) for high visibility
      g.strokeStyle = "#ffffff";
      g.lineWidth = 5.5;
      g.beginPath();
      g.moveTo(cx, cy);
      g.lineTo(cx + Math.cos(theta) * r1, cy + Math.sin(theta) * r1);
      g.stroke();

      g.fillStyle = "#f3f4f6";
      const fontSize = Math.round(Math.min(w, h) * 0.44);
      g.font = `900 ${fontSize}px sans-serif`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(String(num), cx, cy);

      g.restore();
    };

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

      if (filmFxActive) {
        settings.filmFrameBurn = Math.max(baseSettings.filmFrameBurn || 0, 5.0);
        settings.filmFrameJump = Math.max(baseSettings.filmFrameJump || 0, 5.0);
        settings.filmEmulsion = Math.max(baseSettings.filmEmulsion || 0, 2.0);
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

      // X/Y Wobble & Film Mechanical offset calculations
      const time = frameCount * 0.03 * settings.globalWobbleSpeed;
      const globalOffsetX = (Math.sin(time * settings.globalWobbleFreqX) * settings.globalWobbleAmpX) / scale;
      const globalOffsetY = (Math.cos(time * settings.globalWobbleFreqY) * settings.globalWobbleAmpY) / scale;

      // Film Mechanical Offsets (Phase 1)
      const weaveX = (Math.sin(frameCount * 0.013) * settings.gateWeave * 8) / scale;
      const weaveY = (Math.cos(frameCount * 0.017) * settings.gateWeave * 8) / scale;
      const jitterY = (settings.filmJitter > 0 ? (Math.random() - 0.5) * settings.filmJitter * 12 : 0) / scale;
      const jumpY = (settings.filmFrameJump > 0 && Math.random() < settings.filmFrameJump * 0.02) 
        ? (Math.random() - 0.5) * settings.filmFrameJump * 45 
        : 0;

      const timeSinceCountdown = performance.now() - lastCountdownFinishedTimeRef.current;
      const postCountdownJitterY = (timeSinceCountdown < 800)
        ? ((Math.sin(frameCount * 0.5) * 20 * (1.0 - timeSinceCountdown / 800)) + ((Math.random() - 0.5) * 40 * (1.0 - timeSinceCountdown / 800))) / scale
        : 0;

      const totalOffsetX = globalOffsetX + weaveX;
      const totalOffsetY = globalOffsetY + weaveY + jitterY + (jumpY / scale) + postCountdownJitterY;

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
      if (filmCountdownActiveRef.current) {
        drawFilmCountdown(bufferCtx, activeW, activeH, frameCount, totalOffsetX, totalOffsetY);
      } else {
        drawBaseLayer(bufferCtx, activeW, activeH, totalOffsetX, totalOffsetY, settings);
      }
      bufferCtx.restore();

      // (OSD and Overlay calls REMOVED from low-res buffer to preserve legibility)

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

        const isGif = settings.blendOverlayIsGif;
        let drawSource: any = blendOverlayElement;
        
        if (isGif && ovFramesRef.current && ovFramesRef.current.length > 0) {
          const speed = settings.blendOverlayGifSpeed || 1.0;
          const now = settings.blendOverlayGifPlaying ? performance.now() : ovPausedTimeRef.current;
          const elapsed = (now - ovFrameStartRef.current) * speed;
          
          // Loop logic: find the frame that corresponds to the elapsed time
          const totalDuration = ovTotalDurationRef.current || 1000;
          const loopTime = elapsed % totalDuration;
          
          let accum = 0;
          let frameIndex = 0;
          const frames = ovFramesRef.current;
          for (let i = 0; i < frames.length; i++) {
            accum += (frames[i]?.delay || 100);
            if (loopTime < accum) {
              frameIndex = i;
              break;
            }
          }
          
          // gifler frame objects have a .buffer property which is a Canvas
          drawSource = frames[frameIndex]?.buffer || blendOverlayElement;
        }

        if (!drawSource) {
          bufferCtx.restore();
          return;
        }

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
            const shiftX = (i * settings.ghostingOffsetX) / scale;
            const shiftY = (i * settings.ghostingOffsetY) / scale;
            bufferCtx.globalAlpha = settings.ghostingStrength * Math.pow(0.50, i);
            bufferCtx.drawImage(ghostTemp, shiftX, shiftY);
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
          bufferCtx.globalAlpha = Math.min(1.0, (settings.needleNoiseDensity || 0.5) * 1.5);
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

      // --- STAGE 6.9: Film Surface Mechanical & Organic Artifacts (Phase 1) ---
      renderFilmSurface(bufferCtx, activeW, activeH, frameCount, settings, scale, filmFxActive);

      // --- STAGE 7: Draw the Low-res Tape Buffer Canvas onto the High-res display Canvas with pixelated scale! ---
      // 1. Prepare Decoupled OSD & Overlays at their own resolution/blur
      const osdPixelScale = settings.osdPixelScale || 1;
      const oW = Math.max(16, Math.round(w / osdPixelScale));
      const oH = Math.max(12, Math.round(h / osdPixelScale));
      
      const osdCanvas = getHelperCanvas(osdCanvasRef, oW, oH);
      const osdCtx = getHelperContext(osdCanvasRef, oW, oH);
      const osdHighResCanvas = getHelperCanvas(tempOsdCanvasRef, w, h);
      const osdHighResCtx = getHelperContext(tempOsdCanvasRef, w, h);

      if (osdCtx && osdHighResCtx) {
        osdCtx.clearRect(0, 0, oW, oH);
        
        // Apply OSD-specific blur
        const osdBlur = settings.osdBlur || 0;
        osdCtx.filter = `blur(${osdBlur / osdPixelScale}px)`;

        // Render variants into the OSD buffer
        if (!manualGlitchRef.current) {
          if (settings.osdEnabled) {
            renderOsdUI(osdCtx, oW, oH, frameCount, settings, osdPixelScale);
          }
          if (settings.overlayType === "vhs_bezel") {
            renderVhsBezelUI(osdCtx, oW, oH, frameCount, settings, osdPixelScale);
          } else if (settings.overlayType === "record_osd") {
            renderRecordOsdUI(osdCtx, oW, oH, frameCount, settings, osdPixelScale);
          }
        }
        
        osdCtx.filter = "none";
        
        // Upscale OSD to high-res for compositing into curvature loop
        osdHighResCtx.clearRect(0, 0, w, h);
        osdHighResCtx.imageSmoothingEnabled = false;
        osdHighResCtx.drawImage(osdCanvas, 0, 0, w, h);
      }

      // 2. Check for power state changes
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

          // BACKGROUND SIGNAL
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

          // OVERLAY OSD
          if (settings.osdEnabled || settings.overlayType !== "none") {
            ctx.drawImage(
              osdHighResCanvas,
              0,
              sy,
              w,
              sliceH,
              targetX,
              targetY,
              targetW,
              sliceH + 1.2
            );
          }
        }
      } else {
        ctx.clearRect(0, 0, w, h);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(bufferCanvas, 0, 0, w, h);
        if (settings.osdEnabled || settings.overlayType !== "none") {
          ctx.drawImage(osdHighResCanvas, 0, 0, w, h);
        }
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
        const linesCount = settings.scanlineAmount > 0 ? settings.scanlineAmount : 480;
        const lineSpacing = h / linesCount;
        const densityFactor = settings.scanlineDensity ?? 1.0;
        const barThickness = Math.max(1, lineSpacing * densityFactor * 0.5); // Default is 50% gap coverage
        for (let y = 0; y < h; y += lineSpacing) {
          g.fillRect(0, y, w, barThickness);
        }
      }

      // 2. Subpixel Grill textures (aperture, slot or shadow)
      if (settings.grillMask !== "none") {
        g.save();
        g.globalCompositeOperation = "multiply";
        const scale = settings.grillScale;
        
        if (settings.grillMask === "aperture") {
          g.strokeStyle = `rgba(0, 0, 0, ${settings.grillOpacity})`;
          g.lineWidth = 1;
          g.beginPath();
          for (let x = 0; x < w; x += 3 * scale) {
            g.moveTo(x, 0);
            g.lineTo(x, h);
          }
          g.stroke();
        } else if (settings.grillMask === "shadow") {
          // Shadow Mask dots pattern
          g.fillStyle = `rgba(0, 0, 0, ${settings.grillOpacity})`;
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
          g.strokeStyle = `rgba(0, 0, 0, ${settings.grillOpacity})`;
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

    /**
     * Phase 1: Procedural Film Surface Generator
     * Handles dust specks, vertical scratches, and organic halide-style grain.
     */
    const renderFilmSurface = (
      g: CanvasRenderingContext2D,
      w: number,
      h: number,
      curFrame: number,
      settings: SimulatorSettings,
      scale: number,
      filmFxActive: boolean
    ) => {
      const s = settings;
      // 0. Film Breath (Phase 2 - Flicker)
      if (settings.filmBreath > 0) {
        g.save();
        const breathT = curFrame * 0.12; 
        const flicker = (Math.sin(breathT) * 0.2 + Math.random() * 0.1) * settings.filmBreath;
        g.globalCompositeOperation = flicker > 0 ? "screen" : "multiply";
        g.globalAlpha = Math.abs(flicker) * 0.08;
        g.fillStyle = flicker > 0 ? "white" : "black";
        g.fillRect(0, 0, w, h);
        g.restore();
      }

      // 0.25. Anamorphic Streaks (Phase 2)
      if (settings.filmAnamorphic > 0) {
        g.save();
        g.globalCompositeOperation = "screen";
        const streakCount = Math.floor(settings.filmAnamorphic * 2);
        for (let i = 0; i < streakCount; i++) {
          const sy = ((Math.sin(i * 1.7 + curFrame * 0.01) * 0.5 + 0.5) * h);
          const intensity = (0.05 + Math.random() * 0.1) * settings.filmAnamorphic;
          if (intensity <= 0) continue;
          
          const grad = g.createLinearGradient(0, sy, w, sy);
          grad.addColorStop(0, "transparent");
          grad.addColorStop(0.5, `rgba(100, 160, 255, ${intensity})`); 
          grad.addColorStop(1, "transparent");
          g.fillStyle = grad;
          g.fillRect(0, sy - 1, w, 2);
        }
        g.restore();
      }

      // 0.5. Film Halation (Phase 2)
      // Red glow around bright edges
      if (settings.filmHalation > 0) {
        // More robust Halation: blur then screen
        g.save();
        g.globalCompositeOperation = "screen";
        g.globalAlpha = settings.filmHalation * 0.5;
        // Sharper slider makes blur smaller (less blurry)
        const blurAmount = (1 - (settings.filmBurnSharpness || 0.5)) * 10;
        g.filter = `blur(${blurAmount * scale}px) brightness(1.1) saturate(1.5)`;
        g.drawImage(g.canvas, 0, 0); 
        g.restore();
      }

      // 0.5. Light Leaks (Phase 2)
      if (settings.filmLightLeaks > 0) {
        g.save();
        g.globalCompositeOperation = "screen";
        const leakTime = curFrame * 0.01;
        const leaks = Math.floor(settings.filmLightLeaks + 1);
        
        for (let i = 0; i < leaks; i++) {
          const intensity = (Math.sin(leakTime + i * 1.5) * 0.5 + 0.5) * settings.filmLightLeaks * 0.4;
          if (intensity <= 0.01) continue;
          
          const angle = (Math.sin(leakTime * 0.3 + i) * Math.PI * 2);
          const lx = w / 2 + Math.cos(angle) * w * 0.6;
          const ly = h / 2 + Math.sin(angle) * h * 0.6;
          const radius = w * (0.4 + Math.random() * 0.4);
          
          const grad = g.createRadialGradient(lx, ly, 0, lx, ly, radius);
          grad.addColorStop(0, `rgba(255, ${60 + Math.random() * 60}, 20, ${intensity})`);
          grad.addColorStop(1, "rgba(255, 40, 0, 0)");
          
          g.fillStyle = grad;
          g.fillRect(0, 0, w, h);
        }
        g.restore();
      }

      // 1. Organic Film Grain (Phase 1)
      // Different from CRT fuzz - grain is more "clumpy" and overlays existing content as dirt
      if (settings.filmGrain > 0) {
        g.save();
        g.globalAlpha = settings.filmGrain * 0.25;
        g.globalCompositeOperation = "multiply"; // Darkens like actual grain clumps
        
        const grainSize = settings.filmGrainSize || 1;
        const gw = Math.max(1, Math.round(w / grainSize));
        const gh = Math.max(1, Math.round(h / grainSize));
        const grainImg = g.createImageData(gw, gh);
        const data = grainImg.data;
        
        for (let i = 0; i < data.length; i += 4) {
          const val = 120 + Math.random() * 100;
          data[i] = val;
          data[i + 1] = val;
          data[i + 2] = val;
          data[i + 3] = 255;
        }
        
        // Draw grain to a small offscreen and back or directly if performance permits
        // We use putImageData but grain needs movement
        const tempGrainC = getHelperCanvas(snowCanvasRef, gw, gh);
        const tgCtx = getHelperContext(snowCanvasRef, gw, gh);
        if (tgCtx) {
          tgCtx.putImageData(grainImg, 0, 0);
          g.drawImage(tempGrainC, 0, 0, w, h);
        }
        g.restore();
      }

      // 2. Film Dust & Lint Specks
      if (settings.filmDust > 0) {
        g.save();
        g.fillStyle = "rgba(0, 0, 0, 0.7)";
        const dustCount = Math.floor(settings.filmDust * 3.5);
        const dustBaseSize = settings.filmDustSize || 1.0;
        for (let i = 0; i < dustCount; i++) {
          if (Math.random() < 0.3) {
            const dx = Math.random() * w;
            const dy = Math.random() * h;
            const dSize = (0.5 + Math.random() * 2.0) * dustBaseSize;
            
            // Randomly draw a dot or a tiny "hair" squiggle
            if (Math.random() > 0.5) {
              g.beginPath();
              g.arc(dx, dy, dSize, 0, Math.PI * 2);
              g.fill();
            } else {
              g.lineWidth = 0.5 * dustBaseSize;
              g.beginPath();
              g.moveTo(dx, dy);
              g.lineTo(dx + (Math.random() - 0.5) * 5 * dustBaseSize, dy + (Math.random() - 0.5) * 5 * dustBaseSize);
              g.stroke();
            }
          }
        }
        g.restore();
      }

      // 2.5. Emulsion Damage & Chemical Acid Spots (Phase 2 & 3)
      if (settings.filmEmulsion > 0 || settings.filmChemicalSpots > 0) {
        g.save();
        const eSeed = (curFrame % 60);
        
        // Emulsion blobs
        if (s.filmEmulsion > 0 && eSeed < 4) {
          const ex = Math.random() * w;
          const ey = Math.random() * h;
          const eRadius = (15 + Math.random() * 50) * s.filmEmulsion;
          const eOpacity = (0.05 + Math.random() * 0.2) * s.filmEmulsion;
          const grad = g.createRadialGradient(ex, ey, 0, ex, ey, eRadius);
          grad.addColorStop(0, `rgba(${130 + Math.random() * 40}, ${90 + Math.random() * 30}, 40, ${eOpacity})`);
          grad.addColorStop(0.7, `rgba(${130 + Math.random() * 40}, ${90 + Math.random() * 30}, 40, ${eOpacity * 0.3})`);
          grad.addColorStop(1, "transparent");
          g.fillStyle = grad;
          g.beginPath();
          g.arc(ex, ey, eRadius, 0, Math.PI * 2);
          g.fill();
        }

              // Chemical/Acid spots - more persistent small dark/light circles
              if (s.filmChemicalSpots > 0) {
                const spotCount = Math.floor(s.filmChemicalSpots * 1.5);
                for (let i = 0; i < spotCount; i++) {
                  if (Math.random() < 0.2) {
                    const sx = Math.random() * w;
                    const sy = Math.random() * h;
                    const sRadius = (2.0 + Math.random() * 5.0) * s.filmChemicalSpots;
                    const isDark = Math.random() > 0.4;
                    g.fillStyle = isDark ? `rgba(20, 10, 5, ${0.3 + Math.random() * 0.4})` : `rgba(255, 255, 240, ${0.2 + Math.random() * 0.3})`;
                    g.beginPath();
                    // Varied, irregular spot shape using randomized quadratic curves
                    const numShapes = Math.random() < 0.3 ? 2 : 1;
                    for (let s_i = 0; s_i < numShapes; s_i++) {
                      const offX = (Math.random() - 0.5) * sRadius;
                      const offY = (Math.random() - 0.5) * sRadius;
                      const rSub = sRadius * (0.8 + Math.random() * 0.4);
                      g.moveTo(sx + offX + Math.random() * rSub, sy + offY);
                      g.quadraticCurveTo(sx + offX + rSub, sy + offY - rSub, sx + offX - rSub, sy + offY - rSub);
                      g.quadraticCurveTo(sx + offX - rSub * 1.5, sy + offY + rSub, sx + offX + Math.random() * rSub, sy + offY);
                    }
                    g.fill();
                  }
                }
              }
        g.restore();
      }

      // 2.6 Frame Burn (Splicing flashes)
      if (s.filmFrameBurn > 0) {
        const burnSeed = Math.random();
        if (burnSeed < s.filmFrameBurn * 0.02) {
          g.save();
          g.globalCompositeOperation = "screen";
          const burnOpac = 0.2 + (Math.random() * 0.5 * (s.filmFrameBurn / 5));
          const hue = s.filmBurnHue || 30; // Default to orange
          const sharpness = (s.filmBurnSharpness || 0.5) * 0.5; // Map 0-1 to something gradient-friendly (0-0.5)
          
          const grad = g.createLinearGradient(0, 0, w, 0);
          grad.addColorStop(0, `hsla(${hue}, 100%, 50%, ${burnOpac})`);
          grad.addColorStop(Math.max(0.1, sharpness), `hsla(${hue + 20}, 100%, 40%, ${burnOpac * 0.7})`);
          grad.addColorStop(1, "transparent");
          g.fillStyle = grad;
          g.fillRect(0, 0, w, h);
          g.restore();
        }
      }

      // 3. Vertical Scratches (Moving/Glancing)
      if (settings.filmScratches > 0) {
        g.save();
        const scratchCount = Math.floor(settings.filmScratches * 1.5);
        const scratchWidth = settings.filmScratchesWidth || 0.5;
        for (let i = 0; i < scratchCount; i++) {
          // Scratches tend to persist in horizontal bands for a few frames
          const scratchSeed = (curFrame + i * 1000) % 60;
          if (scratchSeed < 15) {
             const sx = (Math.sin(i * 123.456) * 0.5 + 0.5) * w;
             const jitter = (Math.random() - 0.5) * 1.5;
             
             g.strokeStyle = Math.random() > 0.5 ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.1)";
             g.lineWidth = (0.3 + Math.random() * 0.7) * scratchWidth * 2;
             g.beginPath();
             g.moveTo(sx + jitter, 0);
             g.lineTo(sx + jitter, h);
             g.stroke();
          }
        }
        g.restore();
      }

      // 4. Lens Vignette (Phase 2 Improved - Iris Masking)
      if (settings.filmVignette > 0) {
        g.save();
        const centerX = w / 2;
        const centerY = h / 2;
        
        const strength = settings.filmVignette; // 0 to 1
        // Sharpness 1.0 = hard edge. 
        const sharpness = settings.filmVignetteSoftness ?? 0.5;
        const radiusScale = settings.filmVignetteRadius ?? 1.0;
        
        // Define iris radius relative to screen size
        const baseRadius = Math.min(w, h) * 0.65 * radiusScale;
        
        // Inner radius (where the image starts being hidden)
        const outerRadius = baseRadius;
        // If sharpness is 1, innerRadius should basically be outerRadius for a hard cut
        const innerRadius = baseRadius * (1.0 - Math.pow(1.0 - sharpness, 3));

        if (sharpness >= 0.99) {
          // Absolute hard cut - draw a path to avoid gradient anti-aliasing artifacts
          g.beginPath();
          g.rect(0, 0, w, h);
          g.arc(centerX, centerY, baseRadius, 0, Math.PI * 2, true);
          g.fillStyle = `rgba(0,0,0,${strength})`;
          g.fill();
        } else {
          const vGrad = g.createRadialGradient(centerX, centerY, innerRadius, centerX, centerY, outerRadius);
          vGrad.addColorStop(0, "rgba(0,0,0,0)");
          vGrad.addColorStop(1, `rgba(0,0,0,${strength})`);
          
          g.fillStyle = vGrad;
          g.fillRect(0, 0, w, h);
        }
        
        g.restore();
      }
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
  }, [settings.canvasWidth, settings.canvasHeight, settings.pixelScale, videoElement, webVideoElement, uploadedImageElement, blendOverlayElement, isRecording, canvasRef, videoSpeed, settings.needleNoise, settings.needleNoiseDensity, settings.fuzzColorRatio, settings.gateWeave, settings.filmJitter, settings.filmDust, settings.filmDustSize, settings.filmScratches, settings.filmScratchesWidth, settings.filmGrain, settings.filmGrainSize, settings.filmLightLeaks, settings.filmVignette, settings.filmVignetteRadius, settings.filmVignetteSoftness, settings.filmHalation, settings.filmBreath, settings.filmAnamorphic, settings.filmEmulsion, settings.filmFrameJump, settings.filmFrameBurn, settings.filmChemicalSpots, filmFxActive]);

  return null;
};
