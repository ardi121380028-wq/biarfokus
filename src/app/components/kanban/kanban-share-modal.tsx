"use client";

import { useEffect, useRef, useState } from "react";
import type { KanbanBoard, KanbanBoardMember } from "@/types/domain";
import { createBoardInviteApi, loadBoardMembersApi } from "@/features/kanban/kanban-cloud";
import { useEscapeKey, useOutsideClick } from "@/lib/hooks/use-dismiss";

type KanbanShareModalProps = {
  isOpen: boolean;
  onClose: () => void;
  board: KanbanBoard;
  userId?: string | null;
};

export function KanbanShareModal({
  isOpen,
  onClose,
  board,
  userId,
}: KanbanShareModalProps) {
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [inviteCode, setInviteCode] = useState<string>("");
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [copied, setCopied] = useState(false);
  const [members, setMembers] = useState<KanbanBoardMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  useOutsideClick(modalRef, onClose, isOpen);
  useEscapeKey(onClose, isOpen);

  function handleSelectRole(nextRole: "editor" | "viewer") {
    if (nextRole === role) return;
    setLoadingInvite(true);
    setError(null);
    setRole(nextRole);
  }

  // Generate / get invite link whenever board or selected role changes
  useEffect(() => {
    if (!isOpen || !board.id) return;

    let cancelled = false;

    createBoardInviteApi(board, role)
      .then((res) => {
        if (cancelled) return;
        if (res.ok && res.inviteCode) {
          setInviteCode(res.inviteCode);
        } else {
          setError(res.error || "Gagal membuat tautan undangan.");
        }
      })
      .catch(() => {
        if (!cancelled) setError("Koneksi gagal saat membuat undangan.");
      })
      .finally(() => {
        if (!cancelled) setLoadingInvite(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, board, role]);

  // Load existing board members
  useEffect(() => {
    if (!isOpen || !board.id) return;

    let cancelled = false;

    loadBoardMembersApi(board.id)
      .then((memberList) => {
        if (cancelled) return;
        setMembers(memberList);
      })
      .finally(() => {
        if (!cancelled) setLoadingMembers(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, board.id]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const inviteUrl = inviteCode
    ? `${origin}/?kanbanInvite=${inviteCode}`
    : "Membuat tautan...";

  function handleCopy() {
    if (!inviteCode || typeof navigator === "undefined" || !navigator.clipboard) return;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  if (!isOpen) return null;

  return (
    <div className="kanban-modal-backdrop">
      <div className="kanban-share-modal" ref={modalRef}>
        <div className="kanban-modal-header">
          <div>
            <h3>👥 Bagikan Papan Proyek</h3>
            <p className="kanban-modal-sub">
              Undang teman untuk berkolaborasi di <strong>{board.title}</strong>
            </p>
          </div>
          <button
            type="button"
            className="kanban-icon-btn"
            onClick={onClose}
            aria-label="Tutup modal"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="kanban-share-error" role="alert">
            ⚠️ {error}
          </div>
        )}

        {/* Share Link Generation Section */}
        <div className="kanban-share-section">
          <label className="kanban-share-label">Tautan Undangan Cepat</label>
          <div className="kanban-share-role-switcher">
            <button
              type="button"
              className={
                role === "editor"
                  ? "kanban-role-tab active"
                  : "kanban-role-tab"
              }
              onClick={() => handleSelectRole("editor")}
            >
              ✏️ Sebagai Editor (Bisa Edit & Pindah Kartu)
            </button>
            <button
              type="button"
              className={
                role === "viewer"
                  ? "kanban-role-tab active"
                  : "kanban-role-tab"
              }
              onClick={() => handleSelectRole("viewer")}
            >
              👁️ Sebagai Viewer (Hanya Lihat)
            </button>
          </div>

          <div className="kanban-share-link-row">
            <input
              type="text"
              readOnly
              value={loadingInvite ? "Menyiapkan tautan..." : inviteUrl}
              className="kanban-share-link-input"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button
              type="button"
              className={copied ? "kanban-share-copy-btn copied" : "kanban-share-copy-btn"}
              onClick={handleCopy}
              disabled={loadingInvite || !inviteCode}
            >
              {copied ? "✓ Tersalin!" : "Salin Link"}
            </button>
          </div>
          <small className="kanban-share-hint">
            Siapa saja yang memiliki link ini dan akun BiarFokus dapat langsung bergabung ke papan ini.
          </small>
        </div>

        {/* Members List Section */}
        <div className="kanban-share-section members">
          <label className="kanban-share-label">
            Anggota Papan ({members.length > 0 ? members.length : "1"})
          </label>
          <div className="kanban-share-members-list">
            {/* Creator / current user fallback if members query is loading or empty */}
            {members.length === 0 && (
              <div className="kanban-share-member-item">
                <div className="kanban-member-avatar-placeholder">
                  {board.title.slice(0, 1).toUpperCase()}
                </div>
                <div className="kanban-member-info">
                  <span className="kanban-member-name">
                    {userId ? "Kamu (Pemilik)" : "Pemilik Papan"}
                  </span>
                  <span className="kanban-member-email">Pemilik Utama</span>
                </div>
                <span className="kanban-role-badge owner">👑 Pemilik</span>
              </div>
            )}

            {members.map((member) => (
              <div key={member.id} className="kanban-share-member-item">
                {member.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={member.avatarUrl}
                    alt={member.displayName || "Avatar"}
                    className="kanban-member-avatar-img"
                  />
                ) : (
                  <div className="kanban-member-avatar-placeholder">
                    {(member.displayName || "U").slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="kanban-member-info">
                  <span className="kanban-member-name">
                    {member.displayName || "Pengguna"}
                    {member.userId === userId ? " (Kamu)" : ""}
                  </span>
                  <span className="kanban-member-email">
                    Bergabung {new Date(member.joinedAt).toLocaleDateString("id-ID")}
                  </span>
                </div>
                <span className={`kanban-role-badge ${member.role}`}>
                  {member.role === "owner"
                    ? "👑 Pemilik"
                    : member.role === "editor"
                    ? "✏️ Editor"
                    : "👁️ Viewer"}
                </span>
              </div>
            ))}

            {loadingMembers && (
              <div className="kanban-share-loading-hint">Memuat daftar anggota...</div>
            )}
          </div>
        </div>

        <div className="kanban-modal-footer" style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <button
            type="button"
            className="kanban-primary-btn"
            onClick={onClose}
            style={{ padding: "8px 24px", minWidth: 100, textAlign: "center" }}
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
