"use client";

import type { User } from "@supabase/supabase-js";
import Image from "next/image";
import { useState } from "react";
import { getSafeAvatarUrl, updateDisplayName } from "@/features/profile/profile-service";
import type { SupabaseClient } from "@supabase/supabase-js";
import { StatsView } from "./stats-view";

type AccountModalProps = {
  user: User | null;
  userName: string;
  supabase: SupabaseClient;
  completedTasks?: number;
  initialTab?: "profile" | "stats";
  onSaved: (displayName: string) => void;
  onClose: () => void;
};

export function AccountModal({
  user,
  userName,
  supabase,
  completedTasks = 0,
  initialTab = "profile",
  onSaved,
  onClose,
}: AccountModalProps) {
  const avatar = getSafeAvatarUrl(user?.user_metadata?.avatar_url);
  const [displayName, setDisplayName] = useState(userName);
  const [activeTab, setActiveTab] = useState<"profile" | "stats">(initialTab);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      const savedName = await updateDisplayName(supabase, user.id, displayName);
      onSaved(savedName);
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Gagal menyimpan profil.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className={`account-modal ${activeTab === "stats" ? "account-modal-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} aria-label="Tutup akun">
          ×
        </button>

        {/* Modal Tab Switcher */}
        <div className="account-modal-tabs" role="tablist">
          <button
            type="button"
            className={`account-tab-btn ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
            role="tab"
            aria-selected={activeTab === "profile"}
          >
            👤 Profil Akun
          </button>
          <button
            type="button"
            className={`account-tab-btn ${activeTab === "stats" ? "active" : ""}`}
            onClick={() => setActiveTab("stats")}
            role="tab"
            aria-selected={activeTab === "stats"}
          >
            📊 Statistik &amp; Pencapaian
          </button>
        </div>

        {activeTab === "profile" ? (
          <>
            <p className="account-kicker" id="account-title">
              PENGATURAN AKUN
            </p>
            <div className="account-profile">
              {avatar ? (
                <Image src={avatar} alt="" width={92} height={92} unoptimized />
              ) : (
                <div className="account-avatar">{userName.charAt(0).toUpperCase()}</div>
              )}
              <div>
                <label className="auth-field">
                  Display name
                  <input
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    maxLength={80}
                    disabled={saving}
                  />
                </label>
                <p>{user?.email}</p>
              </div>
            </div>
            {error && (
              <p className="task-error" role="alert">
                {error}
              </p>
            )}
            <div className="account-actions">
              <button className="secondary-button" onClick={onClose} disabled={saving}>
                Tutup
              </button>
              <button
                className="apply-button"
                onClick={() => void handleSave()}
                disabled={saving}
              >
                {saving ? "Menyimpan..." : "Simpan Profil"}
              </button>
            </div>
          </>
        ) : (
          <div className="account-stats-container">
            <StatsView
              supabase={supabase}
              userId={user?.id ?? null}
              completedTasks={completedTasks}
              embedded={true}
            />
          </div>
        )}
      </section>
    </div>
  );
}
