import type { ArticleDetail, ArticleList, PaginatedArticles, CategoryCount } from "@/types";

// Client-side (browser) uses the public URL
export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Server-side (Next.js SSR/RSC) uses the internal Docker URL when available
const SERVER_API =
  typeof window === "undefined"
    ? (process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000")
    : API_BASE;

class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const base = typeof window === "undefined" ? SERVER_API : API_BASE;
  const res = await fetch(`${base}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new APIError(res.status, text);
  }
  return res.json() as Promise<T>;
}

export async function fetchArticles(params: {
  category?: string;
  page?: number;
  page_size?: number;
}): Promise<PaginatedArticles> {
  const q = new URLSearchParams();
  q.set("verification_status", "verified");
  if (params.category) q.set("category", params.category);
  q.set("page", String(params.page ?? 1));
  q.set("page_size", String(params.page_size ?? 12));
  return apiFetch<PaginatedArticles>(`/api/v1/articles?${q.toString()}`);
}

export async function fetchArticle(slug: string): Promise<ArticleDetail> {
  return apiFetch<ArticleDetail>(`/api/v1/articles/${slug}`);
}

export async function fetchCategories(): Promise<CategoryCount[]> {
  return apiFetch<CategoryCount[]>("/api/v1/articles/categories");
}

export async function fetchTrending(): Promise<ArticleList[]> {
  return apiFetch<ArticleList[]>("/api/v1/articles/trending");
}

// SWR fetcher — always uses the public (browser) URL
export const swrFetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new APIError(r.status, "Fetch failed");
    return r.json();
  });
