export type Persona =
  | "Namorada"
  | "Namorado"
  | "Crush"
  | "Esposa"
  | "Marido"
  | "Pessoa que estou conhecendo";

export type Goal =
  | "Fazer rir"
  | "Demonstrar carinho"
  | "Criar conexão"
  | "Flertar"
  | "Criar mistério"
  | "Pedir desculpas"
  | "Criar clima"
  | "Marcar encontro";

export const PERSONAS: Persona[] = [
  "Namorada",
  "Namorado",
  "Crush",
  "Esposa",
  "Marido",
  "Pessoa que estou conhecendo",
];

export const GOALS: Goal[] = [
  "Fazer rir",
  "Demonstrar carinho",
  "Criar conexão",
  "Flertar",
  "Criar mistério",
  "Pedir desculpas",
  "Criar clima",
  "Marcar encontro",
];

export const INTENSITIES = [
  { value: 1, label: "😊 Leve" },
  { value: 2, label: "😉 Flertante" },
  { value: 3, label: "😏 Provocante" },
  { value: 4, label: "🔥 Muito provocante" },
];

export const CONQUISTA_TOPICS = [
  "Iniciar uma conversa",
  "Chamar atenção",
  "Fazer a pessoa sorrir",
  "Demonstrar interesse",
  "Criar mistério",
  "Aumentar a conexão emocional",
  "Responder depois de horas sem parecer desesperado",
  "Manter a conversa interessante",
  "Criar clima romântico",
  "Boa noite inesquecível",
  "Bom dia",
  "Demonstrar saudades",
  "Convite para um encontro",
];

export const CASAL_TOPICS = [
  "Mensagem de bom dia",
  "Mensagem de boa noite",
  "Saudade",
  "Amor",
  "Ciúmes",
  "Pedido de desculpas",
  "Reconciliação",
  "Elogios",
  "Surpresas",
  "Flertes",
  "Mensagens provocantes",
  "Deixar o parceiro pensando em você",
];

export interface Suggestion {
  emoji: string;
  label: string;
  text: string;
}

export interface AnalysisResult {
  tone: string;
  meaning: string;
  suggestions: Suggestion[];
}

export interface HistoryEntry {
  id: string;
  createdAt: string;
  kind: "screenshot" | "responder" | "conquista" | "casal" | "pensando";
  title: string;
  tone?: string | undefined;
  meaning?: string | undefined;
  suggestions: Suggestion[];
  favorite: boolean;
}
