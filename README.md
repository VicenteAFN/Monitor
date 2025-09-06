# Monitor de Água - Sistema Simples

Este é um sistema de monitoramento de nível de água simples, construído com Flask (backend) e HTML, CSS, JavaScript puro (frontend). Ele não requer um processo de build complexo, sendo ideal para uso em ambientes Windows.

# 1. Ver quais arquivos mudaram
git status

# 2. Marcar para envio
git add .

# 3. Criar um commit com mensagem
git commit -m "Atualiza código e app.py para deploy"

# 4. Enviar para o repositório no GitHub
git push origin main
Se sua branch não for main, substitua pelo nome que aparece no git status.


## Funcionalidades

- **Dashboard em Tempo Real**: Exibe o nível de água em porcentagem, volume em litros e distância do sensor em centímetros.
- **Visualização do Reservatório**: Animação do tanque de água com cores dinâmicas baseadas no nível.
- **Histórico de Dados**: Gráfico interativo mostrando o histórico do nível e volume de água.
- **Configurações**: Permite ajustar parâmetros do tanque e limites de alerta.
- **Autenticação**: Sistema de login simples para acesso seguro.

## Como Executar (Windows)

1.  **Extraia** o conteúdo do arquivo `water-monitor-simple.zip` para uma pasta de sua escolha.
2.  **Navegue** até a pasta extraída no seu terminal (CMD ou PowerShell).
3.  **Execute** o arquivo `executar.bat`.

    ```bash
    executar.bat
    ```

    Este script fará o seguinte:
    - Criará um ambiente virtual (se ainda não existir).
    - Instalará as dependências Python listadas em `requirements.txt`.
    - Iniciará o servidor Flask.

4.  **Acesse** o site no seu navegador:

    ```
    http://localhost:5000
    ```

## Credenciais Padrão

- **Usuário**: `admin`
- **Senha**: `admin123`

## Estrutura do Projeto

```
water-monitor-simple/
├── app.py                # Aplicação Flask principal
├── requirements.txt      # Dependências Python
├── executar.bat          # Script para iniciar no Windows
├── Procfile              # (Opcional) Para deploy em plataformas como Heroku
├── settings.json         # Configurações do tanque e alertas
├── users.json            # Usuários do sistema
├── water_monitor.db      # Banco de dados SQLite (histórico de dados)
├── static/               # Arquivos estáticos (CSS, JS)
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── main.js
└── templates/            # Modelos HTML
    ├── base.html
    ├── index.html
    └── login.html
```

## API Endpoints

- `POST /api/water-level`: Recebe dados do sensor (ESP32).
- `GET /api/latest`: Retorna os dados mais recentes.
- `GET /api/history`: Retorna o histórico de dados.
- `GET /api/settings`: Retorna as configurações atuais.
- `POST /api/settings`: Salva novas configurações.
- `GET /api/status`: Retorna o status do sistema.

## Contribuição

Sinta-se à vontade para contribuir com melhorias, correções de bugs ou novas funcionalidades. Abra uma issue ou envie um pull request.

