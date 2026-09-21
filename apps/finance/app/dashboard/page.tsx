"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ApiError,
  getAccounts,
  getMe,
  getTransactions,
  type Account,
  type Transaction,
} from "@/lib/api";
import AppNav from "@/app/components/AppNav";
import ExportMenu from "@/app/components/ExportMenu";

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-MY", { style: "currency", currency }).format(amount);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
}

export default function DashboardPage() {
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
        setError(err instanceof ApiError ? err.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  const primaryCurrency = accounts[0]?.currency ?? "MYR";

  const totalBalance = useMemo(
    () => accounts.reduce((sum, a) => sum + Number(a.balance), 0),
    [accounts]
  );

  const monthStats = useMemo(() => {
    const now = new Date();
    const monthTx = transactions.filter((tx) => {
      const d = new Date(tx.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const income = monthTx.filter((t) => t.type === "INCOME").reduce((s, t) => s + Number(t.amount), 0);
    const expense = monthTx.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0);
    return { income, expense, net: income - expense };
  }, [transactions]);

  const categoryBreakdown = useMemo(() => {
    const totals = new Map<string, number>();
    transactions
      .filter((t) => t.type === "EXPENSE")
      .forEach((t) => {
        const key = t.category?.name ?? "Uncategorized";
        totals.set(key, (totals.get(key) ?? 0) + Number(t.amount));
      });
    const entries = Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const max = entries[0]?.[1] ?? 0;
    return entries.map(([name, value]) => ({ name, value, pct: max > 0 ? (value / max) * 100 : 0 }));
  }, [transactions]);

  const recentTransactions = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 6),
    [transactions]
  );

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white lg:px-8">
      <div className="mx-auto max-w-6xl">
        <AppNav />

        {loading && <p className="mt-8 text-slate-400">Loading...</p>}
        {error && <p className="mt-8 text-rose-400">{error}</p>}

        {!loading && !error && (
          <>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-400">Overview</p>
                <h1 className="text-2xl font-semibold">Dashboard</h1>
              </div>
              <ExportMenu transactions={transactions} />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-wide text-slate-400">Total Balance</p>
                <p className="mt-2 text-2xl font-semibold">{formatMoney(totalBalance, primaryCurrency)}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-wide text-slate-400">Income This Month</p>
                <p className="mt-2 text-2xl font-semibold text-emerald-400">
                  {formatMoney(monthStats.income, primaryCurrency)}
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-wide text-slate-400">Expenses This Month</p>
                <p className="mt-2 text-2xl font-semibold text-rose-400">
                  {formatMoney(monthStats.expense, primaryCurrency)}
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-wide text-slate-400">Net This Month</p>
                <p
                  className={`mt-2 text-2xl font-semibold ${
                    monthStats.net >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {formatMoney(monthStats.net, primaryCurrency)}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
                <h2 className="mb-4 text-lg font-semibold">Accounts</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {accounts.map((account) => (
                    <div key={account.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        {account.type.replace("_", " ")}
                      </p>
                      <p className="mt-1 text-sm font-medium text-white">{account.name}</p>
                      <p className="mt-2 text-lg font-semibold">
                        {formatMoney(Number(account.balance), account.currency)}
                      </p>
                    </div>
                  ))}
                  {accounts.length === 0 && <p className="text-sm text-slate-400">No accounts yet.</p>}
                </div>

                <div className="mt-6">
                  <h3 className="mb-3 text-sm font-medium text-slate-300">Top Spending Categories</h3>
                  {categoryBreakdown.length === 0 ? (
                    <p className="text-sm text-slate-400">No expenses recorded yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {categoryBreakdown.map((cat) => (
                        <div key={cat.name}>
                          <div className="mb-1 flex items-center justify-between text-sm">
                            <span className="text-slate-300">{cat.name}</span>
                            <span className="text-slate-400">{formatMoney(cat.value, primaryCurrency)}</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-white/10">
                            <div
                              className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500"
                              style={{ width: `${Math.max(cat.pct, 4)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Recent Transactions</h2>
                  <Link href="/transactions" className="text-sm text-cyan-300 transition hover:text-cyan-200">
                    View all →
                  </Link>
                </div>
                {recentTransactions.length === 0 ? (
                  <p className="text-sm text-slate-400">No transactions yet.</p>
                ) : (
                  <ul className="divide-y divide-white/10">
                    {recentTransactions.map((tx) => (
                      <li key={tx.id} className="flex items-center justify-between gap-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-white">
                            {tx.description || tx.category?.name || tx.type}
                          </p>
                          <p className="text-xs text-slate-400">{formatDate(tx.date)}</p>
                        </div>
                        <p
                          className={`text-sm font-semibold ${
                            tx.type === "INCOME"
                              ? "text-emerald-400"
                              : tx.type === "EXPENSE"
                                ? "text-rose-400"
                                : "text-slate-200"
                          }`}
                        >
                          {tx.type === "EXPENSE" ? "-" : tx.type === "INCOME" ? "+" : ""}
                          {formatMoney(Number(tx.amount), tx.currency)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
