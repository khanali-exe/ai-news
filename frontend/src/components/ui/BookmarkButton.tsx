"use client";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useBookmarks } from "@/hooks/useBookmarks";
import type { ArticleList } from "@/types";

export function BookmarkButton({
  article,
  size = "sm",
}: {
  article: ArticleList;
  size?: "sm" | "md";
}) {
  const { isBookmarked, toggle } = useBookmarks();
  const saved = isBookmarked(article.slug);

  const iconCls = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const btnCls  = size === "sm" ? "h-7 w-7"     : "h-8 w-8";

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(article);
      }}
      title={saved ? "Remove bookmark" : "Save article"}
      className={`flex items-center justify-center rounded-lg transition-all duration-150 active:scale-90
                  ${btnCls}
                  ${saved
                    ? "text-brand-400 bg-brand-500/10 hover:bg-brand-500/20"
                    : "text-zinc-600 hover:text-zinc-300 hover:bg-white/5"
                  }`}
    >
      {saved
        ? <BookmarkCheck className={`${iconCls} transition-transform duration-150`} />
        : <Bookmark      className={`${iconCls} transition-transform duration-150`} />}
    </button>
  );
}
