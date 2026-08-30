import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCIES, LANGUAGES } from "@/lib/gestao/i18n";
import { useStore } from "@/lib/gestao/store";
import type { Language, ManagementMode } from "@/lib/gestao/types";
import { cn } from "@/lib/utils";

const TYPES = ["Bar", "Restaurante", "Café", "Lanchonete", "Bar & Restaurante", "Outro"];

const STEPS = [
  "Configure o estabelecimento",
  "Cadastre os produtos",
  "Configure o stock",
  "Registre as vendas",
  "Registre despesas",
  "Feche o dia",
];

const STEP_HELP = [
  "Preencha nome, tipo de negócio, moeda, contactos e outras informações.",
  "Adicione bebidas, comidas, pratos, ingredientes e outros produtos.",
  "Informe quantidade inicial, unidade, preço de compra e preço de venda.",
  "Cada venda atualiza automaticamente o caixa e o stock.",
  "Todas as despesas são contabilizadas no movimento financeiro.",
  "No final do dia o sistema calcula automaticamente o resumo financeiro.",
];

export function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <div className="grid-glow flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="glass-card w-full max-w-3xl">
        <CardContent className="p-6 md:p-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/12 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="size-3.5" /> Primeira utilização
          </span>
          <h1 className="mt-4 font-display text-3xl font-semibold md:text-4xl">
            Bem-vindo ao seu Sistema de Gestão
          </h1>
          <p className="mt-2 text-muted-foreground">
            Controle o seu bar ou restaurante de forma simples, rápida e inteligente.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {STEPS.map((step, i) => (
              <div key={step} className="rounded-xl border border-border p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  Passo {i + 1}
                </p>
                <p className="mt-1 text-sm font-medium">{step}</p>
                <p className="mt-1 text-xs text-muted-foreground">{STEP_HELP[i]}</p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <Button size="lg" onClick={onStart} className="w-full sm:w-auto">
              COMEÇAR CONFIGURAÇÃO <ArrowRight className="ml-2 size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function SetupWizard({ onCancel }: { onCancel?: () => void }) {
  const { state, completeSetup } = useStore();
  const [step, setStep] = useState(0);
  const [est, setEst] = useState(state.establishment);
  const [currency, setCurrency] = useState(state.settings.currency);
  const [symbol, setSymbol] = useState(state.settings.currencySymbol);
  const [language, setLanguage] = useState<Language>(state.settings.language);
  const [mode, setMode] = useState<ManagementMode>(state.settings.mode);
  const [opening, setOpening] = useState("0");

  const canContinue = step === 0 ? est.name.trim().length > 1 : true;

  const finish = () => {
    completeSetup({
      establishment: est,
      settings: { currency, currencySymbol: symbol, language, mode },
      openingBalance: Number(opening) || 0,
    });
    toast.success("Configuração concluída! Bem-vindo ao seu painel.");
  };

  return (
    <div className="grid-glow flex min-h-screen items-start justify-center px-4 py-10">
      <Card className="glass-card w-full max-w-2xl">
        <CardContent className="p-6 md:p-8">
          <div className="mb-6 flex items-center gap-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 flex-1 rounded-full",
                  i <= step ? "bg-primary" : "bg-muted",
                )}
              />
            ))}
          </div>

          {step === 0 ? (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-semibold">Dados do estabelecimento</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nome do estabelecimento" required>
                  <Input
                    value={est.name}
                    placeholder="Ex.: Bar Central"
                    onChange={(e) => setEst({ ...est, name: e.target.value })}
                  />
                </Field>
                <Field label="Proprietário / empresa">
                  <Input
                    value={est.owner}
                    placeholder="Ex.: João Silva"
                    onChange={(e) => setEst({ ...est, owner: e.target.value })}
                  />
                </Field>
                <Field label="Tipo de estabelecimento">
                  <Select value={est.type} onValueChange={(v) => setEst({ ...est, type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Telefone">
                  <Input
                    value={est.phone}
                    placeholder="Ex.: +258 84 000 0000"
                    onChange={(e) => setEst({ ...est, phone: e.target.value })}
                  />
                </Field>
                <Field label="Email">
                  <Input
                    type="email"
                    value={est.email}
                    placeholder="Ex.: contacto@bar.com"
                    onChange={(e) => setEst({ ...est, email: e.target.value })}
                  />
                </Field>
                <Field label="Endereço">
                  <Input
                    value={est.address}
                    placeholder="Ex.: Av. Principal, 123"
                    onChange={(e) => setEst({ ...est, address: e.target.value })}
                  />
                </Field>
                <Field label="Cidade">
                  <Input
                    value={est.city}
                    placeholder="Ex.: Maputo"
                    onChange={(e) => setEst({ ...est, city: e.target.value })}
                  />
                </Field>
                <Field label="País">
                  <Input
                    value={est.country}
                    placeholder="Ex.: Moçambique"
                    onChange={(e) => setEst({ ...est, country: e.target.value })}
                  />
                </Field>
                <Field label="Idioma">
                  <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
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
                </Field>
                <Field label="Logo do estabelecimento">
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
                </Field>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-semibold">Configuração financeira</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Moeda">
                  <Select
                    value={currency}
                    onValueChange={(v) => {
                      setCurrency(v);
                      setSymbol(CURRENCIES.find((c) => c.code === v)?.symbol ?? v);
                    }}
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
                </Field>
                <Field label="Símbolo da moeda">
                  <Input value={symbol} onChange={(e) => setSymbol(e.target.value)} />
                </Field>
                <Field label="Saldo inicial da caixa">
                  <Input
                    type="number"
                    min="0"
                    value={opening}
                    onChange={(e) => setOpening(e.target.value)}
                    placeholder="Ex.: 5000"
                  />
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <ModeOption
                  active={mode === "automatico"}
                  title="MODO AUTOMÁTICO"
                  description="O sistema calcula vendas, despesas, lucro, saldo, stock, compras e resultado diário automaticamente."
                  onClick={() => setMode("automatico")}
                />
                <ModeOption
                  active={mode === "manual"}
                  title="MODO MANUAL"
                  description="Pode introduzir determinados valores manualmente, com mais controlo sobre cada lançamento."
                  onClick={() => setMode("manual")}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Modo manual e modo automático são apenas configurações de funcionamento — pode
                alternar entre eles em qualquer momento nas Configurações.
              </p>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-semibold">Tudo pronto</h2>
              <div className="rounded-xl border border-border p-4 text-sm">
                <p>
                  <span className="text-muted-foreground">Estabelecimento:</span>{" "}
                  {est.name || "—"} ({est.type})
                </p>
                <p>
                  <span className="text-muted-foreground">Moeda:</span> {currency} ({symbol})
                </p>
                <p>
                  <span className="text-muted-foreground">Saldo inicial:</span> {symbol}{" "}
                  {Number(opening) || 0}
                </p>
                <p>
                  <span className="text-muted-foreground">Modo:</span>{" "}
                  {mode === "automatico" ? "Automático" : "Manual"}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                A seguir vai poder cadastrar produtos, definir stock e registar a primeira venda a
                partir do painel.
              </p>
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-2">
            <Button
              variant="ghost"
              onClick={() => (step === 0 ? onCancel?.() : setStep(step - 1))}
              disabled={step === 0 && !onCancel}
            >
              <ArrowLeft className="mr-2 size-4" /> Voltar
            </Button>
            {step < 2 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canContinue}>
                Continuar <ArrowRight className="ml-2 size-4" />
              </Button>
            ) : (
              <Button onClick={finish}>
                <CheckCircle2 className="mr-2 size-4" /> Concluir configuração
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </Label>
      {children}
    </div>
  );
}

function ModeOption({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border p-4 text-left transition-colors",
        active ? "border-primary bg-primary/8" : "border-border hover:bg-accent/60",
      )}
    >
      <p className="font-display text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </button>
  );
}
