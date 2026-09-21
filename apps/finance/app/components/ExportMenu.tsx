"use client";

import { useEffect, useRef, useState } from "react";
import type { Transaction } from "@/lib/api";
import { downloadTransactions } from "@/lib/export";

export default function ExportMenu({ transactions }: { transactions: Transaction[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleExport(format: "xlsx" | "csv") {
    downloadTransactions(transactions, format);
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={transactions.length === 0}
        className="rounded-full border border-white/10 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Export ▾
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-44 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-xl">
          <button
            type="button"
            onClick={() => handleExport("xlsx")}
            className="block w-full px-4 py-2.5 text-left text-sm text-slate-200 transition hover:bg-white/10"
          >
            Export as .xlsx
          </button>
          <button
            type="button"
            onClick={() => handleExport("csv")}
            className="block w-full px-4 py-2.5 text-left text-sm text-slate-200 transition hover:bg-white/10"
          >
            Export as .csv
          </button>
        </div>
      )}
    </div>
  );
}
