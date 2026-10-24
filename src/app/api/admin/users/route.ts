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
import {
  createAdminAuditLog,
  isAdminRole,
  loadAdminUsers,
  loadUserRole,
  updateUserPlanByAdmin,
} from "@/features/admin/admin-service";

const ROUTE = "/api/admin/users";
const limiter = createRateLimiter({ limit: 30, windowMs: 60_000 });

async function authorizeAdminRequest(correlationId: string) {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return {
      authorized: false as const,
      response: apiJson(
        { error: "Sesi login diperlukan untuk mengakses area admin." },
        { status: 401, correlationId },
      ),
    };
  }

  try {
    const role = await loadUserRole(supabase, data.user.id);
    if (!isAdminRole(role)) {
      logApiEvent("warn", ROUTE, correlationId, `Non-admin user ${data.user.id} was denied admin users access`);
      return {
        authorized: false as const,
        response: apiJson(
          { error: "Akses ditolak. Akun ini tidak memiliki izin admin." },
          { status: 403, correlationId },
        ),
      };
    }

    return {
      authorized: true as const,
      supabase,
      user: data.user,
    };
  } catch (roleError) {
    logApiEvent("error", ROUTE, correlationId, "Failed to verify admin role", roleError);
    return {
      authorized: false as const,
      response: apiJson(
        { error: "Gagal memverifikasi role admin." },
        { status: 500, correlationId },
      ),
    };
  }
}

export async function GET(request: Request) {
  const correlationId = resolveCorrelationId(request.headers.get("x-correlation-id"));
  const limit = limiter.check(`${ROUTE}:${getClientKey(request.headers)}`, Date.now());
  if (!limit.allowed) return rateLimitResponse(limit, correlationId);

  try {
    const auth = await authorizeAdminRequest(correlationId);
    if (!auth.authorized) return auth.response;

    const users = await loadAdminUsers(auth.supabase);
    return apiJson({ data: users }, { correlationId });
  } catch (error) {
    logApiEvent("error", ROUTE, correlationId, "Failed to load admin user list", error);
    return apiJson(
      { error: "Gagal memuat daftar pengguna." },
      { status: 500, correlationId },
    );
  }
}

export async function POST(request: Request) {
  const correlationId = resolveCorrelationId(request.headers.get("x-correlation-id"));
  const limit = limiter.check(`${ROUTE}:${getClientKey(request.headers)}`, Date.now());
  if (!limit.allowed) return rateLimitResponse(limit, correlationId);

  try {
    const auth = await authorizeAdminRequest(correlationId);
    if (!auth.authorized) return auth.response;

    let body: { userId?: unknown; plan?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return apiJson({ error: "Body permintaan harus berupa JSON yang valid." }, { status: 400, correlationId });
    }

    const targetUserId = typeof body.userId === "string" ? body.userId : "";
    const newPlan = body.plan === "pro" ? "pro" : body.plan === "free" ? "free" : null;

    if (!targetUserId || !newPlan) {
      return apiJson(
        { error: "userId dan plan ('free' atau 'pro') wajib diisi." },
        { status: 400, correlationId },
      );
    }

    await updateUserPlanByAdmin(auth.supabase, auth.user.id, targetUserId, newPlan);

    return apiJson(
      { success: true, message: `Paket pengguna berhasil diubah ke ${newPlan}.` },
      { correlationId },
    );
  } catch (error) {
    logApiEvent("error", ROUTE, correlationId, "Failed to update user plan", error);
    return apiJson(
      { error: "Gagal memperbarui paket pengguna." },
      { status: 500, correlationId },
    );
  }
}

export async function DELETE(request: Request) {
  const correlationId = resolveCorrelationId(request.headers.get("x-correlation-id"));
  const limit = limiter.check(`${ROUTE}:${getClientKey(request.headers)}`, Date.now());
  if (!limit.allowed) return rateLimitResponse(limit, correlationId);

  try {
    const auth = await authorizeAdminRequest(correlationId);
    if (!auth.authorized) return auth.response;

    let body: { userId?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return apiJson(
        { error: "Body permintaan harus berupa JSON yang valid." },
        { status: 400, correlationId },
      );
    }

    const targetUserId = typeof body.userId === "string" ? body.userId : "";
    if (!targetUserId) {
      return apiJson(
        { error: "userId pengguna yang akan dihapus wajib diisi." },
        { status: 400, correlationId },
      );
    }

    if (targetUserId === auth.user.id) {
      return apiJson(
        { error: "Untuk menghapus akun Anda sendiri, gunakan menu Profil & Akun." },
        { status: 400, correlationId },
      );
    }

    // 1. Delete domain rows
    await Promise.allSettled([
      auth.supabase.from("tasks").delete().eq("user_id", targetUserId),
      auth.supabase.from("pomodoro_sessions").delete().eq("user_id", targetUserId),
      auth.supabase.from("subscriptions").delete().eq("user_id", targetUserId),
      auth.supabase.from("user_roles").delete().eq("user_id", targetUserId),
      auth.supabase.from("profiles").delete().eq("id", targetUserId),
    ]);

    // 2. Delete auth user if service role key available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && serviceRoleKey) {
      try {
        const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        await adminSupabase.auth.admin.deleteUser(targetUserId);
      } catch (adminErr) {
        logApiEvent(
          "warn",
          ROUTE,
          correlationId,
          `Could not delete from auth.users via admin API: ${targetUserId}`,
          adminErr,
        );
      }
    }

    // 3. Log admin audit action
    await createAdminAuditLog(
      auth.supabase,
      auth.user.id,
      "delete_user_account",
      "user",
      targetUserId,
      { targetUserId },
    );

    return apiJson(
      { success: true, message: "Pengguna berhasil dihapus." },
      { correlationId },
    );
  } catch (error) {
    logApiEvent("error", ROUTE, correlationId, "Failed to delete user by admin", error);
    return apiJson(
      { error: "Gagal menghapus akun pengguna." },
      { status: 500, correlationId },
    );
  }
}
