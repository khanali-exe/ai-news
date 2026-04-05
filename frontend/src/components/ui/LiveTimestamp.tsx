"use client";
import { useState, useEffect } from "react";

export function LiveTimestamp() {
  const [label, setLabel] = useState("");

  function buildLabel() {
    const now = new Date();
    return `Updated ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }

  useEffect(() => {
    setLabel(buildLabel());
    const id = setInterval(() => setLabel(buildLabel()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!label) return null;

  return (
    <span className="text-[11px] font-medium tabular-nums" style={{ color: "var(--muted)" }}>
      {label}
    </span>
  );
}
