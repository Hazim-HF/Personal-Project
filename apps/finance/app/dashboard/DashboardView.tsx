"use client";

import { useMemo, useState } from "react";
import { type Account, type Transaction } from "@/lib/api";
import ExportMenu from "@/app/components/ExportMenu";
import {
  displayPayee,
  isLockedSavings,
  isOwnTransfer,
  isRefund,
  merchantName,
  monthKey,
  monthLabel,
  monthsBetween,
} from "@/lib/finance";
import {
  AreaLineChart,
  BarList,
  COLORS,
  ChartCard,
  ColumnChart,
  Legend,
  formatRM,
} from "./charts";

type Range = "6m" | "12m" | "ytd" | "all";

const RANGES: { id: Range; label: string }[] = [
  { id: "6m", label: "Last 6 months" },
  { id: "12m", label: "Last 12 months" },
  { id: "ytd", label: "This year" },
  { id: "all", label: "All time" },
];

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const SIZE_BINS = [
  { label: "< 10", max: 10 },
  { label: "10–25", max: 25 },
  { label: "25–50", max: 50 },
  { label: "50–100", max: 100 },
  { label: "100–250", max: 250 },
  { label: "250–500", max: 500 },
  { label: "500–1k", max: 1000 },
  { label: "1k+", max: Infinity },
];

function topN<T extends { label: string; value: number }>(items: T[], n: number) {
  const sorted = [...items].sort((a, b) => b.value - a.value);
  if (sorted.length <= n) return sorted;
  const rest = sorted.slice(n - 1);
  return [
    ...sorted.slice(0, n - 1),
    { label: `Other (${rest.length})`, value: rest.reduce((s, i) => s + i.value, 0) } as T,
  ];
}

function groupSum(txs: Transaction[], keyOf: (tx: Transaction) => string) {
  const map = new Map<string, { value: number; count: number }>();
  for (const tx of txs) {
    const key = keyOf(tx);
    const cur = map.get(key) ?? { value: 0, count: 0 };
    cur.value += Number(tx.amount);
    cur.count += 1;
    map.set(key, cur);
  }
  return [...map.entries()].map(([label, v]) => ({
    label,
    value: v.value,
    count: v.count,
    detail: `${v.count} transaction${v.count === 1 ? "" : "s"}`,
  }));
}

const tileClass = "rounded-3xl border border-white/10 bg-white/5 p-5";

