"use client";

import type { User } from "@supabase/supabase-js";

type AccountModalProps = {
  user: User | null;
  userName: string;
  onClose: () => void;
};

export function AccountModal({ user, userName, onClose }: AccountModalProps) {
  const avatar = user?.user_metadata.avatar_url as string | undefined;
  return <div className="modal-backdrop" role="presentation" onClick={onClose}>
    <section className="account-modal" role="dialog" aria-modal="true" aria-labelledby="account-title" onClick={(event) => event.stopPropagation()}>
      <button className="modal-close" onClick={onClose} aria-label="Tutup account">×</button>
      <p className="account-kicker" id="account-title">ACCOUNT</p>
      <div className="account-profile">
        {avatar ? <img src={avatar} alt="" /> : <div className="account-avatar">{userName.charAt(0).toUpperCase()}</div>}
        <div><h2>{userName}</h2><p>{user?.email}</p></div>
      </div>
      <div className="account-actions"><button className="secondary-button" onClick={onClose}>Close</button><button className="apply-button" onClick={onClose}>Save</button></div>
    </section>
  </div>;
}
