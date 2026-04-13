"use client";
import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() { setVisible(window.scrollY > 400); }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      title="Back to top"
      className="fixed bottom-8 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full shadow-lg
                 transition-all duration-200 hover:scale-110 active:scale-95 fade-up"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border-hover)",
        color: "var(--muted-2)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.1)",
      }}
    >
      <ArrowUp className="h-4 w-4" />
    </button>
  );
}
