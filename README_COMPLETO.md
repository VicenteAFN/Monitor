# Monitor de Água - Sistema Completo

Um sistema moderno e responsivo para monitoramento de níveis de água em tempo real, com autenticação, histórico de consumo e configurações ajustáveis.

## 🚀 Funcionalidades

### ✨ **Principais Características**
- **Sistema de Autenticação** - Login e logout seguros
- **Dashboard em Tempo Real** - Atualização automática a cada 5 segundos
- **Visualização 3D do Reservatório** - Tanque com água animada e bolhas
- **Histórico de Dados** - Armazenamento persistente em SQLite
- **Consumo Diário** - Cálculo automático do consumo por dia
- **Configurações Ajustáveis** - Altere dimensões da caixa pelo site
- **Design Responsivo** - Funciona em desktop, tablet e mobile
- **Alertas Inteligentes** - Notificações de nível baixo/alto
- **Gráficos Interativos** - Histórico de níveis e consumo diário com Chart.js

### 🎨 **Interface Moderna**
- Gradiente azul-roxo de fundo
- Cards com efeito glassmorphism
- Animações suaves e micro-interações
- Ícones Lucide React
- Componentes shadcn/ui
- Layout responsivo com Tailwind CSS

### 🔐 **Sistema de Autenticação**
- **Usuário padrão:** `admin`
- **Senha padrão:** `admin123`
- Sessões persistentes com Flask-Login
- Proteção de rotas sensíveis
- Logout automático por segurança

### 📊 **Dashboard Completo**
- **Nível de Água** - Porcentagem com cores dinâmicas
- **Volume** - Litros atuais e capacidade total
- **Distância** - Medição do sensor em centímetros
- **Status Online/Offline** - Indicador de conexão
- **Última Atualização** - Timestamp da última leitura

### 🏗️ **Configurações do Sistema**
- Altura da Caixa (cm)
- Largura da Caixa (cm)
- Comprimento da Caixa (cm)
- Zona Morta (cm)
- Volume Total (L)
- Alerta Nível Baixo (%)
- Alerta Nível Alto (%)

## 🛠️ **Instalação e Uso**

### **Para Windows:**
1. Extraia o arquivo ZIP em uma pasta
2. Execute o arquivo `executar.bat`
3. Acesse `http://localhost:5000` no navegador
4. Faça login com as credenciais padrão

### **Para Linux/Mac:**
```bash
# Instalar dependências Python
pip3 install -r requirements.txt

# Instalar dependências Node.js
pnpm install

# Fazer build do frontend (se necessário)
pnpm run build

# Iniciar o servidor
python3 app.py
```

## 📡 **API Endpoints**

### **Autenticação**
- `POST /api/login` - Fazer login
- `POST /api/logout` - Fazer logout
- `POST /api/register` - Registrar novo usuário
- `GET /api/user` - Obter usuário atual

### **Dados do Sensor**
- `POST /api/water-level` - Receber dados do ESP32
- `GET /api/latest` - Último registro
- `GET /api/data` - Todos os dados em memória
- `GET /api/history?days=7` - Histórico dos últimos N dias
- `GET /api/daily-consumption?days=30` - Consumo diário

### **Configurações**
- `GET /api/settings` - Obter configurações
- `POST /api/settings` - Salvar configurações

### **Status**
- `GET /api/status` - Status do sistema

## 🔌 **Integração com ESP32**

O sistema recebe dados via POST no endpoint `/api/water-level`:

```json
{
  "distance_cm": 25.5,
  "level_percentage": 75.0,
  "volume_liters": 750.0,
  "status": "online"
}
```

## 🗄️ **Banco de Dados**

### **Tabelas SQLite:**
- `water_history` - Histórico de todas as leituras
- `daily_consumption` - Consumo calculado por dia

### **Arquivos de Configuração:**
- `users.json` - Credenciais de usuários
- `settings.json` - Configurações do sistema
- `water_monitor.db` - Banco de dados SQLite

## 🎯 **Recursos Avançados**

### **Cálculo de Consumo**
- Diferença entre máximo e mínimo do dia
- Estatísticas de nível (máx, mín, média)
- Histórico de 30 dias

### **Alertas Inteligentes**
- Nível baixo (padrão: < 20%)
- Nível alto (padrão: > 90%)
- Cores dinâmicas nos indicadores

### **Visualização do Tanque**
- Representação 3D do reservatório
- Água animada com bolhas
- Cores baseadas no nível atual
- Indicadores de porcentagem

## 🔧 **Configurações Técnicas**

### **Backend (Flask)**
- Python 3.11+
- Flask 2.3.2
- Flask-Login 0.6.3
- Flask-CORS 4.0.0
- SQLite para persistência

### **Frontend (React)**
- React 18
- Vite 6.3.5
- Tailwind CSS
- shadcn/ui components
- Lucide React icons
- Recharts para gráficos

### **Responsividade**
- Breakpoints: mobile (< 768px), tablet (768px-1024px), desktop (> 1024px)
- Grid adaptativo
- Navegação otimizada para touch

## 🚨 **Solução de Problemas**

### **Servidor não inicia:**
- Verifique se a porta 5000 está livre
- Instale as dependências: `pip3 install -r requirements.txt`

### **Frontend não carrega:**
- Execute `pnpm run build` para gerar o build
- Verifique se a pasta `dist` existe

### **Dados não atualizam:**
- Verifique a conexão do ESP32
- Teste o endpoint: `curl -X POST http://localhost:5000/api/water-level`

### **Login não funciona:**
- Use as credenciais padrão: admin/admin123
- Limpe os cookies do navegador

## 📝 **Logs e Debug**

O sistema gera logs detalhados no console:
- Requisições HTTP
- Erros de autenticação
- Operações no banco de dados
- Status de conexão

## 🔄 **Atualizações Futuras**

- [ ] Notificações push
- [ ] Exportação de relatórios
- [ ] API REST completa
- [ ] Múltiplos sensores
- [ ] Dashboard administrativo

## 📞 **Suporte**

Para dúvidas ou problemas:
1. Verifique os logs no console
2. Teste os endpoints da API
3. Confirme as configurações do ESP32
4. Reinicie o sistema se necessário

---

**Desenvolvido com ❤️ para monitoramento inteligente de água**

