import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/lib/constants";

export function getCategoryMeta(category: string | null) {
  return CATEGORIES.find((c) => c.value === category) ?? {
    value: "other", label: category ?? "Other", emoji: "💡",
    color: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
  };
}

export function CategoryPill({ category }: { category: string | null }) {
  if (!category) return null;
  const meta = getCategoryMeta(category);
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
      meta.color
    )}>
      <span>{meta.emoji}</span>
      {meta.label}
    </span>
  );
}
