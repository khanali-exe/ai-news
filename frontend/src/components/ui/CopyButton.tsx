"use client";
import { useState } from "react";
import { Link2, Check } from "lucide-react";

export function CopyButton({ accentColor = "#7c3aed" }: { accentColor?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback silent fail
    }
  }

  return (
    <button
      onClick={handleCopy}
      title="Copy link to article"
      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200"
      style={{
        background: copied ? `${accentColor}20` : "rgba(255,255,255,0.05)",
        border: `1px solid ${copied ? accentColor + "45" : "rgba(255,255,255,0.09)"}`,
        color: copied ? accentColor : "rgba(255,255,255,0.38)",
      }}
    >
      {copied ? <Check className="h-3 w-3" /> : <Link2 className="h-3 w-3" />}
      {copied ? "Copied!" : "Copy link"}
    </button>
  );
}
