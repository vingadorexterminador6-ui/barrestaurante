export type ManagementMode = "automatico" | "manual";
export type Language = "pt" | "en" | "es" | "fr";
export type Theme = "light" | "dark";

export interface Establishment {
  name: string;
  owner: string;
  type: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
  logo?: string;
}

export interface Settings {
  currency: string;
  currencySymbol: string;
  language: Language;
  theme: Theme;
  systemName: string;
  mode: ManagementMode;
  paymentMethods: string[];
  expenseCategories: string[];
  productCategories: string[];
  units: string[];
  defaultMinStock: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  description: string;
  unit: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  supplierId?: string;
  photo?: string;
  active: boolean;
}

export interface SaleItem {
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  date: string;
  items: SaleItem[];
  discount: number;
  total: number;
  paymentMethod: string;
  customerId?: string;
  employeeId?: string;
  tableId?: string;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  note?: string;
}

export interface Income {
  id: string;
  date: string;
  source: string;
  description: string;
  amount: number;
  paymentMethod: string;
}

export interface PurchaseItem {
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
}

export interface Purchase {
  id: string;
  date: string;
  supplierId?: string;
  supplierName: string;
  items: PurchaseItem[];
  total: number;
  paymentMethod: string;
  note?: string;
}

export interface Supplier {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  products: string;
  note?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  note?: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  phone: string;
  salary: number;
  hiredAt: string;
  active: boolean;
  note?: string;
}

export type TableStatus = "livre" | "ocupada" | "reservada" | "aguardando";

export interface TableOrderItem {
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
}

export interface RestaurantTable {
  id: string;
  name: string;
  area: string;
  status: TableStatus;
  items: TableOrderItem[];
}

export type CashType = "entrada" | "saida";

export interface CashMovement {
  id: string;
  date: string;
  type: CashType;
  amount: number;
  category: string;
  description: string;
  paymentMethod?: string;
  refId?: string;
}

export type StockMovementType = "entrada" | "saida" | "ajuste" | "perda";

export interface InventoryMovement {
  id: string;
  date: string;
  productId: string;
  productName: string;
  type: StockMovementType;
  qty: number;
  reason: string;
  value: number;
}

export interface DailyClosing {
  id: string;
  date: string;
  openingBalance: number;
  salesTotal: number;
  otherIncome: number;
  expensesTotal: number;
  purchasesTotal: number;
  outflowsTotal: number;
  expectedBalance: number;
  result: number;
  salesCount: number;
}

export interface AuditLog {
  id: string;
  date: string;
  operation: string;
  detail: string;
  amount?: number;
}

export interface AppState {
  setupDone: boolean;
  manualSeen: boolean;
  establishment: Establishment;
  settings: Settings;
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  incomes: Income[];
  purchases: Purchase[];
  suppliers: Supplier[];
  customers: Customer[];
  employees: Employee[];
  tables: RestaurantTable[];
  cashMovements: CashMovement[];
  inventoryMovements: InventoryMovement[];
  dailyClosings: DailyClosing[];
  auditLogs: AuditLog[];
  cashOpen: boolean;
  cashOpenedAt?: string;
}
