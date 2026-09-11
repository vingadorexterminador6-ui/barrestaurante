import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/gestao/AppShell";
import { EmptyState, RequireSetup, SectionCard, StatCard } from "@/components/gestao/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMetrics, useStore } from "@/lib/gestao/store";

export const Route = createFileRoute("/despesas")({
  head: () => ({
    meta: [
      { title: "Despesas — Gestão de Bar e Restaurante" },
      {
        name: "description",
        content:
          "Registe despesas por categoria — energia, água, salários, renda — com impacto automático no caixa e no resultado.",
      },
      { property: "og:title", content: "Despesas" },
      { property: "og:description", content: "Controle as despesas do seu estabelecimento." },
    ],
  }),
  component: () => (
    <AppShell title="Despesas" subtitle="Saídas de dinheiro por categoria">
      <RequireSetup>
        <ExpensesPage />
      </RequireSetup>
    </AppShell>
  ),
});

function ExpensesPage() {
  const { state, money, addExpense } = useStore();
  const m = useMetrics();
  const [category, setCategory] = useState(state.settings.expenseCategories[0] ?? "Outros");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [payment, setPayment] = useState(state.settings.paymentMethods[0] ?? "Dinheiro");
  const [note, setNote] = useState("");
  const [sector, setSector] = useState<Sector>("geral");

  const total = state.expenses.reduce((a, e) => a + e.amount, 0);

  const submit = () => {
    const value = Number(amount);
    if (!description.trim()) {
      toast.error("Descreva a despesa.");
      return;
    }
    if (!value || value <= 0) {
      toast.error("Informe um valor maior que zero.");
      return;
    }
    addExpense({
      category,
      description,
      amount: value,
      paymentMethod: payment,
      sector,
      ...(note ? { note } : {}),
    });
    setDescription("");
    setAmount("");
    setNote("");
    toast.success("Despesa registada! Caixa e resultado atualizados.");
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Despesas de hoje" value={money(m.expensesTodayTotal)} tone="danger" />
        <StatCard label="Total acumulado" value={money(total)} />
        <StatCard label="Registos" value={String(state.expenses.length)} />
      </div>

      <SectionCard title="Nova despesa" description="Todos os campos importantes numa só linha">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {state.settings.expenseCategories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Descrição *</Label>
            <Input
              value={description}
              placeholder="Ex.: Conta de energia de agosto"
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Valor *</Label>
            <Input
              type="number"
              min="0"
              value={amount}
              placeholder="Ex.: 1500"
              onChange={(e) => setAmount(e.target.value)}
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
          <div className="space-y-1.5">
            <Label className="text-xs">Área do gasto</Label>
            <Select value={sector} onValueChange={(v) => setSector(v as Sector)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">Bar</SelectItem>
                <SelectItem value="restaurante">Restaurante</SelectItem>
                <SelectItem value="geral">Geral (ambos)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Observação</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        <Button className="mt-4" onClick={submit}>
          Registar despesa
        </Button>
      </SectionCard>

      <SectionCard title="Despesas registadas">
        {state.expenses.length === 0 ? (
          <EmptyState message="Nenhuma despesa registada." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2">Data</th>
                  <th className="py-2">Categoria</th>
                  <th className="py-2">Descrição</th>
                  <th className="py-2">Pagamento</th>
                  <th className="py-2 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {state.expenses.map((e) => (
                  <tr key={e.id} className="border-b border-border/60">
                    <td className="py-2">{new Date(e.date).toLocaleDateString("pt-PT")}</td>
                    <td className="py-2">{e.category}</td>
                    <td className="py-2">{e.description}</td>
                    <td className="py-2">{e.paymentMethod}</td>
                    <td className="py-2 text-right font-medium text-danger">{money(e.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
