"use client";
import { useState } from "react";
import { Sparkles, ChevronDown, Loader2 } from "lucide-react";
import { API_BASE } from "@/lib/constants";

export function ExplainButton({ slug, accentColor = "#7c3aed" }: { slug: string; accentColor?: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [explanation, setExplanation] = useState("");
  const [open, setOpen] = useState(false);

  async function handleClick() {
    if (state === "done") { setOpen(!open); return; }
    setState("loading");
    try {
      const res = await fetch(`${API_BASE}/api/v1/articles/${slug}/explain`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setExplanation(data.explanation);
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
        {/* Icon */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
             style={{ background: `${accentColor}18`, color: accentColor }}>
          {state === "loading"
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Sparkles className="h-4 w-4" />}
        </div>

        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-zinc-300">
            {state === "loading" ? "Generating…" : "Explain this simply"}
          </p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            {state === "idle" ? "Plain English, no jargon" : state === "loading" ? "Using AI to simplify…" : "Tap to toggle"}
          </p>
        </div>

        {state === "done" && (
          <ChevronDown className={`h-4 w-4 text-zinc-600 transition-transform ${open ? "rotate-180" : ""}`} />
        )}
      </button>

      {state === "error" && (
        <p className="mt-2 px-1 text-xs text-red-400">Could not generate explanation. Try again.</p>
      )}

      {state === "done" && open && (
        <div className="mt-2 overflow-hidden rounded-2xl fade-up"
             style={{ background: `${accentColor}0a`, border: `1px solid ${accentColor}25` }}>
          <div className="px-5 py-5">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: accentColor, opacity: 0.6 }}>
              Plain English
            </p>
            <p className="text-sm leading-relaxed text-zinc-300">{explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
}
