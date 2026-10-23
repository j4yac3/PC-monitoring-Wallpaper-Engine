# Ultra-Lightweight 0% CPU Task Manager Telemetry Daemon für APEX Wallpaper
$ErrorActionPreference = 'SilentlyContinue'

Add-Type -AssemblyName System.Diagnostics.PerformanceCounter
Add-Type -AssemblyName Microsoft.VisualBasic
$info = New-Object Microsoft.VisualBasic.Devices.ComputerInfo

$cpuCounter = New-Object System.Diagnostics.PerformanceCounter("Processor", "% Processor Time", "_Total")
$null = $cpuCounter.NextValue()

# Core Counters für logische Prozessoren
$coreCount = [Environment]::ProcessorCount
if (-not $coreCount) { $coreCount = 8 }
$coreCounters = @()
for ($i = 0; $i -lt $coreCount; $i++) {
    $c = New-Object System.Diagnostics.PerformanceCounter("Processor", "% Processor Time", "$i")
    $null = $c.NextValue()
    $coreCounters += $c
}

# Netzwerk-Adapter wählen (aktiver Adapter mit höchster Linkgeschwindigkeit)
$netAdapter = Get-NetAdapter | Where-Object { $_.Status -eq 'Up' } | Sort-Object ReceiveLinkSpeed -Descending | Select-Object -First 1
$netAdapterName = if ($netAdapter) { $netAdapter.Name } else { $null }
$netStatsLast = $null

# Dynamische Pfade (funktioniert auf jedem PC, egal wo installiert)
$scriptDir = $PSScriptRoot
if (-not $scriptDir) { $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition }
$localJson = Join-Path $scriptDir "telemetry.json"
$localJs   = Join-Path $scriptDir "telemetry.js"

# BUG-G/H fix: Verbesserte WE-Pfadsuche via Steam-Registry + libraryfolders.vdf
$possibleWeRoots = [System.Collections.Generic.List[string]]::new()

# 1. Statische Kandidaten
$possibleWeRoots.AddRange([string[]]@(
    "$env:USERPROFILE\Documents\Wallpaper Engine",
    "$env:LOCALAPPDATA\Wallpaper Engine",
    "C:\Program Files (x86)\Steam\steamapps\common\wallpaper_engine\projects\myprojects",
    "D:\Steam\steamapps\common\wallpaper_engine\projects\myprojects",
    "E:\Steam\steamapps\common\wallpaper_engine\projects\myprojects",
    "F:\SteamLibrary\steamapps\common\wallpaper_engine\projects\myprojects",
    "G:\SteamLibrary\steamapps\common\wallpaper_engine\projects\myprojects"
))

# 2. Steam-Registry auslesen für alle Steam-Bibliotheken
try {
    $steamPath = (Get-ItemProperty "HKCU:\Software\Valve\Steam" -Name "SteamPath" -ErrorAction Stop).SteamPath
    if ($steamPath) {
        $steamPath = $steamPath -replace '/', '\'
        $possibleWeRoots.Add("$steamPath\steamapps\common\wallpaper_engine\projects\myprojects")
        $vdfPath = "$steamPath\steamapps\libraryfolders.vdf"
        if (Test-Path $vdfPath) {
            $vdfContent = Get-Content $vdfPath -Raw -ErrorAction SilentlyContinue
            $matches_ = [regex]::Matches($vdfContent, '"path"\s+"([^"]+)"')
            foreach ($m in $matches_) {
                $libPath = $m.Groups[1].Value -replace '\\\\', '\' -replace '/', '\'
                $possibleWeRoots.Add("$libPath\steamapps\common\wallpaper_engine\projects\myprojects")
            }
        }
    }
} catch {}

# 3. Projekt-Unterverzeichnis finden (enthält index.html UND hardware.js = unser Projekt)
$weProjectDir = $null
foreach ($root in $possibleWeRoots) {
    if (-not $root -or -not (Test-Path $root)) { continue }
    $projectFolders = Get-ChildItem $root -Directory -ErrorAction SilentlyContinue
    foreach ($pf in $projectFolders) {
        if ((Test-Path (Join-Path $pf.FullName "index.html")) -and
            (Test-Path (Join-Path $pf.FullName "hardware.js"))) {
            $weProjectDir = $pf.FullName
            break
        }
    }
    if ($weProjectDir) { break }
}

# BUG-H fix: Auch Skriptverzeichnis selbst als WE-Projektverzeichnis nutzen wenn
# es index.html enthält (lokales Entwicklungsprojekt = häufigster Fall)
if (-not $weProjectDir -and (Test-Path (Join-Path $scriptDir "index.html"))) {
    $weProjectDir = $scriptDir
}

$weJson = if ($weProjectDir -and $weProjectDir -ne $scriptDir) { Join-Path $weProjectDir "telemetry.json" } else { $null }
$weJs   = if ($weProjectDir -and $weProjectDir -ne $scriptDir) { Join-Path $weProjectDir "telemetry.js"   } else { $null }

while ($true) {
    Start-Sleep -Milliseconds 1000

    $cpu = [math]::Round($cpuCounter.NextValue())
    # BUG-F fix: @() sichert Array-Typ auch bei Single-Core-VMs (coreCount=1)
    $cores = @($coreCounters | ForEach-Object { [math]::Round($_.NextValue()) })
    if ($cores -isnot [array]) { $cores = @($cores) }

    $totalGB = [math]::Round($info.TotalPhysicalMemory / 1GB, 1)
    $availGB = [math]::Round($info.AvailablePhysicalMemory / 1GB, 2)
    $usedGB  = [math]::Round($totalGB - $availGB, 2)
    $ramPct  = [math]::Round(($usedGB / $totalGB) * 100, 1)

    # Netzwerk-Bytes-Delta
    $netDown = 0; $netUp = 0
    if ($netAdapterName) {
        try {
            $stats = Get-NetAdapterStatistics -Name $netAdapterName -ErrorAction SilentlyContinue
            if ($stats -and $netStatsLast) {
                # BUG-D fix: Clamp auf 0 verhindert negative Werte bei Counter-Overflow/Reset
                $rxDelta = [math]::Max(0, $stats.ReceivedBytes - $netStatsLast.ReceivedBytes)
                $txDelta = [math]::Max(0, $stats.SentBytes     - $netStatsLast.SentBytes)
                $netDown = [math]::Round(($rxDelta * 8) / 1MB, 2)  # Mbit/s
                $netUp   = [math]::Round(($txDelta * 8) / 1MB, 2)  # Mbit/s
            }
            $netStatsLast = $stats
        } catch {}
    }

    $payload = [ordered]@{
        cpu        = $cpu
        cores      = $cores
        ramUsedGB  = $usedGB
        ramTotalGB = $totalGB
        ramPct     = $ramPct
        netDownMbps= $netDown
        netUpMbps  = $netUp
        timestamp  = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    } | ConvertTo-Json -Compress

    $jsCode = "window.LIVE_TELEMETRY = $payload;"

    try {
        [System.IO.File]::WriteAllText($localJson, $payload)
        [System.IO.File]::WriteAllText($localJs, $jsCode)
        if ($weJson) {
            [System.IO.File]::WriteAllText($weJson, $payload)
            [System.IO.File]::WriteAllText($weJs, $jsCode)
        }
    } catch {}
}
