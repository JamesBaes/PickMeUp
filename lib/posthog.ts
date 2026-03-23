const POSTHOG_HOST = "https://us.posthog.com";

async function posthogQuery(
  projectId: string,
  personalApiKey: string,
  query: string,
): Promise<unknown[][]> {
  const res = await fetch(`${POSTHOG_HOST}/api/projects/${projectId}/query/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${personalApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error(`PostHog ${res.status}:`, errorBody);
    throw new Error(`PostHog API error: ${res.status}`);
  }

  const json = await res.json();
  return json.results ?? [];
}

export async function queryTopItems(
  projectId: string,
  personalApiKey: string,
): Promise<{ item_name: string; count: number }[]> {
  const results = await posthogQuery(
    projectId,
    personalApiKey,
    `SELECT
      trim(BOTH '"' FROM JSONExtractString(properties, 'item_name')) AS item_name,
      count() AS count
    FROM events
    WHERE event = 'add_to_cart'
      AND timestamp >= now() - interval 7 day
    GROUP BY item_name
    ORDER BY count DESC
    LIMIT 7`,
  );

  return (results as [string, number][])
    .map(([item_name, count]) => ({ item_name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 7);
}


// Returns a single value from a HogQL query .
export async function runHogQLQuery(
  projectId: string,
  personalApiKey: string,
  query: string,
): Promise<number> {
  const results = await posthogQuery(projectId, personalApiKey, query);
  return (results?.[0]?.[0] as number) ?? 0;
}


// Returns a series from a HogQL query as { labels, data } arrays (one entry per row).
export async function runHogQLSeries(
  projectId: string,
  personalApiKey: string,
  query: string,
): Promise<{ labels: string[]; data: number[] }> {
  const rows = (await posthogQuery(projectId, personalApiKey, query)) as [string, number][];
  return {
    labels: rows.map((r) => r[0]),
    data: rows.map((r) => r[1]),
  };
}
