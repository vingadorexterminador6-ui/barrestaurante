import { Link, createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/gestao/AppShell";
import { SetupWizard, Welcome } from "@/components/gestao/SetupWizard";
import { EmptyState, SectionCard, StatCard } from "@/components/gestao/ui-bits";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMetrics, useStore } from "@/lib/gestao/store";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Dashboard — Gestão de Bar e Restaurante" },
      {
        name: "description",
        content:
          "Painel de gestão para bares e restaurantes: caixa, vendas, stock, despesas e relatórios num só lugar.",
      },
      { property: "og:title", content: "Dashboard — Gestão de Bar e Restaurante" },
      {
        property: "og:description",
        content: "Controle caixa, vendas, stock, compras e relatórios do seu estabelecimento.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { state, hydrated } = useStore();
  const [phase, setPhase] = useState<"welcome" | "wizard">("welcome");

  if (!hydrated) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!state.setupDone) {
    return phase === "welcome" ? (
      <Welcome onStart={() => setPhase("wizard")} />
    ) : (
      <SetupWizard onCancel={() => setPhase("welcome")} />
    );
  }

  return <Dashboard />;
}

function Dashboard() {
  const { state, money, t, closeDay } = useStore();
  const m = useMetrics();
  const [confirmClose, setConfirmClose] = useState(false);

  const today = new Date().toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const stockChart = [
    {
      name: "Normal",
      value: state.products.filter((p) => p.stock > p.minStock).length,
      color: "var(--color-safe)",
    },
    { name: "Baixo", value: m.lowStock.length, color: "var(--color-warning)" },
    { name: "Esgotado", value: m.outOfStock.length, color: "var(--color-danger)" },
  ].filter((x) => x.value > 0);

  const flowChart = [
    {
      name: "Hoje",
      Entradas: m.salesTodayTotal,
      Saidas: m.expensesTodayTotal + m.purchasesTodayTotal,
    },
  ];

  return (
    <AppShell
      title={state.establishment.name || t("dashboard")}
      subtitle={today}
      actions={
        <>
          <Button asChild size="sm">
            <Link to="/vendas">Nova venda</Link>
          </Button>
          <Button size="sm" variant="outline" onClick={() => setConfirmClose(true)}>
            Fechar dia
          </Button>
        </>
      }
    >
      <ClientAreaLink />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={`💰 ${t("balance")}`} value={money(m.balance)} tone="safe" />

        <StatCard
          label={`🛒 ${t("salesToday")}`}
          value={money(m.salesTodayTotal)}
          hint={`${m.salesToday.length} venda(s)`}
        />
        <StatCard label={`💸 ${t("expensesToday")}`} value={money(m.expensesTodayTotal)} tone="danger" />
        <StatCard label={`📦 ${t("stockValue")}`} value={money(m.stockValue)} />
        <StatCard
          label={`📈 ${t("profit")}`}
          value={money(m.profit)}
          tone={m.profit >= 0 ? "safe" : "danger"}
        />
        <StatCard label={`🧾 ${t("salesCount")}`} value={String(m.salesToday.length)} />
        <StatCard label={`🛍️ ${t("purchasesToday")}`} value={money(m.purchasesTodayTotal)} />
        <StatCard
          label="Estado da caixa"
          value={state.cashOpen ? "CAIXA ABERTA" : "CAIXA FECHADA"}
          tone={state.cashOpen ? "safe" : "warning"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Vendas por hora" description="Movimento de vendas de hoje">
          {m.salesTodayTotal === 0 ? (
            <EmptyState message="Ainda não há vendas registadas hoje." />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={m.salesByHour}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="hour" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                  }}
                />
                <Line type="monotone" dataKey="total" stroke="var(--color-primary)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard title="Entradas x Saídas" description="Dinheiro recebido e dinheiro gasto hoje">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={flowChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                }}
              />
              <Legend />
              <Bar dataKey="Entradas" fill="var(--color-safe)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Saidas" fill="var(--color-danger)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Produtos mais vendidos" description="Ranking por quantidade">
          {m.productRanking.length === 0 ? (
            <EmptyState message="Sem vendas suficientes para gerar o ranking." />
          ) : (
            <ul className="space-y-2">
              {m.productRanking.slice(0, 6).map((p, i) => (
                <li
                  key={p.name}
                  className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm"
                >
                  <span className="font-medium">
                    {i + 1}. {p.name}
                  </span>
                  <span className="text-muted-foreground">
                    {p.qty} un · {money(p.total)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Situação do stock" description="Produtos por estado de inventário">
          {stockChart.length === 0 ? (
            <EmptyState
              message="Cadastre produtos para acompanhar o stock."
              action={
                <Button asChild size="sm">
                  <Link to="/produtos">Cadastrar produtos</Link>
                </Button>
              }
            />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={stockChart} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
                  {stockChart.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Histórico recente" description="Últimas operações registadas no sistema">
        {state.auditLogs.length === 0 ? (
          <EmptyState message="Nenhuma operação registada ainda." />
        ) : (
          <ul className="space-y-2 text-sm">
            {state.auditLogs.slice(0, 8).map((l) => (
              <li key={l.id} className="flex flex-wrap justify-between gap-2 border-b border-border pb-2">
                <span>
                  {new Date(l.date).toLocaleString("pt-PT")} — {l.operation} — {l.detail}
                </span>
                {l.amount ? <span className="font-medium">{money(l.amount)}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <Dialog open={confirmClose} onOpenChange={setConfirmClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resumo do dia</DialogTitle>
          </DialogHeader>
          <div className="space-y-1 text-sm">
            <Row label="Total de vendas" value={money(m.salesTodayTotal)} />
            <Row label="Total de despesas" value={money(m.expensesTodayTotal)} />
            <Row label="Total de compras" value={money(m.purchasesTodayTotal)} />
            <Row label="Saldo esperado" value={money(m.balance)} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmClose(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                closeDay();
                setConfirmClose(false);
                toast.success("Dia fechado com sucesso.");
              }}
            >
              Fechar dia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
