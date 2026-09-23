"use client";

import { useEffect, useMemo, useState } from "react";
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
import {
  categoryMeta,
  describeDue,
  formatDate,
  formatMileage,
  formatMoney,
  upcomingReminders,
  vehicleTypeLabel,
} from "@/lib/format";
import AppNav from "@/app/components/AppNav";

export default function DashboardPage() {
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
        setError(err instanceof ApiError ? err.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  const reminders = useMemo(() => upcomingReminders(records, vehicles), [records, vehicles]);
  const dueSoonCount = reminders.filter((r) => r.dueSoon).length;

  const spentThisYear = useMemo(() => {
    const year = new Date().getFullYear();
    return records
      .filter((r) => new Date(r.date).getFullYear() === year)
      .reduce((sum, r) => sum + Number(r.cost), 0);
  }, [records]);

  const totalMileage = vehicles.reduce((sum, v) => sum + v.mileage, 0);

  const latestByVehicle = useMemo(() => {
    const map = new Map<string, ServiceRecord>();
    // records arrive newest-first, so the first one seen per vehicle is the latest
    records.forEach((r) => {
      if (!map.has(r.vehicleId)) map.set(r.vehicleId, r);
    });
    return map;
  }, [records]);

  const recentRecords = records.slice(0, 6);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white lg:px-8">
      <div className="mx-auto max-w-6xl">
        <AppNav />

        {loading && <p className="mt-8 text-slate-400">Loading...</p>}
        {error && <p className="mt-8 text-rose-400">{error}</p>}

        {!loading && !error && (
          <>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-400">Overview</p>
                <h1 className="text-2xl font-semibold">Dashboard</h1>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/vehicles/new"
                  className="rounded-full border border-white/10 px-5 py-2.5 text-sm text-slate-200 transition hover:bg-white/10"
                >
                  + Add Vehicle
                </Link>
                {vehicles.length > 0 && (
                  <Link
                    href="/services/new"
                    className="rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
                  >
                    + Log Maintenance
                  </Link>
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-wide text-slate-400">Active Vehicles</p>
                <p className="mt-2 text-2xl font-semibold">{vehicles.length}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-wide text-slate-400">Due Soon</p>
                <p className={`mt-2 text-2xl font-semibold ${dueSoonCount > 0 ? "text-amber-300" : ""}`}>
                  {dueSoonCount}
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-wide text-slate-400">Spent This Year</p>
                <p className="mt-2 text-2xl font-semibold text-rose-400">{formatMoney(spentThisYear)}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-wide text-slate-400">Total Mileage</p>
                <p className="mt-2 text-2xl font-semibold">{formatMileage(totalMileage)}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
                <h2 className="mb-4 text-lg font-semibold">My Garage</h2>
                {vehicles.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 text-center">
                    <p className="text-sm text-slate-400">No vehicles yet.</p>
                    <Link
                      href="/vehicles/new"
                      className="mt-4 inline-block rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
                    >
                      Add your first vehicle
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {vehicles.map((vehicle) => {
                      const latest = latestByVehicle.get(vehicle.id);
                      return (
                        <div key={vehicle.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                          <p className="text-xs uppercase tracking-wide text-slate-400">
                            {vehicleTypeLabel(vehicle.type)}
                            {vehicle.plateNumber && ` · ${vehicle.plateNumber}`}
                          </p>
                          <p className="mt-1 text-sm font-medium text-white">{vehicle.name}</p>
                          <p className="mt-2 text-lg font-semibold">{formatMileage(vehicle.mileage)}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            {latest
                              ? `Last: ${latest.title} · ${formatDate(latest.date)}`
                              : "No maintenance logged yet"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
                  <h2 className="mb-4 text-lg font-semibold">Upcoming Maintenance</h2>
                  {reminders.length === 0 ? (
                    <p className="text-sm text-slate-400">
                      Nothing scheduled. Add a next-due date or mileage when you log maintenance.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {reminders.map((reminder) => (
                        <div
                          key={reminder.record.id}
                          className="rounded-2xl border border-white/10 bg-slate-900/70 p-4"
                        >
                          <p className="text-sm font-medium text-white">
                            {categoryMeta(reminder.record.category).label}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">{reminder.vehicle.name}</p>
                          <p
                            className={`mt-2 text-xs font-medium ${
                              reminder.overdue
                                ? "text-rose-400"
                                : reminder.dueSoon
                                  ? "text-amber-300"
                                  : "text-emerald-400"
                            }`}
                          >
                            {describeDue(reminder)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Recent Services</h2>
                    <Link href="/services" className="text-sm text-cyan-300 transition hover:text-cyan-200">
                      View all →
                    </Link>
                  </div>
                  {recentRecords.length === 0 ? (
                    <p className="text-sm text-slate-400">No maintenance logged yet.</p>
                  ) : (
                    <ul className="divide-y divide-white/10">
                      {recentRecords.map((r) => (
                        <li key={r.id} className="flex items-center justify-between gap-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-white">{r.title}</p>
                            <p className="text-xs text-slate-400">
                              {r.vehicle.name} · {formatDate(r.date)}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-rose-400">-{formatMoney(Number(r.cost))}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
