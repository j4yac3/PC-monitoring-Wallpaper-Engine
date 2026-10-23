# APEX: Linux Ubuntu Hardware Monitor

Ein minimalistisches, elegantes Linux / Ubuntu Hardware-Cockpit für **Wallpaper Engine**, optimiert für den Steam Workshop.

---

## 🐧 Neue Features & Optimierungen

### 1. Mittig schwebendes Cockpit (Desktop-Icons bleiben 100% frei!)
- Das Monitoring-Cockpit ist jetzt **perfekt mittig im Bildschirm zentriert** (wie im echten Linux-Desktop-Design).
- Es klebt nicht mehr an den Monitor-Außenrändern: Deine Desktop-Icons links und rechts bleiben vollständig sichtbar und unbedeckt!
- In den Wallpaper Engine Einstellungen kannst du zwischen **`Mittig schwebend (Empfohlen)`**, **`Kompakt zentriert`** und **`Vollbild`** wählen.

### 2. Reiner Audio-Ausschlag (Ohne störende Zacken)
- Das unruhige Frametime-Zackendiagramm wurde entfernt. Die untere rechte Box gehört jetzt voll und ganz dem **reinen Audio-Equalizer**:
- 32 Frequenzkanäle von Bass (30Hz) bis Treble (16kHz), Peak-Hold-Nadeln und Live-dB-Anzeige.
- Schlägt nur aus, wenn tatsächlich Sound abgespielt wird oder gesprochen wird. Bei Stille ruht es völlig flach.

### 3. 100% perfekte Formatierung (Keine Textüberlappungen mehr!)
- Die untere Box (`// sysinfo` und `// dmesg`) ist jetzt mit einer sauberen vertikalen Trennlinie in zwei feste Hälften unterteilt.
- Alle Strings werden bei Bedarf intelligent mit `…` gekürzt, sodass selbst auf 1440×900, 1080p oder Ultrawide **niemals Texte übereinanderliegen**.
- Auch in der Fußzeile ist der linke Text nun dynamisch begrenzt, damit er die rechte `144Hz`-Anzeige nie berührt.

### 2. Einfarbiger Monochrom-Modus („Alles in einer Farbe“)
- In den Wallpaper Engine Eigenschaften gibt es jetzt die Checkbox:  
  **`Einfarbiger Monochrom-Modus (Alles in einer Farbe)`**
- Ist dieser aktiviert, erstrahlt das **gesamte Wallpaper einheitlich in deiner Wunschfarbe** (z. B. komplett im klassischen Ubuntu-Orange, Cyber-Cyan, Neon-Rot, Matrix-Grün oder Stealth-Weiß).
- Alle Rahmen, Graphen, Lüfter, Texte und das 3D-PC-Hologramm passen sich harmonisch an!

### 3. Granulare Farbkontrolle (Jedes Modell einzeln anpassen)
- Wenn der Monochrom-Modus ausgeschaltet ist, kannst du jedes Element separat über eigene Farbfelder anpassen:
  - **CPU & Header Farbe** (`schemecolor`)
  - **GPU & Frametime Farbe** (`hud_secondary_color`)
  - **RAM & Speicher Farbe** (`hud_ram_color`)
  - **3D-PC Hologramm Farbe** (`hud_pc_color`)
  - **Hintergrundfarbe** (`hud_bg_color`)

### 4. Vektor-Tux direkt im Code implementiert (Keine störende Schrift)
- Die Schrift `APEX // UBUNTU LINUX MONITOR` im Header wurde entfernt – oben links sitzt jetzt **ausschließlich der Tux-Pinguin**.
- Das Tux-Logo ist nun **als reiner Vektor direkt in JavaScript gerendert** (`drawTux`): 0 externe Bilddateien, 0ms Ladezeit, kein Flackern beim Wallpaper-Start und 100% autark für den Steam Workshop!

---

## 🖥 Hardware-Erkennung
- **CPU:** `AMD Ryzen 9 9950X3D` 
- **GPU:** `NVIDIA Geforce RTX 5090` (32 GB VRAM)
- **Mainboard:** `ASUS ROG Crosshair X870E Extreme`
- **RAM:** `128 GB DDR5`
- **OS:** `Windows 11 Pro, 64 Bit`

---

## 🚀 Veröffentlichung auf Wallpaper Engine
Das Wallpaper ist jetzt 100% veröffentlichungsreif:
1. Öffne Wallpaper Engine.
2. Wähle das Projekt über den Wallpaper-Editor.
3. Klicke auf **„Auf Steam Workshop veröffentlichen“**.


## Hardware-Erkennung reparieren
Die Hardware-Erkennung liegt als PowerShell-Skript `detect-hardware.ps1` vor.
Doppelklicke auf `detect-hardware.bat` (oder `update-hardware.bat`), um
`hardware.js` in diesem Ordner neu zu erzeugen. Das Fenster bleibt offen,
damit Fehlermeldungen sichtbar bleiben. Die Live-Telemetrie wird über
`start-telemetry.vbs` gestartet und verwendet `live-telemetry.ps1`.
