import type {
  LeaderboardEntry,
  LeaderboardMyRank,
  LeaderboardPeriod,
  LeaderboardTier,
} from "@/types/domain";

export const LEADERBOARD_PERIODS: ReadonlyArray<{
  id: LeaderboardPeriod;
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
}> = [
  {
    id: "weekly",
    label: "Minggu Ini",
    shortLabel: "Minggu",
    description: "Peringkat pekan ini (reset setiap hari Senin 00:00 WIB)",
    icon: "🔥",
  },
  {
    id: "daily",
    label: "Hari Ini",
    shortLabel: "Hari",
    description: "Sesi fokus hari ini (reset setiap tengah malam 00:00 WIB)",
    icon: "⚡",
  },
  {
    id: "monthly",
    label: "Bulan Ini",
    shortLabel: "Bulan",
    description: "Akumulasi jam fokus sepanjang bulan berjalan",
    icon: "🗓️",
  },
  {
    id: "all_time",
    label: "Sepanjang Masa",
    shortLabel: "All Time",
    description: "Hall of Fame pejuang fokus terbaik BiarFokus",
    icon: "👑",
  },
];

export type TierDetails = {
  tier: LeaderboardTier;
  label: string;
  badge: string;
  color: string;
  bg: string;
  minMinutes: number;
};

export function calculateTier(minutes: number, period: LeaderboardPeriod): LeaderboardTier {
  const safeMinutes = Math.max(0, minutes);

  if (period === "daily") {
    if (safeMinutes >= 300) return "legend"; // 5+ jam
    if (safeMinutes >= 150) return "master"; // 2.5 - 5 jam
    if (safeMinutes >= 60) return "consistent"; // 1 - 2.5 jam
    return "seed";
  }

  if (period === "weekly") {
    if (safeMinutes >= 1200) return "legend"; // 20+ jam
    if (safeMinutes >= 600) return "master"; // 10 - 20 jam
    if (safeMinutes >= 180) return "consistent"; // 3 - 10 jam
    return "seed";
  }

  if (period === "monthly") {
    if (safeMinutes >= 4800) return "legend"; // 80+ jam
    if (safeMinutes >= 2400) return "master"; // 40 - 80 jam
    if (safeMinutes >= 720) return "consistent"; // 12 - 40 jam
    return "seed";
  }

  // all_time
  if (safeMinutes >= 15000) return "legend"; // 250+ jam
  if (safeMinutes >= 6000) return "master"; // 100 - 250 jam
  if (safeMinutes >= 1500) return "consistent"; // 25 - 100 jam
  return "seed";
}

export function getTierDetails(tier: LeaderboardTier): TierDetails {
  switch (tier) {
    case "legend":
      return {
        tier: "legend",
        label: "Zen Legend",
        badge: "👑",
        color: "#8b5cf6",
        bg: "rgba(139, 92, 246, 0.12)",
        minMinutes: 1200,
      };
    case "master":
      return {
        tier: "master",
        label: "Master Deep Work",
        badge: "🏆",
        color: "#f59e0b",
        bg: "rgba(245, 158, 11, 0.12)",
        minMinutes: 600,
      };
    case "consistent":
      return {
        tier: "consistent",
        label: "Pejuang Konsisten",
        badge: "⚡",
        color: "#3b82f6",
        bg: "rgba(59, 130, 246, 0.12)",
        minMinutes: 180,
      };
    case "seed":
    default:
      return {
        tier: "seed",
        label: "Bibit Fokus",
        badge: "🌱",
        color: "#10b981",
        bg: "rgba(16, 185, 129, 0.12)",
        minMinutes: 0,
      };
  }
}

export function formatFocusTime(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  if (safe < 60) {
    return `${safe}m`;
  }
  const hours = Math.floor(safe / 60);
  const remainingMins = safe % 60;
  return remainingMins > 0 ? `${hours}j ${remainingMins}m` : `${hours}j`;
}

export function getPodium(entries: LeaderboardEntry[]): {
  first?: LeaderboardEntry;
  second?: LeaderboardEntry;
  third?: LeaderboardEntry;
} {
  return {
    first: entries.find((e) => e.rank === 1),
    second: entries.find((e) => e.rank === 2),
    third: entries.find((e) => e.rank === 3),
  };
}

export function calculateRankProgress(
  currentUserEntry: LeaderboardEntry,
  previousEntry?: LeaderboardEntry | null,
): { minutesToSurpass: number; pomodorosNeeded: number } | null {
  if (!previousEntry || currentUserEntry.rank <= 1) {
    return null;
  }
  const diffMinutes = Math.max(1, previousEntry.totalMinutes - currentUserEntry.totalMinutes + 1);
  const pomodorosNeeded = Math.ceil(diffMinutes / 25);
  return {
    minutesToSurpass: diffMinutes,
    pomodorosNeeded,
  };
}

