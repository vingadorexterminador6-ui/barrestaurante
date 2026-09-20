import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/gestao/AppShell";
import { EmptyState, RequireSetup, SectionCard, StatCard } from "@/components/gestao/ui-bits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMetrics, useStore, type HistoryScope } from "@/lib/gestao/store";

export const Route = createFileRoute("/fechamento")({
  head: () => ({
    meta: [
      { title: "Painel de fechamento — Gestão de Bar e Restaurante" },
      {
        name: "description",
        content:
          "Faça o fecho diário, semanal e mensal, consulte resultados fechados e limpe históricos antigos em segurança.",
      },
      { property: "og:title", content: "Painel de fechamento" },
      {
        property: "og:description",
        content: "Resultados fechados ficam bloqueados e não podem ser alterados.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell
      title="Painel de fechamento"
      subtitle="Fechos diário, semanal e mensal — resultados fechados ficam bloqueados"
    >
      <RequireSetup>
        <ClosingPage />
      </RequireSetup>
    </AppShell>
  ),
});

const SCOPES: { value: HistoryScope; label: string }[] = [
  { value: "movimentos", label: "Movimentos de caixa, despesas e compras" },
  { value: "vendas", label: "Vendas e movimentos de stock" },
  { value: "pedidos", label: "Pedidos e reservas" },
  { value: "registos", label: "Registos de atividade" },
  { value: "tudo", label: "Todos os históricos" },
];

function ClosingPage() {
  const { state, money, closeDay, closePeriod, clearHistory, lockedUntil } = useStore();
  const m = useMetrics();
  const [scope, setScope] = useState<HistoryScope>("movimentos");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const todayClosed = state.dailyClosings.some(
    (c) => new Date(c.date).toDateString() === new Date().toDateString(),
  );

  const doClosePeriod = (period: "semanal" | "mensal") => {
    const c = closePeriod(period);
    if (c) toast.success(`Fecho ${period} concluído. Resultado: ${money(c.result)}`);
    else
      toast.error(
        period === "semanal"
          ? "Esta semana já foi fechada e não pode ser alterada."
          : "Este mês já foi fechado e não pode ser alterado.",
      );
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Saldo atual do caixa" value={money(m.balance)} tone="safe" />
        <StatCard label="Entradas de hoje" value={money(m.salesTodayTotal)} />
        <StatCard
          label="Saídas de hoje"
          value={money(m.expensesTodayTotal + m.purchasesTodayTotal)}
          tone="danger"
        />
        <StatCard
          label="Fechado até"
          value={lockedUntil ? new Date(lockedUntil).toLocaleDateString("pt-PT") : "Sem fechos"}
          hint={lockedUntil ? "Tudo até esta data está bloqueado" : "Ainda nada foi fechado"}
          tone={lockedUntil ? "warning" : "default"}
        />
      </div>

      <SectionCard
        title="Fazer fechamento"
        description="Depois de fechado, o resultado do dia, da semana ou do mês fica bloqueado e não pode ser alterado."
        actions={
          <Button asChild size="sm" variant="outline">
            <Link to="/caixa">Ver caixa</Link>
          </Button>
        }
      >
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={todayClosed}
            onClick={() => {
              const c = closeDay();
              if (c) toast.success(`Fecho diário concluído. Resultado: ${money(c.result)}`);
              else toast.error("O dia de hoje já foi fechado e não pode ser alterado.");
            }}
          >
            {todayClosed ? "Dia já fechado" : "Fecho diário"}
          </Button>
          <Button variant="secondary" onClick={() => doClosePeriod("semanal")}>
            Fecho semanal
          </Button>
          <Button variant="secondary" onClick={() => doClosePeriod("mensal")}>
            Fecho mensal
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        title="Limpar históricos"
        description="Limpa apenas o que ainda não foi fechado. Tudo o que está dentro de um fecho é preservado."
      >
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-64">
            <Select value={scope} onValueChange={(v) => setScope(v as HistoryScope)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCOPES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
            Limpar histórico
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        title="Fechos diários"
        description="Resultados já fechados — apenas consulta"
      >
        {state.dailyClosings.length === 0 ? (
          <EmptyState message="Nenhum fecho diário registado." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2">Data</th>
                  <th className="py-2 text-right">Abertura</th>
                  <th className="py-2 text-right">Vendas</th>
                  <th className="py-2 text-right">Saídas</th>
                  <th className="py-2 text-right">Saldo final</th>
                  <th className="py-2 text-right">Resultado</th>
                  <th className="py-2 text-right">Estado</th>
                </tr>
              </thead>
              <tbody>
                {state.dailyClosings.map((c) => (
                  <tr key={c.id} className="border-b border-border/60">
                    <td className="py-2">{new Date(c.date).toLocaleString("pt-PT")}</td>
                    <td className="py-2 text-right">{money(c.openingBalance)}</td>
                    <td className="py-2 text-right">{money(c.salesTotal)}</td>
                    <td className="py-2 text-right text-danger">{money(c.outflowsTotal)}</td>
                    <td className="py-2 text-right">{money(c.expectedBalance)}</td>
                    <td
                      className={`py-2 text-right font-medium ${
                        c.result >= 0 ? "text-safe" : "text-danger"
                      }`}
                    >
                      {money(c.result)}
                    </td>
                    <td className="py-2 text-right">
                      <Badge variant="secondary" className="gap-1">
                        <Lock className="size-3" /> Fechado
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Fechos semanais e mensais" description="Resultados já fechados — apenas consulta">
        {state.periodClosings.length === 0 ? (
          <EmptyState message="Nenhum fecho semanal ou mensal registado." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2">Período</th>
                  <th className="py-2">Intervalo</th>
                  <th className="py-2 text-right">Vendas</th>
                  <th className="py-2 text-right">Entradas</th>
                  <th className="py-2 text-right">Saídas</th>
                  <th className="py-2 text-right">Resultado</th>
                  <th className="py-2 text-right">Estado</th>
                </tr>
              </thead>
              <tbody>
                {state.periodClosings.map((c) => (
                  <tr key={c.id} className="border-b border-border/60">
                    <td className="py-2">
                      {c.period === "semanal" ? "Semanal" : "Mensal"} — {c.label}
                    </td>
                    <td className="py-2">
                      {new Date(c.startDate).toLocaleDateString("pt-PT")} a{" "}
                      {new Date(c.endDate).toLocaleDateString("pt-PT")}
                    </td>
                    <td className="py-2 text-right">{money(c.salesTotal)}</td>
                    <td className="py-2 text-right text-safe">{money(c.inflowsTotal)}</td>
                    <td className="py-2 text-right text-danger">{money(c.outflowsTotal)}</td>
                    <td
                      className={`py-2 text-right font-medium ${
                        c.result >= 0 ? "text-safe" : "text-danger"
                      }`}
                    >
                      {money(c.result)}
                    </td>
                    <td className="py-2 text-right">
                      <Badge variant="secondary" className="gap-1">
                        <Lock className="size-3" /> Fechado
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Limpar histórico?</DialogTitle>
            <DialogDescription>
              Esta ação apaga os registos ainda não fechados do âmbito escolhido. Os fechos diários,
              semanais e mensais e tudo o que está dentro deles não são afetados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                const removed = clearHistory(scope);
                setConfirmOpen(false);
                toast.success(
                  removed > 0
                    ? `${removed} registo(s) apagado(s). Fechos preservados.`
                    : "Nada a limpar — tudo já está fechado ou vazio.",
                );
              }}
            >
              Limpar agora
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
