"use client";

import type { User } from "@supabase/supabase-js";
import Image from "next/image";
import { useState } from "react";
import { getSafeAvatarUrl, updateDisplayName } from "@/features/profile/profile-service";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ProBadge } from "@/app/components/ui/pro-badge";

type AccountModalProps = {
  user: User | null;
  userName: string;
  isPro?: boolean;
  supabase: SupabaseClient;
  onSaved: (displayName: string) => void;
  onClose: () => void;
  onLogout?: () => void;
  onDeleteAccount?: () => void;
};

export function AccountModal({
  user,
  userName,
  isPro = false,
  supabase,
  onSaved,
  onClose,
  onLogout,
  onDeleteAccount,
}: AccountModalProps) {
  const avatar = getSafeAvatarUrl(user?.user_metadata?.avatar_url);
  const [displayName, setDisplayName] = useState(userName);
  const [birthDate, setBirthDate] = useState<string>(() => {
    return (user?.user_metadata?.birth_date as string) || "";
  });
  const [occupation, setOccupation] = useState<string>(() => {
    if (user?.user_metadata?.occupation) return user.user_metadata.occupation as string;
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("biarfokus.profile.occupation") || "";
    }
    return "";
  });
  const [statusBio, setStatusBio] = useState<string>(() => {
    if (user?.user_metadata?.status_bio) return user.user_metadata.status_bio as string;
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("biarfokus.profile.status_bio") || "";
    }
    return "";
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("biarfokus.profile.occupation", occupation.trim());
        window.localStorage.setItem("biarfokus.profile.status_bio", statusBio.trim());
      }
      if (user) {
        const savedName = await updateDisplayName(supabase, user.id, displayName);
        await supabase.auth.updateUser({
          data: {
            birth_date: birthDate.trim(),
            occupation: occupation.trim(),
            status_bio: statusBio.trim(),
          },
        });
        onSaved(savedName);
      } else {
        onSaved(displayName);
      }
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Gagal menyimpan profil.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop account-modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="account-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="modal-close account-modal-close" onClick={onClose} aria-label="Tutup akun">
          ×
        </button>

        {/* Modal Header */}
        <div className="account-card-header">
          <div className="account-header-badge">👤</div>
          <div>
            <h2 id="account-title" className="account-header-title">Profil &amp; Akun</h2>
            <p className="account-header-sub">Kelola informasi identitas, profesi, dan status fokus kamu</p>
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
              {isPro ? (
                <ProBadge size="md" />
              ) : (
                <span className="free-plan-badge">Free</span>
              )}
            </div>
            {occupation && (
              <span className="account-identity-role">💼 {occupation}</span>
            )}
            {statusBio && (
              <p className="account-identity-status-bio">✨ &ldquo;{statusBio}&rdquo;</p>
            )}
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

          <div className="account-form-grid-row">
            <label className="account-field-label">
              <span>Pekerjaan / Profesi</span>
              <div className="account-input-wrap">
                <input
                  type="text"
                  value={occupation}
                  onChange={(event) => setOccupation(event.target.value)}
                  maxLength={60}
                  placeholder="Misal: Software Engineer, Desainer, Mahasiswa..."
                  disabled={saving}
                  className="account-display-input"
                />
              </div>
            </label>

            <label className="account-field-label">
              <span>Tanggal Lahir (Opsional)</span>
              <div className="account-input-wrap">
                <input
                  type="date"
                  value={birthDate}
                  onChange={(event) => setBirthDate(event.target.value)}
                  disabled={saving}
                  className="account-display-input account-date-input"
                />
              </div>
            </label>
          </div>

          <label className="account-field-label" style={{ marginTop: "14px" }}>
            <span>Status / Bio Fokus Singkat</span>
            <div className="account-input-wrap">
              <input
                type="text"
                value={statusBio}
                onChange={(event) => setStatusBio(event.target.value)}
                maxLength={100}
                placeholder="Misal: Sedang menyelesaikan skripsi 🚀 / Deep work jam 9-12"
                disabled={saving}
                className="account-display-input"
              />
              <span className="account-char-count">{statusBio.length}/100</span>
            </div>
            <span className="account-input-hint">
              Status ini memberi motivasi personal pada dashboard profil kamu.
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
          <div className="account-footer-left">
            {onLogout && (
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
            )}
            {onDeleteAccount && (
              <button
                type="button"
                className="account-delete-action-btn"
                onClick={onDeleteAccount}
                title="Hapus akun permanen"
              >
                🗑️ Hapus Akun
              </button>
            )}
          </div>

          <div className="account-footer-right">
            <button
              type="button"
              className="account-cancel-btn"
              onClick={onClose}
              disabled={saving}
            >
              Batal
            </button>
            <button
              type="button"
              className="account-save-btn"
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
