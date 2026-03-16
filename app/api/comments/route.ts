import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type CommentRow = Record<string, unknown>;

const getFirstString = (row: CommentRow, keys: string[]): string | null => {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return null;
};

const getCommentsItemId = (row: CommentRow): string | null => {
  const value = row.item_id;

  if (typeof value === "number") {
    return value.toString();
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  return null;
};

const getCommentsItemName = (row: CommentRow): string | null => {
  return getFirstString(row, ["item_name", "menu_item_name", "item"]);
};

const getCommentUserId = (row: CommentRow): string | null => {
  const userId = row.user_id;
  if (typeof userId === "string" && userId.trim().length > 0) {
    return userId;
  }

  const authId = row.auth_id;
  if (typeof authId === "string" && authId.trim().length > 0) {
    return authId;
  }

  return null;
};

const getDisplayEmail = (row: CommentRow): boolean => {
  const value = row.display_email;

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }

  return false;
};

const normalizeItemName = (value: string): string => {
  return value
    .replace(/_/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
};

export async function GET(request: NextRequest) {
  try {
    const itemId = request.nextUrl.searchParams.get("itemId");
    const itemName = request.nextUrl.searchParams.get("itemName");

    if (!itemId && !itemName) {
      return NextResponse.json(
        { error: "Either itemId or itemName is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("comments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to fetch comments" },
        { status: 500 }
      );
    }

    const rows = (data ?? []) as CommentRow[];
    const normalizedItemName = itemName ? normalizeItemName(itemName) : null;

    const filteredRows = rows.filter((row) => {
      const rowItemId = getCommentsItemId(row);
      const rowItemName = getCommentsItemName(row);

      const idMatches = Boolean(itemId) && rowItemId === itemId;
      const nameMatches =
        Boolean(normalizedItemName) &&
        typeof rowItemName === "string" &&
        normalizeItemName(rowItemName) === normalizedItemName;

      return idMatches || nameMatches;
    });

    const userIds = Array.from(
      new Set(
        filteredRows
          .map((row) => getCommentUserId(row))
          .filter((value): value is string => typeof value === "string" && value.length > 0)
      )
    );

    const emailEntries = await Promise.all(
      userIds.map(async (userId) => {
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (userError) {
          return [userId, null] as const;
        }

        return [userId, userData.user?.email ?? null] as const;
      })
    );

    const emailByUserId = new Map<string, string | null>(emailEntries);

    const comments = filteredRows.map((row) => {
      const userId = getCommentUserId(row);
      const displayEmail = getDisplayEmail(row);
      const emailFromRow = getFirstString(row, ["email", "user_email"]);
      const resolvedEmail = userId ? emailByUserId.get(userId) ?? null : null;

      return {
        ...row,
        user_email: displayEmail ? emailFromRow ?? resolvedEmail : null,
      };
    });

    return NextResponse.json({ comments });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Unexpected error while fetching comments" },
      { status: 500 }
    );
  }
}
