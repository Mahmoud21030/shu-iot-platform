@echo off
echo ========================================
echo  SHU IoT Platform - Device Simulators
echo ========================================
echo.
echo Starting all IoT device simulators...
echo.

REM Set default values if environment variables are not set
if "%PLATFORM_URL%"=="" set PLATFORM_URL=http://localhost:3000
if "%UPDATE_INTERVAL%"=="" set UPDATE_INTERVAL=10

echo Platform URL: %PLATFORM_URL%
echo Update Interval: %UPDATE_INTERVAL% seconds
echo.

REM Start Temperature Sensors
start "Temperature Sensor 1" python device_simulator.py --url %PLATFORM_URL% --device-id temp-001 --name "Temperature Sensor 1" --type temperature --location "Main Hall" --interval %UPDATE_INTERVAL%

start "Temperature Sensor 2" python device_simulator.py --url %PLATFORM_URL% --device-id temp-002 --name "Temperature Sensor 2" --type temperature --location "Library" --interval %UPDATE_INTERVAL%

start "Temperature Sensor 3" python device_simulator.py --url %PLATFORM_URL% --device-id temp-003 --name "Temperature Sensor 3" --type temperature --location "Cafeteria" --interval %UPDATE_INTERVAL%

REM Start Humidity Sensors
start "Humidity Sensor 1" python device_simulator.py --url %PLATFORM_URL% --device-id hum-001 --name "Humidity Sensor 1" --type humidity --location "Main Hall" --interval %UPDATE_INTERVAL%

start "Humidity Sensor 2" python device_simulator.py --url %PLATFORM_URL% --device-id hum-002 --name "Humidity Sensor 2" --type humidity --location "Library" --interval %UPDATE_INTERVAL%

REM Start Occupancy Sensors
start "Occupancy Sensor 1" python device_simulator.py --url %PLATFORM_URL% --device-id occ-001 --name "Occupancy Sensor 1" --type occupancy --location "Lecture Hall A" --interval 15

start "Occupancy Sensor 2" python device_simulator.py --url %PLATFORM_URL% --device-id occ-002 --name "Occupancy Sensor 2" --type occupancy --location "Lecture Hall B" --interval 15

REM Start Smart Lighting
start "Smart Light 1" python device_simulator.py --url %PLATFORM_URL% --device-id light-001 --name "Smart Light 1" --type lighting --location "Main Hall" --interval 20

start "Smart Light 2" python device_simulator.py --url %PLATFORM_URL% --device-id light-002 --name "Smart Light 2" --type lighting --location "Library" --interval 20

start "Smart Light 3" python device_simulator.py --url %PLATFORM_URL% --device-id light-003 --name "Smart Light 3" --type lighting --location "Cafeteria" --interval 20

echo.
echo ========================================
echo  All simulators started successfully!
echo ========================================
echo.
echo You should see 10 new windows, each running a simulator.
echo.
echo To stop all simulators:
echo   1. Close this window, OR
echo   2. Press any key below
echo.
echo ========================================
pause

REM Kill all simulator processes when user presses a key
echo.
echo Stopping all simulators...
taskkill /F /FI "WINDOWTITLE eq Temperature*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Humidity*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Occupancy*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Smart Light*" >nul 2>&1
echo All simulators stopped.
echo.
pause
