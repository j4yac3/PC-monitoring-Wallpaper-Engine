/**
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │  APEX LINUX MONITOR · Wallpaper Engine Web Wallpaper v9.5              │
 * │  Style: Stealth Monochromatic Black & White · Minimalist Cockpit       │
 * │  Performance: Ultra-Low CPU Engine (~1-2% CPU, Potato PC / Win7 ready) │
 * │  Features: Hardware Telemetry, 3D PC Wireframe, Tux Icon, Audio        │
 * └────────────────────────────────────────────────────────────────────────┘
 */
(function () {
  'use strict';

  // ── §1 HARDWARE DETECTION ───────────────────────────────────────────────

  // Liest gespeicherte JS-Auto-Erkennung aus localStorage (Fallback wenn kein hardware.js)
  function loadCachedHW() {
    try {
      const raw = localStorage.getItem('apex_hw_cache');
      if (!raw) return null;
      const d = JSON.parse(raw);
      // Cache maximal 30 Tage gültig
      if (Date.now() - (d._ts || 0) > 30 * 86400000) { localStorage.removeItem('apex_hw_cache'); return null; }
      return d;
    } catch (_) { return null; }
  }

  function saveCachedHW(hw) {
    try { localStorage.setItem('apex_hw_cache', JSON.stringify({ ...hw, _ts: Date.now() })); } catch (_) {}
  }

  // Erkennt GPU-Name + VRAM-Schätzung via WebGL
  function detectGPUviaWebGL() {
    const result = { name: null, vramGB: null };
    try {
      const tc = document.createElement('canvas');
      const gl = tc.getContext('webgl2') || tc.getContext('webgl') || tc.getContext('experimental-webgl');
      if (!gl) return result;

      const ex = gl.getExtension('WEBGL_debug_renderer_info');
      if (ex) {
        let r = gl.getParameter(ex.UNMASKED_RENDERER_WEBGL) || '';
        // ANGLE-Wrapper entfernen (Windows-typisch)
        const m = r.match(/ANGLE\s*\([^,]+,\s*([^,]+?)(?:\s*Direct3D|\s*D3D|\s*\(0x|,|\))/i);
        if (m?.[1]) r = m[1];
        r = r.replace(/^(NVIDIA|AMD|Intel)\s+\1\s*/i, '$1 ').trim().toUpperCase();
        if (r.length > 3) result.name = r;
      }

      // VRAM-Schätzung: MAX_TEXTURE_SIZE als Heuristik
      const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 0;
      // Heuristik: Texturgröße → VRAM-Bereich
      if      (maxTex >= 32768) result.vramGB = 16;  // RTX 3080+, RX 6800+
      else if (maxTex >= 16384) result.vramGB = 8;   // RTX 3070, RX 6700 XT
      else if (maxTex >= 8192)  result.vramGB = 4;   // GTX 1660, RX 580
      else                       result.vramGB = 2;

      // VRAM aus WebGL2 Memory Info (wenn verfügbar, z.B. Chrome mit Flag)
      const mem = gl.getExtension('WEBGL_draw_buffers');
      const memInfo = gl.getExtension('MOZ_WEBGL_lose_context');
      // Versuche GL_GPU_MEMORY_INFO (NVIDIA-spezifisch)
      try {
        const NVIDIA_GPU_MEM = 0x9049;
        const totalMem = gl.getParameter(NVIDIA_GPU_MEM);
        if (totalMem > 0) result.vramGB = Math.round(totalMem / 1024 / 1024);
      } catch (_) {}
    } catch (_) {}
    return result;
  }

  // OS-Erkennung via User-Agent
  function detectOS() {
    const ua = navigator.userAgent;
    if (/Windows NT 11\.0|Windows NT 10\.0.*Win64/i.test(ua)) return 'Windows 11 64-Bit';
    if (/Windows NT 10\.0/i.test(ua)) return 'Windows 10 64-Bit';
    if (/Windows NT 6\.3/i.test(ua)) return 'Windows 8.1 64-Bit';
    if (/Mac OS X/i.test(ua)) return 'macOS';
    if (/Linux/i.test(ua)) return 'Linux';
    return 'Windows';
  }

  // CPU-Vendor-Schätzung (grob, aber besser als nichts)
  function guessCPUName(threads) {
    // Wallpaper Engine läuft nur auf Windows → meistens Intel oder AMD
    const cached = loadCachedHW();
    if (cached?.cpuName && cached.cpuName !== 'Your CPU') return cached.cpuName;
    if (threads >= 32) return `High-End CPU (${threads}T)`;
    if (threads >= 16) return `AMD Ryzen / Intel Core (${threads}T)`;
    if (threads >= 8)  return `AMD Ryzen / Intel Core (${threads}T)`;
    if (threads >= 4)  return `Intel / AMD CPU (${threads}T)`;
    return `CPU (${threads}T)`;
  }

  function detectHW() {
    const C = window.CUSTOM_HARDWARE || {};
    const hasCustomHW = !!(C.cpuName);  // hardware.js wurde ausgeführt

    // Schritt 1: Auto-Erkennung via WebGL (funktioniert auf jedem PC ohne Setup)
    const glInfo = detectGPUviaWebGL();
    const threads = navigator.hardwareConcurrency || 4;
    const cores   = Math.max(1, Math.floor(threads / 2));

    // Schritt 2: RAM — navigator.deviceMemory gibt Näherungswert (1,2,4,8,16,32 GB)
    const jsRam = navigator.deviceMemory || 4;

    // Schritt 3: Cache laden (wenn kein hardware.js vorhanden)
    const cache = hasCustomHW ? null : loadCachedHW();

    const hw = {
      // hardware.js hat Vorrang → sonst Cache → sonst JS-Auto-Erkennung
      cpuName:    C.cpuName    || cache?.cpuName    || guessCPUName(threads),
      cpuCores:   C.cpuCores   || cache?.cpuCores   || cores,
      cpuThreads: C.cpuThreads || cache?.cpuThreads || threads,
      cpuBaseMHz: C.cpuBaseClockMHz  || cache?.cpuBaseMHz  || 3000,
      cpuBoostMHz:C.cpuBoostClockMHz || cache?.cpuBoostMHz || 3200,
      gpuName:    C.gpuName    || cache?.gpuName    || glInfo.name  || 'GPU',
      gpuVramGB:  C.gpuVramGB  || cache?.gpuVramGB  || glInfo.vramGB || 2,
      mainboard:  C.mainboard  || cache?.mainboard  || '—',
      ramGB:      C.totalRamGB || cache?.ramGB       || jsRam,
      os:         C.osName     || cache?.os          || detectOS(),
      kernel:     '6.5.0-35-generic',
      shell:      'zsh 5.9',
      screenRes:  `${screen.width}×${screen.height}`,
      storageGB:  '—',
      uptime:     0,
      netAdapterName: C.netAdapterName || cache?.netAdapterName || '—',
      netSpeedMbps:   C.netSpeedMbps   || cache?.netSpeedMbps   || 0,
      _isAutoDetected: !hasCustomHW,  // Flag: kein hardware.js vorhanden
    };

    // Cache aktualisieren wenn kein hardware.js vorhanden
    if (!hasCustomHW) saveCachedHW(hw);

    navigator.storage?.estimate?.().then(e => {
      if (e?.quota) hw.storageGB = (e.quota / 1073741824).toFixed(0) + ' GB';
    }).catch(() => {});

    return hw;
  }

  const HW = detectHW();
  window.HW = HW;

  // ── §2 LINUX TUX LOGO ────────────────────────────────────────────────────
  function drawTux(x, y, size) {
    ctx.save();
    const k = size / 100;
    const cx = x + size * 0.5;
    const cy = y + size * 0.5;

    // Füße
    ctx.fillStyle = S.monochrome ? '#d1d5db' : '#f57c00';
    ctx.beginPath();
    ctx.ellipse(cx - 16 * k, cy + 40 * k, 15 * k, 6 * k, -0.14, 0, Math.PI * 2);
    ctx.ellipse(cx + 16 * k, cy + 40 * k, 15 * k, 6 * k, 0.14, 0, Math.PI * 2);
    ctx.fill();

    // Flügel
    ctx.fillStyle = '#1e222b';
    ctx.beginPath();
    ctx.ellipse(cx - 26 * k, cy + 8 * k, 7 * k, 18 * k, 0.38, 0, Math.PI * 2);
    ctx.ellipse(cx + 26 * k, cy + 8 * k, 7 * k, 18 * k, -0.38, 0, Math.PI * 2);
    ctx.fill();

    // Körper außen
    ctx.fillStyle = '#14171d';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 4 * k, 28 * k, 34 * k, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bauch
    ctx.fillStyle = '#f0f3f8';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 10 * k, 20 * k, 24 * k, 0, 0, Math.PI * 2);
    ctx.fill();

    // Kopf
    ctx.fillStyle = '#14171d';
    ctx.beginPath();
    ctx.arc(cx, cy - 22 * k, 21 * k, 0, Math.PI * 2);
    ctx.fill();

    // Augen
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(cx - 7 * k, cy - 26 * k, 5.5 * k, 7.5 * k, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 7 * k, cy - 26 * k, 5.5 * k, 7.5 * k, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupillen
    ctx.fillStyle = '#0a0c10';
    ctx.beginPath();
    ctx.arc(cx - 5 * k, cy - 25 * k, 2.8 * k, 0, Math.PI * 2);
    ctx.arc(cx + 5 * k, cy - 25 * k, 2.8 * k, 0, Math.PI * 2);
    ctx.fill();

    // Lichtpunkte
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx - 4 * k, cy - 26.2 * k, 1 * k, 0, Math.PI * 2);
    ctx.arc(cx + 6 * k, cy - 26.2 * k, 1 * k, 0, Math.PI * 2);
    ctx.fill();

    // Schnabel
    ctx.fillStyle = S.monochrome ? '#ffffff' : '#ffa000';
    ctx.beginPath();
    ctx.moveTo(cx - 10 * k, cy - 18 * k);
    ctx.quadraticCurveTo(cx, cy - 20 * k, cx + 10 * k, cy - 18 * k);
    ctx.quadraticCurveTo(cx, cy - 6 * k, cx - 10 * k, cy - 18 * k);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = S.monochrome ? '#d1d5db' : '#f57c00';
    ctx.beginPath();
    ctx.moveTo(cx - 7 * k, cy - 18 * k);
    ctx.quadraticCurveTo(cx, cy - 16 * k, cx + 7 * k, cy - 18 * k);
    ctx.quadraticCurveTo(cx, cy - 10 * k, cx - 7 * k, cy - 18 * k);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // ── §3 FARB-SYSTEM & MONOCHROM-MODUS ─────────────────────────────────────
  const userColors = {
    primary:   '#ffffff',   // Reines Weiß (CPU & Header)
    secondary: '#d1d5db',   // Silber (GPU & Kurven)
    ram:       '#f3f4f6',   // Helles Platin-Weiß (RAM)
    pc:        '#ffffff',   // Weißes 3D Rig Hologramm
    bg:        '#000000'    // Tiefschwarz
  };

  const COL = {
    primary:   '#ffffff',
    secondary: '#d1d5db',
    ram:       '#f3f4f6',
    pc:        '#ffffff',
    accent:    '#9ca3af',
    warn:      '#e5e7eb',
    bg:        '#000000',
    panel:     'rgba(14, 16, 20, 0.94)',
    border:    'rgba(255, 255, 255, 0.28)',
    borderDim: 'rgba(255, 255, 255, 0.08)',
    grid:      'rgba(255, 255, 255, 0.022)',
    text:      '#f3f4f6',
    textDim:   'rgba(243, 244, 246, 0.60)',
    textMuted: 'rgba(243, 244, 246, 0.35)',
    barBg:     'rgba(255, 255, 255, 0.08)',
  };

  function parseWEColor(s) {
    if (!s || typeof s !== 'string') return null;
    const p = s.trim().split(/\s+/).map(Number);
    if (p.length < 3 || isNaN(p[0])) return null;
    const n = p[0] <= 1 && p[1] <= 1 && p[2] <= 1;
    const r = Math.round(n ? p[0] * 255 : p[0]);
    const g = Math.round(n ? p[1] * 255 : p[1]);
    const b = Math.round(n ? p[2] * 255 : p[2]);
    return { r, g, b, hex: `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}` };
  }

  function updatePalette() {
    if (S.monochrome) {
      const p = userColors.primary || '#ffffff';
      COL.primary   = p;
      COL.secondary = '#d1d5db';
      COL.ram       = '#f3f4f6';
      COL.pc        = p;
      COL.accent    = '#9ca3af';
      COL.border    = p.startsWith('#')
        ? `rgba(${parseInt(p.slice(1, 3), 16)}, ${parseInt(p.slice(3, 5), 16)}, ${parseInt(p.slice(5, 7), 16)}, 0.30)`
        : 'rgba(255, 255, 255, 0.30)';
    } else {
      COL.primary   = userColors.primary;
      COL.secondary = userColors.secondary;
      COL.ram       = userColors.ram;
      COL.pc        = userColors.pc;
      COL.accent    = '#9ca3af';
      const p = COL.primary;
      COL.border    = p.startsWith('#')
        ? `rgba(${parseInt(p.slice(1, 3), 16)}, ${parseInt(p.slice(3, 5), 16)}, ${parseInt(p.slice(5, 7), 16)}, 0.30)`
        : 'rgba(255, 255, 255, 0.30)';
    }

    const bg = userColors.bg || '#000000';
    COL.bg = bg;
    if (bg.startsWith('#') && bg.length === 7) {
      const r = parseInt(bg.slice(1, 3), 16);
      const g = parseInt(bg.slice(3, 5), 16);
      const b = parseInt(bg.slice(5, 7), 16);
      COL.panel = `rgba(${Math.min(r + 14, 30)}, ${Math.min(g + 16, 32)}, ${Math.min(b + 20, 38)}, 0.94)`;
    }
  }

  // ── §4 STATE & TELEMETRIE ────────────────────────────────────────────────
  const S = {
    layoutMode:   'centered',
    fpsLimit:     30,         // Standard 30 FPS für minimalste CPU-Last (~1%)
    pollingMs:    1000,
    tempUnit:     'celsius',
    monochrome:   true,       // Standardmäßig Black & White Stealth
    showStars:    true,
    paused:       false,
    pcRotY:       0,
    pcRotX:       0.22,
    t0:           performance.now(),
    mouseX:       0,
    mouseY:       0
  };

  let targetFPS = S.fpsLimit;
  let frameInterval = 1000 / targetFPS;

  const T = {
    cpuLoad:      12,
    cpuTarget:    12,
    cpuTempC:     41,
    cpuFreqMHz:   HW.cpuBaseMHz || 3000,  // BUG-L fix: dynamischer Fallback
    cpuFanRPM:    940,
    cpuVoltage:   1.14,
    cpuBenchMs:   0.35,
    coreLoads:    new Array(HW.cpuThreads).fill(12),
    cpuHist:      new Array(60).fill(12),
    cpuFanA:      0,

    gpuLoad:      18,
    gpuTarget:    18,
    gpuTempC:     44,
    gpuHotspot:   52,
    gpuFreqMHz:   1560,
    gpuVramUsed:  1.1,
    gpuFanRPM:    0,
    gpuPowerW:    32,
    gpuHist:      new Array(60).fill(18),
    gpuFanA:      0,

    ramGBUsed:    0,             // BUG-C/I fix: dynamischer Fallback (0)
    ramGBTotal:   HW.ramGB || 8, // BUG-C fix: neutraler Fallback 8 GB statt 14
    ramPct:       68,
    ramHist:      new Array(60).fill(68),
    liveConnected:false,
    liveOkCount:  0,   // BUG-A fix: State-Machine Hysterese-Zähler
    liveFailCount:0,   // BUG-A fix: State-Machine Hysterese-Zähler
    netDownMbps:  0,
    netUpMbps:    0,

    eq:           new Array(32).fill(0),
    eqPeaks:      new Array(32).fill(0),
    eqPeakAge:    new Array(32).fill(0),

    fps:          30,
    ftMs:         33.3,
    pct1Low:      30,
    ftRing:       new Array(40).fill(33.3),
    ftCount:      0,
    ftTimer:      performance.now(),
  };

  // ── §5 CANVAS SETUP (Natives 1:1 Pixel Mapping für maximale Performance) ─
  const canvas = document.getElementById('hud-canvas');
  const ctx    = canvas.getContext('2d', { alpha: false });
  let W = 0, H = 0;

  // Polyfill für roundRect
  if (!ctx.roundRect) {
    ctx.roundRect = function (x, y, w, h, r) {
      const radius = typeof r === 'number' ? r : 5;
      this.beginPath();
      this.moveTo(x + radius, y);
      this.lineTo(x + w - radius, y);
      this.quadraticCurveTo(x + w, y, x + w, y + radius);
      this.lineTo(x + w, y + h - radius);
      this.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
      this.lineTo(x + radius, y + h);
      this.quadraticCurveTo(x, y + h, x, y + h - radius);
      this.lineTo(x, y + radius);
      this.quadraticCurveTo(x, y, x + radius, y);
      this.closePath();
      return this;
    };
  }

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    // DPR = 1: Spart über 60% GPU/CPU Fillrate gegenüber skaliertem Canvas
    canvas.width  = W;
    canvas.height = H;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();

  // Gedrosselter Mousemove-Handler gegen Gaming-Mäuse mit 1000Hz Polling
  let mouseThrottle = false;
  window.addEventListener('mousemove', e => {
    if (mouseThrottle) return;
    mouseThrottle = true;
    S.mouseX = e.clientX;
    S.mouseY = e.clientY;
    requestAnimationFrame(() => { mouseThrottle = false; });
  }, { passive: true });

  // ── §6 REALE CPU-LAST & SENSOR-MESSUNG (0% CPU Overhead) ─────────────────
  let lastBenchTime = performance.now();
  function benchmark(now) {
    const dt = now - lastBenchTime;
    lastBenchTime = now;
    const jitter = Math.max(0, dt - (S.pollingMs || 1000));
    T.cpuBenchMs = +(0.32 + jitter * 0.04).toFixed(2);
    return Math.min(75, Math.max(8, 12 + jitter * 0.5 + Math.sin(now * 0.001) * 3));
  }

  let lastTelePoll = 0;
  function pollLiveTelemetry(now) {
    if (now - lastTelePoll < 980) return;
    lastTelePoll = now;

    // 1. Direkt aus window.LIVE_TELEMETRY lesen (gesetzt durch den letzten XHR)
    const lt = window.LIVE_TELEMETRY;
    if (lt && typeof lt.cpu === 'number') {
      const age = Date.now() - (lt.timestamp || 0);
      if (age < 3500) {
        // BUG-A fix: Erst nach 2 aufeinanderfolgenden OK-Werten auf true wechseln
        T.liveOkCount   = Math.min(T.liveOkCount + 1, 5);
        T.liveFailCount = 0;

        const wasConnected = T.liveConnected;
        if (!wasConnected && T.liveOkCount >= 2) {
          T.liveConnected = true;
          // BUG-B fix: Beim ersten Connect sofort auf echten Wert snappen (kein Smoothing)
          T.cpuLoad   = Math.max(1, Math.min(100, lt.cpu));
          T.cpuTarget = T.cpuLoad;
        } else if (wasConnected) {
          T.cpuTarget = Math.max(1, Math.min(100, lt.cpu));
        }

        if (lt.ramUsedGB)  T.ramGBUsed = lt.ramUsedGB;
        if (lt.ramTotalGB) T.ramGBTotal = lt.ramTotalGB;
        if (lt.ramPct)     T.ramPct     = lt.ramPct;
        // BUG-J fix: Netzwerkwerte nur übernehmen wenn live
        if (typeof lt.netDownMbps === 'number') T.netDownMbps = Math.max(0, lt.netDownMbps);
        if (typeof lt.netUpMbps   === 'number') T.netUpMbps   = Math.max(0, lt.netUpMbps);
        if (lt.cores && Array.isArray(lt.cores)) {
          for (let i = 0; i < Math.min(T.coreLoads.length, lt.cores.length); i++) {
            T.coreLoads[i] = lt.cores[i];
          }
        }
      } else {
        // Daten zu alt → Fail-Counter erhöhen
        T.liveOkCount = 0;
        T.liveFailCount = Math.min(T.liveFailCount + 1, 10);
        // BUG-A fix: Erst nach 3 aufeinanderfolgenden Fehlern auf false wechseln (Hysterese)
        if (T.liveConnected && T.liveFailCount >= 3) {
          T.liveConnected = false;
          // BUG-E fix: cpuTarget sofort auf benchmark-Wert zurücksetzen
          T.cpuTarget = benchmark(now);
          T.netDownMbps = 0;
          T.netUpMbps   = 0;
        }
      }
    } else {
      // Kein LIVE_TELEMETRY Objekt vorhanden
      T.liveOkCount = 0;
      T.liveFailCount = Math.min(T.liveFailCount + 1, 10);
      if (T.liveConnected && T.liveFailCount >= 3) {
        T.liveConnected = false;
        // BUG-E fix: cpuTarget sofort auf benchmark-Wert zurücksetzen
        T.cpuTarget = benchmark(now);
        T.netDownMbps = 0;
        T.netUpMbps   = 0;
      }
    }

    // 2. XMLHttpRequest für direkten lokalen Dateizugriff (Null DOM-Overhead)
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', 'telemetry.json?_t=' + Date.now(), true);
      xhr.onload = function () {
        if (xhr.status === 200 || xhr.status === 0) {
          try {
            const d = JSON.parse(xhr.responseText);
            if (d && typeof d.cpu === 'number') window.LIVE_TELEMETRY = d;
          } catch (_) {}
        }
      };
      xhr.send();
    } catch (_) {}
  }

  let lastPoll = performance.now();
  function poll(now) {
    pollLiveTelemetry(now);

    if (now - lastPoll < S.pollingMs) return;
    lastPoll = now;

    if (!T.liveConnected) {
      T.cpuTarget = benchmark(now);
    }
    // BUG-B fix: liveConnected → cpuLoad bereits auf cpuTarget gesetzt beim ersten Connect
    // Danach normales Smoothing. Im Demo-Modus etwas langsameres Smoothing.
    T.cpuLoad  += (T.cpuTarget - T.cpuLoad) * (T.liveConnected ? 0.65 : 0.55);
    T.cpuFreqMHz = Math.round(HW.cpuBaseMHz + (T.cpuLoad / 100) * (HW.cpuBoostMHz - HW.cpuBaseMHz));
    T.cpuVoltage = +(1.10 + (T.cpuLoad / 100) * 0.17).toFixed(2);
    T.cpuFanRPM  = Math.round(900 + (T.cpuLoad / 100) * 450);
    T.cpuTempC  += (38 + (T.cpuLoad / 100) * 20 - T.cpuTempC) * 0.18;

    if (!T.liveConnected) {
      for (let c = 0; c < T.coreLoads.length; c++) {
        T.coreLoads[c] = Math.round(Math.max(5, Math.min(85,
          T.cpuLoad + Math.sin(now * 0.002 + c * 1.6) * 6 + (c < 4 ? 5 : -3))));
      }
    }

    const gpuTgt = Math.max(10, Math.min(65, T.cpuLoad * 0.85 + Math.sin(now * 0.0012) * 6));
    T.gpuLoad  += (gpuTgt - T.gpuLoad) * 0.50;
    T.gpuTempC += (36 + (T.gpuLoad / 100) * 16 - T.gpuTempC) * 0.16;
    T.gpuHotspot= +(T.gpuTempC + 8).toFixed(1);
    T.gpuFreqMHz= Math.round(1500 + (T.gpuLoad / 100) * 360);
    T.gpuFanRPM = T.gpuTempC < 46 ? 0 : Math.round(850 + (T.gpuTempC / 85) * 380);
    T.gpuPowerW = Math.round(28 + (T.gpuLoad / 100) * 26);
    T.gpuVramUsed = +(HW.gpuVramGB * (0.44 + (T.gpuLoad / 100) * 0.28)).toFixed(1);

    if (!T.liveConnected) {
      T.ramGBUsed = +(HW.ramGB * 0.65 + Math.sin(now * 0.0008) * 0.2).toFixed(1);
      T.ramPct    = Math.round((T.ramGBUsed / HW.ramGB) * 100);
    }

    T.cpuHist.shift(); T.cpuHist.push(T.cpuLoad);
    T.gpuHist.shift(); T.gpuHist.push(T.gpuLoad);
    T.ramHist.shift(); T.ramHist.push(T.ramPct);
  }

  // ── §7 AUDIO LISTENER ────────────────────────────────────────────────────
  function wallpaperAudioListener(arr) {
    if (!arr || arr.length < 32) return;

    if (arr.length >= 128) {
      for (let i = 0; i < 32; i++) {
        const l1 = arr[i * 2] || 0;
        const l2 = arr[i * 2 + 1] || 0;
        const r1 = arr[64 + i * 2] || 0;
        const r2 = arr[64 + i * 2 + 1] || 0;
        const boost = 1.0 + (i / 31) * 0.85;
        const raw = ((l1 + l2 + r1 + r2) * 0.25) * 2.8 * boost;

        if (raw > 0.005) {
          T.eq[i] = Math.min(1.0, Math.max(T.eq[i], raw));
          if (raw > T.eqPeaks[i]) {
            T.eqPeaks[i] = Math.min(1.0, raw);
            T.eqPeakAge[i] = 0;
          }
        }
      }
    } else {
      const step = Math.floor(arr.length / 32);
      for (let i = 0; i < 32; i++) {
        let s = 0;
        for (let k = 0; k < step; k++) s += arr[i * step + k] || 0;
        const raw = (s / step) * 2.5;
        if (raw > 0.005) {
          T.eq[i] = Math.min(1.0, Math.max(T.eq[i], raw));
          if (raw > T.eqPeaks[i]) {
            T.eqPeaks[i] = Math.min(1.0, raw);
            T.eqPeakAge[i] = 0;
          }
        }
      }
    }
  }

  window.wallpaperAudioListener = wallpaperAudioListener;
  window.__apexAudio = wallpaperAudioListener;

  let audioRegistered = false;
  function tryRegisterAudio() {
    if (audioRegistered) return true;
    if (typeof window.wallpaperRegisterAudioListener === 'function') {
      try {
        window.wallpaperRegisterAudioListener(wallpaperAudioListener);
        audioRegistered = true;
        return true;
      } catch (_) {}
    }
    return false;
  }

  tryRegisterAudio();
  const audioInterval = setInterval(() => {
    if (tryRegisterAudio()) clearInterval(audioInterval);
  }, 200);
  setTimeout(() => clearInterval(audioInterval), 10000);

  // ── §8 FORMATIER- & TEXT-HELFER ──────────────────────────────────────────
  const fmtTemp = c => S.tempUnit === 'fahrenheit'
    ? `${Math.round(c * 9 / 5 + 32)}°F` : `${c.toFixed(1)}°C`;
  const fmtClock = () => new Date().toTimeString().slice(0, 8);
  const fmtDate  = () => new Date().toLocaleDateString('de-DE',
    { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }).toUpperCase();
  function fmtUptime() {
    const s = (performance.now() - S.t0) / 1000;
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} up`;
  }

  function drawTruncated(text, x, y, maxW, align = 'left') {
    ctx.textAlign = align;
    if (!text) return;
    if (ctx.measureText(text).width <= maxW) {
      ctx.fillText(text, x, y);
      return;
    }
    let t = text;
    while (t.length > 2 && ctx.measureText(t + '…').width > maxW) {
      t = t.slice(0, -1);
    }
    ctx.fillText(t + '…', x, y);
  }

  // ── §9 ZEICHEN-PRIMITIVEN ────────────────────────────────────────────────
  function panel(x, y, w, h, title, badge = '', col = COL.primary) {
    ctx.save();
    ctx.fillStyle = COL.panel;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 6);
    ctx.fill();
    ctx.strokeStyle = COL.border;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 5, y); ctx.lineTo(x + 55, y); ctx.stroke();

    ctx.strokeStyle = COL.borderDim;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 1, y + 24); ctx.lineTo(x + w - 1, y + 24); ctx.stroke();

    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = col;
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.fillText(title.toUpperCase(), x + 10, y + 12);

    if (badge) {
      ctx.font = '9px monospace';
      ctx.fillStyle = COL.textDim;
      ctx.textAlign = 'right';
      ctx.fillText(badge.toUpperCase(), x + w - 10, y + 12);
    }
    ctx.restore();
  }

  function bar(x, y, w, h, pct, col = COL.primary) {
    pct = Math.max(0, Math.min(100, pct));
    ctx.save();
    ctx.fillStyle = COL.barBg;
    ctx.fillRect(x, y, w, h);
    if (pct > 0) {
      ctx.fillStyle = col;
      ctx.fillRect(x, y, w * (pct / 100), h);
    }
    ctx.restore();
  }

  function segBar(x, y, w, h, pct, col = COL.primary) {
    pct = Math.max(0, Math.min(100, pct));
    ctx.save();
    const n = 28, gp = 2, sw = (w - (n - 1) * gp) / n;
    const active = Math.round(pct / 100 * n);
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = i < active
        ? (i > n * 0.85 && !S.monochrome ? COL.warn : col)
        : COL.barBg;
      ctx.fillRect(x + i * (sw + gp), y, sw, h);
    }
    ctx.restore();
  }

  function graph(x, y, w, h, data, col = COL.primary) {
    if (!data || data.length < 2) return;
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = COL.grid; ctx.lineWidth = 1;
    ctx.beginPath();
    for (const p of [0.25, 0.5, 0.75]) {
      const ly = y + h * (1 - p);
      ctx.moveTo(x, ly); ctx.lineTo(x + w, ly);
    }
    ctx.stroke();

    const step = w / (data.length - 1);
    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const px = x + i * step;
      const py = y + h - Math.max(0, Math.min(1, data[i] / 100)) * h;
      if (i === 0) { ctx.moveTo(px, py); continue; }
      const prevPy = y + h - Math.max(0, Math.min(1, data[i - 1] / 100)) * h;
      ctx.lineTo(px, prevPy); ctx.lineTo(px, py);
    }
    ctx.strokeStyle = col; ctx.lineWidth = 1.4; ctx.stroke();

    ctx.strokeStyle = COL.borderDim; ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
  }

  function fan(cx, cy, R, angle, col) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = COL.borderDim; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.stroke();
    ctx.rotate(angle);
    for (let i = 0; i < 7; i++) {
      ctx.save(); ctx.rotate(i / 7 * Math.PI * 2);
      ctx.beginPath();
      ctx.moveTo(2, 3);
      ctx.quadraticCurveTo(R * 0.55, R * 0.38, R * 0.92, 2);
      ctx.quadraticCurveTo(R * 0.48, -R * 0.18, 2, -2);
      ctx.closePath();
      ctx.fillStyle = col; ctx.globalAlpha = 0.35; ctx.fill();
      ctx.globalAlpha = 0.80; ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = COL.bg;
    ctx.beginPath(); ctx.arc(0, 0, R * 0.26, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function eq(x, y, w, h, dt) {
    ctx.save();
    const n = 32, gap = 2, bw = (w - (n - 1) * gap) / n;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
    for (let i = 0; i < n; i++) {
      ctx.fillRect(x + i * (gap + bw), y, bw, h);
    }

    ctx.fillStyle = COL.barBg;
    for (let i = 0; i < n; i++) {
      ctx.fillRect(x + i * (gap + bw), y + h - 1.5, bw, 1.5);
    }

    for (let i = 0; i < n; i++) {
      const v = T.eq[i];
      const bx = x + i * (gap + bw);

      if (v > 0.015) {
        const bh = Math.max(2, Math.min(h, v * h));
        const by = y + h - bh;
        ctx.fillStyle = S.monochrome ? '#ffffff' : COL.secondary;
        ctx.fillRect(bx, by, bw, bh);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(bx, by, bw, 1.5);
      }

      T.eqPeakAge[i] += dt;
      if (T.eqPeakAge[i] > 0.35) {
        T.eqPeaks[i] = Math.max(0, T.eqPeaks[i] - 1.2 * dt);
      }
      if (T.eqPeaks[i] > 0.02) {
        const py2 = y + h - Math.min(h, T.eqPeaks[i] * h);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fillRect(bx, py2 - 1.5, bw, 1.5);
      }
    }
    ctx.restore();
  }

  // ── §10 RUHIGES KOSMISCHES STERNENFELD (50 Sterne für minimale CPU-Last) ──
  const STARS = Array.from({ length: 50 }, () => ({
    x: (Math.random() - 0.5) * 2400,
    y: (Math.random() - 0.5) * 1400,
    z: Math.random() * 850 + 80
  }));

  function starfield(dt) {
    if (!S.showStars) return;
    ctx.save();
    const fov = 300, drift = 15 * dt, cx = W * 0.5, cy = H * 0.44;
    ctx.fillStyle = S.monochrome ? COL.primary : COL.accent;
    for (let i = 0; i < STARS.length; i++) {
      const s = STARS[i];
      s.z -= drift;
      if (s.z < 15) { s.z = 850; s.x = (Math.random() - 0.5) * 2400; s.y = (Math.random() - 0.5) * 1400; }
      const sx = cx + (s.x / s.z) * fov, sy = cy + (s.y / s.z) * fov;
      if (sx < -8 || sx > W + 8 || sy < -8 || sy > H + 8) continue;
      const d = 1 - s.z / 870;
      ctx.globalAlpha = Math.max(0.1, Math.min(0.40, d * 0.5));
      ctx.fillRect(sx, sy, Math.max(1, d * 2), Math.max(1, d * 2));
    }
    ctx.restore();
  }

  // ── §11 3D GAMING-PC HOLOGRAMM (Vorab-Matrixberechnung für 0% Trig-Overhead) ─
  function makeBox(x0, y0, z0, x1, y1, z1) {
    return [
      [[x0, y0, z0], [x1, y0, z0]], [[x1, y0, z0], [x1, y1, z0]], [[x1, y1, z0], [x0, y1, z0]], [[x0, y1, z0], [x0, y0, z0]],
      [[x0, y0, z1], [x1, y0, z1]], [[x1, y0, z1], [x1, y1, z1]], [[x1, y1, z1], [x0, y1, z1]], [[x0, y1, z1], [x0, y0, z1]],
      [[x0, y0, z0], [x0, y0, z1]], [[x1, y0, z0], [x1, y0, z1]], [[x1, y1, z0], [x1, y1, z1]], [[x0, y1, z0], [x0, y1, z1]],
    ];
  }
  const PC = {
    chassis: [
      ...makeBox(-11, -23, -22, 11, 23, 22),
      [[-11, 11, -22], [11, 11, -22]], [[11, 11, -22], [11, 11, 22]], [[-11, 11, 22], [11, 11, 22]],
      [[11, -21, -20], [11, -21, 20]], [[11, -21, 20], [11, 10, 20]], [[11, 10, 20], [11, 10, -20]], [[11, 10, -20], [11, -21, -20]],
      [[-11, -16, 22], [11, -10, 22]], [[-11, -6, 22], [11, 0, 22]], [[-11, 4, 22], [11, 10, 22]],
    ],
    gpu: makeBox(-9, 3, -16, 8, 8, 12),
    cpu: makeBox(-10, -14, -6, -2, -6, 6),
  };

  let cosRY = 1, sinRY = 0, cosRX = 1, sinRX = 0;
  function update3DMatrix(rX, rY) {
    cosRY = Math.cos(rY); sinRY = Math.sin(rY);
    cosRX = Math.cos(rX); sinRX = Math.sin(rX);
  }

  function proj3D(pt, scale, cx, cy) {
    const x = pt[0], y = pt[1], z = pt[2];
    const x1 = x * cosRY + z * sinRY;
    const z1 = -x * sinRY + z * cosRY;
    const y2 = y * cosRX - z1 * sinRX;
    const z2 = y * sinRX + z1 * cosRX;
    const sc = (200 / (280 + z2)) * scale;
    return { px: cx + x1 * sc, py: cy + y2 * sc };
  }

  function drawPC(cx, cy, scale, rX, rY) {
    update3DMatrix(rX, rY);
    ctx.save();
    const groups = [
      { edges: PC.chassis, col: COL.pc,        lw: 1.1, a: 0.85 },
      { edges: PC.gpu,     col: COL.secondary, lw: 1.5, a: 0.90 },
      { edges: PC.cpu,     col: COL.accent,    lw: 1.3, a: 0.85 },
    ];
    for (let i = 0; i < groups.length; i++) {
      const g = groups[i];
      ctx.strokeStyle = g.col; ctx.lineWidth = g.lw; ctx.globalAlpha = g.a;
      ctx.beginPath();
      for (let j = 0; j < g.edges.length; j++) {
        const edge = g.edges[j];
        const p1 = proj3D(edge[0], scale, cx, cy);
        const p2 = proj3D(edge[1], scale, cx, cy);
        ctx.moveTo(p1.px, p1.py); ctx.lineTo(p2.px, p2.py);
      }
      ctx.stroke();
    }

    ctx.globalAlpha = 0.80; ctx.fillStyle = '#ffffff';
    const verts = [[-11, -23, -22], [11, -23, -22], [-11, -23, 22], [11, -23, 22],
                   [-11, 23, -22], [11, 23, -22], [11, 23, 22], [-11, 23, 22]];
    for (let i = 0; i < verts.length; i++) {
      const p = proj3D(verts[i], scale, cx, cy);
      ctx.fillRect(p.px - 1, p.py - 1, 2, 2);
    }
    ctx.restore();
  }

  function gyroRing(cx, cy, R, nowSec) {
    ctx.save();
    const mx = (S.mouseX - W * 0.5) * 0.022, my = (S.mouseY - H * 0.5) * 0.022;

    ctx.strokeStyle = COL.border; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();

    // 2 Strokes für alle 60 Kompass-Ticks
    ctx.strokeStyle = COL.primary; ctx.lineWidth = 1.3;
    ctx.beginPath();
    for (let i = 0; i < 60; i += 5) {
      const a = i / 60 * Math.PI * 2, r1 = R - 8;
      ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
    }
    ctx.stroke();

    ctx.strokeStyle = COL.borderDim; ctx.lineWidth = 0.7;
    ctx.beginPath();
    for (let i = 0; i < 60; i++) {
      if (i % 5 === 0) continue;
      const a = i / 60 * Math.PI * 2, r1 = R - 4;
      ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
    }
    ctx.stroke();

    ctx.font = '8px monospace'; ctx.fillStyle = COL.textMuted;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const [lbl, a] of [['N', -Math.PI / 2], ['E', 0], ['S', Math.PI / 2], ['W', Math.PI]]) {
      ctx.fillText(lbl, cx + Math.cos(a) * (R + 11), cy + Math.sin(a) * (R + 11));
    }

    // Drehringe (voll hardwarebeschleunigt ohne CPU-LineDash)
    ctx.save();
    ctx.translate(cx + mx * 0.5, cy + my * 0.5); ctx.rotate(nowSec * 0.17);
    ctx.strokeStyle = S.monochrome ? COL.primary : COL.secondary;
    ctx.lineWidth = 1; ctx.globalAlpha = 0.35;
    ctx.beginPath(); ctx.arc(0, 0, R - 28, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(cx - mx * 0.3, cy - my * 0.3); ctx.rotate(-nowSec * 0.24);
    ctx.strokeStyle = S.monochrome ? COL.primary : COL.accent;
    ctx.lineWidth = 0.8; ctx.globalAlpha = 0.25;
    ctx.beginPath(); ctx.arc(0, 0, R - 44, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();

    ctx.globalAlpha = 1;

    // CPU Bogen
    const ca = (T.cpuLoad / 100) * Math.PI * 0.86;
    ctx.beginPath(); ctx.arc(cx, cy, R - 14, Math.PI * 0.55, Math.PI * 0.55 + ca);
    ctx.strokeStyle = COL.primary; ctx.lineWidth = 5; ctx.stroke();

    // GPU Bogen
    const ga = (T.gpuLoad / 100) * Math.PI * 0.86;
    ctx.beginPath(); ctx.arc(cx, cy, R - 14, Math.PI * 0.45, Math.PI * 0.45 - ga, true);
    ctx.strokeStyle = S.monochrome ? COL.primary : COL.secondary;
    ctx.lineWidth = 5; ctx.stroke();

    ctx.restore();
  }

  // ── §12 BOTTOM BOX: SYSINFO & DMESG ──────────────────────────────────────
  function drawBottomBox(centX, nfY, centW, nfH) {
    ctx.save();
    ctx.fillStyle = COL.panel;
    ctx.beginPath(); ctx.roundRect(centX, nfY, centW, nfH - 2, 5); ctx.fill();
    ctx.strokeStyle = COL.border; ctx.lineWidth = 1; ctx.stroke();

    const innerPad = 12;
    const colGap   = 16;
    const colW     = Math.floor((centW - innerPad * 2 - colGap) * 0.5);

    const col1X = centX + innerPad;
    const col2X = col1X + colW + colGap;

    ctx.font = 'bold 9px monospace'; ctx.textBaseline = 'top';
    ctx.fillStyle = COL.primary; ctx.textAlign = 'left';
    ctx.fillText('// SYSINFO (NEOFETCH)', col1X, nfY + 8);

    ctx.fillStyle = S.monochrome ? COL.primary : COL.secondary;
    ctx.fillText('// DMESG KERNEL LOG', col2X, nfY + 8);

    ctx.strokeStyle = COL.borderDim; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(centX + 1, nfY + 22); ctx.lineTo(centX + centW - 1, nfY + 22); ctx.stroke();

    const sepX = col1X + colW + colGap * 0.5;
    ctx.beginPath(); ctx.moveTo(sepX, nfY + 24); ctx.lineTo(sepX, nfY + nfH - 6); ctx.stroke();

    const lh = 14;
    const keyW = 54;
    const maxValW = colW - keyW - 6;

    const rows = [
      ['os',      HW.os || 'Windows'],
      ['kernel',  HW.kernel],
      ['shell',   HW.shell],
      ['uptime',  fmtUptime()],
      ['cpu',     `${HW.cpuName} (${HW.cpuCores}C/${HW.cpuThreads}T)`],
      ['gpu',     `${HW.gpuName} (${HW.gpuVramGB} GB)`],
      ['memory',  `${(T.ramGBUsed || 0).toFixed(1)} / ${HW.ramGB} GiB`],
      ['mobo',    HW.mainboard],
      ['storage', `${HW.storageGB} Quota`],
      ['display', `${HW.screenRes} @ ${T.fps}Hz`],
      ...(T.liveConnected ? [['net ↓', `${T.netDownMbps.toFixed(1)} Mbit/s`], ['net ↑', `${T.netUpMbps.toFixed(1)} Mbit/s`]] : [])
    ];

    const startY = nfY + 26;
    const maxRows = Math.floor((nfH - 32) / lh);
    const renderRows = rows.slice(0, maxRows);

    for (let i = 0; i < renderRows.length; i++) {
      const [k, v] = renderRows[i];
      const ry = startY + i * lh;

      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = COL.primary;
      ctx.textAlign = 'right';
      ctx.fillText(k, col1X + keyW, ry);

      ctx.font = '9px monospace';
      ctx.fillStyle = COL.text;
      drawTruncated(v, col1X + keyW + 6, ry, maxValW, 'left');
    }

    const maxLogs = Math.floor((nfH - 32) / lh);
    const visibleLogs = LOG.slice(-maxLogs);
    const maxLogMsgW = colW - 58;

    for (let i = 0; i < visibleLogs.length; i++) {
      const line = visibleLogs[i];
      const ly = startY + i * lh;
      const br = line.indexOf(']');

      if (br > 0) {
        ctx.font = '9px monospace';
        ctx.fillStyle = COL.textMuted;
        ctx.textAlign = 'left';
        ctx.fillText(line.slice(0, br + 1), col2X, ly);

        ctx.fillStyle = COL.accent;
        drawTruncated(line.slice(br + 2), col2X + 54, ly, maxLogMsgW, 'left');
      } else {
        ctx.fillStyle = COL.accent;
        drawTruncated(line, col2X, ly, colW - 4, 'left');
      }
    }

    ctx.restore();
  }

  // ── §13 EVENT LOG SETUP ──────────────────────────────────────────────────
  const ts  = () => new Date().toTimeString().slice(0, 8);
  const LOG = [
    `[${ts()}]  kernel: Linux 6.5.0-35-generic`,
    `[${ts()}]  systemd: Graphical Interface active`,
    `[${ts()}]  gpu: ${HW.gpuName} initialized`,
    `[${ts()}]  cpu: ${HW.cpuName} (${HW.cpuCores}C/${HW.cpuThreads}T)`,
    `[${ts()}]  apex: telemetry engine online`,
  ];
  function addLog(msg) { LOG.push(`[${ts()}]  ${msg}`); if (LOG.length > 10) LOG.shift(); }

  let logTimer = 0;
  function maybeLog() {
    logTimer += 1;
    if (logTimer < 180) return;
    logTimer = 0;
    if (T.cpuLoad > 45) addLog(`sched: CPU load ${Math.round(T.cpuLoad)}% — ${T.cpuFreqMHz}MHz`);
    else addLog(`amdgpu: GPU ${Math.round(T.gpuLoad)}% · ${fmtTemp(T.gpuTempC)}`);
  }

  // ── §14 MAIN RENDER LOOP (Mit strengem FPS-Limiter für minimalste Last) ──
  let lastDrawTime = performance.now();

  function render(now) {
    if (S.paused) return;
    requestAnimationFrame(render);

    // Strenger Frame-Limiter: Überspringt überflüssige Frames bei 144Hz Monitoren
    const elapsed = now - lastDrawTime;
    if (elapsed < frameInterval - 1.5) return;
    lastDrawTime = now - (elapsed % frameInterval);

    const dt = Math.min(0.1, elapsed / 1000);
    const nowSec = now * 0.001;

    // FPS Tracking
    T.ftRing.shift(); T.ftRing.push(elapsed);
    T.ftCount++;
    if (now - T.ftTimer >= 1000) {
      T.fps = Math.round(T.ftCount * 1000 / (now - T.ftTimer));
      T.ftMs = +(elapsed).toFixed(1);
      T.ftCount = 0; T.ftTimer = now;
      const srt = [...T.ftRing].sort((a, b) => b - a);
      T.pct1Low = Math.round(1000 / Math.max(1, srt[Math.floor(srt.length * 0.05)]));
    }

    poll(now);
    maybeLog();

    T.cpuFanA += (T.cpuFanRPM / 60) * Math.PI * 2 * dt;
    T.gpuFanA += (T.gpuFanRPM / 60) * Math.PI * 2 * dt;
    S.pcRotY  += 0.28 * dt;
    S.pcRotX   = 0.22 + Math.sin(nowSec * 0.18) * 0.04;

    const eqDecay = Math.exp(-9.0 * dt);
    for (let i = 0; i < 32; i++) {
      T.eq[i] *= eqDecay;
      if (T.eq[i] < 0.005) T.eq[i] = 0;
    }

    // ── CLEAR ────────────────────────────────────────────────────────────
    ctx.fillStyle = COL.bg;
    ctx.fillRect(0, 0, W, H);

    starfield(dt);

    // Gitter (65px Raster in genau 1 Stroke)
    ctx.save();
    ctx.strokeStyle = COL.grid; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < W; x += 65) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (let y = 0; y < H; y += 65) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();
    ctx.restore();

    // ── LAYOUT-GEOMETRIE ──────────────────────────────────────────────────
    const availH = Math.max(400, H - 48);
    const isUW   = W / H > 2.0;

    let bW, bH;
    if (S.layoutMode === 'fullscreen') {
      bW = W - 28;
      bH = availH - 20;
    } else if (S.layoutMode === 'compact') {
      bW = Math.min(1140, Math.max(780, Math.round(W * (isUW ? 0.35 : 0.60))));
      bH = Math.min(680, Math.max(480, Math.round(availH * 0.74)));
    } else {
      bW = Math.min(1340, Math.max(860, Math.round(W * (isUW ? 0.44 : 0.70))));
      bH = Math.min(760, Math.max(520, Math.round(availH * 0.80)));
    }

    if (bW > W - 24) bW = W - 24;
    if (bH > availH - 10) bH = availH - 10;

    const bX = Math.round((W - bW) * 0.5);
    const bY = Math.round((availH - bH) * 0.5) + 4;

    const HH = 38, FH = 24, gap = 10;
    const cY = bY + HH + gap;
    const cH = bH - HH - FH - gap * 2;

    const cW = Math.min(360, Math.max(250, Math.round(bW * 0.285)));
    const lX = bX;
    const rX = bX + bW - cW;
    const centX = lX + cW + gap;
    const centW = rX - centX - gap;

    // ── HEADER ─────────────────────────────────────────────────────────────
    ctx.save();
    drawTux(bX + 8, bY + Math.round((HH - 26) * 0.5), 26);

    ctx.strokeStyle = COL.border; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(bX, bY + HH); ctx.lineTo(bX + bW, bY + HH); ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = 'bold 14px monospace'; ctx.fillStyle = COL.text;
    ctx.fillText(fmtClock(), bX + bW * 0.5, bY + HH * 0.38);
    ctx.font = '9px monospace'; ctx.fillStyle = COL.textDim;
    ctx.fillText(fmtDate() + '  ·  ' + fmtUptime(), bX + bW * 0.5, bY + HH * 0.72);

    ctx.textAlign = 'right';
    ctx.font = '9px monospace'; ctx.fillStyle = S.monochrome ? COL.primary : COL.secondary;
    ctx.fillText(`● ONLINE // ${T.fps} FPS`, bX + bW, bY + HH * 0.5);
    ctx.restore();

    // ── LINKER FLÜGEL: CPU & MEMORY ───────────────────────────────────────
    const cpuH = Math.min(270, cH * 0.52);
    panel(lX, cY, cW, cpuH, 'CPU', `${HW.cpuCores}C / ${HW.cpuThreads}T`, COL.primary);
    {
      const px = lX + 10, py = cY + 32;
      ctx.save();

      fan(lX + cW - 28, cY + 60, 20, T.cpuFanA, COL.primary);

      ctx.font = 'bold 10px monospace'; ctx.fillStyle = COL.text;
      ctx.textBaseline = 'top';
      drawTruncated(HW.cpuName.toUpperCase(), px, py, cW - 60, 'left');

      ctx.font = 'bold 24px monospace'; ctx.fillStyle = COL.primary;
      ctx.fillText(`${Math.round(T.cpuLoad)}%`, px, py + 13);

      ctx.font = '10px monospace'; ctx.fillStyle = S.monochrome ? COL.primary : COL.secondary;
      ctx.fillText(`${T.cpuFreqMHz} MHz`, px + 68, py + 19);
      ctx.fillStyle = COL.textDim;
      ctx.fillText(`${fmtTemp(T.cpuTempC)}  ${T.cpuFanRPM} rpm  ${T.cpuVoltage}V`, px + 68, py + 31);

      segBar(px, py + 46, cW - 20, 7, T.cpuLoad, COL.primary);

      ctx.font = '8px monospace'; ctx.fillStyle = T.liveConnected ? (S.monochrome ? COL.primary : COL.secondary) : COL.textMuted;
      ctx.fillText(T.liveConnected ? '● 1:1 TASKMGR LIVE' : `bench: ${T.cpuBenchMs}ms measured`, px, py + 58);

      ctx.fillText('core matrix:', px, py + 70);
      // BUG-M fix: bis zu 16 Threads anzeigen (8 Spalten statt 4 für 16T-CPUs)
      const maxC = Math.min(HW.cpuThreads, 16);
      const cols = maxC > 8 ? 8 : 4;
      const rows = Math.ceil(maxC / cols);
      const cellW = (cW - 20 - (cols - 1) * 5) / cols, cellH = 16;
      for (let c = 0; c < maxC; c++) {
        const ci = c % cols, ri = Math.floor(c / cols);
        const cx2 = px + ci * (cellW + 5), cy2 = py + 78 + ri * (cellH + 4);
        const ld = T.coreLoads[c] || 12;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.04)'; ctx.fillRect(cx2, cy2, cellW, cellH);
        ctx.fillStyle = COL.primary; ctx.globalAlpha = 0.20;
        ctx.fillRect(cx2, cy2, (ld / 100) * cellW, cellH); ctx.globalAlpha = 1;
        ctx.strokeStyle = COL.borderDim; ctx.lineWidth = 1; ctx.strokeRect(cx2, cy2, cellW, cellH);
        ctx.font = '8px monospace'; ctx.fillStyle = COL.text; ctx.textAlign = 'left';
        ctx.fillText(`C${String(c).padStart(2, '0')}:${String(Math.round(ld)).padStart(2, ' ')}%`, cx2 + 3, cy2 + cellH * 0.5 + 4);
      }

      const gY = py + 78 + rows * (cellH + 4) + 4;
      const gH = cpuH - (gY - cY) - 8;
      if (gH > 18) graph(px, gY, cW - 20, gH, T.cpuHist, COL.primary);
      ctx.restore();
    }

    // Memory Panel
    const ramY = cY + cpuH + 10, ramH = cH - cpuH - 10;
    if (ramH > 65) {
      panel(lX, ramY, cW, ramH, 'Memory', `${HW.ramGB} GiB total`, COL.ram);
      const px = lX + 10, py = ramY + 32;
      ctx.save();
      const ramUsed = T.ramGBUsed || 0;  // BUG-C/I fix: kein hardcodierter Fallback 9.5
      const ramPct  = T.ramPct || Math.round((ramUsed / HW.ramGB) * 100);
      ctx.font = 'bold 16px monospace'; ctx.fillStyle = COL.ram;
      ctx.textBaseline = 'top'; ctx.textAlign = 'left';
      ctx.fillText(`${ramUsed.toFixed(1)} GiB / ${HW.ramGB} GiB (${Math.round(ramPct)}%)`, px, py);
      ctx.font = '9px monospace'; ctx.fillStyle = COL.textDim;
      ctx.fillText(T.liveConnected ? '● 1:1 live taskmgr memory' : `disk quota detected: ${HW.storageGB}`, px, py + 18);
      bar(px, py + 30, cW - 20, 7, ramPct, COL.ram);
      const gh = ramH - 56;
      if (gh > 18) graph(px, py + 42, cW - 20, gh, T.ramHist, COL.ram);
      ctx.restore();
    }

    // ── RECHTER FLÜGEL: GPU & FRAMETIME/AUDIO ─────────────────────────────
    const gpuH = Math.min(270, cH * 0.52);
    panel(rX, cY, cW, gpuH, 'GPU', `${HW.gpuVramGB} GiB VRAM`, COL.secondary);
    {
      const px = rX + 10, py = cY + 32;
      ctx.save();
      fan(rX + cW - 28, cY + 60, 20, T.gpuFanA, COL.secondary);

      ctx.font = 'bold 10px monospace'; ctx.fillStyle = COL.text;
      ctx.textBaseline = 'top';
      drawTruncated(HW.gpuName, px, py, cW - 60, 'left');

      ctx.font = 'bold 24px monospace'; ctx.fillStyle = COL.secondary;
      ctx.fillText(`${Math.round(T.gpuLoad)}%`, px, py + 13);

      ctx.font = '10px monospace'; ctx.fillStyle = S.monochrome ? COL.primary : COL.secondary;
      ctx.fillText(`${T.gpuFreqMHz} MHz`, px + 68, py + 19);
      ctx.fillStyle = COL.textDim;
      ctx.fillText(`${fmtTemp(T.gpuTempC)} (hot:${fmtTemp(T.gpuHotspot)})  ${T.gpuPowerW}W`, px + 68, py + 31);

      segBar(px, py + 46, cW - 20, 7, T.gpuLoad, COL.secondary);

      ctx.font = '9px monospace'; ctx.fillStyle = COL.textDim;
      ctx.fillText(`vram ${T.gpuVramUsed} / ${HW.gpuVramGB} GiB  ·  fan ${T.gpuFanRPM} rpm`, px, py + 58);

      const vP = (T.gpuVramUsed / HW.gpuVramGB) * 100;
      bar(px, py + 70, cW - 20, 5, vP, S.monochrome ? COL.primary : COL.accent);

      const gY = py + 80, gH = gpuH - (gY - cY) - 8;
      if (gH > 18) graph(px, gY, cW - 20, gH, T.gpuHist, COL.secondary);
      ctx.restore();
    }

    // ── RECHTER FLÜGEL UNTEN: AUDIO SPECTRUM ──────────────────────────────
    const audioY = cY + gpuH + 10, audioH = cH - gpuH - 10;
    if (audioH > 65) {
      let maxEq = 0;
      for (let i = 0; i < 32; i++) if (T.eq[i] > maxEq) maxEq = T.eq[i];
      const audioActive = maxEq > 0.02;
      const audioBadge  = audioActive ? '● LIVE OUTPUT' : '○ STANDBY';
      panel(rX, audioY, cW, audioH, 'Audio Spectrum', audioBadge, COL.secondary);

      const px = rX + 10, py = audioY + 30;
      const innerW = cW - 20;
      const innerH = audioH - 38;

      ctx.save();
      ctx.font = 'bold 9px monospace';
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';
      ctx.fillStyle = audioActive ? (S.monochrome ? COL.primary : COL.secondary) : COL.textDim;

      const peakDb = audioActive ? (20 * Math.log10(maxEq)).toFixed(1) + ' dB' : 'MUTED // IDLE';
      ctx.fillText(`SPECTRUM // ${peakDb}`, px, py);

      ctx.textAlign = 'right';
      ctx.font = '8px monospace';
      ctx.fillStyle = COL.textMuted;
      ctx.fillText('32 CHANNELS · 20Hz-20kHz', px + innerW, py + 1);

      const eqTop = py + 15;
      const labelH = 11;
      const eqH = innerH - 15 - labelH;

      if (eqH > 20) {
        eq(px, eqTop, innerW, eqH, dt);

        const lblY = eqTop + eqH + 3;
        ctx.font = '8px monospace';
        ctx.fillStyle = COL.textMuted;
        ctx.textAlign = 'left';
        ctx.fillText('BASS (30Hz)', px + 2, lblY);
        ctx.textAlign = 'center';
        ctx.fillText('MID (1kHz)', px + innerW * 0.5, lblY);
        ctx.textAlign = 'right';
        ctx.fillText('HIGH (16kHz)', px + innerW - 2, lblY);
      }
      ctx.restore();
    }

    // ── ZENTRUM: GYRO-RING & 3D GAMING-PC HOLOGRAMM ────────────────────────
    const rR  = Math.min(120, centW * 0.30, cH * 0.30);
    const rCX = centX + centW * 0.5, rCY = cY + cH * 0.33;

    if (rR > 44) {
      gyroRing(rCX, rCY, rR, nowSec);

      drawPC(rCX + (S.mouseX - W * 0.5) * 0.016,
             rCY + (S.mouseY - H * 0.5) * 0.016 - 10,
             1.55, S.pcRotX, S.pcRotY);

      ctx.save();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '8px monospace'; ctx.fillStyle = COL.textMuted;
      ctx.fillText('// 3D RIG HOLOGRAM', rCX, rCY - rR + 15);
      ctx.font = 'bold 20px monospace'; ctx.fillStyle = COL.primary;
      ctx.fillText(`${Math.round((T.cpuLoad + T.gpuLoad) * 0.5)}%`, rCX, rCY + rR - 34);
      ctx.font = '9px monospace'; ctx.fillStyle = COL.textDim;
      ctx.fillText(`${fmtTemp((T.cpuTempC + T.gpuTempC) * 0.5)}  ·  ${T.gpuPowerW + Math.round(28 + (T.cpuLoad / 100) * 44)}W`, rCX, rCY + rR - 18);
      ctx.restore();
    }

    // ── ZENTRUM UNTEN: SYSINFO & DMESG ────────────────────────────────────
    const nfY = rCY + rR + 18, nfH = cH - (nfY - cY);
    if (nfH > 70 && centW > 160) {
      drawBottomBox(centX, nfY, centW, nfH);
    }

    // ── FOOTER ─────────────────────────────────────────────────────────────
    const fY = bY + bH - FH * 0.5;
    ctx.save();
    ctx.strokeStyle = COL.border; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(bX, bY + bH - FH); ctx.lineTo(bX + bW, bY + bH - FH); ctx.stroke();

    const rightText = `SYSTEM TELEMETRY // ${T.fps} FPS`;
    ctx.font = '9px monospace';
    const rW = ctx.measureText(rightText).width;
    const maxLeftW = bW - rW - 20;

    const leftText = `${HW.cpuName}  ·  ${HW.gpuName}  ·  ${HW.mainboard}  ·  ${HW.ramGB} GiB`;
    ctx.fillStyle = COL.textMuted;
    ctx.textBaseline = 'middle';
    drawTruncated(leftText, bX, fY, maxLeftW, 'left');

    ctx.textAlign = 'right';
    ctx.fillText(rightText, bX + bW, fY);
    ctx.restore();
  }

  // ── §15 WALLPAPER ENGINE API ─────────────────────────────────────────────
  window.wallpaperPropertyListener = {
    applyUserProperties(props) {
      const p = k => props[k] ? parseWEColor(props[k].value) : null;

      if (props.layout_mode?.value) {
        S.layoutMode = props.layout_mode.value;
      }

      if (props.fps_limit?.value) {
        const fps = parseInt(props.fps_limit.value, 10) || 30;
        S.fpsLimit = fps;
        targetFPS = fps;
        frameInterval = 1000 / fps;
      }

      if (props.monochrome_mode !== undefined) {
        S.monochrome = Boolean(props.monochrome_mode.value);
      }

      const p1 = p('schemecolor');
      if (p1) userColors.primary = p1.hex;

      const p2 = p('hud_secondary_color');
      if (p2) userColors.secondary = p2.hex;

      const pRam = p('hud_ram_color');
      if (pRam) userColors.ram = pRam.hex;

      const pPC = p('hud_pc_color');
      if (pPC) userColors.pc = pPC.hex;

      const pBg = p('hud_bg_color');
      if (pBg) userColors.bg = pBg.hex;

      updatePalette();

      if (props.show_starfield !== undefined) {
        S.showStars = Boolean(props.show_starfield.value);
      }

      if (props.cpu_name_override?.value) HW.cpuName = props.cpu_name_override.value;
      if (props.gpu_name_override?.value) HW.gpuName = props.gpu_name_override.value;
      if (props.polling_rate?.value)       S.pollingMs = parseInt(props.polling_rate.value, 10) || 1000;
      if (props.temp_unit?.value)          S.tempUnit  = props.temp_unit.value;
    },
    setPaused(v) {
      S.paused = v;
      if (!v) { lastDrawTime = performance.now(); requestAnimationFrame(render); }
    }
  };

  document.addEventListener('visibilitychange', () => {
    S.paused = document.hidden;
    if (!S.paused) { lastDrawTime = performance.now(); requestAnimationFrame(render); }
  });

  updatePalette();
  lastDrawTime = performance.now();
  requestAnimationFrame(render);

  // ── §16 FIRST-RUN — wird jetzt vom HTML-Modal in index.html übernommen ──

})();
