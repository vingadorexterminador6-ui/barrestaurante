import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { AnalysisResult } from "./options";

const SYSTEM = `Você é o "Conversa Quente AI", um especialista em conversas românticas e de flerte em português informal (estilo WhatsApp/Instagram).

Regras:
- Escreva como uma pessoa real escreve no celular: curto, natural, com ritmo próprio.
- Nunca soe robótico, corporativo ou genérico. Evite clichês batidos e frases prontas de internet.
- Varie sempre: não repita as mesmas fórmulas entre sugestões.
- Use emojis só quando fizer sentido (no máximo 1 ou 2 por mensagem).
- Seja confiante, charmoso e criativo, nunca insistente, carente ou manipulador.
- Conteúdo sensual é permitido no registo sugestivo: crie desejo, expectativa e tensão sem descrever atos sexuais de forma gráfica ou vulgar.
- Respeite a intensidade pedida e o objetivo pedido.
- Responda SEMPRE em JSON válido, sem texto fora do JSON.`;

const JSON_SHAPE = `Formato do JSON:
{
  "tone": "tom percebido da outra pessoa (curto)",
  "meaning": "explicação breve (1-2 frases) do que a mensagem pode significar",
  "suggestions": [
    { "emoji": "❤️", "label": "Romântica", "text": "..." },
    { "emoji": "😏", "label": "Provocante", "text": "..." },
    { "emoji": "🔥", "label": "Quente", "text": "..." },
    { "emoji": "😂", "label": "Engraçada", "text": "..." },
    { "emoji": "😌", "label": "Confiante", "text": "..." }
  ]
}`;

const ResultSchema = z.object({
  tone: z.string().default(""),
  meaning: z.string().default(""),
  suggestions: z
    .array(
      z.object({
        emoji: z.string().default("💬"),
        label: z.string().default("Sugestão"),
        text: z.string(),
      }),
    )
    .min(1),
});

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

async function callGateway(blocks: ContentBlock[]): Promise<AnalysisResult> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("A IA não está configurada neste projeto.");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: "google/gemini-3.7-flash",
      temperature: 1,
      messages: [
        { role: "system", content: `${SYSTEM}\n\n${JSON_SHAPE}` },
        { role: "user", content: blocks },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    if (res.status === 429) throw new Error("Muitos pedidos agora. Tente outra vez em alguns segundos.");
    if (res.status === 402)
      throw new Error("Os créditos de IA do projeto acabaram. Adicione créditos para continuar.");
    throw new Error(`Falha da IA (${res.status}): ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = data.choices?.[0]?.message?.content ?? "";
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("A IA devolveu uma resposta inesperada. Tente novamente.");
    parsed = JSON.parse(m[0]);
  }
  return ResultSchema.parse(parsed);
}

function personaBlock(input: { persona: string; goal: string; intensity: number }) {
  return `Pessoa: ${input.persona}. Objetivo: ${input.goal}. Intensidade (1 leve a 4 muito provocante): ${input.intensity}.`;
}

const Base = z.object({
  persona: z.string().min(1),
  goal: z.string().min(1),
  intensity: z.number().min(1).max(4),
});

export const analyzeScreenshot = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    Base.extend({ imageDataUrl: z.string().startsWith("data:image/") }).parse(input),
  )
  .handler(async ({ data }) => {
    return callGateway([
      {
        type: "text",
        text: `${personaBlock(data)}
Esta imagem é o screenshot de uma conversa. Leia o texto visível, identifique quem fala (normalmente as mensagens à direita são do utilizador e as da esquerda são da outra pessoa), entenda o contexto e o tom da outra pessoa, explique brevemente o que a última mensagem dela pode significar e sugira 5 respostas: ❤️ Romântica, 😏 Provocante, 🔥 Quente/Sensual, 😂 Engraçada e 😌 Confiante. Responda em JSON.`,
      },
      { type: "image_url", image_url: { url: data.imageDataUrl } },
    ]);
  });

export const suggestReplies = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Base.extend({ message: z.string().min(2) }).parse(input))
  .handler(async ({ data }) => {
    return callGateway([
      {
        type: "text",
        text: `${personaBlock(data)}
Contexto/mensagem recebida: "${data.message}"
Explique em 1-2 frases o tom e o que isso pode significar, e sugira 5 respostas prontas para enviar: ❤️ Carinhosa, 💌 Romântica, 😌 Confiante, 😏 Provocante e 🔥 Sensual (sugestiva, nunca gráfica). Responda em JSON.`,
      },
    ]);
  });

export const generateMessages = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    Base.extend({
      mode: z.enum(["conquista", "casal", "pensando"]),
      topic: z.string().min(1),
      extra: z.string().optional(),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const modeText =
      data.mode === "conquista"
        ? "Modo Conquista: mensagens para conquistar alguém."
        : data.mode === "casal"
          ? "Modo Namorados: mensagens para o parceiro ou parceira."
          : "Modo Deixa Pensando: frases sugestivas, confiantes e sensuais que criam expectativa e tensão romântica, sem vulgaridade nem descrição gráfica.";

    return callGateway([
      {
        type: "text",
        text: `${personaBlock(data)}
${modeText}
Categoria: "${data.topic}".${data.extra ? ` Detalhes do utilizador: "${data.extra}".` : ""}
Gere 5 mensagens diferentes e originais, cada uma com um ângulo distinto. Em "tone" escreva a categoria e em "meaning" uma dica curta de quando enviar. Responda em JSON.`,
      },
    ]);
  });
