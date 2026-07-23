@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ======================================== > update-log.txt
echo   UPDATE START %date% %time% >> update-log.txt
echo ======================================== >> update-log.txt

echo.
echo [1/2] clasp push ...
echo y| call clasp push --force >> update-log.txt 2>&1
type update-log.txt
if errorlevel 1 goto err

echo.
echo [2/2] clasp deploy ...
call clasp deploy -i AKfycbwsWj49gmjKr5i43KwvBi1UUKwQglQIqkY51mfGkE-K_Ornzi6yaO5tX6VJAkxyFghZcw >> update-log.txt 2>&1
type update-log.txt
if errorlevel 1 goto err

echo.
echo ========================================
echo   DONE!  ---  Ctrl+Shift+R on /exec
echo ========================================
goto end

:err
echo.
echo *** ERROR --- see update-log.txt (send me a screenshot) ***
type update-log.txt

:end
echo.
pause
