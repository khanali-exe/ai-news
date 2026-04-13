"use client";
import useSWR from "swr";
import { API_BASE, CATEGORIES } from "@/lib/constants";
import { swrFetcher } from "@/lib/api";
import { LiveTimestamp } from "@/components/ui/LiveTimestamp";

interface Stats { total_published: number; by_category: Record<string, number>; }

export function StatsBar() {
  const { data } = useSWR<Stats>(`${API_BASE}/api/v1/articles/stats`, swrFetcher, {
    revalidateOnFocus: false,
    refreshInterval: 120000,
  });

  return (
    <div
      className="glass mb-8 relative overflow-hidden rounded-2xl px-5 py-4"
    >
      {/* Subtle background orb */}
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-[0.07]"
        style={{ background: "radial-gradient(circle, #0ea5e9, transparent)" }}
      />

      {/* ── Desktop: single row (original layout) ── */}
      <div className="hidden sm:flex sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-3">
        <div className="flex items-baseline gap-2">
          <span
            className="stats-total text-3xl font-bold tracking-tight tabular-nums"
            style={{
              background: "linear-gradient(135deg, #fff 30%, #6b6b80 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {data ? data.total_published.toLocaleString() : "···"}
          </span>
          <span className="text-xs font-medium" style={{ color: "var(--muted-2)" }}>verified articles</span>
        </div>
        <div className="h-5 w-px" style={{ background: "rgba(255,255,255,0.08)" }} />
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.filter((c) => c.value !== "other").map((cat) => {
            const count = data?.by_category[cat.value];
            return (
              <div key={cat.value} className="flex items-center gap-1.5 rounded-full px-3 py-1"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-sm leading-none">{cat.emoji}</span>
                <span className="text-xs font-medium" style={{ color: "var(--muted-2)" }}>{cat.label}</span>
                <span className="text-xs font-bold tabular-nums text-zinc-300">{count ?? "—"}</span>
              </div>
            );
          })}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="glow-pulse h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="text-[11px] font-medium" style={{ color: "var(--muted)" }}>Live · 30 min</span>
          <span className="h-3 w-px" style={{ background: "rgba(255,255,255,0.08)" }} />
          <LiveTimestamp />
        </div>
      </div>

      {/* ── Mobile: total + live on top, pills in 2-col grid ── */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-baseline gap-2">
            <span
              className="stats-total text-3xl font-bold tracking-tight tabular-nums"
              style={{
                background: "linear-gradient(135deg, #fff 30%, #6b6b80 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {data ? data.total_published.toLocaleString() : "···"}
            </span>
            <span className="text-xs font-medium" style={{ color: "var(--muted-2)" }}>verified articles</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="glow-pulse h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-medium" style={{ color: "var(--muted)" }}>Live · 30 min</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.filter((c) => c.value !== "other").map((cat) => {
            const count = data?.by_category[cat.value];
            return (
              <div key={cat.value} className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-sm leading-none">{cat.emoji}</span>
                <span className="text-xs font-medium" style={{ color: "var(--muted-2)" }}>{cat.label}</span>
                <span className="ml-auto text-xs font-bold tabular-nums text-zinc-300">{count ?? "—"}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
