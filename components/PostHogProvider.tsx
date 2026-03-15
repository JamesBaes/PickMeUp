"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

function PostHogPageView() {
  const pathname = usePathname();
  const ph = usePostHog();

  useEffect(() => {
    if (ph && pathname) {
      ph.capture("$pageview", {
        $current_url: window.location.href,
      });
    }
  }, [pathname, ph]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host:
        process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      capture_pageview: false,
      capture_pageleave: true,
      person_profiles: "identified_only",
      loaded: () => setReady(true),
    });
  }, []);

  return (
    <PHProvider client={posthog}>
      {ready && <PostHogPageView />}
      {children}
    </PHProvider>
  );
}
