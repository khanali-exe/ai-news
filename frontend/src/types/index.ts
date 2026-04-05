export interface SourceInfo {
  id: number;
  name: string;
  domain: string;
  trust_tier: "primary" | "secondary";
}

export type Category = "models" | "research" | "tools" | "business" | "policy" | "other";
export type VerificationStatus = "verified" | "confirmed" | "unverified";

export interface ArticleList {
  id: number;
  title: string;
  slug: string;
  url: string;
  tl_dr: string | null;
  category: Category | null;
  verification_status: VerificationStatus;
  published_at: string | null;
  image_url: string | null;
  source: SourceInfo | null;
}

export interface ArticleDetail extends ArticleList {
  what_happened: string | null;
  why_it_matters: string | null;
  potential_use_case: string | null;
  fact_check_valid: boolean | null;
  fact_check_reason: string | null;
  processed_at: string | null;
}

export interface PaginatedArticles {
  items: ArticleList[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface FilterState {
  category: string;
  search: string;
  page: number;
}

export interface CategoryCount {
  category: Category;
  count: number;
}

export interface BookmarkedArticle {
  slug: string;
  title: string;
  tl_dr: string | null;
  category: Category | null;
  source_name: string | null;
  source_domain: string | null;
  published_at: string | null;
  savedAt: string;
}
