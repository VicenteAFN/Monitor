@echo off
REM Ativa o ambiente virtual
call venv\Scripts\activate

REM Executa o servidor Flask
python app.py

REM Mantém a janela aberta após a execução
pause
