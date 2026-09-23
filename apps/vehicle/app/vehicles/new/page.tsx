"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError, createVehicle, getMe, type VehicleType } from "@/lib/api";
import { VEHICLE_TYPES } from "@/lib/format";
import AppNav from "@/app/components/AppNav";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50";

export default function NewVehiclePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<VehicleType>("CAR");
  const [name, setName] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [mileage, setMileage] = useState("");

  useEffect(() => {
    getMe().catch((err) => {
      if (err instanceof ApiError && err.status === 401) router.push("/login");
    });
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await createVehicle({
        name,
        type,
        make: make || undefined,
        model: model || undefined,
        year: year || undefined,
        plateNumber: plateNumber || undefined,
        mileage: mileage || undefined,
      });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to add vehicle");
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white lg:px-8">
      <div className="mx-auto max-w-xl">
        <AppNav />

        <Link href="/dashboard" className="mt-8 inline-block text-sm text-slate-400 transition hover:text-white">
          ← Back to dashboard
        </Link>
        <h1 className="mb-8 mt-1 text-2xl font-semibold">Add Vehicle</h1>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap gap-2 rounded-full border border-white/10 bg-slate-900/70 p-1 text-sm">
            {VEHICLE_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`flex-1 rounded-full px-3 py-2 font-medium transition ${
                  type === t.value ? "bg-white text-slate-950" : "text-slate-300 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-300">Nickname</label>
            <input
              required
              placeholder="e.g. Honda Civic 2021"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-slate-300">Make</label>
              <input placeholder="Honda" value={make} onChange={(e) => setMake(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-300">Model</label>
              <input placeholder="Civic" value={model} onChange={(e) => setModel(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-300">Year</label>
              <input
                type="number"
                min={1900}
                max={2100}
                placeholder="2021"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-300">Plate number</label>
              <input
                placeholder="WXY 1234"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                className={`${inputClass} uppercase`}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-300">Current mileage (km)</label>
            <input
              type="number"
              min={0}
              step={1}
              placeholder="48230"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              className={inputClass}
            />
          </div>

          {error && <p className="text-sm text-rose-400">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 px-6 py-3 font-semibold text-slate-950 shadow-xl shadow-cyan-500/20 transition hover:scale-[1.02] disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Add Vehicle"}
          </button>
        </form>
      </div>
    </main>
  );
}
