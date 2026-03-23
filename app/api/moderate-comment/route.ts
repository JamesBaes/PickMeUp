/**
 * POST /api/moderate-comment
 *
 * Screens comment text through Azure AI Content Safety before it is
 * written to the database.  The API key never leaves the server.
 *
 * Request body : { text: string }
 * Response 200 : { flagged: boolean; reason?: string }
 * Response 400 : { error: string }   — bad request
 * Response 503 : { error: string }   — Azure env vars not configured
 */

import { NextRequest, NextResponse } from "next/server";
import { moderateText } from "@/lib/azure-content-safety";

export async function POST(request: NextRequest) {
  let text: string;

  try {
    const body = await request.json();
    text = typeof body?.text === "string" ? body.text.trim() : "";
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  if (
    !process.env.AZURE_CONTENT_SAFETY_ENDPOINT ||
    !process.env.AZURE_CONTENT_SAFETY_KEY
  ) {
    // Azure not configured — allow the comment through rather than blocking all submissions
    console.warn(
      "[moderate-comment] Azure Content Safety env vars not set — skipping moderation"
    );
    return NextResponse.json({ flagged: false });
  }

  try {
    const result = await moderateText(text);

    return NextResponse.json({
      flagged: result.flagged,
      ...(result.flagged && {
        reason: `Your comment was flagged for inappropriate content (${result.blockedCategory}).`,
      }),
    });
  } catch (err: any) {
    console.error("[moderate-comment] Azure error:", err?.message);
    // Fail open — don't block submissions if Azure is unreachable
    return NextResponse.json({ flagged: false });
  }
}
