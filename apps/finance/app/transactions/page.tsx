"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ApiError,
  getAccounts,
  getMe,
  getTransactions,
  logout,
  type Account,
  type Transaction,
} from "@/lib/api";

function formatMoney(amount: string, currency: string) {
  const value = Number(amount);
  return new Intl.NumberFormat("en-MY", { style: "currency", currency }).format(value);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
}

export default function TransactionsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        await getMe();
        const [accountsRes, transactionsRes] = await Promise.all([getAccounts(), getTransactions()]);
        setAccounts(accountsRes.accounts);
        setTransactions(transactionsRes.transactions);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          router.push("/login");
          return;
        }
        setError(err instanceof ApiError ? err.message : "Failed to load transactions");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/" className="text-sm text-slate-400 transition hover:text-white">
              ← Finance Tracker
            </Link>
            <h1 className="mt-1 text-2xl font-semibold">Transactions</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/transactions/new"
              className="rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
            >
              + Add Transaction
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-full border border-white/10 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/10"
            >
              Sign Out
            </button>
          </div>
        </header>

        {loading && <p className="text-slate-400">Loading...</p>}
        {error && <p className="text-rose-400">{error}</p>}

        {!loading && !error && (
          <>
            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              {accounts.map((account) => (
                <div key={account.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">{account.name}</p>
                  <p className="mt-2 text-xl font-semibold">
                    {formatMoney(account.balance, account.currency)}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5">
              {transactions.length === 0 ? (
                <p className="p-8 text-center text-slate-400">
                  No transactions yet. Add your first one to get started.
                </p>
              ) : (
                <ul className="divide-y divide-white/10">
                  {transactions.map((tx) => (
                    <li key={tx.id} className="flex items-center justify-between gap-4 px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{tx.category?.icon ?? "💳"}</span>
                        <div>
                          <p className="font-medium text-white">
                            {tx.description || tx.category?.name || tx.type}
                          </p>
                          <p className="text-sm text-slate-400">
                            {tx.account.name}
                            {tx.type === "TRANSFER" && tx.transferAccount
                              ? ` → ${tx.transferAccount.name}`
                              : ""}
                            {" · "}
                            {formatDate(tx.date)}
                          </p>
                        </div>
                      </div>
                      <p
                        className={`text-lg font-semibold ${
                          tx.type === "INCOME"
                            ? "text-emerald-400"
                            : tx.type === "EXPENSE"
                              ? "text-rose-400"
                              : "text-slate-200"
                        }`}
                      >
                        {tx.type === "EXPENSE" ? "-" : tx.type === "INCOME" ? "+" : ""}
                        {formatMoney(tx.amount, tx.currency)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
