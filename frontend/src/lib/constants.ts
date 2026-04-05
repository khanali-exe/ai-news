export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const CATEGORIES = [
  { value: "models",   label: "Models",   emoji: "🧠", color: "bg-violet-500/15 text-violet-300 border-violet-500/30" },
  { value: "research", label: "Research", emoji: "🔬", color: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
  { value: "tools",    label: "Tools",    emoji: "🛠", color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  { value: "business", label: "Business", emoji: "📈", color: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  { value: "policy",   label: "Policy",   emoji: "⚖️", color: "bg-rose-500/15 text-rose-300 border-rose-500/30" },
  { value: "other",    label: "Other",    emoji: "💡", color: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30" },
] as const;

export const PAGE_SIZE = 12;
