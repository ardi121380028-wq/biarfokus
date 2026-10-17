import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminAuditLog, AdminOverview, UserRole } from "@/types/domain";
import { formatApiError } from "../../lib/api/request-guard.ts";

export function normalizeUserRole(value: unknown): UserRole {
  return value === "admin" ? "admin" : "user";
}

export function isAdminRole(role: UserRole): boolean {
  return role === "admin";
}

export function validateAuditAction(action: string, targetType: string) {
  const normalizedAction = action.trim();
  const normalizedTargetType = targetType.trim();

  if (normalizedAction.length < 1 || normalizedAction.length > 120) {
    throw new Error("Nama aksi audit harus berisi 1 sampai 120 karakter.");
  }
  if (normalizedTargetType.length < 1 || normalizedTargetType.length > 80) {
    throw new Error("Tipe target audit harus berisi 1 sampai 80 karakter.");
  }

  return {
    action: normalizedAction,
    targetType: normalizedTargetType,
  };
}

export function getDayStartIso(now = new Date()): string {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return start.toISOString();
}

export function calculateAdminMetrics(input: {
  totalUsers: number;
  sessionsToday: Array<{ user_id: string }>;
  completedPomodoros: number;
  tasks: Array<{ completed: boolean }>;
  auditLogs: AdminAuditLog[];
}): AdminOverview {
  const uniqueActiveUsers = new Set(
    input.sessionsToday
      .map((session) => session.user_id)
      .filter((id) => typeof id === "string" && id.length > 0),
  );
  const completedTasks = input.tasks.filter((task) => task.completed).length;

  return {
    totalUsers: Math.max(0, input.totalUsers),
    activeUsersToday: uniqueActiveUsers.size,
    completedPomodoros: Math.max(0, input.completedPomodoros),
    totalTasks: input.tasks.length,
    completedTasks,
    auditLogs: input.auditLogs,
  };
}

export async function loadUserRole(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserRole> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return normalizeUserRole((data as { role?: unknown } | null)?.role);
}

export async function loadAdminOverview(
  supabase: SupabaseClient,
  now = new Date(),
): Promise<AdminOverview> {
  const todayStart = getDayStartIso(now);

  const [profilesRes, sessionsTodayRes, pomodorosRes, tasksRes, auditLogsRes] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("pomodoro_sessions")
      .select("user_id")
      .gte("completed_at", todayStart),
    supabase
      .from("pomodoro_sessions")
      .select("id", { count: "exact", head: true })
      .eq("mode", "pomodoro"),
    supabase.from("tasks").select("completed"),
    supabase
      .from("admin_audit_logs")
      .select("id, actor_user_id, action, target_type, target_id, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(15),
  ]);

  if (profilesRes.error) throw profilesRes.error;
  if (sessionsTodayRes.error) throw sessionsTodayRes.error;
  if (pomodorosRes.error) throw pomodorosRes.error;
  if (tasksRes.error) throw tasksRes.error;
  if (auditLogsRes.error) throw auditLogsRes.error;

  return calculateAdminMetrics({
    totalUsers: profilesRes.count ?? 0,
    sessionsToday: (sessionsTodayRes.data ?? []) as Array<{ user_id: string }>,
    completedPomodoros: pomodorosRes.count ?? 0,
    tasks: (tasksRes.data ?? []) as Array<{ completed: boolean }>,
    auditLogs: (auditLogsRes.data ?? []) as AdminAuditLog[],
  });
}

export async function createAdminAuditLog(
  supabase: SupabaseClient,
  actorUserId: string,
  action: string,
  targetType: string,
  targetId: string | null = null,
  metadata: Record<string, unknown> = {},
): Promise<AdminAuditLog> {
  const validated = validateAuditAction(action, targetType);
  const { data, error } = await supabase
    .from("admin_audit_logs")
    .insert({
      actor_user_id: actorUserId,
      action: validated.action,
      target_type: validated.targetType,
      target_id: targetId,
      metadata,
    })
    .select("id, actor_user_id, action, target_type, target_id, metadata, created_at")
    .single();

  if (error) throw error;
  return data as AdminAuditLog;
}

