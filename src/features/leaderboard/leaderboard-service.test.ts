import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculateRankProgress,
  calculateTier,
  formatFocusTime,
  getPodium,
  getTierDetails,
  mapDbLeaderboardRow,
  mapDbMyRankRow,
  generateSampleCommunityLeaderboard,
} from "./leaderboard-service.ts";

describe("leaderboard tiers & details", () => {
  it("determines correct tiers for weekly period", () => {
    assert.equal(calculateTier(0, "weekly"), "seed");
    assert.equal(calculateTier(150, "weekly"), "seed");
    assert.equal(calculateTier(180, "weekly"), "consistent");
    assert.equal(calculateTier(599, "weekly"), "consistent");
    assert.equal(calculateTier(600, "weekly"), "master");
    assert.equal(calculateTier(1199, "weekly"), "master");
    assert.equal(calculateTier(1200, "weekly"), "legend");
    assert.equal(calculateTier(2500, "weekly"), "legend");
  });

  it("determines correct tiers for daily period", () => {
    assert.equal(calculateTier(30, "daily"), "seed");
    assert.equal(calculateTier(60, "daily"), "consistent");
    assert.equal(calculateTier(150, "daily"), "master");
    assert.equal(calculateTier(300, "daily"), "legend");
  });

  it("returns appropriate badge and label for each tier", () => {
    const seed = getTierDetails("seed");
    assert.equal(seed.badge, "🌱");
    assert.equal(seed.label, "Bibit Fokus");

    const consistent = getTierDetails("consistent");
    assert.equal(consistent.badge, "⚡");

    const master = getTierDetails("master");
    assert.equal(master.badge, "🏆");

    const legend = getTierDetails("legend");
    assert.equal(legend.badge, "👑");
  });
});

describe("leaderboard formatting & podium", () => {
  it("formats focus minutes into friendly Indonesian hours & minutes", () => {
    assert.equal(formatFocusTime(0), "0m");
    assert.equal(formatFocusTime(45), "45m");
    assert.equal(formatFocusTime(60), "1j");
    assert.equal(formatFocusTime(125), "2j 5m");
  });

  it("extracts first, second, and third place for podium correctly", () => {
    const sampleEntries = [
      {
        rank: 1,
        userId: "u1",
        displayName: "Juara 1",
        avatarUrl: null,
        totalMinutes: 500,
        pomodoroCount: 20,
        isPro: true,
        isCurrentUser: false,
        tier: "master" as const,
      },
      {
        rank: 2,
        userId: "u2",
        displayName: "Juara 2",
        avatarUrl: null,
        totalMinutes: 400,
        pomodoroCount: 16,
        isPro: false,
        isCurrentUser: false,
        tier: "consistent" as const,
      },
      {
        rank: 3,
        userId: "u3",
        displayName: "Juara 3",
        avatarUrl: null,
        totalMinutes: 300,
        pomodoroCount: 12,
        isPro: false,
        isCurrentUser: false,
        tier: "consistent" as const,
      },
      {
        rank: 4,
        userId: "u4",
        displayName: "Rank 4",
        avatarUrl: null,
        totalMinutes: 200,
        pomodoroCount: 8,
        isPro: false,
        isCurrentUser: false,
        tier: "consistent" as const,
      },
    ];

    const podium = getPodium(sampleEntries);
    assert.equal(podium.first?.displayName, "Juara 1");
    assert.equal(podium.second?.displayName, "Juara 2");
    assert.equal(podium.third?.displayName, "Juara 3");
  });

  it("calculates progress needed to surpass higher rank", () => {
    const user = {
      rank: 4,
      userId: "u4",
      displayName: "Saya",
      avatarUrl: null,
      totalMinutes: 100,
      pomodoroCount: 4,
      isPro: false,
      isCurrentUser: true,
      tier: "consistent" as const,
    };
    const higherUser = {
      rank: 3,
      userId: "u3",
      displayName: "Rival",
      avatarUrl: null,
      totalMinutes: 120,
      pomodoroCount: 5,
      isPro: false,
      isCurrentUser: false,
      tier: "consistent" as const,
    };

    const progress = calculateRankProgress(user, higherUser);
    assert.ok(progress);
    // Needs 120 - 100 + 1 = 21 minutes
    assert.equal(progress.minutesToSurpass, 21);
    // 21 mins / 25 = 1 pomodoro
    assert.equal(progress.pomodorosNeeded, 1);

    // If rank is 1, return null
    assert.equal(calculateRankProgress({ ...user, rank: 1 }, null), null);
  });
});

describe("database row mapping", () => {
  it("maps valid database row accurately", () => {
    const raw = {
      user_rank: 2,
      agg_user_id: "00000000-0000-0000-0000-000000000001",
      user_name: "Budi Santoso",
      user_avatar: "https://example.com/avatar.jpg",
      agg_minutes: 250,
      agg_count: 10,
      user_is_pro: true,
      user_is_current: false,
    };

    const entry = mapDbLeaderboardRow(raw, "00000000-0000-0000-0000-000000000002", "weekly");
    assert.equal(entry.rank, 2);
    assert.equal(entry.displayName, "Budi Santoso");
    assert.equal(entry.totalMinutes, 250);
    assert.equal(entry.pomodoroCount, 10);
    assert.equal(entry.isPro, true);
    assert.equal(entry.isCurrentUser, false);
    assert.equal(entry.tier, "consistent");
  });

  it("identifies current user correctly when user_is_current is true", () => {
    const raw = {
      user_rank: 1,
      agg_user_id: "my-id",
      user_name: "Saya",
      agg_minutes: 650,
      agg_count: 26,
      user_is_current: true,
    };

    const entry = mapDbLeaderboardRow(raw, "my-id", "weekly");
    assert.equal(entry.isCurrentUser, true);
    assert.equal(entry.tier, "master");
  });

  it("maps my rank row correctly", () => {
    const raw = {
      user_rank: 7,
      agg_minutes: 180,
      agg_count: 7,
      total: 45,
    };
    const myRank = mapDbMyRankRow(raw);
    assert.equal(myRank.rank, 7);
    assert.equal(myRank.totalMinutes, 180);
    assert.equal(myRank.pomodoroCount, 7);
    assert.equal(myRank.totalParticipants, 45);
  });

  it("generates realistic sample community leaderboard with current user inserted", () => {
    const sample = generateSampleCommunityLeaderboard("weekly", {
      id: "test-user-id",
      name: "Akun Test",
      minutes: 350,
      pomodoros: 14,
      isPro: true,
    });

    assert.ok(sample.length > 5);
    const userInList = sample.find((e) => e.isCurrentUser);
    assert.ok(userInList);
    assert.equal(userInList.displayName, "Akun Test");
    assert.equal(userInList.totalMinutes, 350);
    // Ranks should be strictly ascending 1, 2, 3...
    sample.forEach((item, idx) => {
      assert.equal(item.rank, idx + 1);
    });
  });
});

