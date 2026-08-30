import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/gestao/AppShell";
import { EmptyState, RequireSetup, SectionCard } from "@/components/gestao/ui-bits";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/gestao/store";
import type { Customer } from "@/lib/gestao/types";

export const Route = createFileRoute("/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes — Gestão de Bar e Restaurante" },
      {
        name: "description",
        content:
          "Cadastro de clientes com histórico de compras, total gasto, número de compras e última visita.",
      },
      { property: "og:title", content: "Clientes" },
      { property: "og:description", content: "Conheça e acompanhe os seus melhores clientes." },
    ],
  }),
  component: () => (
    <AppShell title="Clientes" subtitle="Cadastro e histórico de compras">
      <RequireSetup>
        <CustomersPage />
      </RequireSetup>
    </AppShell>
  ),
});

const empty = { id: undefined as string | undefined, name: "", phone: "", email: "", address: "", note: "" };

function CustomersPage() {
  const { state, money, saveCustomer, deleteCustomer } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [search, setSearch] = useState("");

  const stats = (id: string) => {
    const sales = state.sales.filter((s) => s.customerId === id);
    return {
      count: sales.length,
      total: sales.reduce((a, s) => a + s.total, 0),
      last: sales[0]?.date,
    };
  };

  const list = state.customers.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search),
  );

  const submit = () => {
    if (form.name.trim().length < 2) {
      toast.error("Informe o nome do cliente.");
      return;
    }
    saveCustomer(form as Omit<Customer, "id"> & { id?: string | undefined });
    setOpen(false);
    toast.success("Cliente guardado.");
  };

  return (
    <SectionCard
      title="Clientes"
      description={`${state.customers.length} cliente(s)`}
      actions={
        <Button
          onClick={() => {
            setForm(empty);
            setOpen(true);
          }}
        >
          <Plus className="mr-2 size-4" /> Novo cliente
        </Button>
      }
    >
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Pesquisar cliente…"
        className="mb-4 max-w-xs"
      />
      {list.length === 0 ? (
        <EmptyState message="Nenhum cliente cadastrado." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {list.map((c) => {
            const s = stats(c.id);
            return (
              <div key={c.id} className="rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.phone || "sem telefone"}</p>
                  </div>
                  <div className="flex">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setForm({ ...c, note: c.note ?? "" });
                        setOpen(true);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-danger"
                      onClick={() => {
                        deleteCustomer(c.id);
                        toast.success("Cliente removido.");
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                <dl className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <dt>Total gasto</dt>
                    <dd className="font-medium text-foreground">{money(s.total)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Compras</dt>
                    <dd className="font-medium text-foreground">{s.count}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Última compra</dt>
                    <dd className="font-medium text-foreground">
                      {s.last ? new Date(s.last).toLocaleDateString("pt-PT") : "—"}
                    </dd>
                  </div>
                </dl>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar cliente" : "Novo cliente"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Nome *</Label>
              <Input
                value={form.name}
                placeholder="Ex.: Maria Costa"
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Telefone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Endereço</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Observação</Label>
              <Textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submit}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SectionCard>
  );
}
