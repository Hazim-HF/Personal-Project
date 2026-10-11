"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ApiError,
  applyBudgets,
  getAccounts,
  getMe,
  getTransactions,
  type Account,
  type Category,
  type Transaction,
} from "@/lib/api";
import {
  BUCKETS,
  CATEGORY_BUCKET,
  classifyExpense,
  isLockedSavings,
  isOwnTransfer,
  isRefund,
  merchantName,
  monthKey,
  type Bucket,
} from "@/lib/finance";

// Validated (dark surface #0f1323) categorical slots 1-3; gray = unclassified.
const BUCKET_COLORS: Record<Bucket | "unclassified", string> = {
  needs: "#3987e5",
  wants: "#d95926",
  savings: "#199e70",
  unclassified: "#475569",
};

type Split = Record<Bucket, number>;

type Template = { id: string; name: string; tag: string; split: Split; blurb: string };

const TEMPLATES: Template[] = [
  {
    id: "50-30-20",
    name: "50 / 30 / 20",
    tag: "Balanced",
    split: { needs: 50, wants: 30, savings: 20 },
    blurb: "The classic rule: half on essentials, 30% on lifestyle, 20% saved.",
  },
  {
    id: "60-20-20",
    name: "60 / 20 / 20",
    tag: "High fixed costs",
    split: { needs: 60, wants: 20, savings: 20 },
    blurb: "When rent, transport and family commitments are heavy, trim wants, not savings.",
  },
  {
    id: "40-30-30",
    name: "40 / 30 / 30",
    tag: "Aggressive saver",
    split: { needs: 40, wants: 30, savings: 30 },
    blurb: "Low fixed costs? Push savings to 30% to fund big goals faster.",
  },
];

// Fallback weights inside a bucket when there's no spending history to go on.
const DEFAULT_WEIGHTS: Record<string, number> = {
  "Housing & Rent": 40,
  Groceries: 20,
  Transport: 20,
  Utilities: 10,
  Healthcare: 10,
  "Food & Dining": 40,
  Shopping: 20,
  Entertainment: 15,
  Subscriptions: 15,
  Other: 10,
  "Savings & Investments": 100,
};

function formatRM(value: number) {
  return new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" }).format(value);
}

