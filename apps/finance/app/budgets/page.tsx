"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ApiError,
  createBudget,
  deleteBudget,
  getBudgets,
  getCategories,
  getMe,
  updateBudget,
  type BudgetMonth,
  type BudgetWithSpending,
  type Category,
} from "@/lib/api";
import AppNav from "@/app/components/AppNav";
import TemplatePlanner from "./TemplatePlanner";

const CURRENCY = "MYR";

// Sentinel for the "overall" option in the category picker (no category).
const OVERALL = "__overall__";

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-MY", { style: "currency", currency: CURRENCY }).format(amount);
}

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(month: string, delta: number) {
  const [year, m] = month.split("-").map(Number);
  const d = new Date(year, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonth(month: string) {
  const [year, m] = month.split("-").map(Number);
  return new Date(year, m - 1, 1).toLocaleDateString("en-MY", { month: "long", year: "numeric" });
}

// Share of the month already gone, so a budget can be compared with the
// spending pace you'd expect by today. 1 for past months, 0 for future ones.
function monthElapsed(month: string) {
  const [year, m] = month.split("-").map(Number);
  const start = new Date(year, m - 1, 1).getTime();
  const end = new Date(year, m, 1).getTime();
  const now = Date.now();
  if (now <= start) return 0;
  if (now >= end) return 1;
  return (now - start) / (end - start);
}

function budgetLabel(budget: { category: BudgetWithSpending["category"] }) {
  return budget.category ? budget.category.name : "Overall (all spending)";
}

function budgetIcon(budget: { category: BudgetWithSpending["category"] }) {
  return budget.category ? budget.category.icon ?? "📋" : "🎯";
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50";

const cardClass = "rounded-3xl border border-white/10 bg-white/5 p-5";

export default function BudgetsPage() {
  const router = useRouter();
  const [month, setMonth] = useState(currentMonth);
  const [data, setData] = useState<BudgetMonth | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  // null = not chosen yet: open by default while there are no budgets.
  const [showPlanner, setShowPlanner] = useState<boolean | null>(null);
  const [formCategory, setFormCategory] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(
    async (forMonth: string) => {
      try {
        const res = await getBudgets(forMonth);
        setData(res);
        setError(null);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          router.push("/login");
          return;
        }
        setError(err instanceof ApiError ? err.message : "Failed to load budgets");
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    async function init() {
      try {
        await getMe();
        const res = await getCategories();
        setCategories(res.categories.filter((c) => c.type === "EXPENSE"));
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          router.push("/login");
        }
      }
    }
    init();
  }, [router]);

  useEffect(() => {
    load(month);
  }, [load, month]);

  const budgets = useMemo(() => data?.budgets ?? [], [data]);
  const overall = budgets.find((b) => !b.category) ?? null;
  const categoryBudgets = budgets.filter((b) => b.category);

  const budgetedIds = new Set(categoryBudgets.map((b) => b.category!.id));
  const availableCategories = categories.filter((c) => !budgetedIds.has(c.id));

  const unbudgeted = (data?.spending ?? []).filter(
    (s) => !s.category || !budgetedIds.has(s.category.id)
  );
  const unbudgetedTotal = unbudgeted.reduce((sum, s) => sum + s.spent, 0);

  const totals = useMemo(() => {
    const spent = data?.totals.spent ?? 0;
    if (overall) {
      return { budgeted: overall.amount, left: overall.amount - spent };
    }
    const budgeted = categoryBudgets.reduce((sum, b) => sum + b.amount, 0);
    const spentInBudgets = categoryBudgets.reduce((sum, b) => sum + b.spent, 0);
    return { budgeted, left: budgeted - spentInBudgets };
  }, [data, overall, categoryBudgets]);

  const elapsed = monthElapsed(month);
  const plannerOpen = showPlanner ?? (data !== null && budgets.length === 0);

  function openForm(categoryId = "") {
    setFormCategory(categoryId);
    setFormAmount("");
    setFormError(null);
    setShowForm(true);
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!formCategory) {
      setFormError("Choose a category");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await createBudget(formCategory === OVERALL ? null : formCategory, formAmount);
      setShowForm(false);
      await load(month);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Failed to create budget");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white lg:px-8">
      <div className="mx-auto max-w-5xl">
        <AppNav />

        <div className="mb-8 mt-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">Budgets</h1>
            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 text-sm">
              <button
                onClick={() => setMonth((m) => shiftMonth(m, -1))}
                className="rounded-full px-3 py-1 text-slate-300 hover:bg-white/10 hover:text-white"
                aria-label="Previous month"
              >
                ‹
              </button>
              <span className="min-w-[8.5rem] text-center font-medium">{formatMonth(month)}</span>
              <button
                onClick={() => setMonth((m) => shiftMonth(m, 1))}
                className="rounded-full px-3 py-1 text-slate-300 hover:bg-white/10 hover:text-white"
                aria-label="Next month"
              >
                ›
              </button>
            </div>
            {month !== currentMonth() && (
              <button
                onClick={() => setMonth(currentMonth())}
                className="text-sm text-cyan-300 hover:text-cyan-200"
              >
                This month
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPlanner(!plannerOpen)}
              className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition ${
                plannerOpen ? "border-white bg-white text-slate-950" : "border-white/15 text-slate-100 hover:bg-white/10"
              }`}
            >
              ✨ Templates
            </button>
            <button
              onClick={() => (showForm ? setShowForm(false) : openForm())}
              className="rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
            >
              {showForm ? "Cancel" : "+ Add Budget"}
            </button>
          </div>
        </div>

        {plannerOpen && (
          <section className="mb-8 rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Budget templates</h2>
                <p className="text-sm text-slate-400">
                  Pick a rule of thumb. It&apos;s sized to your real income and spending, then turned into category budgets.
                </p>
              </div>
              <button onClick={() => setShowPlanner(false)} className="text-sm text-slate-400 hover:text-white">
                Close
              </button>
            </div>
            <TemplatePlanner categories={categories} onApplied={() => load(month)} />
          </section>
        )}

        {showForm && (
          <form
            onSubmit={handleCreate}
            className="mb-8 grid gap-4 rounded-[2rem] border border-white/10 bg-white/5 p-6 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          >
            <div>
              <label className="mb-1 block text-sm text-slate-300">Category</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className={inputClass}
              >
                <option value="" disabled>
                  Choose a category…
                </option>
                {!overall && <option value={OVERALL}>🎯 Overall (all spending)</option>}
                {availableCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon ? `${c.icon} ` : ""}
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-300">Monthly limit (RM)</label>
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                className={inputClass}
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 px-6 py-2.5 font-semibold text-slate-950 transition hover:scale-[1.02] disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Budget"}
            </button>
            {formError && <p className="text-sm text-rose-400 sm:col-span-3">{formError}</p>}
          </form>
        )}

        {loading && <p className="text-slate-400">Loading...</p>}
        {error && <p className="text-rose-400">{error}</p>}

        {!loading && !error && data && (
          <>
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className={cardClass}>
                <p className="text-xs uppercase tracking-wide text-slate-400">Income</p>
                <p className="mt-2 text-2xl font-semibold text-emerald-400">
                  {formatMoney(data.totals.income)}
                </p>
              </div>
              <div className={cardClass}>
                <p className="text-xs uppercase tracking-wide text-slate-400">Spent</p>
                <p className="mt-2 text-2xl font-semibold text-rose-400">
                  {formatMoney(data.totals.spent)}
                </p>
              </div>
              <div className={cardClass}>
                <p className="text-xs uppercase tracking-wide text-slate-400">Budgeted</p>
                <p className="mt-2 text-2xl font-semibold">{formatMoney(totals.budgeted)}</p>
              </div>
              <div className={cardClass}>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  {totals.left >= 0 ? "Left to spend" : "Over budget"}
                </p>
                <p
                  className={`mt-2 text-2xl font-semibold ${
                    totals.left >= 0 ? "text-cyan-300" : "text-rose-400"
                  }`}
                >
                  {formatMoney(Math.abs(totals.left))}
                </p>
              </div>
            </div>

            <section className="mb-8 rounded-[2rem] border border-white/10 bg-white/5">
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <h2 className="font-semibold">Your budgets</h2>
                {elapsed > 0 && elapsed < 1 && (
                  <p className="text-xs text-slate-400">
                    {Math.round(elapsed * 100)}% of the month gone · marker shows expected pace
                  </p>
                )}
              </div>
              {budgets.length === 0 ? (
                <p className="p-8 text-center text-slate-400">
                  No budgets yet. Add one, or set one from your spending below.
                </p>
              ) : (
                <ul className="divide-y divide-white/10">
                  {[...(overall ? [overall] : []), ...categoryBudgets].map((budget) => (
                    <BudgetRow
                      key={budget.id}
                      budget={budget}
                      elapsed={elapsed}
                      onChanged={() => load(month)}
                    />
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-white/5">
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <h2 className="font-semibold">Spending without a budget</h2>
                <p className="text-sm text-slate-400">{formatMoney(unbudgetedTotal)}</p>
              </div>
              {unbudgeted.length === 0 ? (
                <p className="p-8 text-center text-slate-400">
                  Every category you spent in this month has a budget.
                </p>
              ) : (
                <ul className="divide-y divide-white/10">
                  {unbudgeted.map((s) => (
                    <li
                      key={s.category?.id ?? "uncategorized"}
                      className="flex items-center justify-between gap-4 px-6 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{s.category?.icon ?? "❔"}</span>
                        <div>
                          <p className="font-medium">{s.category?.name ?? "Uncategorized"}</p>
                          <p className="text-xs text-slate-400">
                            {s.count} transaction{s.count === 1 ? "" : "s"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-semibold tabular-nums text-rose-400">{formatMoney(s.spent)}</p>
                        {s.category ? (
                          <button
                            onClick={() => openForm(s.category!.id)}
                            className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200 hover:bg-white/10"
                          >
                            Set budget
                          </button>
                        ) : (
                          <Link
                            href="/transactions"
                            className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200 hover:bg-white/10"
                          >
                            Categorize
                          </Link>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function BudgetRow({
  budget,
  elapsed,
  onChanged,
}: {
  budget: BudgetWithSpending;
  elapsed: number;
  onChanged: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(String(budget.amount));
  const [busy, setBusy] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);

  const ratio = budget.amount > 0 ? budget.spent / budget.amount : 0;
  const remaining = budget.amount - budget.spent;
  const barColor =
    ratio > 1 ? "bg-rose-500" : ratio > Math.max(elapsed, 0.8) ? "bg-amber-400" : "bg-emerald-400";

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setRowError(null);
    try {
      await updateBudget(budget.id, amount);
      setEditing(false);
      await onChanged();
    } catch (err) {
      setRowError(err instanceof ApiError ? err.message : "Failed to update budget");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete the ${budgetLabel(budget)} budget?`)) return;
    setBusy(true);
    setRowError(null);
    try {
      await deleteBudget(budget.id);
      await onChanged();
    } catch (err) {
      setRowError(err instanceof ApiError ? err.message : "Failed to delete budget");
      setBusy(false);
    }
  }

  return (
    <li className="px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xl">{budgetIcon(budget)}</span>
          <div>
            <p className="font-medium">{budgetLabel(budget)}</p>
            <p className="text-xs text-slate-400">
              {formatMoney(budget.spent)} of {formatMoney(budget.amount)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <p
            className={`text-sm font-semibold tabular-nums ${
              remaining >= 0 ? "text-slate-200" : "text-rose-400"
            }`}
          >
            {remaining >= 0 ? `${formatMoney(remaining)} left` : `${formatMoney(-remaining)} over`}
          </p>
          {editing ? (
            <form onSubmit={save} className="flex items-center gap-2">
              <input
                autoFocus
                required
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-28 rounded-xl border border-white/10 bg-slate-900 px-3 py-1.5 text-sm text-white outline-none focus:border-cyan-400"
                aria-label="Monthly limit"
              />
              <button
                type="submit"
                disabled={busy}
                className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-950 disabled:opacity-50"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setAmount(String(budget.amount));
                }}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </form>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                disabled={busy}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200 hover:bg-white/10"
              >
                Edit
              </button>
              <button
                onClick={remove}
                disabled={busy}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-rose-300 hover:bg-rose-500/10"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      <div className="relative mt-3 h-2.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${barColor} transition-all`}
          style={{ width: `${Math.min(ratio, 1) * 100}%` }}
        />
        {elapsed > 0 && elapsed < 1 && (
          <div
            className="absolute top-0 h-full w-0.5 bg-white/70"
            style={{ left: `${elapsed * 100}%` }}
            title="Expected spending by today"
          />
        )}
      </div>

      {rowError && <p className="mt-2 text-xs text-rose-400">{rowError}</p>}
    </li>
  );
}
