# WA Guard

Crie um sistema web moderno chamado WA Guard — Proteção e Gestão de Risco para WhatsApp, compatível com WhatsApp Messenger e WhatsApp Business.

OBJETIVO

O sistema deve permitir que o utilizador conecte uma conta através de métodos oficiais disponíveis, ative um modo de proteção e acompanhe indicadores de risco da conta.

IMPORTANTE: não criar mecanismos para burlar banimentos, contornar sistemas de segurança do WhatsApp, esconder automações, manipular identificadores ou utilizar APIs não oficiais. O sistema deve funcionar apenas dentro das regras e integrações permitidas.

1. TELA DE LOGIN

Criar uma tela elegante com:

Logo WA Guard

Campo de e-mail

Campo de palavra-passe

Botão ENTRAR

Botão CRIAR CONTA

Recuperação de palavra-passe

Design profissional, responsivo e com aparência de software SaaS.

2. CÓDIGO DE ATIVAÇÃO

Depois do login, apresentar uma tela:

ATIVE O SEU WA GUARD

Campo:

XXXX-XXXX-XXXX

Botão:

ATIVAR SISTEMA

O código deve funcionar como licença de utilização do sistema.

Após validação:

✅ Código válido
✅ Sistema ativado

Guardar o estado da licença na conta do utilizador.

Criar também uma área administrativa para o administrador criar, ativar, suspender e controlar códigos de licença.

3. DASHBOARD PRINCIPAL

Criar um painel moderno mostrando:

Estado da conta

🟢 PROTEÇÃO ATIVA

Informações:

WhatsApp conectado

Tipo: Messenger ou Business

Estado da conexão

Última sincronização

Estado da licença

Indicador de risco

Criar um cartão grande:

NÍVEL DE RISCO

🟢 Baixo
🟡 Atenção
🔴 Alto

Mostrar uma pontuação de risco de 0 a 100.

Exemplo:

Risco atual: 18/100 — BAIXO

A pontuação deve ser calculada com base em sinais permitidos, como volume de atividade, taxa de respostas, bloqueios/denúncias reportados pelo sistema e outros indicadores disponíveis através das integrações oficiais.

4. CONEXÃO DO WHATSAPP

Criar uma página chamada:

CONEXÃO

Opções:

WhatsApp Messenger

Botão:

CONECTAR WHATSAPP

WhatsApp Business

Botão:

CONECTAR WHATSAPP BUSINESS

Utilizar somente métodos oficiais de autenticação e integração.

Depois da conexão mostrar:

🟢 Conectado

Número/identificador disponível pela integração

Tipo de conta

Data da conexão

Última sincronização

Não armazenar palavras-passe, códigos de autenticação ou informações sensíveis desnecessárias.

5. MODO PROTEÇÃO

Criar um botão grande:

🛡️ ATIVAR PROTEÇÃO

Quando ativado:

PROTEÇÃO ATIVA

O sistema deve monitorizar a atividade permitida e apresentar alertas preventivos.

Criar controles para:

Monitorização de atividade

Alertas de comportamento anormal

Limites configuráveis para automações permitidas

Pausa de campanhas

Pausa de automações

Notificações de risco

A proteção não deve tentar impedir ou contornar decisões de bloqueio do WhatsApp.

6. CENTRAL DE ALERTAS

Criar uma página:

ALERTAS

Exemplos:

🟢 Atividade normal
🟡 Volume de atividade aumentou
🟡 Muitas mensagens sem resposta
🔴 Foram detectados sinais que precisam de revisão

Cada alerta deve possuir:

Data

Hora

Nível

Descrição

Recomendação

Estado: Novo / Resolvido

7. HISTÓRICO DE ATIVIDADE

Criar uma página com tabela:

Data Atividade Estado Risco

Permitir filtros por:

Hoje

7 dias

30 dias

Personalizado

Criar gráficos de atividade e evolução do risco.

8. MODO EMERGÊNCIA

Criar um botão destacado:

⏸ PAUSAR AUTOMAÇÕES

Ao clicar:

“As automações permitidas serão pausadas. Deseja continuar?”

Botões:

SIM, PAUSAR

CANCELAR

Depois mostrar:

🟡 Automações pausadas

O utilizador poderá clicar:

RETOMAR

9. COMO USAR

Criar uma página educativa chamada:

