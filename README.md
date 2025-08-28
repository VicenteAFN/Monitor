No seu computador, abra o terminal dentro da pasta do projeto e siga:

--------------------------
bash
# 1. Ver quais arquivos mudaram
git status

# 2. Marcar para envio
git add .

# 3. Criar um commit com mensagem
git commit -m "Atualiza código e app.py para deploy"

# 4. Enviar para o repositório no GitHub
git push origin main
Se sua branch não for main, substitua pelo nome que aparece no git status.
----------------------------------------

💡 Isso salva seu código no repositório remoto para que o Render possa baixar a versão nova.

☁️ 2. Fazer o Manual Deploy no Render
Depois que o código estiver no GitHub:

Vá em Render e entre no seu serviço.

No menu lateral, clique em Deploys.

Lá em cima, clique no botão Manual Deploy.

Escolha Deploy latest commit.

Aguarde a barra de progresso terminar — o Render vai reconstruir o serviço com seu código novo.