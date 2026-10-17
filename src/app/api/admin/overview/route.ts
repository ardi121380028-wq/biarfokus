import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  createAdminAuditLog,
  isAdminRole,
  loadAdminOverview,
  loadUserRole,
} from "@/features/admin/admin-service";

async function authorizeAdminRequest() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        { error: "Sesi login diperlukan untuk mengakses area admin." },
        { status: 401 },
      ),
    };
  }

  try {
    const role = await loadUserRole(supabase, data.user.id);
    if (!isAdminRole(role)) {
      return {
        authorized: false as const,
        response: NextResponse.json(
          { error: "Akses ditolak. Akun ini tidak memiliki izin admin." },
          { status: 403 },
        ),
      };
    }

    return {
      authorized: true as const,
      supabase,
      user: data.user,
    };
  } catch (roleError) {
    const message =
      roleError instanceof Error ? roleError.message : "Gagal memverifikasi role admin.";
    return {
      authorized: false as const,
      response: NextResponse.json({ error: message }, { status: 500 }),
    };
  }
}

export async function GET() {
  try {
    const auth = await authorizeAdminRequest();
    if (!auth.authorized) return auth.response;

    const overview = await loadAdminOverview(auth.supabase);
    return NextResponse.json({ data: overview });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal memuat ringkasan admin.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authorizeAdminRequest();
    if (!auth.authorized) return auth.response;

    const body = (await request.json()) as {
      action?: unknown;
      targetType?: unknown;
      targetId?: unknown;
    };

    const action = typeof body.action === "string" ? body.action : "";
    const targetType = typeof body.targetType === "string" ? body.targetType : "";
    const targetId = typeof body.targetId === "string" ? body.targetId : null;

    const logEntry = await createAdminAuditLog(
      auth.supabase,
      auth.user.id,
      action,
      targetType,
      targetId,
      { email: auth.user.email ?? null },
    );

    return NextResponse.json({ data: logEntry }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal mencatat audit log admin.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