function roundTo10(value: number) {
  return Math.max(Math.round(value / 10) * 10, 0);
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

type Row = { categoryId: string; name: string; icon: string | null; bucket: Bucket; amount: number; history: number; include: boolean };

export default function TemplatePlanner({
  categories,
  onApplied,
}: {
  categories: Category[];
  onApplied: () => Promise<void>;
}) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [ownerFirstName, setOwnerFirstName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [basisMonths, setBasisMonths] = useState(3);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [custom, setCustom] = useState<Split>({ needs: 50, wants: 30, savings: 20 });
  const [incomeInput, setIncomeInput] = useState<string | null>(null);
  const [rows, setRows] = useState<{ key: string; rows: Row[] } | null>(null);
  const [setOverall, setSetOverall] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applyMessage, setApplyMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [me, accountsRes, transactionsRes] = await Promise.all([
          getMe(),
          getAccounts(),
          getTransactions({ all: true }),
        ]);
        setOwnerFirstName(me.user.name.trim().split(/\s+/)[0]?.toUpperCase() ?? "");
        setAccounts(accountsRes.accounts);
        setTransactions(transactionsRes.transactions);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load your history");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // What your last N complete months actually looked like.
  const history = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: basisMonths }, (_, i) =>
      monthKey(new Date(now.getFullYear(), now.getMonth() - basisMonths + i, 1))
    );
    const inWindow = new Set(months);
    const cashAccounts = new Set(accounts.filter((a) => !isLockedSavings(a)).map((a) => a.id));

    const txs = transactions.filter(
      (tx) =>
        cashAccounts.has(tx.account.id) &&
        tx.type !== "TRANSFER" &&
        inWindow.has(monthKey(new Date(tx.date))) &&
        !isOwnTransfer(tx, ownerFirstName)
    );
    const incomes = txs.filter((tx) => tx.type === "INCOME" && !isRefund(tx));
    const expenses = txs.filter((tx) => tx.type === "EXPENSE");

    const salary = incomes
      .filter((tx) => tx.category?.name === "Salary")
      .reduce((s, tx) => s + Number(tx.amount), 0) / basisMonths;
    const income = incomes.reduce((s, tx) => s + Number(tx.amount), 0) / basisMonths;

    const bucketTotals: Record<Bucket | "unclassified", number> = { needs: 0, wants: 0, savings: 0, unclassified: 0 };
    const byCategory = new Map<string, number>(); // category -> monthly avg (default-bucket spend only)
    const wantsByMerchant = new Map<string, number>();
    const subscriptions = new Map<string, number>();
    let guessedCount = 0;

    for (const tx of expenses) {
      const amount = Number(tx.amount);
      const c = classifyExpense(tx);
      if (c.guessed && c.category) guessedCount += 1;
      bucketTotals[c.bucket ?? "unclassified"] += amount;
      if (c.category && c.bucket === CATEGORY_BUCKET[c.category]) {
        byCategory.set(c.category, (byCategory.get(c.category) ?? 0) + amount / basisMonths);
      }
      if (c.bucket === "wants") {
        const name = merchantName(tx, ownerFirstName);
        wantsByMerchant.set(name, (wantsByMerchant.get(name) ?? 0) + amount / basisMonths);
      }
      if (c.category === "Subscriptions") {
        const name = merchantName(tx, ownerFirstName);
        subscriptions.set(name, (subscriptions.get(name) ?? 0) + amount / basisMonths);
      }
    }
    const monthly = Object.fromEntries(
      Object.entries(bucketTotals).map(([k, v]) => [k, v / basisMonths])
    ) as Record<Bucket | "unclassified", number>;

    // Usual payday: the most common day of month salary lands.
    const paydays = new Map<number, number>();
    for (const tx of transactions) {
      if (tx.type === "INCOME" && tx.category?.name === "Salary" && cashAccounts.has(tx.account.id)) {
        const d = new Date(tx.date).getDate();
        paydays.set(d, (paydays.get(d) ?? 0) + 1);
      }
    }
    const payday = [...paydays.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    // Card instalment plans ("EP-BSC-G-LOWYAT-24 : 20/24"): latest progress per plan.
    const plans = new Map<string, { monthly: number; paid: number; total: number; date: Date }>();
    for (const tx of transactions) {
      const m = /^(EP-[^:]+?)[\s-]*:?\s*(\d+)\/(\d+)$/.exec(tx.merchant ?? "");
      if (!m) continue;
      const name = m[1].replace(/-\d+$/, "").replace(/^EP-/, "").trim();
      const date = new Date(tx.date);
      const prev = plans.get(name);
      if (!prev || date > prev.date) {
        plans.set(name, { monthly: Number(tx.amount), paid: Number(m[2]), total: Number(m[3]), date });
      }
    }

    return {
      months,
      salary,
      income,
      monthly,
      spent: monthly.needs + monthly.wants + monthly.savings + monthly.unclassified,
      byCategory,
      topWants: [...wantsByMerchant.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3),
      subscriptions: [...subscriptions.entries()].sort((a, b) => b[1] - a[1]),
      guessedCount,
      expenseCount: expenses.length,
      payday,
      plans: [...plans.entries()].filter(([, p]) => p.paid < p.total),
    };
  }, [accounts, transactions, basisMonths, ownerFirstName]);

  const income = incomeInput !== null ? Number(incomeInput) || 0 : roundTo10(history.salary || history.income);

  // Your actual split as a share of income ("savings" = whatever wasn't spent,
  // plus money moved into investments).
  const actual = useMemo(() => {
    const base = history.income || 1;
    const needs = history.monthly.needs / base;
    const wants = history.monthly.wants / base;
    const unclassified = history.monthly.unclassified / base;
    const saved = (history.income - history.monthly.needs - history.monthly.wants - history.monthly.unclassified) / base;
    return { needs, wants, unclassified, saved };
  }, [history]);

  const recommended = useMemo(() => {
    const needsPct = actual.needs * 100;
    const savedPct = actual.saved * 100;
    if (needsPct > 55) {
      return { id: "60-20-20", reason: `Needs already take ${needsPct.toFixed(0)}% of your income, so a 60% needs share is realistic. Trim wants to protect savings.` };
    }
    if (needsPct <= 40 && savedPct >= 20) {
      return { id: "40-30-30", reason: `Your needs are only ${needsPct.toFixed(0)}% and you already save ${savedPct.toFixed(0)}%, so you can aim for 30%.` };
    }
    return { id: "50-30-20", reason: `Needs are ${needsPct.toFixed(0)}% and you save ${Math.max(savedPct, 0).toFixed(0)}%, so the classic split fits you.` };
  }, [actual]);

  const activeId = templateId ?? recommended.id;
  const split: Split = activeId === "custom" ? custom : TEMPLATES.find((t) => t.id === activeId)!.split;
  const splitTotal = split.needs + split.wants + split.savings;
  const target: Split = useMemo(
    () => ({
      needs: (income * split.needs) / 100,
      wants: (income * split.wants) / 100,
      savings: (income * split.savings) / 100,
    }),
    [income, split.needs, split.wants, split.savings]
  );

  // Suggested category budgets. With history, each category gets what you
  // actually spend, scaled down only if the bucket's target is tighter - never
  // inflated, so a roomy target leaves an unallocated buffer instead of slack
  // budgets. Savings is a target, so it gets the full amount. Without history,
  // the target is shared out by default weights.
  const suggestedRows = useMemo<Row[]>(() => {
    const expenseCats = categories.filter((c) => c.type === "EXPENSE" && CATEGORY_BUCKET[c.name]);
    const out: Row[] = [];
    for (const bucket of ["needs", "wants", "savings"] as Bucket[]) {
      const cats = expenseCats.filter((c) => CATEGORY_BUCKET[c.name] === bucket);
      const hist = cats.map((c) => history.byCategory.get(c.name) ?? 0);
      const histTotal = hist.reduce((s, v) => s + v, 0);
      const useHistory = histTotal > 0 && bucket !== "savings";
      const weights = useHistory ? hist : cats.map((c) => DEFAULT_WEIGHTS[c.name] ?? 0);
      const weightTotal = weights.reduce((s, v) => s + v, 0) || 1;
      const pool = useHistory ? Math.min(target[bucket], histTotal) : target[bucket];
      cats.forEach((c, i) => {
        const amount = roundTo10((pool * weights[i]) / weightTotal);
        out.push({
          categoryId: c.id,
          name: c.name,
          icon: c.icon,
          bucket,
          amount,
          history: hist[i],
          include: amount > 0,
        });
      });
    }
    return out;
  }, [categories, history, target]);

  // Edits stick until the template, income or basis changes, then the
  // suggestion is recalculated.
  const suggestionKey = `${activeId}|${income}|${basisMonths}|${split.needs}/${split.wants}/${split.savings}`;
  const editableRows = rows && rows.key === suggestionKey ? rows.rows : suggestedRows;
  // The cap is the template's whole spending allowance, so it also covers the
  // unallocated buffer and anything uncategorized.
  const spendingCap = roundTo10(target.needs + target.wants);
  const buffer = (["needs", "wants"] as Bucket[]).map((bucket) => ({
    bucket,
    amount:
      target[bucket] -
      editableRows.filter((r) => r.include && r.bucket === bucket).reduce((s, r) => s + r.amount, 0),
  }));

  function updateRow(categoryId: string, patch: Partial<Row>) {
    setRows({ key: suggestionKey, rows: editableRows.map((r) => (r.categoryId === categoryId ? { ...r, ...patch } : r)) });
  }

  async function apply() {
    const chosen = editableRows.filter((r) => r.include && r.amount > 0);
    if (chosen.length === 0) {
      setApplyMessage({ ok: false, text: "Pick at least one category with an amount." });
      return;
    }
    setApplying(true);
    setApplyMessage(null);
    try {
      await applyBudgets([
        ...chosen.map((r) => ({ categoryId: r.categoryId, amount: r.amount })),
        ...(setOverall && spendingCap > 0 ? [{ categoryId: null, amount: spendingCap }] : []),
      ]);
      setApplyMessage({ ok: true, text: `Applied ${chosen.length + (setOverall ? 1 : 0)} budgets.` });
      await onApplied();
    } catch (err) {
      setApplyMessage({ ok: false, text: err instanceof ApiError ? err.message : "Failed to apply budgets" });
    } finally {
      setApplying(false);
    }
  }

  // Plain-language, data-driven suggestions, most important first.
  const suggestions = useMemo(() => {
    const out: string[] = [];
    const monthlySpend = history.spent;

    const emergency = accounts.find((a) => /emergency/i.test(a.name));
    if (emergency && monthlySpend > 0) {
      const balance = Number(emergency.balance);
      const goal = roundTo10(monthlySpend * 3);
      const covered = balance / monthlySpend;
      if (covered < 3) {
        const monthsToGoal = target.savings > 0 ? Math.ceil((goal - balance) / target.savings) : null;
        out.push(
          `Build your emergency fund first. "${emergency.name}" has ${formatRM(balance)}, which covers ${
            covered < 0.25 ? `only about ${Math.max(Math.round(covered * 30), 1)} day(s)` : `${covered.toFixed(1)} months`
          } of spending. Aim for 3 months (about ${formatRM(goal)}).` +
            (monthsToGoal ? ` Putting your full ${formatRM(target.savings)} savings there gets you there in about ${monthsToGoal} months. After that, move on to your other goals.` : "")
        );
      }
    }

    const wantsGap = history.monthly.wants - target.wants;
    if (wantsGap > 50) {
      const top = history.topWants.map(([name, v]) => `${name} (${formatRM(v)}/mo)`).join(", ");
      out.push(
        `Wants average ${formatRM(history.monthly.wants)}/month, ${formatRM(wantsGap)} over the ${split.wants}% target. Your biggest wants are ${top}.`
      );
    }

    const needsGap = history.monthly.needs - target.needs;
    if (needsGap > 50) {
      out.push(
        `Needs average ${formatRM(history.monthly.needs)}/month, ${formatRM(needsGap)} above ${split.needs}%. If they can't shrink, the 60/20/20 template is the honest fit.`
      );
    }

    const savedNow = history.income - (history.monthly.needs + history.monthly.wants + history.monthly.unclassified);
    if (savedNow < target.savings) {
      const gap = target.savings - Math.max(savedNow, 0);
      out.push(
        (savedNow < 0
          ? `You spent about ${formatRM(-savedNow)}/month more than you earned, so nothing was saved. To reach ${split.savings}%, you'd need to free up ${formatRM(gap + -savedNow)} a month.`
          : `You're keeping about ${formatRM(savedNow)}/month. To reach ${split.savings}%, set aside ${formatRM(gap)} more.`) +
          (history.payday
            ? ` Set up an auto-transfer of ${formatRM(target.savings)} on the ${ordinal(history.payday)}, right after your salary lands, so you save before you spend.`
            : "")
      );
    } else if (savedNow > 0) {
      out.push(`You're already keeping ${formatRM(savedNow)}/month, at or above the ${split.savings}% target. Automate it so it stays that way.`);
    }

    if (history.subscriptions.length) {
      const total = history.subscriptions.reduce((s, [, v]) => s + v, 0);
      out.push(
        `Subscriptions cost ${formatRM(total)}/month (${history.subscriptions.map(([n]) => n).join(", ")}). Cancel any you didn't use last month.`
      );
    }

    for (const [name, p] of history.plans) {
      const left = p.total - p.paid;
      out.push(
        `The ${name} instalment plan takes ${formatRM(p.monthly)}/month for ${left} more month${left === 1 ? "" : "s"}. Once it ends, move that ${formatRM(p.monthly)} into savings instead of spending it.`
      );
    }

    if (history.spent > 0 && history.monthly.unclassified / history.spent > 0.15) {
      out.push(
        `${formatRM(history.monthly.unclassified)}/month (${((history.monthly.unclassified / history.spent) * 100).toFixed(0)}% of spending) went to people by DuitNow and couldn't be classified. Categorize those on the Transactions page for a truer split.`
      );
    }
    return out;
  }, [accounts, history, target, split.needs, split.wants, split.savings]);

  if (loading) return <p className="text-sm text-slate-400">Analysing your spending…</p>;
  if (error) return <p className="text-sm text-rose-400">{error}</p>;

  const actualSegments = [
    { id: "needs", label: "Needs", value: actual.needs },
    { id: "wants", label: "Wants", value: actual.wants },
    { id: "unclassified", label: "Unclassified", value: actual.unclassified },
    { id: "savings", label: "Saved", value: Math.max(actual.saved, 0) },
  ] as const;
  const targetSegments = BUCKETS.map((b) => ({ id: b.id, label: b.label, value: split[b.id] / 100 }));

  return (
    <div className="space-y-6">
      {/* Templates */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[...TEMPLATES, { id: "custom", name: "Custom", tag: "Your own split", split: custom, blurb: "Set your own percentages." }].map((t) => {
          const active = activeId === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTemplateId(t.id)}
              className={`rounded-2xl border p-4 text-left transition ${
                active ? "border-cyan-400/60 bg-cyan-400/10" : "border-white/10 bg-slate-900/50 hover:border-white/20"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-lg font-semibold">{t.name}</p>
                {recommended.id === t.id && (
                  <span className="rounded-full bg-cyan-400/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-200">
                    For you
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-slate-300">{t.tag}</p>
              <p className="mt-2 text-xs text-slate-400">{t.blurb}</p>
            </button>
          );
        })}
      </div>
      <p className="-mt-3 text-sm text-slate-300">
        <span className="font-medium text-cyan-200">Why {TEMPLATES.find((t) => t.id === recommended.id)?.name}: </span>
        {recommended.reason}
      </p>

      {/* Inputs */}
      <div className="grid gap-4 rounded-2xl border border-white/10 bg-slate-900/40 p-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <label className="mb-1 block text-sm text-slate-300">Monthly income to budget</label>
          <input
            type="number"
            min="0"
            step="10"
            value={incomeInput ?? String(income)}
            onChange={(e) => setIncomeInput(e.target.value)}
            className="w-full max-w-xs rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50"
          />
          <p className="mt-1.5 text-xs text-slate-400">
            Average salary {formatRM(history.salary)} · average total income {formatRM(history.income)}
            <button onClick={() => setIncomeInput(String(roundTo10(history.salary)))} className="ml-2 text-cyan-300 hover:text-cyan-200">
              Use salary
            </button>
            <button onClick={() => setIncomeInput(String(roundTo10(history.income)))} className="ml-2 text-cyan-300 hover:text-cyan-200">
              Use total
            </button>
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-300">Based on</label>
          <select
            value={basisMonths}
            onChange={(e) => setBasisMonths(Number(e.target.value))}
            className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2.5 text-sm text-white outline-none"
          >
            <option value={3}>Last 3 months</option>
            <option value={6}>Last 6 months</option>
            <option value={12}>Last 12 months</option>
          </select>
        </div>
        {activeId === "custom" && (
          <div className="flex flex-wrap items-end gap-3 sm:col-span-2">
            {BUCKETS.map((b) => (
              <div key={b.id}>
                <label className="mb-1 block text-xs text-slate-300">{b.label} %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={custom[b.id]}
                  onChange={(e) => setCustom((c) => ({ ...c, [b.id]: Number(e.target.value) || 0 }))}
                  className="w-24 rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
                />
              </div>
            ))}
            <p className={`pb-2 text-xs ${splitTotal === 100 ? "text-slate-400" : "text-rose-400"}`}>
              Total {splitTotal}%{splitTotal !== 100 && ", should add up to 100%"}
            </p>
          </div>
        )}
      </div>

      {/* Target vs actual split */}
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-slate-300">
          {(["needs", "wants", "savings", "unclassified"] as const).map((id) => (
            <span key={id} className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: BUCKET_COLORS[id] }} />
              {id === "unclassified" ? "Unclassified" : BUCKETS.find((b) => b.id === id)!.label}
            </span>
          ))}
        </div>
        <SplitBar label={`Target (${split.needs}/${split.wants}/${split.savings})`} segments={targetSegments} />
        <SplitBar label={`You · avg of last ${basisMonths} months`} segments={[...actualSegments]} />
        {actual.saved < 0 && (
          <p className="mt-2 text-xs text-rose-300">
            You spent {(-actual.saved * 100).toFixed(0)}% more than you earned in this period.
          </p>
        )}
        <p className="mt-2 text-xs text-slate-500">
          {history.guessedCount} of {history.expenseCount} expenses were classified by guessing from the merchant name.
        </p>
      </div>

      {/* Bucket cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        {BUCKETS.map((b) => {
          const you = b.id === "savings" ? Math.max(history.income - history.spent + history.monthly.savings, 0) : history.monthly[b.id];
          const diff = you - target[b.id];
          const good = b.id === "savings" ? diff >= 0 : diff <= 0;
          return (
            <div key={b.id} className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: BUCKET_COLORS[b.id] }} />
                <p className="text-sm font-medium">
                  {b.label} · {split[b.id]}%
                </p>
              </div>
              <p className="mt-2 text-2xl font-semibold">{formatRM(target[b.id])}</p>
              <p className="text-xs text-slate-400">target per month</p>
              <p className={`mt-2 text-xs ${good ? "text-emerald-400" : "text-amber-300"}`}>
                {good ? "✓" : "!"} You: {formatRM(you)}/mo ({diff >= 0 ? "+" : "−"}
                {formatRM(Math.abs(diff))})
              </p>
              <p className="mt-1 text-[11px] text-slate-500">{b.hint}</p>
            </div>
          );
        })}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4">
          <h3 className="mb-2 font-semibold">Suggestions</h3>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-300">
            {suggestions.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Category budgets to apply */}
      <div>
        <h3 className="mb-1 font-semibold">Suggested category budgets</h3>
        <p className="mb-3 text-sm text-slate-400">
          Each bucket&apos;s target is shared out by how you actually spent in it. Adjust anything, then apply.
        </p>
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-slate-900/60 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-2 font-medium">Category</th>
                <th className="px-4 py-2 font-medium">Bucket</th>
                <th className="px-4 py-2 text-right font-medium">You spent / mo</th>
                <th className="px-4 py-2 text-right font-medium">Monthly budget</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {editableRows.map((r) => (
                <tr key={r.categoryId} className={r.include ? "" : "opacity-50"}>
                  <td className="px-4 py-2">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={r.include}
                        onChange={(e) => updateRow(r.categoryId, { include: e.target.checked })}
                        className="accent-cyan-400"
                      />
                      <span>
                        {r.icon ? `${r.icon} ` : ""}
                        {r.name}
                      </span>
                    </label>
                  </td>
                  <td className="px-4 py-2">
                    <span className="flex items-center gap-2 text-slate-300">
                      <span className="inline-block h-2 w-2 rounded-sm" style={{ background: BUCKET_COLORS[r.bucket] }} />
                      {BUCKETS.find((b) => b.id === r.bucket)!.label}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-400">{r.history > 0 ? formatRM(r.history) : "—"}</td>
                  <td className="px-4 py-2 text-right">
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={r.amount}
                      disabled={!r.include}
                      onChange={(e) => updateRow(r.categoryId, { amount: Number(e.target.value) || 0 })}
                      className="w-28 rounded-lg border border-white/10 bg-slate-900 px-2 py-1 text-right text-sm tabular-nums text-white outline-none focus:border-cyan-400"
                      aria-label={`${r.name} monthly budget`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={setOverall} onChange={(e) => setSetOverall(e.target.checked)} className="accent-cyan-400" />
            Also set an overall spending cap of <span className="font-semibold text-white">{formatRM(spendingCap)}</span> (needs + wants targets),
            which also covers uncategorized spending
          </label>
          <button
            onClick={apply}
            disabled={applying || (activeId === "custom" && splitTotal !== 100)}
            className="rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 px-6 py-2.5 font-semibold text-slate-950 transition hover:scale-[1.02] disabled:opacity-60"
          >
            {applying ? "Applying..." : "Apply these budgets"}
          </button>
        </div>
        {buffer.some((b) => b.amount >= 10) && (
          <p className="mt-2 text-xs text-slate-400">
            Left unallocated as a buffer for irregular costs and transfers to people:{" "}
            {buffer
              .filter((b) => b.amount >= 10)
              .map((b) => `${BUCKETS.find((x) => x.id === b.bucket)!.label} ${formatRM(b.amount)}`)
              .join(" · ")}
            . The overall cap still covers it.
          </p>
        )}
        <p className="mt-2 text-xs text-slate-500">Existing budgets for these categories are updated, not duplicated.</p>
        {applyMessage && (
          <p className={`mt-2 text-sm ${applyMessage.ok ? "text-emerald-400" : "text-rose-400"}`}>{applyMessage.text}</p>
        )}
      </div>
    </div>
  );
}

// A 100% stacked bar: segments separated by 2px surface gaps, labels only
// where they fit; the exact share is on hover and in the bucket cards.
function SplitBar({
  label,
  segments,
}: {
  label: string;
  segments: readonly { id: Bucket | "unclassified"; label: string; value: number }[];
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div className="mb-3">
      <p className="mb-1 text-xs text-slate-400">{label}</p>
      <div className="flex h-7 w-full gap-[2px] overflow-hidden rounded">
        {segments
          .filter((s) => s.value > 0)
          .map((s) => {
            const pct = (s.value / total) * 100;
            return (
              <div
                key={s.id}
                className="flex h-full items-center justify-center text-xs font-semibold text-white"
                style={{ width: `${pct}%`, background: BUCKET_COLORS[s.id] }}
                title={`${s.label}: ${(s.value * 100).toFixed(0)}% of income`}
              >
                {pct >= 9 ? `${(s.value * 100).toFixed(0)}%` : ""}
              </div>
            );
          })}
      </div>
    </div>
  );
}
