"use client";

import { useEffect, useState } from "react";
import type { KanbanBoard } from "@/types/domain";
import { joinBoardViaInviteApi } from "@/features/kanban/kanban-cloud";

type KanbanJoinModalProps = {
  inviteCode: string | null;
  userId?: string | null;
  onClose: () => void;
  onJoined: (board: KanbanBoard) => void;
  onRequireLogin?: () => void;
};

export function KanbanJoinModal({
  inviteCode,
  userId,
  onClose,
  onJoined,
  onRequireLogin,
}: KanbanJoinModalProps) {
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse token info if available (e.g. from fallback code)
  const isEditorRole = !inviteCode || !inviteCode.includes("viewer");

  useEffect(() => {
    // If not logged in, prompt gently
    if (inviteCode && !userId && onRequireLogin) {
      // Keep notice ready
    }
  }, [inviteCode, userId, onRequireLogin]);

  if (!inviteCode) return null;

  async function handleJoin() {
    if (!inviteCode) return;
    if (!userId) {
      if (onRequireLogin) onRequireLogin();
      setError("Silakan masuk dengan akun BiarFokus kamu terlebih dahulu.");
      return;
    }

    setJoining(true);
    setError(null);

    const res = await joinBoardViaInviteApi(inviteCode);
    setJoining(false);

    if (res.ok && res.board) {
      // Clean query parameter from browser address bar
      if (typeof window !== "undefined" && window.history.replaceState) {
        const url = new URL(window.location.href);
        url.searchParams.delete("kanbanInvite");
        url.searchParams.delete("invite");
        window.history.replaceState({}, "", url.toString());
      }
      onJoined(res.board);
    } else {
      setError(res.error || "Gagal bergabung ke papan proyek.");
    }
  }

  function handleCancel() {
    if (typeof window !== "undefined" && window.history.replaceState) {
      const url = new URL(window.location.href);
      url.searchParams.delete("kanbanInvite");
      url.searchParams.delete("invite");
      window.history.replaceState({}, "", url.toString());
    }
    onClose();
  }

  return (
    <div className="kanban-modal-backdrop" role="presentation">
      <div className="kanban-share-modal kanban-join-modal" role="dialog" aria-modal="true">
        <div className="kanban-join-header-illustration">
          <span className="kanban-join-icon">🤝</span>
        </div>

        <div className="kanban-modal-header text-center" style={{ flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <h3 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 600 }}>
            Undangan Kolaborasi Papan Proyek
          </h3>
          <p className="kanban-modal-sub" style={{ fontSize: 13, color: "var(--muted)", maxWidth: 380 }}>
            Kamu diundang untuk bergabung dan berkolaborasi di ruang kerja <strong>Project Canban</strong>.
          </p>
        </div>

        {/* Role Privileges Card */}
        <div className="kanban-join-role-card">
          <div className="join-role-badge-row">
            <span className="join-role-badge">
              {isEditorRole ? "✏️ Peran: Editor Kolaborator" : "👁️ Peran: Viewer (Hanya Lihat)"}
            </span>
          </div>
          <p className="join-role-desc">
            {isEditorRole
              ? "Sebagai Editor, kamu dapat menambah kartu baru, memindahkan tahapan, mengatur PIC/anggota, serta mengedit checklist secara real-time bersama tim."
              : "Sebagai Viewer, kamu dapat melihat kemajuan tugas dan membaca detail kartu tanpa mengubah isi papan."}
          </p>
        </div>

        {error && (
          <div className="kanban-share-error" role="alert">
            ⚠️ {error}
          </div>
        )}

        {!userId && (
          <div className="kanban-join-login-notice">
            <span>💡 <strong>Login Diperlukan:</strong> Masuk dengan akun BiarFokus kamu agar papan proyek ini otomatis tersinkronisasi di profilmu.</span>
          </div>
        )}

        <div className="kanban-modal-footer join-footer" style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
          <button
            type="button"
            className="kanban-secondary-btn"
            onClick={handleCancel}
            disabled={joining}
          >
            Nanti Saja
          </button>
          <button
            type="button"
            className="kanban-primary-btn"
            onClick={handleJoin}
            disabled={joining}
            style={{ padding: "8px 22px", fontWeight: 700 }}
          >
            {joining ? "Bergabung..." : (userId ? "✓ Setuju & Gabung ke Papan" : "🔐 Masuk & Gabung")}
          </button>
        </div>
      </div>
    </div>
  );
}
