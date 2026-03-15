import { NextRequest, NextResponse } from "next/server";

const POSTHOG_HOST = "https://us.posthog.com";

async function queryTrend(
  projectId: string,
  personalApiKey: string,
  eventName: string,
  dateFrom: string,
  countUnique: boolean,
): Promise<number> {
  const body = {
    events: [
      {
        id: eventName,
        type: "events",
        math: countUnique ? "dau" : "total",
      },
    ],
    date_from: dateFrom,
    date_to: "now",
    interval: "day",
  };

  const res = await fetch(
    `${POSTHOG_HOST}/api/projects/${projectId}/insights/trend/`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${personalApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) {
    throw new Error(`PostHog API error: ${res.status}`);
  }

  const json = await res.json();
  // Sum all data points across the date range
  const result = json.result as { data: number[] }[];
  return result.reduce((total, series) => {
    return total + series.data.reduce((sum, val) => sum + val, 0);
  }, 0);
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
    const [dailyVisitors, weeklyVisitors, addToCartTotal, paymentSuccessTotal] =
      await Promise.all([
        queryTrend(projectId, personalApiKey, "$pageview", "-1d", true),
        queryTrend(projectId, personalApiKey, "$pageview", "-7d", true),
        queryTrend(projectId, personalApiKey, "add_to_cart", "-7d", false),
        queryTrend(
          projectId,
          personalApiKey,
          "payment_success",
          "-7d",
          false,
        ),
      ]);

    return NextResponse.json({
      daily_visitors: dailyVisitors,
      weekly_visitors: weeklyVisitors,
      add_to_cart_total: addToCartTotal,
      payment_success_total: paymentSuccessTotal,
    });
  } catch (error) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 },
    );
  }
}
