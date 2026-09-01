import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck, Minus, Plus, Search, ShoppingBag, Trash2, UtensilsCrossed } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/gestao/store";
import type { CustomerOrder, SaleItem } from "@/lib/gestao/types";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Área do Cliente — Menu, Pedidos e Reservas" },
      {
        name: "description",
        content:
          "Consulte o menu, faça o seu pedido para mesa ou takeaway, reserve uma mesa e acompanhe o pagamento do seu pedido.",
      },
      { property: "og:title", content: "Área do Cliente — Menu, Pedidos e Reservas" },
      {
        property: "og:description",
        content: "Menu digital, pedidos, reservas de mesa e pagamento do seu consumo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CustomerArea,
});

function CustomerArea() {
  const { state, hydrated } = useStore();

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b border-border/60 bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4">
          {state.establishment.logo ? (
            <img
              src={state.establishment.logo}
              alt={`Logo de ${state.establishment.name}`}
              className="size-10 rounded-lg object-cover"
            />
          ) : (
            <div className="grid size-10 place-items-center rounded-lg bg-primary/15 text-primary">
              <UtensilsCrossed className="size-5" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-lg font-semibold">
              {state.establishment.name || "Área do Cliente"}
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              Menu, pedidos, reservas e pagamentos
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/app">Área da equipa</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {!hydrated ? null : !state.setupDone ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              O estabelecimento ainda não concluiu a configuração. Volte mais tarde.
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="pedido">
            <TabsList className="mb-4 w-full">
              <TabsTrigger value="pedido" className="flex-1">
                Menu & Pedido
              </TabsTrigger>
              <TabsTrigger value="reserva" className="flex-1">
                Reservar mesa
              </TabsTrigger>
              <TabsTrigger value="acompanhar" className="flex-1">
                Meu pedido
              </TabsTrigger>
            </TabsList>
            <TabsContent value="pedido">
              <OrderTab />
            </TabsContent>
            <TabsContent value="reserva">
              <ReservationTab />
            </TabsContent>
            <TabsContent value="acompanhar">
              <TrackTab />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}

function OrderTab() {
  const { state, money, placeOrder } = useStore();
  const [category, setCategory] = useState("Todas");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [channel, setChannel] = useState<"mesa" | "takeaway">("mesa");
  const [tableId, setTableId] = useState("");
  const [note, setNote] = useState("");
  const [payMethod, setPayMethod] = useState("na-entrega");
  const [payRef, setPayRef] = useState("");
  const [created, setCreated] = useState<CustomerOrder | null>(null);

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


  const total = cart.reduce((a, i) => a + i.subtotal, 0);

  const add = (id: string) => {
    const p = state.products.find((x) => x.id === id);
    if (!p) return;
    setCart((c) => {
      const found = c.find((i) => i.productId === id);
      if (found)
        return c.map((i) =>
          i.productId === id ? { ...i, qty: i.qty + 1, subtotal: (i.qty + 1) * i.unitPrice } : i,
        );
      return [...c, { productId: id, name: p.name, qty: 1, unitPrice: p.salePrice, subtotal: p.salePrice }];
    });
  };

  const changeQty = (id: string, delta: number) =>
    setCart((c) =>
      c
        .map((i) =>
          i.productId === id ? { ...i, qty: i.qty + delta, subtotal: (i.qty + delta) * i.unitPrice } : i,
        )
        .filter((i) => i.qty > 0),
    );

  const submit = () => {
    if (cart.length === 0) {
      toast.error("Escolha pelo menos um produto.");
      return;
    }
    if (!name.trim()) {
      toast.error("Indique o seu nome.");
      return;
    }
    if (!phone.trim()) {
      toast.error("Indique o seu telefone.");
      return;
    }
    if (channel === "mesa" && !tableId) {
      toast.error("Escolha a mesa.");
      return;
    }
    const order = placeOrder({
      customerName: name.trim(),
      phone: phone.trim(),
      channel,
      items: cart,
      ...(channel === "mesa" ? { tableId } : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
      ...(payMethod !== "na-entrega" ? { paymentMethod: payMethod } : {}),
      ...(payRef.trim() ? { paymentRef: payRef.trim() } : {}),
    });
    setCreated(order);
    setCart([]);
    setNote("");
    setPayRef("");
    toast.success(`Pedido ${order.code} enviado! Guarde o código para acompanhar.`);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      <Card>
        <CardContent className="p-5">
          <div className="mb-3 flex flex-wrap gap-2">
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
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar no menu…"
            />
          </div>
          {products.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Sem produtos disponíveis nesta categoria.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  disabled={p.stock <= 0}
                  onClick={() => add(p.id)}
                  className="rounded-xl border border-border p-3 text-left transition-colors hover:border-primary hover:bg-accent/50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  {p.description ? (
                    <p className="truncate text-xs text-muted-foreground">{p.description}</p>
                  ) : null}
                  <p className="mt-1 font-display text-base">{money(p.salePrice)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {p.stock > 0 ? `${p.category} · disponível` : "Esgotado"}
                  </p>
                </button>
              ))}
            </div>
          )}

        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardContent className="space-y-3 p-5">
            <p className="font-display text-base font-semibold">
              <ShoppingBag className="mr-2 inline size-4" />
              Meu pedido
            </p>
            {cart.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum item selecionado.</p>
            ) : (
              <ul className="space-y-2">
                {cart.map((i) => (
                  <li key={i.productId} className="rounded-lg bg-muted/50 p-3">
                    <div className="flex justify-between gap-2">
                      <span className="truncate text-sm font-medium">{i.name}</span>
                      <span className="text-sm">{money(i.subtotal)}</span>
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

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Nome</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Telefone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+258 …" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Tipo de pedido</Label>
              <Select value={channel} onValueChange={(v) => setChannel(v as "mesa" | "takeaway")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mesa">Consumo na mesa</SelectItem>
                  <SelectItem value="takeaway">Takeaway / levar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {channel === "mesa" ? (
              <div className="space-y-1.5">
                <Label className="text-xs">Mesa</Label>
                <Select value={tableId} onValueChange={setTableId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha a mesa" />
                  </SelectTrigger>
                  <SelectContent>
                    {state.tables.map((tb) => (
                      <SelectItem key={tb.id} value={tb.id}>
                        {tb.name} — {tb.area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label className="text-xs">Forma de pagamento</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setPayMethod("na-entrega")}
                  className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                    payMethod === "na-entrega"
                      ? "border-primary bg-accent/60"
                      : "border-border hover:border-primary/60"
                  }`}
                >
                  <span className="block font-medium">Dinheiro físico</span>
                  <span className="block text-xs text-muted-foreground">Pagar no local / na entrega</span>
                </button>
                {state.settings.paymentMethods
                  .filter((pm) => pm.toLowerCase() !== "dinheiro")
                  .map((pm) => (
                    <button
                      key={pm}
                      type="button"
                      onClick={() => setPayMethod(pm)}
                      className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                        payMethod === pm
                          ? "border-primary bg-accent/60"
                          : "border-border hover:border-primary/60"
                      }`}
                    >
                      <span className="block font-medium">{pm}</span>
                      <span className="block text-xs text-muted-foreground">Já paguei / vou pagar por {pm}</span>
                    </button>
                  ))}
              </div>
              {payMethod !== "na-entrega" ? (
                <Input
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder={`Referência / comprovativo do pagamento (${payMethod})`}
                />
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Observações</Label>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3 font-display text-lg font-semibold">
              <span>Total</span>
              <span>{money(total)}</span>
            </div>
            <Button className="w-full" size="lg" onClick={submit}>
              Enviar pedido
            </Button>
            <p className="text-xs text-muted-foreground">
              O pagamento é confirmado pela equipa do estabelecimento.
            </p>
          </CardContent>
        </Card>

        {created ? (
          <Card>
            <CardContent className="p-5 text-sm">
              <p className="font-display text-base font-semibold">Pedido enviado</p>
              <p className="mt-1 text-muted-foreground">
                Código <span className="font-mono font-semibold text-foreground">{created.code}</span> — total{" "}
                {money(created.total)}
              </p>
              <p className="mt-1 text-muted-foreground">
                Use o código no separador “Meu pedido” para acompanhar o estado.
              </p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function ReservationTab() {
  const { state, placeReservation } = useStore();
  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    email: "",
    date: new Date().toISOString().slice(0, 10),
    time: "19:00",
    people: "2",
    area: "",
    note: "",
  });
  const [code, setCode] = useState<string | null>(null);
  const areas = useMemo(
    () => Array.from(new Set(state.tables.map((tb) => tb.area).filter(Boolean))),
    [state.tables],
  );

  const submit = () => {
    if (!form.customerName.trim()) {
      toast.error("Indique o seu nome.");
      return;
    }
    if (!form.phone.trim()) {
      toast.error("Indique o seu telefone.");
      return;
    }
    const people = Number(form.people) || 1;
    const r = placeReservation({
      customerName: form.customerName.trim(),
      phone: form.phone.trim(),
      date: form.date,
      time: form.time,
      people,
      ...(form.email.trim() ? { email: form.email.trim() } : {}),
      ...(form.area ? { area: form.area } : {}),
      ...(form.note.trim() ? { note: form.note.trim() } : {}),
    });
    setCode(r.code);
    toast.success(`Reserva ${r.code} enviada! Aguarde a confirmação.`);
  };

  return (
    <Card className="mx-auto max-w-2xl">
      <CardContent className="space-y-4 p-5">
        <p className="font-display text-base font-semibold">
          <CalendarCheck className="mr-2 inline size-4" />
          Pedido de reserva
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Nome</Label>
            <Input
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Telefone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">E-mail (opcional)</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Pessoas</Label>
            <Input
              type="number"
              min="1"
              value={form.people}
              onChange={(e) => setForm({ ...form, people: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Data</Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Hora</Label>
            <Input
              type="time"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
            />
          </div>
        </div>
        {areas.length > 0 ? (
          <div className="space-y-1.5">
            <Label className="text-xs">Área preferida (opcional)</Label>
            <Select value={form.area} onValueChange={(v) => setForm({ ...form, area: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Sem preferência" />
              </SelectTrigger>
              <SelectContent>
                {areas.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <div className="space-y-1.5">
          <Label className="text-xs">Observações</Label>
          <Textarea
            rows={2}
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
        </div>
        <Button className="w-full" size="lg" onClick={submit}>
          Pedir reserva
        </Button>
        {code ? (
          <p className="text-sm text-muted-foreground">
            Reserva registada com o código{" "}
            <span className="font-mono font-semibold text-foreground">{code}</span>. A equipa irá
            confirmar.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

const ORDER_LABEL: Record<string, string> = {
  novo: "Recebido",
  aceite: "Em preparação",
  pronto: "Pronto",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

function TrackTab() {
  const { state, money } = useStore();
  const [code, setCode] = useState("");
  const term = code.trim().toUpperCase();
  const order = state.orders.find((o) => o.code.toUpperCase() === term);
  const reservation = state.reservations.find((r) => r.code.toUpperCase() === term);

  return (
    <Card className="mx-auto max-w-2xl">
      <CardContent className="space-y-4 p-5">
        <div className="space-y-1.5">
          <Label className="text-xs">Código do pedido ou reserva</Label>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="PD-0001 ou RS-0001"
          />
        </div>
        {term && !order && !reservation ? (
          <p className="text-sm text-muted-foreground">Nenhum registo encontrado com esse código.</p>
        ) : null}
        {order ? (
          <div className="space-y-2 rounded-lg border border-border p-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-semibold">{order.code}</span>
              <Badge variant="outline">{ORDER_LABEL[order.status]}</Badge>
              <Badge variant={order.paymentStatus === "pago" ? "default" : "secondary"}>
                {order.paymentStatus === "pago"
                  ? "Pago"
                  : order.paymentStatus === "declarado"
                    ? "Pagamento em verificação"
                    : "Pagamento pendente"}
              </Badge>
            </div>
            <ul className="space-y-1 text-muted-foreground">
              {order.items.map((i) => (
                <li key={i.productId} className="flex justify-between">
                  <span>
                    {i.qty}× {i.name}
                  </span>
                  <span>{money(i.subtotal)}</span>
                </li>
              ))}
            </ul>
            <p className="flex justify-between font-display font-semibold">
              <span>Total</span>
              <span>{money(order.total)}</span>
            </p>
            {order.channel === "mesa" && order.tableName ? (
              <p className="text-muted-foreground">Mesa: {order.tableName}</p>
            ) : null}
          </div>
        ) : null}
        {reservation ? (
          <div className="space-y-1 rounded-lg border border-border p-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-semibold">{reservation.code}</span>
              <Badge variant="outline">{reservation.status}</Badge>
            </div>
            <p className="text-muted-foreground">
              {reservation.date} às {reservation.time} · {reservation.people} pessoa(s)
              {reservation.tableName ? ` · ${reservation.tableName}` : ""}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
