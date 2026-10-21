"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { KanbanBoard, KanbanBoardMember } from "@/types/domain";
import { createBoardInviteApi, loadBoardMembersApi } from "@/features/kanban/kanban-cloud";
import { useEscapeKey, useOutsideClick } from "@/lib/hooks/use-dismiss";

type KanbanShareModalProps = {
  isOpen: boolean;
  onClose: () => void;
  board: KanbanBoard;
  userId?: string | null;
  userName?: string;
  userAvatar?: string | null;
  userEmail?: string | null;
  onOpenCreateBoard?: () => void;
};

export function KanbanShareModal({
  isOpen,
  onClose,
  board,
  userId,
  userName,
  userAvatar,
  userEmail,
  onOpenCreateBoard,
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
    if (!isOpen) return;
    if (!board || !board.id) {
      setLoadingInvite(false);
      setLoadingMembers(false);
      return;
    }

    let cancelled = false;
    setLoadingInvite(true);
    setError(null);

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
  }, [isOpen, board?.id, role]);

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
    ? `${origin}/kanban?invite=${inviteCode}`
    : "Membuat tautan...";

  function handleCopy() {
    if (!inviteCode) return;

    const copyToClipboard = async () => {
      try {
        if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(inviteUrl);
          return true;
        }
      } catch {}

      // Fallback for mobile / insecure contexts
      try {
        const textarea = document.createElement("textarea");
        textarea.value = inviteUrl;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand("copy");
        document.body.removeChild(textarea);
        return success;
      } catch {
        return false;
      }
    };

    void copyToClipboard().then((ok) => {
      if (ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } else {
        setError("Gagal menyalin otomatis. Silakan blok dan salin link secara manual.");
      }
    });
  }

  // Calculate clean, accurate list of members ensuring owner's profile is always rendered
  const effectiveMembers = useMemo(() => {
    const ownerName = userName || userEmail || "Kamu (Pemilik)";

    if (members.length > 0) {
      return members.map((m) => {
        if (m.userId === userId || m.role === "owner") {
          return {
            ...m,
            displayName: (m.displayName && m.displayName !== "Kamu" && m.displayName !== "Anggota")
              ? m.displayName
              : ownerName,
            avatarUrl: m.avatarUrl || userAvatar || null,
          };
        }
        return m;
      });
    }

    // Default owner fallback
    return [
      {
        id: `owner-${userId || "me"}`,
        boardId: board.id,
        userId: userId || "me",
        role: "owner" as const,
        joinedAt: board.createdAt || new Date().toISOString(),
        displayName: ownerName,
        avatarUrl: userAvatar || null,
      },
    ];
  }, [members, userId, userName, userAvatar, userEmail, board.id, board.createdAt]);

  if (!isOpen) return null;

  return (
    <div className="kanban-modal-backdrop" role="presentation">
      <div className="kanban-share-modal" ref={modalRef} role="dialog" aria-modal="true">
        {/* Header */}
        <div className="kanban-modal-header">
          <div>
            <h3 className="kanban-modal-title">
              <span className="kanban-modal-icon">👥</span> Bagikan Papan Proyek
            </h3>
            <p className="kanban-modal-sub">
              Undang teman untuk berkolaborasi di <strong>{board.title}</strong>
            </p>
          </div>
          <button
            type="button"
            className="kanban-modal-close"
            onClick={onClose}
            aria-label="Tutup modal bagikan papan"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="kanban-share-error" role="alert">
            ⚠️ {error}
          </div>
        )}

        {!board?.id ? (
          <div className="kanban-share-empty-box" style={{ padding: "32px 16px", textAlign: "center" }}>
            <span style={{ fontSize: 36, display: "block", marginBottom: 10 }}>📋</span>
            <h4 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700 }}>Belum Ada Papan Aktif</h4>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 18px", maxWidth: 360, marginLeft: "auto", marginRight: "auto" }}>
              Pilih atau buat papan proyek terlebih dahulu untuk membagikan tautan kolaborasi kepada rekan tim.
            </p>
            <button
              type="button"
              className="kanban-primary-btn"
              onClick={() => {
                onClose();
                onOpenCreateBoard?.();
              }}
              style={{ padding: "8px 20px" }}
            >
              + Buat Papan Proyek Baru
            </button>
          </div>
        ) : (
          <>
        {/* Role Selector & Quick Link Section */}
        <div className="kanban-share-section">
          <label className="kanban-share-label">Tautan Undangan Cepat</label>
          <div className="kanban-share-role-tabs">
            <button
              type="button"
              className={role === "editor" ? "kanban-role-tab active" : "kanban-role-tab"}
              onClick={() => handleSelectRole("editor")}
            >
              ✏️ Sebagai Editor (Bisa Edit & Pindah Kartu)
            </button>
            <button
              type="button"
              className={role === "viewer" ? "kanban-role-tab active" : "kanban-role-tab"}
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
            Siapa saja yang memiliki link ini dapat langsung melihat pratinjau atau masuk untuk berkolaborasi di papan ini.
          </small>
        </div>

        {/* Members List Section */}
        <div className="kanban-share-section members">
          <label className="kanban-share-label">
            Anggota Papan ({effectiveMembers.length})
          </label>
          <div className="kanban-share-members-list">
            {effectiveMembers.map((member) => (
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
                    {member.displayName}
                    {member.userId === userId ? " (Kamu)" : ""}
                  </span>
                  <span className="kanban-member-email">
                    {member.role === "owner"
                      ? "Pemilik Utama"
                      : `Bergabung ${new Date(member.joinedAt).toLocaleDateString("id-ID")}`}
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

            {loadingMembers && members.length === 0 && (
              <div className="kanban-share-loading-hint">Memuat daftar anggota...</div>
            )}
          </div>
        </div>

          </>
        )}

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
