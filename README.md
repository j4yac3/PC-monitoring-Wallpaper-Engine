# APEX: Universal PC Hardware Monitor

A minimalist, high-performance cyberpunk cockpit hardware monitor for **Wallpaper Engine**. Designed for ultra-low CPU utilization (~1%), seamless multi-monitor and ultrawide support, and out-of-the-box hardware detection.

---

## ⚡ Features

### 🖥️ 1. Intelligent Hardware Detection (Plug & Play)
- **Automatic Recognition:** Detects GPU model, logical CPU cores/threads, RAM capacity, and display resolution immediately via client-side WebGL and system APIs.
- **No Mandatory Setup:** Runs out of the box on any PC with zero configuration required.
- **Optional Windows Deep Profiler:** Read exact motherboard model, 64-bit GPU VRAM size, and network interface speed via the bundled WMI profiler.

### 📊 2. Real-Time Telemetry & Core Matrix
- **1:1 Task Manager Sync:** Includes an ultra-lightweight Windows performance counter daemon for live CPU utilization, logical core load matrix (up to 16 threads), and network throughput (Mbps download/upload).
- **Hysteresis State Machine:** Smooth transitions between demo mode and live telemetry without UI freezing or jitter.

### 🎵 3. Responsive 32-Channel Audio Spectrum
- **Dynamic Equalizer:** 32 frequency bands spanning 20 Hz to 16 kHz with floating peak-hold needles and live dB readouts.
- **Audio-Reactive:** Powers down to a flat baseline when no system audio is playing.

### 🎮 3D PC Wireframe Hologram
- Lightweight mathematical 3D wireframe render of a custom desktop chassis with interactive gyro rings and animated cooling fans.
- Zero external 3D libraries or heavy assets required; rendered purely on HTML5 2D Canvas.

### 🎨 5. Full Visual Customization
- **Stealth Monochrome Mode:** Clean Black & White cyberpunk aesthetic.
- **Granular Color Control:** Customize primary accent, secondary curves, RAM meter, wireframe hologram, and background colors individually via the Wallpaper Engine properties menu.
- **Layout Presets:** Centered Floating (recommended; leaves desktop icons completely unobstructed), Compact Centered, and Fullscreen.

---

## 📁 Project Structure

```
├── index.html               # Main HTML entrypoint & setup guide modal
├── main.js                  # Canvas 2D engine, 3D projection, audio listener & render loop
├── style.css                # HUD container & modal interface styles
├── project.json             # Wallpaper Engine properties & schema configuration
├── hardware.js              # Hardware profile definitions
├── telemetry.js             # Live telemetry data bridge
├── telemetry.json           # Live performance data exchange payload
├── detect-hardware.ps1      # Optional Windows hardware profiler (WMI / Registry)
├── update-hardware.bat      # One-click launcher for detect-hardware.ps1
├── live-telemetry.ps1       # Real-time Task Manager telemetry daemon
├── start-live-telemetry.bat # Launcher for live telemetry service
├── start-telemetry.vbs      # Silent background process wrapper
├── tux.svg / tux.png        # Vector & bitmap Linux mascot icons
└── preview.png / .jpg       # Wallpaper preview images
```

---

## 🚀 Getting Started

### Installation in Wallpaper Engine
1. Clone or download this repository.
2. Copy the project folder into your Wallpaper Engine projects directory:
   ```
   <SteamLibrary>/steamapps/common/wallpaper_engine/projects/myprojects/apex_pc_monitor
   ```
3. Open Wallpaper Engine and select **APEX: Universal PC Hardware Monitor**.

### Optional: Deep Windows Profiling & Live Telemetry
While basic auto-detection works automatically, you can enable exact Windows WMI data:

1. In Wallpaper Engine, right-click the wallpaper and select **"Open in Explorer"**.
2. Run **`update-hardware.bat`** once to detect exact motherboard model and 64-bit VRAM.
3. Run **`start-live-telemetry.bat`** if you want real-time Task Manager CPU and network data.

---

## 🔒 Security & Privacy

- **100% Offline & Local:** No external network requests, no telemetry collection, no third-party analytics.
- **Sandbox Compliant:** Web assets run in a self-contained local environment.
- **Open Source:** All batch and PowerShell scripts are fully transparent and auditable.

---

## 📄 License

MIT License. Free to use, modify, and distribute.
