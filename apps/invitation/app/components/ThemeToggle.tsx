"use client";

// Theme lives in a cookie scoped to .hazimfitri.com so the choice carries across every site.
function persist(theme: "light" | "dark") {
  const domain = location.hostname.endsWith("hazimfitri.com") ? "; domain=.hazimfitri.com" : "";
  document.cookie = `theme=${theme}; path=/; max-age=31536000; samesite=lax${domain}`;
}

export default function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const next = root.dataset.theme === "light" ? "dark" : "light";
    root.dataset.theme = next;
    persist(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      className="fixed bottom-5 right-5 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-paper-edge bg-paper-light text-ink shadow-xl transition hover:scale-[1.05]"
    >
      {/* Sun: shown in dark mode */}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="hidden h-5 w-5 dark:block">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
      {/* Moon: shown in light mode */}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 dark:hidden">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </button>
  );
}
