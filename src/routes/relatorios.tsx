import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/gestao/AppShell";
import { EmptyState, RequireSetup, SectionCard, StatCard } from "@/components/gestao/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/lib/gestao/store";

export const Route = createFileRoute("/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios — Gestão de Bar e Restaurante" },
      {
        name: "description",
        content:
          "Relatórios financeiros, de vendas, produtos, stock, caixa e compras, com filtros por período e exportação em CSV.",
      },
      { property: "og:title", content: "Relatórios" },
      { property: "og:description", content: "Analise o desempenho do seu negócio por período." },
    ],
  }),
  component: () => (
    <AppShell title="Relatórios" subtitle="Análise por período com exportação">
      <RequireSetup>
        <ReportsPage />
      </RequireSetup>
    </AppShell>
  ),
});

const RANGES = [
  { value: "hoje", label: "Hoje" },
  { value: "ontem", label: "Ontem" },
  { value: "7d", label: "Últimos 7 dias" },
  { value: "mes", label: "Este mês" },
  { value: "mesAnterior", label: "Mês anterior" },
  { value: "custom", label: "Personalizado" },
];

function rangeBounds(range: string, from: string, to: string) {
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  switch (range) {
    case "hoje":
      return { start: startOfDay(now), end: now };
    case "ontem": {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return { start: startOfDay(y), end: new Date(startOfDay(now).getTime() - 1) };
    }
    case "7d": {
      const s = new Date(now);
      s.setDate(s.getDate() - 6);
      return { start: startOfDay(s), end: now };
    }
    case "mes":
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
    case "mesAnterior":
      return {
        start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
      };
    default:
      return {
        start: from ? new Date(from) : new Date(0),
        end: to ? new Date(`${to}T23:59:59`) : now,
      };
  }
}

function toCsv(rows: Record<string, string | number>[], filename: string) {
  if (rows.length === 0) {
    toast.error("Nada para exportar neste período.");
    return;
  }
  const headers = Object.keys(rows[0]!);
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")),
  ].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("Relatório exportado.");
}

