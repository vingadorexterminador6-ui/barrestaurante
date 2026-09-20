import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/gestao/AppShell";
import { EmptyState, RequireSetup, SectionCard, StatCard } from "@/components/gestao/ui-bits";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMetrics, useStore } from "@/lib/gestao/store";
import type { CashType } from "@/lib/gestao/types";

export const Route = createFileRoute("/caixa")({
  head: () => ({
    meta: [
      { title: "Caixa — Gestão de Bar e Restaurante" },
      {
        name: "description",
        content:
          "Abra e feche a caixa, registe entradas, saídas, sangrias, reforços e consulte todos os movimentos.",
      },
      { property: "og:title", content: "Caixa" },
      { property: "og:description", content: "Controle total do dinheiro do seu estabelecimento." },
    ],
  }),
  component: () => (
    <AppShell title="Caixa" subtitle="Movimentos de dinheiro e saldo atualizado">
      <RequireSetup>
        <CashPage />
      </RequireSetup>
    </AppShell>
  ),
});

const OPERATIONS: { key: string; label: string; type: CashType }[] = [
  { key: "Entrada de dinheiro", label: "Entrada de dinheiro", type: "entrada" },
  { key: "Saída de dinheiro", label: "Saída de dinheiro", type: "saida" },
  { key: "Sangria", label: "Sangria", type: "saida" },
  { key: "Reforço de caixa", label: "Reforço de caixa", type: "entrada" },
  { key: "Transferência", label: "Transferência", type: "saida" },
  { key: "Ajuste manual", label: "Ajuste manual", type: "entrada" },
];

