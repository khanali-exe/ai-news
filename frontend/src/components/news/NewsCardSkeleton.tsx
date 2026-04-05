export function NewsCardSkeleton({ featured = false }: { featured?: boolean }) {
  return (
    <div
      className={`flex flex-col rounded-2xl overflow-hidden ${featured ? "sm:col-span-2 lg:col-span-2" : ""}`}
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      {/* Accent bar — matches real card */}
      <div className="h-[2px] w-full animate-pulse" style={{ background: "var(--surface-3)" }} />

      <div className="flex flex-1 flex-col p-5">
        {/* Top row */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex gap-1.5">
            <div className="h-5 w-14 rounded-full animate-pulse" style={{ background: "var(--surface-2)" }} />
            <div className="h-5 w-18 rounded-full animate-pulse" style={{ background: "var(--surface-2)" }} />
          </div>
          <div className="h-3 w-12 rounded animate-pulse" style={{ background: "var(--surface-2)" }} />
        </div>

        {/* Title */}
        <div className="mb-1.5 h-4 w-full rounded animate-pulse" style={{ background: "var(--surface-2)" }} />
        <div className="mb-4 h-4 w-3/4 rounded animate-pulse" style={{ background: "var(--surface-2)" }} />

        {/* TL;DR lines */}
        <div className="mb-1 h-3 w-full rounded animate-pulse" style={{ background: "var(--surface-3)" }} />
        <div className="mb-1 h-3 w-5/6 rounded animate-pulse" style={{ background: "var(--surface-3)" }} />
        <div className="mb-4 h-3 w-2/3 rounded animate-pulse" style={{ background: "var(--surface-3)" }} />

        {/* Footer */}
        <div
          className="mt-auto flex items-center justify-between pt-3"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-1.5">
            <div className="h-3.5 w-3.5 rounded-sm animate-pulse" style={{ background: "var(--surface-2)" }} />
            <div className="h-3 w-24 rounded animate-pulse" style={{ background: "var(--surface-2)" }} />
          </div>
          <div className="h-3 w-8 rounded animate-pulse" style={{ background: "var(--surface-2)" }} />
        </div>
      </div>
    </div>
  );
}
