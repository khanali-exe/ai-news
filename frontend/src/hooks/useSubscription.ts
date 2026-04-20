"use client";
import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";

export function useSubscription() {
  const { user, isSignedIn, isLoaded } = useUser();
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) {
      setSubscribed(false);
      return;
    }
    setSubscribed((user.unsafeMetadata?.subscribed as boolean) ?? false);
  }, [isLoaded, isSignedIn, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const next = !subscribed;
    try {
      await user.update({ unsafeMetadata: { ...user.unsafeMetadata, subscribed: next } });
      setSubscribed(next);
    } finally {
      setLoading(false);
    }
  }, [user, subscribed]);

  return { subscribed, toggle, loading, isLoaded, isSignedIn };
}
