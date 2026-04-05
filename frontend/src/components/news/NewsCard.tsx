"use client";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CategoryPill } from "./CategoryPill";
import { BookmarkButton } from "@/components/ui/BookmarkButton";
import { formatDate } from "@/lib/utils";
import type { ArticleList } from "@/types";

const CAT_ACCENT: Record<string, { top: string; glow: string }> = {
  models:   { top: "#7c3aed", glow: "card-glow-models"   },
  research: { top: "#2563eb", glow: "card-glow-research"  },
  tools:    { top: "#059669", glow: "card-glow-tools"     },
  business: { top: "#d97706", glow: "card-glow-business"  },
  policy:   { top: "#dc2626", glow: "card-glow-policy"    },
  other:    { top: "#0ea5e9", glow: "card-glow-other"     },
};

export function NewsCard({ article, featured = false, focused = false, batchIndex = null }: {
  article: ArticleList;
  featured?: boolean;
  focused?: boolean;
  batchIndex?: number | null;  // position within newly loaded batch — drives stagger delay
}) {
  const cat = article.category ?? "other";
  const accent = CAT_ACCENT[cat] ?? CAT_ACCENT.other;
  const faviconUrl = article.source?.domain
    ? `https://www.google.com/s2/favicons?domain=${article.source.domain}&sz=32`
    : null;

  // Stagger delay: cap at 8 cards (440ms max) so late cards don't wait too long
  const delay = batchIndex !== null
    ? `${Math.min(batchIndex, 8) * 55}ms`
    : undefined;

  return (
    <Link
      href={`/article/${article.slug}`}
      className={`card ${accent.glow} group relative flex flex-col rounded-2xl overflow-hidden
                  fade-up focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40
                  ${featured ? "sm:col-span-2 lg:col-span-2" : ""}
                  ${focused ? "ring-2 ring-brand-400/60 -translate-y-1" : ""}`}
      style={{ animationDelay: delay }}
      data-slug={article.slug}
    >
      {/* Category accent top bar */}
      <div className="h-[2px] w-full shrink-0" style={{ background: accent.top, opacity: 0.7 }} />

      <div className="flex flex-1 flex-col p-5">
        {/* Top row */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {article.source?.trust_tier === "primary" && (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-brand-300"
                style={{ background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.2)" }}
              >
                ● Primary
              </span>
            )}
            {article.category && <CategoryPill category={article.category} />}
          </div>
          <span className="shrink-0 text-[11px] font-medium" style={{ color: "var(--muted-2)" }}>
            {formatDate(article.published_at)}
          </span>
        </div>

        {/* Title */}
        <h2
          className={`mb-2.5 font-semibold leading-snug text-zinc-300 group-hover:text-white
                      transition-colors ${featured ? "text-base line-clamp-3 sm:text-lg" : "text-sm line-clamp-3"}`}
          style={{ lineHeight: 1.5 }}
        >
          {article.title}
        </h2>

        {/* TL;DR */}
        {article.tl_dr && (
          <p className="mb-4 text-xs leading-relaxed line-clamp-2" style={{ color: "var(--muted)", lineHeight: 1.65 }}>
            {article.tl_dr}
          </p>
        )}

        {/* Footer — source with favicon */}
        <div
          className="mt-auto flex items-center justify-between pt-3"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <div className="flex min-w-0 items-center gap-1.5">
            {faviconUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={faviconUrl}
                alt=""
                width={14}
                height={14}
                className="rounded-sm opacity-70 shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            )}
            <span className="truncate text-[11px] font-medium" style={{ color: "var(--muted)" }}>
              {article.source?.name ?? ""}
            </span>
          </div>
          <div className="ml-2 flex items-center gap-1">
            <BookmarkButton article={article} />
            <span className="flex items-center gap-0.5 text-[11px] text-zinc-700 group-hover:text-brand-400 transition-colors">
              Read <ArrowUpRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
