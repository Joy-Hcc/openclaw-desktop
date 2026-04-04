$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\OpenClaw.lnk")
$Shortcut.TargetPath = "D:\Projects\openclaw-desktop\OpenClaw桌面版\OpenClaw-win32-x64\OpenClaw.exe"
$Shortcut.WorkingDirectory = "D:\Projects\openclaw-desktop\OpenClaw桌面版\OpenClaw-win32-x64"
$Shortcut.IconLocation = "D:\Projects\openclaw-desktop\OpenClaw桌面版\OpenClaw-win32-x64\OpenClaw.exe,0"
$Shortcut.Save()
Write-Host "快捷方式已创建到桌面"
