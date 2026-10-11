"use client";

import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";

// Dark-mode chart palette, validated against the card surface (#0f1323):
// categorical slots 1-2 and the blue<->red diverging poles all pass the
// CVD / contrast checks.
export const COLORS = {
  series1: "#3987e5", // blue
  series2: "#d95926", // orange
  positive: "#3987e5",
  negative: "#e66767",
  grid: "rgba(255,255,255,0.07)",
  baseline: "rgba(255,255,255,0.22)",
  muted: "#94a3b8",
};

const BAR_MAX = 24;
const RADIUS = 4;

export function formatRM(value: number) {
  return new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" }).format(value);
}

export function formatCompactRM(value: number) {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}RM${(abs / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (abs >= 1_000) return `${sign}RM${(abs / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return `${sign}RM${Math.round(abs)}`;
}

// Clean axis ticks (1 / 2 / 2.5 / 5 x 10^k) spanning [min, max], always including 0.
function niceTicks(min: number, max: number, count = 4) {
  const lo = Math.min(0, min);
  const hi = Math.max(0, max);
  if (hi === lo) return { ticks: [0, 1], lo: 0, hi: 1 };
  const raw = (hi - lo) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  const start = Math.floor(lo / step) * step;
  const end = Math.ceil(hi / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= end + step / 2; v += step) ticks.push(Math.round(v * 100) / 100);
  return { ticks, lo: start, hi: end };
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

// A bar with a 4px rounded data end and a square end at the baseline.
function barPath(x: number, w: number, yBase: number, yValue: number) {
  const h = Math.abs(yBase - yValue);
  const r = Math.min(RADIUS, h, w / 2);
  if (yValue <= yBase) {
    // grows upward
    return `M${x},${yBase} V${yValue + r} Q${x},${yValue} ${x + r},${yValue} H${x + w - r} Q${x + w},${yValue} ${x + w},${yValue + r} V${yBase} Z`;
  }
  return `M${x},${yBase} V${yValue - r} Q${x},${yValue} ${x + r},${yValue} H${x + w - r} Q${x + w},${yValue} ${x + w},${yValue - r} V${yBase} Z`;
}

type TooltipRow = { label: string; value: string; color?: string };

function Tooltip({ x, y, title, rows, width }: { x: number; y: number; title: string; rows: TooltipRow[]; width: number }) {
  // Keep the tooltip inside the chart horizontally.
  const left = Math.min(Math.max(x, 90), Math.max(width - 90, 90));
  return (
    <div
      className="pointer-events-none absolute z-10 min-w-[10rem] -translate-x-1/2 -translate-y-full rounded-xl border border-white/10 bg-slate-900/95 px-3 py-2 text-xs shadow-xl"
      style={{ left, top: y - 8 }}
      role="status"
    >
      <p className="mb-1 text-slate-400">{title}</p>
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2 text-slate-300">
            {row.color && <span className="inline-block h-0.5 w-3 rounded" style={{ background: row.color }} />}
            {row.label}
          </span>
          <span className="font-semibold tabular-nums text-white">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card with a Chart / Table toggle, so every value is reachable without hover.

export type TableData = { columns: string[]; rows: (string | number)[][] };

export function ChartCard({
  title,
  subtitle,
  legend,
  table,
  actions,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  legend?: ReactNode;
  table?: TableData;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const [view, setView] = useState<"chart" | "table">("chart");

  return (
    <section className={`rounded-[2rem] border border-white/10 bg-white/5 p-6 ${className}`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-white">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-slate-400">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {table && (
            <div className="flex rounded-full border border-white/10 p-0.5 text-xs">
              {(["chart", "table"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`rounded-full px-3 py-1 capitalize transition ${
                    view === v ? "bg-white text-slate-950" : "text-slate-300 hover:text-white"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {legend && view === "chart" && <div className="mb-3">{legend}</div>}
      {view === "chart" || !table ? (
        children
      ) : (
        <div className="max-h-80 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-900 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                {table.columns.map((c, i) => (
                  <th key={c} className={`px-3 py-2 font-medium ${i > 0 ? "text-right" : ""}`}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {table.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, i) => (
                    <td key={i} className={`px-3 py-1.5 ${i > 0 ? "text-right tabular-nums" : "text-slate-200"}`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Vertical columns: one or more series per category, on one shared axis.

export type ColumnSeries = { name: string; color: string; values: number[] };

export function ColumnChart({
  categories,
  series,
  height = 240,
  colorForValue,
  format = formatRM,
  axisFormat = formatCompactRM,
  labelExtremes = false,
}: {
  categories: string[];
  series: ColumnSeries[];
  height?: number;
  // Per-value color, e.g. blue above zero / red below for a diverging chart.
  colorForValue?: (value: number) => string;
  // Tooltip format and the compact format used on the axis and direct labels.
  format?: (value: number) => string;
  axisFormat?: (value: number) => string;
  labelExtremes?: boolean;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const margin = { top: 16, right: 8, bottom: 28, left: 56 };
  const plotW = Math.max(width - margin.left - margin.right, 0);
  const plotH = height - margin.top - margin.bottom;
  const all = series.flatMap((s) => s.values);
  const { ticks, lo, hi } = niceTicks(Math.min(...all, 0), Math.max(...all, 0));
  const y = (v: number) => margin.top + ((hi - v) / (hi - lo)) * plotH;
  const band = categories.length ? plotW / categories.length : 0;
  const k = series.length;
  const barW = Math.max(Math.min(BAR_MAX, (band * 0.72 - 2 * (k - 1)) / k), 2);
  const groupW = barW * k + 2 * (k - 1);
  const labelEvery = Math.max(1, Math.ceil(categories.length / Math.max(plotW / 56, 1)));

  // Extremes to direct-label (single-series charts only).
  let maxIdx = -1;
  let minIdx = -1;
  if (labelExtremes && k === 1) {
    const vals = series[0].values;
    maxIdx = vals.indexOf(Math.max(...vals));
    const minVal = Math.min(...vals);
    minIdx = minVal < 0 ? vals.indexOf(minVal) : -1;
  }

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} className="block overflow-visible" role="img">
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={margin.left}
                x2={margin.left + plotW}
                y1={y(t)}
                y2={y(t)}
                stroke={t === 0 ? COLORS.baseline : COLORS.grid}
                strokeWidth={1}
              />
              <text x={margin.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill={COLORS.muted} className="tabular-nums">
                {axisFormat(t)}
              </text>
            </g>
          ))}

          {categories.map((cat, i) => {
            const gx = margin.left + i * band + (band - groupW) / 2;
            const dim = hover !== null && hover !== i;
            return (
              <g key={cat} opacity={dim ? 0.45 : 1}>
                {series.map((s, j) => {
                  const v = s.values[i] ?? 0;
                  if (v === 0) return null;
                  return (
                    <path
                      key={s.name}
                      d={barPath(gx + j * (barW + 2), barW, y(0), y(v))}
                      fill={colorForValue ? colorForValue(v) : s.color}
                    />
                  );
                })}
                {i % labelEvery === 0 && (
                  <text x={margin.left + i * band + band / 2} y={height - 8} textAnchor="middle" fontSize={11} fill={COLORS.muted}>
                    {cat}
                  </text>
                )}
                {(i === maxIdx || i === minIdx) && (
                  <text
                    x={gx + barW / 2}
                    y={series[0].values[i] >= 0 ? y(series[0].values[i]) - 6 : y(series[0].values[i]) + 14}
                    textAnchor="middle"
                    fontSize={11}
                    fill="#e2e8f0"
                  >
                    {axisFormat(series[0].values[i])}
                  </text>
                )}
                {/* Hit target: the whole band, bigger than the bars. */}
                <rect
                  x={margin.left + i * band}
                  y={margin.top}
                  width={band}
                  height={plotH}
                  fill="transparent"
                  tabIndex={0}
                  aria-label={`${cat}: ${series.map((s) => `${s.name} ${format(s.values[i] ?? 0)}`).join(", ")}`}
                  onPointerEnter={() => setHover(i)}
                  onPointerLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  className="outline-none"
                />
              </g>
            );
          })}
        </svg>
      )}
      {hover !== null && (
        <Tooltip
          x={margin.left + hover * band + band / 2}
          y={y(Math.max(...series.map((s) => s.values[hover] ?? 0), 0))}
          width={width}
          title={categories[hover]}
          rows={series.map((s) => ({
            label: s.name,
            value: format(s.values[hover] ?? 0),
            color: colorForValue ? colorForValue(s.values[hover] ?? 0) : s.color,
          }))}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single-series line with a 10% area wash, crosshair hover and an end label.

export function AreaLineChart({
  points,
  color = COLORS.series1,
  height = 240,
  name,
}: {
  points: { label: string; value: number }[];
  color?: string;
  height?: number;
  name: string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const margin = { top: 20, right: 64, bottom: 28, left: 56 };
  const plotW = Math.max(width - margin.left - margin.right, 0);
  const plotH = height - margin.top - margin.bottom;
  const values = points.map((p) => p.value);
  const { ticks, lo, hi } = niceTicks(Math.min(...values, 0), Math.max(...values, 0));
  const x = (i: number) => margin.left + (points.length > 1 ? (i / (points.length - 1)) * plotW : plotW / 2);
  const y = (v: number) => margin.top + ((hi - v) / (hi - lo)) * plotH;
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.value)}`).join(" ");
  const area = points.length ? `${line} L${x(points.length - 1)},${y(0)} L${x(0)},${y(0)} Z` : "";
  const labelEvery = Math.max(1, Math.ceil(points.length / Math.max(plotW / 56, 1)));
  const last = points.length - 1;

  function onMove(e: PointerEvent<SVGRectElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = (e.clientX - rect.left) / rect.width;
    setHover(Math.round(rel * (points.length - 1)));
  }

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 && points.length > 0 && (
        <svg width={width} height={height} className="block overflow-visible" role="img" aria-label={name}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={margin.left} x2={margin.left + plotW} y1={y(t)} y2={y(t)} stroke={t === 0 ? COLORS.baseline : COLORS.grid} />
              <text x={margin.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill={COLORS.muted}>
                {formatCompactRM(t)}
              </text>
            </g>
          ))}
          {points.map((p, i) =>
            i % labelEvery === 0 ? (
              <text key={p.label} x={x(i)} y={height - 8} textAnchor="middle" fontSize={11} fill={COLORS.muted}>
                {p.label}
              </text>
            ) : null
          )}
          <path d={area} fill={color} fillOpacity={0.1} />
          <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {hover !== null && (
            <line x1={x(hover)} x2={x(hover)} y1={margin.top} y2={margin.top + plotH} stroke="rgba(255,255,255,0.35)" />
          )}
          {/* End marker with a surface ring, plus the direct label. */}
          <circle cx={x(last)} cy={y(values[last])} r={5} fill={color} stroke="#0f1323" strokeWidth={2} />
          <text x={x(last) + 10} y={y(values[last])} dy="0.32em" fontSize={12} fontWeight={600} fill="#ffffff">
            {formatCompactRM(values[last])}
          </text>
          {hover !== null && hover !== last && (
            <circle cx={x(hover)} cy={y(values[hover])} r={5} fill={color} stroke="#0f1323" strokeWidth={2} />
          )}
          <rect
            x={margin.left}
            y={margin.top}
            width={plotW}
            height={plotH}
            fill="transparent"
            tabIndex={0}
            className="outline-none"
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
            onFocus={() => setHover(last)}
            onBlur={() => setHover(null)}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") setHover((h) => Math.max((h ?? last) - 1, 0));
              if (e.key === "ArrowRight") setHover((h) => Math.min((h ?? last) + 1, last));
            }}
          />
        </svg>
      )}
      {hover !== null && (
        <Tooltip
          x={x(hover)}
          y={y(values[hover])}
          width={width}
          title={points[hover].label}
          rows={[{ label: name, value: formatRM(values[hover]), color }]}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Horizontal bars (HTML) for ranked lists with long names; value at the tip.

export function BarList({
  items,
  color = COLORS.series1,
  format = formatRM,
  wideLabels = false,
}: {
  items: { label: string; value: number; detail?: string }[];
  color?: string;
  format?: (value: number) => string;
  wideLabels?: boolean;
}) {
  const max = Math.max(...items.map((i) => i.value), 0);
  const total = items.reduce((s, i) => s + i.value, 0);

  if (items.length === 0) return <p className="py-6 text-center text-sm text-slate-400">Nothing in this period.</p>;

  return (
    <ul className="space-y-2.5">
      {items.map((item) => {
        const pct = max > 0 ? (item.value / max) * 100 : 0;
        const share = total > 0 ? (item.value / total) * 100 : 0;
        return (
          <li
            key={item.label}
            tabIndex={0}
            className={`group relative grid items-center gap-3 rounded-lg outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 ${
              wideLabels
                ? "grid-cols-[minmax(0,10rem)_1fr] sm:grid-cols-[minmax(0,15rem)_1fr]"
                : "grid-cols-[minmax(0,9rem)_1fr] sm:grid-cols-[minmax(0,11rem)_1fr]"
            }`}
          >
            <span className="truncate text-sm text-slate-300" title={item.label}>
              {item.label}
            </span>
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-3.5 shrink-0 rounded-r transition-opacity group-hover:opacity-80"
                style={{ width: `${Math.max(pct, 1)}%`, maxWidth: "calc(100% - 5.5rem)", background: color }}
              />
              <span className="shrink-0 text-xs font-medium tabular-nums text-slate-200">{format(item.value)}</span>
            </span>
            <span className="pointer-events-none absolute -top-9 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-slate-900/95 px-2.5 py-1 text-xs text-slate-300 shadow-xl group-hover:block group-focus:block">
              <span className="font-semibold text-white">{share.toFixed(1)}%</span> of total
              {item.detail ? ` · ${item.detail}` : ""}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
