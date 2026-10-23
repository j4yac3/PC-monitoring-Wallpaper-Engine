# APEX: Linux Ubuntu Hardware Monitor

A minimalist, sleek Linux / Ubuntu hardware cockpit for **Wallpaper Engine**, optimized for the Steam Workshop.

---

## 🐧 New Features & Improvements

### 1. Centered Floating Cockpit (Desktop Icons Remain 100% Unobstructed!)
- The monitoring cockpit is now **perfectly centered on screen** (inspired by genuine Linux desktop design).
- No more sticking to display edges: your desktop icons on the left and right stay fully visible and accessible!
- Select between **`Centered Floating (Recommended)`**, **`Compact Centered`**, and **`Fullscreen`** in the Wallpaper Engine properties.

### 2. Clean Audio Spectrum (No Distracting Spikes)
- The erratic frametime spike graph has been removed. The lower-right box is now dedicated entirely to the **pure audio equalizer**:
- 32 frequency channels ranging from bass (30 Hz) to treble (16 kHz), peak-hold needles, and live dB readouts.
- Only reacts when sound or voice is actively playing. Remains completely flat during silence.

### 3. 100% Crisp Formatting (No Overlapping Text)
- The bottom console (`// sysinfo` and `// dmesg`) is cleanly split into two balanced halves with a vertical divider.
- Long strings are dynamically truncated with an ellipsis (`…`) so text **never overlaps**, even on 1440×900, 1080p, or ultrawide aspect ratios.
- The footer text is also dynamically bounded to ensure it never collides with the right-hand `144Hz` display.

### 4. Single-Color Monochrome Mode ("All in One Accent")
- A toggle is available in the Wallpaper Engine properties:  
  **`Single-Color Monochrome Mode (All in One Accent)`**
- When enabled, the **entire wallpaper shines uniformly in your accent color of choice** (e.g. classic Ubuntu Orange, Cyber Cyan, Neon Red, Matrix Green, or Stealth White).
- All borders, graphs, fans, typography, and the 3D PC hologram adapt harmoniously!

### 5. Granular Color Control (Customize Each Component)
- When monochrome mode is disabled, each element can be individually styled:
  - **CPU & Header Color** (`schemecolor`)
  - **GPU & Accent Color** (`hud_secondary_color`)
  - **RAM & Memory Color** (`hud_ram_color`)
  - **3D PC Hologram Color** (`hud_pc_color`)
  - **Background Color** (`hud_bg_color`)

### 6. Code-Rendered Vector Tux (Zero Asset Overhead)
- The `APEX // UBUNTU LINUX MONITOR` text header has been removed — the top-left features **exclusively the Tux penguin**.
- The Tux logo is **rendered natively in JavaScript as a pure vector** (`drawTux`): 0 external image requests, 0 ms load time, zero start-up flickering, and 100% self-contained for the Steam Workshop!

---

## 🖥 Hardware Detection Specs
- **CPU:** `AMD Ryzen 9 9950X3D`
- **GPU:** `NVIDIA GeForce RTX 5090` (32 GB VRAM)
- **Mainboard:** `ASUS ROG Crosshair X870E Extreme`
- **RAM:** `128 GB DDR5`
- **OS:** `Windows 11 Pro 64-Bit`

---

## 🚀 Publishing to Wallpaper Engine
The wallpaper is 100% ready for publishing:
1. Open Wallpaper Engine.
2. Select this project in the Wallpaper Editor.
3. Click on **"Publish to Steam Workshop"**.

---

## Troubleshooting Hardware Detection
Hardware detection is powered by the PowerShell script `detect-hardware.ps1`.
Double-click `detect-hardware.bat` (or `update-hardware.bat`) to regenerate `hardware.js` in this folder. The console window remains open so any error messages remain visible. Real-time telemetry is launched via `start-telemetry.vbs` and runs `live-telemetry.ps1` in the background.
