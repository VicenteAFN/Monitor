# Guia de Deploy no Render - Monitor de Água (Tanque Único)

Este guia foi atualizado para o sistema de monitoramento de água com **apenas um tanque (Reservatório Principal)**.

Se você recebeu o erro **"Saído com o status 127"** em um deploy anterior, isso significa que o Render não encontrou o comando para iniciar sua aplicação. Siga os passos abaixo para corrigir:

## 1. Configuração do Start Command

No painel do Render, acesse as configurações do seu Web Service e altere o campo **Start Command** para:

```bash
gunicorn app:app
```

*   O primeiro `app` refere-se ao nome do arquivo (`app.py`).
*   O segundo `app` refere-se à variável Flask dentro do arquivo (`app = Flask(__name__)`).

## 2. Arquivos Necessários

Certifique-se de que os seguintes arquivos e pastas estão na raiz do seu repositório:

1.  **`app.py`**: O código principal (já atualizado para tanque único).
2.  **`requirements.txt`**: Deve conter `gunicorn`.
3.  **`templates/`**: Pasta contendo seu arquivo `index_single_tank.html` e `login.html`.
4.  **`static/`**: Pasta contendo CSS e JS.
5.  **`settings_multi.json`**: Arquivo de configurações para o tanque único.

## 3. Personalizações Aplicadas

O sistema já foi configurado com:
*   **Tanque Único**: "Reservatório Principal"
*   **Volume**: 40.000 Litros
*   **Dimensões**: 1000cm (altura) x 200cm (largura) x 200cm (comprimento).
*   **CORS**: Habilitado para permitir que o site exiba os dados corretamente no Render.

## 4. Verificação Pós-Deploy

Após o deploy, você pode verificar se o backend está respondendo acessando:
`https://seu-site.onrender.com/api/debug`

E o site principal em:
`https://seu-site.onrender.com/`

Login: `admin` / Senha: `admin123`
