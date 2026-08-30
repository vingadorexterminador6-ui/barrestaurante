import { createFileRoute } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/gestao/AppShell";
import { EmptyState, RequireSetup, SectionCard } from "@/components/gestao/ui-bits";
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
import { useStore } from "@/lib/gestao/store";
import type { SaleItem } from "@/lib/gestao/types";

export const Route = createFileRoute("/vendas")({
  head: () => ({
    meta: [
      { title: "Vendas / PDV — Gestão de Bar e Restaurante" },
      {
        name: "description",
        content:
          "Ponto de venda rápido: adicione produtos ao carrinho, aplique descontos e finalize com atualização automática de caixa e stock.",
      },
      { property: "og:title", content: "Vendas / PDV" },
      { property: "og:description", content: "Registe vendas e atualize caixa e stock automaticamente." },
    ],
  }),
  component: () => (
    <AppShell title="Vendas / PDV" subtitle="Registe vendas rapidamente">
      <RequireSetup>
        <SalesPage />
      </RequireSetup>
    </AppShell>
  ),
});

function SalesPage() {
  const { state, money, registerSale } = useStore();
  const [category, setCategory] = useState("Todas");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [discount, setDiscount] = useState("0");
  const [payment, setPayment] = useState(state.settings.paymentMethods[0] ?? "Dinheiro");
  const [customerId, setCustomerId] = useState("none");
  const [employeeId, setEmployeeId] = useState("none");
  const [receipt, setReceipt] = useState<{ total: number; items: SaleItem[] } | null>(null);

  const products = useMemo(
    () =>
      state.products.filter(
        (p) =>
          p.active &&
          (category === "Todas" || p.category === category) &&
          p.name.toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [state.products, category, search],
  );

  const subtotal = cart.reduce((a, i) => a + i.subtotal, 0);
  const total = Math.max(0, subtotal - (Number(discount) || 0));

  const addToCart = (productId: string) => {
    const p = state.products.find((x) => x.id === productId);
    if (!p) return;
    if (p.stock <= 0) {
      toast.error(`${p.name} está esgotado.`);
      return;
    }
    setCart((c) => {
      const existing = c.find((i) => i.productId === productId);
      if (existing)
        return c.map((i) =>
          i.productId === productId
            ? { ...i, qty: i.qty + 1, subtotal: (i.qty + 1) * i.unitPrice }
            : i,
        );
      return [
        ...c,
        { productId, name: p.name, qty: 1, unitPrice: p.salePrice, subtotal: p.salePrice },
      ];
    });
  };

  const changeQty = (productId: string, delta: number) =>
    setCart((c) =>
      c
        .map((i) =>
          i.productId === productId
            ? { ...i, qty: i.qty + delta, subtotal: (i.qty + delta) * i.unitPrice }
            : i,
        )
        .filter((i) => i.qty > 0),
    );

  const finalize = () => {
    if (cart.length === 0) {
      toast.error("Adicione produtos ao carrinho.");
      return;
    }
    if (!state.cashOpen) {
      toast.error("Abra a caixa antes de registar vendas.");
      return;
    }
    const sale = registerSale({
      items: cart,
      discount: Number(discount) || 0,
      paymentMethod: payment,
      ...(customerId !== "none" ? { customerId } : {}),
      ...(employeeId !== "none" ? { employeeId } : {}),
    });
    setReceipt({ total: sale.total, items: sale.items });
    setCart([]);
    setDiscount("0");
    toast.success("Venda registada com sucesso! Caixa e stock atualizados.");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      <SectionCard title="Produtos" description="Escolha uma categoria e toque no produto">
        <div className="mb-4 flex flex-wrap gap-2">
          {["Todas", ...state.settings.productCategories].map((c) => (
            <Button
              key={c}
              size="sm"
              variant={category === c ? "default" : "outline"}
              onClick={() => setCategory(c)}
            >
              {c}
            </Button>
          ))}
        </div>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar produto…"
          className="mb-4"
        />
        {products.length === 0 ? (
          <EmptyState message="Nenhum produto nesta categoria. Cadastre produtos no módulo Produtos." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => addToCart(p.id)}
                className="rounded-xl border border-border p-3 text-left transition-colors hover:border-primary hover:bg-accent/50"
              >
                <p className="truncate text-sm font-medium">{p.name}</p>
                <p className="mt-1 font-display text-base">{money(p.salePrice)}</p>
                <Badge
                  variant={p.stock <= 0 ? "destructive" : p.stock <= p.minStock ? "secondary" : "outline"}
                  className="mt-2"
                >
                  {p.stock} {p.unit}
                </Badge>
              </button>
            ))}
          </div>
        )}
      </SectionCard>

      <div className="space-y-4">
        <SectionCard title="Carrinho" description={`${cart.length} produto(s)`}>
          {cart.length === 0 ? (
            <EmptyState message="Carrinho vazio." />
          ) : (
            <ul className="space-y-2">
              {cart.map((i) => (
                <li key={i.productId} className="rounded-lg bg-muted/50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{i.name}</p>
                      <p className="text-xs text-muted-foreground">{money(i.unitPrice)} / un</p>
                    </div>
                    <span className="font-medium">{money(i.subtotal)}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Button size="icon" variant="outline" onClick={() => changeQty(i.productId, -1)}>
                      <Minus className="size-3" />
                    </Button>
                    <span className="w-8 text-center text-sm">{i.qty}</span>
                    <Button size="icon" variant="outline" onClick={() => changeQty(i.productId, 1)}>
                      <Plus className="size-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="ml-auto text-danger"
                      onClick={() => setCart((c) => c.filter((x) => x.productId !== i.productId))}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Desconto</Label>
              <Input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
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
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Cliente</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem cliente</SelectItem>
                    {state.customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Funcionário</Label>
                <Select value={employeeId} onValueChange={setEmployeeId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Não atribuído</SelectItem>
                    {state.employees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-lg border border-border p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{money(subtotal)}</span>
              </div>
              <div className="mt-1 flex justify-between font-display text-lg font-semibold">
                <span>Total</span>
                <span>{money(total)}</span>
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={finalize}>
              Finalizar venda
            </Button>
          </div>
        </SectionCard>

        {receipt ? (
          <SectionCard title="Comprovativo" description="Última venda registada">
            <ul className="space-y-1 text-sm">
              {receipt.items.map((i) => (
                <li key={i.productId} className="flex justify-between">
                  <span>
                    {i.qty}× {i.name}
                  </span>
                  <span>{money(i.subtotal)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 flex justify-between font-display font-semibold">
              <span>Total pago</span>
              <span>{money(receipt.total)}</span>
            </p>
          </SectionCard>
        ) : null}
      </div>
    </div>
  );
}
