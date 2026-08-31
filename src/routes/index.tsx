import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarCheck,
  ChefHat,
  Clock,
  LayoutDashboard,
  MapPin,
  Phone,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/gestao/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Restaurante & Bar — Menu, Reservas e Pedidos Online" },
      {
        name: "description",
        content:
          "Conheça o nosso restaurante e bar: veja o menu, faça o seu pedido online e reserve a sua mesa em poucos segundos.",
      },
      { property: "og:title", content: "Restaurante & Bar — Menu, Reservas e Pedidos Online" },
      {
        property: "og:description",
        content: "Menu digital, pedidos online, reservas de mesa e pagamento por M-Pesa, e-Mola ou dinheiro.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WebsitePage,
});

function WebsitePage() {
  const { state, money, hydrated } = useStore();
  const est = state.establishment;
  const name = est.name || "O Nosso Restaurante";
  const destaques = state.products.filter((p) => p.active).slice(0, 6);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
            <ChefHat className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-base font-bold">{name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {est.type || "Restaurante & Bar"}
            </p>
          </div>
          <nav className="hidden items-center gap-1 sm:flex">
            <Button asChild variant="ghost" size="sm">
              <a href="#menu">Menu</a>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <a href="#contactos">Contactos</a>
            </Button>
          </nav>
          <Button asChild size="sm">
            <Link to="/menu">
              Pedir agora <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="border-b border-border bg-gradient-to-b from-primary/10 to-transparent">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-2 md:items-center md:py-24">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                <Sparkles className="size-3.5" /> Pedidos e reservas online
              </span>
              <h1 className="mt-4 font-display text-4xl font-bold leading-tight md:text-5xl">
                Sabor de casa, servido do jeito que você gosta
              </h1>
              <p className="mt-4 max-w-prose text-muted-foreground">
                Veja o nosso menu, faça o pedido pelo telefone ou computador e reserve a sua mesa.
                Pague por M-Pesa, e-Mola, cartão ou em dinheiro.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to="/menu">
                    <ShoppingBag className="mr-2 size-4" /> Ver menu e pedir
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/menu">
                    <CalendarCheck className="mr-2 size-4" /> Reservar mesa
                  </Link>
                </Button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: UtensilsCrossed, t: "Menu digital", d: "Pratos e bebidas sempre actualizados." },
                { icon: CalendarCheck, t: "Reservas fáceis", d: "Escolha data, hora e número de pessoas." },
                { icon: ShoppingBag, t: "Pedidos online", d: "Para a mesa, take-away ou entrega." },
                { icon: Clock, t: "Atendimento rápido", d: "A equipa recebe o pedido na hora." },
              ].map((f) => (
                <div key={f.t} className="rounded-2xl border border-border bg-card p-5">
                  <f.icon className="size-5 text-primary" />
                  <p className="mt-3 font-semibold">{f.t}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="menu" className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-display text-3xl font-bold">Destaques do menu</h2>
          <p className="mt-2 text-muted-foreground">Uma amostra do que servimos hoje.</p>

          {hydrated && destaques.length > 0 ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {destaques.map((p) => (
                <div key={p.id} className="rounded-2xl border border-border bg-card p-5">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {p.category}
                  </p>
                  <p className="mt-1 font-semibold">{p.name}</p>
                  {p.description ? (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {p.description}
                    </p>
                  ) : null}
                  <p className="mt-3 font-display text-lg font-bold text-primary">
                    {money(p.salePrice)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-8 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              O menu completo está disponível na área de pedidos.
            </p>
          )}

          <div className="mt-8">
            <Button asChild>
              <Link to="/menu">
                Ver menu completo <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </div>
        </section>

        <section id="contactos" className="border-t border-border bg-card/40">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-16 md:grid-cols-3">
            <div>
              <MapPin className="size-5 text-primary" />
              <p className="mt-3 font-semibold">Onde estamos</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {[est.address, est.city, est.country].filter(Boolean).join(", ") ||
                  "Endereço por definir nas configurações."}
              </p>
            </div>
            <div>
              <Phone className="size-5 text-primary" />
              <p className="mt-3 font-semibold">Contacto</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {est.phone || "Telefone por definir"}
                {est.email ? ` · ${est.email}` : ""}
              </p>
            </div>
            <div>
              <Clock className="size-5 text-primary" />
              <p className="mt-3 font-semibold">Horário</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Todos os dias · 08:00 às 23:00
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} {name}
          </p>
          <Button asChild variant="ghost" size="sm">
            <Link to="/app">
              <LayoutDashboard className="mr-2 size-4" /> Área da equipa
            </Link>
          </Button>
        </div>
      </footer>
    </div>
  );
}
