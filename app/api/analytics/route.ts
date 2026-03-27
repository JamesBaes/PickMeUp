import { NextRequest, NextResponse } from "next/server";
import { queryTopItems, runHogQLQuery, runHogQLSeries } from "@/lib/posthog";

// Cache analytics results for 60 seconds to avoid hammering PostHog on every request.
let analyticsCache: { data: unknown; expiresAt: number } | null = null;

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get("x-admin-api-key");
  if (!apiKey || apiKey !== process.env.ANALYTICS_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projectId = process.env.POSTHOG_PROJECT_ID;
  const personalApiKey = process.env.POSTHOG_PERSONAL_API_KEY;

  if (!projectId || !personalApiKey) {
    return NextResponse.json(
      { error: "PostHog credentials not configured" },
      { status: 500 },
    );
  }

  if (analyticsCache && Date.now() < analyticsCache.expiresAt) {
    return NextResponse.json(analyticsCache.data);
  }

  try {
    const [
      dailyVisitors,
      weeklyVisitors,
      addToCartTotal,
      paymentSuccessTotal,
      pageviewSeries,
      paymentSeries,
      topItems,
      dailyPageviews,
    ] = await Promise.all([
      runHogQLQuery(
        projectId, personalApiKey,
        `SELECT count(distinct person_id) FROM events WHERE event = '$pageview' AND timestamp >= now() - interval 1 day`,
      ),
      runHogQLQuery(
        projectId, personalApiKey,
        `SELECT count(distinct person_id) FROM events WHERE event = '$pageview' AND timestamp >= now() - interval 7 day`,
      ),
      runHogQLQuery(
        projectId, personalApiKey,
        `SELECT count() FROM events WHERE event = 'add_to_cart' AND timestamp >= now() - interval 7 day`,
      ),
      runHogQLQuery(
        projectId, personalApiKey,
        `SELECT count() FROM events WHERE event = 'payment_success' AND timestamp >= now() - interval 7 day`,
      ),
      runHogQLSeries(
        projectId, personalApiKey,
        `SELECT toString(toDate(timestamp)), count() FROM events WHERE event = '$pageview' AND timestamp >= now() - interval 7 day GROUP BY toDate(timestamp) ORDER BY toDate(timestamp)`,
      ),
      runHogQLSeries(
        projectId, personalApiKey,
        `SELECT toString(toDate(timestamp)), count() FROM events WHERE event = 'payment_success' AND timestamp >= now() - interval 7 day GROUP BY toDate(timestamp) ORDER BY toDate(timestamp)`,
      ),
      queryTopItems(projectId, personalApiKey),
      runHogQLQuery(
        projectId, personalApiKey,
        `SELECT count() FROM events WHERE event = '$pageview' AND timestamp >= now() - interval 1 day`,
      ),
    ]);

    const responseData = {
      daily_visitors: dailyVisitors,
      weekly_visitors: weeklyVisitors,
      add_to_cart_total: addToCartTotal,
      payment_success_total: paymentSuccessTotal,
      pageview_labels: pageviewSeries.labels,
      pageview_data: pageviewSeries.data,
      payment_labels: paymentSeries.labels,
      payment_data: paymentSeries.data,
      top_items: topItems,
      daily_pageviews: dailyPageviews,
      repeat_views: dailyPageviews - dailyVisitors,
    };

    analyticsCache = { data: responseData, expiresAt: Date.now() + 60_000 };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 },
    );
  }
}
