import { createFileRoute } from "@tanstack/react-router";
import { Banknote, Pencil, Plus, Trash2 } from "lucide-react";
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
import type { Employee } from "@/lib/gestao/types";

export const Route = createFileRoute("/funcionarios")({
  head: () => ({
    meta: [
      { title: "Funcionários — Gestão de Bar e Restaurante" },
      {
        name: "description",
        content:
          "Cadastro interno de funcionários por cargo, salário e estado, com acompanhamento das vendas associadas.",
      },
      { property: "og:title", content: "Funcionários" },
      { property: "og:description", content: "Gestão interna da equipa do estabelecimento." },
    ],
  }),
  component: () => (
    <AppShell title="Funcionários" subtitle="Gestão interna da equipa (sem login)">
      <RequireSetup>
        <EmployeesPage />
      </RequireSetup>
    </AppShell>
  ),
});

const ROLES = ["Gerente", "Caixa", "Garçom", "Cozinheiro", "Barista", "Outro"];
const empty = {
  id: undefined as string | undefined,
  name: "",
  role: ROLES[0]!,
  phone: "",
  salary: 0,
  hiredAt: new Date().toISOString().slice(0, 10),
  active: true,
  note: "",
};

function EmployeesPage() {
  const { state, money, saveEmployee, deleteEmployee, payEmployee } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [pay, setPay] = useState<{ open: boolean; id: string; name: string }>({
    open: false,
    id: "",
    name: "",
  });
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState(state.settings.paymentMethods[0] ?? "Dinheiro");
  const [payNote, setPayNote] = useState("");

  const paidOf = (id: string) =>
    state.expenses.filter((e) => e.employeeId === id).reduce((a, e) => a + e.amount, 0);

  const monthKey = new Date().toISOString().slice(0, 7);
  const paidThisMonth = (id: string) =>
    state.expenses
      .filter((e) => e.employeeId === id && String(e.date).slice(0, 7) === monthKey)
      .reduce((a, e) => a + e.amount, 0);
  const monthLabel = (iso: string) =>
    iso
      ? new Date(iso).toLocaleDateString("pt-PT", { month: "long", year: "numeric" })
      : "—";


  const submitPay = () => {
    const value = Number(payAmount);
    if (!value || value <= 0) {
      toast.error("Informe um valor maior que zero.");
      return;
    }
    payEmployee({
      employeeId: pay.id,
      amount: value,
      paymentMethod: payMethod,
      ...(payNote ? { note: payNote } : {}),
    });
    setPay({ open: false, id: "", name: "" });
    setPayAmount("");
    setPayNote("");
    toast.success("Pagamento registado como saída no caixa.");
  };

  const salesOf = (id: string) => {
    const sales = state.sales.filter((s) => s.employeeId === id);
    return { count: sales.length, total: sales.reduce((a, s) => a + s.total, 0) };
  };

  const submit = () => {
    if (form.name.trim().length < 2) {
      toast.error("Informe o nome do funcionário.");
      return;
    }
    saveEmployee(form as Omit<Employee, "id"> & { id?: string | undefined });
    setOpen(false);
    toast.success("Funcionário guardado.");
  };

  return (
    <SectionCard
      title="Equipa"
      description={`${state.employees.length} funcionário(s)`}
      actions={
        <Button
          onClick={() => {
            setForm(empty);
            setOpen(true);
          }}
        >
          <Plus className="mr-2 size-4" /> Novo funcionário
        </Button>
      }
    >
      {state.employees.length === 0 ? (
        <EmptyState message="Nenhum funcionário cadastrado." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {state.employees.map((e) => {
            const s = salesOf(e.id);
            return (
              <div key={e.id} className="rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{e.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.role} · {e.phone || "sem telefone"}
                    </p>
                  </div>
                  <div className="flex">
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Pagar salário"
                      onClick={() => {
                        setPay({ open: true, id: e.id, name: e.name });
                        const remaining = Math.max(0, e.salary - paidThisMonth(e.id));
                        setPayAmount(String(remaining || e.salary || ""));
                      }}

                    >
                      <Banknote className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setForm({ ...e, note: e.note ?? "" });
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
                        deleteEmployee(e.id);
                        toast.success("Funcionário removido.");
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant={e.active ? "default" : "secondary"}>
                    {e.active ? "Ativo" : "Inativo"}
                  </Badge>
                  <Badge variant="outline">Salário {money(e.salary)}</Badge>
                  <Badge variant="outline">Entrou em {monthLabel(e.hiredAt)}</Badge>
                  <Badge variant="outline">
                    {s.count} venda(s) · {money(s.total)}
                  </Badge>
                  <Badge variant="outline">Pago no mês {money(paidThisMonth(e.id))}</Badge>
                  <Badge
                    variant={e.salary - paidThisMonth(e.id) > 0 ? "secondary" : "outline"}
                  >
                    Falta {money(Math.max(0, e.salary - paidThisMonth(e.id)))}
                  </Badge>
                  <Badge variant="outline">Total pago {money(paidOf(e.id))}</Badge>
                </div>

              </div>
            );
          })}
        </div>
      )}

      <Dialog open={pay.open} onOpenChange={(v) => setPay((d) => ({ ...d, open: v }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagar {pay.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Valor *</Label>
              <Input
                type="number"
                min="0"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Forma de pagamento</Label>
              <Select value={payMethod} onValueChange={setPayMethod}>
                <SelectTrigger>
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
            <div className="space-y-1.5">
              <Label className="text-xs">Observação</Label>
              <Textarea value={payNote} onChange={(e) => setPayNote(e.target.value)} />
            </div>
            <p className="text-xs text-muted-foreground">
              O pagamento é registado como despesa de salários e sai automaticamente do caixa.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPay({ open: false, id: "", name: "" })}>
              Cancelar
            </Button>
            <Button onClick={submitPay}>Registar pagamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar funcionário" : "Novo funcionário"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Nome *</Label>
              <Input
                value={form.name}
                placeholder="Ex.: Ana Muianga"
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Cargo</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Telefone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Salário</Label>
              <Input
                type="number"
                min="0"
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Data de entrada</Label>
              <Input
                type="date"
                value={form.hiredAt}
                onChange={(e) => setForm({ ...form, hiredAt: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              <Label className="text-xs">Ativo</Label>
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
