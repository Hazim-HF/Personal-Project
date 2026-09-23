"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ApiError,
  createServiceRecord,
  getMe,
  getVehicles,
  type ServiceCategory,
  type Vehicle,
} from "@/lib/api";
import { SERVICE_CATEGORIES, formatMileage } from "@/lib/format";
import AppNav from "@/app/components/AppNav";

const TODAY = new Date().toISOString().slice(0, 10);

const inputClass =
  "w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50";

export default function NewServiceRecordPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [vehicleId, setVehicleId] = useState("");
  const [category, setCategory] = useState<ServiceCategory>("OIL_CHANGE");
  const [title, setTitle] = useState(SERVICE_CATEGORIES[0].label);
  const [date, setDate] = useState(TODAY);
  const [mileage, setMileage] = useState("");
  const [cost, setCost] = useState("");
  const [workshop, setWorkshop] = useState("");
  const [notes, setNotes] = useState("");
  const [nextDueDate, setNextDueDate] = useState("");
  const [nextDueMileage, setNextDueMileage] = useState("");

  useEffect(() => {
    async function load() {
      try {
        await getMe();
        const res = await getVehicles();
        setVehicles(res.vehicles);
        if (res.vehicles.length > 0) {
          setVehicleId(res.vehicles[0].id);
          setMileage(String(res.vehicles[0].mileage || ""));
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          router.push("/login");
          return;
        }
        setError(err instanceof ApiError ? err.message : "Failed to load vehicles");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  const selectedVehicle = vehicles.find((v) => v.id === vehicleId);

  function handleVehicleChange(id: string) {
    setVehicleId(id);
    const vehicle = vehicles.find((v) => v.id === id);
    setMileage(vehicle?.mileage ? String(vehicle.mileage) : "");
  }

  function handleCategoryChange(value: ServiceCategory) {
    // Pre-fill the title with the category name unless the user typed their own.
    const isDefaultTitle = !title || SERVICE_CATEGORIES.some((c) => c.label === title);
    setCategory(value);
    if (isDefaultTitle) setTitle(SERVICE_CATEGORIES.find((c) => c.value === value)?.label ?? "");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await createServiceRecord({
        vehicleId,
        category,
        title: title || SERVICE_CATEGORIES.find((c) => c.value === category)!.label,
        date,
        mileage,
        cost: cost || undefined,
        workshop: workshop || undefined,
        notes: notes || undefined,
        nextDueDate: nextDueDate || undefined,
        nextDueMileage: nextDueMileage || undefined,
      });
      router.push("/services");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save maintenance");
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white lg:px-8">
      <div className="mx-auto max-w-xl">
        <AppNav />

        <Link href="/services" className="mt-8 inline-block text-sm text-slate-400 transition hover:text-white">
          ← Back to service history
        </Link>
        <h1 className="mb-8 mt-1 text-2xl font-semibold">Log Maintenance</h1>

        {loading && <p className="text-slate-400">Loading...</p>}

        {!loading && vehicles.length === 0 && !error && (
          <p className="rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-300">
            You need a vehicle before logging maintenance.{" "}
            <Link href="/vehicles/new" className="text-cyan-300 transition hover:text-cyan-200">
              Add a vehicle →
            </Link>
          </p>
        )}

        {!loading && vehicles.length > 0 && (
          <form onSubmit={handleSubmit} className="space-y-5 rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <div>
              <label className="mb-1 block text-sm text-slate-300">Vehicle</label>
              <select value={vehicleId} onChange={(e) => handleVehicleChange(e.target.value)} className={inputClass}>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                    {v.plateNumber ? ` (${v.plateNumber})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">Type of maintenance</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {SERVICE_CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => handleCategoryChange(c.value)}
                    className={`rounded-2xl border px-3 py-2.5 text-sm font-medium transition ${
                      category === c.value
                        ? "border-transparent bg-white text-slate-950"
                        : "border-white/10 bg-slate-900/70 text-slate-300 hover:text-white"
                    }`}
                  >
                    <span className="mr-1">{c.icon}</span>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-300">What was done</label>
              <input
                required
                placeholder="e.g. Engine oil & filter change"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-slate-300">Date</label>
                <input
                  type="date"
                  required
                  max={TODAY}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-300">Mileage (km)</label>
                <input
                  type="number"
                  required
                  min={0}
                  step={1}
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                  className={inputClass}
                />
                {selectedVehicle && selectedVehicle.mileage > 0 && (
                  <p className="mt-1 text-xs text-slate-400">Last recorded: {formatMileage(selectedVehicle.mileage)}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-300">Cost (MYR)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-300">Workshop</label>
                <input
                  placeholder="Optional"
                  value={workshop}
                  onChange={(e) => setWorkshop(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-300">Notes</label>
              <textarea
                rows={3}
                placeholder="Parts used, observations, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-sm font-medium text-white">Next service reminder</p>
              <p className="mb-3 text-xs text-slate-400">Optional — whichever comes first.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm text-slate-300">Due date</label>
                  <input
                    type="date"
                    min={date}
                    value={nextDueDate}
                    onChange={(e) => setNextDueDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-300">Due mileage (km)</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    placeholder={mileage ? String(Number(mileage) + 5000) : ""}
                    value={nextDueMileage}
                    onChange={(e) => setNextDueMileage(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-rose-400">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 px-6 py-3 font-semibold text-slate-950 shadow-xl shadow-cyan-500/20 transition hover:scale-[1.02] disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Save Maintenance"}
            </button>
          </form>
        )}

        {error && vehicles.length === 0 && <p className="text-rose-400">{error}</p>}
      </div>
    </main>
  );
}
