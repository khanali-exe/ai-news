"use client";
import Link from "next/link";
import { Bookmark, ArrowLeft, Trash2, ArrowUpRight } from "lucide-react";
import { useBookmarks } from "@/hooks/useBookmarks";
import { CategoryPill } from "@/components/news/CategoryPill";
import { formatDate } from "@/lib/utils";
import type { Category } from "@/types";

const CAT_ACCENT: Record<string, string> = {
  models: "#7c3aed", research: "#2563eb", tools: "#059669",
  business: "#d97706", policy: "#dc2626", other: "#0ea5e9",
};

export default function SavedPage() {
  const { bookmarks, remove } = useBookmarks();

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-300 transition-colors fade-in"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to feed
      </Link>

      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl"
             style={{ background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.2)" }}>
          <Bookmark className="h-5 w-5 text-brand-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Reading List</h1>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            {bookmarks.length === 0
              ? "No saved articles yet"
              : `${bookmarks.length} article${bookmarks.length !== 1 ? "s" : ""} saved`}
          </p>
        </div>
      </div>

      {bookmarks.length === 0 ? (
        <div className="rounded-2xl px-6 py-12 text-center fade-up"
             style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <Bookmark className="mx-auto mb-3 h-8 w-8 text-zinc-700" />
          <p className="text-sm font-medium text-zinc-500">Nothing saved yet</p>
          <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
            Hit the bookmark icon on any article card to save it here
          </p>
          <Link href="/"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-medium text-brand-400 transition-colors hover:bg-brand-500/10"
                style={{ border: "1px solid rgba(14,165,233,0.2)" }}>
            Browse articles
          </Link>
        </div>
      ) : (
        <div className="space-y-3 stagger">
          {[...bookmarks].reverse().map((b) => {
            const accent = CAT_ACCENT[b.category ?? "other"] ?? CAT_ACCENT.other;
            const faviconUrl = b.source_domain
              ? `https://www.google.com/s2/favicons?domain=${b.source_domain}&sz=32`
              : null;

            return (
              <div
                key={b.slug}
                className="group relative rounded-2xl overflow-hidden fade-up"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <div className="h-[2px] w-full" style={{ background: accent, opacity: 0.6 }} />

                <div className="flex items-start gap-4 p-5">
                  <div className="flex-1 min-w-0">
                    <div className="mb-2 flex items-center gap-2">
                      {b.category && <CategoryPill category={b.category as Category} />}
                      <span className="text-[11px]" style={{ color: "var(--muted)" }}>
                        {b.published_at ? formatDate(b.published_at) : ""}
                      </span>
                    </div>

                    <Link href={`/article/${b.slug}`}
                          className="block mb-1.5 text-sm font-semibold leading-snug text-zinc-300 hover:text-white transition-colors line-clamp-2">
                      {b.title}
                    </Link>

                    {b.tl_dr && (
                      <p className="mb-3 text-xs leading-relaxed line-clamp-2" style={{ color: "var(--muted)" }}>
                        {b.tl_dr}
                      </p>
                    )}

                    <div className="flex items-center gap-2">
                      {faviconUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={faviconUrl} alt="" width={12} height={12}
                             className="rounded-sm opacity-60"
                             onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      )}
                      <span className="text-[11px]" style={{ color: "var(--muted)" }}>{b.source_name ?? ""}</span>
                      <span className="text-[10px]" style={{ color: "var(--muted)", opacity: 0.5 }}>
                        · Saved {formatDate(b.savedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <Link href={`/article/${b.slug}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 hover:text-brand-400 hover:bg-brand-500/10 transition-all">
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => remove(b.slug)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-700 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      title="Remove bookmark"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
