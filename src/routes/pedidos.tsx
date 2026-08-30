import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/gestao/AppShell";
import { EmptyState, RequireSetup, SectionCard } from "@/components/gestao/ui-bits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/lib/gestao/store";
import type { OrderStatus } from "@/lib/gestao/types";

export const Route = createFileRoute("/pedidos")({
  head: () => ({
    meta: [
      { title: "Pedidos & Reservas — Gestão de Bar e Restaurante" },
      {
        name: "description",
        content:
          "Receba pedidos e reservas feitos pelos clientes, confirme pagamentos e envie o consumo para a mesa automaticamente.",
      },
      { property: "og:title", content: "Pedidos & Reservas" },
      {
        property: "og:description",
        content: "Gestão de pedidos online, reservas de mesa e confirmação de pagamentos.",
      },
    ],
  }),
  component: () => (
    <AppShell title="Pedidos & Reservas" subtitle="Solicitações enviadas pelos clientes">
      <RequireSetup>
        <OrdersPage />
      </RequireSetup>
    </AppShell>
  ),
});

const NEXT: { status: OrderStatus; label: string }[] = [
  { status: "aceite", label: "Aceitar" },
  { status: "pronto", label: "Pronto" },
  { status: "entregue", label: "Entregue" },
  { status: "cancelado", label: "Cancelar" },
];

function OrdersPage() {
  const { state, money, setOrderStatus, confirmOrderPayment, setReservationStatus } = useStore();
  const [method, setMethod] = useState(state.settings.paymentMethods[0] ?? "Dinheiro");
  const [tableFor, setTableFor] = useState<Record<string, string>>({});

  const pending = useMemo(() => state.orders.filter((o) => o.status === "novo").length, [state.orders]);

  return (
    <Tabs defaultValue="pedidos">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <TabsList>
          <TabsTrigger value="pedidos">Pedidos {pending ? `(${pending})` : ""}</TabsTrigger>
          <TabsTrigger value="reservas">Reservas</TabsTrigger>
        </TabsList>
        <Button asChild variant="outline" size="sm">
          <Link to="/menu">Abrir área do cliente</Link>
        </Button>
      </div>

      <TabsContent value="pedidos">
        <SectionCard
          title="Pedidos dos clientes"
          description="Aceitar envia o consumo para a mesa; confirmar pagamento registra a venda no caixa"
        >
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Forma de pagamento a confirmar:</span>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="w-56">
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

          {state.orders.length === 0 ? (
            <EmptyState message="Nenhum pedido recebido. Partilhe o link /menu com os seus clientes." />
          ) : (
            <ul className="space-y-3">
              {state.orders.map((o) => (
                <li key={o.id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-semibold">{o.code}</span>
                    <Badge variant="outline">{o.status}</Badge>
                    <Badge variant={o.paymentStatus === "pago" ? "default" : "secondary"}>
                      {o.paymentStatus === "pago"
                        ? `Pago (${o.paymentMethod})`
                        : o.paymentStatus === "declarado"
                          ? `Declarado: ${o.paymentMethod}`
                          : "A pagar"}
                    </Badge>
                    <Badge variant="outline">
                      {o.channel === "mesa" ? `Mesa ${o.tableName ?? ""}` : "Takeaway"}
                    </Badge>
                    <span className="ml-auto font-display text-base font-semibold">
                      {money(o.total)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {o.customerName} · {o.phone} · {new Date(o.date).toLocaleString("pt-PT")}
                  </p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {o.items.map((i) => (
                      <li key={i.productId} className="flex justify-between">
                        <span>
                          {i.qty}× {i.name}
                        </span>
                        <span>{money(i.subtotal)}</span>
                      </li>
                    ))}
                  </ul>
                  {o.note ? (
                    <p className="mt-2 text-xs text-muted-foreground">Obs.: {o.note}</p>
                  ) : null}
                  {o.paymentRef ? (
                    <p className="text-xs text-muted-foreground">Referência: {o.paymentRef}</p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {NEXT.map((n) => (
                      <Button
                        key={n.status}
                        size="sm"
                        variant={n.status === "cancelado" ? "ghost" : "outline"}
                        disabled={o.status === n.status || o.paymentStatus === "pago"}
                        onClick={() => {
                          setOrderStatus(o.id, n.status);
                          toast.success(`Pedido ${o.code}: ${n.label.toLowerCase()}`);
                        }}
                      >
                        {n.label}
                      </Button>
                    ))}
                    <Button
                      size="sm"
                      disabled={o.paymentStatus === "pago" || o.status === "cancelado"}
                      onClick={() => {
                        confirmOrderPayment(o.id, o.paymentMethod ?? method);
                        toast.success(`Pagamento do pedido ${o.code} confirmado. Caixa e stock atualizados.`);
                      }}
                    >
                      Confirmar pagamento
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </TabsContent>

      <TabsContent value="reservas">
        <SectionCard title="Reservas de mesa" description="Confirme e atribua uma mesa à reserva">
          {state.reservations.length === 0 ? (
            <EmptyState message="Nenhuma reserva solicitada." />
          ) : (
            <ul className="space-y-3">
              {state.reservations.map((r) => (
                <li key={r.id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-semibold">{r.code}</span>
                    <Badge variant="outline">{r.status}</Badge>
                    {r.tableName ? <Badge variant="secondary">{r.tableName}</Badge> : null}
                  </div>
                  <p className="mt-1 text-sm">
                    {r.customerName} · {r.phone}
                    {r.email ? ` · ${r.email}` : ""}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {r.date} às {r.time} · {r.people} pessoa(s)
                    {r.area ? ` · área ${r.area}` : ""}
                  </p>
                  {r.note ? <p className="text-xs text-muted-foreground">Obs.: {r.note}</p> : null}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Select
                      value={tableFor[r.id] ?? ""}
                      onValueChange={(v) => setTableFor((m) => ({ ...m, [r.id]: v }))}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Atribuir mesa" />
                      </SelectTrigger>
                      <SelectContent>
                        {state.tables.map((tb) => (
                          <SelectItem key={tb.id} value={tb.id}>
                            {tb.name} — {tb.area}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      onClick={() => {
                        setReservationStatus(r.id, "confirmada", tableFor[r.id]);
                        toast.success(`Reserva ${r.code} confirmada.`);
                      }}
                    >
                      Confirmar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setReservationStatus(r.id, "concluida")}
                    >
                      Concluir
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setReservationStatus(r.id, "recusada")}
                    >
                      Recusar
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </TabsContent>
    </Tabs>
  );
}
