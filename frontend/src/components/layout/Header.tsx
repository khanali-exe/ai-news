"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { Search, X, Bookmark } from "lucide-react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useBookmarks } from "@/hooks/useBookmarks";

export function Header() {
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const { bookmarks } = useBookmarks();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setMobileOpen(false);
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) router.push(`/?search=${encodeURIComponent(query.trim())}`);
  }

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        background: "rgba(6,6,8,0.92)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
      }}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">

        {/* Logo — always resets to clean home */}
        <Link href="/" onClick={() => setQuery("")} className="flex shrink-0 items-center gap-2 group">
          <Image
            src="/logo.png"
            alt="aisimplest"
            width={180}
            height={60}
            className="h-8 w-auto transition-opacity group-hover:opacity-80 dark-logo"
            priority
          />
          <Image
            src="/lightlogo.png"
            alt="aisimplest"
            width={180}
            height={60}
            className="h-8 w-auto transition-opacity group-hover:opacity-80 light-logo"
            priority
          />
          <span className="text-sm font-bold tracking-tight text-white">
            AI SIMPLEST
          </span>
        </Link>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="hidden flex-1 max-w-sm sm:flex ml-auto">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600 transition-colors peer-focus:text-brand-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search… (⌘K)"
              className="search-input peer w-full rounded-xl py-1.5 pl-8 pr-8 text-sm text-zinc-300 placeholder-zinc-700 transition-all"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
              }}
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </form>

        {/* Right nav */}
        <nav className="ml-auto flex items-center gap-1">
          <button
            className="rounded-lg p-2 text-zinc-600 hover:text-zinc-300 sm:hidden transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
          </button>

          <div className="hidden sm:flex items-center gap-1">
            <Link href="/saved"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500
                         hover:bg-white/5 hover:text-zinc-200 transition-colors">
              <Bookmark className="h-3.5 w-3.5" />
              Saved
              {bookmarks.length > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                      style={{ background: "rgba(14,165,233,0.8)" }}>
                  {bookmarks.length}
                </span>
              )}
            </Link>
            <ThemeToggle />
          </div>
        </nav>
      </div>

      {/* Mobile search + nav */}
      {mobileOpen && (
        <div className="px-4 py-3 sm:hidden" style={{ borderTop: "1px solid var(--border)" }}>
          <form onSubmit={handleSearch} className="mb-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="search-input w-full rounded-xl py-2 pl-8 pr-3 text-sm text-zinc-300 transition-all"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
              />
            </div>
          </form>
          <div className="flex items-center gap-2">
            <Link
              href="/saved"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400
                         hover:bg-white/5 hover:text-zinc-200 transition-colors"
              style={{ border: "1px solid var(--border)" }}
            >
              <Bookmark className="h-3.5 w-3.5" />
              Saved
              {bookmarks.length > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                      style={{ background: "rgba(14,165,233,0.8)" }}>
                  {bookmarks.length}
                </span>
              )}
            </Link>
            <ThemeToggle />
          </div>
        </div>
      )}
    </header>
  );
}
