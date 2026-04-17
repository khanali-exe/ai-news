import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, CheckCircle2, Zap, TrendingUp, Lightbulb, Calendar, Globe } from "lucide-react";
import { fetchArticle } from "@/lib/api";
import { CategoryPill } from "@/components/news/CategoryPill";
import { ExplainButton } from "@/components/news/ExplainButton";
import { CopyButton } from "@/components/ui/CopyButton";
import { ShareButton } from "@/components/ui/ShareButton";
import { RelatedArticles } from "@/components/news/RelatedArticles";
import { ReadingProgress } from "@/components/ui/ReadingProgress";
import { BackToTop } from "@/components/ui/BackToTop";
import { formatDate, readingTime } from "@/lib/utils";
import type { Metadata } from "next";

interface Props { params: Promise<{ slug: string }>; }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const a = await fetchArticle(slug);
    const desc = a.tl_dr ?? a.what_happened ?? undefined;
    return {
      title: a.title,
      description: desc,
      openGraph: {
        title: a.title,
        description: desc,
        type: "article",
        siteName: "AI Intelligence Hub",
        publishedTime: a.published_at ?? undefined,
      },
      twitter: {
        card: "summary",
        title: a.title,
        description: desc,
      },
    };
  } catch {
    return { title: "Article" };
  }
}

