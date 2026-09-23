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

export function getTransactions() {
  return apiFetch<{ transactions: Transaction[] }>("/api/transactions");
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
