"use client";
import { Bell, BellOff, Check, Loader2 } from "lucide-react";
import { SignInButton } from "@clerk/nextjs";
import { useSubscription } from "@/hooks/useSubscription";

export function SubscribeButton() {
  const { subscribed, toggle, loading, isLoaded, isSignedIn } = useSubscription();

  if (!isLoaded) return <div className="h-8 w-44 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />;

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <button
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all hover:opacity-90 active:scale-95"
          style={{
            background: "rgba(14,165,233,0.1)",
            border: "1px solid rgba(14,165,233,0.25)",
            color: "#7dd3fc",
          }}
        >
          <Bell className="h-3.5 w-3.5" />
          Subscribe for daily alerts
        </button>
      </SignInButton>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
      style={
        subscribed
          ? { background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", color: "#6ee7b7" }
          : { background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.25)", color: "#7dd3fc" }
      }
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : subscribed ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Bell className="h-3.5 w-3.5" />
      )}
      {loading
        ? "Saving…"
        : subscribed
        ? "Subscribed · Unsubscribe"
        : "Subscribe for daily alerts"}
    </button>
  );
}
