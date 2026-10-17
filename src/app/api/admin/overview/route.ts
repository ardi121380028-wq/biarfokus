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
  loadAdminOverview,
  loadUserRole,
  validateAuditAction,
} from "@/features/admin/admin-service";

const ROUTE = "/api/admin/overview";
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
      logApiEvent("warn", ROUTE, correlationId, `Non-admin user ${data.user.id} was denied admin access`);
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

    const overview = await loadAdminOverview(auth.supabase);
    return apiJson({ data: overview }, { correlationId });
  } catch (error) {
    logApiEvent("error", ROUTE, correlationId, "Failed to load admin overview", error);
    return apiJson(
      { error: "Gagal memuat ringkasan admin." },
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

    let body: { action?: unknown; targetType?: unknown; targetId?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return apiJson({ error: "Body permintaan harus berupa JSON yang valid." }, { status: 400, correlationId });
    }

    const action = typeof body.action === "string" ? body.action : "";
    const targetType = typeof body.targetType === "string" ? body.targetType : "";
    const targetId = typeof body.targetId === "string" ? body.targetId : null;

    try {
      validateAuditAction(action, targetType);
    } catch (validationError) {
      return apiJson(
        { error: validationError instanceof Error ? validationError.message : "Data audit tidak valid." },
        { status: 400, correlationId },
      );
    }

    const logEntry = await createAdminAuditLog(
      auth.supabase,
      auth.user.id,
      action,
      targetType,
      targetId,
      { email: auth.user.email ?? null, correlationId },
    );

    return apiJson({ data: logEntry }, { status: 201, correlationId });
  } catch (error) {
    logApiEvent("error", ROUTE, correlationId, "Failed to record admin audit log", error);
    return apiJson(
      { error: "Gagal mencatat audit log admin." },
      { status: 500, correlationId },
    );
  }
}
