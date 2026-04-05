"use client";
import useSWR from "swr";
import { API_BASE, swrFetcher } from "@/lib/api";
import { NewsCard } from "./NewsCard";
import type { PaginatedArticles, Category } from "@/types";

interface Props {
  category: Category;
  currentSlug: string;
}

export function RelatedArticles({ category, currentSlug }: Props) {
  const { data } = useSWR<PaginatedArticles>(
    `${API_BASE}/api/v1/articles?category=${category}&page_size=6`,
    swrFetcher,
    { revalidateOnFocus: false }
  );

  if (!data) return null;

  const related = data.items.filter((a) => a.slug !== currentSlug).slice(0, 3);
  if (related.length === 0) return null;

  return (
    <div className="mt-10 fade-up">
      <div className="mb-4 flex items-center gap-3">
        <div className="h-px flex-1" style={{ background: "var(--border)" }} />
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
          More in {category}
        </span>
        <div className="h-px flex-1" style={{ background: "var(--border)" }} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 stagger">
        {related.map((a) => (
          <NewsCard key={a.slug} article={a} />
        ))}
      </div>
    </div>
  );
}
