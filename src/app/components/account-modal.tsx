"use client";

import type { User } from "@supabase/supabase-js";
import { useState } from "react";
import { updateDisplayName } from "@/features/profile/profile-service";
import type { SupabaseClient } from "@supabase/supabase-js";

type AccountModalProps = {
  user: User | null;
  userName: string;
  supabase: SupabaseClient;
  onSaved: (displayName: string) => void;
  onClose: () => void;
};

export function AccountModal({ user, userName, supabase, onSaved, onClose }: AccountModalProps) {
  const avatar = user?.user_metadata.avatar_url as string | undefined;
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

  return <div className="modal-backdrop" role="presentation" onClick={onClose}>
    <section className="account-modal" role="dialog" aria-modal="true" aria-labelledby="account-title" onClick={(event) => event.stopPropagation()}>
      <button className="modal-close" onClick={onClose} aria-label="Tutup account">×</button>
      <p className="account-kicker" id="account-title">ACCOUNT</p>
      <div className="account-profile">
        {avatar ? <img src={avatar} alt="" /> : <div className="account-avatar">{userName.charAt(0).toUpperCase()}</div>}
        <div><label className="auth-field">Display name<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={80} disabled={saving} /></label><p>{user?.email}</p></div>
      </div>
      {error && <p className="task-error" role="alert">{error}</p>}
      <div className="account-actions"><button className="secondary-button" onClick={onClose} disabled={saving}>Close</button><button className="apply-button" onClick={() => void handleSave()} disabled={saving}>{saving ? "Saving..." : "Save"}</button></div>
    </section>
  </div>;
}
