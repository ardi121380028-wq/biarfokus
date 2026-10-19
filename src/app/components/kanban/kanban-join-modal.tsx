"use client";

import { useState } from "react";
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

  if (!inviteCode) return null;

  async function handleJoin() {
    if (!inviteCode) return;
    if (!userId) {
      if (onRequireLogin) onRequireLogin();
      setError("Silakan masuk dengan akun kamu terlebih dahulu sebelum bergabung.");
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
    // Clean query parameter
    if (typeof window !== "undefined" && window.history.replaceState) {
      const url = new URL(window.location.href);
      url.searchParams.delete("kanbanInvite");
      url.searchParams.delete("invite");
      window.history.replaceState({}, "", url.toString());
    }
    onClose();
  }

  return (
    <div className="kanban-modal-backdrop">
      <div className="kanban-share-modal kanban-join-modal">
        <div className="kanban-join-header-illustration">
          <span className="kanban-join-icon">🤝</span>
        </div>
        <div className="kanban-modal-header text-center">
          <div>
            <h3>Undangan Kolaborasi Papan Proyek</h3>
            <p className="kanban-modal-sub">
              Temanmu mengundang kamu untuk bergabung dan berkolaborasi dalam papan proyek di BiarFokus.
            </p>
          </div>
        </div>

        {error && (
          <div className="kanban-share-error" role="alert">
            ⚠️ {error}
          </div>
        )}

        {!userId && (
          <div className="kanban-join-login-notice">
            <span>💡 Kamu belum masuk ke akun BiarFokus. Silakan masuk terlebih dahulu agar papan ini otomatis tersimpan di akunmu.</span>
          </div>
        )}

        <div className="kanban-modal-footer join-footer">
          <button
            type="button"
            className="kanban-btn-secondary"
            onClick={handleCancel}
            disabled={joining}
          >
            Nanti Saja
          </button>
          <button
            type="button"
            className="kanban-btn-primary"
            onClick={handleJoin}
            disabled={joining}
          >
            {joining ? "Bergabung..." : "✓ Gabung ke Papan"}
          </button>
        </div>
      </div>
    </div>
  );
}
