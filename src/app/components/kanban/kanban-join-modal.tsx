"use client";

import { useEffect, useState } from "react";
import type { KanbanBoard } from "@/types/domain";
import { joinBoardViaInviteApi } from "@/features/kanban/kanban-cloud";

type KanbanJoinModalProps = {
  inviteCode: string | null;
  userId?: string | null;
  userName?: string;
  onClose: () => void;
  onJoined: (board: KanbanBoard) => void;
  onPreview: (board: KanbanBoard, ownerName?: string) => void;
  onRequireLogin?: () => void;
};

export function KanbanJoinModal({
  inviteCode,
  userId,
  onClose,
  onJoined,
  onPreview,
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
  const [boardTitle, setBoardTitle] = useState<string>("Papan Proyek");
  const [ownerName, setOwnerName] = useState<string>("Pemilik Papan");
  const [previewBoard, setPreviewBoard] = useState<KanbanBoard | null>(null);
  const [loadingInfo, setLoadingInfo] = useState<boolean>(true);

  // Save invite code to cookie & localStorage as soon as modal mounts so it's never lost
  useEffect(() => {
    if (!inviteCode || typeof window === "undefined") return;
    try {
      localStorage.setItem("biarfokus.pending_kanban_invite", inviteCode);
      document.cookie = `bf_pending_invite=${encodeURIComponent(inviteCode)}; path=/; max-age=86400; SameSite=Lax`;
    } catch {}
  }, [inviteCode]);

  // Inspect invite details from server on mount
  useEffect(() => {
    if (!inviteCode) return;
    let cancelled = false;

    fetch(`/api/kanban/join?inviteCode=${encodeURIComponent(inviteCode)}`)
      .then((res) => res.json())
      .then(
        (data: {
          ok?: boolean;
          role?: "editor" | "viewer";
          boardTitle?: string;
          ownerName?: string;
          board?: KanbanBoard | null;
        }) => {
          if (cancelled) return;
          if (data.ok) {
            if (data.role) setRole(data.role);
            if (data.boardTitle) setBoardTitle(data.boardTitle);
            if (data.ownerName) setOwnerName(data.ownerName);
            if (data.board) setPreviewBoard(data.board);
          }
        },
      )
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
  const isOwnerOfInvitedBoard = Boolean(userId && previewBoard && previewBoard.userId === userId);

  async function handleJoin() {
    if (!inviteCode) return;

    setJoining(true);
    setError(null);

    const res = await joinBoardViaInviteApi(inviteCode);
    setJoining(false);

    if (res.ok && res.board) {
      // Clean query parameter and pending cookie
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("biarfokus.pending_kanban_invite");
          document.cookie = "bf_pending_invite=; path=/; max-age=0";
          if (window.history.replaceState) {
            const url = new URL(window.location.href);
            url.searchParams.delete("kanbanInvite");
            url.searchParams.delete("invite");
            window.history.replaceState({}, "", url.toString());
          }
        } catch {}
      }
      onJoined(res.board);
    } else {
      setError(res.error || "Gagal bergabung ke papan proyek.");
    }
  }

  function handleOpenPreview() {
    const fallbackBoard: KanbanBoard = previewBoard || {
      id: "preview-board",
      title: boardTitle,
      description: "Pratinjau mode tamu",
      background: "wave-blue",
      lists: [],
      starred: false,
      role,
      isShared: true,
      createdAt: new Date().toLocaleDateString("id-ID"),
      updatedAt: new Date().toLocaleDateString("id-ID"),
    };
    onPreview(fallbackBoard, ownerName);
  }

  function handleCancel() {
    if (typeof window !== "undefined" && window.history.replaceState) {
      try {
        localStorage.removeItem("biarfokus.pending_kanban_invite");
        document.cookie = "bf_pending_invite=; path=/; max-age=0";
        const url = new URL(window.location.href);
        url.searchParams.delete("kanbanInvite");
        url.searchParams.delete("invite");
        window.history.replaceState({}, "", url.toString());
      } catch {}
    }
    onClose();
  }

  return (
    <div className="kanban-modal-backdrop" role="presentation">
      <div className="kanban-share-modal kanban-join-modal" role="dialog" aria-modal="true" style={{ maxWidth: 520 }}>
        <div className="kanban-join-header-illustration">
          <span className="kanban-join-icon">🤝</span>
        </div>

        <div className="kanban-modal-header text-center" style={{ flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <h3 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, margin: "6px 0" }}>
            Undangan Kolaborasi Papan Proyek
          </h3>
          <p className="kanban-modal-sub" style={{ fontSize: 13.5, color: "var(--muted)", maxWidth: 420 }}>
            Kamu diundang oleh <strong>{ownerName}</strong> untuk berkolaborasi di papan{" "}
            <strong>{loadingInfo ? "memuat..." : boardTitle}</strong>.
          </p>
        </div>

        {/* Role Privileges Card or Owner Notice */}
        {isOwnerOfInvitedBoard ? (
          <div
            className="kanban-join-role-card"
            style={{
              margin: "14px 0",
              background: "color-mix(in srgb, #0284c7 10%, var(--paper))",
              border: "1.5px solid #0284c7",
              borderRadius: 14,
              padding: "14px 16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ fontSize: 28, lineHeight: 1 }}>👑</span>
              <div>
                <strong style={{ fontSize: 14, color: "var(--ink)", display: "block" }}>
                  Kamu Adalah Pemilik Papan Ini
                </strong>
                <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "4px 0 0", lineHeight: 1.5 }}>
                  Kamu memiliki akses penuh sebagai Owner di papan <strong>{boardTitle}</strong>. Tautan undangan ini dibuat untuk kamu bagikan kepada rekan tim.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="kanban-join-role-card" style={{ margin: "14px 0" }}>
            <div className="join-role-badge-row">
              <span className={`join-role-badge ${isEditorRole ? "editor" : "viewer"}`}>
                {isEditorRole ? "✏️ Peran: Editor (Bisa Edit & Pindah Kartu)" : "👁️ Peran: Viewer (Hanya Lihat)"}
              </span>
            </div>
            <p className="join-role-desc" style={{ fontSize: 12.5, lineHeight: 1.5, marginTop: 6 }}>
              {isEditorRole
                ? "Sebagai Editor, kamu dapat menambah kartu baru, memindahkan tahapan, mengatur PIC, serta mengedit checklist secara real-time bersama tim."
                : "Sebagai Viewer, kamu dapat melihat progres tahapan tugas dan membaca detail kartu tanpa mengubah isi papan."}
            </p>
          </div>
        )}

        {error && (
          <div className="kanban-share-error" role="alert" style={{ marginBottom: 12 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Guest Flow vs Logged-In Flow */}
        {!userId ? (
          <div className="kanban-join-options-box" style={{ display: "flex", flexDirection: "column", gap: 10, margin: "14px 0" }}>
            <div
              style={{
                border: "1px solid color-mix(in srgb, var(--ink) 12%, transparent)",
                borderRadius: 12,
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                background: "color-mix(in srgb, var(--ink) 3%, var(--paper))",
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--ink)" }}>
                  👀 Lihat Projek (Tanpa Login)
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                  Jelajahi tahapan & kartu proyek dalam mode pratinjau baca.
                </div>
              </div>
              <button
                type="button"
                className="kanban-secondary-btn kanban-join-preview-btn"
                onClick={handleOpenPreview}
                style={{
                  padding: "8px 16px",
                  fontSize: 12.5,
                  flexShrink: 0,
                  fontWeight: 700,
                  background: "var(--paper)",
                  color: "var(--ink)",
                  border: "1.5px solid color-mix(in srgb, var(--ink) 24%, transparent)",
                  borderRadius: 10,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  cursor: "pointer",
                }}
              >
                Buka Pratinjau →
              </button>
            </div>

            <div
              style={{
                border: "1.5px solid var(--blue)",
                borderRadius: 12,
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                background: "color-mix(in srgb, var(--blue) 8%, var(--paper))",
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--ink)" }}>
                  🚀 Login & Bergabung ke Projek
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                  Masuk dengan akun BiarFokus agar papan otomatis tersimpan.
                </div>
              </div>
              <button
                type="button"
                className="kanban-primary-btn"
                onClick={() => {
                  try {
                    localStorage.setItem("biarfokus.pending_auto_join", "true");
                    localStorage.setItem("biarfokus.pending_kanban_invite", inviteCode);
                    document.cookie = `bf_pending_invite=${encodeURIComponent(inviteCode)}; path=/; max-age=86400; SameSite=Lax`;
                  } catch {}
                  onRequireLogin?.();
                }}
                style={{ padding: "8px 16px", fontSize: 12.5, flexShrink: 0, fontWeight: 700 }}
              >
                Masuk & Gabung
              </button>
            </div>
          </div>
        ) : null}

        <div className="kanban-modal-footer join-footer" style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
          {isOwnerOfInvitedBoard ? (
            <>
              <button
                type="button"
                className="kanban-secondary-btn"
                onClick={handleCancel}
              >
                Tutup
              </button>
              <button
                type="button"
                className="kanban-primary-btn"
                onClick={() => {
                  handleCancel();
                  if (previewBoard) onJoined(previewBoard);
                }}
                style={{ padding: "8px 24px", fontWeight: 700 }}
              >
                Buka Papan Saya →
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="kanban-secondary-btn"
                onClick={handleCancel}
                disabled={joining}
              >
                Nanti Saja
              </button>

              {userId && (
                <>
                  <button
                    type="button"
                    className="kanban-secondary-btn"
                    onClick={handleOpenPreview}
                    disabled={joining}
                  >
                    👀 Lihat Pratinjau
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
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
