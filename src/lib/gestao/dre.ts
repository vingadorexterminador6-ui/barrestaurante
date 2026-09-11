import type { AppState, Sector } from "./types";

export const SECTOR_LABEL: Record<Sector, string> = {
  bar: "Bar",
  restaurante: "Restaurante",
  geral: "Geral / não atribuído",
};

export const SECTOR_KEYS: Sector[] = ["bar", "restaurante", "geral"];

export interface DreLine {
  sector: Sector;
  revenue: number;
  otherIncome: number;
  cogs: number;
  grossProfit: number;
  expenses: number;
  result: number;
  margin: number;
  salesCount: number;
}

export interface DreResult {
  lines: DreLine[];
  total: DreLine;
  from: string;
  to: string;
}

const sectorOf = (state: AppState, productId: string): Sector => {
  const p = state.products.find((x) => x.id === productId);
  return p?.sector ?? "geral";
};

const inRange = (iso: string, from: Date, to: Date) => {
  const d = new Date(iso).getTime();
  return d >= from.getTime() && d <= to.getTime();
};

export function computeDre(state: AppState, from: Date, to: Date): DreResult {
  const blank = (): Omit<DreLine, "sector"> => ({
    revenue: 0,
    otherIncome: 0,
    cogs: 0,
    grossProfit: 0,
    expenses: 0,
    result: 0,
    margin: 0,
    salesCount: 0,
  });

  const acc: Record<Sector, Omit<DreLine, "sector">> = {
    bar: blank(),
    restaurante: blank(),
    geral: blank(),
  };

  for (const sale of state.sales) {
    if (!inRange(sale.date, from, to)) continue;
    const gross = sale.items.reduce((a, i) => a + i.subtotal, 0) || 1;
    const touched = new Set<Sector>();
    for (const item of sale.items) {
      const sec = sectorOf(state, item.productId);
      touched.add(sec);
      // desconto rateado proporcionalmente ao peso do item na venda
      const share = item.subtotal / gross;
      acc[sec].revenue += item.subtotal - sale.discount * share;
      const cost = state.products.find((p) => p.id === item.productId)?.costPrice ?? 0;
      acc[sec].cogs += cost * item.qty;
    }
    for (const sec of touched) acc[sec].salesCount += 1;
  }

  for (const income of state.incomes) {
    if (!inRange(income.date, from, to)) continue;
    acc.geral.otherIncome += income.amount;
  }

  for (const expense of state.expenses) {
    if (!inRange(expense.date, from, to)) continue;
    acc[expense.sector ?? "geral"].expenses += expense.amount;
  }

  const lines: DreLine[] = SECTOR_KEYS.map((sector) => {
    const a = acc[sector];
    const grossProfit = a.revenue - a.cogs;
    const result = grossProfit + a.otherIncome - a.expenses;
    const base = a.revenue + a.otherIncome;
    return {
      sector,
      ...a,
      grossProfit,
      result,
      margin: base > 0 ? (result / base) * 100 : 0,
    };
  });

  const sum = (pick: (l: DreLine) => number) => lines.reduce((x, l) => x + pick(l), 0);
  const totalRevenue = sum((l) => l.revenue);
  const totalOther = sum((l) => l.otherIncome);
  const totalCogs = sum((l) => l.cogs);
  const totalExpenses = sum((l) => l.expenses);
  const totalGross = totalRevenue - totalCogs;
  const totalResult = totalGross + totalOther - totalExpenses;
  const totalBase = totalRevenue + totalOther;

  return {
    lines,
    total: {
      sector: "geral",
      revenue: totalRevenue,
      otherIncome: totalOther,
      cogs: totalCogs,
      grossProfit: totalGross,
      expenses: totalExpenses,
      result: totalResult,
      margin: totalBase > 0 ? (totalResult / totalBase) * 100 : 0,
      salesCount: sum((l) => l.salesCount),
    },
    from: from.toISOString(),
    to: to.toISOString(),
  };
}
