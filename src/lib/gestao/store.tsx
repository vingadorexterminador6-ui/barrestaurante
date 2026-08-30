import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { translate } from "./i18n";
import type {
  AppState,
  CashMovement,
  CashType,
  Customer,
  DailyClosing,
  Employee,
  Expense,
  Income,
  InventoryMovement,
  Product,
  Purchase,
  PurchaseItem,
  RestaurantTable,
  Sale,
  SaleItem,
  Settings,
  StockMovementType,
  Supplier,
  TableStatus,
} from "./types";

const STORAGE_KEY = "gestao-bar-restaurante-v1";

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const now = () => new Date().toISOString();

export const defaultState = (): AppState => ({
  setupDone: false,
  manualSeen: false,
  establishment: {
    name: "",
    owner: "",
    type: "Bar & Restaurante",
    phone: "",
    email: "",
    address: "",
    city: "",
    country: "",
  },
  settings: {
    currency: "MZN",
    currencySymbol: "MT",
    language: "pt",
    theme: "dark",
    systemName: "Gestão Pro",
    mode: "automatico",
    paymentMethods: ["Dinheiro", "M-Pesa", "e-Mola", "Cartão", "Transferência bancária"],
    expenseCategories: [
      "Energia",
      "Água",
      "Internet",
      "Salários",
      "Renda/aluguer",
      "Transporte",
      "Compras",
      "Manutenção",
      "Marketing",
      "Impostos",
      "Outros",
    ],
    productCategories: ["Bebidas", "Comidas", "Pratos", "Snacks", "Sobremesas", "Outros"],
    units: ["un", "kg", "g", "l", "ml", "cx", "grf"],
    defaultMinStock: 5,
  },
  products: [],
  sales: [],
  expenses: [],
  incomes: [],
  purchases: [],
  suppliers: [],
  customers: [],
  employees: [],
  tables: [],
  cashMovements: [],
  inventoryMovements: [],
  dailyClosings: [],
  auditLogs: [],
  cashOpen: false,
});

function load(): AppState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<AppState>;
    const base = defaultState();
    return {
      ...base,
      ...parsed,
      establishment: { ...base.establishment, ...parsed.establishment },
      settings: { ...base.settings, ...parsed.settings },
    };
  } catch {
    return defaultState();
  }
}

export const isSameDay = (iso: string, ref = new Date()) => {
  const d = new Date(iso);
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
};

