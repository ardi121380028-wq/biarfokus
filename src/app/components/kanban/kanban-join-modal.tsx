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

  // Initial inferred role from code prefix
  const initialRole: "editor" | "viewer" =
    inviteCode && (inviteCode.includes("viewer") || inviteCode.includes("_v_"))
      ? "viewer"
      : "editor";

  const [role, setRole] = useState<"editor" | "viewer">(initialRole);
  const [boardTitle, setBoardTitle] = useState<string>("Project Canban");
  const [loadingInfo, setLoadingInfo] = useState<boolean>(true);

  // Inspect invite details from server on mount
  useEffect(() => {
    if (!inviteCode) return;
    let cancelled = false;

    fetch(`/api/kanban/join?inviteCode=${encodeURIComponent(inviteCode)}`)
      .then((res) => res.json())
      .then((data: { ok?: boolean; role?: "editor" | "viewer"; boardTitle?: string }) => {
        if (cancelled) return;
        if (data.ok) {
          if (data.role) setRole(data.role);
          if (data.boardTitle) setBoardTitle(data.boardTitle);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingInfo(false);
      });

    return () => {
      cancelled = true;
    };
  }, [inviteCode]);

  if (!inviteCode) return null;

  const isEditorRole = role === "editor";

  async function handleJoin() {
    if (!inviteCode) return;

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
            Kamu diundang untuk bergabung ke papan <strong>{loadingInfo ? "memuat..." : boardTitle}</strong>.
          </p>
        </div>

        {/* Role Privileges Card */}
        <div className="kanban-join-role-card">
          <div className="join-role-badge-row">
            <span className={`join-role-badge ${isEditorRole ? "editor" : "viewer"}`}>
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
          <div className="kanban-join-login-notice" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <span>💡 Masuk untuk sinkronisasi otomatis ke akun cloud BiarFokus kamu.</span>
            {onRequireLogin && (
              <button
                type="button"
                className="kanban-text-btn"
                onClick={onRequireLogin}
                style={{ fontWeight: 700, color: "var(--blue)", flexShrink: 0 }}
              >
                Masuk
              </button>
            )}
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
            {joining ? "Bergabung..." : (isEditorRole ? "✓ Setuju & Gabung sebagai Editor" : "✓ Masuk sebagai Viewer")}
          </button>
        </div>
      </div>
    </div>
  );
}
