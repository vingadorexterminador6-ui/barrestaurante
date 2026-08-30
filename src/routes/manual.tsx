import { Link, createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/gestao/AppShell";
import { SectionCard } from "@/components/gestao/ui-bits";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/gestao/store";

export const Route = createFileRoute("/manual")({
  head: () => ({
    meta: [
      { title: "Manual de utilização — Gestão de Bar e Restaurante" },
      {
        name: "description",
        content:
          "Guia passo a passo: configure o estabelecimento, cadastre produtos, registe vendas e despesas e feche o dia.",
      },
      { property: "og:title", content: "Manual de utilização" },
      { property: "og:description", content: "Aprenda a usar o sistema em 6 passos simples." },
    ],
  }),
  component: ManualPage,
});

const STEPS = [
  {
    title: "PASSO 1 — Configure o estabelecimento",
    body: "Preencha nome, tipo de negócio, moeda, contactos e outras informações em Configurações › Estabelecimento.",
  },
  {
    title: "PASSO 2 — Cadastre os produtos",
    body: "Em Produtos, adicione bebidas, comidas, pratos e outros itens com categoria, unidade e preços.",
  },
  {
    title: "PASSO 3 — Configure o stock",
    body: "Informe quantidade inicial, unidade, preço de compra e preço de venda. Em Stock pode registar entradas, saídas, ajustes e perdas.",
  },
  {
    title: "PASSO 4 — Registre as vendas",
    body: "Use Vendas / PDV ou Mesas. Cada venda atualiza automaticamente o caixa, o stock e os relatórios.",
  },
  {
    title: "PASSO 5 — Registre despesas",
    body: "Em Despesas, registe energia, água, salários e outras saídas. Tudo é contabilizado no movimento financeiro.",
  },
  {
    title: "PASSO 6 — Feche o dia",
    body: "No Dashboard clique em Fechar dia: o sistema calcula o resumo (saldo inicial + entradas - saídas) e guarda o relatório.",
  },
];

const FAQ = [
  {
    q: "Como funciona o modo automático?",
    a: "No modo automático o sistema calcula vendas, despesas, lucro, saldo de caixa, stock utilizado, compras e resultado diário sem que precise de fazer contas.",
  },
  {
    q: "Posso mudar para o modo manual?",
    a: "Sim. Em Configurações › Caixa e pagamentos pode alternar entre automático e manual em qualquer momento.",
  },
  {
    q: "Onde ficam guardados os meus dados?",
    a: "Os dados ficam guardados neste dispositivo. Em Configurações › Backup pode exportar, importar ou limpar tudo.",
  },
  {
    q: "Preciso de senha para entrar?",
    a: "Não. O sistema abre diretamente na aplicação, sem login nem cadastro de utilizadores.",
  },
];

function ManualPage() {
  const { state } = useStore();
  return (
    <AppShell title="Manual" subtitle={`Guia rápido do ${state.settings.systemName}`}>
      <SectionCard title="Bem-vindo ao seu Sistema de Gestão" description="Controle o seu bar ou restaurante de forma simples, rápida e inteligente.">
        <div className="grid gap-3 sm:grid-cols-2">
          {STEPS.map((s) => (
            <div key={s.title} className="rounded-xl border border-border p-4">
              <p className="text-sm font-semibold text-primary">{s.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/produtos">Cadastrar produtos</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/vendas">Registar uma venda</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/configuracoes">Abrir configurações</Link>
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Perguntas frequentes">
        <Accordion type="single" collapsible>
          {FAQ.map((f) => (
            <AccordionItem key={f.q} value={f.q}>
              <AccordionTrigger>{f.q}</AccordionTrigger>
              <AccordionContent>{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </SectionCard>
    </AppShell>
  );
}
