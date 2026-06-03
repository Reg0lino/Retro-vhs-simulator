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
import { DEFAULT_SETTINGS, PRESETS } from "./presets";
import { CrtCanvas } from "./components/CrtCanvas";
import { ControlPanel } from "./components/ControlPanel";
import { MacroSliders } from "./components/MacroSliders";
import { ASSIGNABLE_PARAMS } from "./constants";
import gifshot from "gifshot";


export default function App() {
  const [settings, setSettings] = useState<SimulatorSettings>(DEFAULT_SETTINGS);
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

  const [favKeys, setFavKeys] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("vhs_fav_keys_v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 6) return parsed;
      }
    } catch (e) {}
    return ["pixelScale", "fuzzOpacity", "scanlineOpacity", "hWaveAmp", "trackingDisplacementX", "chromaSmearFactor"];
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
      
      const baseSettings = overwrite ? DEFAULT_SETTINGS : settings;
      const nextS = { ...baseSettings, ...presetSettings };
      
      // Keep camera active and persistent if running
      if (isCameraActive) {
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
    const next = { ...settings, ...updates };
    setSettings(next);

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
      handleSettingsChange({ 
        blendOverlayUrl: url,
        blendOverlayOpacity: 0.6
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
      handleSettingsChange({ sourceType: "solid" });
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

    const randomSettings: Partial<SimulatorSettings> = {
      pixelScale: Math.floor(Math.random() * 3) + 1, // 1 to 3
      
      // Screen waves
      hWaveAmp: Math.random() < 0.45 ? 0 : Math.random() * 30,
      hWaveFreq: 0.01 + Math.random() * 0.045,
      hWaveSpeed: 1.0 + Math.random() * 4.0,

      vWaveAmp: Math.random() < 0.85 ? 0 : Math.random() * 20,
      vWaveFreq: 0.01 + Math.random() * 0.04,
      vWaveSpeed: 1.0 + Math.random() * 4.0,

      // Global filters
      globalBrightness: 95 + Math.floor(Math.random() * 30), // 95 to 125 %
      globalContrast: 85 + Math.floor(Math.random() * 50), // 85 to 135 %
      globalSaturation: Math.random() < 0.2 ? 0 : 60 + Math.floor(Math.random() * 85),
      globalBlur: Math.random() < 0.5 ? 0 : Math.random() * 1.8,

      // Wobbles & Skews
      globalWobbleSpeed: 0.6 + Math.random() * 1.8,
      globalWobbleAmpX: Math.random() * 10.0,
      globalWobbleAmpY: Math.random() * 5.0,
      lineJitterStrength: Math.random() * 5.0,
      lineJitterFrequency: Math.random() * 0.35,
      hSyncSkew: Math.random() * 12.0,
      vSyncRoll: Math.random() < 0.8 ? 0 : Math.random() * 0.035,

      // Fuzz & Noise
      fuzzOpacity: 0.03 + Math.random() * 0.28,
      fuzzSize: Math.floor(Math.random() * 2) + 1, // 1 to 2
      fuzzColorRatio: Math.random(),
      needleNoise: Math.random() * 0.65,
      needleNoiseDensity: 0.15 + Math.random() * 0.45,

      // Tracking band
      trackingLinesCount: Math.floor(Math.random() * 3), // 0 to 2
      trackingBlockY: Math.random(),
      trackingBlockHeight: 0.03 + Math.random() * 0.10,
      trackingScrollSpeed: Math.random() < 0.7 ? 0 : -30 + Math.random() * 60,
      trackingDisplacementX: 6.0 + Math.random() * 20.0,
      trackingNoiseDensity: 0.35 + Math.random() * 0.55,
      trackingFuzzOpacity: 0.25 + Math.random() * 0.55,

      // Chromatic offset
      chromaOffsetRedX: -8 + Math.random() * 16,
      chromaOffsetBlueX: -8 + Math.random() * 16,
      chromaPhaseShift: -30 + Math.random() * 60,
      chromaScrollSpeed: Math.random() < 0.8 ? 0 : -15 + Math.random() * 30,
      chromaSmearFactor: Math.random() * 0.8,
      lumaBleedThreshold: 0.45 + Math.random() * 0.45,

      // PhosphorTrails & Ghosting
      ghostingCount: Math.floor(Math.random() * 2) + 1, // 1 to 2
      ghostingOffset: Math.floor(8 + Math.random() * 24),
      ghostingStrength: Math.random() * 0.35,
      phosphorTrails: Math.random() * 0.5,

      // Scanline & Grill
      scanlineOpacity: 0.12 + Math.random() * 0.40,
      scanlineDensity: Math.random() < 0.5 ? 240 : 480,
      crtCurvature: Math.random() * 0.10,
      crtVignette: 0.20 + Math.random() * 0.45,
      grillMask: ["none", "aperture", "shadow", "slot"][Math.floor(Math.random() * 4)] as any,
      grillScale: 0.9 + Math.random() * 1.2,

      // OSD (Almost always off to satisfy "Keep most presets with text off")
      osdEnabled: false,
      osdText: ["PLAY", "PAUSE", "REC", "STOP", "SLOW", "VHS TEST"][Math.floor(Math.random() * 6)],
      osdCustomY: 0.15 + Math.random() * 0.75,
      osdTextWobble: 0,
      
      // Secondary blend overlay resets
      blendOverlayOpacity: 0.0,
    };

    setSettings(prev => ({
      ...prev,
      ...randomSettings
    }));
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

  // MediaRecorder triggers video recording (WebM or MP4)
  const startRecordingVideo = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    recordedChunksRef.current = [];
    const canvasStream = canvas.captureStream(settings.exportFps);
    const combinedStream = new MediaStream();

    // Export video streams
    canvasStream.getVideoTracks().forEach((t) => combinedStream.addTrack(t));

    try {
      const isMp4 = settings.exportFormat === "mp4";
      let options: MediaRecorderOptions = { mimeType: isMp4 ? "video/mp4" : "video/webm;codecs=vp9,opus" };

      if (isMp4) {
        // Try common MP4 variants if base video/mp4 fails check
        if (!MediaRecorder.isTypeSupported("video/mp4")) {
          if (MediaRecorder.isTypeSupported("video/mp4;codecs=avc1")) {
            options = { mimeType: "video/mp4;codecs=avc1" };
          } else if (MediaRecorder.isTypeSupported("video/x-matroska;codecs=avc1")) {
             // Some browsers treat mp4 as matroska container with h264
             options = { mimeType: "video/x-matroska;codecs=avc1" };
          } else {
            console.warn("MP4 not supported by this browser, falling back to WebM");
            options = { mimeType: "video/webm" };
          }
        }
      } else {
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options = { mimeType: "video/webm" };
        }
      }

      const recorder = new MediaRecorder(combinedStream, options);
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const extension = options.mimeType.includes("mp4") ? "mp4" : "webm";
        const blob = new Blob(recordedChunksRef.current, { type: options.mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `retro_crt_overlay_${Date.now()}.${extension}`;
        a.click();
        URL.revokeObjectURL(url);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(200); // 200ms slices

      setRecDuration(0);
      setIsRecording(true);

      recTimerRef.current = window.setInterval(() => {
        setRecDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Failed to generate combined stream recorder:", err);
    }
  };

  const stopRecordingVideo = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recTimerRef.current) {
        clearInterval(recTimerRef.current);
      }
    }
  };

  // Progressive transparent/normal GIF exporter
  const captureGifSequence = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setGifProgress(0);
    const framesToCapture = 36; // ~1.5 seconds at 24fps
    const capturedImages: string[] = [];
    let curFrame = 0;

    const grabFrame = () => {
      if (curFrame >= framesToCapture) {
        // Compile captured array using gifshot client script
        setGifProgress(85);
        gifshot.createGIF(
          {
            images: capturedImages,
            gifWidth: settings.canvasWidth,
            gifHeight: settings.canvasHeight,
            interval: 1 / settings.exportFps,
            numFrames: framesToCapture,
            // Uses black as a standard background for contrast, or supports transparency based on canvas type
          },
          (obj) => {
            if (!obj.error) {
              const a = document.createElement("a");
              a.href = obj.image;
              a.download = `vintage_vhs_loop_${Date.now()}.gif`;
              a.click();
            } else {
              console.error("Gifshot error:", obj.error);
            }
            setGifProgress(-1);
          }
        );
        return;
      }

      // Snapshot a clean dataUrl representation
      capturedImages.push(canvas.toDataURL("image/png"));
      curFrame++;
      setGifProgress(Math.round((curFrame / framesToCapture) * 80));

      // Schedule next fast snapshot
      setTimeout(grabFrame, 1000 / settings.exportFps);
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans select-none overflow-hidden">
      
      {/* 1. Header Branded Bar */}
      <header className="p-4 bg-zinc-950 border-b border-zinc-900 flex justify-between items-center shrink-0 z-10 px-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-sm">
            <Tv className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h1 className="text-sm font-mono font-bold tracking-wider text-zinc-100 uppercase">
              VCR-96 Tape Deck Sim
            </h1>
            <p className="text-[10px] text-zinc-500 font-mono">
              PRO ANALOG SIGNAL DISTORTION PROCESSOR
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[10px] text-emerald-400 font-mono tracking-widest hidden sm:inline animate-pulse">
            ● ANALOG SYNAPSE MATRIX READY
          </span>
        </div>
      </header>

      {/* 2. Main Workspace */}
      <main className="flex-1 flex flex-col lg:flex-row items-start min-h-0 relative">
        
        {/* VIEWPORT CANVAS COLUMN */}
        <div 
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={handleDrop}
          className={`flex-1 flex flex-col items-center justify-center p-6 ${isFullscreen ? "bg-zinc-950 p-6 z-50 fixed inset-0 w-full h-full overflow-y-auto" : "bg-zinc-950 border-r border-zinc-900"}`}
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
                className={`relative overflow-hidden rounded-t-sm bg-black shadow-[0_0_100px_rgba(0,0,0,0.9)] border-4 border-zinc-900 flex items-center justify-center transition-all duration-300 w-full ring-1 ring-zinc-800`}
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
                className="w-full bg-gradient-to-b from-zinc-900 to-zinc-950 border-x border-b border-zinc-800 rounded-b-md p-3.5 shadow-2xl font-mono text-xs flex flex-row items-center justify-between gap-4 transition-all"
              >
                {/* Retro Logo & Power Indicator */}
                <div className="flex items-center gap-3 select-none">
                  {/* Simulated Power LED indicator */}
                  <div className="flex flex-col items-center gap-0.5 justify-center">
                    <span className="text-[7.5px] text-zinc-500 font-bold uppercase tracking-widest leading-none">Power</span>
                    <div className={`w-3 h-3 rounded-full border border-zinc-950 shadow transition-all duration-300 ${
                      tvPowerState === "on" 
                        ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" 
                        : tvPowerState === "turning_on" || tvPowerState === "turning_off"
                          ? "bg-amber-500 animate-pulse shadow-[0_0_5px_rgba(245,158,11,0.6)]"
                          : "bg-red-700 shadow-[0_0_2px_rgba(185,28,28,0.4)]"
                    }`} />
                  </div>
                  
                  {/* Brand name */}
                  <div className="flex flex-col">
                    <span className="text-[9px] font-extrabold tracking-[0.2em] text-zinc-400 uppercase leading-none">TRINITRON CUSTOM</span>
                    <span className="text-[7px] tracking-widest text-zinc-500 uppercase mt-0.5 font-bold leading-none">HIGH BEAM MONITOR REC</span>
                  </div>
                </div>

                {/* Physical Power ON & Power OFF mechanical button keys */}
                <div className="flex items-center gap-2">
                  <span className="text-[8.5px] text-zinc-500 uppercase font-semibold mr-1 hidden xs:block">CRT TUBE:</span>
                  
                  {/* TV ON button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (tvPowerState === "off") {
                        setTvPowerState("turning_on");
                        setTimeout(() => {
                          setTvPowerState("on");
                        }, 550);
                      }
                    }}
                    disabled={tvPowerState === "on" || tvPowerState === "turning_on" || tvPowerState === "turning_off"}
                    className={`px-2.5 py-1 rounded-sm font-black border transition-all text-[9px] uppercase cursor-pointer flex items-center gap-1.5 relative top-0 active:top-0.5 ${
                      tvPowerState === "on"
                        ? "bg-zinc-950/40 border-zinc-900 text-zinc-650 cursor-default"
                        : "bg-zinc-800 hover:bg-zinc-750 border-zinc-700 hover:border-zinc-500 text-zinc-250 active:bg-zinc-900 shadow-md"
                    }`}
                    title="Power on the analog CRT color phosphor grids"
                  >
                    <span>ON</span>
                  </button>

                  {/* TV OFF button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (tvPowerState === "on") {
                        setTvPowerState("turning_off");
                        setTimeout(() => {
                          setTvPowerState("off");
                        }, 500);
                      }
                    }}
                    disabled={tvPowerState === "off" || tvPowerState === "turning_on" || tvPowerState === "turning_off"}
                    className={`px-2.5 py-1 rounded-sm font-black border transition-all text-[9px] uppercase cursor-pointer flex items-center gap-1.5 relative top-0 active:top-0.5 ${
                      tvPowerState === "off"
                        ? "bg-zinc-950/40 border-zinc-900 text-zinc-650 cursor-default"
                        : "bg-red-950/40 hover:bg-red-900/50 border-red-900/60 hover:border-red-650 text-red-400 active:bg-zinc-950 shadow-md"
                    }`}
                    title="Collapse high-voltage grids and magnetic deflection lines"
                  >
                    <span>OFF</span>
                  </button>
                </div>
              </div>
            </div>

            {/* TRINITRON ANALOG MEDIA DECK */}
            {!isFullscreen && (
              <div className="w-full bg-zinc-900 border border-zinc-800 rounded-sm p-4.5 mt-4 shadow-xl font-mono text-xs flex flex-col space-y-3.5 transition-all">
                {/* Row 1: Deck Title */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-2 gap-2">
                  <div className="flex items-center gap-2 text-[11.5px] font-bold text-sky-450 uppercase tracking-widest">
                    <Tv className="w-4 h-4 text-sky-400 animate-pulse" />
                    <span>■ ANALOG VCR MEDIA CONTROLLER</span>
                  </div>

                  {/* PANIC IMAGE STABILIZER BUTTON */}
                  <div className="flex items-center font-mono text-[11px]">
                    {!panicConfirm ? (
                      <button
                        onClick={() => setPanicConfirm(true)}
                        className="px-2.5 py-1 bg-red-950/70 hover:bg-red-900 border border-red-800/80 hover:border-red-500 text-red-500 hover:text-red-100 rounded-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer uppercase shadow-lg text-[10px]"
                        title="Instantly stop image wobbling and rolling/drifting anomalies"
                      >
                        <ShieldAlert className="w-3 h-3 text-red-400 animate-pulse" />
                        <span>🚨 PANIC STABILIZE</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 bg-red-950/95 border border-red-800 p-1 px-2 rounded-sm text-[10px]">
                        <span className="text-red-300 font-bold">Reset Wobble & V-Sync?</span>
                        <button
                          onClick={handleStabilizeImage}
                          className="px-2 py-0.5 bg-red-650 hover:bg-red-500 text-white font-extrabold rounded-sm cursor-pointer uppercase transition-all text-[9px]"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setPanicConfirm(false)}
                          className="px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-sm cursor-pointer uppercase transition-all text-[9px]"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Row 2: Deck mechanical status or progress bar */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
                  {/* Play & Stop Buttons */}
                  <div className="md:col-span-4 flex items-center gap-2 my-1">
                    <button
                      onClick={handleTogglePlay}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold rounded-sm transition-all cursor-pointer shadow-md ${
                        vidPlayState 
                          ? "bg-amber-500 text-zinc-950 hover:bg-amber-400 font-extrabold shadow-[0_0_12px_rgba(245,158,11,0.4)]" 
                          : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-white"
                      }`}
                      title={vidPlayState ? "Pause playback" : "Start playback"}
                    >
                      {vidPlayState ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                      <span>{vidPlayState ? "PAUSE" : "PLAY VCR"}</span>
                    </button>
                    <button
                      onClick={handleStopVideo}
                      className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-rose-950/40 hover:text-rose-400 border border-zinc-750 px-3 py-2 text-xs text-zinc-300 font-bold rounded-sm transition-all cursor-pointer"
                      title="Reset video to begin"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>STOP</span>
                    </button>
                  </div>

                  {/* Volume Slider Section */}
                  <div className="md:col-span-4 flex items-center gap-2.5 bg-zinc-950/65 border border-zinc-850 p-2 rounded-sm">
                    <button 
                      onClick={() => handleVolumeChange(vidVolume > 0 ? 0 : 0.8)}
                      className="text-zinc-400 hover:text-sky-400 cursor-pointer transition-colors shrink-0"
                    >
                      {vidVolume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                    <div className="flex-1 flex flex-col">
                      <div className="flex items-center justify-between text-[9px] font-bold text-zinc-500 mb-1 leading-none">
                        <span>DECK VOL</span>
                        <span className="text-sky-400">{Math.round(vidVolume * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={vidVolume}
                        onChange={(e) => handleVolumeChange(Number(e.target.value))}
                        className="w-full h-1 bg-zinc-900 accent-sky-400 rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Progressive track timeline scrubber or GIPHY paste form */}
                  <div className="md:col-span-4 flex items-center gap-2 bg-zinc-950/65 border border-zinc-850 p-2 rounded-sm">
                    <div className="flex-1 flex flex-col">
                      <div className="flex items-center justify-between text-[9px] font-bold text-zinc-500 mb-1 leading-none">
                        <span>VCR PLAYHEAD</span>
                        <span className="text-amber-400">{parseSeconds(vidCurrentTime)} / {parseSeconds(vidDuration)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={vidDuration || 1}
                        step="0.1"
                        value={vidCurrentTime}
                        onChange={(e) => handleSeekVideo(Number(e.target.value))}
                        className="w-full h-1 bg-zinc-900 accent-amber-500 rounded cursor-pointer"
                        disabled={!vidDuration}
                      />
                    </div>
                  </div>
                </div>

                {/* Drag & drop anywhere in player to load */}
                <div className="pt-2 border-t border-zinc-800 flex items-center justify-center p-2">
                  <p className="text-[10px] text-zinc-500 font-mono italic">
                    (Drag & drop any media files or web links directly onto the player to load)
                  </p>
                </div>
              </div>
            )}

            {/* Camera Access Error Alert */}
            {cameraError && (
              <div className="w-full mt-4 bg-rose-950/40 border border-rose-800 p-3 rounded-sm flex items-start gap-3 text-rose-200 animate-in fade-in slide-in-from-top-2 duration-300">
                <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-tight">Lens Access Error</p>
                  <p className="text-[10px] opacity-80">{cameraError}</p>
                </div>
                <button 
                  onClick={() => setCameraError(null)}
                  className="text-rose-400 hover:text-white"
                >
                  <Square className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* LIVE VHS CAMERA CONTROLLER */}
            {!isFullscreen && (
              <div className="w-full bg-zinc-900 border border-zinc-800 rounded-sm p-4.5 mt-4 shadow-xl font-mono text-xs flex flex-col space-y-3.5 transition-all">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <div className="flex items-center gap-2 text-[11.5px] font-bold text-sky-450 uppercase tracking-widest">
                    <Camera className="w-4 h-4 text-sky-400 animate-pulse" />
                    <span>■ LIVE TELE-CINE VHS CAMERA PROCESSOR</span>
                  </div>
                  {isCameraActive && (
                    <span className="text-[10px] text-emerald-450 font-bold bg-emerald-950/20 px-2 py-0.5 rounded-sm border border-emerald-900 animate-pulse">
                      ● CAMERA ACTIVE
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Toggle camera feed as media source */}
                  <button
                    onClick={handleToggleCamera}
                    className={`flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-bold rounded-sm transition-all cursor-pointer shadow-md ${
                      isCameraActive && settings.sourceType === "camera"
                        ? "bg-rose-950 text-rose-400 border border-rose-900 hover:bg-rose-900 hover:text-white" 
                        : "bg-emerald-600 text-zinc-950 hover:bg-emerald-500 font-extrabold shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    <span>{(isCameraActive && settings.sourceType === "camera") ? "DISCONNECT OPTICS" : "CHOOSE / ACTIVATE CAMERA"}</span>
                  </button>

                  {/* Cycle/Switch lenses */}
                  <button
                    onClick={handleCycleCamera}
                    disabled={!isCameraActive}
                    className={`flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-bold rounded-sm transition-all border ${
                      isCameraActive 
                        ? "bg-zinc-800 border-zinc-700 hover:bg-zinc-750 text-sky-400 hover:text-sky-300 cursor-pointer" 
                        : "bg-zinc-950/45 border-zinc-900 text-zinc-650 cursor-not-allowed"
                    }`}
                    title="Cycle through all camera lenses on this device (Selfie vs Back camera)"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>SWITCH / CYCLE CAMERA LENS</span>
                  </button>
                </div>

                {isCameraActive && (
                  <div className="bg-zinc-950/65 border border-zinc-850 p-2.5 rounded-sm flex flex-col space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400">
                      <span>ACTIVE LENS HARDWARE:</span>
                      <span className="text-sky-400">
                        {videoDevices.find(d => d.deviceId === activeCameraDeviceId)?.label || "Default Selfie Lens"}
                      </span>
                    </div>
                    {videoDevices.length > 1 ? (
                      <p className="text-[9px] text-zinc-500">
                        We detected {videoDevices.length} available camera lenses. Tap "SWITCH / CYCLE CAMERA LENS" above to switch between Front (Selfie) and Rear-facing lenses!
                      </p>
                    ) : (
                      <p className="text-[9px] text-zinc-500">
                        Switched active stream hardware dynamically. Multiple hardware devices available for seamless cycle swap tracking.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

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

            {/* HUD Viewport Controls Bar under monitor */}
            <div className="mt-4 flex flex-wrap items-center justify-center w-full gap-4 px-2">
              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-1.5 rounded-sm">
                {isRecording ? (
                  <button
                    onClick={stopRecordingVideo}
                    className="flex items-center gap-2 bg-rose-900/80 hover:bg-rose-800 px-3 py-1.5 text-xs font-mono font-bold text-rose-100 rounded-sm transition-all cursor-pointer shadow-md"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>STOP ({parseSeconds(recDuration)})</span>
                  </button>
                ) : (
                  <button
                    onClick={startRecordingVideo}
                    className="flex items-center gap-2 bg-emerald-900 hover:bg-emerald-800 px-3 py-1.5 text-xs font-mono text-emerald-100 rounded-sm transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>RECORD {settings.exportFormat?.toUpperCase() || "VIDEO"}</span>
                  </button>
                )}

                {/* Export format switcher */}
                <div className="flex bg-zinc-950 border border-zinc-800 rounded-sm overflow-hidden h-[30px] my-auto">
                  <button 
                    onClick={() => handleSettingsChange({ exportFormat: "webm" })}
                    className={`px-2 text-[9px] font-mono font-bold border-r border-zinc-800 transition-all cursor-pointer ${settings.exportFormat === "webm" ? "bg-sky-900/40 text-sky-300" : "text-zinc-600 hover:text-zinc-400"}`}
                  >
                    WEBM
                  </button>
                  <button 
                    onClick={() => handleSettingsChange({ exportFormat: "mp4" })}
                    className={`px-2 text-[9px] font-mono font-bold transition-all cursor-pointer ${settings.exportFormat === "mp4" ? "bg-sky-900/40 text-sky-300" : "text-zinc-600 hover:text-zinc-400"}`}
                  >
                    MP4
                  </button>
                </div>

                <button
                  onClick={captureGifSequence}
                  disabled={gifProgress >= 0}
                  className="flex items-center gap-2 hover:bg-zinc-800/80 text-sky-400 px-3 py-1.5 text-xs font-mono rounded-sm transition-all cursor-pointer disabled:opacity-40"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>EXPORT VHS-GIF</span>
                </button>
              </div>

              <div className="flex items-center gap-2 font-mono">
                <span className="text-[10px] text-zinc-500 mr-2">
                  FRAMES: {renderedFrames}
                </span>

                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 bg-zinc-900 border border-zinc-800 rounded-sm text-zinc-400 hover:text-zinc-100 font-bold hover:bg-zinc-800 flex items-center justify-center cursor-pointer transition-all"
                  title="Toggle immersive display screen focus"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4 text-sky-450" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Instruction if fullscreen active */}
            {isFullscreen && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-950/90 border border-zinc-800 px-4 py-2 rounded-full shadow-2xl z-[100] text-[10px] font-mono text-zinc-400 flex items-center gap-2 pointer-events-none backdrop-blur-md">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>EXIT: ESC OR MINIMIZE</span>
              </div>
            )}
          </div>
        </div>

        {/* CONTROLS SLIDERS COLUMN */}
        <div className="w-full lg:w-[480px] xl:w-[540px] shrink-0 p-5 bg-zinc-950 border-t lg:border-t-0 flex flex-col h-full min-h-0 [scrollbar-width:thin] [scrollbar-color:theme(colors.zinc.800)_theme(colors.zinc.950)]">
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
      />
    </div>
  );
}
