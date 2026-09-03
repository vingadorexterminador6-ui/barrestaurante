import { createFileRoute, Link } from "@tanstack/react-router";
import { UtensilsCrossed } from "lucide-react";

import { OrderTab, ReservationTab, TrackTab } from "@/components/gestao/customer-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/lib/gestao/store";

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
          <Button asChild size="sm">
            <Link to="/cliente">Entrar na minha conta</Link>
          </Button>
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
