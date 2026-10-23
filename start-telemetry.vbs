Set WshShell = CreateObject("WScript.Shell")
scriptDir = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\"))
psFile = scriptDir & "live-telemetry.ps1"
' BUG-K fix: -NoProfile hinzugefügt, Triple-Quotes für Pfade mit Leerzeichen korrekt
WshShell.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & psFile & """", 0, False
