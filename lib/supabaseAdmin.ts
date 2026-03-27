import { createClient } from "@supabase/supabase-js";

// Singleton admin client — reused across all API route invocations in the same
// server process, avoiding a new connection on every request.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
