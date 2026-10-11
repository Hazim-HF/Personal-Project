import { type Transaction } from "@/lib/api";

// Shared rules for turning raw bank/card transactions into analysis-ready
// money flows (used by the dashboard and the budget planner).

// Money you can't spend day to day (retirement / pilgrimage savings), so it
// can be left out of cash-flow analysis.
export function isLockedSavings(account: { type: string; institution?: string | null; name: string }) {
  return account.type === "INVESTMENT" || /tabung haji/i.test(account.institution ?? account.name);
}

export function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-MY", { month: "short", year: "2-digit" });
}

export function monthsBetween(startKey: string, endKey: string) {
  const out: string[] = [];
  const [sy, sm] = startKey.split("-").map(Number);
  const d = new Date(sy, sm - 1, 1);
  while (monthKey(d) <= endKey) {
    out.push(monthKey(d));
    d.setMonth(d.getMonth() + 1);
  }
  return out;
}

const GENERIC_WORDS = new Set([
  "RESTORAN", "RESTAURANT", "KEDAI", "THE", "MPY", "GKS", "TPRBGURNEYSDNBH",
  "PUAN", "ENCIK", "CIK", "MBBQR", "QR",
]);

// Common Malay name / place prefixes: the lead word alone would merge
// different payees ("MOHD HARMIZI" and "MOHD RIZAL"), so keep two words.
const NAME_PREFIXES = new Set([
  "MOHD", "MOHAMAD", "MOHAMMAD", "MOHAMED", "MUHAMMAD", "MUHAMAD", "MUHD", "NUR", "NURUL",
  "SITI", "ABDUL", "ABD", "AHMAD", "WAN", "NIK", "SYED", "SHARIFAH", "PUSAT", "MASJID",
  "NASI", "AYAM", "DAPUR", "UNIVERSITI",
]);

