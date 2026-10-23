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
        className="account-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} aria-label="Tutup akun">
          ×
        </button>

        {/* Modal Header */}
        <div className="account-card-header">
          <div className="account-header-badge">👤</div>
          <div>
            <h2 id="account-title" className="account-header-title">Profil &amp; Akun</h2>
            <p className="account-header-sub">Kelola informasi identitas dan akun BiarFokus kamu</p>
          </div>
        </div>

        {/* Profile Card Summary Banner */}
        <div className="account-identity-banner">
          <div className="account-avatar-wrapper">
            {avatar ? (
              <Image src={avatar} alt="" width={68} height={68} className="account-avatar-img" unoptimized />
            ) : (
              <div className="account-avatar-placeholder">{userName.charAt(0).toUpperCase()}</div>
            )}
            <span className="account-avatar-status" title="Akun Aktif" />
          </div>

          <div className="account-identity-info">
            <div className="account-identity-name-row">
              <strong className="account-identity-name">{displayName || "Pengguna BiarFokus"}</strong>
              <span className="account-plan-badge">✨ Paket Free</span>
            </div>
            <p className="account-identity-email">
              <span>📧</span> {user?.email || "Tidak ada email"}
            </p>
          </div>
        </div>

        {/* Edit Form */}
        <div className="account-form-body">
          <label className="account-field-label">
            <span>Nama Tampilan (Display Name)</span>
            <div className="account-input-wrap">
              <input
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                maxLength={80}
                placeholder="Masukkan nama tampilan kamu..."
                disabled={saving}
                className="account-display-input"
              />
              <span className="account-char-count">{displayName.length}/80</span>
            </div>
            <span className="account-input-hint">
              Nama ini akan ditampilkan pada Kalender, Catatan, dan Kartu Kanban kamu.
            </span>
          </label>
        </div>

        {error && (
          <p className="task-error" role="alert" style={{ margin: "0 24px 14px" }}>
            {error}
          </p>
        )}

        {/* Actions Footer */}
        <div className="account-card-footer">
          {onLogout ? (
            <button
              type="button"
              className="account-logout-action-btn"
              onClick={() => {
                onClose();
                onLogout();
              }}
            >
              🚪 Keluar Akun
            </button>
          ) : <div />}

          <div className="account-footer-right">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={saving}
            >
              Batal
            </button>
            <button
              type="button"
              className="apply-button"
              onClick={() => void handleSave()}
              disabled={saving || !displayName.trim()}
            >
              {saving ? "Menyimpan..." : "Simpan Profil"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
