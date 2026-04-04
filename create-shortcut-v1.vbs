Set shell = CreateObject("WScript.Shell")
desktopPath = shell.SpecialFolders("Desktop")
Set shortcut = shell.CreateShortcut(desktopPath & "\OpenClaw.lnk")
shortcut.TargetPath = "D:\Projects\openclaw-desktop\OpenClaw桌面版\OpenClaw-win32-x64\OpenClaw.exe"
shortcut.WorkingDirectory = "D:\Projects\openclaw-desktop\OpenClaw桌面版\OpenClaw-win32-x64"
shortcut.IconLocation = "D:\Projects\openclaw-desktop\OpenClaw桌面版\OpenClaw-win32-x64\OpenClaw.exe,0"
shortcut.Save
WScript.Echo "快捷方式已更新"
