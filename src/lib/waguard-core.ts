export type RiskLevel = "baixo" | "atencao" | "alto";
export type AccountType = "messenger" | "business";

export const PLANS = ["basico", "pro", "empresa"] as const;
export type Plan = (typeof PLANS)[number];

export const PLAN_LABELS: Record<string, string> = {
  basico: "Básico",
  pro: "Pro",
  empresa: "Empresa",
};

export const LICENSE_STATUS_LABELS: Record<string, string> = {
  disponivel: "Disponível",
  ativo: "Ativo",
  suspenso: "Suspenso",
  expirado: "Expirado",
};

export const RISK_LABELS: Record<RiskLevel, string> = {
  baixo: "Baixo",
  atencao: "Atenção",
  alto: "Alto",
};

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  messenger: "WhatsApp Messenger",
  business: "WhatsApp Business",
};

export function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 65) return "alto";
  if (score >= 35) return "atencao";
  return "baixo";
}

/**
 * Pontuação de risco 0-100 a partir de sinais permitidos e registados pelo
 * próprio sistema: volume de atividade, taxa de resposta e denúncias/bloqueios
 * comunicados. Nenhum sinal é obtido de forma não oficial.
 */
export function computeRiskScore(input: {
  messageVolume: number;
  responseRate: number;
  reportsCount: number;
  dailyLimit: number;
  protectionActive: boolean;
  automationsPaused: boolean;
}): number {
  const limit = Math.max(input.dailyLimit, 1);
  const volumePressure = Math.min(input.messageVolume / limit, 2) * 30; // 0-60
  const responsePenalty = (1 - Math.min(Math.max(input.responseRate, 0), 1)) * 25; // 0-25
  const reportsPenalty = Math.min(input.reportsCount, 10) * 3.5; // 0-35
  const protectionBonus = input.protectionActive ? -8 : 6;
  const pausedBonus = input.automationsPaused ? -6 : 0;

  const raw = volumePressure + responsePenalty + reportsPenalty + protectionBonus + pausedBonus;
  return Math.round(Math.min(Math.max(raw, 0), 100));
}

export function formatCode(raw: string): string {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
  return clean.replace(/(.{4})/g, "$1-").replace(/-$/, "");
}

export function maskIdentifier(identifier: string): string {
  const digits = identifier.replace(/\D/g, "");
  if (digits.length < 4) return "****";
  return `+${digits.slice(0, 3)} ***** ${digits.slice(-2)}`;
}

export const RANGE_OPTIONS = [
  { value: "hoje", label: "Hoje", days: 1 },
  { value: "7d", label: "7 dias", days: 7 },
  { value: "30d", label: "30 dias", days: 30 },
  { value: "custom", label: "Personalizado", days: 0 },
] as const;
