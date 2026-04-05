"use client";
import { useState } from "react";
import { Mail, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { API_BASE } from "@/lib/constants";

export function SubscribeForm() {
  const [email, setEmail]   = useState("");
  const [state, setState]   = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setState("loading");
    setErrMsg("");

    try {
      const res = await fetch(`${API_BASE}/api/v1/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail || "Something went wrong");
      }
      setState("done");
    } catch (err: unknown) {
      setErrMsg(err instanceof Error ? err.message : "Could not subscribe. Try again.");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="flex items-start gap-3 rounded-2xl px-5 py-4 fade-up"
           style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}>
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
        <div>
          <p className="text-sm font-semibold text-emerald-400">Check your inbox</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
            We sent a confirmation link to <span className="text-zinc-400">{email}</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-5 fade-up"
         style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      {/* Header */}
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
             style={{ background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.15)" }}>
          <Mail className="h-3.5 w-3.5 text-brand-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-200">Daily AI Digest</p>
          <p className="text-[11px]" style={{ color: "var(--muted)" }}>
            One email per day — only when new articles drop
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          disabled={state === "loading"}
          className="search-input min-w-0 flex-1 rounded-xl px-3 py-2 text-sm text-zinc-300
                     placeholder-zinc-600 disabled:opacity-50"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
        />
        <button
          type="submit"
          disabled={state === "loading" || !email.trim()}
          className="flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold
                     text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#0ea5e9,#818cf8)" }}
        >
          {state === "loading"
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : "Subscribe"}
        </button>
      </form>

      {state === "error" && (
        <div className="mt-2 flex items-center gap-1.5">
          <AlertCircle className="h-3 w-3 text-red-400" />
          <p className="text-xs text-red-400">{errMsg}</p>
        </div>
      )}

      <p className="mt-2.5 text-[10px]" style={{ color: "var(--muted)", opacity: 0.6 }}>
        No spam · Unsubscribe anytime · Free forever
      </p>
    </div>
  );
}
