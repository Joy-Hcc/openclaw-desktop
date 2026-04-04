@echo off
chcp 65001 >nul
title OpenClaw 启动器
echo 正在启动 OpenClaw...
echo.

REM 检查端口 18789 是否被占用
netstat -ano | findstr ":18789" >nul
if %errorlevel% equ 0 (
    echo [OK] OpenClaw 服务器已在运行
) else (
    echo [*] 正在启动 OpenClaw 服务器...
    start /min "" cmd /c "openclaw gateway"

    REM 等待服务器就绪
    echo [*] 等待服务器启动...
    :wait_loop
    timeout /t 1 /nobreak >nul
    netstat -ano | findstr ":18789" >nul
    if %errorlevel% neq 0 goto wait_loop
    echo [OK] 服务器已就绪
)

echo.
echo [*] 正在启动桌面客户端...
start "" "%~dp0OpenClaw-win32-x64\OpenClaw.exe"

echo [OK] OpenClaw 已启动！
timeout /t 2 /nobreak >nul
exit
