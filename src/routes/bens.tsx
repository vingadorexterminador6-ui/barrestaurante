import { createFileRoute } from "@tanstack/react-router";
import { Armchair, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/gestao/AppShell";
import { EmptyState, RequireSetup, SectionCard, StatCard } from "@/components/gestao/ui-bits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/gestao/store";
import type { Asset, AssetCondition } from "@/lib/gestao/types";

export const Route = createFileRoute("/bens")({
  head: () => ({
    meta: [
      { title: "Bens e Património — Gestão de Bar e Restaurante" },
      {
        name: "description",
        content:
          "Registo dos bens do estabelecimento: equipamentos, mobiliário e utensílios com valor, data de aquisição, estado e responsável.",
      },
      { property: "og:title", content: "Bens e Património" },
      {
        property: "og:description",
        content: "Inventário de equipamentos e mobiliário com valor total do património.",
      },
    ],
  }),
  component: () => (
    <AppShell
      title="Bens & Património"
      subtitle="Equipamentos, mobiliário e utensílios do estabelecimento"
    >
      <RequireSetup>
        <AssetsPage />
      </RequireSetup>
    </AppShell>
  ),
});

const CATEGORIES = [
  "Equipamento de cozinha",
  "Equipamento de bar",
  "Mobiliário",
  "Electrodomésticos",
  "Electrónica",
  "Utensílios",
  "Veículos",
  "Outros",
];

const CONDITIONS: { value: AssetCondition; label: string }[] = [
  { value: "novo", label: "Novo" },
  { value: "bom", label: "Bom" },
  { value: "usado", label: "Usado" },
  { value: "avariado", label: "Avariado" },
  { value: "abatido", label: "Abatido" },
];

const conditionVariant = (c: AssetCondition) =>
  c === "avariado" || c === "abatido" ? "destructive" : c === "usado" ? "secondary" : "default";

const emptyForm = {
  id: undefined as string | undefined,
  name: "",
  code: "",
  category: CATEGORIES[0]!,
  location: "",
  qty: "1",
  value: "",
  acquiredAt: new Date().toISOString().slice(0, 10),
  condition: "novo" as AssetCondition,
  supplierId: "",
  responsibleId: "",
  note: "",
};

function AssetsPage() {
  const { state, money, saveAsset, deleteAsset, addExpense } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [registerOutflow, setRegisterOutflow] = useState(false);
  const [payMethod, setPayMethod] = useState(state.settings.paymentMethods[0] ?? "Dinheiro");
  const [filter, setFilter] = useState("todos");

  const assets = state.assets;
  const totals = useMemo(() => {
    const total = assets.reduce((a, x) => a + x.value * x.qty, 0);
    const broken = assets.filter((x) => x.condition === "avariado" || x.condition === "abatido");
    const units = assets.reduce((a, x) => a + x.qty, 0);
    return { total, broken, units };
  }, [assets]);

  const visible = useMemo(
    () => (filter === "todos" ? assets : assets.filter((a) => a.category === filter)),
    [assets, filter],
  );

  const edit = (a: Asset) => {
    setForm({
      id: a.id,
      name: a.name,
      code: a.code,
      category: a.category,
      location: a.location,
      qty: String(a.qty),
      value: String(a.value),
      acquiredAt: a.acquiredAt.slice(0, 10),
      condition: a.condition,
      supplierId: a.supplierId ?? "",
      responsibleId: a.responsibleId ?? "",
      note: a.note ?? "",
    });
    setRegisterOutflow(false);
    setOpen(true);
  };

  const create = () => {
    setForm({ ...emptyForm, code: `BEM-${String(assets.length + 1).padStart(3, "0")}` });
    setRegisterOutflow(false);
    setOpen(true);
  };

  const submit = () => {
    const qty = Number(form.qty) || 0;
    const value = Number(form.value) || 0;
    if (form.name.trim().length < 2) {
      toast.error("Informe o nome do bem.");
      return;
    }
    if (qty <= 0) {
      toast.error("A quantidade deve ser maior que zero.");
      return;
    }
    saveAsset({
      ...(form.id ? { id: form.id } : {}),
      name: form.name.trim(),
      code: form.code.trim(),
      category: form.category,
      location: form.location.trim(),
      qty,
      value,
      acquiredAt: new Date(form.acquiredAt).toISOString(),
      condition: form.condition,
      supplierId: form.supplierId || undefined,
      responsibleId: form.responsibleId || undefined,
      note: form.note.trim() || undefined,
    });

    if (!form.id && registerOutflow && value * qty > 0) {
      addExpense({
        category: "Compras",
        description: `Aquisição de bem: ${form.name.trim()}`,
        amount: value * qty,
        paymentMethod: payMethod,
        note: "Registado a partir do módulo de Bens",
      });
      toast.success("Bem guardado e saída registada na caixa.");
    } else {
      toast.success("Bem guardado.");
    }
    setOpen(false);
  };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Valor do património"
          value={money(totals.total)}
          hint={`${assets.length} bem(ns) registado(s)`}
          icon={<Armchair className="size-4" />}
        />
        <StatCard label="Unidades" value={String(totals.units)} hint="Total de itens físicos" />
        <StatCard
          label="Precisam de atenção"
          value={String(totals.broken.length)}
          hint="Avariados ou abatidos"
          tone={totals.broken.length > 0 ? "warning" : "safe"}
        />
        <StatCard
          label="Categorias"
          value={String(new Set(assets.map((a) => a.category)).size)}
          hint="Tipos de bens diferentes"
        />
      </div>

      <SectionCard
        title="Inventário de bens"
        description="Registe equipamentos, mobiliário e utensílios do estabelecimento"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as categorias</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={create}>
              <Plus className="size-4" /> Novo bem
            </Button>
          </div>
        }
      >
        {visible.length === 0 ? (
          <EmptyState
            message="Ainda não há bens registados nesta vista."
            action={
              <Button onClick={create}>
                <Plus className="size-4" /> Registar bem
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3">Bem</th>
                  <th className="py-2 pr-3">Categoria</th>
                  <th className="py-2 pr-3">Local</th>
                  <th className="py-2 pr-3">Qtd</th>
                  <th className="py-2 pr-3">Valor unit.</th>
                  <th className="py-2 pr-3">Total</th>
                  <th className="py-2 pr-3">Aquisição</th>
                  <th className="py-2 pr-3">Estado</th>
                  <th className="py-2 pr-3">Responsável</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {visible.map((a) => {
                  const responsible = state.employees.find((e) => e.id === a.responsibleId);
                  return (
                    <tr key={a.id} className="border-t border-border/60">
                      <td className="py-2 pr-3">
                        <p className="font-medium">{a.name}</p>
                        <p className="text-xs text-muted-foreground">{a.code || "—"}</p>
                      </td>
                      <td className="py-2 pr-3">{a.category}</td>
                      <td className="py-2 pr-3">{a.location || "—"}</td>
                      <td className="py-2 pr-3">{a.qty}</td>
                      <td className="py-2 pr-3">{money(a.value)}</td>
                      <td className="py-2 pr-3 font-medium">{money(a.value * a.qty)}</td>
                      <td className="py-2 pr-3">
                        {new Date(a.acquiredAt).toLocaleDateString("pt-PT")}
                      </td>
                      <td className="py-2 pr-3">
                        <Badge variant={conditionVariant(a.condition)}>
                          {CONDITIONS.find((c) => c.value === a.condition)?.label}
                        </Badge>
                      </td>
                      <td className="py-2 pr-3">{responsible?.name ?? "—"}</td>
                      <td className="py-2">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => edit(a)}>
                            <Pencil className="size-4" />
                            <span className="sr-only">Editar</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              deleteAsset(a.id);
                              toast.success("Bem removido.");
                            }}
                          >
                            <Trash2 className="size-4 text-danger" />
                            <span className="sr-only">Remover</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar bem" : "Novo bem"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Nome do bem</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex.: Frigorífico industrial"
              />
            </div>
            <div>
              <Label>Código / etiqueta</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Localização</Label>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Cozinha, Salão, Bar…"
              />
            </div>
            <div>
              <Label>Quantidade</Label>
              <Input
                type="number"
                min={1}
                value={form.qty}
                onChange={(e) => setForm({ ...form, qty: e.target.value })}
              />
            </div>
            <div>
              <Label>Valor unitário ({state.settings.currency})</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
              />
            </div>
            <div>
              <Label>Data de aquisição</Label>
              <Input
                type="date"
                value={form.acquiredAt}
                onChange={(e) => setForm({ ...form, acquiredAt: e.target.value })}
              />
            </div>
            <div>
              <Label>Estado</Label>
              <Select
                value={form.condition}
                onValueChange={(v) => setForm({ ...form, condition: v as AssetCondition })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fornecedor</Label>
              <Select
                value={form.supplierId || "none"}
                onValueChange={(v) => setForm({ ...form, supplierId: v === "none" ? "" : v })}
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
            <div>
              <Label>Responsável</Label>
              <Select
                value={form.responsibleId || "none"}
                onValueChange={(v) => setForm({ ...form, responsibleId: v === "none" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem responsável</SelectItem>
                  {state.employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>Observações</Label>
              <Textarea
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Garantia, número de série, manutenção…"
              />
            </div>

            {!form.id ? (
              <div className="sm:col-span-2 space-y-3 rounded-lg border border-border p-3">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={registerOutflow}
                    onCheckedChange={(v) => setRegisterOutflow(Boolean(v))}
                  />
                  Registar a compra como saída na caixa
                </label>
                {registerOutflow ? (
                  <div>
                    <Label>Forma de pagamento</Label>
                    <Select value={payMethod} onValueChange={setPayMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {state.settings.paymentMethods.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Saída de {money((Number(form.value) || 0) * (Number(form.qty) || 0))} na
                      categoria Compras.
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submit}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
