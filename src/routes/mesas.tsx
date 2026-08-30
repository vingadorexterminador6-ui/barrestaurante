import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
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
import { useStore } from "@/lib/gestao/store";
import type { RestaurantTable, TableStatus } from "@/lib/gestao/types";

export const Route = createFileRoute("/mesas")({
  head: () => ({
    meta: [
      { title: "Mesas — Gestão de Bar e Restaurante" },
      {
        name: "description",
        content:
          "Mapa visual das mesas com estados livre, ocupada, reservada e a aguardar pagamento, consumo e fecho de conta.",
      },
      { property: "og:title", content: "Mesas" },
      { property: "og:description", content: "Controle o consumo e o estado de cada mesa." },
    ],
  }),
  component: () => (
    <AppShell title="Mesas" subtitle="Mapa visual e consumo por mesa">
      <RequireSetup>
        <TablesPage />
      </RequireSetup>
    </AppShell>
  ),
});

const STATUS: Record<TableStatus, { label: string; dot: string }> = {
  livre: { label: "🟢 Livre", dot: "bg-safe" },
  ocupada: { label: "🔴 Ocupada", dot: "bg-danger" },
  reservada: { label: "🟡 Reservada", dot: "bg-warning" },
  aguardando: { label: "🔵 A aguardar pagamento", dot: "bg-primary" },
};

function TablesPage() {
  const {
    state,
    money,
    saveTable,
    deleteTable,
    setTableStatus,
    addTableItem,
    removeTableItem,
    transferTable,
    clearTable,
    registerSale,
  } = useStore();
  const [newName, setNewName] = useState("");
  const [newArea, setNewArea] = useState("Salão");
  const [selected, setSelected] = useState<RestaurantTable | null>(null);
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState("1");
  const [transferTo, setTransferTo] = useState("");
  const [payment, setPayment] = useState(state.settings.paymentMethods[0] ?? "Dinheiro");
  const [splitCount, setSplitCount] = useState("1");

  const current = selected ? state.tables.find((t) => t.id === selected.id) ?? null : null;
  const totalOf = (t: RestaurantTable) => t.items.reduce((a, i) => a + i.qty * i.unitPrice, 0);

  const closeTable = () => {
    if (!current) return;
    if (current.items.length === 0) {
      toast.error("A mesa não tem consumo.");
      return;
    }
    if (!state.cashOpen) {
      toast.error("Abra a caixa antes de fechar a mesa.");
      return;
    }
    registerSale({
      items: current.items.map((i) => ({
        productId: i.productId,
        name: i.name,
        qty: i.qty,
        unitPrice: i.unitPrice,
        subtotal: i.qty * i.unitPrice,
      })),
      discount: 0,
      paymentMethod: payment,
      tableId: current.id,
    });
    setSelected(null);
    toast.success("Mesa fechada e venda registada. Caixa e stock atualizados.");
  };

  return (
    <div className="space-y-6">
      <SectionCard title="Nova mesa" description="Crie e organize as mesas por área">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Nome / número</Label>
            <Input
              value={newName}
              placeholder="Ex.: Mesa 1"
              onChange={(e) => setNewName(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Área</Label>
            <Input
              value={newArea}
              placeholder="Ex.: Esplanada"
              onChange={(e) => setNewArea(e.target.value)}
              className="w-40"
            />
          </div>
          <Button
            onClick={() => {
              if (newName.trim().length < 1) {
                toast.error("Informe o nome da mesa.");
                return;
              }
              saveTable({ name: newName, area: newArea });
              setNewName("");
              toast.success("Mesa criada.");
            }}
          >
            <Plus className="mr-2 size-4" /> Criar mesa
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Mapa de mesas" description={`${state.tables.length} mesa(s)`}>
        {state.tables.length === 0 ? (
          <EmptyState message="Nenhuma mesa criada ainda." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {state.tables.map((t) => (
              <div key={t.id} className="rounded-xl border border-border p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.area}</p>
                  </div>
                  <span className={`mt-1 size-2.5 rounded-full ${STATUS[t.status].dot}`} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{STATUS[t.status].label}</p>
                <p className="mt-2 font-display text-lg font-semibold">{money(totalOf(t))}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => setSelected(t)}>
                    Abrir
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-danger"
                    onClick={() => {
                      deleteTable(t.id);
                      toast.success("Mesa excluída.");
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <Dialog open={!!current} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{current?.name}</DialogTitle>
          </DialogHeader>
          {current ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(STATUS) as TableStatus[]).map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={current.status === s ? "default" : "outline"}
                    onClick={() => setTableStatus(current.id, s)}
                  >
                    {STATUS[s].label}
                  </Button>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-[1fr_100px_auto] sm:items-end">
                <div className="space-y-1.5">
                  <Label className="text-xs">Produto</Label>
                  <Select value={productId} onValueChange={setProductId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolher produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {state.products
                        .filter((p) => p.active)
                        .map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} — {money(p.salePrice)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Qtd.</Label>
                  <Input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} />
                </div>
                <Button
                  onClick={() => {
                    if (!productId) {
                      toast.error("Escolha um produto.");
                      return;
                    }
                    addTableItem(current.id, productId, Number(qty) || 1);
                    toast.success("Produto adicionado ao consumo.");
                  }}
                >
                  Adicionar
                </Button>
              </div>

              {current.items.length === 0 ? (
                <EmptyState message="Sem consumo registado nesta mesa." />
              ) : (
                <ul className="space-y-2 text-sm">
                  {current.items.map((i) => (
                    <li
                      key={i.productId}
                      className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
                    >
                      <span>
                        {i.qty}× {i.name}
                      </span>
                      <span className="flex items-center gap-3">
                        <span className="font-medium">{money(i.qty * i.unitPrice)}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-danger"
                          onClick={() => removeTableItem(current.id, i.productId)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex justify-between font-display text-lg font-semibold">
                <span>Total consumido</span>
                <span>{money(totalOf(current))}</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Transferir / juntar com</Label>
                  <Select value={transferTo} onValueChange={setTransferTo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolher mesa" />
                    </SelectTrigger>
                    <SelectContent>
                      {state.tables
                        .filter((t) => t.id !== current.id)
                        .map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full"
                    onClick={() => {
                      if (!transferTo) {
                        toast.error("Escolha a mesa de destino.");
                        return;
                      }
                      transferTable(current.id, transferTo);
                      setSelected(null);
                      toast.success("Consumo transferido.");
                    }}
                  >
                    Transferir consumo
                  </Button>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Dividir conta por</Label>
                  <Input
                    type="number"
                    min="1"
                    value={splitCount}
                    onChange={(e) => setSplitCount(e.target.value)}
                  />
                  <Badge variant="outline">
                    {money(totalOf(current) / Math.max(1, Number(splitCount) || 1))} por pessoa
                  </Badge>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs">Forma de pagamento</Label>
                  <Select value={payment} onValueChange={setPayment}>
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
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                if (current) clearTable(current.id);
                toast.success("Consumo limpo.");
              }}
            >
              Limpar consumo
            </Button>
            <Button onClick={closeTable}>Fechar mesa e cobrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
