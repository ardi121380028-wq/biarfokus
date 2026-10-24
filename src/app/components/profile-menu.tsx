"use client";

type ProfileMenuProps = {
  userName: string;
  isPro?: boolean;
  isAdmin: boolean;
  onAccount: () => void;
  onStats?: () => void;
  onSettings?: () => void;
  onPremium: () => void;
  onAdmin: () => void;
  onSignOut: () => void;
};

export function ProfileMenu({
  userName,
  isPro = false,
  isAdmin,
  onAccount,
  onStats,
  onSettings,
  onPremium,
  onAdmin,
  onSignOut,
}: ProfileMenuProps) {
  return (
    <div className="cal-topbar-profile-menu app-shell-profile-menu" role="menu">
      <div className="cal-profile-menu-header">
        <strong>{userName || "Akun Saya"}</strong>
        <span className="cal-profile-menu-sub">BiarFokus Workspace</span>
      </div>

      <button
        type="button"
        className="cal-profile-menu-item"
        onClick={onAccount}
        role="menuitem"
      >
        👤 Profil &amp; Akun
      </button>

      {onStats && (
        <button
          type="button"
          className="cal-profile-menu-item"
          onClick={onStats}
          role="menuitem"
        >
          📊 Statistik
        </button>
      )}

      {onSettings && (
        <button
          type="button"
          className="cal-profile-menu-item"
          onClick={onSettings}
          role="menuitem"
        >
          ⚙️ Pengaturan
        </button>
      )}

      <button
        type="button"
        className="cal-profile-menu-item"
        onClick={onPremium}
        role="menuitem"
      >
        {isPro ? "👑 BiarFokus Pro (Aktif)" : "💎 Upgrade Pro"}
      </button>

      {isAdmin && (
        <button
          type="button"
          className="cal-profile-menu-item"
          onClick={onAdmin}
          role="menuitem"
        >
          🎛️ Admin Dashboard
        </button>
      )}

      <button
        type="button"
        className="cal-profile-menu-item cal-profile-logout-item danger"
        onClick={onSignOut}
        role="menuitem"
      >
        🚪 Keluar
      </button>
    </div>
  );
}
