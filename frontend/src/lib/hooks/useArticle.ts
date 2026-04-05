"use client";
import useSWR from "swr";
import { API_BASE } from "@/lib/constants";
import { swrFetcher } from "@/lib/api";
import type { ArticleDetail } from "@/types";

export function useArticle(slug: string) {
  const url = `${API_BASE}/api/v1/articles/${slug}`;
  const { data, error, isLoading } = useSWR<ArticleDetail>(url, swrFetcher, {
    revalidateOnFocus: false,
  });
  return { article: data, error, isLoading };
}
