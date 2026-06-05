<div align="center">
  <img width="1200" height="475" alt="Retro Video Engine Banner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />

  # 📺 Retro Video Engine: CRT Studio & Artifact Simulation
  ### 🌐 [EXPLORE LIVE DEPLOYMENT](https://retro-vhs-simulator-a9b35.web.app)
  
  [![Firebase](https://img.shields.io/badge/Hosted_on-Firebase-ffca28?style=flat-square&logo=firebase)](https://retro-vhs-simulator-a9b35.web.app)
  [![React](https://img.shields.io/badge/Built_with-React-61dafb?style=flat-square&logo=react)](https://reactjs.org/)
  [![Vite](https://img.shields.io/badge/Powered_by-Vite-646cff?style=flat-square&logo=vite)](https://vitejs.dev/)

  ---
  
  **Step into the grain.** A professional-grade analog signal distortion processor, CRT overlay studio, and authentic cinema film simulation engine designed to recreate vintage electronic and optical media artifacts directly in the browser.
</div>

## 📼 What is Retro Video Engine?

Retro Video Engine is a high-fidelity real-time simulation processor that transforms modern digital video into vintage analog frames. Built upon the **HTML5 Canvas API**, the engine goes beyond superficial CSS overlays to compute pixel-level spatial transforms, chromatic dispersions, and dynamic cathode rays.

### 🕹️ Core Capabilities
*   **Analog Signal Matrix:** Live emulation of magnetic tracking skew, head-switching noise, and horizontal/vertical sync drift.
*   **CRT Aesthetics:** Real-time phosphor rendering (Aperture, Slot, and Shadow Mask structures), custom scanline density, and physical screen curvature.
*   **Chrominance Processing:** Advanced sub-pixel R/G/B dispersion offsets, NTSC color phase cycling, and high-luma blooming.
*   **Optical Film FX:** Dynamic emulsion grain, random dust specks, authentic long vertical hair scratches, light leaks, and gate weave mechanical offsets.
*   **Cinema Film Countdown:** A roll-stabilized classic 8-second countdown leader featuring physical gates offset jitter, mechanical spring-back, and film-melt transitions.
*   **Decoupled OSD Engine:** An independent On-Screen Display preset matrix. Automatically responds to user actions, displaying active functions like `● PLAY` or channel selectors.
*   **Interactive Controls & Glitch:** Real-time manual glitch processor triggering micro-displacements, instantly hiding OSD text for an authentic analog signal failure effect.
*   **Pro Export Suite:** Render, upscale, and export custom processed videos into high-quality **WebM/MP4** or animated loop **GIFs**.
*   **HLS Streaming:** Feed live M3U8 streams directly through the analog path for a continuous late-night broadcast look.

---

## 🛠️ Integrated Changelog

### **[v1.2.0] - Optical Cinema & Signal Hardening Update (Current)**
*   **Added**: Integrated a classic roll-stabilized 8-second Film Countdown leader.
*   **Added**: Optical assets rendering including real-time Gate Weave, film emulsion dust, light leaks, hair scratches, and gate jitter offsets.
*   **Added**: Coupling of film countdown mechanical jitters with physical offsets to simulate authentic optical gate movement.
*   **Added**: Instantaneous On-Screen Display (OSD) dismissal during aggressive manually triggered structural `GLITCH` signals, resuming immediately upon release.
*   **Fixed**: Isolated manual film adjustments so they apply only selected effects, removing baked-in static artifacts during countdown runs.
*   **Changed**: Complete rebranding of the system suite and tab configurations from `VCR-96 Tape Deck Sim` to `Retro Video Engine`.
*   **Changed**: Mounted browser favicon and integration pathways to support the `tv.ico` format.

### **[v1.1.0] - Recording & Format Expansion**
*   **Added**: WebM, MP4, and animated GIF format render pipeline.
*   **Added**: Dynamic CSS-filtered hardware bezel templates.

---

## 🚀 Quick Start

**Prerequisites:** Node.js (v18+)

1.  **Clone & Install:**
    ```bash
    npm install
    ```
2.  **Local Development:**
    ```bash
    npm run dev
    ```

## Deployment

To deploy to Firebase Hosting:

1. Build the production assets:
   ```bash
   npm run build
   ```
2. Deploy to Firebase:
   ```bash
   firebase deploy
   ```

---
<div align="center">
  <sub>Built for the nostalgia of magnetic tape, optical gate weave, and flickering cathode rays.</sub>
</div>
