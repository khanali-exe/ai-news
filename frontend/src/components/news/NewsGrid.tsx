"use client";
import { useState, useEffect } from "react";
import { useArticles } from "@/lib/hooks/useArticles";
import { NewsCard } from "./NewsCard";
import { NewsCardSkeleton } from "./NewsCardSkeleton";
import { SearchX, WifiOff, Sparkles, ChevronDown } from "lucide-react";
import type { FilterState, ArticleList } from "@/types";

interface Props {
  filters: FilterState;
  onPageChange?: (page: number) => void;
  onMutateReady?: (fn: () => void) => void;
  onArticlesChange?: (articles: ArticleList[]) => void;
  focusedSlug?: string | null;
}

export function NewsGrid({ filters, onMutateReady, onArticlesChange, focusedSlug }: Props) {
  const [page, setPage]               = useState(1);
  const [allArticles, setAllArticles] = useState<ArticleList[]>([]);
  const [prevCount, setPrevCount]     = useState(0);
  const [maxId, setMaxId]             = useState<number | null>(null);

  const filterKey = `${filters.category}|${filters.search}|${filters.dateFilter}|${filters.sourceId}`;

  useEffect(() => {
    setPage(1);
    setAllArticles([]);
    setPrevCount(0);
    setMaxId(null);
  }, [filterKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data, error, isLoading, isValidating, mutate } = useArticles({ ...filters, page, maxId });

  useEffect(() => {
    onMutateReady?.(() => {
      setAllArticles([]);
      setPrevCount(0);
      setPage(1);
      setMaxId(null);
      mutate();
    });
  }, [mutate, onMutateReady]);

  useEffect(() => {
    if (!data?.items || data.items.length === 0) return;

    if (page === 1) {
      // Snapshot the highest ID so subsequent pages use it as a ceiling cursor
      const topId = Math.max(...data.items.map((a) => a.id));
      setMaxId(topId);
      setPrevCount(0);
      setAllArticles(data.items);
    } else {
      setAllArticles((prev) => {
        // Deduplicate by id — safety net against any cursor edge cases
        const seen = new Set(prev.map((a) => a.id));
        const fresh = data.items.filter((a) => !seen.has(a.id));
        setPrevCount(prev.length);
        return fresh.length > 0 ? [...prev, ...fresh] : prev;
      });
    }
  }, [data?.items, page]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (allArticles.length > 0) onArticlesChange?.(allArticles);
  }, [allArticles, onArticlesChange]);

  const canLoadMore = data ? page < data.total_pages : false;
  const isFetching  = isLoading || isValidating;

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error && allArticles.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-28 text-center fade-up">
        <WifiOff className="h-10 w-10 text-zinc-700" />
        <p className="text-sm font-medium text-zinc-400">Unable to load articles</p>
        <p className="text-xs" style={{ color: "var(--muted)" }}>Check your connection or try again shortly.</p>
      </div>
    );
  }

  // ── Initial skeleton ───────────────────────────────────────────────────────
  if (isLoading && allArticles.length === 0) {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="h-3 w-32 rounded animate-pulse" style={{ background: "var(--surface-2)" }} />
          <div className="h-3 w-16 rounded animate-pulse" style={{ background: "var(--surface-2)" }} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NewsCardSkeleton featured />
          {Array.from({ length: 8 }).map((_, i) => <NewsCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  // ── Empty ──────────────────────────────────────────────────────────────────
  if (!isFetching && allArticles.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-28 text-center fade-up">
        <SearchX className="h-10 w-10 text-zinc-700" />
        <p className="text-sm font-medium text-zinc-400">No articles found</p>
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          {filters.search ? `No results for "${filters.search}"` : "Try a different category."}
        </p>
      </div>
    );
  }

  const [featured, ...rest] = allArticles;

  return (
    <div>
      {/* Count bar */}
      {data && (
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            <span className="font-semibold text-zinc-400">{data.total.toLocaleString()}</span>{" "}
            verified articles
            {filters.category ? ` · ${filters.category}` : ""}
            {filters.search ? ` matching "${filters.search}"` : ""}
          </p>
          <p className="text-xs tabular-nums" style={{ color: "var(--muted)" }}>
            {allArticles.length} / {data.total}
          </p>
        </div>
      )}

      {/* Grid — new cards stagger from their position in the batch */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {featured && (
          <NewsCard
            article={featured}
            featured
            focused={focusedSlug === featured.slug}
            batchIndex={0 >= prevCount ? 0 - prevCount : null}
          />
        )}
        {rest.map((a, i) => (
          <NewsCard
            key={a.id}
            article={a}
            focused={focusedSlug === a.slug}
            batchIndex={(i + 1) >= prevCount ? (i + 1) - prevCount : null}
          />
        ))}
      </div>

      {/* Load More button */}
      <div className="mt-10 flex flex-col items-center gap-3">
        {canLoadMore && (
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={isFetching}
            className="flex items-center gap-2 rounded-2xl px-8 py-3 text-sm font-semibold transition-all duration-200
                       hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-hover)",
              color: "var(--muted-2)",
            }}
          >
            {isFetching && allArticles.length > 0 ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                Loading…
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Load more articles
              </>
            )}
          </button>
        )}

        {!canLoadMore && allArticles.length > 0 && (
          <div className="flex flex-col items-center gap-2 py-4 fade-up">
            <div className="flex items-center gap-2 rounded-full px-4 py-2"
                 style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <Sparkles className="h-3.5 w-3.5 text-brand-400" />
              <span className="text-xs font-medium" style={{ color: "var(--muted-2)" }}>
                You've read all {allArticles.length} verified articles
              </span>
            </div>
            <p className="text-[11px]" style={{ color: "var(--muted)", opacity: 0.5 }}>
              New articles are added every 30 minutes
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
