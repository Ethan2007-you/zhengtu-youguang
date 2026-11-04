@echo off
if /i "%~1"=="--run" goto run
"%ComSpec%" /d /k ""%~f0" --run"
exit /b

:run
setlocal
cd /d "%~dp0"
echo ==================================================
echo Zhengtu Youguang - Local Launcher
echo ==================================================
echo.
if not exist "%~dp0server.mjs" goto missing_files
if not exist "%~dp0dist\index.html" goto missing_files
set "ZHENGTU_NODE=node.exe"
where node.exe >nul 2>&1
if not errorlevel 1 goto start_server
set "ZHENGTU_NODE=%ProgramFiles%\nodejs\node.exe"
if exist "%ZHENGTU_NODE%" goto start_server
set "ZHENGTU_NODE=%LocalAppData%\Programs\nodejs\node.exe"
if exist "%ZHENGTU_NODE%" goto start_server
goto missing_node

:start_server
echo Node.js detected:
"%ZHENGTU_NODE%" --version
echo.
echo Open this URL in your browser:
echo http://127.0.0.1:4179/
echo.
echo Keep this window open while playing.
echo Press Ctrl+C to stop the server.
echo.
"%ZHENGTU_NODE%" "%~dp0server.mjs"
set "ZHENGTU_EXIT=%errorlevel%"
echo.
echo Server stopped. Exit code: %ZHENGTU_EXIT%
echo If the port is in use, close the other game server.
pause
exit /b %ZHENGTU_EXIT%

:missing_files
echo ERROR: Required game files were not found.
echo Extract the ENTIRE ZIP first. Do not run from inside a ZIP.
echo Keep this CMD file next to server.mjs and the dist folder.
echo Current folder: %CD%
pause
exit /b 1

:missing_node
echo ERROR: Node.js was not found.
echo Install Node.js 22 or newer, then reopen this launcher.
echo Official website: https://nodejs.org/
pause
exit /b 1
