"use client";
import { CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { FilterState } from "@/types";

interface Props {
  filters: FilterState;
  onChange: (update: Partial<FilterState>) => void;
}

export function FilterBar({ filters, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => onChange({ category: "", page: 1 })}
        className={cn(
          "rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-150 border",
          !filters.category
            ? "border-brand-500/40 bg-brand-500/15 text-brand-300"
            : "text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
        )}
        style={{ borderColor: !filters.category ? undefined : "var(--border)" }}
      >
        All
      </button>

      {CATEGORIES.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onChange({ category: cat.value, page: 1 })}
          className={cn(
            "rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-150 border",
            filters.category === cat.value
              ? cat.color
              : "text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
          )}
          style={{ borderColor: filters.category === cat.value ? undefined : "var(--border)" }}
        >
          <span className="mr-1">{cat.emoji}</span>{cat.label}
        </button>
      ))}
    </div>
  );
}