interface StoreValue {
  state: AppState;
  hydrated: boolean;
  t: (key: string) => string;
  money: (value: number) => string;
  update: (patch: Partial<AppState>) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  completeSetup: (data: {
    establishment: AppState["establishment"];
    settings: Partial<Settings>;
    openingBalance: number;
  }) => void;
  resetSetup: () => void;
  // products
  saveProduct: (p: Omit<Product, "id"> & { id?: string }) => void;
  deleteProduct: (id: string) => void;
  // stock
  addStockMovement: (input: {
    productId: string;
    type: StockMovementType;
    qty: number;
    reason: string;
  }) => void;
  // cash
  openCash: (amount: number) => void;
  closeCash: () => void;
  addCashMovement: (input: {
    type: CashType;
    amount: number;
    category: string;
    description: string;
    paymentMethod?: string;
  }) => void;
  // sales
  registerSale: (input: {
    items: SaleItem[];
    discount: number;
    paymentMethod: string;
    customerId?: string;
    employeeId?: string;
    tableId?: string;
  }) => Sale;
  // finance
  addExpense: (input: Omit<Expense, "id" | "date">) => void;
  addIncome: (input: Omit<Income, "id" | "date">) => void;
  addPurchase: (input: {
    supplierId?: string;
    supplierName: string;
    items: PurchaseItem[];
    paymentMethod: string;
    note?: string;
  }) => void;
  // people
  saveSupplier: (s: Omit<Supplier, "id"> & { id?: string }) => void;
  deleteSupplier: (id: string) => void;
  saveCustomer: (c: Omit<Customer, "id"> & { id?: string }) => void;
  deleteCustomer: (id: string) => void;
  saveEmployee: (e: Omit<Employee, "id"> & { id?: string }) => void;
  deleteEmployee: (id: string) => void;
  // tables
  saveTable: (t: { id?: string; name: string; area: string }) => void;
  deleteTable: (id: string) => void;
  setTableStatus: (id: string, status: TableStatus) => void;
  addTableItem: (tableId: string, productId: string, qty: number) => void;
  removeTableItem: (tableId: string, productId: string) => void;
  transferTable: (fromId: string, toId: string) => void;
  clearTable: (id: string) => void;
  // closing
  closeDay: () => DailyClosing | null;
  // data
  exportBackup: () => void;
  importBackup: (json: string) => boolean;
  clearAll: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", state.settings.theme === "dark");
  }, [state.settings.theme]);

  const patch = useCallback((fn: (s: AppState) => AppState) => setState((s) => fn(s)), []);

  const log = (s: AppState, operation: string, detail: string, amount?: number): AppState => ({
    ...s,
    auditLogs: [{ id: uid(), date: now(), operation, detail, amount }, ...s.auditLogs].slice(0, 800),
  });

  const value = useMemo<StoreValue>(() => {
    const t = (key: string) => translate(state.settings.language, key);
    const money = (v: number) =>
      `${state.settings.currencySymbol} ${(Number.isFinite(v) ? v : 0).toLocaleString("pt-PT", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

    return {
      state,
      hydrated,
      t,
      money,
      update: (p) => patch((s) => ({ ...s, ...p })),
      updateSettings: (p) => patch((s) => ({ ...s, settings: { ...s.settings, ...p } })),
      completeSetup: ({ establishment, settings, openingBalance }) =>
        patch((s) => {
          const movements: CashMovement[] = openingBalance
            ? [
                {
                  id: uid(),
                  date: now(),
                  type: "entrada",
                  amount: openingBalance,
                  category: "Saldo inicial",
                  description: "Saldo inicial da caixa",
                },
              ]
            : [];
          return log(
            {
              ...s,
              setupDone: true,
              manualSeen: true,
              establishment,
              settings: { ...s.settings, ...settings },
              cashOpen: true,
              cashOpenedAt: now(),
              cashMovements: [...movements, ...s.cashMovements],
            },
            "Configuração inicial",
            establishment.name,
            openingBalance,
          );
        }),
      resetSetup: () => patch((s) => ({ ...s, setupDone: false })),

      saveProduct: (p) =>
        patch((s) => {
          if (p.id) {
            return log(
              {
                ...s,
                products: s.products.map((x) => (x.id === p.id ? ({ ...x, ...p } as Product) : x)),
              },
              "Produto atualizado",
              p.name,
            );
          }
          const created: Product = { ...(p as Omit<Product, "id">), id: uid() };
          return log({ ...s, products: [created, ...s.products] }, "Produto criado", created.name);
        }),
      deleteProduct: (id) =>
        patch((s) =>
          log(
            { ...s, products: s.products.filter((p) => p.id !== id) },
            "Produto removido",
            s.products.find((p) => p.id === id)?.name ?? id,
          ),
        ),

      addStockMovement: ({ productId, type, qty, reason }) =>
        patch((s) => {
          const product = s.products.find((p) => p.id === productId);
          if (!product) return s;
          const delta = type === "entrada" ? qty : type === "ajuste" ? qty - product.stock : -qty;
          const movement: InventoryMovement = {
            id: uid(),
            date: now(),
            productId,
            productName: product.name,
            type,
            qty,
            reason,
            value: Math.abs(delta) * product.costPrice,
          };
          return log(
            {
              ...s,
              products: s.products.map((p) =>
                p.id === productId ? { ...p, stock: Math.max(0, p.stock + delta) } : p,
              ),
              inventoryMovements: [movement, ...s.inventoryMovements],
            },
            `Stock: ${type}`,
            `${product.name} (${qty})`,
          );
        }),

      openCash: (amount) =>
        patch((s) => {
          const movements: CashMovement[] = amount
            ? [
                {
                  id: uid(),
                  date: now(),
                  type: "entrada",
                  amount,
                  category: "Abertura de caixa",
                  description: "Fundo de caixa",
                },
              ]
            : [];
          return log(
            {
              ...s,
              cashOpen: true,
              cashOpenedAt: now(),
              cashMovements: [...movements, ...s.cashMovements],
            },
            "Caixa aberta",
            "Abertura",
            amount,
          );
        }),
      closeCash: () => patch((s) => log({ ...s, cashOpen: false }, "Caixa fechada", "Fecho")),
      addCashMovement: (input) =>
        patch((s) =>
          log(
            {
              ...s,
              cashMovements: [{ id: uid(), date: now(), ...input }, ...s.cashMovements],
            },
            input.type === "entrada" ? "Entrada de caixa" : "Saída de caixa",
            `${input.category} — ${input.description}`,
            input.amount,
          ),
        ),

      registerSale: ({ items, discount, paymentMethod, customerId, employeeId, tableId }) => {
        const total = Math.max(
          0,
          items.reduce((acc, i) => acc + i.subtotal, 0) - discount,
        );
        const sale: Sale = {
          id: uid(),
          date: now(),
          items,
          discount,
          total,
          paymentMethod,
          customerId,
          employeeId,
          tableId,
        };
        patch((s) => {
          const inv: InventoryMovement[] = [];
          const products = s.products.map((p) => {
            const item = items.find((i) => i.productId === p.id);
            if (!item) return p;
            inv.push({
              id: uid(),
              date: sale.date,
              productId: p.id,
              productName: p.name,
              type: "saida",
              qty: item.qty,
              reason: "Venda",
              value: item.subtotal,
            });
            return { ...p, stock: Math.max(0, p.stock - item.qty) };
          });
          const cash: CashMovement = {
            id: uid(),
            date: sale.date,
            type: "entrada",
            amount: total,
            category: "Venda",
            description: `Venda de ${items.length} produto(s)`,
            paymentMethod,
            refId: sale.id,
          };
          return log(
            {
              ...s,
              sales: [sale, ...s.sales],
              products,
              inventoryMovements: [...inv, ...s.inventoryMovements],
              cashMovements: [cash, ...s.cashMovements],
              tables: tableId
                ? s.tables.map((tb) =>
                    tb.id === tableId ? { ...tb, items: [], status: "livre" as TableStatus } : tb,
                  )
                : s.tables,
            },
            "Venda registada",
            paymentMethod,
            total,
          );
        });
        return sale;
      },

      addExpense: (input) =>
        patch((s) => {
          const expense: Expense = { id: uid(), date: now(), ...input };
          const cash: CashMovement = {
            id: uid(),
            date: expense.date,
            type: "saida",
            amount: expense.amount,
            category: `Despesa: ${expense.category}`,
            description: expense.description,
            paymentMethod: expense.paymentMethod,
            refId: expense.id,
          };
          return log(
            {
              ...s,
              expenses: [expense, ...s.expenses],
              cashMovements: [cash, ...s.cashMovements],
            },
            "Despesa registada",
            `${expense.category} — ${expense.description}`,
            expense.amount,
          );
        }),

      addIncome: (input) =>
        patch((s) => {
          const income: Income = { id: uid(), date: now(), ...input };
          const cash: CashMovement = {
            id: uid(),
            date: income.date,
            type: "entrada",
            amount: income.amount,
            category: `Entrada: ${income.source}`,
            description: income.description,
            paymentMethod: income.paymentMethod,
            refId: income.id,
          };
          return log(
            { ...s, incomes: [income, ...s.incomes], cashMovements: [cash, ...s.cashMovements] },
            "Entrada registada",
            `${income.source} — ${income.description}`,
            income.amount,
          );
        }),

      addPurchase: ({ supplierId, supplierName, items, paymentMethod, note }) =>
        patch((s) => {
          const total = items.reduce((acc, i) => acc + i.subtotal, 0);
          const purchase: Purchase = {
            id: uid(),
            date: now(),
            supplierId,
            supplierName,
            items,
            total,
            paymentMethod,
            note,
          };
          const inv: InventoryMovement[] = [];
          const products = s.products.map((p) => {
            const item = items.find((i) => i.productId === p.id);
            if (!item) return p;
            inv.push({
              id: uid(),
              date: purchase.date,
              productId: p.id,
              productName: p.name,
              type: "entrada",
              qty: item.qty,
              reason: "Compra",
              value: item.subtotal,
            });
            return { ...p, stock: p.stock + item.qty, costPrice: item.unitPrice || p.costPrice };
          });
          const cash: CashMovement = {
            id: uid(),
            date: purchase.date,
            type: "saida",
            amount: total,
            category: "Compra",
            description: `Compra a ${supplierName || "fornecedor"}`,
            paymentMethod,
            refId: purchase.id,
          };
          return log(
            {
              ...s,
              purchases: [purchase, ...s.purchases],
              products,
              inventoryMovements: [...inv, ...s.inventoryMovements],
              cashMovements: [cash, ...s.cashMovements],
            },
            "Compra registada",
            supplierName,
            total,
          );
        }),

      saveSupplier: (sup) =>
        patch((s) =>
          sup.id
            ? {
                ...s,
                suppliers: s.suppliers.map((x) =>
                  x.id === sup.id ? ({ ...x, ...sup } as Supplier) : x,
                ),
              }
            : { ...s, suppliers: [{ ...(sup as Omit<Supplier, "id">), id: uid() }, ...s.suppliers] },
        ),
      deleteSupplier: (id) =>
        patch((s) => ({ ...s, suppliers: s.suppliers.filter((x) => x.id !== id) })),
      saveCustomer: (c) =>
        patch((s) =>
          c.id
            ? {
                ...s,
                customers: s.customers.map((x) => (x.id === c.id ? ({ ...x, ...c } as Customer) : x)),
              }
            : { ...s, customers: [{ ...(c as Omit<Customer, "id">), id: uid() }, ...s.customers] },
        ),
      deleteCustomer: (id) =>
        patch((s) => ({ ...s, customers: s.customers.filter((x) => x.id !== id) })),
      saveEmployee: (e) =>
        patch((s) =>
          e.id
            ? {
                ...s,
                employees: s.employees.map((x) => (x.id === e.id ? ({ ...x, ...e } as Employee) : x)),
              }
            : { ...s, employees: [{ ...(e as Omit<Employee, "id">), id: uid() }, ...s.employees] },
        ),
      deleteEmployee: (id) =>
        patch((s) => ({ ...s, employees: s.employees.filter((x) => x.id !== id) })),

      saveTable: (tb) =>
        patch((s) =>
          tb.id
            ? {
                ...s,
                tables: s.tables.map((x) =>
                  x.id === tb.id ? { ...x, name: tb.name, area: tb.area } : x,
                ),
              }
            : {
                ...s,
                tables: [
                  ...s.tables,
                  { id: uid(), name: tb.name, area: tb.area, status: "livre", items: [] },
                ],
              },
        ),
      deleteTable: (id) => patch((s) => ({ ...s, tables: s.tables.filter((x) => x.id !== id) })),
      setTableStatus: (id, status) =>
        patch((s) => ({
          ...s,
          tables: s.tables.map((x) => (x.id === id ? { ...x, status } : x)),
        })),
      addTableItem: (tableId, productId, qty) =>
        patch((s) => {
          const product = s.products.find((p) => p.id === productId);
          if (!product) return s;
          return {
            ...s,
            tables: s.tables.map((tb) => {
              if (tb.id !== tableId) return tb;
              const existing = tb.items.find((i) => i.productId === productId);
              const items = existing
                ? tb.items.map((i) =>
                    i.productId === productId ? { ...i, qty: i.qty + qty } : i,
                  )
                : [
                    ...tb.items,
                    { productId, name: product.name, qty, unitPrice: product.salePrice },
                  ];
              return { ...tb, items, status: "ocupada" as TableStatus };
            }),
          };
        }),
      removeTableItem: (tableId, productId) =>
        patch((s) => ({
          ...s,
          tables: s.tables.map((tb) =>
            tb.id === tableId
              ? { ...tb, items: tb.items.filter((i) => i.productId !== productId) }
              : tb,
          ),
        })),
      transferTable: (fromId, toId) =>
        patch((s) => {
          const from = s.tables.find((tb) => tb.id === fromId);
          if (!from) return s;
          return {
            ...s,
            tables: s.tables.map((tb) => {
              if (tb.id === fromId) return { ...tb, items: [], status: "livre" as TableStatus };
              if (tb.id === toId)
                return {
                  ...tb,
                  items: [...tb.items, ...from.items],
                  status: "ocupada" as TableStatus,
                };
              return tb;
            }),
          };
        }),
      clearTable: (id) =>
        patch((s) => ({
          ...s,
          tables: s.tables.map((tb) =>
            tb.id === id ? { ...tb, items: [], status: "livre" as TableStatus } : tb,
          ),
        })),

      closeDay: () => {
        const today = new Date();
        const dayMovements = state.cashMovements.filter((m) => isSameDay(m.date, today));
        const salesToday = state.sales.filter((x) => isSameDay(x.date, today));
        const expensesToday = state.expenses.filter((x) => isSameDay(x.date, today));
        const purchasesToday = state.purchases.filter((x) => isSameDay(x.date, today));
        const incomeToday = state.incomes.filter((x) => isSameDay(x.date, today));
        const totalIn = dayMovements
          .filter((m) => m.type === "entrada")
          .reduce((a, m) => a + m.amount, 0);
        const totalOut = dayMovements
          .filter((m) => m.type === "saida")
          .reduce((a, m) => a + m.amount, 0);
        const balanceNow = state.cashMovements.reduce(
          (a, m) => a + (m.type === "entrada" ? m.amount : -m.amount),
          0,
        );
        const closing: DailyClosing = {
          id: uid(),
          date: now(),
          openingBalance: balanceNow - totalIn + totalOut,
          salesTotal: salesToday.reduce((a, x) => a + x.total, 0),
          otherIncome: incomeToday.reduce((a, x) => a + x.amount, 0),
          expensesTotal: expensesToday.reduce((a, x) => a + x.amount, 0),
          purchasesTotal: purchasesToday.reduce((a, x) => a + x.total, 0),
          outflowsTotal: totalOut,
          expectedBalance: balanceNow,
          result: totalIn - totalOut,
          salesCount: salesToday.length,
        };
        patch((s) =>
          log(
            { ...s, dailyClosings: [closing, ...s.dailyClosings], cashOpen: false },
            "Fecho diário",
            `Resultado do dia`,
            closing.result,
          ),
        );
        return closing;
      },

      exportBackup: () => {
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `backup-gestao-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      },
      importBackup: (json) => {
        try {
          const parsed = JSON.parse(json) as AppState;
          if (!parsed || typeof parsed !== "object" || !("products" in parsed)) return false;
          setState({ ...defaultState(), ...parsed });
          return true;
        } catch {
          return false;
        }
      },
      clearAll: () => setState(defaultState()),
    };
  }, [state, hydrated, patch]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

