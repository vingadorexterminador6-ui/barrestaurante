import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Camera,
  Copy,
  Flame,
  Heart,
  HeartHandshake,
  History,
  Loader2,
  MessageCircle,
  Shield,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  CASAL_TOPICS,
  CONQUISTA_TOPICS,
  GOALS,
  INTENSITIES,
  PERSONAS,
  type AnalysisResult,
  type Goal,
  type HistoryEntry,
  type Persona,
  type Suggestion,
} from "@/lib/conversa/options";
import { useHistory } from "@/lib/conversa/history";
import {
  analyzeScreenshot,
  generateMessages,
  suggestReplies,
} from "@/lib/conversa/ai.functions";

export const Route = createFileRoute("/conversa")({
  head: () => ({
    meta: [
      { title: "Conversa Quente AI — respostas perfeitas para o seu crush" },
      {
        name: "description",
        content:
          "Envie a mensagem ou o screenshot: a IA entende o contexto e sugere respostas românticas, provocantes, quentes e engraçadas para copiar e enviar.",
      },
      { property: "og:title", content: "Conversa Quente AI" },
      {
        property: "og:description",
        content:
          "Nunca mais fique sem saber o que responder. Sugestões de mensagens românticas e provocantes criadas por IA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConversaPage,
});

type View = "home" | "screenshot" | "responder" | "conquista" | "casal" | "pensando" | "historico";

const MENU: { view: View; emoji: string; title: string; subtitle: string }[] = [
  {
    view: "screenshot",
    emoji: "📸",
    title: "Analisar Screenshot",
    subtitle: "A IA lê a conversa e explica o que ela quis dizer",
  },
  { view: "responder", emoji: "💬", title: "O que Respondo?", subtitle: "Cole a mensagem recebida" },
  { view: "conquista", emoji: "💘", title: "Modo Conquista", subtitle: "Puxar conversa e criar interesse" },
  { view: "casal", emoji: "💑", title: "Modo Namorados", subtitle: "Bom dia, saudade, desculpas, flertes" },
  { view: "pensando", emoji: "😏", title: "Deixa Pensando", subtitle: "Frases que criam expectativa" },
];

function ConversaPage() {
  const [view, setView] = useState<View>("home");
  const [persona, setPersona] = useState<Persona>("Namorada");
  const [goal, setGoal] = useState<Goal>("Flertar");
  const [intensity, setIntensity] = useState(2);
  const history = useHistory();

  const ctx = { persona, goal, intensity };

  return (
    <main className="conversa-theme min-h-screen">
      <div className="mx-auto w-full max-w-xl px-4 pb-16 pt-6">
        <header className="mb-6 flex items-center gap-3">
          {view !== "home" ? (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 rounded-full"
              onClick={() => setView("home")}
              aria-label="Voltar"
            >
              <ArrowLeft className="size-5" />
            </Button>
          ) : (
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground">
              <Flame className="size-5" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-lg font-bold">Conversa Quente AI</p>
            <p className="truncate text-xs text-muted-foreground">Seu especialista em conversas</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setView("historico")}
            aria-label="Histórico"
          >
            <History className="size-5" />
          </Button>
        </header>

        {view === "home" && <Home onPick={setView} />}

        {view !== "home" && view !== "historico" && (
          <Personalization
            persona={persona}
            goal={goal}
            intensity={intensity}
            onPersona={setPersona}
            onGoal={setGoal}
            onIntensity={setIntensity}
          />
        )}

        {view === "screenshot" && <ScreenshotMode ctx={ctx} history={history} />}
        {view === "responder" && <ResponderMode ctx={ctx} history={history} />}
        {view === "conquista" && (
          <TopicMode mode="conquista" topics={CONQUISTA_TOPICS} ctx={ctx} history={history} />
        )}
        {view === "casal" && <TopicMode mode="casal" topics={CASAL_TOPICS} ctx={ctx} history={history} />}
        {view === "pensando" && (
          <TopicMode
            mode="pensando"
            topics={["Criar expectativa", "Tensão romântica", "Mistério", "Boa noite provocante", "Saudade quente"]}
            ctx={ctx}
            history={history}
          />
        )}
        {view === "historico" && <HistoryView history={history} />}
      </div>
    </main>
  );
}

function Home({ onPick }: { onPick: (v: View) => void }) {
  return (
    <div className="space-y-5">
      <div className="heat-glow rounded-4xl border border-border p-6 text-center">
        <h1 className="font-display text-3xl leading-tight font-bold">
          Nunca mais fique sem saber o que responder.
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Envie a mensagem ou screenshot. A IA entende o contexto e cria a resposta perfeita para você.
        </p>
      </div>

      <div className="space-y-3">
        {MENU.map((item) => (
          <button
            key={item.view}
            onClick={() => onPick(item.view)}
            className="flex w-full items-center gap-4 rounded-3xl border border-border bg-card p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/60 active:scale-[0.99]"
          >
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-secondary text-2xl">
              {item.emoji}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{item.title}</span>
              <span className="block text-xs text-muted-foreground">{item.subtitle}</span>
            </span>
          </button>
        ))}
      </div>

      <PrivacyNote />
    </div>
  );
}

function PrivacyNote() {
  return (
    <div className="flex gap-3 rounded-3xl border border-border bg-card/60 p-4 text-xs text-muted-foreground">
      <Shield className="mt-0.5 size-4 shrink-0 text-primary" />
      <p>
        Screenshots de conversas são informações privadas. As imagens são usadas apenas para gerar a análise e
        não ficam guardadas — o histórico guarda só o texto no seu aparelho e você pode apagar tudo a qualquer
        momento.
      </p>
    </div>
  );
}

type Ctx = { persona: Persona; goal: Goal; intensity: number };

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-secondary text-secondary-foreground hover:border-primary/50",
      )}
    >
      {children}
    </button>
  );
}

function Personalization({
  persona,
  goal,
  intensity,
  onPersona,
  onGoal,
  onIntensity,
}: {
  persona: Persona;
  goal: Goal;
  intensity: number;
  onPersona: (p: Persona) => void;
  onGoal: (g: Goal) => void;
  onIntensity: (i: number) => void;
}) {
  return (
    <Card className="mb-4 rounded-3xl">
      <CardContent className="space-y-4 p-4">
        <div>
          <p className="mb-2 text-xs font-semibold text-muted-foreground">Quem é a pessoa?</p>
          <div className="flex flex-wrap gap-2">
            {PERSONAS.map((p) => (
              <Chip key={p} active={p === persona} onClick={() => onPersona(p)}>
                {p}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold text-muted-foreground">Qual é o objetivo?</p>
          <div className="flex flex-wrap gap-2">
            {GOALS.map((g) => (
              <Chip key={g} active={g === goal} onClick={() => onGoal(g)}>
                {g}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold text-muted-foreground">Intensidade</p>
          <div className="flex flex-wrap gap-2">
            {INTENSITIES.map((i) => (
              <Chip key={i.value} active={i.value === intensity} onClick={() => onIntensity(i.value)}>
                {i.label}
              </Chip>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SuggestionList({ result }: { result: AnalysisResult }) {
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Resposta copiada!");
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };

  return (
    <div className="mt-4 space-y-3">
      {(result.tone || result.meaning) && (
        <Card className="rounded-3xl border-primary/40">
          <CardContent className="space-y-1 p-4">
            {result.tone && (
              <p className="text-sm font-semibold">
                <Sparkles className="mr-1 inline size-4 text-primary" />
                Tom: {result.tone}
              </p>
            )}
            {result.meaning && <p className="text-sm text-muted-foreground">{result.meaning}</p>}
          </CardContent>
        </Card>
      )}
      {result.suggestions.map((s: Suggestion, i: number) => (
        <Card key={i} className="animate-in fade-in slide-in-from-bottom-2 rounded-3xl duration-300">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-primary">
              {s.emoji} {s.label}
            </p>
            <p className="mt-2 text-[15px] leading-relaxed whitespace-pre-wrap">{s.text}</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3 w-full rounded-full"
              onClick={() => copy(s.text)}
            >
              <Copy className="size-4" /> Copiar resposta
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function useRun(history: ReturnType<typeof useHistory>) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const run = async (
    fn: () => Promise<AnalysisResult>,
    entry: { kind: HistoryEntry["kind"]; title: string },
  ) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fn();
      setResult(res);
      history.add({
        kind: entry.kind,
        title: entry.title,
        tone: res.tone,
        meaning: res.meaning,
        suggestions: res.suggestions,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Algo falhou. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return { loading, result, setResult, run };
}

function ScreenshotMode({ ctx, history }: { ctx: Ctx; history: ReturnType<typeof useHistory> }) {
  const analyze = useServerFn(analyzeScreenshot);
  const { loading, result, setResult, run } = useRun(history);
  const [image, setImage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = (file: File) => {
    if (file.size > 6 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx. 6 MB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <h2 className="mb-3 font-display text-xl font-bold">📸 Analisar Screenshot</h2>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) pick(f);
        }}
      />

      {image ? (
        <div className="overflow-hidden rounded-3xl border border-border">
          <img src={image} alt="Screenshot da conversa" className="max-h-72 w-full object-contain bg-secondary" />
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="heat-glow flex w-full flex-col items-center gap-2 rounded-3xl border border-dashed border-primary/50 p-8 text-center"
        >
          <Camera className="size-8 text-primary" />
          <span className="font-semibold">Carregar screenshot da conversa</span>
          <span className="text-xs text-muted-foreground">PNG ou JPG até 6 MB</span>
        </button>
      )}

      <div className="mt-3 flex gap-2">
        <Button variant="secondary" className="flex-1 rounded-full" onClick={() => inputRef.current?.click()}>
          {image ? "Trocar imagem" : "Escolher imagem"}
        </Button>
        {image && (
          <Button
            variant="ghost"
            className="rounded-full"
            onClick={() => {
              setImage(null);
              setResult(null);
            }}
          >
            <Trash2 className="size-4" /> Apagar
          </Button>
        )}
      </div>

      <Button
        size="lg"
        className="mt-3 h-14 w-full rounded-full text-base"
        disabled={!image || loading}
        onClick={() =>
          image &&
          run(() => analyze({ data: { ...ctx, imageDataUrl: image } }), {
            kind: "screenshot",
            title: "Análise de screenshot",
          })
        }
      >
        {loading ? <Loader2 className="size-5 animate-spin" /> : <Sparkles className="size-5" />}
        {loading ? "A analisar..." : "Analisar conversa"}
      </Button>

      {result && <SuggestionList result={result} />}
      <div className="mt-4">
        <PrivacyNote />
      </div>
    </div>
  );
}

function ResponderMode({ ctx, history }: { ctx: Ctx; history: ReturnType<typeof useHistory> }) {
  const suggest = useServerFn(suggestReplies);
  const { loading, result, run } = useRun(history);
  const [message, setMessage] = useState("");

  return (
    <div>
      <h2 className="mb-3 font-display text-xl font-bold">💬 O que Respondo?</h2>
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder='Ex.: Ela disse: "estou com saudades de ti"'
        className="min-h-32 rounded-3xl text-base"
      />
      <Button
        size="lg"
        className="mt-3 h-14 w-full rounded-full text-base"
        disabled={message.trim().length < 2 || loading}
        onClick={() =>
          run(() => suggest({ data: { ...ctx, message: message.trim() } }), {
            kind: "responder",
            title: message.trim().slice(0, 60),
          })
        }
      >
        {loading ? <Loader2 className="size-5 animate-spin" /> : <MessageCircle className="size-5" />}
        {loading ? "A pensar..." : "Gerar respostas"}
      </Button>
      {result && <SuggestionList result={result} />}
    </div>
  );
}

function TopicMode({
  mode,
  topics,
  ctx,
  history,
}: {
  mode: "conquista" | "casal" | "pensando";
  topics: string[];
  ctx: Ctx;
  history: ReturnType<typeof useHistory>;
}) {
  const generate = useServerFn(generateMessages);
  const { loading, result, run } = useRun(history);
  const [topic, setTopic] = useState(topics[0] ?? "");
  const [extra, setExtra] = useState("");

  const title = useMemo(
    () =>
      mode === "conquista"
        ? "💘 Modo Conquista"
        : mode === "casal"
          ? "💑 Modo Namorados"
          : "😏 Deixa Pensando",
    [mode],
  );

  return (
    <div>
      <h2 className="mb-3 font-display text-xl font-bold">{title}</h2>
      <div className="mb-3 flex flex-wrap gap-2">
        {topics.map((t) => (
          <Chip key={t} active={t === topic} onClick={() => setTopic(t)}>
            {t}
          </Chip>
        ))}
      </div>
      <Textarea
        value={extra}
        onChange={(e) => setExtra(e.target.value)}
        placeholder="Opcional: algo sobre ela/ele ou sobre a situação (nome, gosto, última conversa...)"
        className="min-h-24 rounded-3xl text-base"
      />
      <Button
        size="lg"
        className="mt-3 h-14 w-full rounded-full text-base"
        disabled={!topic || loading}
        onClick={() =>
          run(
            () =>
              generate({
                data: { ...ctx, mode, topic, ...(extra.trim() ? { extra: extra.trim() } : {}) },
              }),
            { kind: mode, title: topic },
          )
        }
      >
        {loading ? <Loader2 className="size-5 animate-spin" /> : <Heart className="size-5" />}
        {loading ? "A criar..." : "Gerar mensagens"}
      </Button>
      {result && <SuggestionList result={result} />}
    </div>
  );
}

function HistoryView({ history }: { history: ReturnType<typeof useHistory> }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copiado!");
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">Histórico</h2>
        {history.entries.length > 0 && (
          <Button variant="ghost" size="sm" className="rounded-full" onClick={() => history.clear()}>
            <Trash2 className="size-4" /> Apagar tudo
          </Button>
        )}
      </div>

      {history.entries.length === 0 ? (
        <Card className="rounded-3xl">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            <HeartHandshake className="mx-auto mb-2 size-8 text-primary" />
            Ainda não há análises guardadas.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {history.entries.map((e) => (
            <Card key={e.id} className="rounded-3xl">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <button className="min-w-0 flex-1 text-left" onClick={() => setOpenId(openId === e.id ? null : e.id)}>
                    <p className="truncate font-semibold">{e.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(e.createdAt).toLocaleString("pt-PT")} · {e.suggestions.length} sugestões
                    </p>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    aria-label="Favoritar"
                    onClick={() => history.toggleFavorite(e.id)}
                  >
                    <Star className={cn("size-4", e.favorite && "fill-primary text-primary")} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    aria-label="Apagar"
                    onClick={() => history.remove(e.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                {openId === e.id && (
                  <div className="mt-3 space-y-2 border-t border-border pt-3">
                    {e.meaning && <p className="text-sm text-muted-foreground">{e.meaning}</p>}
                    {e.suggestions.map((s, i) => (
                      <div key={i} className="rounded-2xl bg-secondary p-3">
                        <p className="text-xs font-semibold text-primary">
                          {s.emoji} {s.label}
                        </p>
                        <p className="mt-1 text-sm whitespace-pre-wrap">{s.text}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 rounded-full"
                          onClick={() => copy(s.text)}
                        >
                          <Copy className="size-4" /> Copiar
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
