# Monitor de Água - Dashboard

Sistema de monitoramento em tempo real para reservatório de água com interface web moderna e responsiva.

## 📋 Pré-requisitos

### Windows
- Python 3.8 ou superior
- Node.js 16 ou superior (opcional, apenas se quiser modificar o frontend)

## 🚀 Instalação e Execução

### 1. Baixar o projeto
Extraia todos os arquivos em uma pasta de sua escolha.

### 2. Instalar dependências Python
Abra o Prompt de Comando (cmd) ou PowerShell na pasta do projeto e execute:

```bash
pip install -r requirements.txt
```

### 3. Executar o servidor
```bash
python app.py
```

### 4. Acessar o dashboard
Abra seu navegador e acesse: `http://localhost:5000`

## 📊 Funcionalidades

- **Dashboard em tempo real**: Visualização dos dados do reservatório
- **Atualização automática**: Interface atualiza a cada 5 segundos
- **Design responsivo**: Funciona em desktop, tablet e mobile
- **Visualização do tanque**: Representação gráfica do nível de água com cores dinâmicas
- **Informações técnicas**: Configurações do sistema e status

## 🔧 Configuração do ESP32

O sistema está configurado para receber dados do ESP32 via LoRa com as seguintes especificações:

### Configurações do Hardware
- **Altura do tanque**: 100 cm
- **Volume máximo**: 1000 L
- **Zona morta**: 5 cm
- **Frequência LoRa**: 915 MHz

### Endpoint da API
O ESP32 deve enviar dados via POST para: `http://SEU_IP:5000/api/water-level`

Formato JSON esperado:
```json
{
  "distance_cm": 25.5,
  "level_percentage": 75.2,
  "volume_liters": 752,
  "status": "online"
}
```

## 📱 Interface

### Cards Principais
- **Nível de Água**: Percentual da capacidade do reservatório
- **Volume**: Volume atual em litros
- **Distância**: Distância do sensor à superfície da água

### Visualização do Reservatório
- Representação gráfica do tanque com água
- Cores dinâmicas baseadas no nível:
  - 🟢 Verde: ≥ 70% (nível alto)
  - 🟡 Amarelo: 30-69% (nível médio)
  - 🔴 Vermelho: < 30% (nível baixo)
- Efeitos visuais de água com animações

### Status do Sistema
- Indicador de conexão (Online/Offline)
- Timestamp da última atualização
- Informações técnicas do sistema

## 🌐 Endpoints da API

- `GET /` - Dashboard principal
- `POST /api/water-level` - Receber dados do sensor
- `GET /api/data` - Consultar todos os dados
- `GET /api/latest` - Consultar último registro
- `GET /api/status` - Status do sistema

## 🛠️ Desenvolvimento

### Modificar o Frontend
Se quiser personalizar a interface:

1. Instalar dependências do Node.js:
```bash
npm install
```

2. Executar em modo de desenvolvimento:
```bash
npm run dev
```

3. Fazer build para produção:
```bash
npm run build
```

## 📝 Notas Importantes

- O servidor mantém apenas os últimos 100 registros na memória
- Para uso em produção, considere usar um banco de dados
- O sistema está configurado para aceitar conexões de qualquer IP (CORS habilitado)
- Para acessar de outros dispositivos na rede, substitua `localhost` pelo IP do computador

## 🔍 Solução de Problemas

### Erro "Port 5000 is in use"
Se a porta 5000 estiver em uso, você pode:
1. Fechar outros programas que usam a porta 5000
2. Ou modificar a porta no arquivo `app.py` (linha final)

### ESP32 não consegue enviar dados
1. Verifique se o IP no código do ESP32 está correto
2. Certifique-se de que o computador e ESP32 estão na mesma rede
3. Verifique se o firewall do Windows não está bloqueando a porta 5000

### Interface não carrega
1. Certifique-se de que o arquivo `dist/index.html` existe
2. Se não existir, execute `npm run build` para gerar os arquivos

## 📞 Suporte

Em caso de dúvidas ou problemas, verifique:
1. Se todas as dependências foram instaladas corretamente
2. Se o Python está na versão correta
3. Se não há conflitos de porta
4. Se o firewall não está bloqueando as conexões

