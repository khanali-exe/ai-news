"use client";
import { useRef, useState, useEffect } from "react";
import useSWR from "swr";
import { ChevronDown, Calendar, Radio } from "lucide-react";
import { CATEGORIES, API_BASE } from "@/lib/constants";
import { swrFetcher } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { FilterState } from "@/types";

interface Props {
  filters: FilterState;
  onChange: (update: Partial<FilterState>) => void;
}

const DATE_OPTIONS = [
  { value: "",       label: "All time" },
  { value: "today",  label: "Last 24h" },
  { value: "week",   label: "This week" },
  { value: "month",  label: "This month" },
];

interface Source { id: number; name: string; trust_tier: string; }

function Dropdown({
  label,
  icon,
  active,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-150 border",
          active
            ? "border-brand-500/40 bg-brand-500/15 text-brand-400"
            : "border-[var(--border)] text-[var(--muted-2)] hover:border-[var(--border-hover)] hover:text-[var(--text)]"
        )}
      >
        {icon}
        {label}
        <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 z-50 mt-1.5 min-w-[160px] overflow-hidden rounded-xl shadow-xl fade-up"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border-hover)",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function DropdownItem({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-medium transition-colors hover:bg-white/5"
      style={{ color: active ? "var(--text)" : "var(--muted-2)" }}
    >
      {children}
      {active && (
        <span className="h-1.5 w-1.5 rounded-full bg-brand-400 shrink-0" />
      )}
    </button>
  );
}

export function FilterBar({ filters, onChange }: Props) {
  const { data: sources } = useSWR<Source[]>(
    `${API_BASE}/api/v1/sources`,
    swrFetcher,
    { revalidateOnFocus: false }
  );

  const activeDateLabel = DATE_OPTIONS.find((d) => d.value === filters.dateFilter)?.label ?? "All time";
  const activeSourceLabel = sources?.find((s) => String(s.id) === filters.sourceId)?.name ?? "All sources";

  return (
    <div className="flex flex-wrap items-center gap-2">

      {/* ── Category pills ── */}
      <button
        onClick={() => onChange({ category: "", page: 1 })}
        className={cn(
          "rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-150 border",
          !filters.category
            ? "border-brand-500/40 bg-brand-500/15 text-brand-400"
            : "border-[var(--border)] text-[var(--muted-2)] hover:border-[var(--border-hover)] hover:text-[var(--text)]"
        )}
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
              : "border-[var(--border)] text-[var(--muted-2)] hover:border-[var(--border-hover)] hover:text-[var(--text)]"
          )}
        >
          <span className="mr-1">{cat.emoji}</span>{cat.label}
        </button>
      ))}

      {/* ── Divider ── */}
      <div className="hidden h-4 w-px sm:block" style={{ background: "var(--border-hover)" }} />

      {/* ── Date filter dropdown ── */}
      <Dropdown
        label={activeDateLabel}
        icon={<Calendar className="h-3 w-3" />}
        active={!!filters.dateFilter}
      >
        {DATE_OPTIONS.map((opt) => (
          <DropdownItem
            key={opt.value}
            active={filters.dateFilter === opt.value}
            onClick={() => onChange({ dateFilter: opt.value, page: 1 })}
          >
            {opt.label}
          </DropdownItem>
        ))}
      </Dropdown>

      {/* ── Source filter dropdown ── */}
      {sources && sources.length > 0 && (
        <Dropdown
          label={activeSourceLabel}
          icon={<Radio className="h-3 w-3" />}
          active={!!filters.sourceId}
        >
          <DropdownItem
            active={!filters.sourceId}
            onClick={() => onChange({ sourceId: "", page: 1 })}
          >
            All sources
          </DropdownItem>
          {sources.map((src) => {
            const display = src.name
              .replace("Google DeepMind Blog", "DeepMind")
              .replace("Microsoft Research Blog", "MS Research")
              .replace(" Blog", "")
              .replace(" AI", "");
            return (
              <DropdownItem
                key={src.id}
                active={filters.sourceId === String(src.id)}
                onClick={() => onChange({ sourceId: String(src.id), page: 1 })}
              >
                {display}
              </DropdownItem>
            );
          })}
        </Dropdown>
      )}

      {/* ── Active filter chips ── */}
      {(filters.dateFilter || filters.sourceId) && (
        <button
          onClick={() => onChange({ dateFilter: "", sourceId: "", page: 1 })}
          className="rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors"
          style={{
            background: "rgba(220,38,38,0.08)",
            border: "1px solid rgba(220,38,38,0.2)",
            color: "#f87171",
          }}
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