/** Derived metrics from the current state. */
export function useMetrics() {
  const { state } = useStore();
  return useMemo(() => {
    const balance = state.cashMovements.reduce(
      (a, m) => a + (m.type === "entrada" ? m.amount : -m.amount),
      0,
    );
    const today = new Date();
    const salesToday = state.sales.filter((s) => isSameDay(s.date, today));
    const salesTodayTotal = salesToday.reduce((a, s) => a + s.total, 0);
    const expensesTodayTotal = state.expenses
      .filter((e) => isSameDay(e.date, today))
      .reduce((a, e) => a + e.amount, 0);
    const purchasesTodayTotal = state.purchases
      .filter((p) => isSameDay(p.date, today))
      .reduce((a, p) => a + p.total, 0);
    const stockValue = state.products.reduce((a, p) => a + p.stock * p.costPrice, 0);
    const costOfSales = salesToday.reduce(
      (a, s) =>
        a +
        s.items.reduce((b, i) => {
          const p = state.products.find((x) => x.id === i.productId);
          return b + (p ? p.costPrice * i.qty : 0);
        }, 0),
      0,
    );
    const profit = salesTodayTotal - costOfSales - expensesTodayTotal;
    const lowStock = state.products.filter((p) => p.stock > 0 && p.stock <= p.minStock);
    const outOfStock = state.products.filter((p) => p.stock <= 0);

    const salesByHour = Array.from({ length: 24 }, (_, h) => ({
      hour: `${String(h).padStart(2, "0")}h`,
      total: salesToday
        .filter((s) => new Date(s.date).getHours() === h)
        .reduce((a, s) => a + s.total, 0),
    }));

    const productRanking = Object.values(
      state.sales.reduce<Record<string, { name: string; qty: number; total: number }>>(
        (acc, sale) => {
          sale.items.forEach((i) => {
            acc[i.productId] = acc[i.productId] ?? { name: i.name, qty: 0, total: 0 };
            acc[i.productId]!.qty += i.qty;
            acc[i.productId]!.total += i.subtotal;
          });
          return acc;
        },
        {},
      ),
    ).sort((a, b) => b.qty - a.qty);

    return {
      balance,
      salesToday,
      salesTodayTotal,
      expensesTodayTotal,
      purchasesTodayTotal,
      stockValue,
      profit,
      lowStock,
      outOfStock,
      salesByHour,
      productRanking,
    };
  }, [state]);
}
