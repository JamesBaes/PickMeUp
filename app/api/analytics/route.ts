import { NextRequest, NextResponse } from "next/server";

const POSTHOG_HOST = "https://us.posthog.com";


// This function is based off cart events to determine which is a popular item.
async function queryTopItems(
  projectId: string,
  personalApiKey: string,
): Promise<{ item_name: string; count: number }[]> {
  const res = await fetch(
    `${POSTHOG_HOST}/api/projects/${projectId}/query/`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${personalApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: {
          kind: "HogQLQuery",
          query: `
            SELECT
              trim(BOTH '"' FROM JSONExtractString(properties, 'item_name')) AS item_name,
              count() AS count
            FROM events
            WHERE event = 'add_to_cart'
              AND timestamp >= now() - interval 7 day
            GROUP BY item_name
            ORDER BY count DESC
            LIMIT 7
          `,
        },
      }),
    }
  );

  if (!res.ok) {
    const errorBody = await res.text();
    console.error(`PostHog ${res.status}:`, errorBody);
    throw new Error(`PostHog API error: ${res.status}`);
  }
  const json = await res.json();

  // json.results is an array of arrays: [[item_name, count], ...]
  return (json.results as [string, number][])
    .map(([item_name, count]) => ({ item_name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 7);
}

// This function is used for a stats cards, only returns one row, a number
async function runHogQLQuery(
  projectId: string,
  personalApiKey: string,
  query: string,
): Promise<number> {
  const res = await fetch(
    `${POSTHOG_HOST}/api/projects/${projectId}/query/`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${personalApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: {
          kind: "HogQLQuery",
          query,
        },
      }),
    },
  );

  if (!res.ok) {
    const errorBody = await res.text();
    console.error(`PostHog ${res.status}:`, errorBody);
    throw new Error(`PostHog API error: ${res.status}`);
  }

  const json = await res.json();
  return json.results?.[0]?.[0] ?? 0;
}


// This function is used for charts, returns 7 rows, one per day, returns labels[], and data[]
async function runHogQLSeries(
  projectId: string,
  personalApiKey: string,
  query: string,
): Promise<{ labels: string[]; data: number[] }> {
  const res = await fetch(
    `${POSTHOG_HOST}/api/projects/${projectId}/query/`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${personalApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: {
          kind: "HogQLQuery",
          query,
        },
      }),
    },
  );

  if (!res.ok) {
    const errorBody = await res.text();
    console.error(`PostHog ${res.status}:`, errorBody);
    throw new Error(`PostHog API error: ${res.status}`);
  }

  const json = await res.json();
  const rows = json.results as [string, number][];
  return {
    labels: rows.map((r) => r[0]),
    data: rows.map((r) => r[1]),
  };
}

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
      // Daily unique visitors (last 1 day)
      runHogQLQuery(
        projectId, personalApiKey,
        `SELECT count(distinct person_id) FROM events WHERE event = '$pageview' AND timestamp >= now() - interval 1 day`,
      ),
      // Weekly unique visitors (last 7 days)
      runHogQLQuery(
        projectId, personalApiKey,
        `SELECT count(distinct person_id) FROM events WHERE event = '$pageview' AND timestamp >= now() - interval 7 day`,
      ),
      // Add to cart total (last 7 days)
      runHogQLQuery(
        projectId, personalApiKey,
        `SELECT count() FROM events WHERE event = 'add_to_cart' AND timestamp >= now() - interval 7 day`,
      ),
      // Payment success total (last 7 days)
      runHogQLQuery(
        projectId, personalApiKey,
        `SELECT count() FROM events WHERE event = 'payment_success' AND timestamp >= now() - interval 7 day`,
      ),
      // Pageview series (last 7 days by day)
      runHogQLSeries(
        projectId, personalApiKey,
        `SELECT toString(toDate(timestamp)), count() FROM events WHERE event = '$pageview' AND timestamp >= now() - interval 7 day GROUP BY toDate(timestamp) ORDER BY toDate(timestamp)`,
      ),
      // Payment series (last 7 days by day)
      runHogQLSeries(
        projectId, personalApiKey,
        `SELECT toString(toDate(timestamp)), count() FROM events WHERE event = 'payment_success' AND timestamp >= now() - interval 7 day GROUP BY toDate(timestamp) ORDER BY toDate(timestamp)`,
      ),
      
      queryTopItems(projectId, personalApiKey),
      // Total pageviews (last 1 day)
      runHogQLQuery(
        projectId, personalApiKey,
        `SELECT count() FROM events WHERE event = '$pageview' AND timestamp >= now() - interval 1 day`,
      ),
    ]);

    // Calculate repeat_views
    const repeatViews = dailyPageviews - dailyVisitors;

    return NextResponse.json({
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
      repeat_views: repeatViews,
    });
  } catch (error) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 },
    );
  }
}
