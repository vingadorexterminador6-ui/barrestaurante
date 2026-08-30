import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  BookOpen,
  Boxes,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  Menu,
  Moon,
  Package,
  Receipt,
  Search,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Sun,
  Truck,
  User,
  Users,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useMetrics, useStore } from "@/lib/gestao/store";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", key: "dashboard", icon: LayoutDashboard },
  { to: "/vendas", key: "sales", icon: ShoppingCart },
  { to: "/mesas", key: "tables", icon: UtensilsCrossed },
  { to: "/produtos", key: "products", icon: Package },
  { to: "/stock", key: "stock", icon: Boxes },
  { to: "/compras", key: "purchases", icon: ShoppingBag },
  { to: "/caixa", key: "cash", icon: Wallet },
  { to: "/despesas", key: "expenses", icon: Receipt },
  { to: "/entradas", key: "income", icon: CreditCard },
  { to: "/clientes", key: "customers", icon: User },
  { to: "/funcionarios", key: "employees", icon: Users },
  { to: "/fornecedores", key: "suppliers", icon: Truck },
  { to: "/relatorios", key: "reports", icon: BarChart3 },
  { to: "/configuracoes", key: "settings", icon: Settings },
  { to: "/manual", key: "manual", icon: BookOpen },
] as const;

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useStore();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="space-y-1 p-3">
      {NAV.map((item) => {
        const active = pathname === item.to;
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="truncate">{t(item.key)}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  const { state } = useStore();
  return (
    <div className="flex items-center gap-3 border-b border-sidebar-border px-4 py-4">
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
      <div className="min-w-0">
        <p className="truncate font-display text-sm font-semibold">
          {state.establishment.name || state.settings.systemName}
        </p>
        <p className="truncate text-xs text-muted-foreground">{state.establishment.type}</p>
      </div>
    </div>
  );
}

function GlobalSearch() {
  const { state, money } = useStore();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    const hits: { group: string; label: string; detail: string; to: string }[] = [];
    const add = (group: string, label: string, detail: string, to: string) =>
      hits.push({ group, label, detail, to });
    state.products
      .filter((p) => p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term))
      .slice(0, 5)
      .forEach((p) => add("Produtos", p.name, `${p.stock} ${p.unit} · ${money(p.salePrice)}`, "/produtos"));
    state.customers
      .filter((c) => c.name.toLowerCase().includes(term) || c.phone.includes(term))
      .slice(0, 5)
      .forEach((c) => add("Clientes", c.name, c.phone, "/clientes"));
    state.employees
      .filter((e) => e.name.toLowerCase().includes(term))
      .slice(0, 5)
      .forEach((e) => add("Funcionários", e.name, e.role, "/funcionarios"));
    state.suppliers
      .filter((s) => s.name.toLowerCase().includes(term) || s.company.toLowerCase().includes(term))
      .slice(0, 5)
      .forEach((s) => add("Fornecedores", s.name, s.company, "/fornecedores"));
    state.expenses
      .filter((e) => e.description.toLowerCase().includes(term))
      .slice(0, 5)
      .forEach((e) => add("Despesas", e.description, money(e.amount), "/despesas"));
    state.purchases
      .filter((p) => p.supplierName.toLowerCase().includes(term))
      .slice(0, 5)
      .forEach((p) => add("Compras", p.supplierName, money(p.total), "/compras"));
    state.sales
      .filter((s) => s.items.some((i) => i.name.toLowerCase().includes(term)))
      .slice(0, 5)
      .forEach((s) => add("Vendas", `Venda ${s.id.slice(0, 6)}`, money(s.total), "/relatorios"));
    return hits;
  }, [q, state, money]);

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="hidden w-64 justify-start gap-2 text-muted-foreground sm:flex"
      >
        <Search className="size-4" /> Pesquisa global
      </Button>
      <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => setOpen(true)}>
        <Search className="size-4" />
        <span className="sr-only">Pesquisar</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Pesquisa global</DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Produtos, vendas, clientes, despesas…"
          />
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {q && results.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Nenhum resultado.</p>
            ) : null}
            {results.map((r, idx) => (
              <Link
                key={`${r.label}-${idx}`}
                to={r.to}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-accent"
              >
                <span className="flex items-center gap-2">
                  <Badge variant="secondary">{r.group}</Badge>
                  {r.label}
                </span>
                <span className="text-muted-foreground">{r.detail}</span>
              </Link>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Notifications() {
  const { state, money } = useStore();
  const { lowStock, outOfStock, expensesTodayTotal } = useMetrics();

  const items: string[] = [];
  outOfStock.forEach((p) => items.push(`🚨 ${p.name} está esgotado`));
  lowStock.forEach((p) => items.push(`⚠️ ${p.name} com stock baixo (${p.stock})`));
  if (state.cashOpen && state.cashOpenedAt) {
    const hours = (Date.now() - new Date(state.cashOpenedAt).getTime()) / 36e5;
    if (hours > 12) items.push("🔔 A caixa está aberta há mais de 12 horas");
  }
  if (expensesTodayTotal > 0) items.push(`🔔 Despesas de hoje: ${money(expensesTodayTotal)}`);
  const lastClosing = state.dailyClosings[0];
  if (!lastClosing || new Date(lastClosing.date).toDateString() !== new Date().toDateString())
    items.push("🔔 Fecho diário pendente");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-4" />
          {items.length > 0 ? (
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-danger" />
          ) : null}
          <span className="sr-only">Notificações</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <p className="mb-2 font-display text-sm font-semibold">Notificações</p>
        <div className="max-h-72 space-y-2 overflow-y-auto text-sm">
          {items.length === 0 ? (
            <p className="text-muted-foreground">Tudo em ordem por agora.</p>
          ) : (
            items.slice(0, 12).map((i) => (
              <p key={i} className="rounded-md bg-muted/60 px-3 py-2">
                {i}
              </p>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function AppShell({ title, subtitle, actions, children }: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { state, updateSettings } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const dark = state.settings.theme === "dark";

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <Brand />
        <div className="flex-1 overflow-y-auto">
          <NavList />
        </div>
        <div className="border-t border-sidebar-border p-3 text-xs text-muted-foreground">
          Modo {state.settings.mode === "automatico" ? "automático" : "manual"} ·{" "}
          {state.settings.currency}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="size-5" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar p-0">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <Brand />
              <div className="overflow-y-auto">
                <NavList onNavigate={() => setMobileOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-lg font-semibold">{title}</h1>
            {subtitle ? (
              <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <GlobalSearch />
            <Notifications />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => updateSettings({ theme: dark ? "light" : "dark" })}
            >
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
              <span className="sr-only">Alternar tema</span>
            </Button>
            <Badge variant={state.cashOpen ? "default" : "secondary"} className="hidden sm:inline-flex">
              {state.cashOpen ? "Caixa aberta" : "Caixa fechada"}
            </Badge>
          </div>

          {actions ? <div className="flex w-full flex-wrap gap-2 sm:w-auto">{actions}</div> : null}
        </header>

        <main className="flex-1 space-y-6 p-4 md:p-6">{children}</main>

        <footer className="border-t border-border px-4 py-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            {state.settings.systemName} <ChevronRight className="size-3" />{" "}
            {state.establishment.city || "—"}, {state.establishment.country || "—"}
          </span>
        </footer>
      </div>
    </div>
  );
}
