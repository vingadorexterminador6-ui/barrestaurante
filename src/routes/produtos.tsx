import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/gestao/AppShell";
import { EmptyState, RequireSetup, SectionCard } from "@/components/gestao/ui-bits";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/gestao/store";
import type { Product, Sector } from "@/lib/gestao/types";

export const Route = createFileRoute("/produtos")({
  head: () => ({
    meta: [
      { title: "Produtos — Gestão de Bar e Restaurante" },
      {
        name: "description",
        content:
          "Cadastre bebidas, comidas e pratos com preço de compra, preço de venda, unidade e stock mínimo.",
      },
      { property: "og:title", content: "Produtos" },
      { property: "og:description", content: "Cadastro completo de produtos do estabelecimento." },
    ],
  }),
  component: () => (
    <AppShell title="Produtos" subtitle="Cadastro de bebidas, comidas e pratos">
      <RequireSetup>
        <ProductsPage />
      </RequireSetup>
    </AppShell>
  ),
});

const emptyForm = (minStock: number, unit: string, category: string) => ({
  id: undefined as string | undefined,
  name: "",
  sku: "",
  category,
  description: "",
  unit,
  costPrice: 0,
  salePrice: 0,
  stock: 0,
  minStock,
  active: true,
  sector: "bar" as Sector,
  supplierId: "none",
});

function ProductsPage() {
  const { state, money, saveProduct, deleteProduct } = useStore();
  const { settings } = state;
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todas");
  const [form, setForm] = useState(() =>
    emptyForm(settings.defaultMinStock, settings.units[0] ?? "un", settings.productCategories[0] ?? "Outros"),
  );

  const list = useMemo(
    () =>
      state.products.filter(
        (p) =>
          (filter === "Todas" || p.category === filter) &&
          (p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.sku.toLowerCase().includes(search.toLowerCase())),
      ),
    [state.products, filter, search],
  );

  const openNew = () => {
    setForm(
      emptyForm(
        settings.defaultMinStock,
        settings.units[0] ?? "un",
        settings.productCategories[0] ?? "Outros",
      ),
    );
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setForm({ ...p, sector: p.sector ?? "bar", supplierId: p.supplierId ?? "none" });
    setOpen(true);
  };

  const submit = () => {
    if (form.name.trim().length < 2) {
      toast.error("Informe o nome do produto.");
      return;
    }
    if (form.salePrice <= 0) {
      toast.error("O preço de venda deve ser maior que zero.");
      return;
    }
    const { supplierId, ...rest } = form;
    saveProduct({
      ...rest,
      ...(supplierId !== "none" ? { supplierId } : {}),
    });
    setOpen(false);
    toast.success(form.id ? "Produto atualizado." : "Produto adicionado com sucesso.");
  };

  return (
    <SectionCard
      title="Lista de produtos"
      description={`${state.products.length} produto(s) cadastrado(s)`}
      actions={
        <Button onClick={openNew}>
          <Plus className="mr-2 size-4" /> Novo produto
        </Button>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar por nome ou código…"
          className="max-w-xs"
        />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todas">Todas as categorias</SelectItem>
            {settings.productCategories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {list.length === 0 ? (
        <EmptyState
          message="Nenhum produto encontrado."
          action={
            <Button onClick={openNew}>
              <Plus className="mr-2 size-4" /> Adicionar o primeiro produto
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="py-2">Produto</th>
                <th className="py-2">Categoria</th>
                <th className="py-2">Área</th>
                <th className="py-2">Compra</th>
                <th className="py-2">Venda</th>
                <th className="py-2">Stock</th>
                <th className="py-2">Estado</th>
                <th className="py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className="border-b border-border/60">
                  <td className="py-2.5">
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.sku || "sem código"}</p>
                  </td>
                  <td className="py-2.5">{p.category}</td>
                  <td className="py-2.5 capitalize">{p.sector ?? "geral"}</td>
                  <td className="py-2.5">{money(p.costPrice)}</td>
                  <td className="py-2.5">{money(p.salePrice)}</td>
                  <td className="py-2.5">
                    <Badge
                      variant={
                        p.stock <= 0 ? "destructive" : p.stock <= p.minStock ? "secondary" : "outline"
                      }
                    >
                      {p.stock} {p.unit}
                    </Badge>
                  </td>
                  <td className="py-2.5">{p.active ? "Ativo" : "Inativo"}</td>
                  <td className="py-2.5 text-right">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(p)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-danger"
                      onClick={() => setToDelete(p)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar produto" : "Novo produto"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome *</Label>
              <Input
                value={form.name}
                placeholder="Ex.: Cerveja 2M 500ml"
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Código / SKU</Label>
              <Input
                value={form.sku}
                placeholder="Ex.: BEB-001"
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Categoria</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {settings.productCategories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Área do estabelecimento</Label>
              <Select
                value={form.sector}
                onValueChange={(v) => setForm({ ...form, sector: v as Sector })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Bar</SelectItem>
                  <SelectItem value="restaurante">Restaurante</SelectItem>
                  <SelectItem value="geral">Geral (ambos)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Unidade</Label>
              <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {settings.units.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Preço de compra</Label>
              <Input
                type="number"
                min="0"
                value={form.costPrice}
                onChange={(e) => setForm({ ...form, costPrice: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Preço de venda *</Label>
              <Input
                type="number"
                min="0"
                value={form.salePrice}
                onChange={(e) => setForm({ ...form, salePrice: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Stock atual</Label>
              <Input
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Stock mínimo</Label>
              <Input
                type="number"
                min="0"
                value={form.minStock}
                onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Fornecedor</Label>
              <Select
                value={form.supplierId}
                onValueChange={(v) => setForm({ ...form, supplierId: v })}
              >
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
            <div className="flex items-center gap-3 pt-6">
              <Switch
                checked={form.active}
                onCheckedChange={(v) => setForm({ ...form, active: v })}
              />
              <Label className="text-xs">Produto ativo</Label>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Descrição</Label>
              <Textarea
                value={form.description}
                placeholder="Ex.: Cerveja gelada, garrafa de 500ml"
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
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

      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete?.name} será removido permanentemente do cadastro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (toDelete) deleteProduct(toDelete.id);
                setToDelete(null);
                toast.success("Produto removido.");
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SectionCard>
  );
}
