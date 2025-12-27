# Estúdio Aline Andrade · Sistema de Agendamento Online

## 📋 Visão Geral

Sistema completo de agendamento online com painel administrativo responsivo, gestão de clientes, controle financeiro e integração WhatsApp. Desenvolvido com tecnologia edge computing da Cloudflare para máxima performance global.

### ✨ Principais Funcionalidades

#### Para Equipe do Estúdio
- 🔐 **Painel administrativo completo** com autenticação segura
- 👥 **Gestão de clientes** com histórico e dados personalizados
- 💼 **Gestão de funcionários** com horários personalizados
- 💰 **Controle financeiro** com registro de pagamentos
- 📅 **Calendário interativo** com visualização de agendamentos
- 🚫 **Bloqueios de agenda** para folgas e compromissos
- 📊 **Dashboard com métricas** e filtros avançados
- 📱 **100% Mobile-Friendly** - interface otimizada para celular

### 🎨 Design e UX

- **Interface Premium** com design moderno e animações suaves
- **Dark Mode** em todo o painel administrativo
- **Cards Responsivos** que se adaptam a qualquer tela
- **Modais Full-Screen** no mobile para melhor usabilidade
- **Badges de Status** com estilo arredondado consistente
- **Botões Otimizados** para touch em dispositivos móveis

## 🏗️ Arquitetura Técnica

