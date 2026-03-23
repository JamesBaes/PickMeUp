/**
 * Azure AI Content Safety — text moderation helper
 *
 * Free tier (F0): 5 000 text analyses / month
 * Docs: https://learn.microsoft.com/azure/ai-services/content-safety/quickstart-text
 *
 * Required env vars (server-side only):
 *   AZURE_CONTENT_SAFETY_ENDPOINT  e.g. https://<resource>.cognitiveservices.azure.com
 *   AZURE_CONTENT_SAFETY_KEY       your resource API key
 */

const API_VERSION = "2023-10-01";

export type ModerationCategory = "Hate" | "Sexual" | "Violence" | "SelfHarm";

export interface CategoryScore {
  category: ModerationCategory;
  severity: number; // 0–7 (0 = safe, 7 = most severe)
}

export interface ModerationResult {
  flagged: boolean;         // true when any category exceeds the threshold
  categories: CategoryScore[];
  blockedCategory?: ModerationCategory; // first category that tripped the threshold
}

/** Severity level at which a comment is considered inappropriate (inclusive). */
const BLOCK_THRESHOLD = 2;

export async function moderateText(text: string): Promise<ModerationResult> {
  const endpoint = process.env.AZURE_CONTENT_SAFETY_ENDPOINT;
  const key = process.env.AZURE_CONTENT_SAFETY_KEY;

  if (!endpoint || !key) {
    throw new Error(
      "Missing AZURE_CONTENT_SAFETY_ENDPOINT or AZURE_CONTENT_SAFETY_KEY environment variables"
    );
  }

  const url = `${endpoint.replace(/\/$/, "")}/contentsafety/text:analyze?api-version=${API_VERSION}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Ocp-Apim-Subscription-Key": key,
    },
    body: JSON.stringify({
      text,
      categories: ["Hate", "Sexual", "Violence", "SelfHarm"] satisfies ModerationCategory[],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Azure Content Safety error ${response.status}: ${body}`);
  }

  const data = (await response.json()) as {
    categoriesAnalysis: { category: ModerationCategory; severity: number }[];
  };

  const categories: CategoryScore[] = data.categoriesAnalysis.map((c) => ({
    category: c.category,
    severity: c.severity,
  }));

  const blocked = categories.find((c) => c.severity >= BLOCK_THRESHOLD);

  return {
    flagged: Boolean(blocked),
    categories,
    blockedCategory: blocked?.category,
  };
}
