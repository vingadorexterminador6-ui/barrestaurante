# WA Guard — Proteção e Gestão de Risco para WhatsApp

Sistema SaaS com tema escuro, autenticação, licenças por código de ativação, dashboard de risco, alertas, histórico e painel de administração.

## Backend (Lovable Cloud)

Vou ativar o Lovable Cloud (banco de dados + autenticação + código de servidor).

Tabelas:
- `profiles` — nome, e-mail, progresso do onboarding (0–4)
- `user_roles` (+ enum `app_role`: admin/user) — papéis em tabela separada, com função `has_role` de segurança
- `license_codes` — código `XXXX-XXXX-XXXX`, plano, estado (disponível/ativo/suspenso/expirado), datas de criação/ativação/expiração, utilizador associado
- `wa_connections` — tipo (messenger/business), estado, identificador mascarado, datas de conexão e sincronização, flag `is_demo`
- `protection_settings` — proteção ativa, automações pausadas, limites configuráveis, notificações
- `risk_snapshots` — pontuação 0–100, nível, fatores (volume, taxa de resposta, denúncias)
- `alerts` — nível, descrição, recomendação, estado novo/resolvido, data
- `activity_log` — data, atividade, estado, risco

Todas com RLS: cada utilizador só vê os seus dados; administradores acedem a tudo via `has_role`. Ativação de licença, criação/suspensão de códigos e recálculo de risco ficam em funções de servidor validadas com Zod, nunca no cliente. Dados de demonstração são semeados na migração.

## Páginas

| Rota | Conteúdo |
|---|---|
| `/` | Landing + login/registo/recuperação de palavra-passe |
| `/ativar` | Ecrã "ATIVE O SEU WA GUARD" com campo de código e validação |
| `/painel` | Estado da conta, licença, cartão grande de NÍVEL DE RISCO (0–100), botão ATIVAR PROTEÇÃO, assistente de boas-vindas com barra de progresso 0/4→4/4 |
| `/conexao` | Conectar WhatsApp Messenger / Business (modo demonstração claramente rotulado até haver credenciais oficiais) |
| `/protecao` | Monitorização, limites de automações permitidas, notificações, MODO EMERGÊNCIA com confirmação "PAUSAR AUTOMAÇÕES" / RETOMAR |
| `/alertas` | Lista de alertas com nível, data/hora, descrição, recomendação, resolver |
| `/historico` | Tabela com filtros (hoje / 7 / 30 dias / personalizado) e gráficos de atividade e evolução do risco |
| `/como-usar` | Os 7 passos + aviso de que nenhum sistema garante imunidade a banimento |
| `/faq` | As 5 perguntas frequentes em acordeão |
| `/admin` | Utilizadores, gestão de códigos (criar/ativar/suspender/copiar, validade, plano), contas conectadas, estatísticas, planos, notificações |

Rotas de utilizador ficam atrás de login; `/admin` exige papel de administrador verificado no servidor.

## Conformidade

Nenhuma tentativa de contornar bloqueios do WhatsApp, nenhum QR code falso e nenhuma API não oficial. A conexão é uma demonstração identificada como tal, com a arquitetura pronta para receber a API oficial do WhatsApp Business depois. O risco é calculado apenas a partir de sinais registados no próprio sistema.

## Design

Tema escuro premium, azul como cor primária, verde/amarelo/vermelho como tokens semânticos de risco, cartões com bordas suaves, animações discretas, gráficos com Recharts, navegação lateral em desktop e inferior/gaveta em mobile.

## Notas técnicas

TanStack Start + React 19, Tailwind v4 com tokens semânticos em `src/styles.css`, formulários validados com Zod nos dois lados, `createServerFn` para toda a lógica de licenças/risco/admin, gráficos com Recharts, notificações com Sonner, metadados `head()` por rota.
