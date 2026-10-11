"use client";

import { useEffect, useState } from "react";
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
import DashboardView from "./DashboardView";

export default function DashboardPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [ownerName, setOwnerName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const { user } = await getMe();
        setOwnerName(user.name);
        const [accountsRes, transactionsRes] = await Promise.all([
          getAccounts(),
          getTransactions({ all: true }),
        ]);
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

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white lg:px-8">
      <div className="mx-auto max-w-6xl">
        <AppNav />

        {loading && <p className="mt-8 text-slate-400">Loading...</p>}
        {error && <p className="mt-8 text-rose-400">{error}</p>}

        {!loading && !error && <DashboardView accounts={accounts} transactions={transactions} ownerName={ownerName} />}
      </div>
    </main>
  );
}
