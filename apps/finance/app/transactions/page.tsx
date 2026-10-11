"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ApiError,
  getAccounts,
  getMe,
  getCategories,
  getTransactions,
  updateTransactionCategory,
  type Account,
  type Category,
  type Transaction,
} from "@/lib/api";
import AppNav from "@/app/components/AppNav";
import ExportMenu from "@/app/components/ExportMenu";

function formatMoney(amount: string, currency: string) {
  const value = Number(amount);
  return new Intl.NumberFormat("en-MY", { style: "currency", currency }).format(value);
}

const TYPE_LABELS: Record<Transaction["type"], string> = {
  INCOME: "Income",
  EXPENSE: "Expense",
  TRANSFER: "Transfer",
};

const selectClass =
  "rounded-xl border border-white/10 bg-slate-900 px-3 py-1.5 text-sm text-white outline-none focus:border-cyan-400 disabled:opacity-50";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
}

export default function TransactionsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null);

  async function changeCategory(tx: Transaction, categoryId: string | null) {
    setSavingId(tx.id);
    setRowError(null);
    try {
      const { transaction } = await updateTransactionCategory(tx.id, categoryId);
      setTransactions((prev) => prev.map((t) => (t.id === transaction.id ? transaction : t)));
    } catch (err) {
      setRowError({
        id: tx.id,
        message: err instanceof ApiError ? err.message : "Failed to update category",
      });
    } finally {
      setSavingId(null);
    }
  }

  useEffect(() => {
    async function load() {
      try {
        await getMe();
        const [accountsRes, transactionsRes, categoriesRes] = await Promise.all([
          getAccounts(),
          getTransactions(),
          getCategories(),
        ]);
        setAccounts(accountsRes.accounts);
        setTransactions(transactionsRes.transactions);
        setCategories(categoriesRes.categories);
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

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white lg:px-8">
      <div className="mx-auto max-w-5xl">
        <AppNav />

        <div className="mb-8 mt-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold">Transactions</h1>
          <div className="flex items-center gap-3">
            <ExportMenu transactions={transactions} />
            <Link
              href="/transactions/new"
              className="rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
            >
              + Add Transaction
            </Link>
          </div>
        </div>

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

            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5">
              {transactions.length === 0 ? (
                <p className="p-8 text-center text-slate-400">
                  No transactions yet. Add your first one to get started.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-400">
                      <tr>
                        <th className="px-6 py-3 text-right font-medium">Amount</th>
                        <th className="px-6 py-3 font-medium">Description</th>
                        <th className="px-6 py-3 font-medium">Type</th>
                        <th className="px-6 py-3 font-medium">Account</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {transactions.map((tx) => {
                        const primary = tx.description || tx.merchant || tx.category?.name || tx.type;
                        const secondary = tx.description && tx.merchant ? tx.merchant : null;
                        const saving = savingId === tx.id;

                        return (
                          <tr key={tx.id} className="align-top">
                            <td
                              className={`whitespace-nowrap px-6 py-4 text-right font-semibold tabular-nums ${
                                tx.type === "INCOME"
                                  ? "text-emerald-400"
                                  : tx.type === "EXPENSE"
                                    ? "text-rose-400"
                                    : "text-slate-200"
                              }`}
                            >
                              {tx.type === "EXPENSE" ? "-" : tx.type === "INCOME" ? "+" : ""}
                              {formatMoney(tx.amount, tx.currency)}
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-medium text-white">{primary}</p>
                              <p className="text-xs text-slate-400">
                                {secondary ? `${secondary} · ` : ""}
                                {formatDate(tx.date)}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="mb-1 text-xs uppercase tracking-wide text-slate-400">
                                {TYPE_LABELS[tx.type]}
                              </p>
                              {tx.type === "TRANSFER" ? (
                                <p className="text-slate-500">—</p>
                              ) : (
                                <select
                                  value={tx.category?.id ?? ""}
                                  disabled={saving}
                                  onChange={(e) => changeCategory(tx, e.target.value || null)}
                                  className={selectClass}
                                  aria-label="Category"
                                >
                                  <option value="">Uncategorized</option>
                                  {categories
                                    .filter((category) => category.type === tx.type)
                                    .map((category) => (
                                      <option key={category.id} value={category.id}>
                                        {category.icon ? `${category.icon} ` : ""}
                                        {category.name}
                                      </option>
                                    ))}
                                </select>
                              )}
                              {saving && <p className="mt-1 text-xs text-slate-400">Saving…</p>}
                              {rowError?.id === tx.id && (
                                <p className="mt-1 text-xs text-rose-400">{rowError.message}</p>
                              )}
                            </td>
                            <td className="px-6 py-4 text-slate-300">
                              {tx.account.name}
                              {tx.type === "TRANSFER" && tx.transferAccount && (
                                <span className="block text-xs text-slate-400">
                                  → {tx.transferAccount.name}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
