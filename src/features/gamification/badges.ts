export type BadgeId =
  | "first_pomodoro"
  | "streak_3"
  | "streak_7"
  | "pomodoros_10"
  | "pomodoros_50"
  | "century_club"
  | "deep_work";

export type BadgeDefinition = {
  id: BadgeId;
  title: string;
  description: string;
  icon: string;
  target: number;
  unit: string;
};

export const BADGE_DEFINITIONS: ReadonlyArray<BadgeDefinition> = [
  {
    id: "first_pomodoro",
    title: "Fokus Perdana",
    description: "Selesaikan 1 sesi Pomodoro pertamamu",
    icon: "🎯",
    target: 1,
    unit: "sesi",
  },
  {
    id: "streak_3",
    title: "Konsistensi 3 Hari",
    description: "Capai streak fokus 3 hari berturut-turut",
    icon: "🔥",
    target: 3,
    unit: "hari",
  },
  {
    id: "streak_7",
    title: "Juara 7 Hari",
    description: "Pertahankan fokus selama 7 hari berturut-turut",
    icon: "⚡",
    target: 7,
    unit: "hari",
  },
  {
    id: "pomodoros_10",
    title: "Fokus Mantap",
    description: "Kumpulkan 10 sesi Pomodoro selesai",
    icon: "🍅",
    target: 10,
    unit: "sesi",
  },
  {
    id: "pomodoros_50",
    title: "Master Produktif",
    description: "Kumpulkan 50 sesi Pomodoro selesai",
    icon: "🏆",
    target: 50,
    unit: "sesi",
  },
  {
    id: "century_club",
    title: "Century Club",
    description: "Selesaikan 100 sesi Pomodoro",
    icon: "👑",
    target: 100,
    unit: "sesi",
  },
  {
    id: "deep_work",
    title: "Sesi Deep Work",
    description: "Selesaikan sesi fokus berdurasi minimal 50 menit",
    icon: "🧘",
    target: 1,
    unit: "sesi",
  },
];

export type UserBadgeStatus = BadgeDefinition & {
  unlocked: boolean;
  current: number;
  progressPercent: number;
};

export function evaluateBadges(input: {
  totalPomodoros: number;
  currentStreak: number;
  longestStreak: number;
  deepWorkCount?: number;
}): UserBadgeStatus[] {
  const { totalPomodoros, longestStreak, deepWorkCount = 0 } = input;

  return BADGE_DEFINITIONS.map((badge) => {
    let current = 0;
    switch (badge.id) {
      case "first_pomodoro":
      case "pomodoros_10":
      case "pomodoros_50":
      case "century_club":
        current = Math.max(0, totalPomodoros);
        break;
      case "streak_3":
      case "streak_7":
        current = Math.max(0, longestStreak);
        break;
      case "deep_work":
        current = Math.max(0, deepWorkCount);
        break;
    }

    const unlocked = current >= badge.target;
    const progressPercent = Math.min(100, Math.round((current / badge.target) * 100));

    return {
      ...badge,
      unlocked,
      current,
      progressPercent,
    };
  });
}