export function payeeWords(text: string) {
  return text
    .toUpperCase()
    .replace(/[*#:/]/g, " ")
    .replace(/\d+/g, " ")
    .split(/[\s\-_.]+/)
    .filter((w) => w.length > 1 && !GENERIC_WORDS.has(w));
}

export function titleCase(s: string) {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

// Turns bank/card descriptions ("SETEL FUEL PASSTHROUGH-EC KUALA LUMPUR MY",
// "3486070660" + "FPX PAYMENT FR A/ - UNIVERSITI KEBANGSAA") into a short,
// groupable payee name.
export function merchantName(tx: Transaction, ownerFirstName: string) {
  // Merchant first; when it's only a reference number, fall back to the
  // description's segments, most specific (last) first.
  const sources = [tx.merchant, ...(tx.description ?? "").split(" - ").reverse()];
  let words: string[] = [];
  for (const source of sources) {
    if (!source) continue;
    words = payeeWords(source);
    if (words.length) break;
  }
  if (!words.length) return "Unknown";
  if (ownerFirstName && words[0] === ownerFirstName) return "Own accounts";

  const lead = words[0];
  const name = (NAME_PREFIXES.has(lead) || lead.length <= 3) && words[1] ? `${lead} ${words[1]}` : lead;
  return titleCase(name);
}

// Placeholders for money moving to/from your own accounts that aren't in the
// tracker yet - they move net worth but aren't really income or spending.
export function isUntrackedTransfer(tx: Transaction) {
  return /untracked account/i.test(tx.description ?? "");
}

export function isRefund(tx: Transaction) {
  return /\b(refund|reversal|reverses)\b/i.test(`${tx.description ?? ""} ${tx.merchant ?? ""}`);
}

export function displayPayee(tx: Transaction) {
  return tx.merchant && /[a-z]{2}/i.test(tx.merchant) ? tx.merchant : tx.description || tx.merchant || "";
}

// Income/expense rows that are really your own money moving between your
// accounts (placeholders, or a payee that is you).
export function isOwnTransfer(tx: Transaction, ownerFirstName: string) {
  return tx.type !== "TRANSFER" && (isUntrackedTransfer(tx) || merchantName(tx, ownerFirstName) === "Own accounts");
}

// ---------------------------------------------------------------------------
// Needs / wants / savings

export type Bucket = "needs" | "wants" | "savings";

export const BUCKETS: { id: Bucket; label: string; hint: string }[] = [
  { id: "needs", label: "Needs", hint: "Rent, groceries, transport, bills, health, education" },
  { id: "wants", label: "Wants", hint: "Eating out, shopping, subscriptions, entertainment" },
  { id: "savings", label: "Savings", hint: "Investments, emergency fund, money left over" },
];

// Default bucket for each built-in expense category.
export const CATEGORY_BUCKET: Record<string, Bucket> = {
  "Housing & Rent": "needs",
  Groceries: "needs",
  Transport: "needs",
  Utilities: "needs",
  Healthcare: "needs",
  "Food & Dining": "wants",
  Shopping: "wants",
  Subscriptions: "wants",
  Entertainment: "wants",
  Other: "wants",
  "Savings & Investments": "savings",
};

// Keyword rules for guessing the category of an uncategorized expense from
// its merchant/description. First match wins, so specific rules go first.
// `bucket` overrides the category's default bucket (e.g. tuition is "Other"
// but clearly a need).
const GUESS_RULES: { pattern: RegExp; category: string; bucket?: Bucket }[] = [
  { pattern: /\b(AHAM|MOOMOO|ASNB|AMANAH SAHAM|STASHAWAY|WAHED|VERSA|LUNO|ASB)\b/, category: "Savings & Investments" },
  { pattern: /\b(UNIVERSITI|UKM|UITM|YURAN|PENDID|TUITION|KOLEJ|SCHOOL)\b/, category: "Other", bucket: "needs" },
  { pattern: /\b(ZAKAT)\b/, category: "Other", bucket: "needs" },
  { pattern: /\b(SEWA|RENT|RUMAH)\b/, category: "Housing & Rent" },
  // Car takaful/insurance names the plate number ("takaful VBW4520"); road tax too.
  { pattern: /\b(TAKAFUL|INSURANS|INSURANCE)\s+[A-Z]{1,3}\s?\d{1,4}\b|\b(ROAD ?TAX|JPJ|CUKAI JALAN)\b/, category: "Transport" },
  { pattern: /\b(JIM|IMIGRESEN|PASSPORT|PASPORT)\b/, category: "Other", bucket: "needs" },
  { pattern: /\b(SHOPEEFOOD|FOODPANDA|GRABFOOD)\b/, category: "Food & Dining" },
  { pattern: /\b(CHATGPT|OPENAI|CLAUDE|ANTHROPIC|NETFLIX|SPOTIFY|YOUTUBE|CANVA|SUNO|CLOUDFLARE|OVERLEAF|ICLOUD|ADOBE|ASTRO|DISNEY)\b/, category: "Subscriptions" },
  { pattern: /\b(TNB|SYABAS|AIR SELANGOR|UNIFI|MAXIS|CELCOM|DIGI|U MOBILE|INDAH WATER|TIME DOTCOM|DEWAN BANDARAYA|CUKAI)\b/, category: "Utilities" },
  { pattern: /\b(KLINIK|CLINIC|FARMASI|PHARMACY|HOSPITAL|GUARDIAN|WATSON'?S?|PRUBSN|TAKAFUL|INSURANS|INSURANCE|RHB INS)\b/, category: "Healthcare" },
  { pattern: /\b(SETEL|PETRONAS|SHELL|PETRON|CALTEX|BHPETROL|PSS|PARKING|CARPARK|LAYPARK|TOUCH N GO|TNG|PLUS|MRT|LRT|GRABPAY|GRAB|CAR WASH|DEW BANDARAYA)\b/, category: "Transport" },
  { pattern: /\b(SPEEDMART|SPEED MART|LOTUS|MYDIN|GIANT|JAYA GROCER|ECONSAVE|FAMILYMART|7-ELEVEN|MYNEWS|KK MART|ECOSHOP|NSK|AEON BIG|TOO TOO FRUITS|PERSADA)\b/, category: "Groceries" },
  { pattern: /\b(COFFEE|COFFEEBOT|KOPI|CAFE|RESTORAN|RESTAURANT|NASI|AYAM|MAKAN|KITCHEN|BISTRO|FOOD|BURGER|BRGR|SUBWAY|MCD|KFC|PIZZA|DAPUR|DAKGALBI|MEE|SATAY|LUNCH|DINNER|BREAKFAST|KAYA|PASEMBOR|NINJAZ|DEEN|HIDANGAN|GLORIA JEANS|FOODTRUCK|DAIRY|CHA|ACRE|ZUS|TEALIVE|STARBUCKS|CBTL|YOGURT|MILK|DRINK|THAQWA|BAKERY)\b/, category: "Food & Dining" },
  { pattern: /\b(SHOPEE|LAZADA|TIKTOK|XIAOMI|UNIQLO|BATH&BODY|IKEA|MR DIY|HARDWARE|DECATHLON|SPAYLATER|SMART LEGACY|ZALORA|LOWYAT|SWITCH|WONDERLITE|BSC)\b/, category: "Shopping" },
  { pattern: /\b(CINEMA|GSC|TGV|BADMINTON|SPORTS|FUTSAL|BOWLING|STEAM|PLAYSTATION|GLASS HOUSE|THEME PARK)\b/, category: "Entertainment" },
  { pattern: /\b(BARBER|BARBERSHOP|SALON)\b/, category: "Shopping" },
];

export type Classified = {
  category: string | null; // null = couldn't tell
  bucket: Bucket | null;
  guessed: boolean; // true when inferred from keywords rather than a set category
};

export function classifyExpense(tx: Transaction): Classified {
  if (tx.category) {
    return { category: tx.category.name, bucket: CATEGORY_BUCKET[tx.category.name] ?? "wants", guessed: false };
  }
  const text = `${tx.merchant ?? ""} ${tx.description ?? ""}`.toUpperCase();
  for (const rule of GUESS_RULES) {
    if (rule.pattern.test(text)) {
      return { category: rule.category, bucket: rule.bucket ?? CATEGORY_BUCKET[rule.category], guessed: true };
    }
  }
  return { category: null, bucket: null, guessed: true };
}
