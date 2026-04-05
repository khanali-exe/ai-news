"use client";
import { useState, useEffect, useCallback } from "react";
import type { BookmarkedArticle, ArticleList } from "@/types";

const KEY = "ainews_bookmarks";
const EVENT = "ainews_bookmarks_change";

// ── Module-level singleton ─────────────────────────────────────────────────
// Loaded once, shared across every hook instance. No per-component useEffect
// delay, no race between instances.

function readStorage(): BookmarkedArticle[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

function writeStorage(items: BookmarkedArticle[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  // Notify every mounted hook instance in this tab
  window.dispatchEvent(new CustomEvent(EVENT, { detail: items }));
}

// Initialise eagerly (runs once when the module is first imported)
let _store: BookmarkedArticle[] = readStorage();

function getStore() { return _store; }

function setStore(next: BookmarkedArticle[]) {
  _store = next;
  writeStorage(next);
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useBookmarks() {
  // Start with the already-loaded singleton — no flash, no delay
  const [bookmarks, setBookmarks] = useState<BookmarkedArticle[]>(getStore);

  useEffect(() => {
    // Sync when another instance mutates the store
    function onUpdate(e: Event) {
      setBookmarks((e as CustomEvent<BookmarkedArticle[]>).detail);
    }
    window.addEventListener(EVENT, onUpdate);

    // Also sync on cross-tab storage changes
    function onStorage(e: StorageEvent) {
      if (e.key === KEY) {
        const next = readStorage();
        _store = next;
        setBookmarks(next);
      }
    }
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener(EVENT, onUpdate);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const isBookmarked = useCallback(
    (slug: string) => bookmarks.some((b) => b.slug === slug),
    [bookmarks]
  );

  const toggle = useCallback((article: ArticleList) => {
    const current = getStore();
    const exists = current.some((b) => b.slug === article.slug);
    const next = exists
      ? current.filter((b) => b.slug !== article.slug)
      : [
          ...current,
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
    setStore(next);
  }, []);

  const remove = useCallback((slug: string) => {
    setStore(getStore().filter((b) => b.slug !== slug));
  }, []);

  return { bookmarks, isBookmarked, toggle, remove };
}
