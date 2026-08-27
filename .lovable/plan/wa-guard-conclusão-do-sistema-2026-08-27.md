# WA Guard — conclusão do sistema

A base já está feita: banco de dados criado (perfis, papéis, licenças, conexões, proteção, snapshots de risco, alertas, histórico) com RLS por utilizador e acesso de administrador, tema escuro premium em `src/styles.css` e a biblioteca de cálculo de risco em `src/lib/waguard-core.ts`.

Falta construir a aplicação em si.

## Autenticação e licenças

- `/` — landing com logo WA Guard, entrar / criar conta / recuperar palavra-passe (validação Zod nos dois lados).
- Login com Google além de e-mail e palavra-passe.
- `/ativar` — "ATIVE O SEU WA GUARD", campo `XXXX-XXXX-XXXX` com máscara e botão ATIVAR SISTEMA; validação da licença no servidor, nunca no cliente.

## Páginas do utilizador (protegidas)

| Rota | Conteúdo |
|---|---|
| `/painel` | Estado da conta, licença, cartão grande NÍVEL DE RISCO (0–100 com nível baixo/atenção/alto), botão ATIVAR PROTEÇÃO e assistente de boas-vindas 0/4 → 4/4 |
| `/conexao` | CONECTAR WHATSAPP e CONECTAR WHATSAPP BUSINESS, em modo demonstração claramente rotulado até existirem credenciais oficiais |
| `/protecao` | Monitorização, alertas de comportamento anormal, limites de automações permitidas, pausa de campanhas, notificações e MODO EMERGÊNCIA com confirmação "SIM, PAUSAR" / CANCELAR e RETOMAR |
| `/alertas` | Data, hora, nível, descrição, recomendação e estado Novo/Resolvido |
| `/historico` | Tabela Data / Atividade / Estado / Risco com filtros Hoje, 7, 30 dias e personalizado, mais gráficos de atividade e evolução do risco |
| `/como-usar` | Os 7 passos e o aviso de que nenhum sistema garante imunidade a suspensão |
| `/faq` | As 5 perguntas em acordeão |

## Painel administrativo

`/admin`, restrito a administradores verificados no servidor: utilizadores, contas conectadas, estatísticas gerais, planos e notificações; tabela de códigos (Código, Utilizador, Estado, Criação, Ativação, Expiração, Plano) com CRIAR CÓDIGO, SUSPENDER, ATIVAR e COPIAR.

## Conformidade

Sem QR codes falsos, sem APIs não oficiais, sem promessas de desbloqueio e sem qualquer mecanismo de evasão. A conexão é uma demonstração identificada, com a arquitetura pronta para a API oficial do WhatsApp Business.

## Notas técnicas

Rotas TanStack com `_authenticated` para as áreas privadas; toda a lógica de licenças, risco, proteção e administração em `createServerFn` com validação Zod e verificação de papel via `has_role`; navegação lateral em desktop e inferior em mobile; gráficos com Recharts; notificações com Sonner; `head()` próprio por rota.
