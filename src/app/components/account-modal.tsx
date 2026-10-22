"use client";

import type { User } from "@supabase/supabase-js";
import Image from "next/image";
import { useState } from "react";
import { getSafeAvatarUrl, updateDisplayName } from "@/features/profile/profile-service";
import type { SupabaseClient } from "@supabase/supabase-js";

type AccountModalProps = {
  user: User | null;
  userName: string;
  supabase: SupabaseClient;
  onSaved: (displayName: string) => void;
  onClose: () => void;
  onLogout?: () => void;
};

export function AccountModal({
  user,
  userName,
  supabase,
  onSaved,
  onClose,
  onLogout,
}: AccountModalProps) {
  const avatar = getSafeAvatarUrl(user?.user_metadata?.avatar_url);
  const [displayName, setDisplayName] = useState(userName);
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
        className="account-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} aria-label="Tutup akun">
          ×
        </button>

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
        <div className="account-actions" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", gap: "10px", marginTop: "18px" }}>
          {onLogout ? (
            <button
              type="button"
              className="danger-button account-logout-btn"
              onClick={() => {
                onClose();
                onLogout();
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "#dc2626",
                color: "#ffffff",
                borderRadius: "10px",
                padding: "9px 14px",
                fontSize: "13px",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
              }}
            >
              🚪 Keluar
            </button>
          ) : <div />}
          <div style={{ display: "flex", gap: "10px" }}>
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
        </div>
      </section>
    </div>
  );
}
