@echo off
title CodeNinja - 一键启动

:: ============================================================
::  CodeNinja 个人网站 — 一键启动（含外网穿透）
::  启动顺序: MySQL → Apache → Node.js → ngrok → 浏览器
:: ============================================================

echo.
echo ╔══════════════════════════════════════════════════╗
echo ║     [>] CodeNinja 个人网站 - 一键启动          ║
echo ╚══════════════════════════════════════════════════╝
echo.

:: ==================== 1. MySQL ====================
echo [1/4] 检查 MySQL 服务...
sc query MySQL80 | findstr "RUNNING" >nul 2>&1
if %errorlevel% neq 0 (
    echo   [!] MySQL 未运行，正在启动...
    net start MySQL80 >nul 2>&1
    if %errorlevel% neq 0 (
        echo   [X] MySQL 启动失败！
    ) else (
        echo   [OK] MySQL 已启动
    )
) else (
    echo   [OK] MySQL 已在运行
)

:: ==================== 2. Apache ====================
echo [2/4] 检查 Apache 服务...
sc query Apache2.4 | findstr "RUNNING" >nul 2>&1
if %errorlevel% neq 0 (
    echo   [!] Apache 未运行，正在启动...
    cd /d D:\Apache24\bin
    httpd.exe -k start >nul 2>&1
    if %errorlevel% neq 0 (
        echo   [X] Apache 启动失败！请以管理员身份运行此脚本
        pause
        exit /b 1
    ) else (
        echo   [OK] Apache 已启动（端口 80）
    )
) else (
    echo   [OK] Apache 已在运行（端口 80）
)

:: ==================== 3. Node.js 后端 ====================
echo [3/4] 启动 Node.js 后端...
netstat -ano | findstr ":3000.*LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo   [OK] 后端已在运行（端口 3000）
) else (
    echo   [>] 正在启动后端服务...
    start "Node后端-3000" cmd /k "cd /d D:\Apache24\htdocs\personal\backend && node server.js"
)

:: ==================== 4. ngrok 内网穿透 ====================
echo [4/4] 启动 ngrok 内网穿透...
netstat -ano | findstr ":4040.*LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo   [OK] ngrok 已在运行
) else (
    echo   [Web] 正在启动 ngrok...
    start "ngrok-外网穿透" cmd /k "cd /d G:\ && ngrok.exe http 80"
)

:: ==================== 5. 等待服务就绪 ====================
echo.
echo   等待服务就绪...
timeout /t 5 /nobreak >nul

:: 尝试获取 ngrok 公网地址
set NGROK_URL=
for /f "tokens=*" %%a in ('curl -s http://127.0.0.1:4040/api/tunnels 2^>nul ^| findstr /R "public_url.*ngrok"') do (
    for /f "tokens=2 delims=:" %%b in ("%%a") do (
        set NGROK_URL=%%b
    )
)

:: ==================== 6. 打开浏览器 ====================
echo.
echo ══════════════════════════════════════════════════════
echo.
echo   [Web] 本地访问:
echo      http://localhost
echo      http://localhost/admin/login.html
echo.
if not "%NGROK_URL%"=="" (
    echo   [Web] 外网访问:
    echo      %NGROK_URL%
    echo.
    start http://localhost
    start "" "%NGROK_URL%"
) else (
    echo   [Web] 外网地址请在 ngrok 窗口中查看
    echo.
    start http://localhost
)
echo   [i] ngrok 监控面板:
echo      http://127.0.0.1:4040
echo.
echo   ═══ 运行中的窗口 ═══
echo   > Node后端-3000   (不要关闭)
echo   > ngrok-外网穿透   (不要关闭)
echo.
echo   关闭方法: 在对应窗口按 Ctrl+C
echo ══════════════════════════════════════════════════════
echo.
echo   [OK] 全部启动完成！
echo.

pause