function CashPage() {
  const { state, money, openCash, closeCash, addCashMovement, closeDay, closePeriod } = useStore();
  const m = useMetrics();
  const [dialog, setDialog] = useState<{ open: boolean; operation: string; type: CashType }>({
    open: false,
    operation: "",
    type: "entrada",
  });
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [payment, setPayment] = useState(state.settings.paymentMethods[0] ?? "Dinheiro");
  const [openAmount, setOpenAmount] = useState("");

  const submit = () => {
    const value = Number(amount);
    if (!value || value <= 0) {
      toast.error("Informe um valor maior que zero.");
      return;
    }
    addCashMovement({
      type: dialog.type,
      amount: value,
      category: dialog.operation,
      description: description || dialog.operation,
      paymentMethod: payment,
    });
    setDialog({ open: false, operation: "", type: "entrada" });
    setAmount("");
    setDescription("");
    toast.success(`${dialog.operation} registada. Saldo atualizado automaticamente.`);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Saldo atual" value={money(m.balance)} tone="safe" />
        <StatCard label="Entradas de hoje" value={money(m.salesTodayTotal)} />
        <StatCard
          label="Saídas de hoje"
          value={money(m.expensesTodayTotal + m.purchasesTodayTotal)}
          tone="danger"
        />
        <StatCard
          label="Estado"
          value={state.cashOpen ? "CAIXA ABERTA" : "CAIXA FECHADA"}
          tone={state.cashOpen ? "safe" : "warning"}
        />
      </div>

      <SectionCard title="Atalhos rápidos" description="Entradas, saídas e pagamentos de funcionários">
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/entradas">Registar entrada de valores</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/despesas">Registar saída / despesa</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/compras">Compras de produtos</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/funcionarios">Pagamento de funcionários</Link>
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Operações de caixa" description="Todos os cálculos são automáticos">
        <div className="flex flex-wrap gap-2">

          {state.cashOpen ? (
            <Button variant="outline" onClick={() => { closeCash(); toast.success("Caixa fechada."); }}>
              Fechar caixa
            </Button>
          ) : (
            <div className="flex flex-wrap items-end gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Fundo de caixa</Label>
                <Input
                  type="number"
                  min="0"
                  value={openAmount}
                  placeholder="Ex.: 2000"
                  onChange={(e) => setOpenAmount(e.target.value)}
                  className="w-40"
                />
              </div>
              <Button
                onClick={() => {
                  openCash(Number(openAmount) || 0);
                  setOpenAmount("");
                  toast.success("Caixa aberta.");
                }}
              >
                Abrir caixa
              </Button>
            </div>
          )}
          {OPERATIONS.map((op) => (
            <Button
              key={op.key}
              variant="secondary"
              disabled={!state.cashOpen}
              onClick={() => setDialog({ open: true, operation: op.key, type: op.type })}
            >
              {op.label}
            </Button>
          ))}
        </div>
        {!state.cashOpen ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Abra a caixa para registar movimentos e vendas.
          </p>
        ) : null}
      </SectionCard>

      <SectionCard
        title="Fecho diário"
        description="Fecha o dia e calcula automaticamente entradas, saídas e resultado"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to="/fechamento">Painel de fechamento</Link>
            </Button>
            <Button
              onClick={() => {
                const c = closeDay();
                if (c) toast.success(`Fecho diário concluído. Resultado: ${money(c.result)}`);
                else toast.error("O dia de hoje já foi fechado e não pode ser alterado.");
              }}
            >
              Fazer fecho diário
            </Button>
          </div>
        }
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
                  <th className="py-2 text-right">Outras entradas</th>
                  <th className="py-2 text-right">Saídas</th>
                  <th className="py-2 text-right">Saldo final</th>
                  <th className="py-2 text-right">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {state.dailyClosings.map((c) => (
                  <tr key={c.id} className="border-b border-border/60">
                    <td className="py-2">{new Date(c.date).toLocaleString("pt-PT")}</td>
                    <td className="py-2 text-right">{money(c.openingBalance)}</td>
                    <td className="py-2 text-right">{money(c.salesTotal)}</td>
                    <td className="py-2 text-right">{money(c.otherIncome)}</td>
                    <td className="py-2 text-right text-danger">{money(c.outflowsTotal)}</td>
                    <td className="py-2 text-right">{money(c.expectedBalance)}</td>
                    <td
                      className={`py-2 text-right font-medium ${
                        c.result >= 0 ? "text-safe" : "text-danger"
                      }`}
                    >
                      {money(c.result)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Fecho semanal e mensal"
        description="Resumo automático das entradas, saídas e resultado do período"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                const c = closePeriod("semanal");
                if (c) toast.success(`Fecho semanal concluído. Resultado: ${money(c.result)}`);
                else toast.error("Esta semana já foi fechada e não pode ser alterada.");
              }}
            >
              Fecho semanal
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                const c = closePeriod("mensal");
                if (c) toast.success(`Fecho mensal concluído. Resultado: ${money(c.result)}`);
                else toast.error("Este mês já foi fechado e não pode ser alterado.");
              }}
            >
              Fecho mensal
            </Button>

          </div>
        }
      >
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
                </tr>
              </thead>
              <tbody>
                {state.periodClosings.map((c) => (
                  <tr key={c.id} className="border-b border-border/60">
                    <td className="py-2 capitalize">
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Histórico de movimentos" description="Entradas e saídas registadas">
        {state.cashMovements.length === 0 ? (
          <EmptyState message="Nenhum movimento de caixa registado." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2">Data</th>
                  <th className="py-2">Categoria</th>
                  <th className="py-2">Descrição</th>
                  <th className="py-2">Tipo</th>
                  <th className="py-2 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {state.cashMovements.slice(0, 100).map((mv) => (
                  <tr key={mv.id} className="border-b border-border/60">
                    <td className="py-2">{new Date(mv.date).toLocaleString("pt-PT")}</td>
                    <td className="py-2">{mv.category}</td>
                    <td className="py-2">{mv.description}</td>
                    <td className="py-2">{mv.type === "entrada" ? "Entrada" : "Saída"}</td>
                    <td
                      className={`py-2 text-right font-medium ${
                        mv.type === "entrada" ? "text-safe" : "text-danger"
                      }`}
                    >
                      {mv.type === "entrada" ? "+" : "-"}
                      {money(mv.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <Dialog
        open={dialog.open}
        onOpenChange={(v) => setDialog((d) => ({ ...d, open: v }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog.operation}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Valor *</Label>
              <Input
                type="number"
                min="0"
                value={amount}
                placeholder="Ex.: 500"
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Descrição</Label>
              <Input
                value={description}
                placeholder="Ex.: Troco enviado ao cofre"
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Forma de pagamento</Label>
              <Select value={payment} onValueChange={setPayment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {state.settings.paymentMethods.map((pm) => (
                    <SelectItem key={pm} value={pm}>
                      {pm}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialog((d) => ({ ...d, open: false }))}>
              Cancelar
            </Button>
            <Button onClick={submit}>Registar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
