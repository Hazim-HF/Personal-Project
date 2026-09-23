export default function HomePage() {
  const stats = [
    { label: "Focus", value: "Business Intelligence", change: "Data-driven decisions" },
    { label: "Specialty", value: "Process Automation", change: "Power Platform" },
    { label: "Live Apps", value: "3", change: "Built & shipped" },
  ];

  const highlights = [
    { title: "Experience", value: "Data + Enterprise", sub: "Analytics & SAP systems" },
    { title: "Approach", value: "Strategic", sub: "Clean, modern, scalable" },
    { title: "Status", value: "Open", sub: "Freelance & collaborations" },
  ];

  const skillLevels = [
    { name: "Data Analytics", pct: 90 },
    { name: "Power Platform", pct: 85 },
    { name: "Next.js / TypeScript", pct: 75 },
    { name: "SAP", pct: 70 },
  ];

  const work = [
    {
      title: "Finance Tracker",
      desc: "A modern personal finance product focused on clarity, budgeting, and user experience.",
    },
    {
      title: "Enterprise Automation",
      desc: "Workflow and approval systems using Power Platform to improve operational efficiency.",
    },
    {
      title: "Analytics Dashboard",
      desc: "Business intelligence solutions that turn raw data into clear decisions.",
    },
  ];

  const apps = [
    {
      title: "Finance Tracker",
      desc: "Track spending, budgets, and savings goals in one clean dashboard.",
      href: "https://finance.hazimfitri.com",
      gradient: "from-cyan-400 to-violet-500",
    },
    {
      title: "E-Invitation",
      desc: "Beautiful digital invitations for events, shared with a single link.",
      href: "https://wedding.hazimfitri.com",
      gradient: "from-pink-400 to-fuchsia-500",
    },
    {
      title: "Vehicle Tracker",
      desc: "Log service history, mileage, and maintenance reminders for every vehicle.",
      href: "https://vehicle.hazimfitri.com",
      gradient: "from-cyan-400 to-violet-500",
    },
  ];

  const skills = [
    "Next.js",
    "TypeScript",
    "Python",
    "SQL",
    "Power BI",
    "Power Apps",
    "Power Automate",
    "SAP",
    "Data Analytics",
    "UI/UX Thinking",
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.18),transparent_30%),radial-gradient(circle_at_left,rgba(168,85,247,0.16),transparent_35%)]" />

        <div className="relative mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <header className="flex items-center justify-between rounded-full border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <a href="#" className="text-lg font-semibold tracking-wide text-white transition hover:text-cyan-300">
                Hazim<span className="text-fuchsia-400">.</span>
              </a>
              <div className="h-6 w-px bg-white/15" />
              <div>
                <p className="text-sm font-semibold tracking-wide text-white">Portfolio</p>
                <p className="text-xs text-slate-400">Data • Tech • Business</p>
              </div>
            </div>

            <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
              <a href="#about" className="transition hover:text-white">About</a>
              <a href="#work" className="transition hover:text-white">Work</a>
              <a href="#apps" className="transition hover:text-white">Apps</a>
              <a href="#skills" className="transition hover:text-white">Skills</a>
            </nav>

            <a
              href="#contact"
              className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
            >
              Let&apos;s Talk
            </a>
          </header>

          <div className="grid items-center gap-14 py-16 lg:grid-cols-2 lg:py-24">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-medium text-cyan-300">
                Data • Tech • Business
              </div>

              <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                Building digital solutions with{" "}
                <span className="bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent">
                  clarity, data, and design.
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                I create modern products, analytics solutions, and business-driven systems that connect technology with real operational value.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <a
                  href="#work"
                  className="rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 px-6 py-3 text-center font-semibold text-slate-950 shadow-xl shadow-cyan-500/20 transition hover:scale-[1.02]"
                >
                  View My Work
                </a>
                <a
                  href="#contact"
                  className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-center font-medium text-white backdrop-blur transition hover:bg-white/10"
                >
                  Contact Me
                </a>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {stats.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md"
                  >
                    <p className="text-xs uppercase tracking-wide text-slate-400">{item.label}</p>
                    <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
                    <p className="mt-1 text-sm text-emerald-400">{item.change}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-cyan-400/20 to-violet-500/20 blur-2xl" />
              <div className="relative rounded-[2rem] border border-white/10 bg-white/8 p-5 shadow-2xl backdrop-blur-xl">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Personal Brand</p>
                    <h2 className="text-xl font-semibold text-white">Portfolio Dashboard</h2>
                  </div>
                  <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                    Available
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {highlights.map((card) => (
                    <div key={card.title} className="rounded-3xl border border-white/10 bg-slate-900/70 p-4">
                      <p className="text-sm text-slate-400">{card.title}</p>
                      <p className="mt-3 text-xl font-semibold text-white">{card.value}</p>
                      <p className="mt-1 text-sm text-slate-400">{card.sub}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-3xl border border-white/10 bg-slate-900/70 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Core Strengths</p>
                      <h3 className="text-lg font-semibold text-white">Skill Focus</h3>
                    </div>
                    <span className="text-sm text-cyan-300">Always learning</span>
                  </div>

                  <div className="space-y-4">
                    {skillLevels.map((skill) => (
                      <div key={skill.name}>
                        <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                          <span>{skill.name}</span>
                          <span>{skill.pct}%</span>
                        </div>
                        <div className="h-3 w-full rounded-full bg-white/10">
                          <div
                            className="h-3 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500"
                            style={{ width: `${skill.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-300">About Me</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              A portfolio that speaks like a brand, not just a resume.
            </h2>
          </div>

          <p className="text-lg leading-8 text-slate-300">
            I combine business understanding, technical execution, and modern UI thinking to create solutions that are useful, scalable, and visually polished. My work spans analytics, workflow automation, enterprise systems, and digital product experiences.
          </p>
        </div>
      </section>

      <section id="work" className="mx-auto max-w-7xl px-6 pb-16 lg:px-8 lg:pb-24">
        <div className="mb-12 max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-300">Featured Work</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Selected projects and solutions.
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {work.map((item) => (
            <div
              key={item.title}
              className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-md transition hover:-translate-y-1 hover:bg-white/7"
            >
              <div className="mb-5 h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20" />
              <h3 className="text-xl font-semibold text-white">{item.title}</h3>
              <p className="mt-3 leading-7 text-slate-300">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="apps" className="mx-auto max-w-7xl px-6 pb-16 lg:px-8 lg:pb-24">
        <div className="mb-12 max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-300">Live Apps</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Explore the products I&apos;ve built.
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {apps.map((app) => (
            <div
              key={app.title}
              className="flex flex-col rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-md transition hover:-translate-y-1 hover:bg-white/7"
            >
              <div className={`mb-5 h-40 rounded-3xl bg-gradient-to-br ${app.gradient} opacity-80`} />
              <h3 className="text-xl font-semibold text-white">{app.title}</h3>
              <p className="mt-3 flex-1 leading-7 text-slate-300">{app.desc}</p>
              <a
                href={app.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex w-fit items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
              >
                Visit Site
                <span aria-hidden="true">→</span>
              </a>
            </div>
          ))}
        </div>
      </section>

      <section id="skills" className="mx-auto max-w-7xl px-6 pb-16 lg:px-8 lg:pb-24">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-md lg:p-12">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-violet-300">Core Skills</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Tools I use to ship.
          </h2>

          <div className="mt-8 flex flex-wrap gap-3">
            {skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-white/10 bg-slate-900/70 px-4 py-2 text-sm text-slate-200"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
        <div className="rounded-[2rem] border border-white/10 bg-gradient-to-r from-white/8 to-white/5 p-8 backdrop-blur-xl lg:p-12">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-violet-300">Contact</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Let&apos;s build something meaningful.
              </h2>
              <p className="mt-4 max-w-2xl text-slate-300">
                Open to collaborations, freelance work, and opportunities in data, enterprise systems, and digital product development.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row lg:justify-end">
              <a
                href="mailto:hazim.fitri.hf@gmail.com"
                className="rounded-2xl bg-white px-6 py-3 text-center font-semibold text-slate-950 transition hover:scale-[1.02]"
              >
                Email Me
              </a>
              <a
                href="#"
                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-center font-medium text-white transition hover:bg-white/10"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
