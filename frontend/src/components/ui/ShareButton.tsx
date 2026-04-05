"use client";
import { Twitter } from "lucide-react";

export function ShareButton({
  title,
  accentColor = "#7c3aed",
}: {
  title: string;
  accentColor?: string;
}) {
  function handleShare() {
    const url = window.location.href;
    const tweet = `${title}\n\n${url}\n\nvia @AIIntelHub`;
    const twitterUrl =
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`;
    window.open(twitterUrl, "_blank", "noopener,noreferrer,width=550,height=450");
  }

  return (
    <button
      onClick={handleShare}
      title="Share on X / Twitter"
      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 hover:scale-[1.03]"
      style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.09)",
        color: "rgba(255,255,255,0.38)",
      }}
    >
      <Twitter className="h-3 w-3" />
      Share
    </button>
  );
}
