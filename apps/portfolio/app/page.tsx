export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute right-0 top-40 h-[400px] w-[400px] rounded-full bg-violet-500/15 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[350px] w-[350px] rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_35%)]" />
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <div className="text-lg font-semibold tracking-wide">
            Hazim<span className="text-fuchsia-400">.</span>
          </div>

          <nav className="hidden gap-8 text-sm text-white/70 md:flex">
            <a href="#about" className="transition hover:text-white">
              About
            </a>
            <a href="#work" className="transition hover:text-white">
              Work
            </a>
            <a href="#apps" className="transition hover:text-white">
              Apps
            </a>
            <a href="#skills" className="transition hover:text-white">
              Skills
            </a>
            <a href="#contact" className="transition hover:text-white">
              Contact
            </a>
          </nav>

          <a
            href="#contact"
            className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium transition hover:bg-white hover:text-slate-950"
          >
            Let&apos;s Talk
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:px-10">
        <div>
          <p className="mb-4 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1 text-sm text-cyan-300">
            Data • Tech • Business
          </p>

          <h1 className="max-w-3xl text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            Building digital solutions with
            <span className="bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent">
              {" "}
              clarity, data, and design
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/65">
            I create modern products, analytics solutions, and business-driven
            systems that connect technology with real operational value.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="#work"
              className="rounded-full bg-white px-6 py-3 font-medium text-slate-950 transition hover:scale-[1.02]"
            >
              View My Work
            </a>
            <a
              href="#contact"
              className="rounded-full border border-white/15 bg-white/5 px-6 py-3 font-medium text-white transition hover:bg-white/10"
            >
              Contact Me
            </a>
          </div>

          <div className="mt-10 flex flex-wrap gap-6 text-sm text-white/50">
            <span>Next.js</span>
            <span>Power Platform</span>
            <span>SAP</span>
            <span>Data Analytics</span>
            <span>Python</span>
          </div>
        </div>

        {/* Right card */}
        <div className="relative">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
            <div className="rounded-[24px] border border-white/10 bg-slate-900 p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/50">Personal Brand</p>
                  <h2 className="text-2xl font-semibold">Portfolio Dashboard</h2>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 px-4 py-2 text-sm font-semibold text-slate-950">
                  Available
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm text-white/50">Focus</p>
                  <p className="mt-2 text-lg font-semibold">
                    Business Intelligence
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm text-white/50">Specialty</p>
                  <p className="mt-2 text-lg font-semibold">
                    Process Automation
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm text-white/50">Experience</p>
                  <p className="mt-2 text-lg font-semibold">
                    Data + Enterprise Apps
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm text-white/50">Approach</p>
                  <p className="mt-2 text-lg font-semibold">
                    Clean, Strategic, Modern
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-sm uppercase tracking-[0.2em] text-cyan-300">
              About Me
            </p>
            <h2 className="text-3xl font-semibold sm:text-4xl">
              A portfolio that speaks like a brand, not just a resume
            </h2>
          </div>

          <p className="text-lg leading-8 text-white/65">
            I combine business understanding, technical execution, and modern UI
            thinking to create solutions that are useful, scalable, and visually
            polished. My work spans analytics, workflow automation, enterprise
            systems, and digital product experiences.
          </p>
        </div>
      </section>

      {/* Work */}
      <section id="work" className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <div className="mb-8">
          <p className="mb-3 text-sm uppercase tracking-[0.2em] text-cyan-300">
            Featured Work
          </p>
          <h2 className="text-3xl font-semibold sm:text-4xl">
            Selected projects and solutions
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[
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
          ].map((item) => (
            <div
              key={item.title}
              className="group rounded-[28px] border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:bg-white/8"
            >
              <div className="mb-4 h-44 rounded-[22px] bg-gradient-to-br from-white/10 to-white/5" />
              <h3 className="text-xl font-semibold">{item.title}</h3>
              <p className="mt-3 leading-7 text-white/60">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Apps */}
      <section id="apps" className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <div className="mb-8">
          <p className="mb-3 text-sm uppercase tracking-[0.2em] text-cyan-300">
            Live Apps
          </p>
          <h2 className="text-3xl font-semibold sm:text-4xl">
            Explore the products I&apos;ve built
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
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
          ].map((app) => (
            <div
              key={app.title}
              className="group flex flex-col rounded-[28px] border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:bg-white/8"
            >
              <div
                className={`mb-4 h-44 rounded-[22px] bg-gradient-to-br ${app.gradient} opacity-80`}
              />
              <h3 className="text-xl font-semibold">{app.title}</h3>
              <p className="mt-3 flex-1 leading-7 text-white/60">{app.desc}</p>
              <a
                href={app.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-slate-950 transition hover:scale-[1.02]"
              >
                Visit Site
                <span aria-hidden="true">→</span>
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Skills */}
      <section id="skills" className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="rounded-[32px] border border-white/10 bg-white/5 p-8">
          <p className="mb-3 text-sm uppercase tracking-[0.2em] text-violet-300">
            Core Skills
          </p>

          <div className="flex flex-wrap gap-3">
            {[
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
            ].map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/80"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="rounded-[32px] border border-white/10 bg-gradient-to-br from-cyan-500/10 via-white/5 to-violet-500/10 p-10 text-center">
          <p className="mb-3 text-sm uppercase tracking-[0.2em] text-white/60">
            Contact
          </p>
          <h2 className="text-3xl font-semibold sm:text-4xl">
            Let&apos;s build something meaningful
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-white/65">
            Open to collaborations, freelance work, and opportunities in data,
            enterprise systems, and digital product development.
          </p>

          <div className="mt-8 flex justify-center gap-4">
            <a
              href="mailto:hazim.fitri.hf@gmail.com"
              className="rounded-full bg-white px-6 py-3 font-medium text-slate-950"
            >
              Email Me
            </a>
            <a
              href="#"
              className="rounded-full border border-white/15 bg-white/5 px-6 py-3 font-medium text-white"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}