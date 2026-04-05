import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-40 gap-5 text-center fade-up">
      <div className="text-6xl font-black"
           style={{ background: "linear-gradient(135deg,#fff 0%,#27272a 100%)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
        404
      </div>
      <p className="text-zinc-500 text-sm">Article not found or has been removed.</p>
      <Link href="/"
            className="rounded-xl px-5 py-2.5 text-sm font-medium text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#0ea5e9,#6366f1)" }}>
        Back to feed
      </Link>
    </div>
  );
}
