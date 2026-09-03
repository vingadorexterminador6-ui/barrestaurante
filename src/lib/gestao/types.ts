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
  logo?: string | undefined;
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
  supplierId?: string | undefined;
  photo?: string | undefined;
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
  customerId?: string | undefined;
  employeeId?: string | undefined;
  tableId?: string | undefined;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  note?: string | undefined;
  employeeId?: string | undefined;
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
  supplierId?: string | undefined;
  supplierName: string;
  items: PurchaseItem[];
  total: number;
  paymentMethod: string;
  note?: string | undefined;
}

export interface Supplier {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  products: string;
  note?: string | undefined;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  note?: string | undefined;
}

export interface CustomerAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  phone: string;
  salary: number;
  hiredAt: string;
  active: boolean;
  note?: string | undefined;
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
  paymentMethod?: string | undefined;
  refId?: string | undefined;
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

export type ClosingPeriod = "semanal" | "mensal";

export interface PeriodClosing {
  id: string;
  period: ClosingPeriod;
  date: string;
  startDate: string;
  endDate: string;
  label: string;
  salesTotal: number;
  otherIncome: number;
  expensesTotal: number;
  purchasesTotal: number;
  inflowsTotal: number;
  outflowsTotal: number;
  result: number;
  salesCount: number;
}

export type AssetCondition = "novo" | "bom" | "usado" | "avariado" | "abatido";

export interface Asset {
  id: string;
  name: string;
  code: string;
  category: string;
  location: string;
  qty: number;
  value: number;
  acquiredAt: string;
  condition: AssetCondition;
  supplierId?: string | undefined;
  responsibleId?: string | undefined;
  note?: string | undefined;
}

export interface AuditLog {
  id: string;
  date: string;
  operation: string;
  detail: string;
  amount?: number | undefined;
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
  customerAccounts: CustomerAccount[];
  employees: Employee[];
  tables: RestaurantTable[];
  cashMovements: CashMovement[];
  inventoryMovements: InventoryMovement[];
  dailyClosings: DailyClosing[];
  periodClosings: PeriodClosing[];
  assets: Asset[];
  auditLogs: AuditLog[];
  orders: CustomerOrder[];
  reservations: Reservation[];
  cashOpen: boolean;
  cashOpenedAt?: string | undefined;
}

export type OrderChannel = "mesa" | "takeaway";
export type OrderStatus = "novo" | "aceite" | "pronto" | "entregue" | "cancelado";
export type PaymentStatus = "pendente" | "declarado" | "pago";

export interface CustomerOrder {
  id: string;
  code: string;
  date: string;
  customerName: string;
  phone: string;
  channel: OrderChannel;
  tableId?: string | undefined;
  tableName?: string | undefined;
  items: SaleItem[];
  total: number;
  note?: string | undefined;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string | undefined;
  paymentRef?: string | undefined;
  prepaidAmount?: number | undefined;
  saleId?: string | undefined;
  accountId?: string | undefined;
  stockApplied?: boolean | undefined;
}

export type ReservationStatus = "pendente" | "confirmada" | "recusada" | "concluida";

export interface Reservation {
  id: string;
  code: string;
  createdAt: string;
  customerName: string;
  phone: string;
  email?: string | undefined;
  date: string;
  time: string;
  people: number;
  area?: string | undefined;
  note?: string | undefined;
  tableId?: string | undefined;
  tableName?: string | undefined;
  status: ReservationStatus;
}
