import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/gestao/AppShell";
import { RequireSetup, SectionCard } from "@/components/gestao/ui-bits";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CURRENCIES, LANGUAGES } from "@/lib/gestao/i18n";
import { useStore } from "@/lib/gestao/store";
import type { Language, ManagementMode, Theme } from "@/lib/gestao/types";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Gestão de Bar e Restaurante" },
      {
        name: "description",
        content:
          "Altere dados do estabelecimento, moeda, idioma, tema, modo automático ou manual, categorias, mesas e faça backup dos dados.",
      },
      { property: "og:title", content: "Configurações" },
      { property: "og:description", content: "Personalize o sistema ao seu estabelecimento." },
    ],
  }),
  component: () => (
    <AppShell title="Configurações" subtitle="Personalize o sistema sem tocar no código">
      <RequireSetup>
        <SettingsPage />
      </RequireSetup>
    </AppShell>
  ),
});

function ListEditor({
  title,
  items,
  onChange,
  placeholder,
}: {
  title: string;
  items: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const [value, setValue] = useState("");
  return (
    <div className="space-y-2">
      <Label className="text-xs">{title}</Label>
      <div className="flex flex-wrap gap-2">
        {items.map((i) => (
          <Badge key={i} variant="secondary" className="gap-1">
            {i}
            <button
              type="button"
              onClick={() => onChange(items.filter((x) => x !== i))}
              aria-label={`Remover ${i}`}
            >
              <Trash2 className="size-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={value} placeholder={placeholder} onChange={(e) => setValue(e.target.value)} />
        <Button
          variant="secondary"
          onClick={() => {
            if (!value.trim()) return;
            onChange([...items, value.trim()]);
            setValue("");
          }}
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function SettingsPage() {
  const {
    state,
    update,
    updateSettings,
    resetSetup,
    exportBackup,
    importBackup,
    clearAll,
    saveTable,
    deleteTable,
  } = useStore();
  const [est, setEst] = useState(state.establishment);
  const fileRef = useRef<HTMLInputElement>(null);
  const [tableName, setTableName] = useState("");

  return (
    <Tabs defaultValue="estabelecimento">
      <TabsList className="flex-wrap">
        <TabsTrigger value="estabelecimento">Estabelecimento</TabsTrigger>
        <TabsTrigger value="regional">Idioma e moeda</TabsTrigger>
        <TabsTrigger value="caixa">Caixa e pagamentos</TabsTrigger>
        <TabsTrigger value="catalogo">Produtos e despesas</TabsTrigger>
        <TabsTrigger value="mesas">Mesas</TabsTrigger>
        <TabsTrigger value="aparencia">Aparência</TabsTrigger>
        <TabsTrigger value="dados">Backup</TabsTrigger>
      </TabsList>

      <TabsContent value="estabelecimento" className="mt-4">
        <SectionCard title="Dados do estabelecimento">
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["name", "Nome"],
                ["owner", "Proprietário / empresa"],
                ["type", "Tipo de estabelecimento"],
                ["phone", "Telefone"],
                ["email", "Email"],
                ["address", "Endereço"],
                ["city", "Cidade"],
                ["country", "País"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs">{label}</Label>
                <Input
                  value={est[key] ?? ""}
                  onChange={(e) => setEst({ ...est, [key]: e.target.value })}
                />
              </div>
            ))}
            <div className="space-y-1.5">
              <Label className="text-xs">Logo</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => setEst({ ...est, logo: String(reader.result) });
                  reader.readAsDataURL(file);
                }}
              />
            </div>
          </div>
          <Button
            className="mt-4"
            onClick={() => {
              update({ establishment: est });
              toast.success("Dados do estabelecimento atualizados.");
            }}
          >
            Guardar alterações
          </Button>
        </SectionCard>
      </TabsContent>

      <TabsContent value="regional" className="mt-4">
        <SectionCard title="Idioma e moeda" description="O símbolo aparece em todo o sistema">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Idioma 🌍</Label>
              <Select
                value={state.settings.language}
                onValueChange={(v) => updateSettings({ language: v as Language })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Moeda 💱</Label>
              <Select
                value={state.settings.currency}
                onValueChange={(v) =>
                  updateSettings({
                    currency: v,
                    currencySymbol: CURRENCIES.find((c) => c.code === v)?.symbol ?? v,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code} ({c.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Símbolo</Label>
              <Input
                value={state.settings.currencySymbol}
                onChange={(e) => updateSettings({ currencySymbol: e.target.value })}
              />
            </div>
          </div>
        </SectionCard>
      </TabsContent>

      <TabsContent value="caixa" className="mt-4">
        <div className="space-y-4">
          <SectionCard
            title="⚙️ Modo de gestão"
            description="O modo automático reduz erros e atualiza caixa, stock e relatórios automaticamente."
          >
            <div className="flex flex-wrap gap-2">
              {(["automatico", "manual"] as ManagementMode[]).map((m) => (
                <Button
                  key={m}
                  variant={state.settings.mode === m ? "default" : "outline"}
                  onClick={() => {
                    updateSettings({ mode: m });
                    toast.success(`Modo ${m === "automatico" ? "automático" : "manual"} ativado.`);
                  }}
                >
                  {m === "automatico" ? "Automático" : "Manual"}
                </Button>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Métodos de pagamento">
            <ListEditor
              title="Métodos disponíveis"
              items={state.settings.paymentMethods}
              placeholder="Ex.: M-Pesa"
              onChange={(paymentMethods) => updateSettings({ paymentMethods })}
            />
          </SectionCard>
        </div>
      </TabsContent>

      <TabsContent value="catalogo" className="mt-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard title="Produtos">
            <div className="space-y-4">
              <ListEditor
                title="Categorias de produtos"
                items={state.settings.productCategories}
                placeholder="Ex.: Vinhos"
                onChange={(productCategories) => updateSettings({ productCategories })}
              />
              <ListEditor
                title="Unidades"
                items={state.settings.units}
                placeholder="Ex.: pack"
                onChange={(units) => updateSettings({ units })}
              />
              <div className="space-y-1.5">
                <Label className="text-xs">Stock mínimo padrão</Label>
                <Input
                  type="number"
                  min="0"
                  value={state.settings.defaultMinStock}
                  onChange={(e) => updateSettings({ defaultMinStock: Number(e.target.value) })}
                />
              </div>
            </div>
          </SectionCard>
          <SectionCard title="Despesas">
            <ListEditor
              title="Categorias de despesas"
              items={state.settings.expenseCategories}
              placeholder="Ex.: Segurança"
              onChange={(expenseCategories) => updateSettings({ expenseCategories })}
            />
          </SectionCard>
        </div>
      </TabsContent>

      <TabsContent value="mesas" className="mt-4">
        <SectionCard title="Mesas" description="Crie e remova mesas">
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome da mesa</Label>
              <Input
                value={tableName}
                placeholder="Ex.: Mesa 5"
                onChange={(e) => setTableName(e.target.value)}
              />
            </div>
            <Button
              onClick={() => {
                if (!tableName.trim()) return;
                saveTable({ name: tableName.trim(), area: "Salão" });
                setTableName("");
                toast.success("Mesa criada.");
              }}
            >
              Criar mesa
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {state.tables.map((t) => (
              <Badge key={t.id} variant="secondary" className="gap-1">
                {t.name}
                <button type="button" onClick={() => deleteTable(t.id)} aria-label={`Remover ${t.name}`}>
                  <Trash2 className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        </SectionCard>
      </TabsContent>

      <TabsContent value="aparencia" className="mt-4">
        <SectionCard title="Aparência 🎨">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Tema</Label>
              <div className="flex gap-2">
                {(["light", "dark"] as Theme[]).map((th) => (
                  <Button
                    key={th}
                    variant={state.settings.theme === th ? "default" : "outline"}
                    onClick={() => updateSettings({ theme: th })}
                  >
                    {th === "light" ? "Claro" : "Escuro"}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Nome do sistema</Label>
              <Input
                value={state.settings.systemName}
                onChange={(e) => updateSettings({ systemName: e.target.value })}
              />
            </div>
          </div>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              resetSetup();
              toast.success("Assistente de configuração reativado.");
            }}
          >
            Ver assistente de configuração novamente
          </Button>
        </SectionCard>
      </TabsContent>

      <TabsContent value="dados" className="mt-4">
        <SectionCard title="Backup e segurança dos dados" description="Os dados ficam guardados neste dispositivo">
          <div className="flex flex-wrap gap-2">
            <Button onClick={exportBackup}>Exportar backup</Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              Importar backup
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const ok = importBackup(await file.text());
                toast[ok ? "success" : "error"](
                  ok ? "Backup restaurado com sucesso." : "Ficheiro de backup inválido.",
                );
              }}
            />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Limpar todos os dados</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>ATENÇÃO</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação apagará todos os dados. Deseja continuar?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      clearAll();
                      toast.success("Dados apagados.");
                    }}
                  >
                    Apagar tudo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </SectionCard>
      </TabsContent>
    </Tabs>
  );
}
