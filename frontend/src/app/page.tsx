"use client";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { NewsGrid } from "@/components/news/NewsGrid";
import { FilterBar } from "@/components/filters/FilterBar";
import { StatsBar } from "@/components/news/StatsBar";
import { TrendingSection } from "@/components/news/TrendingSection";
import { NewArticlesBanner } from "@/components/news/NewArticlesBanner";
import { useBookmarks } from "@/hooks/useBookmarks";
import { API_BASE } from "@/lib/constants";
import { swrFetcher } from "@/lib/api";
import type { FilterState, ArticleList } from "@/types";

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const gridMutateRef = useRef<(() => void) | null>(null);
  const articlesRef = useRef<ArticleList[]>([]);
  const focusedIdxRef = useRef(-1);
  const [focusedSlug, setFocusedSlug] = useState<string | null>(null);
  const [showKeyHint, setShowKeyHint] = useState(false);
  const { toggle: toggleBookmark } = useBookmarks();
  const { data: stats } = useSWR<{ total_published: number }>(
    `${API_BASE}/api/v1/articles/stats`, swrFetcher, { revalidateOnFocus: false, refreshInterval: 120000 }
  );

  const [filters, setFilters] = useState<FilterState>({
    category: searchParams.get("category") ?? "",
    search: searchParams.get("search") ?? "",
    page: 1,
  });

  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      search: searchParams.get("search") ?? "",
      category: searchParams.get("category") ?? prev.category,
      page: 1,
    }));
  }, [searchParams]);

  function updateFilters(update: Partial<FilterState>) {
    const next = { ...filters, ...update };
    setFilters(next);
    const params = new URLSearchParams();
    if (next.category) params.set("category", next.category);
    if (next.search) params.set("search", next.search);
    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : "/", { scroll: false });
  }

  function handleRefresh() {
    setFilters(prev => ({ ...prev, page: 1 }));
    gridMutateRef.current?.();
  }

  const handleArticlesChange = useCallback((articles: ArticleList[]) => {
    articlesRef.current = articles;
    // Reset focus when articles change
    focusedIdxRef.current = -1;
    setFocusedSlug(null);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Don't capture when typing
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      const articles = articlesRef.current;

      if (e.key === "j" || e.key === "J") {
        e.preventDefault();
        setShowKeyHint(true);
        const next = Math.min(focusedIdxRef.current + 1, articles.length - 1);
        focusedIdxRef.current = next;
        setFocusedSlug(articles[next]?.slug ?? null);
        // Scroll into view
        const el = document.querySelector(`[data-slug="${articles[next]?.slug}"]`);
        el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      } else if (e.key === "k" || e.key === "K") {
        e.preventDefault();
        setShowKeyHint(true);
        const next = Math.max(focusedIdxRef.current - 1, 0);
        focusedIdxRef.current = next;
        setFocusedSlug(articles[next]?.slug ?? null);
        const el = document.querySelector(`[data-slug="${articles[next]?.slug}"]`);
        el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      } else if (e.key === "Enter" && focusedIdxRef.current >= 0) {
        const a = articles[focusedIdxRef.current];
        if (a) router.push(`/article/${a.slug}`);
      } else if ((e.key === "b" || e.key === "B") && focusedIdxRef.current >= 0) {
        const a = articles[focusedIdxRef.current];
        if (a) toggleBookmark(a);
      } else if (e.key === "Escape") {
        focusedIdxRef.current = -1;
        setFocusedSlug(null);
        setShowKeyHint(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [router, toggleBookmark]);

  return (
    <div>
      {/* New articles floating banner */}
      <NewArticlesBanner onRefresh={handleRefresh} />

      {/* Hero */}
      <div className="mb-8 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-medium text-brand-400"
             style={{ background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.15)" }}>
          <span className="glow-pulse h-1.5 w-1.5 bg-brand-400 rounded-full" />
          {stats ? `${stats.total_published.toLocaleString()} verified articles` : "Verified · Fact-checked · Auto-updated every 30 min"}
        </div>
        <p className="mt-1.5 text-sm" style={{ color: "var(--muted)" }}>
          Only verified news from primary sources — OpenAI, DeepMind, Anthropic, Meta AI, and more.
        </p>
      </div>

      <StatsBar />

      <TrendingSection />

      {/* <div className="mb-6">
        <SubscribeForm />
      </div> */}

      <div className="mb-6">
        <FilterBar filters={filters} onChange={updateFilters} />
      </div>

      {filters.search && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-zinc-400">
            Searching: <span className="font-medium text-white">"{filters.search}"</span>
          </span>
          <button
            onClick={() => updateFilters({ search: "", page: 1 })}
            className="text-xs text-zinc-600 hover:text-zinc-400 underline underline-offset-2 transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      <NewsGrid
        filters={filters}
        onMutateReady={(fn) => { gridMutateRef.current = fn; }}
        onArticlesChange={handleArticlesChange}
        focusedSlug={focusedSlug}
      />

      {/* Keyboard nav hint */}
      {showKeyHint && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-full px-5 py-2.5 text-[11px] font-medium fade-up"
             style={{ background: "rgba(13,14,18,0.95)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(12px)", color: "var(--muted-2)" }}>
          <span><kbd className="rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ background: "rgba(255,255,255,0.08)" }}>J</kbd> / <kbd className="rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ background: "rgba(255,255,255,0.08)" }}>K</kbd> navigate</span>
          <span className="opacity-30">·</span>
          <span><kbd className="rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ background: "rgba(255,255,255,0.08)" }}>Enter</kbd> open</span>
          <span className="opacity-30">·</span>
          <span><kbd className="rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ background: "rgba(255,255,255,0.08)" }}>B</kbd> bookmark</span>
          <span className="opacity-30">·</span>
          <span><kbd className="rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ background: "rgba(255,255,255,0.08)" }}>Esc</kbd> clear</span>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
