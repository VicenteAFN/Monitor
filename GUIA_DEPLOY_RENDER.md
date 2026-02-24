# Guia de Deploy no Render - Monitor de Água

Se você recebeu o erro **"Saído com o status 127"**, isso significa que o Render não encontrou o comando para iniciar sua aplicação. Siga os passos abaixo para corrigir:

## 1. Configuração do Start Command

No painel do Render, acesse as configurações do seu Web Service e altere o campo **Start Command** para:

```bash
gunicorn app:app
```

*   O primeiro `app` refere-se ao nome do arquivo (`app.py`).
*   O segundo `app` refere-se à variável Flask dentro do arquivo (`app = Flask(__name__)`).

## 2. Arquivos Necessários

Certifique-se de que os seguintes arquivos estão na raiz do seu repositório:

1.  **`app.py`**: O código principal (já atualizado com as personalizações).
2.  **`requirements.txt`**: Deve conter `gunicorn`.
3.  **`templates/`**: Pasta contendo seus arquivos HTML.
4.  **`static/`**: Pasta contendo CSS e JS.

## 3. Personalizações Aplicadas

O sistema já foi configurado com:
*   **Tanque 1**: "Reservatório Principal" (40.000 Litros, 1000x200x200cm).
*   **Tanque 2**: "Caixa D1" (Editável via configurações).
*   **CORS**: Habilitado para permitir que o site exiba os dados corretamente no Render.

## 4. Verificação

Após o deploy, você pode verificar se o backend está respondendo acessando:
`https://seu-site.onrender.com/api/debug`