function ReportsPage() {
  const { state, money } = useStore();
  const [range, setRange] = useState("hoje");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { start, end } = rangeBounds(range, from, to);
  const inRange = (iso: string) => {
    const d = new Date(iso);
    return d >= start && d <= end;
  };

  const data = useMemo(() => {
    const sales = state.sales.filter((s) => inRange(s.date));
    const expenses = state.expenses.filter((e) => inRange(e.date));
    const purchases = state.purchases.filter((p) => inRange(p.date));
    const incomes = state.incomes.filter((i) => inRange(i.date));
    const movements = state.cashMovements.filter((m) => inRange(m.date));
    const inventory = state.inventoryMovements.filter((m) => inRange(m.date));
    const revenue = sales.reduce((a, s) => a + s.total, 0) + incomes.reduce((a, i) => a + i.amount, 0);
    const expenseTotal = expenses.reduce((a, e) => a + e.amount, 0);
    const purchaseTotal = purchases.reduce((a, p) => a + p.total, 0);
    const ranking = Object.values(
      sales.reduce<Record<string, { name: string; qty: number; total: number }>>((acc, s) => {
        s.items.forEach((i) => {
          acc[i.productId] = acc[i.productId] ?? { name: i.name, qty: 0, total: 0 };
          acc[i.productId]!.qty += i.qty;
          acc[i.productId]!.total += i.subtotal;
        });
        return acc;
      }, {}),
    ).sort((a, b) => b.qty - a.qty);
    const soldIds = new Set(sales.flatMap((s) => s.items.map((i) => i.productId)));
    return {
      sales,
      expenses,
      purchases,
      incomes,
      movements,
      inventory,
      revenue,
      expenseTotal,
      purchaseTotal,
      result: revenue - expenseTotal - purchaseTotal,
      ranking,
      noSales: state.products.filter((p) => !soldIds.has(p.id)),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, range, from, to]);

  return (
    <div className="space-y-6">
      <SectionCard title="Período" description="Escolha o intervalo de análise">
        <div className="flex flex-wrap items-end gap-2">
          {RANGES.map((r) => (
            <Button
              key={r.value}
              size="sm"
              variant={range === r.value ? "default" : "outline"}
              onClick={() => setRange(r.value)}
            >
              {r.label}
            </Button>
          ))}
          {range === "custom" ? (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">De</Label>
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Até</Label>
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
            </>
          ) : null}
        </div>
      </SectionCard>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Receita" value={money(data.revenue)} tone="safe" />
        <StatCard label="Despesas" value={money(data.expenseTotal)} tone="danger" />
        <StatCard label="Compras" value={money(data.purchaseTotal)} />
        <StatCard
          label="Resultado"
          value={money(data.result)}
          tone={data.result >= 0 ? "safe" : "danger"}
        />
      </div>

      <Tabs defaultValue="vendas">
        <TabsList className="flex-wrap">
          <TabsTrigger value="vendas">Vendas</TabsTrigger>
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
          <TabsTrigger value="stock">Stock</TabsTrigger>
          <TabsTrigger value="caixa">Caixa</TabsTrigger>
          <TabsTrigger value="compras">Compras</TabsTrigger>
          <TabsTrigger value="fechos">Fechos diários</TabsTrigger>
        </TabsList>

        <TabsContent value="vendas" className="mt-4">
          <SectionCard
            title="Vendas do período"
            description={`${data.sales.length} venda(s)`}
            actions={
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  toCsv(
                    data.sales.map((s) => ({
                      Data: new Date(s.date).toLocaleString("pt-PT"),
                      Itens: s.items.map((i) => `${i.qty}x ${i.name}`).join(" | "),
                      Pagamento: s.paymentMethod,
                      Desconto: s.discount,
                      Total: s.total,
                    })),
                    "relatorio-vendas.csv",
                  )
                }
              >
                <Download className="mr-2 size-4" /> Exportar CSV
              </Button>
            }
          >
            {data.sales.length === 0 ? (
              <EmptyState message="Sem vendas neste período." />
            ) : (
              <ul className="space-y-2 text-sm">
                {data.sales.map((s) => (
                  <li key={s.id} className="flex flex-wrap justify-between gap-2 border-b border-border pb-2">
                    <span>
                      {new Date(s.date).toLocaleString("pt-PT")} —{" "}
                      {s.items.map((i) => `${i.qty}× ${i.name}`).join(", ")} ({s.paymentMethod})
                    </span>
                    <span className="font-medium">{money(s.total)}</span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="produtos" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard title="Mais vendidos">
              {data.ranking.length === 0 ? (
                <EmptyState message="Sem dados." />
              ) : (
                <ul className="space-y-2 text-sm">
                  {data.ranking.slice(0, 10).map((p, i) => (
                    <li key={p.name} className="flex justify-between">
                      <span>
                        {i + 1}. {p.name}
                      </span>
                      <span>
                        {p.qty} un · {money(p.total)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
            <SectionCard title="Produtos sem venda no período">
              {data.noSales.length === 0 ? (
                <EmptyState message="Todos os produtos tiveram vendas." />
              ) : (
                <ul className="space-y-1 text-sm">
                  {data.noSales.map((p) => (
                    <li key={p.id}>{p.name}</li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>
        </TabsContent>

        <TabsContent value="stock" className="mt-4">
          <SectionCard
            title="Movimentações de stock"
            actions={
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  toCsv(
                    data.inventory.map((mv) => ({
                      Data: new Date(mv.date).toLocaleString("pt-PT"),
                      Produto: mv.productName,
                      Tipo: mv.type,
                      Quantidade: mv.qty,
                      Motivo: mv.reason,
                      Valor: mv.value,
                    })),
                    "relatorio-stock.csv",
                  )
                }
              >
                <Download className="mr-2 size-4" /> Exportar CSV
              </Button>
            }
          >
            {data.inventory.length === 0 ? (
              <EmptyState message="Sem movimentações neste período." />
            ) : (
              <ul className="space-y-1 text-sm">
                {data.inventory.map((mv) => (
                  <li key={mv.id} className="flex justify-between border-b border-border pb-1">
                    <span>
                      {new Date(mv.date).toLocaleDateString("pt-PT")} — {mv.productName} ({mv.type})
                    </span>
                    <span>
                      {mv.qty} un · {money(mv.value)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="caixa" className="mt-4">
          <SectionCard
            title="Movimentos de caixa"
            actions={
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  toCsv(
                    data.movements.map((mv) => ({
                      Data: new Date(mv.date).toLocaleString("pt-PT"),
                      Categoria: mv.category,
                      Descricao: mv.description,
                      Tipo: mv.type,
                      Valor: mv.amount,
                    })),
                    "relatorio-caixa.csv",
                  )
                }
              >
                <Download className="mr-2 size-4" /> Exportar CSV
              </Button>
            }
          >
            {data.movements.length === 0 ? (
              <EmptyState message="Sem movimentos neste período." />
            ) : (
              <ul className="space-y-1 text-sm">
                {data.movements.map((mv) => (
                  <li key={mv.id} className="flex justify-between border-b border-border pb-1">
                    <span>
                      {new Date(mv.date).toLocaleString("pt-PT")} — {mv.category}
                    </span>
                    <span className={mv.type === "entrada" ? "text-safe" : "text-danger"}>
                      {mv.type === "entrada" ? "+" : "-"}
                      {money(mv.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="compras" className="mt-4">
          <SectionCard title="Compras do período">
            {data.purchases.length === 0 ? (
              <EmptyState message="Sem compras neste período." />
            ) : (
              <ul className="space-y-1 text-sm">
                {data.purchases.map((p) => (
                  <li key={p.id} className="flex justify-between border-b border-border pb-1">
                    <span>
                      {new Date(p.date).toLocaleDateString("pt-PT")} — {p.supplierName}
                    </span>
                    <span>{money(p.total)}</span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="fechos" className="mt-4">
          <SectionCard title="Fechos diários guardados">
            {state.dailyClosings.length === 0 ? (
              <EmptyState message="Nenhum dia fechado ainda." />
            ) : (
              <div className="space-y-3">
                {state.dailyClosings.map((c) => (
                  <div key={c.id} className="rounded-xl border border-border p-4 text-sm">
                    <p className="font-medium">{new Date(c.date).toLocaleString("pt-PT")}</p>
                    <div className="mt-2 grid gap-1 sm:grid-cols-2">
                      <span>Saldo inicial: {money(c.openingBalance)}</span>
                      <span>Vendas: {money(c.salesTotal)}</span>
                      <span>Outras entradas: {money(c.otherIncome)}</span>
                      <span>Despesas: {money(c.expensesTotal)}</span>
                      <span>Compras: {money(c.purchasesTotal)}</span>
                      <span>Saídas totais: {money(c.outflowsTotal)}</span>
                      <span>Saldo esperado: {money(c.expectedBalance)}</span>
                      <span className={c.result >= 0 ? "text-safe" : "text-danger"}>
                        Resultado: {money(c.result)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </TabsContent>
      </Tabs>

      <SectionCard title="Histórico / auditoria" description="Todas as operações registadas">
        {state.auditLogs.length === 0 ? (
          <EmptyState message="Sem operações registadas." />
        ) : (
          <ul className="space-y-1 text-sm">
            {state.auditLogs.slice(0, 60).map((l) => (
              <li key={l.id} className="flex flex-wrap justify-between gap-2 border-b border-border pb-1">
                <span>
                  {new Date(l.date).toLocaleString("pt-PT")} — {l.operation} — {l.detail}
                </span>
                {l.amount ? <span>{money(l.amount)}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
