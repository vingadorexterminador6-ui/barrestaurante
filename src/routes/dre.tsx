import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/gestao/AppShell";
import { RequireSetup, SectionCard, StatCard } from "@/components/gestao/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SECTOR_KEYS, SECTOR_LABEL, computeDre } from "@/lib/gestao/dre";
import { useStore } from "@/lib/gestao/store";

export const Route = createFileRoute("/dre")({
  head: () => ({
    meta: [
      { title: "Demonstração de resultados — Bar e Restaurante" },
      {
        name: "description",
        content:
          "Resultado separado do bar e do restaurante: receitas, custo dos produtos vendidos, despesas e lucro por área.",
      },
      { property: "og:title", content: "Demonstração de resultados" },
      {
        property: "og:description",
        content: "Compare o desempenho do bar e do restaurante com fluxo de caixa único.",
      },
    ],
  }),
  component: () => (
    <AppShell
      title="Demonstração de resultados"
      subtitle="Bar e restaurante separados — caixa único"
    >
      <RequireSetup>
        <DrePage />
      </RequireSetup>
    </AppShell>
  ),
});

const iso = (d: Date) => d.toISOString().slice(0, 10);

function DrePage() {
  const { state, money } = useStore();
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const [from, setFrom] = useState(iso(firstOfMonth));
  const [to, setTo] = useState(iso(today));

  const dre = useMemo(() => {
    const start = new Date(`${from}T00:00:00`);
    const end = new Date(`${to}T23:59:59`);
    return computeDre(state, start, end);
  }, [state, from, to]);

  const setRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days + 1);
    setFrom(iso(start));
    setTo(iso(end));
  };

  const rows = [
    { label: "Receita de vendas", pick: (k: string) => k, key: "revenue" as const },
    { label: "Outras entradas", key: "otherIncome" as const },
    { label: "(-) Custo dos produtos vendidos", key: "cogs" as const, negative: true },
    { label: "= Lucro bruto", key: "grossProfit" as const, strong: true },
    { label: "(-) Despesas operacionais", key: "expenses" as const, negative: true },
    { label: "= Resultado líquido", key: "result" as const, strong: true },
  ];

  const cashBalance = state.cashMovements.reduce(
    (a, m) => a + (m.type === "entrada" ? m.amount : -m.amount),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Resultado do período"
          value={money(dre.total.result)}
          tone={dre.total.result >= 0 ? "safe" : "danger"}
          hint={`Margem ${dre.total.margin.toFixed(1)}%`}
        />
        <StatCard label="Resultado do bar" value={money(dre.lines[0]?.result ?? 0)} />
        <StatCard label="Resultado do restaurante" value={money(dre.lines[1]?.result ?? 0)} />
        <StatCard label="Saldo do caixa (único)" value={money(cashBalance)} tone="safe" />
      </div>

      <SectionCard
        title="Período de análise"
        description="O bar e o restaurante têm resultados separados, mas o dinheiro entra e sai de um único caixa."
        actions={
          <Button asChild size="sm" variant="outline">
            <Link to="/caixa">Ver caixa único</Link>
          </Button>
        }
      >
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">De</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Até</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setRange(1)}>
              Hoje
            </Button>
            <Button size="sm" variant="outline" onClick={() => setRange(7)}>
              7 dias
            </Button>
            <Button size="sm" variant="outline" onClick={() => setRange(30)}>
              30 dias
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setFrom(iso(firstOfMonth));
                setTo(iso(new Date()));
              }}
            >
              Este mês
            </Button>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Demonstração de resultados por área"
        description="Produtos e despesas marcados como Bar ou Restaurante são separados automaticamente."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="py-2">Linha</th>
                {SECTOR_KEYS.map((k) => (
                  <th key={k} className="py-2 text-right">
                    {SECTOR_LABEL[k]}
                  </th>
                ))}
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b border-border/60">
                  <td className={`py-2.5 ${row.strong ? "font-semibold" : ""}`}>{row.label}</td>
                  {dre.lines.map((line) => (
                    <td
                      key={line.sector}
                      className={`py-2.5 text-right ${row.strong ? "font-semibold" : ""} ${
                        row.negative ? "text-danger" : ""
                      }`}
                    >
                      {money(line[row.key])}
                    </td>
                  ))}
                  <td
                    className={`py-2.5 text-right font-semibold ${row.negative ? "text-danger" : ""}`}
                  >
                    {money(dre.total[row.key])}
                  </td>
                </tr>
              ))}
              <tr>
                <td className="py-2.5 text-muted-foreground">Vendas registadas</td>
                {dre.lines.map((line) => (
                  <td key={line.sector} className="py-2.5 text-right text-muted-foreground">
                    {line.salesCount}
                  </td>
                ))}
                <td className="py-2.5 text-right text-muted-foreground">{dre.total.salesCount}</td>
              </tr>
              <tr>
                <td className="py-2.5 text-muted-foreground">Margem</td>
                {dre.lines.map((line) => (
                  <td key={line.sector} className="py-2.5 text-right text-muted-foreground">
                    {line.margin.toFixed(1)}%
                  </td>
                ))}
                <td className="py-2.5 text-right text-muted-foreground">
                  {dre.total.margin.toFixed(1)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Dica: em Produtos escolha a área (Bar ou Restaurante) de cada item e em Despesas indique a
          área do gasto. O que ficar sem área aparece na coluna Geral.
        </p>
      </SectionCard>
    </div>
  );
}
