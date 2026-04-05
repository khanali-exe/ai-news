"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Sparkles } from "lucide-react";
import { useArticleCount } from "@/lib/hooks/useArticles";

export function NewArticlesBanner({ onRefresh }: { onRefresh: () => void }) {
  const count = useArticleCount();
  const initialCount = useRef<number | null>(null);
  const [newCount, setNewCount] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (count === null) return;
    // Store the first value we see as baseline
    if (initialCount.current === null) {
      initialCount.current = count;
      return;
    }
    const diff = count - initialCount.current;
    if (diff > 0) {
      setNewCount(diff);
      setVisible(true);
    }
  }, [count]);

  if (!visible) return null;

  return (
    <div className="fixed top-20 left-1/2 z-50 -translate-x-1/2 fade-up">
      <button
        onClick={() => {
          onRefresh();
          setVisible(false);
          initialCount.current = count;
          setNewCount(0);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        className="flex items-center gap-2.5 rounded-full px-5 py-2.5 text-sm font-medium
                   text-white shadow-2xl transition-all hover:scale-105 active:scale-95"
        style={{
          background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
          boxShadow: "0 8px 32px rgba(14,165,233,0.4), 0 0 0 1px rgba(255,255,255,0.1)",
        }}
      >
        <Sparkles className="h-4 w-4" />
        {newCount} new article{newCount !== 1 ? "s" : ""} available
        <ArrowUp className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
