@echo off
echo Stopping E-Transit application services (backend + frontend)...
echo.

REM Stop .NET Backend - Comprehensive approach
echo Stopping .NET Backend...

REM Method 1: Kill by specific ports (our known backend ports)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5011') do (
    taskkill /PID %%a /F >nul 2>&1 && echo Stopped process on port 5011 (PID: %%a)
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :7261') do (
    taskkill /PID %%a /F >nul 2>&1 && echo Stopped process on port 7261 (PID: %%a)
)

REM Method 2: Kill any dotnet process that might be our backend
timeout /t 1 /nobreak >nul
taskkill /F /IM dotnet.exe >nul 2>&1 && echo Stopped all dotnet processes

REM Stop React Frontend
echo Stopping React Frontend...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do (
    taskkill /PID %%a /F >nul 2>&1 && echo Stopped process on port 5173 (PID: %%a)
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    taskkill /PID %%a /F >nul 2>&1 && echo Stopped process on port 3000 (PID: %%a)
)

REM Kill any remaining node processes
timeout /t 1 /nobreak >nul
taskkill /F /IM node.exe >nul 2>&1 && echo Stopped all node processes

echo.
echo Backend and frontend services have been stopped.
echo.
pause