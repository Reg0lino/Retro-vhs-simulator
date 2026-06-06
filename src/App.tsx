/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Tv, Download, Video, Play, Square, 
  Maximize2, Minimize2, Sparkles, AlertCircle, RefreshCw, FileText, Pause, Camera,
  VolumeX, Volume2, ShieldAlert, Monitor
} from "lucide-react";
import { SimulatorSettings } from "./types";
import { DEFAULT_SETTINGS, PRESETS, BASE_INITIAL_STATE } from "./presets";
import { CrtCanvas } from "./components/CrtCanvas";
import { ControlPanel } from "./components/ControlPanel";
import { MacroSliders } from "./components/MacroSliders";
import { ExportModal } from "./components/ExportModal";
import { VcrController } from "./components/VcrController";
import { ASSIGNABLE_PARAMS } from "./constants";
import gifshot from "gifshot";


export default function App() {
  const [settings, setSettings] = useState<SimulatorSettings>(BASE_INITIAL_STATE);

  // High fidelity export master settings state
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [exportConfig, setExportConfig] = useState({
    format: "mp4" as "mp4" | "webm" | "gif",
    preset: "1080p" as "original" | "485p" | "480p" | "720p" | "1080p" | "4k" | "custom",
    customWidth: 1280,
    customHeight: 720,
    fps: 30, // 24, 30, 60
    bitrateLevel: "high" as "low" | "medium" | "high" | "cranked" | "ludicrous" | "custom",
    customBitrate: 20, // Mbps
    gifLength: "short" as "short" | "medium" | "long",
    stopTrigger: "manual" as "manual" | "auto",
    autoStopDuration: 10, // seconds
  });

  const originalCanvasWidthRef = useRef<number>(640);
  const originalCanvasHeightRef = useRef<number>(480);
  const recordingAnimationRef = useRef<number | null>(null);

  const [activePreset, setActivePreset] = useState<string>("testBars");
  const [activeTab, setActiveTab] = useState<string>("signal");

  // Custom Presets State (backed by localStorage)
  const [customPresets, setCustomPresets] = useState<Record<string, { label: string; description: string; settings: Partial<SimulatorSettings> }>>(() => {
    try {
      const saved = localStorage.getItem("vhs_custom_presets");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // State to hold the chosen preset pending customer feedback (Overwrite vs Merge)
  const [pendingPresetToApply, setPendingPresetToApply] = useState<string | null>(null);
  
  // Media source elements
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [uploadedMediaSrc, setUploadedMediaSrc] = useState<string | null>(null);
  const [uploadedMediaType, setUploadedMediaType] = useState<"image" | "video" | null>(null);

  // Animation frame counts
  const [renderedFrames, setRenderedFrames] = useState<number>(0);

  // References
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const webVideoRef = useRef<HTMLVideoElement | null>(null);
  const uploadedImageRef = useRef<HTMLImageElement | null>(null);
  const uploadedVideoRef = useRef<HTMLVideoElement | null>(null);

  // Overlay Repositioning Drag-and-Drop Variables
  const isDraggingOverlayRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; overlayX: number; overlayY: number }>({
    mouseX: 0,
    mouseY: 0,
    overlayX: 0,
    overlayY: 0
  });

  // QoL States
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recDuration, setRecDuration] = useState<number>(0);
  const [gifProgress, setGifProgress] = useState<number>(-1); // -1 = standby, >=0 progress
  const [panicConfirm, setPanicConfirm] = useState<boolean>(false);
  const [randomConfirm, setRandomConfirm] = useState<boolean>(false);
  const [syncReset, setSyncReset] = useState<number>(0);
  const [tvPowerState, setTvPowerState] = useState<"on" | "off" | "turning_off" | "turning_on">("on");
  const [isManualGlitchActive, setIsManualGlitchActive] = useState<boolean>(false);
  const [filmFxActive, setFilmFxActive] = useState<boolean>(false);
  const [filmCountdownActive, setFilmCountdownActive] = useState<boolean>(false);

  const [favKeys, setFavKeys] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("vhs_fav_keys_v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_SETTINGS.customSliderSlots;
  });

  useEffect(() => {
    localStorage.setItem("vhs_fav_keys_v2", JSON.stringify(favKeys));
  }, [favKeys]);
  const [changedSliders, setChangedSliders] = useState<{ param: string; value: number | string; time: string }[]>([]);

  // Callback States for off-screen video/web nodes
  const [cameraVideoNode, setCameraVideoNode] = useState<HTMLVideoElement | null>(null);
  const [webVideoNode, setWebVideoNode] = useState<HTMLVideoElement | null>(null);
  const [uploadedImageNode, setUploadedImageNode] = useState<HTMLImageElement | null>(null);
  const [uploadedVideoNode, setUploadedVideoNode] = useState<HTMLVideoElement | null>(null);
  const [secondaryOverlayNode, setSecondaryOverlayNode] = useState<HTMLImageElement | null>(null);



  // Multi-camera cycling states
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeCameraDeviceId, setActiveCameraDeviceId] = useState<string>("");

  // VCR Active Playback statuses
  const [vidPlayState, setVidPlayState] = useState<boolean>(true);
  const [vidCurrentTime, setVidCurrentTime] = useState<number>(0);
  const [vidDuration, setVidDuration] = useState<number>(0);
  const [vidVolume, setVidVolume] = useState<number>(1.0);
  const [vidLoop, setVidLoop] = useState<boolean>(true);
  const [vidSpeed, setVidSpeed] = useState<number>(1.0);
  const [vidHasCorsError, setVidHasCorsError] = useState<boolean>(false);

  // Trigger for restarting gif overlay
  const [restartGifTrigger, setRestartGifTrigger] = useState<number>(0);

  // WebM Recorder references
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recTimerRef = useRef<number | null>(null);

  // Initializing retro randomizer base date parameters on start
  useEffect(() => {
    if (!settings.osdRandomYear) {
      const years = Array.from({ length: 2001 - 1975 + 1 }, (_, i) => 1975 + i);
      const randomYear = years[Math.floor(Math.random() * years.length)];
      const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
      const randomMonth = months[Math.floor(Math.random() * months.length)];
      const randomDay = Math.floor(Math.random() * 28) + 1;
      setSettings(prev => ({
        ...prev,
        osdRandomYear: randomYear,
        osdRandomMonth: randomMonth,
        osdRandomDay: randomDay,
      }));
    }
  }, []);

  const [cameraError, setCameraError] = useState<string | null>(null);

  // Synchronized active media node computed value
  const activeVideo = settings.sourceType === "webvideo" ? webVideoNode 
                     : (settings.sourceType === "media" ? (uploadedMediaType === "video" ? uploadedVideoNode : (isCameraActive ? cameraVideoNode : null))
                     : (settings.sourceType === "camera" ? cameraVideoNode 
                     : (settings.sourceType === "upload" && uploadedMediaType === "video" ? uploadedVideoNode : null)));

  // Dynamic HLS live stream decoders hook
  const hlsRef = useRef<any>(null);

  useEffect(() => {
    if (!webVideoNode) return;

    const src = settings.webVideoSrc;
    const isHls = src.endsWith(".m3u8") || src.includes(".m3u8") || src.includes("m3u8");

    // Clean up previous HLS instance if any
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (isHls) {
      const initHls = () => {
        const HlsClass = (window as any).Hls;
        if (HlsClass) {
          if (HlsClass.isSupported()) {
            const hls = new HlsClass({
              enableWorker: true,
              lowLatencyMode: true,
              backBufferLength: 30,
              liveSyncDurationCount: 3,
            });
            hls.loadSource(src);
            hls.attachMedia(webVideoNode);
            hlsRef.current = hls;

            hls.on(HlsClass.Events.ERROR, (event: any, data: any) => {
              if (data.fatal) {
                switch (data.type) {
                  case HlsClass.ErrorTypes.NETWORK_ERROR:
                    console.warn("[VHS STREAM] Network lag, attempting HLS stream reconnection...");
                    hls.startLoad();
                    break;
                  case HlsClass.ErrorTypes.MEDIA_ERROR:
                    console.warn("[VHS STREAM] Media decoding glitch, recovering stream buffer...");
                    hls.recoverMediaError();
                    break;
                  default:
                    console.error("[VHS STREAM] Fatal streaming pipeline failure:", data);
                    setVidHasCorsError(true);
                    hls.destroy();
                    break;
                }
              }
            });
          } else if (webVideoNode.canPlayType("application/vnd.apple.mpegurl")) {
            // Safari iOS/macOS direct native stream integration
            webVideoNode.src = src;
          } else {
            console.error("HLS live streams are not supported in this browser environment.");
            setVidHasCorsError(true);
          }
        }
      };

      if (!(window as any).Hls) {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js";
        script.async = true;
        script.onload = () => {
          initHls();
        };
        script.onerror = () => {
          console.error("Critical: Could not load HLS streaming decoders from secure CDN.");
          setVidHasCorsError(true);
        };
        document.head.appendChild(script);
      } else {
        initHls();
      }
    } else {
      // Normal browser decoding loop fallback
      webVideoNode.src = src;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [webVideoNode, settings.webVideoSrc]);

  // Sync VCR Deck configurations dynamic effects
  useEffect(() => {
    if (!activeVideo) return;
    
    // Set parameters
    activeVideo.volume = vidVolume;
    activeVideo.loop = vidLoop;
    activeVideo.playbackRate = vidSpeed;
    
    if (vidPlayState) {
      activeVideo.play().catch(() => {});
    } else {
      activeVideo.pause();
    }
  }, [activeVideo, vidPlayState, vidVolume, vidLoop, vidSpeed, settings.webVideoSrc, uploadedMediaSrc]);

  // Handle source changes to automatically force play and update trackers
  useEffect(() => {
    if (activeVideo) {
      activeVideo.play()
        .then(() => {
          setVidPlayState(true);
        })
        .catch(() => {
          setVidPlayState(true);
        });
      setVidCurrentTime(activeVideo.currentTime || 0);
      setVidDuration(activeVideo.duration || 0);
      setVidHasCorsError(false);
    } else {
      setVidPlayState(false);
      setVidCurrentTime(0);
      setVidDuration(0);
    }
  }, [settings.sourceType, activeVideo]);

  // Video deck interaction handlers
  const handleTogglePlay = () => {
    // Standard VCR Play/Pause but linked to GIF playback if an animated image is the source
    if (settings.sourceType === "upload" && uploadedMediaType === "image") {
      const newState = !vidPlayState;
      setSettings(s => ({ ...s, gifPlaying: newState }));
      setVidPlayState(newState);
      return;
    }

    if (!activeVideo) return;
    if (activeVideo.paused) {
      activeVideo.play().then(() => setVidPlayState(true)).catch(() => {});
    } else {
      activeVideo.pause();
      setVidPlayState(false);
    }
  };

  const handleStopVideo = () => {
    if (!activeVideo) return;
    activeVideo.pause();
    activeVideo.currentTime = 0;
    setVidPlayState(false);
    setVidCurrentTime(0);
  };

  const handleSeekVideo = (time: number) => {
    if (!activeVideo) return;
    try {
      activeVideo.currentTime = time;
    } catch (_) {}
    setVidCurrentTime(time);
  };

  const handleVolumeChange = (vol: number) => {
    setVidVolume(vol);
  };

  const handleSpeedChange = (speed: number) => {
    setVidSpeed(speed);
  };

  const handleToggleLoop = () => {
    setVidLoop((prev) => !prev);
  };

  // Preset dispatcher actual applier
  const applyPresetActual = (key: string, overwrite: boolean) => {
    let presetSettings: Partial<SimulatorSettings> = {};
    
    if (key.startsWith("custom_")) {
      const custom = customPresets[key];
      if (custom) {
        presetSettings = custom.settings;
      }
    } else {
      const preset = PRESETS[key];
      if (preset) {
        presetSettings = preset.settings;
      }
    }

    if (presetSettings) {
      setActivePreset(key);
      
      const baseSettings = overwrite ? BASE_INITIAL_STATE : settings;
      const currentSource = settings.sourceType;
      const nextS = { ...baseSettings, ...presetSettings };
      
      // Preserve current source type
      nextS.sourceType = currentSource;
      
      // Keep camera active and persistent if running
      if (isCameraActive || currentSource === "camera") {
        nextS.sourceType = "camera";
      }
      
      // Every mode and preset aside from the blue VHS screen ALWAYS has transparency for the video to appear underneath
      if (key !== "blueVhs" && key !== "bluescreen") {
        nextS.blendOverlayOpacity = Math.max(nextS.blendOverlayOpacity ?? 0.45, 0.4);
      }
      
      // Ensure vintage date random values are populated when presets load
      if (!nextS.osdRandomYear) {
        const years = Array.from({ length: 2001 - 1975 + 1 }, (_, i) => 1975 + i);
        nextS.osdRandomYear = years[Math.floor(Math.random() * years.length)];
        const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        nextS.osdRandomMonth = months[Math.floor(Math.random() * months.length)];
        nextS.osdRandomDay = Math.floor(Math.random() * 28) + 1;
      }
      if (!nextS.osdTimeTracking) {
        nextS.osdTimeTracking = "clock";
      }
      
      setSettings(nextS);
      setSyncReset(prev => prev + 1);
    }
  };

  const handleApplyPreset = (key: string) => {
    // Stage preset to ask user: "Merge onto current sliders" or "Overwrite completely"
    setPendingPresetToApply(key);
  };

  const saveCustomPresetsToStorage = (presetsToSave: typeof customPresets) => {
    try {
      localStorage.setItem("vhs_custom_presets", JSON.stringify(presetsToSave));
    } catch (err) {
      console.error("Local storage preset write failed", err);
    }
  };

  // Save Custom Preset
  const handleSaveCustomPreset = (name: string, description: string) => {
    const key = `custom_${Date.now()}`;
    const nextPresets = {
      ...customPresets,
      [key]: {
        label: name,
        description: description,
        settings: { ...settings } // snapshot current values!
      }
    };
    setCustomPresets(nextPresets);
    saveCustomPresetsToStorage(nextPresets);
    setActivePreset(key);
  };

  // Delete Custom Preset
  const handleDeleteCustomPreset = (key: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextPresets = { ...customPresets };
    delete nextPresets[key];
    setCustomPresets(nextPresets);
    saveCustomPresetsToStorage(nextPresets);
    
    // Fallback if deleted active
    if (activePreset === key) {
      applyPresetActual("testBars", true);
    }
  };

  // Export Custom Presets JSON File
  const handleExportPresets = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(customPresets, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `vhs_simulator_custom_presets_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error("Export of presets failed", err);
    }
  };

  // Import Custom Presets JSON File
  const handleImportPresets = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && typeof parsed === "object") {
          const merged = { ...customPresets, ...parsed };
          setCustomPresets(merged);
          saveCustomPresetsToStorage(merged);
        }
      } catch (err) {
        console.error("Failed to parse custom presets import file", err);
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // Clear file selector
  };

  // Drag and drop event handler
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only allow file drops (direct from PC)
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const url = URL.createObjectURL(file);
      setUploadedMediaSrc(url);

      if (file.type.startsWith("video/")) {
        setUploadedMediaType("video");
        handleSettingsChange({ sourceType: "upload" });
      } else {
        setUploadedMediaType("image");
        const img = new Image();
        img.src = url;
        img.onload = () => {
          setUploadedImageNode(img);
          handleSettingsChange({ sourceType: "upload" });
        };
      }
      return;
    }
  };

  // Keyboard escape handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  // Adjust parameters inline
  const handleSettingsChange = (updates: Partial<SimulatorSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      // Dynamic logging for verification & slider diagnostic triggers
      Object.entries(updates).forEach(([key, val]) => {
        // 1. Sleek styled diagnostic console trace
        console.log(
          `%c[VHS DIAGNOSTIC] TIMESTAMP: ${Date.now()} | slider: "${key}" %c→ VALUE: %c${val}`,
          "color: #ea580c; font-weight: bold",
          "color: #a1a1aa",
          "color: #10b981; font-weight: bold; font-family: monospace"
        );

        // 2. Mirror into state cache for real-time Overlay Diagnostic lists
        const nowStr = new Date().toLocaleTimeString("en-US", { hour12: false, fractionalSecondDigits: 2 } as any);
        setChangedSliders((prev) => {
          const item = { param: key, value: typeof val === "number" ? val.toFixed(2).replace(/\.00$/, "") : String(val), time: nowStr };
          return [item, ...prev].slice(0, 4); // Keep last 4 records for pristine space layout
        });
      });
      return next;
    });
  };

  // Floating uploader handling images & videos
  const triggerMediaUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,video/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const url = URL.createObjectURL(file);
      setUploadedMediaSrc(url);

      if (file.type.startsWith("video/")) {
        setUploadedMediaType("video");
        handleSettingsChange({ sourceType: "upload" });
        setVidPlayState(true);
      } else {
        setUploadedMediaType("image");
        const img = new Image();
        img.src = url;
        img.onload = () => {
          setUploadedImageNode(img);
          const isGif = file.name.toLowerCase().endsWith(".gif") || file.type.includes("gif");
          handleSettingsChange({ 
            sourceType: "upload",
            gifPlaying: true 
          });
          setVidPlayState(true);
        };
      }
    };
    input.click();
  };

  // Floating uploader for secondary blend overlay
  const triggerOverlayUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const url = URL.createObjectURL(file);
      const isGif = file.type.includes("gif") || file.name.toLowerCase().endsWith(".gif");
      handleSettingsChange({ 
        blendOverlayUrl: url,
        blendOverlayOpacity: 0.6,
        blendOverlayIsGif: isGif,
        blendOverlayGifPlaying: false
      });
    };
    input.click();
  };

  // Start Camera with specific device ID
  const startCameraWithDevice = async (deviceId: string | null) => {
    // 1. Stop any existing tracks
    if (cameraVideoNode && cameraVideoNode.srcObject) {
      const stream = cameraVideoNode.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      cameraVideoNode.srcObject = null;
    }

    try {
      // Build constraints
      const constraints: MediaStreamConstraints = {
        video: deviceId 
          ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraError(null);
      
      if (cameraVideoNode) {
        cameraVideoNode.srcObject = stream;
        cameraVideoNode.play().catch(() => {});
        setIsCameraActive(true);
        handleSettingsChange({ sourceType: "camera" });

        // Identify actual active tracking device ID
        const tracks = stream.getVideoTracks();
        if (tracks.length > 0) {
          const actualSettings = tracks[0].getSettings();
          if (actualSettings.deviceId) {
            setActiveCameraDeviceId(actualSettings.deviceId);
          }
        }

        // List media devices so we know how many are accessible
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === "videoinput");
        setVideoDevices(videoInputs);

        // If no activeCameraDeviceId is set, match track's label with enumerated list
        if (tracks.length > 0 && videoInputs.length > 0) {
          const label = tracks[0].label;
          const matched = videoInputs.find((d) => d.label === label);
          if (matched) {
            setActiveCameraDeviceId(matched.deviceId);
          } else if (!deviceId) {
            setActiveCameraDeviceId(videoInputs[0].deviceId);
          }
        }
      }
    } catch (err) {
      console.error("Camera access failed with custom constraints, trying fallback...", err);
      try {
        // Fallback constraint (generic webcam search)
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        setCameraError(null);
        if (cameraVideoNode) {
          cameraVideoNode.srcObject = stream;
          cameraVideoNode.play().catch(() => {});
          setIsCameraActive(true);
          handleSettingsChange({ sourceType: "camera" });

          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoInputs = devices.filter((d) => d.kind === "videoinput");
          setVideoDevices(videoInputs);
        }
      } catch (fallbackErr: any) {
        console.error("Fallback camera initialization failed completely:", fallbackErr);
        setCameraError(fallbackErr?.message || "Camera access denied. Please allow camera permissions.");
        setIsCameraActive(false);
      }
    }
  };

  // Canvas Mouse and Touch Drag Handler for Overlay Position Tuning
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if ((settings.blendOverlayOpacity ?? 0) <= 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    isDraggingOverlayRef.current = true;
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      overlayX: settings.blendOverlayX || 0,
      overlayY: settings.blendOverlayY || 0,
    };
    canvas.style.cursor = "grabbing";
    e.preventDefault();
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingOverlayRef.current) {
      const canvas = canvasRef.current;
      if (canvas && (settings.blendOverlayOpacity ?? 0) > 0) {
        canvas.style.cursor = "grab";
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const deltaX = e.clientX - dragStartRef.current.mouseX;
    const deltaY = e.clientY - dragStartRef.current.mouseY;

    const rect = canvas.getBoundingClientRect();
    const pctX = (deltaX / rect.width) * 100;
    const pctY = (deltaY / rect.height) * 100;

    let targetX = dragStartRef.current.overlayX + pctX;
    let targetY = dragStartRef.current.overlayY + pctY;

    targetX = Math.max(-100, Math.min(100, targetX));
    targetY = Math.max(-100, Math.min(100, targetY));

    handleSettingsChange({
      blendOverlayX: Math.round(targetX * 10) / 10,
      blendOverlayY: Math.round(targetY * 10) / 10,
    });
  };

  const handleCanvasMouseUpOrLeave = () => {
    if (isDraggingOverlayRef.current) {
      isDraggingOverlayRef.current = false;
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.style.cursor = "grab";
      }
    }
  };

  const handleCanvasTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if ((settings.blendOverlayOpacity ?? 0) <= 0) return;
    const touch = e.touches[0];
    if (!touch) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    isDraggingOverlayRef.current = true;
    dragStartRef.current = {
      mouseX: touch.clientX,
      mouseY: touch.clientY,
      overlayX: settings.blendOverlayX || 0,
      overlayY: settings.blendOverlayY || 0,
    };
  };

  const handleCanvasTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDraggingOverlayRef.current) return;
    const touch = e.touches[0];
    if (!touch) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const deltaX = touch.clientX - dragStartRef.current.mouseX;
    const deltaY = touch.clientY - dragStartRef.current.mouseY;

    const rect = canvas.getBoundingClientRect();
    const pctX = (deltaX / rect.width) * 100;
    const pctY = (deltaY / rect.height) * 100;

    let targetX = dragStartRef.current.overlayX + pctX;
    let targetY = dragStartRef.current.overlayY + pctY;

    targetX = Math.max(-100, Math.min(100, targetX));
    targetY = Math.max(-100, Math.min(100, targetY));

    handleSettingsChange({
      blendOverlayX: Math.round(targetX * 10) / 10,
      blendOverlayY: Math.round(targetY * 10) / 10,
    });
    
    // Prevent scrolling while moving overlay
    if (e.cancelable) {
      e.preventDefault();
    }
  };

  // Toggle Camera
  const handleToggleCamera = async () => {
    if (isCameraActive) {
      if (cameraVideoNode && cameraVideoNode.srcObject) {
        const stream = cameraVideoNode.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        cameraVideoNode.srcObject = null;
      }
      setIsCameraActive(false);
      handleSettingsChange({ sourceType: "colorbars" });
    } else {
      await startCameraWithDevice(activeCameraDeviceId || null);
    }
  };

  // Cycle through all available video inputs
  const handleCycleCamera = async () => {
    let workingDevices = videoDevices;
    
    // Refresh device lists first
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      workingDevices = devices.filter((d) => d.kind === "videoinput");
      setVideoDevices(workingDevices);
    } catch (e) {
      console.error("Failed to re-enumerate on cycle:", e);
    }

    if (!isCameraActive) {
      // Turn camera on first if off
      await startCameraWithDevice(null);
      return;
    }

    if (workingDevices.length <= 1) {
      // If there is only one device, we can try to toggle between "user" and "environment" facing modes as a smart phone fallback
      if (cameraVideoNode && cameraVideoNode.srcObject) {
        const stream = cameraVideoNode.srcObject as MediaStream;
        const tracks = stream.getVideoTracks();
        if (tracks.length > 0) {
          const currentFacing = tracks[0].getSettings().facingMode;
          // Toggle facing mode manually
          const targetFacing = currentFacing === "user" ? "environment" : "user";
          if (cameraVideoNode && cameraVideoNode.srcObject) {
            (cameraVideoNode.srcObject as MediaStream).getTracks().forEach(t => t.stop());
          }
          try {
            const nextStream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: targetFacing, width: { ideal: 1280 }, height: { ideal: 720 } },
              audio: false
            });
            cameraVideoNode.srcObject = nextStream;
            cameraVideoNode.play().catch(() => {});
          } catch (toggleErr) {
            console.error("FacingMode toggle fallback failed:", toggleErr);
            // Revert back to default
            await startCameraWithDevice(null);
          }
        }
      }
      return;
    }

    // Find active index
    let activeIdx = workingDevices.findIndex((d) => d.deviceId === activeCameraDeviceId);
    
    // Fallback alignment index search using track label matching
    if (activeIdx === -1 && cameraVideoNode && cameraVideoNode.srcObject) {
      const stream = cameraVideoNode.srcObject as MediaStream;
      const tracks = stream.getVideoTracks();
      if (tracks.length > 0) {
        const activeLabel = tracks[0].label;
        activeIdx = workingDevices.findIndex((d) => d.label === activeLabel);
      }
    }

    const nextIdx = (activeIdx + 1) % workingDevices.length;
    const nextDevice = workingDevices[nextIdx];
    if (nextDevice) {
      await startCameraWithDevice(nextDevice.deviceId);
    }
  };

  // Capture screen/window/OBS feed via WebRTC DisplayMedia
  const handleShareScreen = async () => {
    // 1. Stop any current webcam lenses actively reading
    if (cameraVideoNode && cameraVideoNode.srcObject) {
      const stream = cameraVideoNode.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      cameraVideoNode.srcObject = null;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: true // Captures system/window sound directly to feed through our tape audio processor!
      });

      if (cameraVideoNode) {
        cameraVideoNode.srcObject = stream;
        cameraVideoNode.play().catch(() => {});
        setIsCameraActive(true);
        handleSettingsChange({ sourceType: "camera" });
      }
    } catch (e) {
      console.warn("Screen capture sharing ignored/rejected by user:", e);
    }
  };

  // Complex Creative Parameter Randomizer
  const handleRandomize = () => {
    if (!randomConfirm) {
      setRandomConfirm(true);
      setTimeout(() => setRandomConfirm(false), 3000); // Reset after 3 seconds
      return;
    }

    const allPossibleUpdates: Record<string, () => any> = {
      pixelScale: () => Math.floor(Math.random() * 3) + 1,
      hWaveAmp: () => Math.random() < 0.6 ? 0 : Math.random() * 30,
      hWaveFreq: () => 0.01 + Math.random() * 0.045,
      hWaveSpeed: () => 1.0 + Math.random() * 4.0,
      vWaveAmp: () => Math.random() < 0.85 ? 0 : Math.random() * 15,
      vWaveFreq: () => 0.01 + Math.random() * 0.04,
      vWaveSpeed: () => 1.0 + Math.random() * 4.0,
      globalBrightness: () => 90 + Math.floor(Math.random() * 40),
      globalContrast: () => 85 + Math.floor(Math.random() * 60),
      globalSaturation: () => Math.random() < 0.2 ? 0 : 50 + Math.floor(Math.random() * 100),
      globalBlur: () => Math.random() < 0.6 ? 0 : Math.random() * 2.5,
      globalWobbleSpeed: () => 0.4 + Math.random() * 2.0,
      globalWobbleAmpX: () => Math.random() < 0.5 ? 0 : Math.random() * 12.0,
      globalWobbleAmpY: () => Math.random() < 0.7 ? 0 : Math.random() * 6.0,
      globalWobbleFreqX: () => 1.0 + Math.random() * 10.0,
      globalWobbleFreqY: () => 1.0 + Math.random() * 8.0,
      lineJitterStrength: () => Math.random() < 0.5 ? 0 : Math.random() * 6.0,
      lineJitterFrequency: () => Math.random() * 0.4,
      hSyncSkew: () => Math.random() < 0.6 ? 0 : Math.random() * 15.0,
      vSyncRoll: () => Math.random() < 0.9 ? 0 : Math.random() * 0.04,
      fuzzOpacity: () => 0.02 + Math.random() * 0.35,
      fuzzSize: () => Math.floor(Math.random() * 3) + 1,
      fuzzSpeed: () => 0.5 + Math.random() * 2.5,
      fuzzColorRatio: () => Math.random(),
      needleNoise: () => Math.random() < 0.3 ? 0 : Math.random() * 0.75,
      needleNoiseDensity: () => 0.1 + Math.random() * 0.6,
      thermalNoiseFreq: () => Math.random() < 0.8 ? 0 : Math.random() * 0.1,
      trackingLinesCount: () => Math.floor(Math.random() * 4),
      trackingBlockY: () => Math.random(),
      trackingBlockHeight: () => 0.02 + Math.random() * 0.12,
      trackingScrollSpeed: () => Math.random() < 0.8 ? 0 : -35 + Math.random() * 70,
      trackingDisplacementX: () => 5.0 + Math.random() * 25.0,
      trackingNoiseDensity: () => 0.2 + Math.random() * 0.7,
      trackingFuzzOpacity: () => 0.1 + Math.random() * 0.7,
      chromaOffsetRedX: () => -10 + Math.random() * 20,
      chromaOffsetBlueX: () => -10 + Math.random() * 20,
      chromaOffsetRedY: () => -5 + Math.random() * 10,
      chromaOffsetBlueY: () => -5 + Math.random() * 10,
      chromaPhaseShift: () => Math.random() < 0.7 ? 0 : -45 + Math.random() * 90,
      chromaScrollSpeed: () => Math.random() < 0.8 ? 0 : -15 + Math.random() * 30,
      chromaSmearFactor: () => Math.random() * 0.9,
      lumaBleedThreshold: () => 0.3 + Math.random() * 0.6,
      ghostingCount: () => Math.floor(Math.random() * 3),
      ghostingOffsetX: () => Math.floor(-40 + Math.random() * 80),
      ghostingOffsetY: () => Math.floor(-20 + Math.random() * 40),
      ghostingStrength: () => Math.random() * 0.45,
      phosphorTrails: () => Math.random() < 0.5 ? 0 : Math.random(),
      scanlineOpacity: () => 0.1 + Math.random() * 0.5,
      scanlineDensity: () => 0.1 + Math.random() * 0.9,
      crtCurvature: () => Math.random() * 0.12,
      crtVignette: () => 0.1 + Math.random() * 0.6,
      grillMask: () => ["none", "aperture", "shadow", "slot"][Math.floor(Math.random() * 4)] as any,
      grillScale: () => 1.0 + Math.random() * 1.5,
      osdBlur: () => Math.random() < 0.8 ? 0 : Math.random() * 1.5,
      osdPixelScale: () => Math.random() < 0.9 ? 1 : 2,
      // Film Effects (Phase 1)
      gateWeave: () => Math.random() < 0.7 ? 0 : Math.random() * 2.0,
      filmJitter: () => Math.random() < 0.8 ? 0 : Math.random() * 1.5,
      filmDust: () => Math.random() < 0.5 ? 0 : Math.random() * 3.0,
      filmDustSize: () => 0.5 + Math.random() * 1.5,
      filmScratches: () => Math.random() < 0.6 ? 0 : Math.random() * 2.0,
      filmScratchesWidth: () => 0.1 + Math.random() * 0.8,
      filmGrain: () => Math.random() < 0.4 ? 0 : Math.random() * 2.5,
      filmGrainSize: () => Math.floor(Math.random() * 3) + 1,
      filmLightLeaks: () => Math.random() < 0.7 ? 0 : Math.random() * 3.0,
      filmVignette: () => Math.random() < 0.6 ? 0 : Math.random() * 0.8,
      filmVignetteRadius: () => Math.random() * 0.5,
      filmVignetteSoftness: () => 0.2 + Math.random() * 0.8,
      filmHalation: () => Math.random() < 0.8 ? 0 : Math.random() * 0.5,
      filmBreath: () => Math.random() < 0.7 ? 0 : Math.random() * 1.5,
      filmAnamorphic: () => Math.random() < 0.85 ? 0 : Math.random() * 4.0,
      filmEmulsion: () => Math.random() < 0.9 ? 0 : Math.random() * 3.0,
      filmFrameJump: () => Math.random() < 0.9 ? 0 : Math.random() * 5.0,
      filmFrameBurn: () => Math.random() < 0.92 ? 0 : Math.random() * 5.0,
      filmBurnSharpness: () => Math.random(),
      filmBurnHue: () => Math.floor(Math.random() * 360),
      filmChemicalSpots: () => Math.random() < 0.88 ? 0 : Math.random() * 4.0,
    };

    const randomSettings: Partial<SimulatorSettings> = {};
    // Randomize a random selection of sliders (roughly 70% of them each time)
    Object.entries(allPossibleUpdates).forEach(([key, getRandom]) => {
      // Prefer not to wobble
      if ((key.includes("Wobble") || key.includes("hWave") || key.includes("vWave")) && Math.random() < 0.8) return;
      
      // Exclude film iris settings and dynamic phase rotation
      if (["filmVignette", "filmVignetteRadius", "filmVignetteSoftness", "chromaScrollSpeed", "chromaPhaseShift", "filmBurnHue"].includes(key)) return;

      if (Math.random() < 0.7) {
        (randomSettings as any)[key] = getRandom();
      }
    });

    setSettings(() => ({
      ...BASE_INITIAL_STATE,
      ...randomSettings,
      globalHueRotate: 0,
      sourceType: (isCameraActive || settings.sourceType === "camera") ? "camera" : (randomSettings.sourceType || BASE_INITIAL_STATE.sourceType)
    }));
    setSyncReset(prev => prev + 1);
    setActivePreset("custom");
    setRandomConfirm(false);
  };

  // Stable Image Panic Button
  const handleStabilizeImage = () => {
    setSettings(prev => ({
      ...prev,
      hWaveAmp: 0,
      vWaveAmp: 0,
      globalWobbleAmpX: 0,
      globalWobbleAmpY: 0,
      lineJitterStrength: 0,
      hSyncSkew: 0,
      vSyncRoll: 0,
      trackingDisplacementX: 0,
      trackingScrollSpeed: 0,
      chromaScrollSpeed: 0,
      gateWeave: 0,
      filmJitter: 0,
      filmFrameJump: 0,
      filmBreath: 0,
    }));
    setSyncReset(prev => prev + 1);
    setPanicConfirm(false);
  };

  // Clean streams on unload
  useEffect(() => {
    return () => {
      if (cameraVideoNode && cameraVideoNode.srcObject) {
        const s = cameraVideoNode.srcObject as MediaStream;
        s.getTracks().forEach((t) => t.stop());
      }
    };
  }, [cameraVideoNode]);

  // Helper to resolve the intended output resolution width and height
  const getExportDimensions = () => {
    const liveW = settings.canvasWidth;
    const liveH = settings.canvasHeight;
    const ratio = liveW / liveH;

    const makeEven = (val: number) => {
      const rounded = Math.round(val);
      return rounded % 2 === 0 ? rounded : rounded + 1;
    };

    switch (exportConfig.preset) {
      case "480p": {
        const h = 480;
        const w = makeEven(h * ratio);
        return { w, h };
      }
      case "720p": {
        const h = 720;
        const w = makeEven(h * ratio);
        return { w, h };
      }
      case "1085":
      case "1080p": {
        const h = 1080;
        const w = makeEven(h * ratio);
        return { w, h };
      }
      case "4k": {
        const h = 2160;
        const w = makeEven(h * ratio);
        return { w, h };
      }
      case "custom": {
        const w = makeEven(exportConfig.customWidth || 1280);
        const h = makeEven(exportConfig.customHeight || 720);
        return { w, h };
      }
      case "original":
      default:
        return { w: makeEven(liveW), h: makeEven(liveH) };
    }
  };

  // Helper to calculate Bits per second for MediaRecorder
  const getExportBitrateBps = () => {
    let mbps = 16; // default high quality 16 Mbps
    switch (exportConfig.bitrateLevel) {
      case "low": mbps = 3; break;
      case "medium": mbps = 8; break;
      case "high": mbps = 16; break;
      case "cranked": mbps = 32; break;
      case "ludicrous": mbps = 60; break;
      case "custom": mbps = exportConfig.customBitrate || 16; break;
    }
    return mbps * 1000 * 1000;
  };

  // MediaRecorder triggers video recording (WebM or MP4)
  const startRecordingVideo = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { w: targetW, h: targetH } = getExportDimensions();

    // Create offscreen canvas for upscaling
    const offscreenCanvas = document.createElement("canvas");
    offscreenCanvas.width = targetW;
    offscreenCanvas.height = targetH;
    const offscreenCtx = offscreenCanvas.getContext("2d");
    if (offscreenCtx) {
      offscreenCtx.imageSmoothingEnabled = true;
      offscreenCtx.imageSmoothingQuality = "high";
    }

    recordedChunksRef.current = [];

    // Capture stream from the upscaled offscreen canvas!
    const canvasStream = offscreenCanvas.captureStream(exportConfig.fps);
    const combinedStream = new MediaStream();

    // Export video streams
    canvasStream.getVideoTracks().forEach((t) => combinedStream.addTrack(t));

    try {
      const isMp4 = exportConfig.format === "mp4";
      let resolvedMimeType = "video/mp4";

      if (isMp4) {
        if (MediaRecorder.isTypeSupported("video/mp4;codecs=avc1")) {
          resolvedMimeType = "video/mp4;codecs=avc1";
        } else if (MediaRecorder.isTypeSupported("video/x-matroska;codecs=avc1")) {
          resolvedMimeType = "video/x-matroska;codecs=avc1";
        } else if (MediaRecorder.isTypeSupported("video/mp4")) {
          resolvedMimeType = "video/mp4";
        } else {
          console.warn("Standard MP4 containers not supported; falling back to clean WebM format.");
          resolvedMimeType = "video/webm;codecs=vp9";
        }
      } else {
        if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")) {
          resolvedMimeType = "video/webm;codecs=vp9,opus";
        } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
          resolvedMimeType = "video/webm;codecs=vp9";
        } else if (MediaRecorder.isTypeSupported("video/webm")) {
          resolvedMimeType = "video/webm";
        } else {
          resolvedMimeType = "video/webm";
        }
      }

      const bitrateBps = getExportBitrateBps();
      const options: MediaRecorderOptions = { 
        mimeType: resolvedMimeType,
        videoBitsPerSecond: bitrateBps 
      };

      const recorder = new MediaRecorder(combinedStream, options);
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const extension = resolvedMimeType.includes("mp4") ? "mp4" : "webm";
        const blob = new Blob(recordedChunksRef.current, { type: resolvedMimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `crt_overlay_master_${Date.now()}.${extension}`;
        a.click();
        URL.revokeObjectURL(url);
      };

      mediaRecorderRef.current = recorder;

      // Start recording animation copying loop to draw active viewfinder canvas into offscreen canvas
      const copyFrame = () => {
        if (!canvasRef.current) return;
        if (offscreenCtx) {
          offscreenCtx.drawImage(canvasRef.current, 0, 0, targetW, targetH);
        }
        recordingAnimationRef.current = requestAnimationFrame(copyFrame);
      };

      if (recordingAnimationRef.current) {
        cancelAnimationFrame(recordingAnimationRef.current);
      }
      recordingAnimationRef.current = requestAnimationFrame(copyFrame);

      recorder.start(250); // 250ms chunks

      setRecDuration(0);
      setIsRecording(true);

      if (recTimerRef.current) {
        clearInterval(recTimerRef.current);
      }

      recTimerRef.current = window.setInterval(() => {
        setRecDuration((prev) => {
          if (exportConfig.stopTrigger === "auto" && prev + 1 >= exportConfig.autoStopDuration) {
            if (recTimerRef.current) {
              clearInterval(recTimerRef.current);
            }
            stopRecordingVideo();
            return prev + 1;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Failed to generate combined stream recorder:", err);
      if (recordingAnimationRef.current) {
        cancelAnimationFrame(recordingAnimationRef.current);
        recordingAnimationRef.current = null;
      }
    }
  };

  const stopRecordingVideo = () => {
    if (recordingAnimationRef.current) {
      cancelAnimationFrame(recordingAnimationRef.current);
      recordingAnimationRef.current = null;
    }
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recTimerRef.current) {
        clearInterval(recTimerRef.current);
      }
    }
  };

  // Progressive transparent/normal GIF exporter with offscreen high-quality upscale support
  const captureGifSequence = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setGifProgress(0);
    
    let framesToCapture = 36;
    if (exportConfig.gifLength === "medium") framesToCapture = 72;
    if (exportConfig.gifLength === "long") framesToCapture = 120;
    
    const capturedImages: string[] = [];
    let curFrame = 0;

    const { w: targetW, h: targetH } = getExportDimensions();

    // Create an offscreen canvas for frame resizing
    const resizeCanvas = document.createElement("canvas");
    resizeCanvas.width = targetW;
    resizeCanvas.height = targetH;
    const resizeCtx = resizeCanvas.getContext("2d");
    if (resizeCtx) {
      resizeCtx.imageSmoothingEnabled = true;
      resizeCtx.imageSmoothingQuality = "high";
    }

    const grabFrame = () => {
      if (curFrame >= framesToCapture) {
        setGifProgress(85);
        gifshot.createGIF(
          {
            images: capturedImages,
            gifWidth: targetW,
            gifHeight: targetH,
            interval: 1 / exportConfig.fps,
            numFrames: framesToCapture,
          },
          (obj) => {
            if (!obj.error) {
              const a = document.createElement("a");
              a.href = obj.image;
              a.download = `vhs_simulation_loop_${Date.now()}.gif`;
              a.click();
            } else {
              console.error("Gifshot error:", obj.error);
            }
            setGifProgress(-1);
          }
        );
        return;
      }

      if (canvasRef.current && resizeCtx) {
        resizeCtx.drawImage(canvasRef.current, 0, 0, targetW, targetH);
        capturedImages.push(resizeCanvas.toDataURL("image/png"));
      }
      curFrame++;
      setGifProgress(Math.round((curFrame / framesToCapture) * 80));

      setTimeout(grabFrame, 1000 / exportConfig.fps);
    };

    grabFrame();
  };

  // Duration parser helper
  const parseSeconds = (s: number) => {
    if (!isFinite(s) || isNaN(s)) return "Live";
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className={`min-h-screen lg:h-screen lg:overflow-hidden bg-zinc-950 text-zinc-100 flex flex-col font-sans select-none ${isFullscreen ? "overflow-hidden w-full h-full" : ""}`}>
      
      {/* 1. Header Branded Bar */}
      <header className="sticky top-0 p-2 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-900 flex justify-between items-center shrink-0 z-[100] px-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1 px-1.5 bg-zinc-900 border border-zinc-800 rounded-sm">
            <Tv className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex flex-col justify-center pt-0.5">
            <h1 className="text-xs font-mono font-bold tracking-wider text-zinc-100 uppercase leading-none mb-0.5">
              Retro Video Engine
            </h1>
            <p className="text-[9px] text-zinc-500 font-mono leading-none">
              PRO ANALOG SIGNAL DISTORTION PROCESSOR
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[9px] text-emerald-400 font-mono tracking-widest hidden sm:inline animate-pulse mt-0.5">
            ● ANALOG SYNAPSE MATRIX READY
          </span>
        </div>
      </header>

      {/* 2. Main Workspace */}
      <main className="flex-1 flex flex-col lg:flex-row items-stretch lg:overflow-hidden relative min-h-0">
        
        {/* VIEWPORT CANVAS COLUMN */}
        <div 
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={handleDrop}
          className={`flex-1 flex flex-col items-center justify-start p-6 min-h-0 ${
            isFullscreen 
              ? "bg-zinc-950 p-6 z-50 fixed inset-0 w-full h-full overflow-y-auto" 
              : "bg-zinc-950 border-r border-zinc-900 lg:h-full lg:overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          }`}
        >
          
          <div className={`relative flex flex-col items-center transition-all duration-200 ${isFullscreen ? "w-full min-h-full justify-start pb-20" : "w-full max-w-[1800px]"}`}>

            {pendingPresetToApply && (
              <div className="absolute inset-0 bg-zinc-950/95 z-50 flex flex-col items-center justify-start pt-20 p-6 text-center rounded border border-zinc-800 backdrop-blur-sm">
                <div className="bg-zinc-900 border border-amber-500/30 p-6 rounded-md max-w-sm flex flex-col space-y-4 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                  <div className="w-12 h-12 rounded-full bg-amber-950/60 border border-amber-500/35 flex items-center justify-center mx-auto">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-mono font-bold uppercase text-amber-400 tracking-wider">
                      Preset Calibration
                    </h4>
                    <p className="text-[11px] font-mono text-zinc-300">
                      Target: <span className="text-white font-bold">
                        {pendingPresetToApply.startsWith("custom_") 
                          ? customPresets[pendingPresetToApply]?.label 
                          : PRESETS[pendingPresetToApply]?.name}
                      </span>
                    </p>
                    <p className="text-[10.5px] text-zinc-400 leading-relaxed font-sans pt-1">
                      Do you want to completely <b>OVERWRITE</b> your active configuration, or <b>MERGE</b> these specific preset coefficients onto your existing sliders?
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <button
                      onClick={() => {
                        applyPresetActual(pendingPresetToApply, false); // merge
                        setPendingPresetToApply(null);
                      }}
                      className="px-2.5 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 border border-zinc-700 rounded-sm cursor-pointer uppercase transition-all font-semibold animate-none"
                    >
                      ➕ MERGE
                    </button>
                    <button
                      onClick={() => {
                        applyPresetActual(pendingPresetToApply, true); // overwrite
                        setPendingPresetToApply(null);
                      }}
                      className="px-2.5 py-2 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white rounded-sm cursor-pointer uppercase transition-all font-extrabold shadow-lg animate-none"
                    >
                      💥 OVERWRITE
                    </button>
                  </div>
                  <button
                    onClick={() => setPendingPresetToApply(null)}
                    className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300 underline uppercase cursor-pointer"
                  >
                    Cancel Calibration
                  </button>
                </div>
              </div>
            )}

            {/* Integrated CRT Monitor Unit (Screen + Branding Bezel) */}
            <div 
              className={`flex flex-col items-center justify-center transition-all duration-300 mx-auto group shrink-0 ${isFullscreen ? "max-w-none" : "max-w-[1600px] w-full"}`}
              style={{
                width: settings.flexToScreen ? "100%" : `${settings.canvasWidth}px`,
              }}
            >
              {/* Clean Centered CRT Monitor Viewfinder Screen Piece */}
              <div 
                className={`relative overflow-hidden rounded bg-black shadow-[0_0_100px_rgba(0,0,0,0.9)] border-4 border-zinc-900 flex items-center justify-center transition-all duration-300 w-full ring-1 ring-zinc-800`}
                style={{
                  height: settings.flexToScreen ? "auto" : `${settings.canvasHeight}px`,
                  maxHeight: isFullscreen ? "88vh" : "78vh",
                  aspectRatio: `${settings.canvasWidth}/${settings.canvasHeight}`,
                }}
              >
                {/* Tactical Viewport Controls (Overlayed on Bezel) */}
                <div className="absolute top-3 right-3 z-50 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {/* Scaling Toggle */}
                    <button
                      onClick={() => handleSettingsChange({ flexToScreen: !settings.flexToScreen })}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm border backdrop-blur-xl transition-all font-mono text-[9px] uppercase tracking-wider font-bold shadow-2xl ${
                        settings.flexToScreen 
                          ? "bg-sky-500/30 border-sky-400/50 text-white" 
                          : "bg-zinc-900/80 border-zinc-700 text-zinc-400 hover:bg-zinc-900"
                      }`}
                      title={settings.flexToScreen ? "Switch to 1:1 Pixel Mapping" : "Scale to Fit Bezel"}
                    >
                      <Maximize2 className="w-3 h-3" />
                      <span>{settings.flexToScreen ? "ZOOM: FIT" : "PIXEL: 1:1"}</span>
                    </button>
                  </div>

              {/* Inner animated power collapse / expand screen container */}
              <div 
                className={`w-full h-full relative transition-all duration-300 origin-center ${
                  tvPowerState === "turning_off"
                    ? "crt-power-off"
                    : tvPowerState === "turning_on"
                      ? "crt-power-on"
                      : tvPowerState === "off"
                        ? "scale-0 opacity-0 invisible"
                        : "scale-100 opacity-100"
                }`}
              >
                {/* Active physical drawing canvas */}
                <canvas
                  id="simulator-canvas"
                  ref={canvasRef}
                  width={settings.canvasWidth}
                  height={settings.canvasHeight}
                  className="w-full h-full object-contain select-none font-mono"
                  style={{
                    imageRendering: "pixelated",
                    cursor: (settings.blendOverlayOpacity ?? 0) > 0 ? "grab" : "default"
                  }}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUpOrLeave}
                  onMouseLeave={handleCanvasMouseUpOrLeave}
                  onTouchStart={handleCanvasTouchStart}
                  onTouchMove={handleCanvasTouchMove}
                  onTouchEnd={handleCanvasMouseUpOrLeave}
                  onTouchCancel={handleCanvasMouseUpOrLeave}
                />

                {/* Simulated Glass glare highlight overlay */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-white/10" />

                {/* Dynamic Calibration / Telemetry Debug mode Panel overlay */}
                {settings.debugModeEnabled && (
                  <div className="absolute top-3.5 right-3.5 w-56 bg-zinc-950/95 border border-amber-500/80 p-3.5 rounded-sm font-mono text-[9px] text-amber-500 shadow-2xl space-y-2.5 z-30 pointer-events-auto leading-normal select-text backdrop-blur-sm text-left">
                    <div className="flex items-center justify-between border-b border-amber-500/30 pb-1">
                      <span className="font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                        <span>TELEMETRY STACK LOG</span>
                      </span>
                      <span className="text-amber-600 font-bold text-[8px]">v1.2.9</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">SIGNAL FEED:</span>
                        <span className="font-bold text-zinc-100 uppercase">{settings.sourceType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">CRT RES:</span>
                        <span className="text-zinc-200">{settings.canvasWidth}x{settings.canvasHeight}@60Hz</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">TAPE FRAMES:</span>
                        <span className="text-emerald-400">{renderedFrames}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">VCR DECK:</span>
                        <span className={vidPlayState ? "text-emerald-400 font-bold" : "text-rose-450 font-bold"}>
                          {vidPlayState ? "■ RUNNING" : "◽ STOPPED"}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-amber-500/30 pt-1.5 space-y-1">
                      <div className="text-zinc-400 uppercase tracking-wide font-bold mb-1 leading-none text-[8.5px]">
                        INPUTS LIVE MOVE LOG:
                      </div>
                      {changedSliders.length === 0 ? (
                        <div className="text-[8px] text-zinc-500 italic">Adjust sliders to stream input...</div>
                      ) : (
                        <div className="space-y-1">
                          {changedSliders.map((item, idx) => (
                            <div key={idx} className="flex items-start justify-between gap-1 text-[8.5px] leading-tight">
                              <span className="text-yellow-600 shrink-0 font-bold">[{item.time}]</span>
                              <span className="text-zinc-350 truncate flex-1 block max-w-[85px] text-left leading-none">{item.param}</span>
                              <span className="text-emerald-400 font-bold leading-none">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Render GIF processing layer overlays */}
                {gifProgress >= 0 && (
                  <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-5 z-20 font-mono">
                    <RefreshCw className="w-8 h-8 text-sky-400 animate-spin mb-3" />
                    <p className="text-xs text-sky-300 uppercase tracking-widest font-bold">Capturing CRT Overlay Loop</p>
                    <p className="text-[10px] text-zinc-400 mt-1">Extracting video frame fields: {gifProgress}%</p>
                    <div className="w-48 bg-zinc-900 border border-zinc-800 h-1.5 rounded-none mt-3 overflow-hidden">
                      <div className="bg-sky-500 h-full transition-all duration-150" style={{ width: `${gifProgress}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </div>


            {/* PHYSICAL CRT BEZEL CONTROL RAIL (Directly under the screen!) */}
              <div 
                className="w-full bg-gradient-to-b from-zinc-900 to-zinc-950 border-x border-b border-zinc-800 rounded-b-md p-2 shadow-xl font-mono text-xs flex flex-col items-center gap-2 transition-all"
              >
                <div className="w-full flex flex-wrap items-center justify-center gap-2">
                  {/* Retro Logo & Power Indicator */}
                  <div className="flex items-center gap-3 select-none">
                    {/* Simulated Power LED indicator */}
                    <div className="flex flex-col items-center gap-0.5 justify-center">
                      <span className="text-[7.5px] text-zinc-500 font-bold uppercase tracking-widest leading-none">POWER</span>
                      <div className={`w-3 h-3 rounded-full border border-zinc-950 shadow transition-all duration-300 ${
                        tvPowerState === "on" 
                          ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" 
                          : tvPowerState === "turning_on" || tvPowerState === "turning_off"
                            ? "bg-amber-500 animate-pulse shadow-[0_0_5px_rgba(245,158,11,0.6)]"
                            : "bg-red-700 shadow-[0_0_2px_rgba(185,28,28,0.4)]"
                      }`} />
                    </div>
                  </div>

                  {/* Manual VHS Glitch tactile key */}
                  <button
                    type="button"
                    onMouseDown={() => setIsManualGlitchActive(true)}
                    onMouseUp={() => setIsManualGlitchActive(false)}
                    onMouseLeave={() => setIsManualGlitchActive(false)}
                    onTouchStart={(e) => { e.preventDefault(); setIsManualGlitchActive(true); }}
                    onTouchEnd={(e) => { e.preventDefault(); setIsManualGlitchActive(false); }}
                    className={`px-2 py-0.5 rounded-sm font-extrabold border transition-all text-[8px] tracking-wider uppercase cursor-pointer select-none flex items-center gap-1 ${
                      isManualGlitchActive
                        ? "bg-amber-500 border-amber-300 text-black shadow-[0_0_10px_rgba(245,158,11,0.8)] animate-pulse"
                        : "bg-zinc-800 hover:bg-zinc-705 border-zinc-700 hover:border-zinc-500 text-amber-500 shadow-sm"
                    }`}
                    title="Simulate high-tension tape jump, h-sync tear, and magnetic tracking slip (Hold to sustain)"
                  >
                    <span>⚡ GLITCH</span>
                  </button>

                  <button
                    type="button"
                    onMouseDown={() => setFilmFxActive(true)}
                    onMouseUp={() => setFilmFxActive(false)}
                    onMouseLeave={() => setFilmFxActive(false)}
                    onTouchStart={(e) => { e.preventDefault(); setFilmFxActive(true); }}
                    onTouchEnd={(e) => { e.preventDefault(); setFilmFxActive(false); }}
                    className={`px-2 py-0.5 rounded-sm font-extrabold border transition-all text-[8px] tracking-wider uppercase cursor-pointer select-none flex items-center gap-1 ${
                      filmFxActive 
                        ? "bg-rose-500 border-rose-300 text-white shadow-[0_0_10px_rgba(244,63,94,0.8)] animate-pulse"
                        : "bg-zinc-800 hover:bg-zinc-705 border-zinc-700 hover:border-zinc-500 text-rose-500 shadow-sm"
                    }`}
                    title="Simulate heat-induced film damage and emulsion melt (Hold to sustain)"
                  >
                    <span>🔥 FILM FX</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilmCountdownActive((prev) => !prev)}
                    className={`px-2 py-0.5 rounded-sm font-extrabold border transition-all text-[8px] tracking-wider uppercase cursor-pointer select-none flex items-center gap-1 ${
                      filmCountdownActive 
                        ? "bg-cyan-500 border-cyan-300 text-black shadow-[0_0_10px_rgba(6,182,212,0.8)] animate-pulse"
                        : "bg-zinc-800 hover:bg-zinc-705 border-zinc-700 hover:border-zinc-500 text-cyan-400 shadow-sm"
                    }`}
                    title="Toggle vintage SMPTE 8-to-2 circular film countdown screen leader (Auto stops)"
                  >
                    <span>🎬 COUNTDOWN</span>
                  </button>

                  {/* Camera Controls */}
                  <div className="flex items-center gap-1.5 shrink-0 font-mono pl-3 border-l border-zinc-800">
                    <span className="text-[8.5px] text-zinc-500 uppercase font-semibold mr-0.5">CAMERA:</span>
                    <button
                      onClick={handleToggleCamera}
                      className={`flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-bold rounded-sm transition-all border cursor-pointer ${
                        isCameraActive && settings.sourceType === "camera"
                          ? "bg-rose-950 text-rose-400 border-rose-900"
                          : "bg-emerald-700 text-zinc-950 hover:bg-emerald-600 font-extrabold"
                      }`}
                      title="Toggle System Camera"
                    >
                      <Camera className="w-2.5 h-2.5" />
                      <span>{isCameraActive && settings.sourceType === "camera" ? "OFF" : "ON"}</span>
                    </button>

                    <button
                      onClick={() => handleCycleCamera()}
                      disabled={!isCameraActive}
                      className={`flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-bold rounded-sm transition-all border ${
                        isCameraActive
                          ? "bg-zinc-800 border-zinc-700 hover:bg-zinc-755 text-sky-400 hover:text-sky-300 cursor-pointer"
                          : "bg-zinc-950/45 border-zinc-900 text-zinc-650 cursor-not-allowed"
                      }`}
                      title="Cycle Camera Lenses (if multiple)"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>LENS</span>
                    </button>

                    <button
                      onClick={() => handleSettingsChange({ flipHorizontal: !settings.flipHorizontal })}
                      className={`px-1.5 py-0.5 text-[8px] font-mono rounded-sm border transition-all cursor-pointer ${
                        settings.flipHorizontal
                          ? "bg-sky-955 bg-sky-950 border-sky-600 text-sky-300 font-bold"
                          : "bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-400"
                      }`}
                      title="Flip Horizontally"
                    >
                      FLIP X
                    </button>

                    <button
                      onClick={() => handleSettingsChange({ flipVertical: !settings.flipVertical })}
                      className={`px-1.5 py-0.5 text-[8px] font-mono rounded-sm border transition-all cursor-pointer ${
                        settings.flipVertical
                          ? "bg-sky-955 bg-sky-950 border-sky-600 text-sky-300 font-bold"
                          : "bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-400"
                      }`}
                      title="Flip Vertically"
                    >
                      FLIP Y
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      className={`px-1.5 py-0.5 text-[8px] font-mono rounded-sm border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        isFullscreen
                          ? "bg-sky-955 bg-sky-950 border-sky-600 text-sky-300 font-bold"
                          : "bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-400"
                      }`}
                      title="Toggle immersive display screen focus"
                    >
                      {isFullscreen ? <Minimize2 className="w-2.5 h-2.5" /> : <Maximize2 className="w-2.5 h-2.5" />}
                      FULLSCREEN
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        if (tvPowerState === "off") {
                          setTvPowerState("turning_on");
                          setTimeout(() => setTvPowerState("on"), 550);
                        }
                      }}
                      disabled={tvPowerState === "on" || tvPowerState === "turning_on" || tvPowerState === "turning_off"}
                      className={`px-2 py-0.5 rounded-sm font-black border transition-all text-[9px] uppercase cursor-pointer ${
                        tvPowerState === "on"
                          ? "bg-zinc-950/40 border-zinc-900 text-zinc-650 cursor-default"
                          : "bg-zinc-800 hover:bg-zinc-750 border-zinc-700 hover:border-zinc-500 text-zinc-250 active:bg-zinc-900 shadow-md"
                      }`}
                      title="Power on the analog CRT color phosphor grids"
                    >
                      ON
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (tvPowerState === "on") {
                          setTvPowerState("turning_off");
                          setTimeout(() => setTvPowerState("off"), 500);
                        }
                      }}
                      disabled={tvPowerState === "off" || tvPowerState === "turning_on" || tvPowerState === "turning_off"}
                      className={`px-2 py-0.5 rounded-sm font-black border transition-all text-[9px] uppercase cursor-pointer ${
                        tvPowerState === "off"
                          ? "bg-zinc-950/40 border-zinc-900 text-zinc-650 cursor-default"
                          : "bg-red-950/40 hover:bg-red-900/50 border-red-900/60 hover:border-red-650 text-red-400 active:bg-zinc-950 shadow-md"
                      }`}
                      title="Collapse high-voltage grids and magnetic deflection lines"
                    >
                      OFF
                    </button>
                  </div>
                </div>
              </div>

              {/* Camera Access Error Alert */}
              {cameraError && (
                <div className="w-full mt-2 bg-rose-955 bg-rose-950/40 border border-rose-800 p-2 rounded-sm flex items-start gap-3 text-rose-200 animate-in fade-in duration-300 text-left">
                  <ShieldAlert className="w-3 h-3 text-rose-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-tight font-mono">Lens Access Error</p>
                    <p className="text-[9px] opacity-80 font-mono">{cameraError}</p>
                  </div>
                  <button 
                    onClick={() => setCameraError(null)}
                    className="text-rose-400 hover:text-white cursor-pointer"
                  >
                    <Square className="w-3 h-3" />
                  </button>
                </div>
              )}
              
              {/* TRINITRON ANALOG MEDIA DECK */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-2">
                <div className="flex-1 w-full relative">
                  <VcrController
                    isFullscreen={isFullscreen}
                    settings={settings}
                    handleSettingsChange={handleSettingsChange}
                    vidPlayState={vidPlayState}
                    vidCurrentTime={vidCurrentTime}
                    vidDuration={vidDuration}
                    handleTogglePlay={handleTogglePlay}
                    handleStopVideo={handleStopVideo}
                    handleSeekVideo={handleSeekVideo}
                    panicConfirm={panicConfirm}
                    setPanicConfirm={setPanicConfirm}
                    handleStabilizeImage={handleStabilizeImage}
                    isRecording={isRecording}
                    recDuration={recDuration}
                    exportConfig={exportConfig}
                    stopRecordingVideo={stopRecordingVideo}
                    setShowExportModal={setShowExportModal}
                  />
                </div>
              </div>

















            {/* 4 Assignable Analog Macro Potentiometers & Sizing Console */}
            <div className="w-full">
              <MacroSliders 
                favKeys={favKeys}
                setFavKeys={setFavKeys}
                settings={settings}
                handleSettingsChange={handleSettingsChange}
                isFullscreen={isFullscreen}
              />
            </div>

            {/* Instruction if fullscreen active */}
            {isFullscreen && (
              <div className="fixed top-3 right-3 bg-zinc-950/95 border border-zinc-800 px-3 py-1.5 rounded-sm shadow-2xl z-[100] text-[9.5px] font-mono text-zinc-400 flex items-center gap-1.5 pointer-events-none backdrop-blur-md uppercase tracking-wider">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>EXIT: ESC OR MINIMIZE</span>
              </div>
            )}
          </div>
        </div>
      </div>

        {/* CONTROLS SLIDERS COLUMN */}
        <div className="w-full lg:w-[480px] xl:w-[540px] shrink-0 p-5 bg-zinc-950 border-t lg:border-t-0 lg:h-full lg:overflow-y-auto min-h-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <ControlPanel
            settings={settings}
            onChange={handleSettingsChange}
            onApplyPreset={handleApplyPreset}
            activePreset={activePreset}
            presetsList={Object.fromEntries(
              Object.entries(PRESETS).map(([k, p]) => [k, { name: p.name, description: p.description }])
            )}
            customPresets={customPresets}
            onSaveCustomPreset={handleSaveCustomPreset}
            onDeleteCustomPreset={handleDeleteCustomPreset}
            onExportPresets={handleExportPresets}
            onImportPresets={handleImportPresets}
            onUploadClick={triggerMediaUpload}
            onCameraClick={handleToggleCamera}
            isCameraActive={isCameraActive}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            vidPlayState={vidPlayState}
            vidCurrentTime={vidCurrentTime}
            vidDuration={vidDuration}
            vidVolume={vidVolume}
            vidLoop={vidLoop}
            vidSpeed={vidSpeed}
            vidHasCorsError={vidHasCorsError}
            onTogglePlay={handleTogglePlay}
            onStopVideo={handleStopVideo}
            onSeekVideo={handleSeekVideo}
            onVolumeChange={handleVolumeChange}
            onSpeedChange={handleSpeedChange}
            onToggleLoop={handleToggleLoop}
            onRandomize={handleRandomize}
            randomConfirm={randomConfirm}
            onOverlayUploadClick={triggerOverlayUpload}
            onRestartGif={() => setRestartGifTrigger(t => t + 1)}
            uploadedMediaSrc={uploadedMediaSrc}
            uploadedMediaType={uploadedMediaType}
          />
        </div>

      </main>

      {/* Active hidden media elements to force browser animation loops for GIFs and videos */}
      <div 
        style={{ 
          position: "fixed", 
          bottom: "1px", 
          right: "1px", 
          width: "20px", 
          height: "20px", 
          opacity: 0.05, 
          overflow: "hidden", 
          pointerEvents: "none", 
          zIndex: -10,
          visibility: "visible" 
        }}
      >
        {/* Dynamic Multi-Exposure Blend overlay GIF/Image with DOM binder */}
        {settings.blendOverlayUrl ? (
          <img
            key={settings.blendOverlayUrl}
            ref={(el) => { setSecondaryOverlayNode(el); }}
            src={settings.blendOverlayUrl}
            alt="blend overlay text"
          />
        ) : null}

        {/* Live Camera Stream feed elements */}
        <video 
          ref={(el) => { setCameraVideoNode(el); }} 
          onTimeUpdate={(e) => { if (settings.sourceType === "camera") setVidCurrentTime(e.currentTarget.currentTime); }}
          onDurationChange={(e) => { if (settings.sourceType === "camera") setVidDuration(e.currentTarget.duration); }}
          width="640" 
          height="480" 
          playsInline 
          muted 
          loop
        />

        {/* Web loop video tag source */}
        <video 
          ref={(el) => { 
            setWebVideoNode(el); 
            if (el) {
              el.crossOrigin = "anonymous";
            }
          }}
          onTimeUpdate={(e) => { if (settings.sourceType === "webvideo") setVidCurrentTime(e.currentTarget.currentTime); }}
          onDurationChange={(e) => { if (settings.sourceType === "webvideo") setVidDuration(e.currentTarget.duration); }}
          onError={() => { if (settings.sourceType === "webvideo") setVidHasCorsError(true); }}
          onPlay={() => { if (settings.sourceType === "webvideo") setVidHasCorsError(false); }}
          playsInline 
          loop 
          crossOrigin="anonymous"
        />

        {/* User uploaded image container tags fallback */}
        {uploadedMediaType === "image" && uploadedMediaSrc && (
          <img 
            key={uploadedMediaSrc}
            ref={(el) => { setUploadedImageNode(el); }} 
            src={uploadedMediaSrc} 
            alt="uploaded placeholder" 
          />
        )}

        {/* User uploaded animated video container tags */}
        {uploadedMediaType === "video" && uploadedMediaSrc && (
          <video 
            ref={(el) => { setUploadedVideoNode(el); }} 
            onTimeUpdate={(e) => { if (settings.sourceType === "upload") setVidCurrentTime(e.currentTarget.currentTime); }}
            onDurationChange={(e) => { if (settings.sourceType === "upload") setVidDuration(e.currentTarget.duration); }}
            src={uploadedMediaSrc} 
            playsInline 
            loop
          />
        )}
      </div>

      {/* Core Simulation Drawing Canvas element linker */}
      <CrtCanvas
        settings={settings}
        videoElement={settings.sourceType === "camera" ? cameraVideoNode : (settings.sourceType === "upload" && uploadedMediaType === "video" ? uploadedVideoNode : null)}
        webVideoElement={webVideoNode}
        uploadedImageElement={uploadedMediaType === "image" ? uploadedImageNode : null}
        blendOverlayElement={secondaryOverlayNode}
        canvasRef={canvasRef}
        isRecording={isRecording}
        onFrameUpdate={(fc) => setRenderedFrames(fc)}
        videoSpeed={vidSpeed}
        onCorsError={(hasError) => {
          if (settings.sourceType === "webvideo") {
            setVidHasCorsError(hasError);
          }
        }}
        resetSyncTrigger={syncReset}
        tvPowerState={tvPowerState}
        manualGlitch={isManualGlitchActive}
        filmFxActive={filmFxActive}
        filmCountdownActive={filmCountdownActive}
        onCountdownComplete={() => setFilmCountdownActive(false)}
        restartGifTrigger={restartGifTrigger}
      />

      {/* High Fidelity Export Configuration Modal HUD */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        exportConfig={exportConfig}
        setExportConfig={setExportConfig}
        settingsWidth={settings.canvasWidth}
        settingsHeight={settings.canvasHeight}
        onStartExport={() => {
          setShowExportModal(false);
          if (exportConfig.format === "gif") {
            captureGifSequence();
          } else {
            startRecordingVideo();
          }
        }}
      />


    </div>
  );
}
