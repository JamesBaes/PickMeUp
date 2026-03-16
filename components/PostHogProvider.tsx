"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

const isPostHogEnabled = typeof POSTHOG_KEY === "string" && POSTHOG_KEY.trim().length > 0;

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
  
  
  
  
  // note it couyld also be this wasn't sure
//   if (!isPostHogEnabled) return;

//     posthog.capture("$pageview", {
//       $current_url: window.location.href,
//     });
//   }, [pathname]);

//   return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isPostHogEnabled) return;

    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      capture_pageview: false,
      capture_pageleave: true,
      person_profiles: "identified_only",
      loaded: () => setReady(true),
    });
  }, []);

  if (!isPostHogEnabled) return <>{children}</>;

  return (
    <PHProvider client={posthog}>
      {ready && <PostHogPageView />}
      {children}
    </PHProvider>
  );
}
