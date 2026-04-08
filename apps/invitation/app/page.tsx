export default function InvitationPage() {
  return (
    <main className="min-h-screen bg-[#efedf2] flex items-center justify-center p-6">
      <div className="relative w-full max-w-[430px] min-h-[760px] overflow-hidden rounded-sm bg-[linear-gradient(180deg,#f7f6fa_0%,#efedf2_100%)] shadow-2xl border border-[#e6e0ea]">
        {/* Floral corners */}
        <div className="absolute top-0 left-0 w-40 h-40 opacity-90">
          <div className="absolute top-[-20px] left-[-20px] w-28 h-28 rounded-full bg-purple-300/60 blur-xl" />
          <div className="absolute top-8 left-8 w-20 h-20 rounded-full bg-fuchsia-200/70 blur-lg" />
          <div className="absolute top-4 left-16 w-12 h-12 rounded-full bg-violet-500/30 blur-md" />
          <div className="absolute top-16 left-0 w-14 h-14 rounded-full bg-lime-200/40 blur-md" />
        </div>

        <div className="absolute top-0 right-0 w-44 h-44 opacity-90">
          <div className="absolute top-[-10px] right-[-20px] w-28 h-28 rounded-full bg-violet-300/60 blur-xl" />
          <div className="absolute top-10 right-8 w-20 h-20 rounded-full bg-purple-200/70 blur-lg" />
          <div className="absolute top-2 right-16 w-12 h-12 rounded-full bg-indigo-500/30 blur-md" />
          <div className="absolute top-16 right-0 w-14 h-14 rounded-full bg-green-200/40 blur-md" />
        </div>

        <div className="absolute bottom-0 left-0 w-36 h-36 opacity-85">
          <div className="absolute bottom-[-20px] left-[-12px] w-24 h-24 rounded-full bg-purple-300/50 blur-xl" />
          <div className="absolute bottom-8 left-8 w-16 h-16 rounded-full bg-fuchsia-200/60 blur-lg" />
          <div className="absolute bottom-3 left-16 w-10 h-10 rounded-full bg-green-200/40 blur-md" />
        </div>

        <div className="absolute bottom-0 right-0 w-36 h-36 opacity-85">
          <div className="absolute bottom-[-20px] right-[-12px] w-24 h-24 rounded-full bg-violet-300/50 blur-xl" />
          <div className="absolute bottom-8 right-8 w-16 h-16 rounded-full bg-purple-200/60 blur-lg" />
          <div className="absolute bottom-3 right-16 w-10 h-10 rounded-full bg-green-200/40 blur-md" />
        </div>

        {/* Soft paper texture */}
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,white_0%,transparent_32%),radial-gradient(circle_at_80%_30%,white_0%,transparent_28%),radial-gradient(circle_at_50%_80%,white_0%,transparent_30%)]" />

        <div className="relative z-10 flex min-h-[760px] flex-col items-center px-8 py-10 text-center">
          <p className="text-[28px] text-[#6f5477] leading-none mb-6" style={{ fontFamily: "cursive" }}>
            بسم الله الرحمن الرحيم
          </p>

          <p className="text-[15px] leading-7 tracking-[0.12em] uppercase text-[#4b4347] max-w-[280px]">
            Please join us to celebrate the wedding of:
          </p>

          {/* Couple section */}
          <div className="relative mt-10 mb-10 flex items-center justify-center">
            <div className="absolute w-[170px] h-[170px] rounded-full border-[3px] border-[#d5b24b]" />
            <div className="absolute w-[184px] h-[184px] rounded-full border border-[#e9d48b]" />

            <div className="absolute -top-3 -left-2 w-16 h-16 rounded-full bg-pink-200/80 blur-md" />
            <div className="absolute top-0 -left-4 w-10 h-10 rounded-full bg-violet-300/70 blur-sm" />
            <div className="absolute -bottom-1 right-0 w-14 h-14 rounded-full bg-purple-300/70 blur-md" />
            <div className="absolute bottom-2 right-6 w-8 h-8 rounded-full bg-blue-200/70 blur-sm" />

            <div className="relative px-10 py-12">
              <h1
                className="text-[40px] leading-[1.1] text-[#4b3d46]"
                style={{ fontFamily: "Georgia, serif", fontStyle: "italic" }}
              >
                Hazim
                <br />
                <span className="text-[34px]">&amp;</span>
                <br />
                Olivia
              </h1>
            </div>
          </div>

          {/* Date */}
          <p className="text-[14px] tracking-[0.25em] text-[#4b4347] font-medium">
            APRIL
          </p>

          <div className="mt-2 flex items-center justify-center gap-4 w-full">
            <div className="flex-1 max-w-[120px]">
              <div className="h-[2px] bg-[#d5b24b] mb-2" />
              <p className="text-[14px] tracking-[0.08em] text-[#4b4347]">SATURDAY</p>
            </div>

            <div className="px-1">
              <p className="text-[64px] leading-none text-[#7a5aa5] font-light">26</p>
            </div>

            <div className="flex-1 max-w-[120px]">
              <div className="h-[2px] bg-[#d5b24b] mb-2" />
              <p className="text-[14px] tracking-[0.08em] text-[#4b4347]">AT 08:00 PM</p>
            </div>
          </div>

          <p className="mt-2 text-[18px] tracking-[0.18em] text-[#4b4347]">2025</p>

          {/* Venue */}
          <div className="mt-12 text-[#4b4347]">
            <h2 className="text-[28px] font-semibold leading-tight" style={{ fontFamily: "Georgia, serif" }}>
              Liceria Grand Ballroom
            </h2>
            <p className="mt-3 text-[18px] leading-8">
              123 Anywhere St., Any City,
              <br />
              ST 12345
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}