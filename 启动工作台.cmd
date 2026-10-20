@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 个人外贸操作系统

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   未检测到 Node.js。
  echo   请先安装 Node.js 22 或更高版本：https://nodejs.org
  echo.
  pause
  exit /b 1
)

rem 如果服务已经开着，直接打开浏览器，避免重复启动
curl.exe -f -s -o nul --max-time 1 http://127.0.0.1:7788/api/bootstrap >nul 2>nul
if not errorlevel 1 (
  echo.
  echo   服务已经在运行，正在打开 http://127.0.0.1:7788 ...
  start "" http://127.0.0.1:7788
  exit /b 0
)

echo.
echo   正在启动个人外贸操作系统...
echo   数据目录：%~dp0data
echo.

node server.mjs --open
set "CODE=%ERRORLEVEL%"

echo.
if not "%CODE%"=="0" (
  echo   启动失败，错误码 %CODE%。请把上面的报错截图给我。
) else (
  echo   服务已停止。数据已自动保存。
)
pause
