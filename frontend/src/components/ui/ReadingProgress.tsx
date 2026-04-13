"use client";
import { useState, useEffect } from "react";

export function ReadingProgress({ accentColor = "#0ea5e9" }: { accentColor?: string }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function update() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0);
    }
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-[3px]"
         style={{ background: "rgba(0,0,0,0.08)" }}>
      <div
        className="h-full transition-none"
        style={{
          width: `${progress}%`,
          background: `linear-gradient(90deg, ${accentColor}, ${accentColor}bb)`,
          boxShadow: `0 0 8px ${accentColor}80`,
        }}
      />
    </div>
  );
}
