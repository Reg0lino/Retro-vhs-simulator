<div align="center">
  <img width="1200" height="475" alt="VCR-96 Banner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />

  # 📺 VCR-96: Retro VHS Simulator & CRT Studio
  ### 🌐 [EXPLORE LIVE DEPLOYMENT](https://retro-vhs-simulator-a9b35.web.app)
  
  [![Firebase](https://img.shields.io/badge/Hosted_on-Firebase-ffca28?style=flat-square&logo=firebase)](https://retro-vhs-simulator-a9b35.web.app)
  [![React](https://img.shields.io/badge/Built_with-React-61dafb?style=flat-square&logo=react)](https://reactjs.org/)
  [![Vite](https://img.shields.io/badge/Powered_by-Vite-646cff?style=flat-square&logo=vite)](https://vitejs.dev/)

  ---
  
  **Step into the grain.** A professional-grade analog signal distortion processor and CRT overlay studio designed to recreate the nostalgic imperfections of 90s magnetic tape media.
</div>

## 📼 What is VCR-96?

VCR-96 is a high-fidelity simulation engine that transforms modern digital video into a vintage analog experience. Unlike simple CSS filters, VCR-96 utilizes the **HTML5 Canvas API** for real-time, pixel-level manipulation, allowing for authentic recreations of physical hardware artifacts.

### 🕹️ Core Capabilities
*   **Analog Signal Matrix:** Real-time emulation of magnetic tracking errors, head-switching noise, and horizontal/vertical sync jitter.
*   **CRT Aesthetics:** Adjustable phosphor grills (Aperture, Slot, Shadow Mask), authentic scanline density, and physical screen curvature.
*   **Chrominance Processing:** Advanced sub-pixel R/G/B offsets, NTSC color phase cycling, and high-luma bleeding.
*   **OSD & Overlays:** Vintage On-Screen Display with 1996-accurate date randomizers and custom GIF/PNG multi-exposure blending.
*   **Pro Export Suite:** Upscale your simulations and export directly to high-quality **WebM/MP4** or animated **GIFs**.
*   **HLS Streaming:** Feed live M3U8 streams through the analog signal path for a "Late Night TV" broadcast vibe.

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
   `npm run build`
2. Deploy to Firebase:
   `firebase deploy`

---
<div align="center">
  <sub>Built for the nostalgia of magnetic tape and flickering cathode rays.</sub>
</div>
