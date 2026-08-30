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
import { useStore } from "@/lib/gestao/store";

export const Route = createFileRoute("/entradas")({
  head: () => ({
    meta: [
      { title: "Entradas — Gestão de Bar e Restaurante" },
      {
        name: "description",
        content:
          "Registe dinheiro recebido fora das vendas: capital, empréstimos, investimentos e outros recebimentos.",
      },
      { property: "og:title", content: "Entradas" },
      { property: "og:description", content: "Recebimentos que não vieram de vendas." },
    ],
  }),
  component: () => (
    <AppShell title="Entradas" subtitle="Dinheiro recebido fora das vendas">
      <RequireSetup>
        <IncomePage />
      </RequireSetup>
    </AppShell>
  ),
});

const SOURCES = ["Capital", "Empréstimo", "Investimento", "Outros recebimentos"];

function IncomePage() {
  const { state, money, addIncome } = useStore();
  const [source, setSource] = useState(SOURCES[0]!);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [payment, setPayment] = useState(state.settings.paymentMethods[0] ?? "Dinheiro");

  const total = state.incomes.reduce((a, i) => a + i.amount, 0);

  const submit = () => {
    const value = Number(amount);
    if (!value || value <= 0) {
      toast.error("Informe um valor maior que zero.");
      return;
    }
    addIncome({ source, description: description || source, amount: value, paymentMethod: payment });
    setDescription("");
    setAmount("");
    toast.success("Entrada registada no caixa.");
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Total de entradas extra" value={money(total)} tone="safe" />
        <StatCard label="Registos" value={String(state.incomes.length)} />
      </div>

      <SectionCard title="Nova entrada">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Origem</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SOURCES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Descrição</Label>
            <Input
              value={description}
              placeholder="Ex.: Investimento do sócio"
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Valor *</Label>
            <Input
              type="number"
              min="0"
              value={amount}
              placeholder="Ex.: 10000"
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Forma de recebimento</Label>
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
        <Button className="mt-4" onClick={submit}>
          Registar entrada
        </Button>
      </SectionCard>

      <SectionCard title="Entradas registadas">
        {state.incomes.length === 0 ? (
          <EmptyState message="Nenhuma entrada registada." />
        ) : (
          <ul className="space-y-2 text-sm">
            {state.incomes.map((i) => (
              <li
                key={i.id}
                className="flex flex-wrap justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2"
              >
                <span>
                  {new Date(i.date).toLocaleDateString("pt-PT")} — {i.source} — {i.description}
                </span>
                <span className="font-medium text-safe">{money(i.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
