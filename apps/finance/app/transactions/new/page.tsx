"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ApiError,
  createTransaction,
  getAccounts,
  getCategories,
  getMe,
  type Account,
  type Category,
  type TransactionType,
} from "@/lib/api";
import AppNav from "@/app/components/AppNav";

const TODAY = new Date().toISOString().slice(0, 10);

export default function NewTransactionPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<TransactionType>("EXPENSE");
  const [accountId, setAccountId] = useState("");
  const [transferAccountId, setTransferAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(TODAY);

  useEffect(() => {
    async function load() {
      try {
        await getMe();
        const [accountsRes, categoriesRes] = await Promise.all([getAccounts(), getCategories()]);
        setAccounts(accountsRes.accounts);
        setCategories(categoriesRes.categories);
        if (accountsRes.accounts.length > 0) {
          setAccountId(accountsRes.accounts[0].id);
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          router.push("/login");
          return;
        }
        setError(err instanceof ApiError ? err.message : "Failed to load form data");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  const visibleCategories = categories.filter((c) => c.type === (type === "INCOME" ? "INCOME" : "EXPENSE"));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await createTransaction({
        accountId,
        transferAccountId: type === "TRANSFER" ? transferAccountId : undefined,
        categoryId: categoryId || undefined,
        type,
        amount,
        description: description || undefined,
        date,
      });
      router.push("/transactions");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to add transaction");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white lg:px-8">
      <div className="mx-auto max-w-xl">
        <AppNav />

        <Link
          href="/transactions"
          className="mt-8 inline-block text-sm text-slate-400 transition hover:text-white"
        >
          ← Back to transactions
        </Link>
        <h1 className="mb-8 mt-1 text-2xl font-semibold">Add Transaction</h1>

        {loading && <p className="text-slate-400">Loading...</p>}

        {!loading && accounts.length === 0 && (
          <p className="rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-300">
            You don&apos;t have any accounts yet. Please contact support - every new user should get a
            default Cash account automatically.
          </p>
        )}

        {!loading && accounts.length > 0 && (
          <form onSubmit={handleSubmit} className="space-y-5 rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <div className="flex gap-2 rounded-full border border-white/10 bg-slate-900/70 p-1 text-sm">
              {(["EXPENSE", "INCOME", "TRANSFER"] as TransactionType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setType(t);
                    setCategoryId("");
                  }}
                  className={`flex-1 rounded-full px-4 py-2 font-medium capitalize transition ${
                    type === t ? "bg-white text-slate-950" : "text-slate-300 hover:text-white"
                  }`}
                >
                  {t.toLowerCase()}
                </button>
              ))}
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-300">Amount (MYR)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-300">
                {type === "TRANSFER" ? "From account" : "Account"}
              </label>
              <select
                required
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50"
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>

            {type === "TRANSFER" && (
              <div>
                <label className="mb-1 block text-sm text-slate-300">To account</label>
                <select
                  required
                  value={transferAccountId}
                  onChange={(e) => setTransferAccountId(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50"
                >
                  <option value="">Select account</option>
                  {accounts
                    .filter((a) => a.id !== accountId)
                    .map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {type !== "TRANSFER" && (
              <div>
                <label className="mb-1 block text-sm text-slate-300">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50"
                >
                  <option value="">No category</option>
                  {visibleCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.icon ? `${category.icon} ` : ""}
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm text-slate-300">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50"
                placeholder="e.g. Lunch with team"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-300">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50"
              />
            </div>

            {error && <p className="text-sm text-rose-400">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 px-6 py-3 font-semibold text-slate-950 shadow-xl shadow-cyan-500/20 transition hover:scale-[1.02] disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Save Transaction"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
