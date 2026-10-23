@echo off
REM Rebuild the pyd-100 wheel and reinstall it into the active Python env.
REM Run from anywhere: the script changes to its own folder first.

setlocal
cd /d "%~dp0"

echo.
echo === [1/3] Ensure 'build' is installed ===
python -m pip install --quiet --upgrade build
if errorlevel 1 goto :fail

echo.
echo === [2/3] Build wheel ===
if exist dist rmdir /s /q dist
python -m build --wheel
if errorlevel 1 goto :fail

echo.
echo === [3/3] Install wheel ===
for %%f in (dist\pyd_100-*.whl) do (
    python -m pip install --force-reinstall "%%f"
    if errorlevel 1 goto :fail
    goto :done
)

echo ERROR: No wheel found in dist\
goto :fail

:done
echo.
echo pyd-100 built and installed successfully.
endlocal
exit /b 0

:fail
echo.
echo pyd-100 build failed.
endlocal
exit /b 1
