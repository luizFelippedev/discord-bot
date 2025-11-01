# Discord Advanced Bot

Um bot completo em TypeScript para Discord que combina música, moderação, economia, gravação de voz automática e um dashboard web integrado. Este README traz uma visão geral, requisitos, passos de configuração e um guia rápido de uso para que você consiga subir o projeto sem surpresas.

---

## 📚 Sumário

- [Principais funcionalidades](#-principais-funcionalidades)
- [Arquitetura e pastas](#-arquitetura-e-pastas)
- [Tecnologias utilizadas](#-tecnologias-utilizadas)
- [Requisitos](#-requisitos)
- [Configuração inicial](#-configuração-inicial)
  - [Variáveis de ambiente](#variáveis-de-ambiente)
  - [Prisma (opcional)](#prisma-opcional)
- [Instalação e execução](#-instalação-e-execução)
  - [Modo desenvolvimento](#modo-desenvolvimento)
  - [Build e produção](#build-e-produção)
- [Dashboard Web](#-dashboard-web)
- [Comandos disponíveis](#-comandos-disponíveis)
  - [Música](#música)
  - [Moderação](#moderação)
  - [Economia e níveis](#economia-e-níveis)
  - [Integrações diversas](#integrações-diversas)
- [Serviços internos](#-serviços-internos)
- [Logs e arquivos gerados](#-logs-e-arquivos-gerados)
- [Dúvidas frequentes](#-dúvidas-frequentes)

---

## 🚀 Principais funcionalidades

- **Música avançada**: fila com múltiplas fontes (YouTube/Spotify), loop, volume, letras, busca, controle via dashboard.
- **Moderação inteligente**: filtros automáticos, sistema de avisos escalonados, logs, comandos administrativos dedicados.
- **Economia e progressão**: moeda virtual, recompensas diárias, ranking financeiro, sistema de níveis e XP.
- **Gravação de voz**: detecção automática de canais ativos, captura de áudio e metadados para auditoria posterior.
- **Dashboard web completo**: login com Discord OAuth2, módulos de analytics, música, moderação e overview em tempo real.
- **Arquitetura modular**: separação clara entre handlers, serviços, repositórios e camadas de configuração.

---

## 🧱 Arquitetura e pastas

```
src/
├─ index.ts                  # Ponto de entrada
├─ commands/                 # Slash commands agrupados por domínio
├─ config/                   # Configurações, logger, database manager
├─ dashboard/                # Servidor Express, rotas e views EJS
├─ database/                 # Models (Mongoose) e repositórios
├─ events/                   # Eventos do Discord
├─ handlers/                 # Command/Event/Error handlers
├─ services/                 # Regras de negócio (música, economia, etc.)
├─ types/                    # Declarações globais e augmentations
└─ utils/                    # Funções utilitárias
```

---

## 🛠 Tecnologias utilizadas

- **Node.js** + **TypeScript** (ESM)
- **discord.js v14**
- **Mongoose** (MongoDB)
- **Prisma** (opcional, para serviços que usem banco relacional)
- **Express + EJS** (dashboard web)
- **Passport Discord Strategy** (OAuth2)
- **play-dl / @discordjs/voice / ffmpeg-static** (música e voz)
- **Winston** (logging estruturado)

---

## ✅ Requisitos

| Dependência       | Versão recomendada | Observações                                             |
|-------------------|--------------------|---------------------------------------------------------|
| Node.js           | ≥ 18               | O projeto usa `tsx watch` em modo ESM                   |
| MongoDB           | ≥ 5                | Necessário para economia, níveis, moderação etc.        |
| PostgreSQL*       | Opcional           | Apenas se for usar Prisma (ver seção seguinte)          |
| FFmpeg            | ≥ 4                | `ffmpeg-static` já fornece binário, mas depende do SO   |
| Conta Discord Bot | —                  | Token + client ID + secret para bot + OAuth2 dashboard  |

\* Caso não utilize Prisma, o projeto continua operando normalmente apenas com MongoDB.

---

## 🔧 Configuração inicial

### Variáveis de ambiente

Crie um arquivo `.env` na raiz (baseado em `.env.example`) contendo:

```env
# Discord / Bot
DISCORD_TOKEN=seu_token
CLIENT_ID=client_id_do_bot
DISCORD_CLIENT_SECRET=secret_oauth2
OWNER_ID=seu_id_de_usuario
GUILD_ID=id_do_servidor_para_dev (opcional)
PREFIX=!

# Banco de dados
MONGODB_URI=mongodb://localhost:27017/discord-bot
DATABASE_URL=postgresql://usuario:senha@localhost:5432/discordbot  # Opcional (Prisma)

# Dashboard
PORT=3000
SESSION_SECRET=chave_segura
CALLBACK_URL=http://localhost:3000/callback

# Caminhos
RECORDINGS_PATH=./recordings
LOGS_PATH=./logs

# APIs externas (opcional)
YOUTUBE_API_KEY=...
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...

# Features (opc. false para desativar)
FEATURE_AUTOMOD=true
FEATURE_VOICE_RECORDING=true
FEATURE_LIVE_NOTIFICATION=true
FEATURE_DASHBOARD=true
```

### Prisma (opcional)

Se desejar usar Prisma, complete `prisma/schema.prisma` com um `generator client` e pelo menos um `model`. Exemplo mínimo:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Example {
  id    Int     @id @default(autoincrement())
  name  String
  value Int
}
```

Então execute:

```bash
npx prisma generate
```

> Se não houver modelos, o comando emite um aviso e não gera nada. O bot funciona mesmo sem essa etapa.

---

## 📦 Instalação e execução

### Instalar dependências

```bash
npm install
```

> Execute este comando no mesmo ambiente (Windows ou WSL) em que pretende rodar o bot. Não copie `node_modules` entre plataformas (esbuild/ffmpeg possuem binários específicos).

### Modo desenvolvimento

```bash
npm run dev
```

- Usa `tsx watch` para transpilar e reiniciar automaticamente.
- Conecta MongoDB e (opcionalmente) Prisma na inicialização.
- Faz login no Discord e registra comandos no server de desenvolvimento (se `GUILD_ID` estiver definido).
- Sobe o dashboard em `http://localhost:3000`.

### Build e produção

```bash
npm run build    # gera arquivos em dist/
npm start        # executa dist/index.js com Node
```

Para produção, recomenda-se:

- Process manager (PM2, systemd etc.) para reinícios automáticos.
- Reverse proxy (Nginx/Caddy) caso exponha o dashboard/public API.
- Manter variáveis de ambiente seguras (tokens + segredos).

---

## 🖥 Dashboard Web

| Rota             | Descrição                                            |
|------------------|------------------------------------------------------|
| `/`              | Página inicial com estatísticas gerais               |
| `/dashboard`     | Overview do servidor após login                      |
| `/analytics`     | Métricas de economia, voz e engajamento              |
| `/moderation`    | Gerenciamento rápido de avisos/moderação             |
| `/music`         | Controle da fila musical em tempo real               |

- Autenticação via Passport + Discord OAuth2.
- Sessões persistentes com `express-session`.
- Rate limiting leve para evitar abuso.
- Templates EJS prontos para personalização visual.

---

## 🎮 Comandos disponíveis

A lista abaixo destaca os principais comandos já implementados. Todos são slash commands registrados dinamicamente.

### Música
- `/play <busca|url>` — adiciona e toca músicas da fila.
- `/pause`, `/resume`, `/skip`, `/stop` — controles básicos.
- `/loop` — alterna ciclo atual/fila/desligado.
- `/queue` — mostra fila atual.
- `/lyrics` — exibe letras da música em reprodução.
- `/volume <0-150>` — ajusta volume.
- `/search <termo>` — retorna opções para seleção.
- `/shuffle` — embaralha a fila.
- `/nowplaying` — informa a faixa atual.

### Moderação
- `/ban`, `/kick`, `/mute`, `/warn` — ações administrativas com motivos.
- `/warnings <usuário>` — lista histórico do usuário.
- `/clear <quantidade>` — limpa mensagens em massa.
- `/moderate` — configurações rápidas (ex.: auto-role).
- `/recordings` / `/playback` — acesso às capturas de voz.

### Economia e níveis
- `/economy balance|daily|work|leaderboard` — operações de moeda virtual.
- `/level profile|rank` — exibe progressão de níveis.
- `/games ...` — minigames (ex.: apostas, sorteios).

### Integrações diversas
- `/server-info`, `/user-info` — insights rápidos.
- `/analytics`, `/stats` — dados agregados para o dashboard.
- `/register`, `/verify` — fluxo de onboarding de membros.

---

## 🧩 Serviços internos

| Serviço                     | Responsabilidade principal                                     |
|----------------------------|-----------------------------------------------------------------|
| `MusicService`             | Gerencia fila, players, análise de fontes e notificações.       |
| `VoiceRecordingService`    | Captura sessões de voz, salva metadados e interage com storage. |
| `ModerationService`        | Analisa mensagens, aplica escalonamento e logs disciplinarmente.|
| `EconomyService`           | Contabiliza moedas, prêmios, transações e ranking financeiro.   |
| `LevelingService`          | Calcula XP, detecção de spam, concede níveis e cooldowns.       |
| `DashboardService`         | Compila métricas para visualização no painel web.               |
| `Guild/User/...Repository` | Camada de persistência com Mongoose/Prisma.                     |

Cada serviço é injetado no `Client` (via `ServiceRegistry`) e consumido por comandos/eventos específicos.

---

## 📂 Logs e arquivos gerados

- `logs/` — arquivos de log (Winston) por data/nível.
- `recordings/` — capturas de áudio e JSON de metadados.
- `node_modules/.cache` — cache de compilação (ts-node, prisma, etc.).
- `dist/` — saída do `npm run build`.

> A localização de logs e gravações pode ser alterada via `RECORDINGS_PATH`/`LOGS_PATH`.

---

## ❓ Dúvidas frequentes

**1. Posso rodar sem Prisma?**  
Sim. O projeto tolera ausência do client Prisma; um aviso é emitido e somente funcionalidades dependentes dele ficam indisponíveis. Basta não usar comandos que precisem dele ou criar o schema e gerar o client posteriormente.

**2. O tsconfig está em NodeNext. Posso trocar para CommonJS?**  
Não recomendado, pois todo o código e dependências já assumem ESM. Manter `module`/`moduleResolution` em `NodeNext` evita problemas com `import`/`export`.

**3. Os comandos não aparecem no Discord.**  
Garanta que:
- O bot está com `applications.commands` e permissões corretas.
- `CLIENT_ID` corresponde ao app do bot.
- Em desenvolvimento, defina `GUILD_ID` para registrar os comandos em um servidor específico (registro global pode levar até 1h para refletir).

**4. Esbuild ou ffmpeg reclamam de plataforma errada.**  
Exclua `node_modules` e rode `npm install` diretamente no SO onde o bot vai rodar. Não copie `node_modules` entre Windows/WSL/Linux/macOS.

**5. Como alterar prefixo ou recursos habilitados?**  
Use as variáveis `PREFIX` e `FEATURE_*` no `.env`. Os valores são lidos em tempo de execução.

---

## 📄 Licença

Projeto entregue como base avançada para servidores Discord. Adapte, estenda e personalize conforme as necessidades da sua comunidade.

Se encontrar problemas ou tiver sugestões, fique à vontade para abrir uma issue ou contribuir com PRs.
