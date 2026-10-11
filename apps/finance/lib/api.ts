const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(body.message || "Something went wrong", res.status);
  }

  return body as T;
}

export type Role = "USER" | "ADMIN";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type AccountType =
  | "CHECKING"
  | "SAVINGS"
  | "CASH"
  | "CREDIT_CARD"
  | "INVESTMENT"
  | "LOAN"
  | "OTHER";

export type Account = {
  id: string;
  name: string;
  type: AccountType;
  institution: string | null;
  currency: string;
  balance: string;
};

export type CategoryType = "INCOME" | "EXPENSE";

export type Category = {
  id: string;
  name: string;
  type: CategoryType;
  icon: string | null;
  color: string | null;
};

export type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER";

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: string;
  currency: string;
  description: string | null;
  merchant: string | null;
  date: string;
  account: { id: string; name: string; type: AccountType; currency: string };
  transferAccount: { id: string; name: string; type: AccountType } | null;
  category: { id: string; name: string; type: CategoryType; icon: string | null; color: string | null } | null;
};

export function getMe() {
  return apiFetch<{ user: User }>("/api/me");
}

export function login(email: string, password: string) {
  return apiFetch<{ user: User }>("/api/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function register(name: string, email: string, password: string) {
  return apiFetch<{ user: User }>("/api/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export function forgotPassword(email: string) {
  return apiFetch<{ message: string }>("/api/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(token: string, password: string) {
  return apiFetch<{ message: string }>("/api/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}

export function logout() {
  return apiFetch<{ message: string }>("/api/logout", { method: "POST" });
}

export function getAccounts() {
  return apiFetch<{ accounts: Account[] }>("/api/accounts");
}

export type NewAccountInput = {
  name: string;
  type: AccountType;
  institution?: string;
  currency?: string;
  balance?: string;
};

export function createAccount(input: NewAccountInput) {
  return apiFetch<{ account: Account }>("/api/accounts", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getCategories() {
  return apiFetch<{ categories: Category[] }>("/api/categories");
}

export function getTransactions(options: { all?: boolean } = {}) {
  return apiFetch<{ transactions: Transaction[] }>(
    options.all ? "/api/transactions?limit=all" : "/api/transactions"
  );
}

export type NewTransactionInput = {
  accountId: string;
  categoryId?: string;
  transferAccountId?: string;
  type: TransactionType;
  amount: string;
  description?: string;
  merchant?: string;
  date: string;
};

export function createTransaction(input: NewTransactionInput) {
  return apiFetch<{ transaction: Transaction }>("/api/transactions", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export type BudgetCategory = { id: string; name: string; icon: string | null; color: string | null };

export type Budget = {
  id: string;
  amount: number;
  // null = overall budget across all spending
  category: BudgetCategory | null;
};

export type BudgetWithSpending = Budget & { spent: number };

export type BudgetMonth = {
  month: string;
  budgets: BudgetWithSpending[];
  spending: { category: BudgetCategory | null; spent: number; count: number }[];
  totals: { spent: number; income: number };
};

export function getBudgets(month: string) {
  return apiFetch<BudgetMonth>(`/api/budgets?month=${encodeURIComponent(month)}`);
}

export function createBudget(categoryId: string | null, amount: string) {
  return apiFetch<{ budget: Budget }>("/api/budgets", {
    method: "POST",
    body: JSON.stringify({ categoryId, amount }),
  });
}

export function applyBudgets(budgets: { categoryId: string | null; amount: number }[]) {
  return apiFetch<{ budgets: Budget[] }>("/api/budgets", {
    method: "PUT",
    body: JSON.stringify({ budgets }),
  });
}

export function updateBudget(id: string, amount: string) {
  return apiFetch<{ budget: Budget }>(`/api/budgets/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ amount }),
  });
}

export function deleteBudget(id: string) {
  return apiFetch<{ message: string }>(`/api/budgets/${id}`, { method: "DELETE" });
}

export function updateTransactionCategory(id: string, categoryId: string | null) {
  return apiFetch<{ transaction: Transaction }>(`/api/transactions/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ categoryId }),
  });
}
