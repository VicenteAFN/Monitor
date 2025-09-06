@echo off
echo ========================================
echo    Monitor de Agua - Sistema Simples
echo ========================================
echo.

echo Verificando dependencias...
py -m pip install -r requirements.txt

echo.
echo ========================================
echo         CREDENCIAIS DE ACESSO
echo ========================================
echo Usuario: admin
echo Senha: admin123
echo ========================================
echo.

echo Iniciando servidor...
echo.
echo Dashboard disponivel em: http://localhost:5000
echo.
echo Pressione Ctrl+C para parar o servidor
echo ========================================
py app.py
pause
