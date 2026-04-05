import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function ConfirmPage({ searchParams }: Props) {
  const { token } = await searchParams;

  let success = false;
  let title = "Invalid link";
  let message = "This confirmation link is invalid or has expired.";

  if (token) {
    try {
      const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8000";
      const res = await fetch(
        `${backendUrl}/api/v1/subscribe/confirm?token=${encodeURIComponent(token)}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        success = true;
        title = "You're subscribed!";
        message =
          "You'll receive a daily digest on days when new verified AI news is published.";
      }
    } catch {
      // backend unreachable — show error
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div
        className="w-full max-w-sm rounded-2xl p-10 text-center"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <div
          className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full"
          style={{
            background: success ? "rgba(16,185,129,0.1)" : "rgba(220,38,38,0.1)",
            border: `1px solid ${success ? "rgba(16,185,129,0.25)" : "rgba(220,38,38,0.25)"}`,
          }}
        >
          {success ? (
            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
          ) : (
            <XCircle className="h-6 w-6 text-red-400" />
          )}
        </div>

        <h1 className="mb-2 text-lg font-bold text-zinc-100">{title}</h1>
        <p className="mb-6 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
          {message}
        </p>

        <Link
          href="/"
          className="inline-flex items-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg,#0ea5e9,#818cf8)" }}
        >
          Back to feed
        </Link>
      </div>
    </div>
  );
}
