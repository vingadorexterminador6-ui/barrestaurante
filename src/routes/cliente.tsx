import { createFileRoute, Link } from "@tanstack/react-router";
import { LogOut, UserRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { MyOrdersTab, OrderTab, ReservationTab } from "@/components/gestao/customer-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/lib/gestao/store";

export const Route = createFileRoute("/cliente")({
  head: () => ({
    meta: [
      { title: "Conta do Cliente — Pedidos, Reservas e Pagamentos" },
      {
        name: "description",
        content:
          "Entre com e-mail e senha na sua conta de cliente para ver o menu, fazer pedidos, reservar mesa e acompanhar pagamentos.",
      },
      { property: "og:title", content: "Conta do Cliente — Pedidos, Reservas e Pagamentos" },
      {
        property: "og:description",
        content: "Login de cliente com menu digital, pedidos, reservas e histórico de pagamentos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ClientAccountArea,
});

function ClientAccountArea() {
  const { state, hydrated, customerSession, logoutCustomer } = useStore();

  if (!hydrated) return null;

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b border-border/60 bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4">
          <div className="grid size-10 place-items-center rounded-lg bg-primary/15 text-primary">
            <UserRound className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-lg font-semibold">
              {customerSession ? `Olá, ${customerSession.name}` : "Área do Cliente"}
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              {state.establishment.name || "Pedidos, reservas e pagamentos"}
            </p>
          </div>
          {customerSession ? (
            <Button variant="outline" size="sm" onClick={logoutCustomer}>
              <LogOut className="mr-2 size-4" /> Sair
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link to="/menu">Ver menu público</Link>
            </Button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {!customerSession ? (
          <AuthForms />
        ) : (
          <Tabs defaultValue="pedido">
            <TabsList className="mb-4 w-full">
              <TabsTrigger value="pedido" className="flex-1">
                Menu & Pedido
              </TabsTrigger>
              <TabsTrigger value="reserva" className="flex-1">
                Reservar mesa
              </TabsTrigger>
              <TabsTrigger value="meus" className="flex-1">
                Meus pedidos
              </TabsTrigger>
            </TabsList>
            <TabsContent value="pedido">
              <OrderTab account={customerSession} />
            </TabsContent>
            <TabsContent value="reserva">
              <ReservationTab account={customerSession} />
            </TabsContent>
            <TabsContent value="meus">
              <MyOrdersTab account={customerSession} />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}

function AuthForms() {
  const { loginCustomer, registerCustomerAccount } = useStore();
  const [mode, setMode] = useState<"login" | "registo">("login");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });

  const submit = () => {
    const res =
      mode === "login"
        ? loginCustomer(form.email, form.password)
        : registerCustomerAccount(form);
    if (!res.ok) {
      toast.error(res.error ?? "Não foi possível continuar.");
      return;
    }
    toast.success(mode === "login" ? "Sessão iniciada!" : "Conta criada com sucesso!");
  };

  return (
    <Card className="mx-auto max-w-md">
      <CardContent className="space-y-4 p-6">
        <div>
          <p className="font-display text-lg font-semibold">
            {mode === "login" ? "Entrar na minha conta" : "Criar conta de cliente"}
          </p>
          <p className="text-sm text-muted-foreground">
            Use o seu e-mail e senha para fazer pedidos, reservas e pagamentos.
          </p>
        </div>

        {mode === "registo" ? (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs">Nome completo</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Telefone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+258 …"
              />
            </div>
          </>
        ) : null}

        <div className="space-y-1.5">
          <Label className="text-xs">E-mail</Label>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="cliente@email.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Senha</Label>
          <Input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••"
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
          />
        </div>

        <Button className="w-full" size="lg" onClick={submit}>
          {mode === "login" ? "Entrar" : "Criar conta"}
        </Button>
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => setMode(mode === "login" ? "registo" : "login")}
        >
          {mode === "login" ? "Não tenho conta — criar agora" : "Já tenho conta — entrar"}
        </Button>
      </CardContent>
    </Card>
  );
}
