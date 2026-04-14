"use client";
import useSWR from "swr";
import { API_BASE, PAGE_SIZE } from "@/lib/constants";
import { swrFetcher } from "@/lib/api";
import type { FilterState, PaginatedArticles } from "@/types";

export function useArticles(filters: FilterState & { maxId?: number | null }) {
  const params = new URLSearchParams();
  if (filters.category)   params.set("category", filters.category);
  if (filters.search)     params.set("search", filters.search);
  if (filters.dateFilter) params.set("date_from", filters.dateFilter);
  if (filters.sourceId)   params.set("source_id", filters.sourceId);
  params.set("page", String(filters.page));
  params.set("page_size", String(PAGE_SIZE));
  // Freeze result set to prevent pagination drift when new articles arrive
  if (filters.maxId)      params.set("max_id", String(filters.maxId));

  const url = `${API_BASE}/api/v1/articles?${params.toString()}`;

  const { data, error, isLoading, isValidating, mutate } = useSWR<PaginatedArticles>(url, swrFetcher, {
    revalidateOnFocus: false,   // don't re-sort on tab focus
    dedupingInterval: 30000,
    keepPreviousData: true,
    refreshInterval: 0,         // manual refresh only — prevents mid-scroll re-sort
  });

  return { data, error, isLoading, isValidating, mutate };
}

// Separate hook just for total count — used to detect new articles
export function useArticleCount() {
  const url = `${API_BASE}/api/v1/articles/stats`;
  const { data } = useSWR<{ total_published: number }>(url, swrFetcher, {
    refreshInterval: 60000,
    revalidateOnFocus: true,
  });
  return data?.total_published ?? null;
}
