# Erkennt automatisch die Hardware des aktuellen PCs
$ErrorActionPreference = 'SilentlyContinue'

$cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
$gpu = Get-CimInstance Win32_VideoController | Select-Object -First 1
$mb  = Get-CimInstance Win32_BaseBoard | Select-Object -First 1
$os  = Get-CimInstance Win32_OperatingSystem | Select-Object -First 1
$net = Get-NetAdapter | Where-Object { $_.Status -eq 'Up' } | Select-Object -First 1

$cpuName    = if ($cpu.Name)                        { $cpu.Name.Trim() }                  else { 'Unknown CPU' }
$cpuCores   = if ($cpu.NumberOfCores)               { $cpu.NumberOfCores }               else { [Environment]::ProcessorCount / 2 }
$cpuThreads = if ($cpu.NumberOfLogicalProcessors)    { $cpu.NumberOfLogicalProcessors }    else { [Environment]::ProcessorCount }
$cpuMaxClock= if ($cpu.MaxClockSpeed)               { $cpu.MaxClockSpeed }               else { 3000 }

$gpuName = if ($gpu.Name) { $gpu.Name.Trim().ToUpper() } else { 'GPU' }

# Robustes VRAM-Auslesen (verhindert 32-Bit Overflow bei 4GB+ GPUs)
$gpuVram = 0.0
try {
    # Methode 1: 64-Bit Registry-Wert (genaueste Methode)
    $regPaths = Get-ChildItem "HKLM:\SYSTEM\CurrentControlSet\Control\Class\{4d36e968-e325-11ce-bfc1-08002be10318}" -ErrorAction SilentlyContinue
    foreach ($rp in $regPaths) {
        $val = (Get-ItemProperty $rp.PSPath -Name "HardwareInformation.qwMemorySize" -ErrorAction SilentlyContinue)."HardwareInformation.qwMemorySize"
        if ($val -gt 0) { $gpuVram = [math]::Round($val / 1GB, 1); break }
    }
} catch {}

if ($gpuVram -le 0) {
    try {
        # Methode 2: 64-Bit Cast von AdapterRAM
        $rawVram = [long]$gpu.AdapterRAM
        if ($rawVram -lt 0) { $rawVram = $rawVram + [long]::MaxValue + 1 } # Overflow-Korrektur
        if ($rawVram -gt 134217728) { $gpuVram = [math]::Round($rawVram / 1GB, 1) }
    } catch {}
}
if ($gpuVram -le 0 -or $gpuVram -gt 128) { $gpuVram = 2.0 } # Sanity-Check

$mainboard = if ($mb.Manufacturer -and $mb.Product) { "$($mb.Manufacturer.Trim()) $($mb.Product.Trim())" } else { 'Mainboard' }
$mainboard = $mainboard -replace 'Micro-Star International Co\., Ltd\.', 'MSI'
$mainboard = $mainboard -replace 'ASUSTeK COMPUTER INC\.', 'ASUS'
$mainboard = $mainboard -replace 'Gigabyte Technology Co\., Ltd\.', 'Gigabyte'

$totalRamGB = if ($os.TotalVisibleMemorySize) { [math]::Round(($os.TotalVisibleMemorySize / 1MB), 0) } else { 8 }
$osName     = if ($os.Caption) { $os.Caption.Trim() } else { 'Windows 11' }

# Netzwerkadapter
$netName      = if ($net.Name) { $net.Name } else { 'Network Adapter' }
# LinkSpeed ist ein Display-String wie "1 Gbps" oder "72.2 Mbps" – numerisch auslesen
$netSpeedMbps = 1000
if ($net) {
    try {
        # Versuche ReceiveLinkSpeed (in bps, 64-Bit)
        $rawSpeed = $net.ReceiveLinkSpeed
        if ($rawSpeed -and $rawSpeed -gt 0) {
            $netSpeedMbps = [math]::Round($rawSpeed / 1000000)
        } else {
            # Fallback: LinkSpeed-String parsen (z.B. "72.2 Mbps", "1 Gbps")
            $ls = $net.LinkSpeed -replace '[^\d\.]', ' '
            $parts = ($ls.Trim() -split '\s+')
            if ($parts.Count -ge 1) {
                $val = [double]$parts[0]
                if ($net.LinkSpeed -match 'Gbps') { $val = $val * 1000 }
                $netSpeedMbps = [math]::Round($val)
            }
        }
    } catch { $netSpeedMbps = 1000 }
}

$hardwareJsContent = @"
/**
 * Auto-detected hardware profile for this PC.
 * Run 'update-hardware.bat' again after upgrading your hardware.
 */
window.CUSTOM_HARDWARE = {
  cpuName:         "$cpuName",
  cpuCores:        $cpuCores,
  cpuThreads:      $cpuThreads,
  cpuBaseClockMHz: $cpuMaxClock,
  cpuBoostClockMHz:$([math]::Round($cpuMaxClock * 1.05)),
  gpuName:         "$gpuName",
  gpuVendor:       "$($gpu.AdapterCompatibility)",
  gpuVramGB:       $gpuVram,
  mainboard:       "$mainboard",
  totalRamGB:      $totalRamGB,
  osName:          "$osName 64-Bit",
  netAdapterName:  "$netName",
  netSpeedMbps:    $netSpeedMbps
};
"@

$outputPath = Join-Path -Path $PSScriptRoot -ChildPath 'hardware.js'
Set-Content -Path $outputPath -Value $hardwareJsContent -Encoding UTF8
Write-Host "Hardware detected:" -ForegroundColor Green
Write-Host "  CPU:       $cpuName ($cpuCores C / $cpuThreads T)" -ForegroundColor Cyan
Write-Host "  GPU:       $gpuName ($gpuVram GB VRAM)" -ForegroundColor Cyan
Write-Host "  Mainboard: $mainboard" -ForegroundColor Cyan
Write-Host "  RAM:       $totalRamGB GB" -ForegroundColor Cyan
Write-Host "  OS:        $osName" -ForegroundColor Cyan
Write-Host "  Network:   $netName ($netSpeedMbps Mbit/s)" -ForegroundColor Cyan