export default function DashboardView({
  accounts,
  transactions,
  ownerName = "",
}: {
  accounts: Account[];
  transactions: Transaction[];
  // Used to spot transfers to your own accounts among payees.
  ownerName?: string;
}) {
  const ownerFirstName = ownerName.trim().split(/\s+/)[0]?.toUpperCase() ?? "";
  const [range, setRange] = useState<Range>("12m");
  const [includeLocked, setIncludeLocked] = useState(false);
  const [spendView, setSpendView] = useState<"merchant" | "category" | "account">("merchant");

  const analysis = useMemo(() => {
    const included = new Set(accounts.filter((a) => includeLocked || !isLockedSavings(a)).map((a) => a.id));
    const scoped = transactions.filter((tx) => included.has(tx.account.id));

    const nowKey = monthKey(new Date());
    const earliest = scoped.reduce((min, tx) => {
      const k = monthKey(new Date(tx.date));
      return k < min ? k : min;
    }, nowKey);
    const now = new Date();
    const startKey =
      range === "all"
        ? earliest
        : range === "ytd"
          ? `${now.getFullYear()}-01`
          : monthKey(new Date(now.getFullYear(), now.getMonth() - (range === "6m" ? 5 : 11), 1));
    const months = monthsBetween(startKey < earliest ? earliest : startKey, nowKey);
    const monthIndex = new Map(months.map((m, i) => [m, i]));

    const periodAll = scoped.filter((tx) => monthIndex.has(monthKey(new Date(tx.date))));
    // Money moved to/from your own accounts outside the tracker changes net
    // worth but is neither income nor spending.
    const ownTransfers = periodAll.filter((tx) => isOwnTransfer(tx, ownerFirstName));
    const inPeriod = periodAll.filter((tx) => !isOwnTransfer(tx, ownerFirstName));
    const expenses = inPeriod.filter((tx) => tx.type === "EXPENSE");
    // Refunds and reversals reduce spending rather than counting as income.
    const refunds = inPeriod.filter((tx) => tx.type === "INCOME" && isRefund(tx));
    const incomes = inPeriod.filter((tx) => tx.type === "INCOME" && !isRefund(tx));

    // Monthly income / spending (net of refunds) / net.
    const income = months.map(() => 0);
    const spending = months.map(() => 0);
    const slot = (tx: Transaction) => monthIndex.get(monthKey(new Date(tx.date)))!;
    for (const tx of incomes) income[slot(tx)] += Number(tx.amount);
    for (const tx of expenses) spending[slot(tx)] += Number(tx.amount);
    for (const tx of refunds) spending[slot(tx)] -= Number(tx.amount);
    const net = months.map((_, i) => income[i] - spending[i]);

    // Net worth at each month end, rebuilt backwards from today's balances by
    // undoing every transaction dated after that month.
    const balanceNow = accounts.filter((a) => included.has(a.id)).reduce((s, a) => s + Number(a.balance), 0);
    const effect = (tx: Transaction) => {
      const a = Number(tx.amount);
      if (tx.type === "INCOME") return included.has(tx.account.id) ? a : 0;
      if (tx.type === "EXPENSE") return included.has(tx.account.id) ? -a : 0;
      return (included.has(tx.account.id) ? -a : 0) + (tx.transferAccount && included.has(tx.transferAccount.id) ? a : 0);
    };
    const effectAfter = new Map<string, number>(); // per month key, effect of txs in that month
    for (const tx of transactions) {
      const k = monthKey(new Date(tx.date));
      effectAfter.set(k, (effectAfter.get(k) ?? 0) + effect(tx));
    }
    const futureKeys = [...effectAfter.keys()].sort();
    const netWorthAt = (keep: (k: string) => boolean) =>
      balanceNow - futureKeys.filter((k) => !keep(k)).reduce((s, k) => s + (effectAfter.get(k) ?? 0), 0);
    const netWorth = months.map((m) => netWorthAt((k) => k <= m));
    const netWorthAtStart = months.length ? netWorthAt((k) => k < months[0]) : balanceNow;

    const totalIncome = income.reduce((s, v) => s + v, 0);
    const totalSpending = spending.reduce((s, v) => s + v, 0);
    // Shares of spending are taken of gross purchases (before refunds).
    const grossSpending = expenses.reduce((s, tx) => s + Number(tx.amount), 0);

    // Breakdowns.
    const byMerchant = groupSum(expenses, (tx) => merchantName(tx, ownerFirstName));
    const byCategory = groupSum(expenses, (tx) => tx.category?.name ?? "Uncategorized");
    const byAccount = groupSum(expenses, (tx) => tx.account.name);
    const incomeBySource = groupSum(incomes, (tx) =>
      tx.category?.name === "Salary" && /kwsp|epf/i.test(tx.merchant ?? "") ? "Salary (KWSP contribution)" :
      tx.category?.name === "Salary" && /tabung haji/i.test(tx.description ?? "") ? "Salary (Tabung Haji)" :
      tx.category?.name ?? "Uncategorized"
    );

    const weekday = WEEKDAYS.map(() => 0);
    const weekdayCount = WEEKDAYS.map(() => 0);
    for (const tx of expenses) {
      const d = (new Date(tx.date).getDay() + 6) % 7; // Monday = 0
      weekday[d] += Number(tx.amount);
      weekdayCount[d] += 1;
    }

    const sizeCount = SIZE_BINS.map(() => 0);
    const sizeTotal = SIZE_BINS.map(() => 0);
    for (const tx of expenses) {
      const a = Number(tx.amount);
      const bin = SIZE_BINS.findIndex((b) => a < b.max);
      sizeCount[bin] += 1;
      sizeTotal[bin] += a;
    }

    const largest = [...expenses].sort((a, b) => Number(b.amount) - Number(a.amount)).slice(0, 8);

    const holdings = accounts
      .filter((a) => included.has(a.id) && Number(a.balance) > 0)
      .map((a) => ({ label: a.name, value: Number(a.balance) }));
    const owed = accounts
      .filter((a) => included.has(a.id) && Number(a.balance) < 0)
      .reduce((s, a) => s + Math.abs(Number(a.balance)), 0);

    // Plain-language findings.
    const insights: string[] = [];
    if (months.length && totalSpending > 0) {
      const peak = spending.indexOf(Math.max(...spending));
      insights.push(`Your highest-spending month was ${monthLabel(months[peak])} at ${formatRM(spending[peak])}.`);
    }
    const topMerchant = [...byMerchant].sort((a, b) => b.value - a.value)[0];
    if (topMerchant && grossSpending > 0) {
      insights.push(
        `${topMerchant.label} is your biggest spend: ${formatRM(topMerchant.value)} (${((topMerchant.value / grossSpending) * 100).toFixed(0)}% of spending) across ${topMerchant.count} transaction${topMerchant.count === 1 ? "" : "s"}.`
      );
    }
    const smallCount = sizeCount[0] + sizeCount[1];
    if (expenses.length > 0) {
      insights.push(
        `${((smallCount / expenses.length) * 100).toFixed(0)}% of your purchases are under RM25, but they add up to only ${formatRM(sizeTotal[0] + sizeTotal[1])}. Most money leaves in a few large payments.`
      );
    }
    const uncategorized = byCategory.find((c) => c.label === "Uncategorized");
    if (uncategorized && grossSpending > 0 && uncategorized.value / grossSpending > 0.2) {
      insights.push(
        `${((uncategorized.value / grossSpending) * 100).toFixed(0)}% of spending is uncategorized. Categorize it on the Transactions page to sharpen the category view and budgets.`
      );
    }
    const busiestDay = weekday.indexOf(Math.max(...weekday));
    if (totalSpending > 0) insights.push(`You spend the most on ${WEEKDAY_NAMES[busiestDay]}s.`);
    const ownOut = ownTransfers.filter((tx) => tx.type === "EXPENSE").reduce((s, tx) => s + Number(tx.amount), 0);
    const ownIn = ownTransfers.filter((tx) => tx.type === "INCOME").reduce((s, tx) => s + Number(tx.amount), 0);
    if (ownOut + ownIn > 0) {
      insights.push(
        `${formatRM(ownOut)} sent to and ${formatRM(ownIn)} received from your own accounts outside the tracker are left out of income and spending.`
      );
    }

    return {
      months,
      income,
      spending,
      net,
      netWorth,
      totals: {
        income: totalIncome,
        spending: totalSpending,
        net: totalIncome - totalSpending,
        rate: totalIncome > 0 ? (totalIncome - totalSpending) / totalIncome : 0,
        avgSpending: months.length ? totalSpending / months.length : 0,
        netWorthNow: balanceNow,
        netWorthChange: balanceNow - netWorthAtStart,
      },
      byMerchant,
      byCategory,
      byAccount,
      incomeBySource,
      weekday,
      weekdayCount,
      sizeCount,
      sizeTotal,
      largest,
      holdings,
      owed,
      insights,
      expenseCount: expenses.length,
    };
  }, [accounts, transactions, range, includeLocked, ownerFirstName]);

  const monthLabels = analysis.months.map(monthLabel);
  const spendItems =
    spendView === "merchant" ? analysis.byMerchant : spendView === "category" ? analysis.byCategory : analysis.byAccount;

  return (
    <>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">Exploring {transactions.length.toLocaleString()} transactions</p>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
        </div>
        <ExportMenu transactions={transactions} />
      </div>

      {/* One filter row; it scopes everything below. */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex rounded-full border border-white/10 bg-white/5 p-1 text-sm">
          {RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={`rounded-full px-4 py-1.5 transition ${
                range === r.id ? "bg-white font-medium text-slate-950" : "text-slate-300 hover:text-white"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <label className="flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={includeLocked}
            onChange={(e) => setIncludeLocked(e.target.checked)}
            className="accent-cyan-400"
          />
          Include KWSP &amp; Tabung Haji
        </label>
      </div>

      {/* KPI row */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className={tileClass}>
          <p className="text-xs uppercase tracking-wide text-slate-400">Net worth</p>
          <p className="mt-2 text-3xl font-semibold">{formatRM(analysis.totals.netWorthNow)}</p>
          <p className={`mt-1 text-xs ${analysis.totals.netWorthChange >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {analysis.totals.netWorthChange >= 0 ? "▲" : "▼"} {formatRM(Math.abs(analysis.totals.netWorthChange))} this period
          </p>
        </div>
        <div className={tileClass}>
          <p className="text-xs uppercase tracking-wide text-slate-400">Income</p>
          <p className="mt-2 text-2xl font-semibold">{formatRM(analysis.totals.income)}</p>
          <p className="mt-1 text-xs text-slate-400">
            {formatRM(analysis.months.length ? analysis.totals.income / analysis.months.length : 0)} / month avg
          </p>
        </div>
        <div className={tileClass}>
          <p className="text-xs uppercase tracking-wide text-slate-400">Spending</p>
          <p className="mt-2 text-2xl font-semibold">{formatRM(analysis.totals.spending)}</p>
          <p className="mt-1 text-xs text-slate-400">
            {formatRM(analysis.totals.avgSpending)} / month avg · {analysis.expenseCount} purchases
          </p>
        </div>
        <div className={tileClass}>
          <p className="text-xs uppercase tracking-wide text-slate-400">Savings rate</p>
          <p className="mt-2 text-2xl font-semibold">{(analysis.totals.rate * 100).toFixed(0)}%</p>
          <p className={`mt-1 text-xs ${analysis.totals.net >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {analysis.totals.net >= 0 ? "Saved " : "Overspent "}
            {formatRM(Math.abs(analysis.totals.net))}
          </p>
        </div>
      </div>

      {analysis.insights.length > 0 && (
        <section className="mt-6 rounded-[2rem] border border-cyan-400/20 bg-cyan-400/5 p-6">
          <h2 className="mb-3 font-semibold">What stands out</h2>
          <ul className="space-y-1.5 text-sm text-slate-300">
            {analysis.insights.map((line) => (
              <li key={line} className="flex gap-2">
                <span className="text-cyan-300">•</span>
                {line}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Net worth over time"
          subtitle="Balance across accounts at each month end, minus card debt"
          table={{
            columns: ["Month", "Net worth"],
            rows: analysis.months.map((m, i) => [monthLabel(m), formatRM(analysis.netWorth[i])]),
          }}
        >
          <AreaLineChart
            name="Net worth"
            points={analysis.months.map((m, i) => ({ label: monthLabel(m), value: analysis.netWorth[i] }))}
          />
        </ChartCard>

        <ChartCard
          title="Income vs spending"
          subtitle="Per month; transfers between your own accounts are excluded"
          legend={
            <Legend
              items={[
                { label: "Income", color: COLORS.series1 },
                { label: "Spending", color: COLORS.series2 },
              ]}
            />
          }
          table={{
            columns: ["Month", "Income", "Spending"],
            rows: analysis.months.map((m, i) => [monthLabel(m), formatRM(analysis.income[i]), formatRM(analysis.spending[i])]),
          }}
        >
          <ColumnChart
            categories={monthLabels}
            series={[
              { name: "Income", color: COLORS.series1, values: analysis.income },
              { name: "Spending", color: COLORS.series2, values: analysis.spending },
            ]}
          />
        </ChartCard>

        <ChartCard
          title="Monthly net cash flow"
          subtitle="Income minus spending: blue means you saved, red means you overspent"
          legend={
            <Legend
              items={[
                { label: "Saved", color: COLORS.positive },
                { label: "Overspent", color: COLORS.negative },
              ]}
            />
          }
          table={{
            columns: ["Month", "Net"],
            rows: analysis.months.map((m, i) => [monthLabel(m), formatRM(analysis.net[i])]),
          }}
        >
          <ColumnChart
            categories={monthLabels}
            series={[{ name: "Net", color: COLORS.positive, values: analysis.net }]}
            colorForValue={(v) => (v >= 0 ? COLORS.positive : COLORS.negative)}
            labelExtremes
          />
        </ChartCard>

        <ChartCard
          title="Where the money goes"
          subtitle={`Top spending by ${spendView}`}
          actions={
            <select
              value={spendView}
              onChange={(e) => setSpendView(e.target.value as typeof spendView)}
              className="rounded-full border border-white/10 bg-slate-900 px-3 py-1 text-xs text-slate-200 outline-none"
              aria-label="Group spending by"
            >
              <option value="merchant">By merchant</option>
              <option value="category">By category</option>
              <option value="account">By account</option>
            </select>
          }
          table={{
            columns: [spendView[0].toUpperCase() + spendView.slice(1), "Spent", "Transactions"],
            rows: [...spendItems].sort((a, b) => b.value - a.value).map((s) => [s.label, formatRM(s.value), s.count]),
          }}
        >
          <BarList items={topN(spendItems, 10)} />
        </ChartCard>

        <ChartCard
          title="Spending by day of week"
          subtitle="Total spent on each weekday"
          table={{
            columns: ["Day", "Spent", "Purchases"],
            rows: WEEKDAYS.map((d, i) => [d, formatRM(analysis.weekday[i]), analysis.weekdayCount[i]]),
          }}
        >
          <ColumnChart
            categories={WEEKDAYS}
            series={[{ name: "Spent", color: COLORS.series1, values: analysis.weekday }]}
            height={220}
            labelExtremes
          />
        </ChartCard>

        <ChartCard
          title="Purchase size distribution"
          subtitle="How many purchases fall in each amount range (RM)"
          table={{
            columns: ["Amount (RM)", "Purchases", "Total"],
            rows: SIZE_BINS.map((b, i) => [b.label, analysis.sizeCount[i], formatRM(analysis.sizeTotal[i])]),
          }}
        >
          <ColumnChart
            categories={SIZE_BINS.map((b) => b.label)}
            series={[{ name: "Purchases", color: COLORS.series1, values: analysis.sizeCount }]}
            height={220}
            format={(v) => `${v} purchase${v === 1 ? "" : "s"}`}
            axisFormat={(v) => v.toLocaleString()}
            labelExtremes
          />
        </ChartCard>

        <ChartCard
          title="Income sources"
          subtitle="Where your income came from this period"
          table={{
            columns: ["Source", "Income", "Transactions"],
            rows: [...analysis.incomeBySource].sort((a, b) => b.value - a.value).map((s) => [s.label, formatRM(s.value), s.count]),
          }}
        >
          <BarList items={topN(analysis.incomeBySource, 8)} />
        </ChartCard>

        <ChartCard
          title="Where your money sits"
          subtitle={`Positive balances by account${analysis.owed > 0 ? ` · ${formatRM(analysis.owed)} owed on cards` : ""}`}
          table={{
            columns: ["Account", "Balance"],
            rows: [...analysis.holdings].sort((a, b) => b.value - a.value).map((h) => [h.label, formatRM(h.value)]),
          }}
        >
          <BarList wideLabels items={[...analysis.holdings].sort((a, b) => b.value - a.value)} />
        </ChartCard>
      </div>

      <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/5 p-6">
        <h2 className="mb-4 font-semibold">Largest expenses this period</h2>
        {analysis.largest.length === 0 ? (
          <p className="text-sm text-slate-400">No expenses in this period.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="py-2 font-medium">Date</th>
                  <th className="py-2 font-medium">Merchant / description</th>
                  <th className="py-2 font-medium">Account</th>
                  <th className="py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {analysis.largest.map((tx) => (
                  <tr key={tx.id}>
                    <td className="py-2 text-slate-400">
                      {new Date(tx.date).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="py-2 text-slate-200">
                      {displayPayee(tx)}
                      {tx.description && displayPayee(tx) !== tx.description && (
                        <span className="block text-xs text-slate-400">{tx.description}</span>
                      )}
                    </td>
                    <td className="py-2 text-slate-300">{tx.account.name}</td>
                    <td className="py-2 text-right font-semibold tabular-nums">{formatRM(Number(tx.amount))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
