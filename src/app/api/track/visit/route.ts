import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  apiJson,
  createRateLimiter,
  getClientKey,
  logApiEvent,
  rateLimitResponse,
  resolveCorrelationId,
} from "@/lib/api/request-guard";

const ROUTE = "/api/track/visit";
const limiter = createRateLimiter({ limit: 60, windowMs: 60_000 });

export async function POST(request: Request) {
  const correlationId = resolveCorrelationId(request.headers.get("x-correlation-id"));
  const limit = limiter.check(`${ROUTE}:${getClientKey(request.headers)}`, Date.now());
  if (!limit.allowed) return rateLimitResponse(limit, correlationId);

  try {
    let body: { path?: unknown; visitorId?: unknown; referrer?: unknown } = {};
    try {
      body = (await request.json()) as typeof body;
    } catch {
      // Allow empty or ping payloads
    }

    const rawPath = typeof body.path === "string" ? body.path.trim().slice(0, 200) : "/";
    const rawVisitorId =
      typeof body.visitorId === "string" ? body.visitorId.trim().slice(0, 100) : "";
    const rawReferrer =
      typeof body.referrer === "string" ? body.referrer.trim().slice(0, 300) : null;
    const userAgent = request.headers.get("user-agent")?.slice(0, 300) ?? null;

    if (!rawVisitorId) {
      return apiJson({ error: "visitorId diperlukan." }, { status: 400, correlationId });
    }

    const supabase = await getSupabaseServerClient();
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id ?? null;

    const { error: insertError } = await supabase.from("site_visits").insert({
      path: rawPath || "/",
      visitor_id: rawVisitorId,
      referrer: rawReferrer,
      user_agent: userAgent,
      user_id: userId,
    });

    if (insertError) {
      logApiEvent("warn", ROUTE, correlationId, "Could not insert site visit record", insertError);
      return apiJson({ ok: false, error: insertError.message }, { status: 500, correlationId });
    }

    return apiJson({ ok: true }, { correlationId });
  } catch (error) {
    logApiEvent("error", ROUTE, correlationId, "Unhandled error in site visit tracking", error);
    return apiJson({ ok: false }, { status: 500, correlationId });
  }
}
