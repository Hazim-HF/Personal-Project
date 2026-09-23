"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ApiError,
  getMe,
  getServiceRecords,
  getVehicles,
  type ServiceRecord,
  type Vehicle,
} from "@/lib/api";
import { categoryMeta, formatDate, formatMileage, formatMoney } from "@/lib/format";
import AppNav from "@/app/components/AppNav";

export default function ServicesPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        await getMe();
        const [vehiclesRes, recordsRes] = await Promise.all([getVehicles(), getServiceRecords()]);
        setVehicles(vehiclesRes.vehicles);
        setRecords(recordsRes.serviceRecords);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          router.push("/login");
          return;
        }
        setError(err instanceof ApiError ? err.message : "Failed to load service history");
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
          <h1 className="text-2xl font-semibold">Service History</h1>
          {vehicles.length > 0 && (
            <Link
              href="/services/new"
              className="rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
            >
              + Log Maintenance
            </Link>
          )}
        </div>

        {loading && <p className="text-slate-400">Loading...</p>}
        {error && <p className="text-rose-400">{error}</p>}

        {!loading && !error && (
          <>
            {vehicles.length > 0 && (
              <div className="mb-8 grid gap-4 sm:grid-cols-3">
                {vehicles.map((vehicle) => {
                  const spent = records
                    .filter((r) => r.vehicleId === vehicle.id)
                    .reduce((sum, r) => sum + Number(r.cost), 0);
                  return (
                    <div key={vehicle.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">{vehicle.name}</p>
                      <p className="mt-2 text-xl font-semibold">{formatMoney(spent)}</p>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="rounded-[2rem] border border-white/10 bg-white/5">
              {vehicles.length === 0 ? (
                <p className="p-8 text-center text-slate-400">
                  Add a vehicle first, then log its maintenance here.{" "}
                  <Link href="/vehicles/new" className="text-cyan-300 transition hover:text-cyan-200">
                    Add vehicle →
                  </Link>
                </p>
              ) : records.length === 0 ? (
                <p className="p-8 text-center text-slate-400">
                  No maintenance logged yet. Add the latest service done on your vehicle.
                </p>
              ) : (
                <ul className="divide-y divide-white/10">
                  {records.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-4 px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{categoryMeta(r.category).icon}</span>
                        <div>
                          <p className="font-medium text-white">{r.title}</p>
                          <p className="text-sm text-slate-400">
                            {r.vehicle.name} · {formatMileage(r.mileage)} · {formatDate(r.date)}
                            {r.workshop && ` · ${r.workshop}`}
                          </p>
                        </div>
                      </div>
                      <p className="text-lg font-semibold text-rose-400">-{formatMoney(Number(r.cost))}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
