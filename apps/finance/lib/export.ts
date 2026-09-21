import * as XLSX from "xlsx";
import type { Transaction } from "./api";

function toRows(transactions: Transaction[]) {
  return transactions.map((tx) => ({
    Date: tx.date.slice(0, 10),
    Type: tx.type,
    Description: tx.description ?? "",
    Merchant: tx.merchant ?? "",
    Category: tx.category?.name ?? "",
    Account: tx.account.name,
    "Transfer Account": tx.transferAccount?.name ?? "",
    Amount: Number(tx.amount),
    Currency: tx.currency,
  }));
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export type ExportFormat = "xlsx" | "csv";

export function downloadTransactions(transactions: Transaction[], format: ExportFormat) {
  const worksheet = XLSX.utils.json_to_sheet(toRows(transactions));
  const stamp = new Date().toISOString().slice(0, 10);

  if (format === "csv") {
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    triggerDownload(new Blob([csv], { type: "text/csv;charset=utf-8;" }), `transactions-${stamp}.csv`);
    return;
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
  XLSX.writeFile(workbook, `transactions-${stamp}.xlsx`);
}