📚 COMO USAR O WA GUARD

Passo 1 — Crie a sua conta

Registe-se no sistema utilizando e-mail e palavra-passe.

Passo 2 — Ative a licença

Introduza o código de ativação fornecido pelo administrador.

Passo 3 — Conecte o WhatsApp

Escolha WhatsApp Messenger ou WhatsApp Business e utilize o método oficial de conexão disponibilizado pelo sistema.

Passo 4 — Ative a proteção

Clique em ATIVAR PROTEÇÃO.

Passo 5 — Acompanhe o risco

Consulte regularmente o indicador de risco.

Passo 6 — Analise os alertas

Quando aparecer um alerta amarelo ou vermelho, siga a recomendação apresentada.

Passo 7 — Evite spam

Não envie mensagens em massa para pessoas que não solicitaram contacto e não utilize ferramentas ou versões não autorizadas.

IMPORTANTE

O WA Guard é uma ferramenta de monitorização e gestão de risco. Nenhum sistema pode garantir que uma conta do WhatsApp nunca será suspensa ou banida.

10. PERGUNTAS FREQUENTES

Criar FAQ com:

O WA Guard garante que minha conta nunca será banida?

Não. O sistema ajuda a monitorizar riscos e incentivar boas práticas, mas não pode garantir imunidade contra suspensões.

Funciona com WhatsApp Business?

Sim, desde que a integração oficial utilizada seja compatível.

O que significa risco alto?

Significa que foram identificados sinais que merecem atenção e revisão da atividade.

O código de ativação serve para quê?

É a licença que ativa o acesso ao sistema.

Posso pausar as automações?

Sim. O painel deve possuir uma opção para pausar as automações permitidas.

11. PAINEL ADMINISTRATIVO

Criar /admin.

O administrador poderá:

Ver utilizadores

Criar códigos

Ativar códigos

Suspender códigos

Definir validade dos códigos

Ver contas conectadas

Ver estado das licenças

Ver estatísticas gerais

Gerir planos

Gerir notificações

Gestão de códigos

Colunas:

Código

Utilizador

Estado

Data de criação

Data de ativação

Expiração

Plano

Botões:

CRIAR CÓDIGO

SUSPENDER

ATIVAR

COPIAR

12. DESIGN

Criar uma interface premium SaaS.

Estilo:

Fundo escuro

Cards modernos

Azul como cor principal

Verde para estado seguro

Amarelo para atenção

Vermelho para risco

Ícones modernos

Animações suaves

Gráficos profissionais

Excelente experiência mobile

Criar layout responsivo para:

📱 Android
💻 Computador
📱 Tablet

13. TECNOLOGIA

Criar a aplicação com arquitetura preparada para produção.

Utilizar:

autenticação segura;

banco de dados para utilizadores, licenças, conexões, alertas e histórico;

controle de permissões;

logs;

validação de formulários;

proteção de dados;

componentes reutilizáveis.

Separar claramente:

Frontend

Dashboard, gráficos, telas, configurações e FAQ.

Backend

Autenticação, licenças, banco de dados, permissões, alertas e integrações oficiais.

14. EXPERIÊNCIA DO UTILIZADOR

Após o primeiro login, mostrar um assistente:

BEM-VINDO AO WA GUARD 🛡️

Ative sua licença

Conecte seu WhatsApp

Ative a proteção

Consulte seu nível de risco

Mostrar uma barra de progresso:

0/4 → 1/4 → 2/4 → 3/4 → 4/4

Quando terminar:

🎉 Configuração concluída!

O seu painel está pronto.

REGRA IMPORTANTE DE DESENVOLVIMENTO

Não criar QR codes falsos, APIs falsas, sistemas que prometam desbloquear contas, mecanismos para escapar de banimentos, ocultar automações ou burlar mecanismos de segurança do WhatsApp.

Quando uma integração oficial ainda não estiver configurada, criar uma interface de conexão simulada claramente identificada como demonstração, deixando a arquitetura preparada para receber posteriormente as credenciais e APIs oficiais.

Entregue o projeto com todas as páginas navegáveis, banco de dados estruturado, autenticação, sistema de licenças, dashboard, indicadores, alertas, FAQ, área administrativa e design responsivo.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://barrestaurante.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d99a5251-9ac1-4f08-8b01-268066de986c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