export async function fetchAdminOverviewFromApi(): Promise<AdminOverview> {
  const response = await fetch("/api/admin/overview", {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  const payload = (await response.json()) as {
    data?: AdminOverview;
    error?: string;
    correlationId?: string;
  };

  if (!response.ok || !payload.data) {
    throw new Error(formatApiError(payload, "Gagal memuat data admin."));
  }

  return payload.data;
}

export async function postAdminAuditLogToApi(
  action: string,
  targetType: string,
  targetId: string | null = null,
): Promise<AdminAuditLog> {
  const validated = validateAuditAction(action, targetType);
  const response = await fetch("/api/admin/overview", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      action: validated.action,
      targetType: validated.targetType,
      targetId,
    }),
  });

  const payload = (await response.json()) as {
    data?: AdminAuditLog;
    error?: string;
    correlationId?: string;
  };

  if (!response.ok || !payload.data) {
    throw new Error(formatApiError(payload, "Gagal mencatat audit log admin."));
  }

  return payload.data;
}

export async function loadAdminUsers(
  supabase: SupabaseClient,
  limit = 50,
): Promise<import("@/types/domain").AdminUserItem[]> {
  const [profilesRes, rolesRes, subsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, avatar_url, created_at")
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase.from("user_roles").select("user_id, role"),
    supabase.from("subscriptions").select("user_id, plan, status"),
  ]);

  if (profilesRes.error) throw profilesRes.error;
  if (rolesRes.error) throw rolesRes.error;
  if (subsRes.error) throw subsRes.error;

  const roleMap = new Map((rolesRes.data ?? []).map((r) => [r.user_id, normalizeUserRole(r.role)]));
  const subMap = new Map(
    (subsRes.data ?? []).map((s) => [
      s.user_id,
      {
        plan: s.plan === "pro" ? ("pro" as const) : ("free" as const),
        status: (s.status as import("@/types/domain").SubscriptionStatus) ?? "inactive",
      },
    ]),
  );

  return (profilesRes.data ?? []).map((p) => {
    const sub = subMap.get(p.id);
    return {
      id: p.id,
      displayName: p.display_name ?? null,
      avatarUrl: p.avatar_url ?? null,
      role: roleMap.get(p.id) ?? "user",
      plan: sub?.plan === "pro" ? "pro" : "free",
      status: sub?.status ?? "inactive",
      createdAt: p.created_at,
    };
  });
}

export async function updateUserPlanByAdmin(
  supabase: SupabaseClient,
  actorUserId: string,
  targetUserId: string,
  newPlan: "free" | "pro",
): Promise<{ success: boolean; plan: import("@/types/domain").SubscriptionPlan }> {
  const status: import("@/types/domain").SubscriptionStatus =
    newPlan === "pro" ? "active" : "inactive";

  const { error } = await supabase.from("subscriptions").upsert({
    user_id: targetUserId,
    plan: newPlan,
    status,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;

  await createAdminAuditLog(
    supabase,
    actorUserId,
    newPlan === "pro" ? "grant_pro_subscription" : "revoke_pro_subscription",
    "subscription",
    targetUserId,
    { plan: newPlan, status },
  );

  return { success: true, plan: newPlan };
}

export async function fetchAdminUsersFromApi(): Promise<import("@/types/domain").AdminUserItem[]> {
  const response = await fetch("/api/admin/users", {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  const payload = (await response.json()) as {
    data?: import("@/types/domain").AdminUserItem[];
    error?: string;
    correlationId?: string;
  };

  if (!response.ok || !payload.data) {
    throw new Error(formatApiError(payload, "Gagal memuat daftar pengguna."));
  }

  return payload.data;
}

export async function postUpdateUserPlanToApi(
  targetUserId: string,
  plan: "free" | "pro",
): Promise<void> {
  const response = await fetch("/api/admin/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ userId: targetUserId, plan }),
  });

  const payload = (await response.json()) as {
    error?: string;
    correlationId?: string;
  };

  if (!response.ok) {
    throw new Error(formatApiError(payload, "Gagal memperbarui paket pengguna."));
  }
}

