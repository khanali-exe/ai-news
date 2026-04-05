import { Zap } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-20" style={{ borderTop: "1px solid var(--border)" }}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-600">
            <Zap className="h-3 w-3 text-brand-500" />
            AI Intelligence Hub — Verified AI news only
          </div>
          <p className="text-[11px] text-zinc-700">
            Summaries are AI-generated · Always read the original source
          </p>
        </div>
      </div>
    </footer>
  );
}
