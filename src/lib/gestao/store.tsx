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
  Asset,
  CashMovement,
  CashType,
  Customer,
  CustomerAccount,
  CustomerOrder,
  ClosingPeriod,
  DailyClosing,
  PeriodClosing,
  Employee,
  Expense,
  Income,
  InventoryMovement,
  Product,
  OrderChannel,
  OrderStatus,
  Purchase,
  PurchaseItem,
  Reservation,
  ReservationStatus,
  RestaurantTable,
  Sale,
  SaleItem,
  Settings,
  StockMovementType,
  Supplier,
  TableStatus,
} from "./types";

const STORAGE_KEY = "gestao-bar-restaurante-v1";
const SESSION_KEY = "gestao-cliente-sessao-v1";

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
  customerAccounts: [],
  employees: [],
  tables: [],
  cashMovements: [],
  inventoryMovements: [],
  dailyClosings: [],
  periodClosings: [],
  assets: [],
  auditLogs: [],
  orders: [],
  reservations: [],
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
  saveProduct: (p: Omit<Product, "id"> & { id?: string | undefined }) => void;
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
  // assets (bens / património)
  saveAsset: (a: Omit<Asset, "id"> & { id?: string | undefined }) => void;
  deleteAsset: (id: string) => void;
  saveSupplier: (s: Omit<Supplier, "id"> & { id?: string | undefined }) => void;
  deleteSupplier: (id: string) => void;
  saveCustomer: (c: Omit<Customer, "id"> & { id?: string | undefined }) => void;
  // área do cliente (login próprio)
  customerSession: CustomerAccount | null;
  registerCustomerAccount: (input: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => { ok: boolean; error?: string };
  loginCustomer: (email: string, password: string) => { ok: boolean; error?: string };
  logoutCustomer: () => void;
  deleteCustomer: (id: string) => void;
  saveEmployee: (e: Omit<Employee, "id"> & { id?: string | undefined }) => void;
  deleteEmployee: (id: string) => void;
  payEmployee: (input: {
    employeeId: string;
    amount: number;
    paymentMethod: string;
    note?: string | undefined;
  }) => void;
  // tables
  saveTable: (t: { id?: string | undefined; name: string; area: string }) => void;
  deleteTable: (id: string) => void;
  setTableStatus: (id: string, status: TableStatus) => void;
  addTableItem: (tableId: string, productId: string, qty: number) => void;
  removeTableItem: (tableId: string, productId: string) => void;
  transferTable: (fromId: string, toId: string) => void;
  clearTable: (id: string) => void;
  // customer orders & reservations
  placeOrder: (input: {
    customerName: string;
    phone: string;
    channel: OrderChannel;
    tableId?: string | undefined;
    items: SaleItem[];
    note?: string | undefined;
    paymentMethod?: string | undefined;
    paymentRef?: string | undefined;
    accountId?: string | undefined;
  }) => CustomerOrder;
  setOrderStatus: (id: string, status: OrderStatus) => void;
  confirmOrderPayment: (id: string, paymentMethod: string) => void;
  placeReservation: (input: {
    customerName: string;
    phone: string;
    email?: string | undefined;
    date: string;
    time: string;
    people: number;
    area?: string | undefined;
    note?: string | undefined;
  }) => Reservation;
  setReservationStatus: (
    id: string,
    status: ReservationStatus,
    tableId?: string | undefined,
  ) => void;
  // closing
  closeDay: () => DailyClosing | null;
  closePeriod: (period: ClosingPeriod) => PeriodClosing;
  // data
  exportBackup: () => void;
  importBackup: (json: string) => boolean;
  clearAll: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [hydrated, setHydrated] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    setState(load());
    setSessionId(window.localStorage.getItem(SESSION_KEY));
    setHydrated(true);
  }, []);

  // Sincroniza automaticamente entre separadores/dispositivos no mesmo browser,
  // sem ser necessário recarregar a página.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setState(load());
      if (e.key === SESSION_KEY) setSessionId(e.newValue);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
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

      payEmployee: ({ employeeId, amount, paymentMethod, note }) =>
        patch((s) => {
          const employee = s.employees.find((e) => e.id === employeeId);
          if (!employee || amount <= 0) return s;
          const expense: Expense = {
            id: uid(),
            date: now(),
            category: "Salários",
            description: `Pagamento a ${employee.name} (${employee.role})`,
            amount,
            paymentMethod,
            employeeId,
            ...(note ? { note } : {}),
          };
          const cash: CashMovement = {
            id: uid(),
            date: expense.date,
            type: "saida",
            amount,
            category: "Despesa: Salários",
            description: expense.description,
            paymentMethod,
            refId: expense.id,
          };
          return log(
            {
              ...s,
              expenses: [expense, ...s.expenses],
              cashMovements: [cash, ...s.cashMovements],
            },
            "Pagamento de funcionário",
            expense.description,
            amount,
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

      saveAsset: (a) =>
        patch((s) =>
          a.id
            ? log(
                {
                  ...s,
                  assets: s.assets.map((x) => (x.id === a.id ? ({ ...x, ...a } as Asset) : x)),
                },
                "Bem actualizado",
                a.name,
                a.value,
              )
            : log(
                { ...s, assets: [{ ...(a as Omit<Asset, "id">), id: uid() }, ...s.assets] },
                "Bem registado",
                a.name,
                a.value,
              ),
        ),
      deleteAsset: (id) =>
        patch((s) => {
          const asset = s.assets.find((x) => x.id === id);
          return log(
            { ...s, assets: s.assets.filter((x) => x.id !== id) },
            "Bem removido",
            asset?.name ?? id,
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
      customerSession:
        state.customerAccounts.find((a) => a.id === sessionId) ?? null,
      registerCustomerAccount: ({ name, email, phone, password }) => {
        const mail = email.trim().toLowerCase();
        if (!name.trim()) return { ok: false, error: "Indique o seu nome." };
        if (!mail.includes("@")) return { ok: false, error: "E-mail inválido." };
        if (password.length < 6) return { ok: false, error: "A senha deve ter 6+ caracteres." };
        if (state.customerAccounts.some((a) => a.email === mail))
          return { ok: false, error: "Já existe uma conta com este e-mail." };
        const account: CustomerAccount = {
          id: uid(),
          name: name.trim(),
          email: mail,
          phone: phone.trim(),
          password,
          createdAt: now(),
        };
        patch((s) => ({
          ...s,
          customerAccounts: [account, ...s.customerAccounts],
          customers: s.customers.some((c) => c.email.toLowerCase() === mail)
            ? s.customers
            : [
                {
                  id: uid(),
                  name: account.name,
                  phone: account.phone,
                  email: account.email,
                  address: "",
                },
                ...s.customers,
              ],
        }));
        window.localStorage.setItem(SESSION_KEY, account.id);
        setSessionId(account.id);
        return { ok: true };
      },
      loginCustomer: (email, password) => {
        const mail = email.trim().toLowerCase();
        const account = state.customerAccounts.find((a) => a.email === mail);
        if (!account || account.password !== password)
          return { ok: false, error: "E-mail ou senha incorretos." };
        window.localStorage.setItem(SESSION_KEY, account.id);
        setSessionId(account.id);
        return { ok: true };
      },
      logoutCustomer: () => {
        window.localStorage.removeItem(SESSION_KEY);
        setSessionId(null);
      },

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

      placeOrder: ({ customerName, phone, channel, tableId, items, note, paymentMethod, paymentRef, accountId }) => {
        const total = items.reduce((a, i) => a + i.subtotal, 0);
        const table = state.tables.find((tb) => tb.id === tableId);
        const method = paymentMethod ?? "Dinheiro";
        const order: CustomerOrder = {
          id: uid(),
          code: `PD-${String(state.orders.length + 1).padStart(4, "0")}`,
          date: now(),
          customerName,
          phone,
          channel,
          tableId,
          tableName: table?.name,
          items,
          total,
          note,
          status: "novo",
          paymentStatus: paymentMethod ? "declarado" : "pendente",
          paymentMethod,
          paymentRef,
          prepaidAmount: total,
          stockApplied: true,
          accountId,
        };
        patch((s) => {
          // Valor do pedido entra automaticamente na caixa
          const cash: CashMovement[] = [
            {
              id: uid(),
              date: order.date,
              type: "entrada",
              amount: total,
              category: paymentMethod ? "Pré-pagamento" : "Pedido do cliente",
              description: `Pedido ${order.code} — ${customerName}${paymentRef ? ` (ref. ${paymentRef})` : ""}`,
              paymentMethod: method,
              refId: order.id,
            },
          ];
          // Stock atualizado automaticamente
          const inv: InventoryMovement[] = [];
          const products = s.products.map((p) => {
            const item = items.find((i) => i.productId === p.id);
            if (!item) return p;
            inv.push({
              id: uid(),
              date: order.date,
              productId: p.id,
              productName: p.name,
              type: "saida",
              qty: item.qty,
              reason: `Pedido ${order.code}`,
              value: item.subtotal,
            });
            return { ...p, stock: Math.max(0, p.stock - item.qty) };
          });
          return log(
            {
              ...s,
              orders: [order, ...s.orders],
              products,
              inventoryMovements: [...inv, ...s.inventoryMovements],
              cashMovements: [...cash, ...s.cashMovements],
            },
            paymentMethod ? "Pedido pré-pago" : "Pedido do cliente",
            `${order.code} — ${customerName}`,
            total,
          );
        });
        return order;
      },
      setOrderStatus: (id, status) =>
        patch((s) => {
          const order = s.orders.find((o) => o.id === id);
          if (!order) return s;
          let tables = s.tables;
          if (status === "aceite" && order.channel === "mesa" && order.tableId) {
            tables = s.tables.map((tb) => {
              if (tb.id !== order.tableId) return tb;
              const items = [...tb.items];
              order.items.forEach((i) => {
                const existing = items.find((x) => x.productId === i.productId);
                if (existing) existing.qty += i.qty;
                else items.push({ productId: i.productId, name: i.name, qty: i.qty, unitPrice: i.unitPrice });
              });
              return { ...tb, items, status: "ocupada" as TableStatus };
            });
          }
          return log(
            { ...s, tables, orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)) },
            `Pedido: ${status}`,
            order.code,
          );
        }),
      confirmOrderPayment: (id, paymentMethod) =>
        patch((s) => {
          const order = s.orders.find((o) => o.id === id);
          if (!order || order.paymentStatus === "pago") return s;
          const sale: Sale = {
            id: uid(),
            date: now(),
            items: order.items,
            discount: 0,
            total: order.total,
            paymentMethod,
            tableId: order.tableId,
          };
          const inv: InventoryMovement[] = [];
          const products = order.stockApplied ? s.products : s.products.map((p) => {
            const item = order.items.find((i) => i.productId === p.id);
            if (!item) return p;
            inv.push({
              id: uid(),
              date: sale.date,
              productId: p.id,
              productName: p.name,
              type: "saida",
              qty: item.qty,
              reason: `Pedido ${order.code}`,
              value: item.subtotal,
            });
            return { ...p, stock: Math.max(0, p.stock - item.qty) };
          });
          const remaining = Math.max(0, order.total - (order.prepaidAmount ?? 0));
          const cashEntries: CashMovement[] =
            remaining > 0
              ? [
                  {
                    id: uid(),
                    date: sale.date,
                    type: "entrada",
                    amount: remaining,
                    category: "Venda",
                    description: `Pedido ${order.code} — ${order.customerName}`,
                    paymentMethod,
                    refId: sale.id,
                  },
                ]
              : [];
          return log(
            {
              ...s,
              sales: [sale, ...s.sales],
              products,
              inventoryMovements: [...inv, ...s.inventoryMovements],
              cashMovements: [...cashEntries, ...s.cashMovements],
              tables: order.tableId
                ? s.tables.map((tb) =>
                    tb.id === order.tableId
                      ? { ...tb, items: [], status: "livre" as TableStatus }
                      : tb,
                  )
                : s.tables,
              orders: s.orders.map((o) =>
                o.id === id
                  ? {
                      ...o,
                      paymentStatus: "pago" as const,
                      paymentMethod,
                      status: "entregue" as OrderStatus,
                      saleId: sale.id,
                    }
                  : o,
              ),
            },
            "Pagamento confirmado",
            `${order.code} — ${paymentMethod}`,
            order.total,
          );
        }),
      placeReservation: (input) => {
        const reservation: Reservation = {
          id: uid(),
          code: `RS-${String(state.reservations.length + 1).padStart(4, "0")}`,
          createdAt: now(),
          status: "pendente",
          ...input,
        };
        patch((s) =>
          log(
            { ...s, reservations: [reservation, ...s.reservations] },
            "Reserva solicitada",
            `${reservation.code} — ${reservation.customerName}`,
          ),
        );
        return reservation;
      },
      setReservationStatus: (id, status, tableId) =>
        patch((s) => {
          const reservation = s.reservations.find((r) => r.id === id);
          if (!reservation) return s;
          const table = tableId ? s.tables.find((tb) => tb.id === tableId) : undefined;
          return log(
            {
              ...s,
              tables:
                status === "confirmada" && table
                  ? s.tables.map((tb) =>
                      tb.id === table.id ? { ...tb, status: "reservada" as TableStatus } : tb,
                    )
                  : s.tables,
              reservations: s.reservations.map((r) =>
                r.id === id
                  ? { ...r, status, tableId: table?.id ?? r.tableId, tableName: table?.name ?? r.tableName }
                  : r,
              ),
            },
            `Reserva: ${status}`,
            reservation.code,
          );
        }),

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

      closePeriod: (period) => {
        const ref = new Date();
        let start: Date;
        let end: Date;
        if (period === "semanal") {
          const day = ref.getDay();
          const diff = day === 0 ? 6 : day - 1; // semana começa na segunda
          start = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() - diff);
          end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
        } else {
          start = new Date(ref.getFullYear(), ref.getMonth(), 1);
          end = new Date(ref.getFullYear(), ref.getMonth() + 1, 1);
        }
        const inRange = (iso: string) => {
          const d = new Date(iso);
          return d >= start && d < end;
        };
        const movements = state.cashMovements.filter((m) => inRange(m.date));
        const sales = state.sales.filter((x) => inRange(x.date));
        const inflowsTotal = movements
          .filter((m) => m.type === "entrada")
          .reduce((a, m) => a + m.amount, 0);
        const outflowsTotal = movements
          .filter((m) => m.type === "saida")
          .reduce((a, m) => a + m.amount, 0);
        const closing: PeriodClosing = {
          id: uid(),
          period,
          date: now(),
          startDate: start.toISOString(),
          endDate: new Date(end.getTime() - 1).toISOString(),
          label:
            period === "semanal"
              ? `Semana de ${start.toLocaleDateString("pt-PT")}`
              : start.toLocaleDateString("pt-PT", { month: "long", year: "numeric" }),
          salesTotal: sales.reduce((a, x) => a + x.total, 0),
          otherIncome: state.incomes.filter((x) => inRange(x.date)).reduce((a, x) => a + x.amount, 0),
          expensesTotal: state.expenses
            .filter((x) => inRange(x.date))
            .reduce((a, x) => a + x.amount, 0),
          purchasesTotal: state.purchases
            .filter((x) => inRange(x.date))
            .reduce((a, x) => a + x.total, 0),
          inflowsTotal,
          outflowsTotal,
          result: inflowsTotal - outflowsTotal,
          salesCount: sales.length,
        };
        patch((s) =>
          log(
            { ...s, periodClosings: [closing, ...s.periodClosings] },
            period === "semanal" ? "Fecho semanal" : "Fecho mensal",
            closing.label,
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
  }, [state, hydrated, patch, sessionId]);

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
