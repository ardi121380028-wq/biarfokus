import { createClient } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  apiJson,
  createRateLimiter,
  getClientKey,
  logApiEvent,
  rateLimitResponse,
  resolveCorrelationId,
} from "@/lib/api/request-guard";

const ROUTE = "/api/account/delete";
const limiter = createRateLimiter({ limit: 5, windowMs: 60_000 });

export async function DELETE(request: Request) {
  const correlationId = resolveCorrelationId(request.headers.get("x-correlation-id"));
  const limit = limiter.check(`${ROUTE}:${getClientKey(request.headers)}`, Date.now());
  if (!limit.allowed) return rateLimitResponse(limit, correlationId);

  try {
    const supabase = await getSupabaseServerClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return apiJson(
        { error: "Sesi login diperlukan untuk menghapus akun." },
        { status: 401, correlationId },
      );
    }

    const userId = authData.user.id;
    const userEmail = authData.user.email ?? null;

    // 1. Delete user domain data across all tables.
    // Notice foreign keys from tasks, pomodoro_sessions, profiles, etc. are configured with cascade,
    // but explicit deletion ensures all rows are cleaned up even if cascade differs.
    await Promise.allSettled([
      supabase.from("tasks").delete().eq("user_id", userId),
      supabase.from("pomodoro_sessions").delete().eq("user_id", userId),
      supabase.from("subscriptions").delete().eq("user_id", userId),
      supabase.from("user_roles").delete().eq("user_id", userId),
      supabase.from("profiles").delete().eq("id", userId),
    ]);

    // 2. If service role key is present, delete user from auth.users via Supabase admin API
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && serviceRoleKey) {
      try {
        const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        await adminSupabase.auth.admin.deleteUser(userId);
      } catch (adminDeleteError) {
        logApiEvent(
          "warn",
          ROUTE,
          correlationId,
          `Could not delete user from auth.users via admin API: ${userId}`,
          adminDeleteError,
        );
      }
    }

    logApiEvent("info", ROUTE, correlationId, `Account deleted successfully for user ${userId} (${userEmail})`);

    // 3. Sign out the session
    await supabase.auth.signOut();

    return apiJson(
      { success: true, message: "Akun dan semua data kamu berhasil dihapus." },
      { correlationId },
    );
  } catch (error) {
    logApiEvent("error", ROUTE, correlationId, "Failed to delete account", error);
    return apiJson(
      { error: "Gagal menghapus akun. Silakan coba beberapa saat lagi." },
      { status: 500, correlationId },
    );
  }
}
