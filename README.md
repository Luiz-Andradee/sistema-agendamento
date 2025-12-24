# Estúdio Aline Andrade · Agenda Online

## Visão Geral
- **Objetivo**: oferecer agendamento online para clientes e um painel operacional seguro para a equipe do estúdio.
- **Público**: clientes finais (landing page) e equipe interna (painel em `/painel`).
- **Principais entregas**:
  - Persistência real com **Cloudflare D1** (migrations + seed inicial).
  - Painel protegido por **token administrativo** com modal de login embutido.
  - Cálculo de disponibilidade respeitando a duração completa de cada serviço.
  - Fluxo de reagendamento com modal dedicado e verificação de horários livres.
  - Integração opcional com a **API oficial do WhatsApp Cloud** para mensagens automáticas.

## Stack Técnica
- **Backend Edge**: [Hono](https://hono.dev/) em Cloudflare Pages/Workers.
- **Banco de dados**: Cloudflare D1 (SQLite distribuído na borda).
- **Frontend**: componentes JSX do Hono + Tailwind CDN + script client-side (`public/static/app.js`).
- **Build & Dev**: Vite, `@hono/vite-build`, Wrangler CLI.
- **Integrações**: WhatsApp Cloud API (via `fetch` no Worker) e links `wa.me` como fallback manual.

## Estrutura de Diretórios
```
webapp/
├── migrations/
│   └── 0001_initial_schema.sql   # schema D1 (professionals, services, appointments, history)
├── public/
│   └── static/
│       ├── app.js                # SPA leve (agendamento, painel, modais, integrações)
│       └── style.css             # Estilos customizados + modais
├── seed.sql                      # Carga inicial (profissionais, serviços, relações)
├── src/
│   ├── index.tsx                 # Rotas Hono + API + renderização SSR
│   └── renderer.tsx              # Layout base (meta tags, Tailwind CDN, script)
├── package.json
├── tsconfig.json
├── vite.config.ts
└── wrangler.jsonc                # Configuração Cloudflare (D1, vars, compat)
```

## Executando Localmente
```bash
npm install
npm run db:migrate:local   # aplica migrations no SQLite local do Wrangler
npm run db:seed            # popula dados base (profissionais, serviços)

npm run dev                # desenvolvimento com Vite (frontend rápido)
# ou, para simular Pages + D1 na borda:
npm run build
npm run dev:pages:d1
```

### Scripts Importantes
| Comando | Descrição |
| --- | --- |
| `npm run build` | gera `dist/` com _worker e assets |
| `npm run dev:pages` | `wrangler pages dev dist` em `localhost:3000` |
| `npm run db:migrate:local` | aplica migrations no ambiente local (`.wrangler/state/...`) |
| `npm run db:seed` | executa `seed.sql` contra o banco local |
| `npm run db:migrate:prod` | aplica migrations no D1 de produção (após configurar `database_id`) |

## Banco de Dados (Cloudflare D1)
- **Tabela `professionals`**: cadastro das profissionais (bio, avatar, contato WhatsApp).
- **Tabela `services`**: descrição, duração (min), preço (centavos) e status.
- **Tabela `service_professionals`**: relação N×N serviço ↔ profissional.
- **Tabela `appointments`**: agendamentos com status (`pending`, `confirmed`, `cancelled`, `rebook_requested`), `start_time`, `end_time`, campos de reagendamento e carimbos de tempo.
- **Tabela `appointment_history`**: trilha de eventos (`created`, `confirmed`, `cancelled`, `rebook_requested`, `rebook_approved`).

A migration inicial está em `migrations/0001_initial_schema.sql` e a carga de exemplo em `seed.sql`.

## Variáveis de Ambiente / Segredos
Configure um arquivo `.dev.vars` (não versionado) para desenvolvimento local e use `wrangler pages secret put` em produção:

```
PANEL_TOKEN=defina-um-token-seguro
WHATSAPP_TOKEN=token-api-meta
WHATSAPP_PHONE_ID=ID-do-numero-business
STUDIO_PHONE=5547991518816
```

- `PANEL_TOKEN` é obrigatório para exigir o modal de login no painel.
- `WHATSAPP_TOKEN` e `WHATSAPP_PHONE_ID` habilitam envios automáticos via WhatsApp Cloud API. Se ausentes, o sistema mantém apenas os links manuais `wa.me`.
- `STUDIO_PHONE` permite personalizar o número central do estúdio (usado nos links públicos).

## Endpoints e Autenticação
| Caminho | Método | Descrição | Autenticação |
| --- | --- | --- | --- |
| `/` | GET | Landing page com formulário de agendamento | Público |
| `/painel` | GET | Painel operacional (renderização SSR) | Público (mas exige token no client) |
| `/api/services` | GET | Catálogo de serviços ativos | Público |
| `/api/professionals` | GET | Profissionais ativos | Público |
| `/api/availability?professionalId&date&serviceId?&ignoreAppointmentId?` | GET | Slots livres/ocupados (considerando duração do serviço) | Público |
| `/api/appointments` | GET | Lista ordenada de agendamentos com filtro de status | **Bearer PANEL_TOKEN** |
| `/api/appointments` | POST | Cria novo agendamento | Público |
| `/api/appointments/:id/confirm` | POST | Confirma agendamento | **Bearer PANEL_TOKEN** |
| `/api/appointments/:id/cancel` | POST | Cancela agendamento | **Bearer PANEL_TOKEN** |
| `/api/appointments/:id/rebook-request` | POST | Cliente solicita reagendamento | Público |
| `/api/appointments/:id/rebook-approve` | POST | Equipe define nova data via modal | **Bearer PANEL_TOKEN** |
| `/api/auth/verify` | POST | Valida o token administrativo | **Bearer PANEL_TOKEN** |

## Fluxo de WhatsApp
- **Frontend**: continua gerando links `wa.me` pré-preenchidos para conversas rápidas com o número do estúdio.
- **Backend**: se `WHATSAPP_TOKEN` e `WHATSAPP_PHONE_ID` estiverem configurados, o Worker envia mensagens de texto automáticas (WhatsApp Cloud API) nos eventos:
  - `created`: recebimento da solicitação.
  - `confirmed`: confirmação de horário.
  - `cancelled`: cancelamento.
  - `rebook_approved`: reagendamento confirmado.
- Falhas na API são registradas em log (`console.warn`) sem interromper o fluxo principal.

## Painel Operacional
- **Login protegido**: modal exige `PANEL_TOKEN` (armazenado em `localStorage` após verificação, com fallback para modal se expirar/for inválido).
- **Reagendamento**: modal dedicado carrega a disponibilidade em tempo real (`/api/availability` com `ignoreAppointmentId`) e bloqueia automaticamente horários que não comportem a duração total do serviço.
- **UX**: sem prompts bloqueantes – todas as ações (confirmar, cancelar, reagendar) usam botões e feedback visual.

## Próximos Passos Recomendados
1. **Multicalendário**: permitir bloqueios por período ou turnos personalizados de cada profissional.
2. **Lembretes automáticos**: agendar envios (WhatsApp/email) com 24h/2h de antecedência via Cloudflare Queues + Workers Cron.
3. **Relatórios**: endpoint/exportação de produtividade, taxa de confirmação e serviços mais vendidos.
4. **Uploads de mídias**: integrar Cloudflare R2 para armazenar referências enviadas pelos clientes.
5. **Testes automatizados**: adicionar suites e2e (Playwright) e de API (Vitest) para garantir regressões.

## Deploy (Cloudflare Pages)
1. Defina `cloudflare_project_name` via ferramenta `meta_info` e configure o token de API (`setup_cloudflare_api_key`).
2. `npm run build`
3. `npx wrangler pages deploy dist --project-name <nome>`
4. Secrets obrigatórios em produção:
   - `wrangler pages secret put PANEL_TOKEN`
   - `wrangler pages secret put WHATSAPP_TOKEN`
   - `wrangler pages secret put WHATSAPP_PHONE_ID`
   - (Opcional) `wrangler pages secret put STUDIO_PHONE`
5. Aplique migrations no D1 remoto: `npm run db:migrate:prod`

## Limitações Conhecidas
- Ainda não há autenticação multiusuário ou controle de permissões granular (apenas token único).
- Não há fuso horário configurável — banco armazena data/hora locais (BRT). Ajuste se operar em múltiplas regiões.
- Lembretes e confirmações dependem da API do WhatsApp; considere fallback por e-mail caso a API esteja indisponível.
- Validações de telefone são básicas (somente limpeza de caracteres). Integre biblioteca de formatação se necessário.

---
💅 Projeto desenvolvido para o Estúdio Aline Andrade — experiência premium de nail design com automações modernas. Prosseguir evoluindo com confiança na borda Cloudflare!
