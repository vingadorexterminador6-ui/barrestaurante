import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/gestao/AppShell";
import { EmptyState, RequireSetup, SectionCard, StatCard } from "@/components/gestao/ui-bits";
import { Badge } from "@/components/ui/badge";
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
import { useMetrics, useStore } from "@/lib/gestao/store";
import type { StockMovementType } from "@/lib/gestao/types";

export const Route = createFileRoute("/stock")({
  head: () => ({
    meta: [
      { title: "Stock e Inventário — Gestão de Bar e Restaurante" },
      {
        name: "description",
        content:
          "Acompanhe stock atual, produtos esgotados, stock baixo, valor do inventário e registe entradas, saídas, ajustes e perdas.",
      },
      { property: "og:title", content: "Stock e Inventário" },
      { property: "og:description", content: "Movimentações de inventário com alertas automáticos." },
    ],
  }),
  component: () => (
    <AppShell title="Stock" subtitle="Inventário, movimentações e alertas">
      <RequireSetup>
        <StockPage />
      </RequireSetup>
    </AppShell>
  ),
});

const TYPES: { value: StockMovementType; label: string }[] = [
  { value: "entrada", label: "Entrada (compra/recebimento)" },
  { value: "saida", label: "Saída (retirada)" },
  { value: "ajuste", label: "Ajuste (definir quantidade)" },
  { value: "perda", label: "Perda (dano/validade)" },
];

function StockPage() {
  const { state, money, addStockMovement } = useStore();
  const m = useMetrics();
  const [productId, setProductId] = useState("");
  const [type, setType] = useState<StockMovementType>("entrada");
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState("");

  const submit = () => {
    if (!productId) {
      toast.error("Escolha um produto.");
      return;
    }
    const quantity = Number(qty);
    if (!quantity || quantity < 0) {
      toast.error("Informe uma quantidade válida.");
      return;
    }
    addStockMovement({ productId, type, qty: quantity, reason: reason || "Sem motivo indicado" });
    setQty("");
    setReason("");
    toast.success("Movimentação de stock registada.");
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Valor do inventário" value={money(m.stockValue)} />
        <StatCard label="Produtos cadastrados" value={String(state.products.length)} />
        <StatCard label="⚠️ Stock baixo" value={String(m.lowStock.length)} tone="warning" />
        <StatCard label="🚨 Esgotados" value={String(m.outOfStock.length)} tone="danger" />
      </div>

      <SectionCard title="Nova movimentação" description="Entrada, saída, ajuste ou perda">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Produto</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Escolher produto" />
              </SelectTrigger>
              <SelectContent>
                {state.products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.stock} {p.unit})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v as StockMovementType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Quantidade</Label>
            <Input
              type="number"
              min="0"
              value={qty}
              placeholder="Ex.: 24"
              onChange={(e) => setQty(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Motivo</Label>
            <Input
              value={reason}
              placeholder="Ex.: Recebimento do fornecedor"
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>
        <Button className="mt-4" onClick={submit}>
          Registar movimentação
        </Button>
      </SectionCard>

      {m.lowStock.length + m.outOfStock.length > 0 ? (
        <SectionCard title="Alertas de stock" description="Produtos que precisam de atenção">
          <ul className="space-y-2 text-sm">
            {m.outOfStock.map((p) => (
              <li key={p.id} className="flex justify-between rounded-lg bg-danger/10 px-3 py-2">
                <span>🚨 {p.name}</span>
                <Badge variant="destructive">Esgotado</Badge>
              </li>
            ))}
            {m.lowStock.map((p) => (
              <li key={p.id} className="flex justify-between rounded-lg bg-warning/10 px-3 py-2">
                <span>⚠️ {p.name}</span>
                <Badge variant="secondary">
                  {p.stock} / mín. {p.minStock}
                </Badge>
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : null}

      <SectionCard title="Histórico de movimentações" description="Todas as entradas e saídas de stock">
        {state.inventoryMovements.length === 0 ? (
          <EmptyState message="Nenhuma movimentação registada." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2">Data</th>
                  <th className="py-2">Produto</th>
                  <th className="py-2">Tipo</th>
                  <th className="py-2">Qtd.</th>
                  <th className="py-2">Motivo</th>
                  <th className="py-2 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {state.inventoryMovements.slice(0, 100).map((mv) => (
                  <tr key={mv.id} className="border-b border-border/60">
                    <td className="py-2">{new Date(mv.date).toLocaleString("pt-PT")}</td>
                    <td className="py-2">{mv.productName}</td>
                    <td className="py-2 capitalize">{mv.type}</td>
                    <td className="py-2">{mv.qty}</td>
                    <td className="py-2">{mv.reason}</td>
                    <td className="py-2 text-right">{money(mv.value)}</td>
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
