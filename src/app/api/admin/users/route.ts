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
