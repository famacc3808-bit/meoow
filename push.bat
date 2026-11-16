@echo off
cd /d "%~dp0"

echo ========================================================
echo  Uploading project to: https://github.com/famacc3808-bit/meoow
echo ========================================================
echo.

git remote set-url origin https://github.com/famacc3808-bit/meoow.git 2>nul || git remote add origin https://github.com/famacc3808-bit/meoow.git
git branch -M main
git add -A
git diff-index --quiet HEAD 2>nul || git commit -m "Milana 18th Birthday Gift Website"

echo.
echo Pushing files to GitHub...
git push -u origin main --force

echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo  [SUCCESS] All files uploaded to GitHub!
    echo  Link: https://github.com/famacc3808-bit/meoow
    echo ========================================================
) else (
    echo ========================================================
    echo  [ERROR] Push failed.
    echo  Please check GitHub authentication for famacc3808-bit.
    echo ========================================================
)

echo.
pause
