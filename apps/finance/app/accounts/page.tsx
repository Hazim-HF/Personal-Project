"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ApiError, createAccount, getAccounts, getMe, type Account, type AccountType } from "@/lib/api";
import AppNav from "@/app/components/AppNav";

const ACCOUNT_TYPES: AccountType[] = ["CHECKING", "SAVINGS", "CASH", "CREDIT_CARD", "INVESTMENT", "LOAN", "OTHER"];

// Money owed rather than held; subtracted from net worth.
const LIABILITY_TYPES: AccountType[] = ["CREDIT_CARD", "LOAN"];

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-MY", { style: "currency", currency }).format(amount);
}

function formatType(type: AccountType) {
  return type.replace("_", " ");
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50";

export default function AccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("SAVINGS");
  const [institution, setInstitution] = useState("");
  const [balance, setBalance] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        await getMe();
        const res = await getAccounts();
        setAccounts(res.accounts);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          router.push("/login");
          return;
        }
        setError(err instanceof ApiError ? err.message : "Failed to load accounts");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  const primaryCurrency = accounts[0]?.currency ?? "MYR";

  const totals = useMemo(() => {
    let assets = 0;
    let liabilities = 0;
    accounts.forEach((a) => {
      const value = Number(a.balance);
      if (LIABILITY_TYPES.includes(a.type)) liabilities += Math.abs(value);
      else assets += value;
    });
    return { assets, liabilities, net: assets - liabilities };
  }, [accounts]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSaving(true);

    try {
      const { account } = await createAccount({
        name,
        type,
        institution: institution || undefined,
        balance: balance || undefined,
      });
      setAccounts((prev) => [...prev, account]);
      setName("");
      setInstitution("");
      setBalance("");
      setShowForm(false);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Failed to create account");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white lg:px-8">
      <div className="mx-auto max-w-5xl">
        <AppNav />

        <div className="mb-8 mt-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold">Accounts</h1>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
          >
            {showForm ? "Cancel" : "+ Add Account"}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mb-8 grid gap-4 rounded-[2rem] border border-white/10 bg-white/5 p-6 sm:grid-cols-2"
          >
            <div>
              <label className="mb-1 block text-sm text-slate-300">Name</label>
              <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-300">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AccountType)}
                className={inputClass}
              >
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {formatType(t)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-300">Institution (optional)</label>
              <input value={institution} onChange={(e) => setInstitution(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-300">Opening balance</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className={inputClass}
              />
            </div>

            {formError && <p className="text-sm text-rose-400 sm:col-span-2">{formError}</p>}

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 px-6 py-3 font-semibold text-slate-950 shadow-xl shadow-cyan-500/20 transition hover:scale-[1.02] disabled:opacity-60"
              >
                {saving ? "Saving..." : "Create Account"}
              </button>
            </div>
          </form>
        )}

        {loading && <p className="text-slate-400">Loading...</p>}
        {error && <p className="text-rose-400">{error}</p>}

        {!loading && !error && (
          <>
            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-wide text-slate-400">Assets</p>
                <p className="mt-2 text-2xl font-semibold text-emerald-400">
                  {formatMoney(totals.assets, primaryCurrency)}
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-wide text-slate-400">Liabilities</p>
                <p className="mt-2 text-2xl font-semibold text-rose-400">
                  {formatMoney(totals.liabilities, primaryCurrency)}
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-wide text-slate-400">Net Worth</p>
                <p className="mt-2 text-2xl font-semibold">{formatMoney(totals.net, primaryCurrency)}</p>
              </div>
            </div>

            {accounts.length === 0 ? (
              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center text-slate-400">
                No accounts yet. Add your first one to get started.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {accounts.map((account) => (
                  <div key={account.id} className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
                    <p className="text-xs uppercase tracking-wide text-slate-400">{formatType(account.type)}</p>
                    <p className="mt-1 font-medium text-white">{account.name}</p>
                    {account.institution && <p className="text-sm text-slate-400">{account.institution}</p>}
                    <p
                      className={`mt-4 text-2xl font-semibold ${
                        LIABILITY_TYPES.includes(account.type) ? "text-rose-400" : "text-white"
                      }`}
                    >
                      {formatMoney(Number(account.balance), account.currency)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
