"use client";

type ProfileMenuProps = {
  userName: string;
  isAdmin: boolean;
  onAccount: () => void;
  onStats?: () => void;
  onPremium: () => void;
  onAdmin: () => void;
  onShortcuts: () => void;
  onSignOut: () => void;
  onDelete: () => void;
};

export function ProfileMenu({
  userName,
  isAdmin,
  onAccount,
  onStats,
  onPremium,
  onAdmin,
  onShortcuts,
  onSignOut,
  onDelete,
}: ProfileMenuProps) {
  return (
    <div className="profile-menu" role="menu">
      <strong>{userName}</strong>
      <button onClick={onAccount} role="menuitem">
        ♟ <span>Account</span>
      </button>
      {onStats && (
        <button onClick={onStats} role="menuitem">
          📊 <span>Statistik</span>
        </button>
      )}
      <button onClick={onPremium} role="menuitem">
        ♛ <span>Premium</span>
      </button>
      {isAdmin && (
        <button onClick={onAdmin} role="menuitem">
          ▦ <span>Admin</span>
        </button>
      )}
      <button onClick={onSignOut} role="menuitem">
        ↪ <span>Logout</span>
      </button>
      <button onClick={onShortcuts} role="menuitem">
        ⌨ <span>Shortcuts</span>
      </button>
      <button onClick={onDelete} role="menuitem">
        ♲ <span>Delete Account</span>
      </button>
    </div>
  );
}