### Stack Principal
- **Backend**: [Hono.js](https://hono.dev/) v4.11+ (Edge Runtime)
- **Banco de Dados**: Cloudflare D1 (SQLite distribuído globalmente)
- **Frontend**: React Components (JSX) + Tailwind CSS
- **Client-Side**: Vanilla JavaScript modular
- **Build Tool**: Vite v6.3+ com plugins Hono
- **Deploy**: Cloudflare Pages/Workers
- **PWA**: Service Worker + Web App Manifest

### Estrutura de Diretórios

```
sistema-agendamento/
├── migrations/                    # 13 migrations do banco D1
│   ├── 0001_initial_schema.sql   # Schema base
│   ├── 0002_schedule_and_timeoff.sql
│   ├── 0003_add_users_table.sql
│   ├── 0004_create_clients_table.sql
│   ├── 0005_add_client_notified.sql
│   ├── 0006_add_is_rescheduled.sql
│   ├── 0007_add_cpf_to_clients.sql
│   ├── 0008_add_price_to_appointments.sql
│   ├── 0009_add_paid_at_to_appointments.sql
│   ├── 0011_add_professional_details.sql
│   ├── 0012_deactivate_legacy_professionals.sql
│   ├── 0013_password_reset_tokens.sql
│   └── 0014_add_security_question.sql
├── public/
│   ├── icons/                    # Ícones PWA (192x192, 512x512)
│   ├── images/                   # Assets do site
│   ├── static/
│   │   ├── auth.js              # Autenticação e login
│   │   ├── clients.js           # Gestão de clientes
│   │   ├── dashboard.js         # Dashboard principal
│   │   ├── dashboard-widgets.js # Widgets e componentes
│   │   ├── employees.js         # Gestão de funcionários
│   │   ├── financial.js         # Controle financeiro
│   │   ├── services.js          # Gestão de serviços
│   │   ├── mobile.js            # Otimizações mobile
│   │   ├── password-reset.js    # Recuperação de senha
│   │   ├── pwa-notifications.js # Notificações PWA
│   │   ├── utils.js             # Funções utilitárias
│   │   └── style.css            # Estilos customizados
│   ├── manifest.json            # Configuração PWA
│   └── service-worker.js        # Cache offline
├── src/
│   ├── components/
│   │   ├── DashboardPage.tsx    # Dashboard com calendário
│   │   ├── ClientsPage.tsx      # Página de clientes
│   │   ├── EmployeesPage.tsx    # Página de funcionários
│   │   ├── ServicesPage.tsx     # Página de serviços
│   │   ├── FinancialPage.tsx    # Página financeira
│   │   └── LoginPage.tsx        # Página de login
│   ├── index.tsx                # Rotas Hono + API
│   ├── renderer.tsx             # Layout base HTML
│   └── global.d.ts              # TypeScript definitions
├── package.json
├── tsconfig.json
├── vite.config.ts
└── wrangler.jsonc               # Config Cloudflare
```

## 💾 Banco de Dados (Cloudflare D1)

### Tabelas Principais

#### `professionals`
Profissionais do estúdio com informações completas:
- `id`, `name`, `bio`, `role`
- `whatsapp`, `cpf`, `address`
- `bank_name`, `bank_account`
- `avatar_color`, `notes`
- `is_active`, `created_at`, `updated_at`

#### `services`
Serviços oferecidos:
- `id`, `name`, `description`
- `duration_minutes`, `price`
- `is_active`, `created_at`, `updated_at`

#### `appointments`
Agendamentos com controle completo:
- `id`, `customer_name`, `customer_phone`
- `service_id`, `professional_id`
- `date`, `time`, `status`
- `price`, `paid_at`
- `is_rescheduled`, `client_notified`
- `notes`, `created_at`, `updated_at`

#### `clients`
Cadastro de clientes:
- `id`, `name`, `phone`, `cpf`
- `default_procedure_id`
- `average_time_minutes`
- `notes`, `created_at`, `updated_at`

#### `users`
Usuários do sistema:
- `id`, `username`, `password`
- `security_question`, `security_answer`
- `created_at`, `updated_at`

#### `professional_availability`
Horários de trabalho personalizados:
- `id`, `professional_id`
- `day_of_week` (0-6)
- `start_time`, `end_time`
- `created_at`

#### `professional_time_off`
Bloqueios de agenda:
- `id`, `professional_id`
- `date`, `start_time`, `end_time`
- `note`, `created_at`

#### `password_reset_tokens`
Tokens para recuperação de senha:
- `id`, `user_id`, `token`
- `expires_at`, `created_at`

### Status de Agendamentos
- `pending` - Aguardando confirmação
- `confirmed` - Confirmado pela equipe
- `cancelled` - Cancelado
- `rebook_requested` - Cliente solicitou reagendamento

## 🚀 Executando Localmente

### 1. Instalação
```bash
npm install
```

### 2. Configurar Banco Local
```bash
# Aplicar todas as migrations
npm run db:migrate:local

# Popular com dados de exemplo
npm run db:seed
```

### 3. Desenvolvimento
```bash
# Opção 1: Desenvolvimento rápido com Vite (hot reload)
npm run dev

# Opção 2: Ambiente completo com D1 local
npm run build
npm run dev:pages:d1
```

Acesse: `http://localhost:3000`

### Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Dev server com Vite (hot reload) |
| `npm run dev:pages` | Wrangler Pages dev server |
| `npm run dev:pages:d1` | Pages dev com D1 local |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build |
| `npm run db:migrate:local` | Aplicar migrations localmente |
| `npm run db:migrate:prod` | Aplicar migrations em produção |
| `npm run db:seed` | Popular banco local |
| `npm run db:reset` | Resetar banco (limpa + migra + seed) |
| `npm run db:backup` | Backup do banco |

## 🔐 Autenticação

### Credenciais Padrão
- **Usuário**: `Aline`
- **Senha**: `Aline2709#`

### Recuperação de Senha
O sistema possui fluxo completo de recuperação:
1. Pergunta de segurança configurável
2. Geração de token temporário
3. Reset de senha com validação

### Alterar Senha (Produção)
```bash
wrangler d1 execute estudio-aline-andrade --command \
  "UPDATE users SET password = 'NOVA_SENHA' WHERE username = 'Aline'"
```

> ⚠️ **Segurança**: Implementar hash de senhas (bcrypt) em produção real.

## 🌐 API Endpoints

### Públicos (sem autenticação)

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/` | GET | Landing page de agendamento |
| `/login` | GET | Página de login |
| `/api/services` | GET | Lista de serviços ativos |
| `/api/professionals` | GET | Lista de profissionais ativos |
| `/api/availability` | GET | Horários disponíveis |
| `/api/appointments` | POST | Criar agendamento |
| `/api/appointments/:id/rebook-request` | POST | Solicitar reagendamento |

### Protegidos (requer Bearer Token)

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/painel` | GET | Painel administrativo |
| `/api/auth/login` | POST | Login (username + password) |
| `/api/auth/verify` | POST | Verificar token |
| `/api/auth/reset-password` | POST | Resetar senha |
| `/api/appointments` | GET | Listar agendamentos |
| `/api/appointments/:id/confirm` | POST | Confirmar agendamento |
| `/api/appointments/:id/cancel` | POST | Cancelar agendamento |
| `/api/appointments/:id/rebook-approve` | POST | Aprovar reagendamento |
| `/api/appointments/:id/mark-paid` | POST | Marcar como pago |
| `/api/clients` | GET/POST | Gestão de clientes |
| `/api/clients/:id` | GET/PUT/DELETE | CRUD de cliente |
| `/api/professionals` | GET/POST | Gestão de funcionários |
| `/api/professionals/:id` | PUT/DELETE | CRUD de funcionário |
| `/api/services` | POST/PUT/DELETE | Gestão de serviços |

## 📱 Progressive Web App (PWA)

### Recursos PWA
- ✅ **Instalável** em iOS, Android e Desktop
- ✅ **Funciona offline** com cache de assets
- ✅ **Ícones otimizados** (192x192, 512x512)
- ✅ **Splash screen** customizada
- ✅ **Tema personalizado** (rosa/roxo)
- ✅ **Notificações** (em desenvolvimento)

### Como Instalar
1. Acesse o site pelo navegador
2. Toque em "Adicionar à tela inicial" (iOS) ou "Instalar app" (Android)
3. Use como app nativo!

### Arquivos PWA
- `public/manifest.json` - Configuração do app
- `public/service-worker.js` - Cache e offline
- `public/icons/` - Ícones em vários tamanhos

## 💬 Integração WhatsApp

### Mensagens Automáticas
O sistema envia mensagens automáticas via WhatsApp Cloud API:
- ✅ Novo agendamento criado
- ✅ Agendamento confirmado
- ✅ Agendamento cancelado
- ✅ Reagendamento aprovado

### Links Manuais
Sempre disponível, independente da API:
- Links `wa.me` pré-preenchidos
- Botões WhatsApp em todos os cards
- Comunicação direta com clientes

### Configuração
1. Criar conta no [Meta for Developers](https://developers.facebook.com/)
2. Configurar número business
3. Obter `WHATSAPP_TOKEN` e `WHATSAPP_PHONE_ID`
4. Configurar secrets no Cloudflare

## 📱 Otimizações Mobile

### Interface Mobile-First
- **Cards Responsivos**: Tabelas se transformam em cards no mobile
- **Modais Full-Screen**: Melhor experiência em telas pequenas
- **Headers Sticky**: Navegação sempre visível
- **Botões Fixed**: Ações principais sempre acessíveis
- **Inputs Otimizados**: Campos visíveis com fundo branco e texto escuro

### Páginas Otimizadas
- ✅ **Dashboard**: Cards de agendamento com layout adaptativo
- ✅ **Funcionários**: Lista em cards + modal full-screen
- ✅ **Serviços**: Cards com ações inline
- ✅ **Clientes**: Modal full-screen com scroll
- ✅ **Financeiro**: Cards com status e valores

### Componentes Mobile
- Status badges arredondados consistentes
- Botão WhatsApp posicionado no topo direito
- Scroll horizontal em tabelas de horários
- Inputs de tempo com largura adequada

## 🎯 Funcionalidades Detalhadas

### Dashboard
- **Calendário Interativo**: Navegação por mês com seleção de data
- **Filtros Avançados**: Por status (todos, pendentes, confirmados, cancelados)
- **Cards de Agendamento**: Com todas as informações e ações
- **Novo Agendamento Interno**: Modal para equipe criar agendamentos
- **Busca de Clientes**: Por nome, telefone ou CPF
- **Integração WhatsApp**: Botão direto em cada card

### Gestão de Clientes
- Cadastro completo com CPF
- Procedimento padrão e tempo médio
- Busca rápida por telefone
- Histórico de atendimentos
- Observações personalizadas
- Modal full-screen no mobile

### Gestão de Funcionários
- Dados completos (CPF, endereço, banco)
- Horários personalizados por dia da semana
- Bloqueios de agenda (folgas, compromissos)
- Cor de avatar personalizada
- Tabela de disponibilidade com scroll horizontal

### Gestão de Serviços
- Nome, descrição e duração
- Preço configurável
- Ativação/desativação
- Cards mobile com ações inline

### Controle Financeiro
- Registro de pagamentos
- Data/hora do pagamento
- Status pago/pendente
- Filtro por profissional
- Cards mobile com valores destacados

## ☁️ Deploy (Cloudflare Pages)

### Pré-requisitos
1. Conta Cloudflare (gratuita)
2. Wrangler CLI: `npm install -g wrangler`
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
npm run build
wrangler pages deploy dist --project-name webapp
```

#### 5. Configurar Secrets
```bash
wrangler pages secret put PANEL_TOKEN --project-name webapp
wrangler pages secret put WHATSAPP_TOKEN --project-name webapp
wrangler pages secret put WHATSAPP_PHONE_ID --project-name webapp
wrangler pages secret put STUDIO_PHONE --project-name webapp
```

#### 6. Vincular D1
No Dashboard da Cloudflare:
1. Workers & Pages → webapp → Settings → Functions
2. D1 database bindings → Adicionar:
   - Variable name: `DB`
   - D1 database: `estudio-aline-andrade`

### Variáveis de Ambiente

| Variável | Descrição | Obrigatório |
|----------|-----------|-------------|
| `PANEL_TOKEN` | Token de autenticação | Sim (produção) |
| `WHATSAPP_TOKEN` | Token WhatsApp Cloud API | Não |
| `WHATSAPP_PHONE_ID` | ID do número business | Não |
| `STUDIO_PHONE` | Número do estúdio | Sim |

### Atualizações
```bash
npm run build
wrangler pages deploy dist --project-name webapp
```

### Domínio Customizado
Configure no Dashboard: Workers & Pages → webapp → Custom Domains

## 🔧 Desenvolvimento

### Estrutura de Componentes
- **React Components** (TSX): Renderização server-side
- **JavaScript Modules**: Lógica client-side modular
- **Tailwind CSS**: Estilos via CDN
- **Custom CSS**: Estilos específicos em `style.css`

### Padrões de Código
- Componentes funcionais React
- Async/await para operações assíncronas
- Modularização de funções JavaScript
- Comentários descritivos
- Tratamento de erros consistente

### Boas Práticas
- ✅ Mobile-first design
- ✅ Acessibilidade (ARIA labels)
- ✅ Performance (edge computing)
- ✅ SEO otimizado
- ✅ PWA completo

## ⚠️ Limitações Conhecidas

### Segurança
- Senhas em texto plano (implementar bcrypt em produção)
- Token único para todos os usuários
- Sem rate limiting

### Funcionalidades
- Sem fuso horário configurável (assume BRT)
- Sem lembretes automáticos
- Sem relatórios financeiros avançados
- Validação de telefone básica

## 🗺️ Roadmap

### ✅ Implementado
- [x] Gestão de clientes
- [x] Controle de pagamentos
- [x] PWA completo
- [x] Disponibilidade personalizada
- [x] Otimização mobile 100%
- [x] Recuperação de senha
- [x] Bloqueios de agenda

### 🚧 Em Desenvolvimento
- [ ] Hash de senhas (bcrypt)
- [ ] Notificações PWA
- [ ] Dashboard financeiro
- [ ] Relatórios exportáveis

### 📋 Planejado
- [ ] Multi-usuário com permissões
- [ ] Lembretes automáticos
- [ ] Integração Google Calendar
- [ ] Upload de fotos (R2)
- [ ] Avaliações de clientes
- [ ] Programa de fidelidade
- [ ] Testes automatizados

## 📚 Recursos e Documentação

### Tecnologias
- [Cloudflare Pages](https://developers.cloudflare.com/pages/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Hono Framework](https://hono.dev/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [PWA Guide](https://web.dev/progressive-web-apps/)
- [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api/)

### Vantagens da Stack
- ✅ **Grátis** para começar (Free Tier generoso)
- ✅ **Global** - CDN em 300+ cidades
- ✅ **Rápido** - Edge computing (<50ms latência)
- ✅ **Escalável** - Milhões de requisições
- ✅ **Seguro** - SSL automático + DDoS protection
- ✅ **Simples** - Deploy com um comando

## 🤝 Contribuindo

### Como Contribuir
1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

### Padrões de Commit
- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Documentação
- `style:` - Formatação
- `refactor:` - Refatoração
- `test:` - Testes
- `chore:` - Manutenção

## 📄 Licença

Este projeto foi desenvolvido para uso exclusivo do **Estúdio Aline Andrade**.

---

💅 **Estúdio Aline Andrade**

Sistema completo de agendamento com tecnologia edge computing da Cloudflare.
Experiência premium de nail design com automações modernas e gestão profissional.

**Desenvolvido com ❤️ usando Hono.js + Cloudflare D1**
