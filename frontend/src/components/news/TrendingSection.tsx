"use client";
import useSWR from "swr";
import Link from "next/link";
import { Flame, ArrowUpRight } from "lucide-react";
import { API_BASE, swrFetcher } from "@/lib/api";
import { CategoryPill } from "./CategoryPill";
import { BookmarkButton } from "@/components/ui/BookmarkButton";
import { formatDate } from "@/lib/utils";
import type { ArticleList } from "@/types";

const CAT_COLOR: Record<string, string> = {
  models:   "#7c3aed",
  research: "#2563eb",
  tools:    "#059669",
  business: "#d97706",
  policy:   "#dc2626",
  other:    "#0ea5e9",
};

export function TrendingSection() {
  const { data, isLoading } = useSWR<ArticleList[]>(
    `${API_BASE}/api/v1/articles/trending`,
    swrFetcher,
    { revalidateOnFocus: false, refreshInterval: 600_000 }
  );

  if (isLoading || !data || data.length === 0) return null;

  return (
    <section className="mb-8">
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <Flame className="h-4 w-4 text-orange-400" />
          <span className="text-sm font-semibold text-white">Today's Updates</span>
        </div>
        <span className="text-xs" style={{ color: "var(--muted)" }}>
          · published today
        </span>
      </div>

      {/* Horizontal scroll row */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
        {data.map((article) => (
          <TrendingCard key={article.slug} article={article} />
        ))}
      </div>
    </section>
  );
}

function TrendingCard({ article }: { article: ArticleList }) {
  const cat = article.category ?? "other";
  const accent = CAT_COLOR[cat] ?? CAT_COLOR.other;

  return (
    <Link
      href={`/article/${article.slug}`}
      className="group relative flex w-64 shrink-0 flex-col rounded-2xl overflow-hidden transition-all duration-200
                 hover:-translate-y-1 focus-visible:outline-none"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        boxShadow: `inset 0 0 40px ${accent}08`,
      }}
    >
      {/* Top accent bar */}
      <div className="h-[2px] w-full shrink-0" style={{ background: accent, opacity: 0.7 }} />

      <div className="flex flex-1 flex-col p-4">
        {/* Category + time */}
        <div className="mb-2 flex items-center justify-between gap-1">
          {article.category && <CategoryPill category={article.category} />}
          <span className="shrink-0 text-[10px]" style={{ color: "var(--muted)" }}>
            {formatDate(article.published_at)}
          </span>
        </div>

        {/* Title */}
        <p className="mb-3 text-xs font-semibold leading-snug text-zinc-300 line-clamp-3 group-hover:text-white transition-colors">
          {article.title}
        </p>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between">
          <span className="truncate text-[10px]" style={{ color: "var(--muted)" }}>
            {article.source?.name ?? ""}
          </span>
          <div className="flex items-center gap-1">
            <BookmarkButton article={article} size="sm" />
            <ArrowUpRight className="h-3 w-3 text-zinc-700 group-hover:text-brand-400 transition-colors" />
          </div>
        </div>
      </div>
    </Link>
  );
}
