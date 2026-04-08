export default function FinanceTrackerMainPage() {
  const stats = [
    { label: "This Month Spending", value: "RM 2,480", change: "+12%" },
    { label: "Savings Goal", value: "RM 8,200", change: "82%" },
    { label: "Investments", value: "RM 15,340", change: "+6.4%" },
  ];

  const features = [
    {
      title: "Track every expense",
      desc: "Log daily spending, recurring bills, and subscriptions in one clean dashboard.",
    },
    {
      title: "See your cash flow",
      desc: "Understand income, spending patterns, and balance movement with simple visuals.",
    },
    {
      title: "Plan your future",
      desc: "Set savings goals, monitor progress, and stay disciplined with smarter budgeting.",
    },
  ];

  const quickCards = [
    {
      title: "Monthly Budget",
      value: "RM 4,500",
      sub: "RM 2,020 remaining",
    },
    {
      title: "Top Category",
      value: "Food & Dining",
      sub: "RM 740 this month",
    },
    {
      title: "Upcoming Bills",
      value: "4 bills",
      sub: "Next due in 2 days",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.18),transparent_30%),radial-gradient(circle_at_left,rgba(168,85,247,0.16),transparent_35%)]" />

        <div className="relative mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <header className="flex items-center justify-between rounded-full border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20">
                FT
              </div>
              <div>
                <p className="text-sm font-semibold tracking-wide text-white">Finance Tracker</p>
                <p className="text-xs text-slate-400">Personal wealth, simplified</p>
              </div>
            </div>

            <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
              <a href="#features" className="transition hover:text-white">Features</a>
              <a href="#overview" className="transition hover:text-white">Overview</a>
              <a href="#goals" className="transition hover:text-white">Goals</a>
            </nav>

            <div className="flex items-center gap-3">
              <button className="hidden rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10 md:block">
                Sign In
              </button>
              <button className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]">
                Get Started
              </button>
            </div>
          </header>

          <div className="grid items-center gap-14 py-16 lg:grid-cols-2 lg:py-24">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-medium text-cyan-300">
                Smarter personal finance management
              </div>

              <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                Take control of your money with a dashboard that feels effortless.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                Monitor spending, manage budgets, track savings, and build better financial habits with a modern all-in-one experience.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <button className="rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 px-6 py-3 font-semibold text-slate-950 shadow-xl shadow-cyan-500/20 transition hover:scale-[1.02]">
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
              <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-cyan-400/20 to-violet-500/20 blur-2xl" />
              <div className="relative rounded-[2rem] border border-white/10 bg-white/8 p-5 shadow-2xl backdrop-blur-xl">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Dashboard Preview</p>
                    <h2 className="text-xl font-semibold text-white">Your Financial Overview</h2>
                  </div>
                  <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                    On Track
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {quickCards.map((card) => (
                    <div
                      key={card.title}
                      className="rounded-3xl border border-white/10 bg-slate-900/70 p-4"
                    >
                      <p className="text-sm text-slate-400">{card.title}</p>
                      <p className="mt-3 text-2xl font-semibold text-white">{card.value}</p>
                      <p className="mt-1 text-sm text-slate-400">{card.sub}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-400">Spending Trend</p>
                        <h3 className="text-lg font-semibold text-white">Last 6 Months</h3>
                      </div>
                      <span className="text-sm text-cyan-300">Updated today</span>
                    </div>

                    <div className="flex h-48 items-end gap-3">
                      {[45, 62, 38, 74, 57, 83].map((height, i) => (
                        <div key={i} className="flex flex-1 flex-col items-center gap-2">
                          <div
                            className="w-full rounded-t-2xl bg-gradient-to-t from-cyan-400 to-violet-500"
                            style={{ height: `${height}%` }}
                          />
                          <span className="text-xs text-slate-500">
                            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][i]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5" id="goals">
                    <p className="text-sm text-slate-400">Savings Goal</p>
                    <h3 className="mt-1 text-lg font-semibold text-white">Emergency Fund</h3>

                    <div className="mt-6">
                      <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                        <span>RM 8,200 saved</span>
                        <span>82%</span>
                      </div>
                      <div className="h-3 w-full rounded-full bg-white/10">
                        <div className="h-3 w-[82%] rounded-full bg-gradient-to-r from-cyan-400 to-violet-500" />
                      </div>
                    </div>

                    <div className="mt-6 space-y-3">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-sm text-slate-400">Target</p>
                        <p className="text-xl font-semibold text-white">RM 10,000</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-sm text-slate-400">Estimated Completion</p>
                        <p className="text-xl font-semibold text-white">August 2026</p>
                      </div>
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
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-300">Features</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Built for clarity, discipline, and smarter financial decisions.
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-md transition hover:-translate-y-1 hover:bg-white/7"
            >
              <div className="mb-5 h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20" />
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
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-violet-300">Start now</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Your money deserves more than spreadsheets and guesswork.
              </h2>
              <p className="mt-4 max-w-2xl text-slate-300">
                Build confidence with a cleaner way to manage personal finances, from daily spending to long-term savings goals.
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
