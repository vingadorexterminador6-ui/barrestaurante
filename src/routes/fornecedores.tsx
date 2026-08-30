import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/gestao/AppShell";
import { EmptyState, RequireSetup, SectionCard } from "@/components/gestao/ui-bits";
import { Badge } from "@/components/ui/badge";
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
import type { Supplier } from "@/lib/gestao/types";

export const Route = createFileRoute("/fornecedores")({
  head: () => ({
    meta: [
      { title: "Fornecedores — Gestão de Bar e Restaurante" },
      {
        name: "description",
        content:
          "Cadastro de fornecedores com contactos, produtos fornecidos e histórico de compras por fornecedor.",
      },
      { property: "og:title", content: "Fornecedores" },
      { property: "og:description", content: "Contactos e histórico de compras dos seus fornecedores." },
    ],
  }),
  component: () => (
    <AppShell title="Fornecedores" subtitle="Contactos e histórico de compras">
      <RequireSetup>
        <SuppliersPage />
      </RequireSetup>
    </AppShell>
  ),
});

const empty = {
  id: undefined as string | undefined,
  name: "",
  company: "",
  phone: "",
  email: "",
  address: "",
  products: "",
  note: "",
};

function SuppliersPage() {
  const { state, money, saveSupplier, deleteSupplier } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);

  const historyOf = (id: string) => {
    const purchases = state.purchases.filter((p) => p.supplierId === id);
    return { count: purchases.length, total: purchases.reduce((a, p) => a + p.total, 0) };
  };

  const submit = () => {
    if (form.name.trim().length < 2) {
      toast.error("Informe o nome do fornecedor.");
      return;
    }
    saveSupplier(form as Omit<Supplier, "id"> & { id?: string | undefined });
    setOpen(false);
    toast.success("Fornecedor guardado.");
  };

  return (
    <SectionCard
      title="Fornecedores"
      description={`${state.suppliers.length} fornecedor(es)`}
      actions={
        <Button
          onClick={() => {
            setForm(empty);
            setOpen(true);
          }}
        >
          <Plus className="mr-2 size-4" /> Novo fornecedor
        </Button>
      }
    >
      {state.suppliers.length === 0 ? (
        <EmptyState message="Nenhum fornecedor cadastrado." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {state.suppliers.map((s) => {
            const h = historyOf(s.id);
            return (
              <div key={s.id} className="rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.company || "—"}</p>
                  </div>
                  <div className="flex">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setForm({ ...s, note: s.note ?? "" });
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
                        deleteSupplier(s.id);
                        toast.success("Fornecedor removido.");
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{s.phone} · {s.email}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.products}</p>
                <Badge variant="outline" className="mt-3">
                  {h.count} compra(s) · {money(h.total)}
                </Badge>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar fornecedor" : "Novo fornecedor"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome *</Label>
              <Input
                value={form.name}
                placeholder="Ex.: Distribuidora Sol"
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Empresa</Label>
              <Input
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
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
              <Label className="text-xs">Produtos fornecidos</Label>
              <Input
                value={form.products}
                placeholder="Ex.: Cervejas, refrigerantes"
                onChange={(e) => setForm({ ...form, products: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Observações</Label>
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