export function mapDbLeaderboardRow(
  row: unknown,
  currentUserId?: string | null,
  period: LeaderboardPeriod = "weekly",
): LeaderboardEntry {
  if (typeof row !== "object" || row === null) {
    throw new Error("Data baris peringkat tidak valid.");
  }
  const r = row as Record<string, unknown>;

  const rank = Number(r.rank ?? r.user_rank ?? 0);
  const userId = String(r.user_id ?? r.agg_user_id ?? "");
  const displayName = String(r.display_name ?? r.user_name ?? "Pejuang Fokus").trim() || "Pejuang Fokus";
  const avatarUrl = typeof r.avatar_url === "string" ? r.avatar_url : typeof r.user_avatar === "string" ? r.user_avatar : null;
  const totalMinutes = Math.max(0, Number(r.total_minutes ?? r.agg_minutes ?? 0));
  const pomodoroCount = Math.max(0, Number(r.pomodoro_count ?? r.agg_count ?? 0));
  const isPro = Boolean(r.is_pro ?? r.user_is_pro ?? false);
  const isCurrentUser = Boolean(r.is_current_user ?? r.user_is_current ?? (currentUserId && userId === currentUserId));

  return {
    rank,
    userId,
    displayName,
    avatarUrl,
    totalMinutes,
    pomodoroCount,
    isPro,
    isCurrentUser,
    tier: calculateTier(totalMinutes, period),
  };
}

export function mapDbMyRankRow(row: unknown): LeaderboardMyRank {
  if (typeof row !== "object" || row === null) {
    throw new Error("Data status peringkat tidak valid.");
  }
  const r = row as Record<string, unknown>;
  return {
    rank: Math.max(1, Number(r.rank ?? r.user_rank ?? 1)),
    totalMinutes: Math.max(0, Number(r.total_minutes ?? r.agg_minutes ?? 0)),
    pomodoroCount: Math.max(0, Number(r.pomodoro_count ?? r.agg_count ?? 0)),
    totalParticipants: Math.max(1, Number(r.total_participants ?? r.total ?? 1)),
  };
}

/**
 * Provides vibrant sample community data when database has few records,
 * seamlessly inserting the real user into their accurate rank.
 */
export function generateSampleCommunityLeaderboard(
  period: LeaderboardPeriod,
  currentUser?: {
    id: string;
    name?: string | null;
    avatarUrl?: string | null;
    isPro?: boolean;
    minutes?: number;
    pomodoros?: number;
  } | null,
): LeaderboardEntry[] {
  // Calibrated benchmarks based on period
  const scale = period === "daily" ? 0.2 : period === "monthly" ? 3.5 : period === "all_time" ? 12 : 1;

  const mockPeers = [
    {
      name: "Rian Pangestu",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80",
      minutes: Math.round(580 * scale),
      pomodoros: Math.round(23 * scale),
      isPro: true,
    },
    {
      name: "Sarah Wijaya",
      avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&h=120&q=80",
      minutes: Math.round(440 * scale),
      pomodoros: Math.round(18 * scale),
      isPro: true,
    },
    {
      name: "Dimas Arya",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80",
      minutes: Math.round(390 * scale),
      pomodoros: Math.round(16 * scale),
      isPro: false,
    },
    {
      name: "Nabila Zahra",
      avatarUrl: null,
      minutes: Math.round(320 * scale),
      pomodoros: Math.round(13 * scale),
      isPro: true,
    },
    {
      name: "Kevin Ardiansyah",
      avatarUrl: null,
      minutes: Math.round(270 * scale),
      pomodoros: Math.round(11 * scale),
      isPro: false,
    },
    {
      name: "Citra Lestari",
      avatarUrl: null,
      minutes: Math.round(210 * scale),
      pomodoros: Math.round(8 * scale),
      isPro: false,
    },
    {
      name: "Fajar Nugraha",
      avatarUrl: null,
      minutes: Math.round(160 * scale),
      pomodoros: Math.round(6 * scale),
      isPro: false,
    },
    {
      name: "Aulia Rahma",
      avatarUrl: null,
      minutes: Math.round(110 * scale),
      pomodoros: Math.round(4 * scale),
      isPro: false,
    },
  ];

  type Candidate = {
    userId: string;
    displayName: string;
    avatarUrl: string | null;
    totalMinutes: number;
    pomodoroCount: number;
    isPro: boolean;
    isCurrentUser: boolean;
  };

  const candidates: Candidate[] = mockPeers.map((peer, idx) => ({
    userId: `sample-user-${idx + 1}`,
    displayName: peer.name,
    avatarUrl: peer.avatarUrl,
    totalMinutes: peer.minutes,
    pomodoroCount: peer.pomodoros,
    isPro: peer.isPro,
    isCurrentUser: false,
  }));

  // If user has focused time, insert them into the candidate pool
  if (currentUser?.id) {
    const userMins = currentUser.minutes ?? 125;
    const userPoms = currentUser.pomodoros ?? Math.max(1, Math.round(userMins / 25));
    candidates.push({
      userId: currentUser.id,
      displayName: currentUser.name?.trim() || "Kamu (Akun Saya)",
      avatarUrl: currentUser.avatarUrl ?? null,
      totalMinutes: userMins,
      pomodoroCount: userPoms,
      isPro: Boolean(currentUser.isPro),
      isCurrentUser: true,
    });
  }

  // Sort descending by totalMinutes then pomodoroCount
  candidates.sort((a, b) => b.totalMinutes - a.totalMinutes || b.pomodoroCount - a.pomodoroCount);

  // Assign ranks and calculate tiers
  return candidates.map((cand, idx) => ({
    rank: idx + 1,
    ...cand,
    tier: calculateTier(cand.totalMinutes, period),
  }));
}

