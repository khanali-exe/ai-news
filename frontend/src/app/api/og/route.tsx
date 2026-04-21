import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

const CAT_COLOR: Record<string, string> = {
  models:   "#7c3aed",
  research: "#2563eb",
  tools:    "#059669",
  business: "#d97706",
  policy:   "#dc2626",
  other:    "#0ea5e9",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title    = searchParams.get("title")    ?? "AI News";
  const category = searchParams.get("category") ?? "other";
  const tl_dr    = searchParams.get("tl_dr")    ?? "";
  const accent   = CAT_COLOR[category] ?? CAT_COLOR.other;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "#060608",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top accent bar */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: accent }} />

        {/* Logo + category row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "10px",
              background: "linear-gradient(135deg, #0ea5e9, #818cf8)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "18px",
            }}>⚡</div>
            <span style={{ color: "#e4e4e7", fontSize: "20px", fontWeight: 700 }}>AI Simplest</span>
          </div>
          <div style={{
            background: `${accent}22`,
            border: `1px solid ${accent}66`,
            color: accent,
            padding: "6px 16px",
            borderRadius: "99px",
            fontSize: "13px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}>
            {category}
          </div>
        </div>

        {/* Title */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", flex: 1, justifyContent: "center" }}>
          <div style={{
            color: "#ffffff",
            fontSize: title.length > 80 ? "36px" : "44px",
            fontWeight: 800,
            lineHeight: 1.25,
            maxWidth: "980px",
          }}>
            {title}
          </div>
          {tl_dr && (
            <div style={{
              color: "#71717a",
              fontSize: "22px",
              lineHeight: 1.5,
              maxWidth: "900px",
            }}>
              {tl_dr.length > 120 ? tl_dr.slice(0, 120) + "…" : tl_dr}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#34d399" }} />
          <span style={{ color: "#52525b", fontSize: "16px" }}>Verified AI news · aisimplest.com</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
