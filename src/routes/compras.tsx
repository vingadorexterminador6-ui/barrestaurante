import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/gestao/AppShell";
import { EmptyState, RequireSetup, SectionCard } from "@/components/gestao/ui-bits";
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
import { useStore } from "@/lib/gestao/store";
import type { PurchaseItem } from "@/lib/gestao/types";

export const Route = createFileRoute("/compras")({
  head: () => ({
    meta: [
      { title: "Compras — Gestão de Bar e Restaurante" },
      {
        name: "description",
        content:
          "Registe compras a fornecedores com atualização automática de stock, custo dos produtos e saída de caixa.",
      },
      { property: "og:title", content: "Compras" },
      { property: "og:description", content: "Compras que atualizam stock e caixa automaticamente." },
    ],
  }),
  component: () => (
    <AppShell title="Compras" subtitle="Compras a fornecedores e entrada de mercadoria">
      <RequireSetup>
        <PurchasesPage />
      </RequireSetup>
    </AppShell>
  ),
});

function PurchasesPage() {
  const { state, money, addPurchase } = useStore();
  const [supplierId, setSupplierId] = useState("none");
  const [payment, setPayment] = useState(state.settings.paymentMethods[0] ?? "Dinheiro");
  const [note, setNote] = useState("");
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");

  const total = items.reduce((a, i) => a + i.subtotal, 0);

  const addItem = () => {
    const p = state.products.find((x) => x.id === productId);
    const quantity = Number(qty);
    const unitPrice = Number(price);
    if (!p || !quantity || quantity <= 0 || unitPrice < 0) {
      toast.error("Escolha o produto e informe quantidade e preço.");
      return;
    }
    setItems((c) => [
      ...c,
      { productId: p.id, name: p.name, qty: quantity, unitPrice, subtotal: quantity * unitPrice },
    ]);
    setQty("");
    setPrice("");
  };

  const confirm = () => {
    if (items.length === 0) {
      toast.error("Adicione pelo menos um produto à compra.");
      return;
    }
    const supplier = state.suppliers.find((s) => s.id === supplierId);
    addPurchase({
      ...(supplierId !== "none" ? { supplierId } : {}),
      supplierName: supplier?.name ?? "Fornecedor não registado",
      items,
      paymentMethod: payment,
      ...(note ? { note } : {}),
    });
    setItems([]);
    setNote("");
    toast.success("Compra registada! Stock aumentado e caixa atualizada.");
  };

  return (
    <div className="space-y-6">
      <SectionCard title="Nova compra" description="Registe a entrada de mercadoria">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Fornecedor</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem fornecedor</SelectItem>
                {state.suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
            <Label className="text-xs">Observação</Label>
            <Textarea
              value={note}
              placeholder="Ex.: Entrega parcial"
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Produto</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Escolher produto" />
              </SelectTrigger>
              <SelectContent>
                {state.products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Quantidade</Label>
            <Input type="number" min="0" value={qty} onChange={(e) => setQty(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Preço unitário</Label>
            <Input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button variant="secondary" onClick={addItem} className="w-full">
              <Plus className="mr-2 size-4" /> Adicionar
            </Button>
          </div>
        </div>

        {items.length > 0 ? (
          <div className="mt-4 space-y-2">
            {items.map((i, idx) => (
              <div
                key={`${i.productId}-${idx}`}
                className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm"
              >
                <span>
                  {i.qty}× {i.name} @ {money(i.unitPrice)}
                </span>
                <span className="flex items-center gap-3">
                  <span className="font-medium">{money(i.subtotal)}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-danger"
                    onClick={() => setItems((c) => c.filter((_, k) => k !== idx))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </span>
              </div>
            ))}
            <div className="flex justify-between font-display text-lg font-semibold">
              <span>Total da compra</span>
              <span>{money(total)}</span>
            </div>
            <Button onClick={confirm}>Confirmar compra</Button>
          </div>
        ) : null}
      </SectionCard>

      <SectionCard title="Compras registadas" description={`${state.purchases.length} compra(s)`}>
        {state.purchases.length === 0 ? (
          <EmptyState message="Nenhuma compra registada." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2">Data</th>
                  <th className="py-2">Fornecedor</th>
                  <th className="py-2">Itens</th>
                  <th className="py-2">Pagamento</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {state.purchases.map((p) => (
                  <tr key={p.id} className="border-b border-border/60">
                    <td className="py-2">{new Date(p.date).toLocaleDateString("pt-PT")}</td>
                    <td className="py-2">{p.supplierName}</td>
                    <td className="py-2">{p.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}</td>
                    <td className="py-2">{p.paymentMethod}</td>
                    <td className="py-2 text-right font-medium">{money(p.total)}</td>
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
