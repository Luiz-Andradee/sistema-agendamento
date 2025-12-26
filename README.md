# Estúdio Aline Andrade · Agenda Online

## Visão Geral
Sistema completo de agendamento online com painel administrativo, gestão de clientes e integração WhatsApp.

### Principais Funcionalidades
- ✨ **Landing page responsiva** para clientes agendarem serviços
- 🔐 **Autenticação segura** com login/senha para equipe do estúdio
- 👥 **Gestão de clientes** com cadastro, CPF e histórico de atendimentos
- 📅 **Disponibilidade personalizada** por profissional e dia da semana
- 💰 **Controle financeiro** com registro de pagamentos
- 📱 **PWA (Progressive Web App)** - instalável no celular como app nativo
- 📲 **Integração WhatsApp** opcional para notificações automáticas
- 🔄 **Sistema de reagendamento** com aprovação da equipe
- 🚫 **Bloqueios de agenda** para folgas e horários especiais

### Público-Alvo
- **Clientes**: acesso público à landing page (`/`) para agendamentos
- **Equipe interna**: acesso ao painel administrativo (`/painel`) após login

## Stack Técnica
- **Backend Edge**: [Hono](https://hono.dev/) rodando em Cloudflare Pages/Workers
- **Banco de dados**: Cloudflare D1 (SQLite distribuído globalmente na edge)
- **Frontend**: Componentes JSX do Hono + Tailwind CSS (via CDN)
- **Client-side**: Vanilla JavaScript (`public/static/app.js`)
- **Build & Dev**: Vite + `@hono/vite-build` + Wrangler CLI
- **PWA**: Service Worker + Web App Manifest
- **Integrações**: WhatsApp Cloud API + links `wa.me` como fallback

## Estrutura de Diretórios
```
sistema-agendamento/
├── migrations/                    # Migrations do banco D1 (9 arquivos)
│   ├── 0001_initial_schema.sql   # Schema base (professionals, services, appointments)
│   ├── 0002_schedule_and_timeoff.sql  # Disponibilidade personalizada e bloqueios
│   ├── 0003_add_users_table.sql  # Autenticação (usuários)
│   ├── 0004_create_clients_table.sql  # Cadastro de clientes
│   ├── 0005_add_client_notified.sql   # Flag de notificação
│   ├── 0006_add_is_rescheduled.sql    # Flag de reagendamento
│   ├── 0007_add_cpf_to_clients.sql    # CPF dos clientes
│   ├── 0008_add_price_to_appointments.sql  # Preço do agendamento
│   └── 0009_add_paid_at_to_appointments.sql  # Data de pagamento
├── public/
│   ├── icons/                    # Ícones PWA (vários tamanhos)
│   ├── images/                   # Imagens do site
│   ├── static/
│   │   ├── app.js               # Lógica client-side (SPA)
│   │   └── style.css            # Estilos customizados
│   ├── favicon.png
│   ├── manifest.json            # Configuração PWA
│   └── service-worker.js        # Cache offline
├── src/
│   ├── index.tsx                # Rotas Hono + API + renderização SSR
│   ├── renderer.tsx             # Layout base (HTML, meta tags, scripts)
│   └── global.d.ts              # TypeScript definitions
├── seed.sql                     # Dados iniciais (profissionais, serviços, horários)
├── package.json
├── tsconfig.json
├── vite.config.ts
└── wrangler.jsonc               # Configuração Cloudflare (D1, vars, compat)
```

## Banco de Dados (Cloudflare D1)

O projeto possui **9 migrations** que criam as seguintes tabelas:

### Tabelas Principais
- **`professionals`**: Profissionais do estúdio (nome, bio, WhatsApp, avatar)
- **`services`**: Serviços oferecidos (nome, descrição, duração, preço)
- **`service_professionals`**: Relação N×N entre serviços e profissionais
- **`appointments`**: Agendamentos com status, datas, preço e pagamento
- **`appointment_history`**: Histórico de eventos dos agendamentos

### Tabelas de Gestão
- **`users`**: Usuários do sistema para autenticação (username, password)
  - Usuário padrão: **Aline** / **Aline2709#**
- **`clients`**: Cadastro de clientes (nome, telefone, CPF, procedimento padrão)
- **`professional_availability`**: Horários de trabalho por profissional e dia da semana
- **`professional_time_off`**: Bloqueios de agenda (folgas, compromissos)

### Status de Agendamentos
- `pending`: Aguardando confirmação
- `confirmed`: Confirmado pela equipe
- `cancelled`: Cancelado
- `rebook_requested`: Cliente solicitou reagendamento

## Executando Localmente

### Instalação
```bash
npm install
```

### Configurar Banco Local
```bash
# Aplicar todas as 9 migrations
npm run db:migrate:local

# Popular com dados de exemplo
npm run db:seed
```

### Desenvolvimento
```bash
# Opção 1: Desenvolvimento rápido com Vite (sem D1)
npm run dev

# Opção 2: Simular ambiente de produção com D1 local
npm run build
npm run dev:pages:d1
```

Acesse: `http://localhost:3000`

### Scripts Disponíveis
| Comando | Descrição |
| --- | --- |
| `npm run dev` | Desenvolvimento com Vite (hot reload) |
| `npm run dev:pages` | Wrangler Pages dev server |
| `npm run dev:pages:d1` | Pages dev com D1 local |
| `npm run build` | Build de produção (gera `dist/`) |
| `npm run preview` | Preview do build |
| `npm run deploy` | Build + deploy para Cloudflare Pages |
| `npm run deploy:prod` | Deploy com nome do projeto específico |
| `npm run db:migrate:local` | Aplicar migrations localmente |
| `npm run db:migrate:prod` | Aplicar migrations em produção |
| `npm run db:seed` | Popular banco local com dados |
| `npm run db:reset` | Resetar banco local (limpa + migra + seed) |

## Variáveis de Ambiente

### Desenvolvimento Local (`.dev.vars`)
Crie um arquivo `.dev.vars` na raiz (não commitar):

```env
PANEL_TOKEN=seu-token-local
WHATSAPP_TOKEN=token-api-meta
WHATSAPP_PHONE_ID=ID-do-numero-business
STUDIO_PHONE=5547991518816
```

### Produção (Cloudflare Secrets)
Configure via Wrangler CLI:

```bash
wrangler pages secret put PANEL_TOKEN --project-name webapp
wrangler pages secret put WHATSAPP_TOKEN --project-name webapp
wrangler pages secret put WHATSAPP_PHONE_ID --project-name webapp
wrangler pages secret put STUDIO_PHONE --project-name webapp
```

### Descrição das Variáveis
- **`PANEL_TOKEN`**: Token para autenticação no painel (obrigatório em produção)
- **`WHATSAPP_TOKEN`**: Token da API do WhatsApp Cloud (opcional)
- **`WHATSAPP_PHONE_ID`**: ID do número business do WhatsApp (opcional)
- **`STUDIO_PHONE`**: Número do estúdio para links `wa.me` (padrão: 5547991518816)

> **Nota**: Se `WHATSAPP_TOKEN` e `WHATSAPP_PHONE_ID` não estiverem configurados, o sistema funcionará normalmente, mas enviará apenas links manuais `wa.me` ao invés de mensagens automáticas.

## API Endpoints

### Públicos (sem autenticação)
| Endpoint | Método | Descrição |
| --- | --- | --- |
| `/` | GET | Landing page com formulário de agendamento |
| `/login` | GET | Página de login |
| `/api/services` | GET | Lista de serviços ativos |
| `/api/professionals` | GET | Lista de profissionais ativos |
| `/api/availability` | GET | Horários disponíveis (params: professionalId, date, serviceId?, ignoreAppointmentId?) |
| `/api/appointments` | POST | Criar novo agendamento |
| `/api/appointments/:id/rebook-request` | POST | Cliente solicita reagendamento |

### Protegidos (requer autenticação)
| Endpoint | Método | Descrição | Auth |
| --- | --- | --- | --- |
| `/painel` | GET | Painel administrativo | Session |
| `/api/auth/login` | POST | Login (username + password) | - |
| `/api/auth/verify` | POST | Verificar token | Bearer Token |
| `/api/appointments` | GET | Listar agendamentos | Bearer Token |
| `/api/appointments/:id/confirm` | POST | Confirmar agendamento | Bearer Token |
| `/api/appointments/:id/cancel` | POST | Cancelar agendamento | Bearer Token |
| `/api/appointments/:id/rebook-approve` | POST | Aprovar reagendamento | Bearer Token |
| `/api/appointments/:id/mark-paid` | POST | Marcar como pago | Bearer Token |
| `/api/clients` | GET/POST | Gestão de clientes | Bearer Token |
| `/api/clients/:id` | GET/PUT/DELETE | CRUD de cliente específico | Bearer Token |

## Autenticação

### Sistema de Login
- **Página de login**: `/login`
- **Credenciais padrão**: 
  - Usuário: `Aline`
  - Senha: `Aline2709#`
- **Armazenamento**: Session storage no navegador
- **Proteção**: Rotas do painel verificam autenticação

### Alterar Senha (Produção)
```bash
wrangler d1 execute estudio-aline-andrade --command \
  "UPDATE users SET password = 'NOVA_SENHA_SEGURA' WHERE username = 'Aline'"
```

> ⚠️ **IMPORTANTE**: Em produção real, implemente hash de senhas (bcrypt/argon2). A versão atual armazena senhas em texto plano apenas para prototipagem.

## PWA (Progressive Web App)

O sistema é um PWA completo e pode ser instalado como app nativo!

### Recursos PWA
- ✅ **Instalável** no celular e desktop
- ✅ **Funciona offline** (cache de assets estáticos)
- ✅ **Ícones otimizados** para todas as plataformas
- ✅ **Splash screen** customizada
- ✅ **Tema personalizado** (rosa/roxo)

### Instalação
1. Acesse o site pelo navegador do celular
2. Toque em "Adicionar à tela inicial" (iOS) ou "Instalar app" (Android)
3. Use como app nativo!

### Arquivos PWA
- `public/manifest.json` - Configuração do app
- `public/service-worker.js` - Cache e offline
- `public/icons/` - Ícones em vários tamanhos (192x192, 512x512, etc.)

## Integração WhatsApp

### Mensagens Automáticas
Se configurado, o sistema envia mensagens automáticas via WhatsApp Cloud API nos seguintes eventos:
- ✅ **Novo agendamento** criado
- ✅ **Agendamento confirmado** pela equipe
- ✅ **Agendamento cancelado**
- ✅ **Reagendamento aprovado**

### Links Manuais
Independente da API, o sistema sempre gera links `wa.me` pré-preenchidos para:
- Cliente entrar em contato com o estúdio
- Equipe enviar mensagens personalizadas

### Configuração WhatsApp API
1. Crie uma conta no [Meta for Developers](https://developers.facebook.com/)
2. Configure um número business no WhatsApp
3. Obtenha o `WHATSAPP_TOKEN` e `WHATSAPP_PHONE_ID`
4. Configure os secrets no Cloudflare

## Deploy (Cloudflare Pages)

### Pré-requisitos
1. Conta Cloudflare (gratuita)
2. Wrangler CLI instalado: `npm install -g wrangler`
3. Login: `wrangler login`

### Passo a Passo

#### 1. Criar Banco D1
```bash
wrangler d1 create estudio-aline-andrade
```
Copie o `database_id` e atualize em `wrangler.jsonc`.

#### 2. Aplicar Migrations
```bash
npm run db:migrate:prod
```

#### 3. Popular Banco (Opcional)
```bash
wrangler d1 execute estudio-aline-andrade --file=./seed.sql
```

#### 4. Build e Deploy
```bash
npm run deploy
```

#### 5. Configurar Secrets
```bash
wrangler pages secret put PANEL_TOKEN --project-name webapp
wrangler pages secret put WHATSAPP_TOKEN --project-name webapp
wrangler pages secret put WHATSAPP_PHONE_ID --project-name webapp
```

#### 6. Vincular D1 ao Projeto
No Dashboard da Cloudflare:
1. Workers & Pages → webapp → Settings → Functions
2. D1 database bindings → Adicionar:
   - Variable name: `DB`
   - D1 database: `estudio-aline-andrade`

### Atualizações
```bash
npm run deploy  # Faz build + deploy automaticamente
```

### Domínio Customizado
Configure no Dashboard: Workers & Pages → webapp → Custom Domains

## Gestão de Clientes

### Cadastro de Clientes
- Nome completo
- Telefone (formatado)
- CPF (opcional)
- Procedimento padrão
- Tempo médio de atendimento
- Observações

### Benefícios
- ✅ Busca rápida por telefone
- ✅ Auto-preenchimento no agendamento
- ✅ Histórico de atendimentos
- ✅ Tempo personalizado por cliente

## Disponibilidade Personalizada

### Por Profissional
Cada profissional pode ter horários diferentes por dia da semana:
- Segunda a sábado: 09:00 - 19:00
- Intervalos de 30 minutos
- Configurável via banco de dados

### Bloqueios de Agenda
- Folgas programadas
- Compromissos pessoais
- Horários especiais
- Bloqueios por período

## Controle Financeiro

### Registro de Pagamentos
- Preço do serviço salvo no agendamento
- Data/hora do pagamento
- Status: pago/pendente
- Relatórios futuros

## Limitações Conhecidas

### Segurança
- ⚠️ Senhas em texto plano (implementar bcrypt/argon2 em produção)
- ⚠️ Token único para todos os usuários (implementar multi-usuário)

### Funcionalidades
- Sem fuso horário configurável (assume BRT)
- Sem lembretes automáticos (implementar com Cloudflare Queues)
- Sem relatórios financeiros (implementar dashboard)
- Validação de telefone básica

## Próximos Passos

### Curto Prazo
1. ✅ ~~Gestão de clientes~~ (implementado)
2. ✅ ~~Controle de pagamentos~~ (implementado)
3. ✅ ~~PWA completo~~ (implementado)
4. ✅ ~~Disponibilidade personalizada~~ (implementado)

### Médio Prazo
1. **Hash de senhas** (bcrypt/argon2)
2. **Multi-usuário** com permissões granulares
3. **Lembretes automáticos** (WhatsApp/Email 24h antes)
4. **Dashboard financeiro** com relatórios
5. **Exportação de dados** (CSV/PDF)

### Longo Prazo
1. **Upload de fotos** (Cloudflare R2)
2. **Avaliações de clientes**
3. **Programa de fidelidade**
4. **Integração com calendários** (Google Calendar)
5. **Testes automatizados** (Playwright + Vitest)

## Tecnologias e Recursos

### Documentação
- [Cloudflare Pages](https://developers.cloudflare.com/pages/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Hono Framework](https://hono.dev/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [PWA Guide](https://web.dev/progressive-web-apps/)
- [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api/)

### Vantagens da Stack
- ✅ **Grátis** para começar (Cloudflare Free Tier)
- ✅ **Global** - CDN em 300+ cidades
- ✅ **Rápido** - Edge computing (latência < 50ms)
- ✅ **Escalável** - Suporta milhões de requisições
- ✅ **Seguro** - SSL automático + DDoS protection
- ✅ **Simples** - Deploy com um comando

---

💅 **Projeto desenvolvido para o Estúdio Aline Andrade**

Sistema completo de agendamento com tecnologia edge computing da Cloudflare.
Experiência premium de nail design com automações modernas e gestão profissional.
