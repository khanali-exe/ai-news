"use client";
import { useState } from "react";
import { Sparkles, ChevronDown, Loader2 } from "lucide-react";
import { API_BASE } from "@/lib/constants";

interface ExplainResult {
  what: string;
  analogy: string;
  why_it_matters: string;
}

const SECTIONS = [
  { key: "what",           label: "What happened",   emoji: "📌" },
  { key: "analogy",        label: "Think of it like", emoji: "💡" },
  { key: "why_it_matters", label: "Why it matters",   emoji: "🎯" },
] as const;

export function ExplainButton({ slug, accentColor = "#7c3aed" }: { slug: string; accentColor?: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<ExplainResult | null>(null);
  const [open, setOpen] = useState(false);

  async function handleClick() {
    if (state === "done") { setOpen(!open); return; }
    setState("loading");
    try {
      const res = await fetch(`${API_BASE}/api/v1/articles/${slug}/explain`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setResult(data);
      setState("done");
      setOpen(true);
    } catch {
      setState("error");
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={state === "loading"}
        className="group flex w-full items-center gap-3 rounded-2xl px-5 py-4 text-sm font-medium
                   transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
             style={{ background: `${accentColor}18`, color: accentColor }}>
          {state === "loading"
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Sparkles className="h-4 w-4" />}
        </div>

        <div className="flex-1 text-left">
          <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
            {state === "loading" ? "Simplifying…" : "Explain this simply"}
          </p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            {state === "idle"
              ? "Like you're 12 — no jargon, just clarity"
              : state === "loading"
              ? "Finding the best analogy…"
              : "Tap to toggle"}
          </p>
        </div>

        {state === "done" && (
          <ChevronDown className={`h-4 w-4 text-zinc-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        )}
      </button>

      {state === "error" && (
        <p className="mt-2 px-1 text-xs text-red-400">Could not generate explanation. Try again.</p>
      )}

      {state === "done" && open && result && (
        <div className="mt-3 overflow-hidden rounded-2xl fade-up"
             style={{ background: `${accentColor}08`, border: `1px solid ${accentColor}20` }}>
          <div className="px-5 py-5 space-y-4">
            {SECTIONS.map(({ key, label, emoji }) => (
              <div key={key}>
                <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest"
                   style={{ color: accentColor, opacity: 0.7 }}>
                  <span>{emoji}</span>
                  {label}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)", opacity: 0.85 }}>
                  {result[key]}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
