export default function VehicleMaintenanceTrackerMainPage() {
  const stats = [
    { label: "Active Vehicles", value: "3", change: "All in good health" },
    { label: "Upcoming Services", value: "2", change: "Next in 5 days" },
    { label: "Spent This Year", value: "RM 1,860", change: "-8% vs last year" },
  ];

  const features = [
    {
      title: "Full service history",
      desc: "Log oil changes, tire rotations, inspections, and repairs with dates, mileage, and receipts.",
    },
    {
      title: "Never miss a service",
      desc: "Get reminders based on mileage or time so brakes, fluids, and filters are always on schedule.",
    },
    {
      title: "Track true ownership cost",
      desc: "See what each vehicle really costs to maintain with spending breakdowns by category and month.",
    },
  ];

  const vehicles = [
    {
      name: "Honda Civic 2021",
      plate: "WXY 1234",
      mileage: "48,230 km",
      status: "Service due",
    },
    {
      name: "Yamaha NMAX",
      plate: "VBA 5521",
      mileage: "12,940 km",
      status: "Healthy",
    },
    {
      name: "Toyota Hilux 2019",
      plate: "PMJ 8890",
      mileage: "92,110 km",
      status: "Healthy",
    },
  ];

  const upcoming = [
    { task: "Engine oil & filter change", vehicle: "Honda Civic 2021", due: "In 5 days" },
    { task: "Brake pad inspection", vehicle: "Toyota Hilux 2019", due: "In 18 days" },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,146,60,0.18),transparent_30%),radial-gradient(circle_at_left,rgba(16,185,129,0.14),transparent_35%)]" />

        <div className="relative mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <header className="flex items-center justify-between rounded-full border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <a
                href="https://portfolio.hazimfitri.com"
                className="text-lg font-semibold tracking-wide text-white transition hover:text-amber-300"
              >
                Hazim<span className="text-fuchsia-400">.</span>
              </a>
              <div className="h-6 w-px bg-white/15" />
              <div>
                <p className="text-sm font-semibold tracking-wide text-white">AutoTrack</p>
                <p className="text-xs text-slate-400">Vehicle maintenance, simplified</p>
              </div>
            </div>

            <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
              <a href="#features" className="transition hover:text-white">Features</a>
              <a href="#overview" className="transition hover:text-white">Overview</a>
              <a href="#garage" className="transition hover:text-white">My Garage</a>
            </nav>

            <div className="flex items-center gap-3">
              <button className="hidden rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10 md:block">
                Sign In
              </button>
              <button className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]">
                Add a Vehicle
              </button>
            </div>
          </header>

          <div className="grid items-center gap-14 py-16 lg:grid-cols-2 lg:py-24">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-xs font-medium text-amber-300">
                Smarter vehicle maintenance management
              </div>

              <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                Keep every vehicle running, on schedule, and on budget.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                Log service history, track mileage, and get timely reminders for every car, bike, or truck in your garage — all in one dashboard.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <button className="rounded-2xl bg-gradient-to-r from-amber-400 to-emerald-500 px-6 py-3 font-semibold text-slate-950 shadow-xl shadow-amber-500/20 transition hover:scale-[1.02]">
                  Start Tracking Now
                </button>
                <button className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 font-medium text-white backdrop-blur transition hover:bg-white/10">
                  View Demo
                </button>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {stats.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md"
                  >
                    <p className="text-xs uppercase tracking-wide text-slate-400">{item.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
                    <p className="mt-1 text-sm text-emerald-400">{item.change}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative" id="overview">
              <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-amber-400/20 to-emerald-500/20 blur-2xl" />
              <div className="relative rounded-[2rem] border border-white/10 bg-white/8 p-5 shadow-2xl backdrop-blur-xl">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Dashboard Preview</p>
                    <h2 className="text-xl font-semibold text-white">Garage Overview</h2>
                  </div>
                  <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                    2 Due Soon
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3" id="garage">
                  {vehicles.map((vehicle) => (
                    <div
                      key={vehicle.plate}
                      className="rounded-3xl border border-white/10 bg-slate-900/70 p-4"
                    >
                      <p className="text-sm text-slate-400">{vehicle.plate}</p>
                      <p className="mt-3 text-lg font-semibold text-white">{vehicle.name}</p>
                      <p className="mt-1 text-sm text-slate-400">{vehicle.mileage}</p>
                      <p
                        className={`mt-2 text-xs font-medium ${
                          vehicle.status === "Service due" ? "text-amber-300" : "text-emerald-400"
                        }`}
                      >
                        {vehicle.status}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-400">Maintenance Spend</p>
                        <h3 className="text-lg font-semibold text-white">Last 6 Months</h3>
                      </div>
                      <span className="text-sm text-amber-300">Updated today</span>
                    </div>

                    <div className="flex h-48 items-end gap-3">
                      {[52, 30, 68, 41, 57, 35].map((height, i) => (
                        <div key={i} className="flex flex-1 flex-col items-center gap-2">
                          <div
                            className="w-full rounded-t-2xl bg-gradient-to-t from-amber-400 to-emerald-500"
                            style={{ height: `${height}%` }}
                          />
                          <span className="text-xs text-slate-500">
                            {['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'][i]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
                    <p className="text-sm text-slate-400">Upcoming Maintenance</p>
                    <h3 className="mt-1 text-lg font-semibold text-white">Due Soon</h3>

                    <div className="mt-5 space-y-3">
                      {upcoming.map((item) => (
                        <div
                          key={item.task}
                          className="rounded-2xl border border-white/10 bg-white/5 p-4"
                        >
                          <p className="text-sm font-medium text-white">{item.task}</p>
                          <p className="mt-1 text-xs text-slate-400">{item.vehicle}</p>
                          <p className="mt-2 text-xs font-medium text-amber-300">{item.due}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
        <div className="mb-12 max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-amber-300">Features</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Built for reliability, upkeep, and smarter ownership decisions.
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-md transition hover:-translate-y-1 hover:bg-white/7"
            >
              <div className="mb-5 h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-400/20 to-emerald-500/20" />
              <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
              <p className="mt-3 leading-7 text-slate-300">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
        <div className="rounded-[2rem] border border-white/10 bg-gradient-to-r from-white/8 to-white/5 p-8 backdrop-blur-xl lg:p-12">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-300">Start now</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Your vehicles deserve more than a glovebox full of receipts.
              </h2>
              <p className="mt-4 max-w-2xl text-slate-300">
                Build a complete, searchable service history for every vehicle and stay ahead of maintenance instead of reacting to breakdowns.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row lg:justify-end">
              <button className="rounded-2xl bg-white px-6 py-3 font-semibold text-slate-950 transition hover:scale-[1.02]">
                Create Account
              </button>
              <button className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 font-medium text-white transition hover:bg-white/10">
                Explore Features
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