const CAT_THEME: Record<string, {
  gradient: string; accent: string; glow: string;
  label: string; emoji: string;
}> = {
  models:   { gradient: "from-violet-950 via-zinc-950 to-zinc-950",   accent: "#7c3aed", glow: "rgba(124,58,237,0.15)",  label: "Models",   emoji: "🧠" },
  research: { gradient: "from-blue-950 via-zinc-950 to-zinc-950",     accent: "#2563eb", glow: "rgba(37,99,235,0.15)",   label: "Research", emoji: "🔬" },
  tools:    { gradient: "from-emerald-950 via-zinc-950 to-zinc-950",  accent: "#059669", glow: "rgba(5,150,105,0.15)",   label: "Tools",    emoji: "🛠" },
  business: { gradient: "from-amber-950 via-zinc-950 to-zinc-950",    accent: "#d97706", glow: "rgba(217,119,6,0.15)",   label: "Business", emoji: "📈" },
  policy:   { gradient: "from-rose-950 via-zinc-950 to-zinc-950",     accent: "#dc2626", glow: "rgba(220,38,38,0.15)",   label: "Policy",   emoji: "⚖️" },
  other:    { gradient: "from-sky-950 via-zinc-950 to-zinc-950",      accent: "#0ea5e9", glow: "rgba(14,165,233,0.12)",  label: "AI News",  emoji: "💡" },
};

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  let article;
  try { article = await fetchArticle(slug); }
  catch { notFound(); }

  const cat = article.category ?? "other";
  const theme = CAT_THEME[cat] ?? CAT_THEME.other;

  return (
    <>
    <div className="mx-auto max-w-2xl">
      <ReadingProgress accentColor={theme.accent} />
      <BackToTop />

      {/* Back */}
      <Link href="/"
            className="mb-8 inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-300 transition-colors fade-in">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to feed
      </Link>

      {/* ── HERO BANNER ──────────────────────────────────────────── */}
      <div className={`article-hero always-dark relative mb-5 overflow-hidden rounded-3xl bg-gradient-to-br ${theme.gradient} fade-up`}
           style={{ border: `1px solid ${theme.accent}25`, "--cat-accent": theme.accent, "--cat-glow": theme.glow } as React.CSSProperties}>

        {/* Large background emoji */}
        <div className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 select-none text-[120px] opacity-[0.06]">
          {theme.emoji}
        </div>

        {/* Radial glow top-left */}
        <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full"
             style={{ background: `radial-gradient(circle, ${theme.glow}, transparent 70%)` }} />

        <div className="relative p-7 sm:p-9">
          {/* Badges */}
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-emerald-300"
                  style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)" }}>
              <CheckCircle2 className="h-3 w-3" />
              Verified
            </span>
            {article.category && <CategoryPill category={article.category} />}
          </div>

          {/* Title */}
          <h1 className="mb-6 text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">
            {article.title}
          </h1>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            {article.source && (
              <span className="flex items-center gap-1.5">
                <Globe className="h-3 w-3" />
                <span className="font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>{article.source.name}</span>
                {article.source.trust_tier === "primary" && (
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{ background: "rgba(14,165,233,0.15)", border: "1px solid rgba(14,165,233,0.3)", color: "#7dd3fc" }}>
                    Primary
                  </span>
                )}
              </span>
            )}
            {article.published_at && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(article.published_at)}
              </span>
            )}
            <div className="ml-auto flex items-center gap-2">
              <span className="hidden text-[11px] sm:block" style={{ color: "rgba(255,255,255,0.3)" }}>
                {readingTime(article.what_happened, article.why_it_matters, article.potential_use_case)}
              </span>
              <ShareButton title={article.title} accentColor={theme.accent} />
              <CopyButton accentColor={theme.accent} />
              <a href={article.url} target="_blank" rel="noopener noreferrer"
                 className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
                 style={{ background: `${theme.accent}20`, border: `1px solid ${theme.accent}35`, color: theme.accent }}>
                Read original <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── TL;DR ─────────────────────────────────────────────────── */}
      {article.tl_dr && (
        <div className="relative mb-5 overflow-hidden rounded-2xl fade-up" style={{ animationDelay: "50ms" }}>
          {/* Left accent bar */}
          <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: theme.accent }} />

          <div className="px-6 py-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: theme.accent, opacity: 0.8 }}>
              In a nutshell
            </p>
            <p className="text-base font-medium leading-relaxed text-zinc-200 sm:text-lg">
              {article.tl_dr}
            </p>
          </div>
        </div>
      )}

      {/* ── EXPLAIN SIMPLY ────────────────────────────────────────── */}
      <div className="mb-6 fade-up" style={{ animationDelay: "80ms" }}>
        <ExplainButton slug={article.slug} accentColor={theme.accent} />
      </div>

      {/* ── ANALYSIS SECTIONS ─────────────────────────────────────── */}
      <div className="space-y-3 stagger">
        {article.what_happened && (
          <AnalysisCard
            step="01" icon={<Zap className="h-4 w-4" />}
            label="What Happened" content={article.what_happened}
            color={{ bg: "rgba(99,102,241,0.07)", border: "rgba(99,102,241,0.2)", icon: "rgba(99,102,241,0.18)", text: "#a5b4fc" }}
          />
        )}
        {article.why_it_matters && (
          <AnalysisCard
            step="02" icon={<TrendingUp className="h-4 w-4" />}
            label="Why It Matters" content={article.why_it_matters}
            color={{ bg: "rgba(245,158,11,0.07)", border: "rgba(245,158,11,0.2)", icon: "rgba(245,158,11,0.15)", text: "#fbbf24" }}
          />
        )}
        {article.potential_use_case && (
          <AnalysisCard
            step="03" icon={<Lightbulb className="h-4 w-4" />}
            label="Potential Use Case" content={article.potential_use_case}
            color={{ bg: "rgba(16,185,129,0.07)", border: "rgba(16,185,129,0.2)", icon: "rgba(16,185,129,0.15)", text: "#34d399" }}
          />
        )}
      </div>

      {/* ── READ CTA ──────────────────────────────────────────────── */}
      <div className="mt-6 fade-up">
        <a href={article.url} target="_blank" rel="noopener noreferrer"
           className="flex w-full items-center justify-between rounded-2xl px-6 py-5 transition-all duration-200
                      hover:opacity-90 hover:scale-[1.01] active:scale-[0.99]"
           style={{ background: `linear-gradient(135deg, ${theme.accent}cc, ${theme.accent}66)`,
                    border: `1px solid ${theme.accent}40` }}>
          <div>
            <p className="text-xs font-semibold text-white/60 mb-0.5">Continue reading</p>
            <p className="text-sm font-semibold text-white">{article.source?.name ?? "Original article"}</p>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <ExternalLink className="h-4 w-4 text-white" />
          </div>
        </a>
      </div>

      {/* ── FACT CHECK ────────────────────────────────────────────── */}
      {article.fact_check_reason && (
        <div className="mt-3 rounded-2xl px-5 py-4"
             style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
            Fact-Check Note
          </p>
          <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{article.fact_check_reason}</p>
        </div>
      )}

      {article.processed_at && (
        <p className="mt-6 text-center text-[10px]" style={{ color: "#27272a" }}>
          Processed {new Date(article.processed_at).toLocaleString()}
        </p>
      )}
    </div>

    {/* Related articles — wider container so cards aren't squeezed on laptop */}
    {article.category && (
      <div className="mx-auto max-w-5xl">
        <RelatedArticles category={article.category} currentSlug={article.slug} />
      </div>
    )}
    </>
  );
}

function AnalysisCard({ step, icon, label, content, color }: {
  step: string; icon: React.ReactNode; label: string; content: string;
  color: { bg: string; border: string; icon: string; text: string };
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl transition-all duration-200 hover:scale-[1.01]"
         style={{ background: color.bg, border: `1px solid ${color.border}` }}>

      {/* Corner glow */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full"
           style={{ background: `radial-gradient(circle, ${color.icon}, transparent)` }} />

      {/* Step number watermark */}
      <span className="pointer-events-none absolute right-5 bottom-4 text-6xl font-black select-none"
            style={{ color: color.text, opacity: 0.06 }}>{step}</span>

      <div className="relative flex gap-4 p-5 sm:p-6">
        {/* Icon */}
        <div className="shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl"
               style={{ background: color.icon, color: color.text }}>
            {icon}
          </div>
        </div>
        {/* Content */}
        <div className="min-w-0">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: color.text, opacity: 0.7 }}>
            {label}
          </p>
          <p className="text-sm leading-relaxed text-zinc-300">{content}</p>
        </div>
      </div>
    </div>
  );
}
