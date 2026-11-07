"use client";

import type { User } from "@supabase/supabase-js";
import Image from "next/image";
import { useState } from "react";
import { getSafeAvatarUrl, updateDisplayName } from "@/features/profile/profile-service";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ProBadge } from "@/app/components/ui/pro-badge";
import { updateLeaderboardPrivacy } from "@/features/leaderboard/leaderboard-cloud";

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
  const [instagram, setInstagram] = useState<string>(() => {
    const raw = (user?.user_metadata?.social_links as Record<string, string>)?.instagram || user?.user_metadata?.instagram;
    if (typeof raw === "string") return raw;
    if (typeof window !== "undefined") {
      try {
        const stored = JSON.parse(window.localStorage.getItem("biarfokus.profile.social_links") || "{}");
        return stored.instagram || "";
      } catch {}
    }
    return "";
  });
  const [twitter, setTwitter] = useState<string>(() => {
    const raw = (user?.user_metadata?.social_links as Record<string, string>)?.twitter || user?.user_metadata?.twitter;
    if (typeof raw === "string") return raw;
    if (typeof window !== "undefined") {
      try {
        const stored = JSON.parse(window.localStorage.getItem("biarfokus.profile.social_links") || "{}");
        return stored.twitter || "";
      } catch {}
    }
    return "";
  });
  const [github, setGithub] = useState<string>(() => {
    const raw = (user?.user_metadata?.social_links as Record<string, string>)?.github || user?.user_metadata?.github;
    if (typeof raw === "string") return raw;
    if (typeof window !== "undefined") {
      try {
        const stored = JSON.parse(window.localStorage.getItem("biarfokus.profile.social_links") || "{}");
        return stored.github || "";
      } catch {}
    }
    return "";
  });
  const [linkedin, setLinkedin] = useState<string>(() => {
    const raw = (user?.user_metadata?.social_links as Record<string, string>)?.linkedin || user?.user_metadata?.linkedin;
    if (typeof raw === "string") return raw;
    if (typeof window !== "undefined") {
      try {
        const stored = JSON.parse(window.localStorage.getItem("biarfokus.profile.social_links") || "{}");
        return stored.linkedin || "";
      } catch {}
    }
    return "";
  });
  const [website, setWebsite] = useState<string>(() => {
    const raw = (user?.user_metadata?.social_links as Record<string, string>)?.website || user?.user_metadata?.website;
    if (typeof raw === "string") return raw;
    if (typeof window !== "undefined") {
      try {
        const stored = JSON.parse(window.localStorage.getItem("biarfokus.profile.social_links") || "{}");
        return stored.website || "";
      } catch {}
    }
    return "";
  });
  const [showOnLeaderboard, setShowOnLeaderboard] = useState<boolean>(() => {
    if (typeof user?.user_metadata?.show_on_leaderboard === "boolean") {
      return user.user_metadata.show_on_leaderboard;
    }
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("biarfokus.profile.show_on_leaderboard");
      if (stored !== null) return stored === "true";
    }
    return true;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const socialLinksData = {
        instagram: instagram.trim(),
        twitter: twitter.trim(),
        github: github.trim(),
        linkedin: linkedin.trim(),
        website: website.trim(),
      };
      if (typeof window !== "undefined") {
        window.localStorage.setItem("biarfokus.profile.occupation", occupation.trim());
        window.localStorage.setItem("biarfokus.profile.status_bio", statusBio.trim());
        window.localStorage.setItem("biarfokus.profile.show_on_leaderboard", String(showOnLeaderboard));
        window.localStorage.setItem("biarfokus.profile.social_links", JSON.stringify(socialLinksData));
      }
      if (user) {
        const savedName = await updateDisplayName(supabase, user.id, displayName);
        await Promise.all([
          supabase.auth.updateUser({
            data: {
              birth_date: birthDate.trim(),
              occupation: occupation.trim(),
              status_bio: statusBio.trim(),
              show_on_leaderboard: showOnLeaderboard,
              social_links: socialLinksData,
            },
          }),
          updateLeaderboardPrivacy(supabase, user.id, showOnLeaderboard),
        ]);
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

          {/* Media Sosial & Komunitas */}
          <div className="account-socials-section" style={{ marginTop: "18px", paddingTop: "14px", borderTop: "1px dashed var(--line)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
              <span style={{ fontSize: "1.1rem" }}>🌐</span>
              <strong style={{ fontSize: "0.88rem", color: "var(--ink)" }}>Media Sosial &amp; Portofolio</strong>
            </div>
            <p style={{ margin: "0 0 12px", fontSize: "0.78rem", color: "var(--muted)" }}>
              Tautkan akun sosial media agar muncul saat profil kamu dilihat di Papan Peringkat / Komunitas.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "10px" }}>
              <label className="account-field-label" style={{ margin: 0 }}>
                <span style={{ fontSize: "0.78rem" }}>📸 Instagram</span>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@username atau url"
                  disabled={saving}
                  className="account-display-input"
                  style={{ fontSize: "0.82rem", padding: "8px 10px" }}
                />
              </label>

              <label className="account-field-label" style={{ margin: 0 }}>
                <span style={{ fontSize: "0.78rem" }}>𝕏 Twitter / X</span>
                <input
                  type="text"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="@username atau url"
                  disabled={saving}
                  className="account-display-input"
                  style={{ fontSize: "0.82rem", padding: "8px 10px" }}
                />
              </label>

              <label className="account-field-label" style={{ margin: 0 }}>
                <span style={{ fontSize: "0.78rem" }}>🐙 GitHub</span>
                <input
                  type="text"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  placeholder="username atau url"
                  disabled={saving}
                  className="account-display-input"
                  style={{ fontSize: "0.82rem", padding: "8px 10px" }}
                />
              </label>

              <label className="account-field-label" style={{ margin: 0 }}>
                <span style={{ fontSize: "0.78rem" }}>💼 LinkedIn</span>
                <input
                  type="text"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="linkedin.com/in/... atau url"
                  disabled={saving}
                  className="account-display-input"
                  style={{ fontSize: "0.82rem", padding: "8px 10px" }}
                />
              </label>

              <label className="account-field-label" style={{ margin: 0, gridColumn: "1 / -1" }}>
                <span style={{ fontSize: "0.78rem" }}>🔗 Website / Portofolio</span>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://portofolio-kamu.com"
                  disabled={saving}
                  className="account-display-input"
                  style={{ fontSize: "0.82rem", padding: "8px 10px" }}
                />
              </label>
            </div>
          </div>
        </div>

        {error && (
          <p className="task-error" role="alert" style={{ margin: "0 24px 14px" }}>
            {error}
          </p>
        )}

        <label
            style={{
              marginTop: "16px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              fontSize: "0.86rem",
              fontWeight: 600,
              color: "var(--ink)",
              userSelect: "none",
            }}
          >
            <input
              type="checkbox"
              checked={showOnLeaderboard}
              onChange={(e) => setShowOnLeaderboard(e.target.checked)}
              disabled={saving}
              style={{ width: "16px", height: "16px", accentColor: "#f59e0b", cursor: "pointer" }}
            />
            <span>Tampilkan profil saya di Papan Peringkat (Leaderboard)</span>
          </label>

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
