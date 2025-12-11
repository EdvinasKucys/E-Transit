@echo off
echo Starting E-Transit application (backend + frontend)...
echo.

REM Start .NET Backend
echo Starting .NET Backend from ./backend/api...
cd /d "backend\api"
start "Backend API" cmd /c "dotnet run"
cd /d "..\.."

REM Wait a bit for backend to start
timeout /t 5 /nobreak >nul

REM Start React Frontend
echo Starting React Frontend from ./frontend/client...
cd /d "frontend\client"
start "React Frontend" cmd /c "npm run dev"
cd /d "..\.."

echo.
echo Services are starting...
echo - Backend API: https://localhost:5011
echo - Frontend: http://localhost:5173
echo.
echo Press any key to close this window (services will continue running)...
pause >nul