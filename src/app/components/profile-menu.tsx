"use client";

type ProfileMenuProps = {
  userName: string;
  onAccount: () => void;
  onPremium: () => void;
  onAdmin: () => void;
  onShortcuts: () => void;
  onSignOut: () => void;
  onDelete: () => void;
};

export function ProfileMenu({
  userName,
  onAccount,
  onPremium,
  onAdmin,
  onShortcuts,
  onSignOut,
  onDelete,
}: ProfileMenuProps) {
  return <div className="profile-menu" role="menu">
    <strong>{userName}</strong>
    <button onClick={onAccount} role="menuitem">♟ <span>Account</span></button>
    <button onClick={onPremium} role="menuitem">♛ <span>Premium</span></button>
    <button onClick={onAdmin} role="menuitem">▦ <span>Admin</span></button>
    <button onClick={onSignOut} role="menuitem">↪ <span>Logout</span></button>
    <button onClick={onShortcuts} role="menuitem">⌨ <span>Shortcuts</span></button>
    <button onClick={onDelete} role="menuitem">♲ <span>Delete Account</span></button>
  </div>;
}
