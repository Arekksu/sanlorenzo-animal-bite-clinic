@echo on
echo ===== Starting clinic server =====
cd /d "C:\Users\khris\OneDrive\Documents\GitHub\sanlorenzo-animal-bite-clinic"
echo Current folder:
cd
echo Running app.py using venv python...
"venv\Scripts\python.exe" app.py
echo ===== Server stopped. Press any key to close. =====
pause
