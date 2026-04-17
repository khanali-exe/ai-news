"use client";
import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import type { BookmarkedArticle, ArticleList } from "@/types";

const LS_KEY = "ainews_bookmarks";
const LS_EVENT = "ainews_bookmarks_change";

function readLocalStorage(): BookmarkedArticle[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]"); }
  catch { return []; }
}

function writeLocalStorage(items: BookmarkedArticle[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(LS_EVENT, { detail: items }));
}

export function useBookmarks() {
  const { user, isSignedIn, isLoaded } = useUser();
  const [bookmarks, setBookmarks] = useState<BookmarkedArticle[]>([]);

  // Load bookmarks once auth state is known
  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn && user) {
      const clerkBookmarks =
        (user.unsafeMetadata?.bookmarks as BookmarkedArticle[]) ?? [];

      // Merge any bookmarks saved while logged out
      const local = readLocalStorage();
      if (local.length > 0) {
        const merged = [...clerkBookmarks];
        for (const lb of local) {
          if (!merged.some((b) => b.slug === lb.slug)) merged.push(lb);
        }
        user.update({ unsafeMetadata: { ...user.unsafeMetadata, bookmarks: merged } });
        localStorage.removeItem(LS_KEY);
        setBookmarks(merged);
      } else {
        setBookmarks(clerkBookmarks);
      }
    } else {
      // Not signed in — use localStorage, and listen for cross-tab changes
      setBookmarks(readLocalStorage());
    }
  }, [isLoaded, isSignedIn, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cross-tab sync for localStorage (signed-out only)
  useEffect(() => {
    if (isSignedIn) return;
    function onCustom(e: Event) {
      setBookmarks((e as CustomEvent<BookmarkedArticle[]>).detail);
    }
    function onStorage(e: StorageEvent) {
      if (e.key === LS_KEY) setBookmarks(readLocalStorage());
    }
    window.addEventListener(LS_EVENT, onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(LS_EVENT, onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, [isSignedIn]);

  const isBookmarked = useCallback(
    (slug: string) => bookmarks.some((b) => b.slug === slug),
    [bookmarks]
  );

  const toggle = useCallback(
    async (article: ArticleList) => {
      const exists = bookmarks.some((b) => b.slug === article.slug);
      const next = exists
        ? bookmarks.filter((b) => b.slug !== article.slug)
        : [
            ...bookmarks,
            {
              slug: article.slug,
              title: article.title,
              tl_dr: article.tl_dr,
              category: article.category,
              source_name: article.source?.name ?? null,
              source_domain: article.source?.domain ?? null,
              published_at: article.published_at,
              savedAt: new Date().toISOString(),
            },
          ];

      setBookmarks(next);

      if (isSignedIn && user) {
        await user.update({ unsafeMetadata: { ...user.unsafeMetadata, bookmarks: next } });
      } else {
        writeLocalStorage(next);
      }
    },
    [bookmarks, isSignedIn, user]
  );

  const remove = useCallback(
    async (slug: string) => {
      const next = bookmarks.filter((b) => b.slug !== slug);
      setBookmarks(next);
      if (isSignedIn && user) {
        await user.update({ unsafeMetadata: { ...user.unsafeMetadata, bookmarks: next } });
      } else {
        writeLocalStorage(next);
      }
    },
    [bookmarks, isSignedIn, user]
  );

  return { bookmarks, isBookmarked, toggle, remove };
}
