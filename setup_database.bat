@echo off
echo ========================================
echo  SHU IoT Platform - Database Setup
echo ========================================
echo.

REM Prompt for MySQL password
set /p MYSQL_PASSWORD="Enter your MySQL root password: "

echo.
echo Creating database and tables...
echo.

REM Run the SQL file
mysql -u root -p%MYSQL_PASSWORD% < setup_database.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo  Database setup completed successfully!
    echo ========================================
    echo.
    echo You can now run: pnpm dev
    echo.
) else (
    echo.
    echo ========================================
    echo  Error: Database setup failed
    echo ========================================
    echo.
    echo Please check:
    echo   1. MySQL is running
    echo   2. Password is correct
    echo   3. You have admin privileges
    echo.
)

pause
