import type {
  KanbanBoard,
  KanbanCard,
  KanbanLabel,
  KanbanList,
} from "@/types/domain";

export const KANBAN_STORAGE_PREFIX = "biarfokus.kanban";
export const KANBAN_LABELS_STORAGE_PREFIX = "biarfokus.kanban_labels.";

export function getStorageKey(userId?: string | null): string {
  return userId ? `${KANBAN_STORAGE_PREFIX}.${userId}.boards` : `${KANBAN_STORAGE_PREFIX}.guest.boards`;
}

export function getActiveBoardStorageKey(userId?: string | null): string {
  return userId ? `${KANBAN_STORAGE_PREFIX}.${userId}.active` : `${KANBAN_STORAGE_PREFIX}.guest.active`;
}

export function getCustomBoardLabelsStorageKey(boardId: string): string {
  return `${KANBAN_LABELS_STORAGE_PREFIX}${boardId || "default"}`;
}

export function loadCustomBoardLabels(boardId?: string | null): KanbanLabel[] {
  if (typeof window === "undefined" || !boardId) return [];
  try {
    const raw = window.localStorage.getItem(getCustomBoardLabelsStorageKey(boardId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is KanbanLabel =>
        Boolean(item && typeof item === "object" && typeof item.name === "string" && item.name.trim()),
    );
  } catch {
    return [];
  }
}

export function saveCustomBoardLabels(boardId: string | undefined | null, labels: KanbanLabel[]): void {
  if (typeof window === "undefined" || !boardId) return;
  try {
    window.localStorage.setItem(getCustomBoardLabelsStorageKey(boardId), JSON.stringify(labels));
  } catch {
    // quota exceeded or private mode
  }
}

export function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function formatUpdatedAt(date: Date): string {
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const KANBAN_DELETED_LABELS_STORAGE_PREFIX = "biarfokus_kanban_deleted_labels_";
const inMemoryDeletedLabels = new Map<string, string[]>();

function getDeletedBoardLabelsStorageKey(boardId: string): string {
  return `${KANBAN_DELETED_LABELS_STORAGE_PREFIX}${boardId || "default"}`;
}

export function loadDeletedBoardLabels(boardId?: string | null): string[] {
  const result: string[] = [];
  if (typeof window === "undefined") {
    if (boardId && inMemoryDeletedLabels.has(boardId)) {
      result.push(...(inMemoryDeletedLabels.get(boardId) || []));
    }
    if (inMemoryDeletedLabels.has("global")) {
      result.push(...(inMemoryDeletedLabels.get("global") || []));
    }
    return Array.from(new Set(result.map((s) => String(s).trim().toLowerCase()).filter(Boolean)));
  }

  try {
    if (boardId) {
      const raw = window.localStorage.getItem(getDeletedBoardLabelsStorageKey(boardId));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) result.push(...parsed);
      }
    }
    const rawGlobal = window.localStorage.getItem(getDeletedBoardLabelsStorageKey("global"));
    if (rawGlobal) {
      const parsedGlobal = JSON.parse(rawGlobal);
      if (Array.isArray(parsedGlobal)) result.push(...parsedGlobal);
    }
  } catch {
    // quota exceeded or private mode
  }
  return Array.from(new Set(result.map((s) => String(s).trim().toLowerCase()).filter(Boolean)));
}

export function saveDeletedBoardLabel(boardId: string | undefined | null, labelIdOrName: string): void {
  if (!labelIdOrName) return;
  const target = labelIdOrName.trim().toLowerCase();
  if (!target) return;

  if (typeof window === "undefined") {
    const keys = ["global"];
    if (boardId && boardId !== "global") keys.push(boardId);
    for (const key of keys) {
      const list = inMemoryDeletedLabels.get(key) || [];
      if (!list.includes(target)) {
        list.push(target);
        inMemoryDeletedLabels.set(key, list);
      }
    }
    return;
  }

  try {
    const keys = ["global"];
    if (boardId && boardId !== "global") keys.push(boardId);
    for (const key of keys) {
      const storageKey = getDeletedBoardLabelsStorageKey(key);
      const raw = window.localStorage.getItem(storageKey);
      const list: string[] = raw ? JSON.parse(raw) : [];
      if (!list.map((s) => s.toLowerCase()).includes(target)) {
        list.push(target);
        window.localStorage.setItem(storageKey, JSON.stringify(list));
      }
    }
  } catch {
    // ignore
  }
}

export function unmarkDeletedBoardLabel(boardId: string | undefined | null, labelName: string): void {
  if (!labelName) return;
  const target = labelName.trim().toLowerCase();

  if (typeof window === "undefined") {
    const keys = ["global"];
    if (boardId && boardId !== "global") keys.push(boardId);
    for (const key of keys) {
      const list = inMemoryDeletedLabels.get(key) || [];
      inMemoryDeletedLabels.set(key, list.filter((s) => s.toLowerCase() !== target));
    }
    return;
  }

  try {
    const keys = ["global"];
    if (boardId && boardId !== "global") keys.push(boardId);
    for (const key of keys) {
      const storageKey = getDeletedBoardLabelsStorageKey(key);
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const list: string[] = JSON.parse(raw);
        const filtered = list.filter((s) => s.toLowerCase() !== target);
        window.localStorage.setItem(storageKey, JSON.stringify(filtered));
      }
    }
  } catch {
    // ignore
  }
}

export const LABEL_PALETTE: { color: string; defaultName: string }[] = [
  { color: "#61bd4f", defaultName: "Done / Low Risk" },
  { color: "#f2d600", defaultName: "Medium Priority" },
  { color: "#ff9f1a", defaultName: "High Priority" },
  { color: "#eb5a46", defaultName: "Urgent / Blocker" },
  { color: "#c377e0", defaultName: "Design / Creative" },
  { color: "#0079bf", defaultName: "Dev / Tech" },
  { color: "#00c2e0", defaultName: "Trello Tip" },
  { color: "#ff78cb", defaultName: "Marketing / Growth" },
];

/**
 * Resolves the complete unified pool of labels for a board and its cards.
 * Combines:
 * 1. Default system palette labels (Done / Low Risk, Medium Priority, etc.)
 * 2. Board-level custom labels (board.labels)
 * 3. Persistently saved board custom labels (from localStorage)
 * 4. ANY label currently assigned to any card across all lists on the board
 * 5. Optional extra labels passed in (e.g. current card labels or draft labels)
 *
 * Excludes any label that was explicitly deleted by the user.
 * Guaranteed deduplicated by label name (case-insensitive).
 */
export function resolveBoardAvailableLabels(
  board?: KanbanBoard | null,
  extraLabels?: KanbanLabel[] | null,
): KanbanLabel[] {
  const result: KanbanLabel[] = [];
  const seenNames = new Set<string>();
  const deletedSet = new Set<string>(loadDeletedBoardLabels(board?.id));

  function addLabel(lbl: KanbanLabel) {
    if (!lbl || typeof lbl.name !== "string") return;
    const trimmed = lbl.name.trim();
    if (!trimmed) return;
    const lower = trimmed.toLowerCase();
    const idLower = lbl.id ? String(lbl.id).toLowerCase() : "";

    // If marked deleted, never re-add
    if (deletedSet.has(lower) || (idLower && deletedSet.has(idLower))) {
      return;
    }

    if (seenNames.has(lower)) return;
    seenNames.add(lower);
    result.push({
      id: lbl.id || createId("lbl"),
      name: trimmed,
      color: lbl.color || "#0079bf",
    });
  }

  // 1. Base default palette
  for (let idx = 0; idx < LABEL_PALETTE.length; idx++) {
    const p = LABEL_PALETTE[idx];
    addLabel({
      id: `lbl-default-${idx}`,
      name: p.defaultName,
      color: p.color,
    });
  }

  // 2. Board-level custom labels
  if (board && Array.isArray(board.labels)) {
    for (const l of board.labels) {
      addLabel(l);
    }
  }

  // 3. Persistently saved custom labels from localStorage for this board and global pool
  if (board?.id) {
    const boardStored = loadCustomBoardLabels(board.id);
    for (const l of boardStored) {
      addLabel(l);
    }
  }
  const globalStored = loadCustomBoardLabels("global");
  for (const l of globalStored) {
    addLabel(l);
  }

  // 4. Labels extracted from ANY card across all lists on this board
  if (board && Array.isArray(board.lists)) {
    for (const list of board.lists) {
      if (!Array.isArray(list?.cards)) continue;
      for (const card of list.cards) {
        if (!Array.isArray(card?.labels)) continue;
        for (const l of card.labels) {
          addLabel(l);
        }
      }
    }
  }

  // 5. Extra labels provided (e.g. from current card dialog or draft)
  if (Array.isArray(extraLabels)) {
    for (const l of extraLabels) {
      addLabel(l);
    }
  }

  return result;
}

/**
 * Removes a label board-wide from board definitions and from all cards in all lists.
 * Also persists the deleted label in localStorage so it never resurrects.
 */
export function deleteBoardLabel(
  board: KanbanBoard,
  labelIdOrName: string,
  labelName?: string,
): KanbanBoard {
  const targetId = (labelIdOrName || "").trim();
  const targetName = (labelName || "").trim().toLowerCase();
  const lowerIdOrName = targetId.toLowerCase();

  // Save to deleted list so resolveBoardAvailableLabels never re-adds it
  if (targetId) saveDeletedBoardLabel(board.id, targetId);
  if (targetName) saveDeletedBoardLabel(board.id, targetName);
  if (lowerIdOrName) saveDeletedBoardLabel(board.id, lowerIdOrName);

  const isMatch = (l: KanbanLabel) => {
    if (!l) return false;
    if (l.id && (l.id === targetId || l.id.toLowerCase() === lowerIdOrName)) return true;
    const lName = (l.name || "").trim().toLowerCase();
    if (targetName && lName === targetName) return true;
    if (lName === lowerIdOrName) return true;
    return false;
  };

  const nextLabels = (board.labels || []).filter((l) => !isMatch(l));

  if (typeof window !== "undefined" && board.id) {
    saveCustomBoardLabels(board.id, nextLabels);
    const globalPool = loadCustomBoardLabels("global").filter((l) => !isMatch(l));
    saveCustomBoardLabels("global", globalPool);
  }

  const now = formatUpdatedAt(new Date());
  return {
    ...board,
    labels: nextLabels,
    updatedAt: now,
    lists: (board.lists || []).map((list) => ({
      ...list,
      cards: (list.cards || []).map((card) => ({
        ...card,
        updatedAt: now,
        labels: (card.labels || []).filter((l) => !isMatch(l)),
      })),
    })),
  };
}

export const BOARD_BACKGROUNDS: {
  id: string;
  name: string;
  value: string;
  textColor: string;
  isLight?: boolean;
}[] = [
  {
    id: "biarfokus-white",
    name: "Putih BiarFokus (Default)",
    value: "#ffffff",
    textColor: "#0f172a",
    isLight: true,
  },
  {
    id: "slate-light",
    name: "Soft Slate",
    value: "#f8fafc",
    textColor: "#0f172a",
    isLight: true,
  },
  {
    id: "slate-clean",
    name: "Clean Slate",
    value: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
    textColor: "#ffffff",
    isLight: false,
  },
  {
    id: "wave-blue",
    name: "Ocean Navy",
    value: "radial-gradient(ellipse at 50% 20%, #15324e 0%, #0b1a29 60%, #060e17 100%)",
    textColor: "#ffffff",
    isLight: false,
  },
  {
    id: "purple-haze",
    name: "Velvet Violet",
    value: "radial-gradient(ellipse at 50% 20%, #311855 0%, #1c0a34 60%, #0d0319 100%)",
    textColor: "#ffffff",
    isLight: false,
  },
  {
    id: "emerald-forest",
    name: "Emerald Forest",
    value: "radial-gradient(ellipse at 50% 20%, #0e442c 0%, #072718 60%, #02120b 100%)",
    textColor: "#ffffff",
    isLight: false,
  },
  {
    id: "sunset-glow",
    name: "Sunset Ember",
    value: "radial-gradient(ellipse at 50% 20%, #4c1825 0%, #290a12 60%, #140307 100%)",
    textColor: "#ffffff",
    isLight: false,
  },
  {
    id: "ocean-breeze",
    name: "Deep Azure",
    value: "radial-gradient(ellipse at 50% 20%, #035380 0%, #08334e 60%, #041c2c 100%)",
    textColor: "#ffffff",
    isLight: false,
  },
];

/* ------------------------------------------------------------------ */
/* Templates                                                          */
/* ------------------------------------------------------------------ */

export function createDefaultGrowthBoard(): KanbanBoard {
  const now = formatUpdatedAt(new Date());

  const resourcesCards: KanbanCard[] = [
    {
      id: "card-res-1",
      title: "Trello Tip: Card labels! What do they mean? (Click for more info)",
      description: "Labels help you quickly scan and prioritize cards across columns.",
      labels: [{ id: "lbl-1", name: "Trello Tip", color: "#00c2e0" }],
      checklists: [],
      comments: [],
      order: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "card-res-2",
      title: "Stakeholders & Key Contacts",
      description: "Internal team members and external client points of contact.",
      labels: [{ id: "lbl-2", name: "Design / Creative", color: "#c377e0" }],
      checklists: [],
      comments: [],
      order: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "card-res-3",
      title: "Weekly Updates & Team Standup Notes",
      description: "Archive of weekly sprint recaps.",
      labels: [],
      checklists: [],
      comments: [],
      order: 2,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const questionsCards: KanbanCard[] = [
    {
      id: "card-q-1",
      title: "Meet 1 - 6/10/2026",
      description: "Diskusi target peluncuran Q4 dan alokasi budget fokus.",
      labels: [],
      checklists: [],
      comments: [{ id: "cmt-1", authorName: "Founder", text: "Siapkan deck presentasi sebelum jam 10 pagi.", createdAt: now }],
      order: 0,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const crucialCards: KanbanCard[] = [
    { id: "card-cru-1", title: "Alur Client", labels: [], checklists: [], comments: [], order: 0, createdAt: now, updatedAt: now },
    { id: "card-cru-2", title: "Nomor Usaha", labels: [], checklists: [], comments: [], order: 1, createdAt: now, updatedAt: now },
    { id: "card-cru-3", title: "Managemen Client", labels: [], checklists: [], comments: [], order: 2, createdAt: now, updatedAt: now },
    { id: "card-cru-4", title: "Personal Branding Plan", labels: [], checklists: [], comments: [], order: 3, createdAt: now, updatedAt: now },
  ];

  const todoCards: KanbanCard[] = [
    {
      id: "card-todo-1",
      title: "Name Company",
      description: "Finalisasi nama brand resmi, domain .id, dan social media handles.",
      labels: [{ id: "lbl-3", name: "Trello Tip", color: "#00c2e0" }],
      dueDate: "2026-10-31",
      dueCompleted: false,
      checklists: [
        {
          id: "chk-1",
          title: "Legal & Identitas",
          items: [
            { id: "item-1", text: "Cek ketersediaan nama di AHU", done: true },
            { id: "item-2", text: "Beli domain biarfokus.id", done: true },
            { id: "item-3", text: "Daftarkan merk HKI", done: false },
          ],
        },
      ],
      comments: [],
      pomodoros: 2,
      order: 0,
      createdAt: now,
      updatedAt: now,
    },
    { id: "card-todo-2", title: "Visi and Mission", labels: [], checklists: [], comments: [], order: 1, createdAt: now, updatedAt: now },
    { id: "card-todo-3", title: "Progress Menambah Kapasitas Diri", labels: [], checklists: [], comments: [], order: 2, createdAt: now, updatedAt: now },
    { id: "card-todo-4", title: "Management", labels: [], checklists: [], comments: [], order: 3, createdAt: now, updatedAt: now },
  ];

  const blockedCards: KanbanCard[] = [
    {
      id: "card-blk-1",
      title: "Splash those redtape-heavy issues that are slowing your team down here.",
      description: "Tugas atau proses yang tertahan menunggu persetujuan legalitas atau integrasi pihak ketiga.",
      coverEmoji: "🐱",
      labels: [{ id: "lbl-4", name: "Urgent / Blocker", color: "#eb5a46" }],
      checklists: [],
      comments: [{ id: "cmt-2", authorName: "Product Lead", text: "Menunggu approval dokumen.", createdAt: now }],
      order: 0,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const doneCards: KanbanCard[] = [
    {
      id: "card-done-1",
      title: "Trello Tip: Be proud! You're done! For all your finished tasks that your team has hustled on.",
      description: "Rayakan setiap pencapaian fokus kamu!",
      coverEmoji: "⭐",
      labels: [{ id: "lbl-5", name: "Done / Low Risk", color: "#61bd4f" }],
      checklists: [],
      comments: [],
      order: 0,
      createdAt: now,
      updatedAt: now,
    },
  ];

  return {
    id: "board-gt-growth",
    title: "GT - Growth",
    description: "Pertumbuhan bisnis, manajemen klien, dan target 101 crucial.",
    background: "biarfokus-white",
    starred: true,
    createdAt: now,
    updatedAt: now,
    lists: [
      { id: "list-res", title: "Project Resources", order: 0, cards: resourcesCards },
      { id: "list-q", title: "Questions For Next Meeting", order: 1, cards: questionsCards },
      { id: "list-cru", title: "101 Crucial", order: 2, cards: crucialCards },
      { id: "list-todo", title: "To Do", order: 3, cards: todoCards },
      { id: "list-blk", title: "Blocked", order: 4, cards: blockedCards },
      { id: "list-done", title: "Done", order: 5, cards: doneCards },
    ],
  };
}

export function createScrumBoard(): KanbanBoard {
  const now = formatUpdatedAt(new Date());
  return {
    id: createId("board"),
    title: "Project Management (Agile & Scrum)",
    description: "Siklus sprint produk terstruktur: Backlog, Sprint Planning, In Progress (Dev), Code Review & QA, hingga Rilis.",
    background: "purple-haze",
    starred: false,
    createdAt: now,
    updatedAt: now,
    lists: [
      {
        id: createId("list"),
        title: "Product Backlog",
        order: 0,
        cards: [
          {
            id: createId("card"),
            title: "Riset Kebutuhan Pengguna & Persona",
            description: "Wawancara dengan 10 calon pengguna untuk memvalidasi alur onboarding dan dashboard utama.",
            coverEmoji: "🎯",
            labels: [{ id: "lbl-prod", name: "Product", color: "#61bd4f" }],
            checklists: [
              {
                id: createId("chk"),
                title: "Langkah Riset",
                items: [
                  { id: createId("item"), text: "Susun panduan wawancara", done: true },
                  { id: createId("item"), text: "Transkrip hasil user interview", done: false },
                  { id: createId("item"), text: "Identifikasi 3 pain point utama", done: false },
                ],
              },
            ],
            comments: [],
            order: 0,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: createId("card"),
            title: "Arsitektur Database & Relasi Skema",
            description: "Desain model tabel relasional untuk workspace, boards, kartu kanban, dan log aktivitas audit.",
            coverEmoji: "🗄️",
            labels: [{ id: "lbl-backend", name: "Backend", color: "#0079bf" }],
            checklists: [
              {
                id: createId("chk"),
                title: "Kriteria Selesai",
                items: [
                  { id: createId("item"), text: "Diagram ERD lengkap", done: true },
                  { id: createId("item"), text: "Index query untuk pencarian cepat", done: false },
                ],
              },
            ],
            comments: [],
            order: 1,
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
      {
        id: createId("list"),
        title: "Sprint To Do",
        order: 1,
        cards: [
          {
            id: createId("card"),
            title: "Integrasi Payment Gateway & Webhook",
            description: "Koneksi gateway pembayaran langganan Pro dengan verifikasi tanda tangan HMAC webhook.",
            coverEmoji: "💳",
            labels: [{ id: "lbl-backend", name: "Backend", color: "#0079bf" }, { id: "lbl-urgent", name: "Prioritas", color: "#eb5a46" }],
            checklists: [
              {
                id: createId("chk"),
                title: "Tugas Integrasi",
                items: [
                  { id: createId("item"), text: "Implementasi handler webhook", done: false },
                  { id: createId("item"), text: "Tes payload transaksi sukses", done: false },
                  { id: createId("item"), text: "Simulasi pembayaran gagal / expired", done: false },
                ],
              },
            ],
            comments: [],
            order: 0,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: createId("card"),
            title: "Setup Sentry Logging & Error Boundary",
            description: "Pastikan semua uncaught error di frontend dan API tertangkap dengan correlation ID.",
            coverEmoji: "🛡️",
            labels: [{ id: "lbl-devops", name: "DevOps", color: "#ff9f1a" }],
            checklists: [],
            comments: [],
            order: 1,
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
      {
        id: createId("list"),
        title: "In Progress (Dev)",
        order: 2,
        cards: [
          {
            id: createId("card"),
            title: "Pengembangan Komponen Dashboard Interaktif",
            description: "Grafik visualisasi waktu fokus harian/mingguan dengan filter tanggal dan animasi interaktif.",
            coverEmoji: "📊",
            labels: [{ id: "lbl-front", name: "Frontend", color: "#00c2e0" }],
            checklists: [
              {
                id: createId("chk"),
                title: "Checklist Fitur",
                items: [
                  { id: createId("item"), text: "Widget ringkasan pomodoro", done: true },
                  { id: createId("item"), text: "Dropdown pemilih rentang waktu", done: true },
                  { id: createId("item"), text: "Tooltip hover detail sesi", done: false },
                ],
              },
            ],
            comments: [],
            order: 0,
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
      {
        id: createId("list"),
        title: "Code Review / QA",
        order: 3,
        cards: [
          {
            id: createId("card"),
            title: "Pengujian E2E & Validasi Form Checkout",
            description: "Uji menyeluruh skenario checkout pengguna Free ke Pro pada mobile dan desktop browser.",
            coverEmoji: "🧪",
            labels: [{ id: "lbl-qa", name: "QA / Testing", color: "#ff78cb" }],
            checklists: [
              {
                id: createId("chk"),
                title: "Skenario Uji",
                items: [
                  { id: createId("item"), text: "Pengujian input nomor kartu tidak valid", done: true },
                  { id: createId("item"), text: "Pengecekan aktivasi instan status Pro", done: false },
                ],
              },
            ],
            comments: [],
            order: 0,
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
      {
        id: createId("list"),
        title: "Done / Rilis",
        order: 4,
        cards: [
          {
            id: createId("card"),
            title: "Deployment Versi Staging & Update Docs",
            description: "Versi 1.2 berhasil dideploy ke staging dan dokumentasi endpoint API selesai diperbarui.",
            coverEmoji: "🚀",
            labels: [{ id: "lbl-done", name: "Released", color: "#51e898" }],
            checklists: [],
            comments: [],
            order: 0,
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
    ],
  };
}

export function createAcademicBoard(): KanbanBoard {
  const now = formatUpdatedAt(new Date());
  return {
    id: createId("board"),
    title: "Skripsi & Riset Akademik",
    description: "Panduan alur penyusunan skripsi, tesis, dan riset ilmiah terstruktur dari pengajuan judul hingga ujian sidang dan publikasi jurnal.",
    background: "ocean-breeze",
    starred: false,
    createdAt: now,
    updatedAt: now,
    lists: [
      {
        id: createId("list"),
        title: "Ide & Pengajuan Judul",
        order: 0,
        cards: [
          {
            id: createId("card"),
            title: "Studi Literatur & Pemetaan Research Gap",
            description: "Kumpulkan 15 artikel jurnal bereputasi (Sinta / Scopus) 5 tahun terakhir untuk menemukan celah penelitian yang orisinal.",
            coverEmoji: "📖",
            labels: [{ id: "lbl-lit", name: "Literatur", color: "#0079bf" }],
            checklists: [
              {
                id: createId("chk"),
                title: "Langkah Literatur",
                items: [
                  { id: createId("item"), text: "Cari artikel di ScienceDirect & Google Scholar", done: true },
                  { id: createId("item"), text: "Buat matriks perbandingan riset terdahulu", done: false },
                  { id: createId("item"), text: "Rumuskan 3 pertanyaan penelitian kunci", done: false },
                ],
              },
            ],
            comments: [],
            order: 0,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: createId("card"),
            title: "Pengajuan Judul & Proposal Awal ke Dosen Wali",
            description: "Susun sinopsis proposal skripsi 2 halaman berisi latar belakang masalah, metodologi, dan kontribusi riset.",
            coverEmoji: "📝",
            labels: [{ id: "lbl-adm", name: "Administrasi", color: "#ff9f1a" }],
            checklists: [],
            comments: [],
            order: 1,
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
      {
        id: createId("list"),
        title: "Bab 1-2: Landasan Teori",
        order: 1,
        cards: [
          {
            id: createId("card"),
            title: "Penyusunan Bab 1: Latar Belakang & Urgensi",
            description: "Tuliskan fenomena riil di lapangan, data statistik pendukung, dan signifikansi penelitian bagi keilmuan serta praktisi.",
            coverEmoji: "✍️",
            labels: [{ id: "lbl-write", name: "Penulisan", color: "#61bd4f" }],
            checklists: [
              {
                id: createId("chk"),
                title: "Kelengkapan Bab 1",
                items: [
                  { id: createId("item"), text: "Latar Belakang & Fenomena Gap", done: true },
                  { id: createId("item"), text: "Rumusan Masalah & Batasan Penelitian", done: false },
                  { id: createId("item"), text: "Tujuan & Manfaat Teoretis/Praktis", done: false },
                ],
              },
            ],
            comments: [],
            order: 0,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: createId("card"),
            title: "Sintesis Teori Utama & Kerangka Konseptual",
            description: "Uraikan grand theory, supporting theory, dan bangun bagan alur kerangka berpikir serta hipotesis penelitian.",
            coverEmoji: "🧠",
            labels: [{ id: "lbl-write", name: "Penulisan", color: "#61bd4f" }],
            checklists: [],
            comments: [],
            order: 1,
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
      {
        id: createId("list"),
        title: "Bab 3-4: Metodologi & Olah Data",
        order: 2,
        cards: [
          {
            id: createId("card"),
            title: "Desain Instrumen & Uji Validitas/Reliabilitas",
            description: "Susun kuesioner atau protokol eksperimen, uji coba instrumen ke 30 responden awal untuk mengukur Cronbach Alpha.",
            coverEmoji: "📊",
            labels: [{ id: "lbl-stat", name: "Metodologi", color: "#c377e0" }],
            checklists: [
              {
                id: createId("chk"),
                title: "Tahapan Data",
                items: [
                  { id: createId("item"), text: "Sebar kuesioner ke 100+ sampel target", done: false },
                  { id: createId("item"), text: "Tabulasi data di spreadsheet / database", done: false },
                  { id: createId("item"), text: "Uji normalitas dan multikolinearitas", done: false },
                ],
              },
            ],
            comments: [],
            order: 0,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: createId("card"),
            title: "Analisis Statistik & Pembahasan Temuan",
            description: "Lakukan analisis regresi / pengujian hipotesis, dan bandingkan temuan empiris dengan teori di Bab 2.",
            coverEmoji: "📈",
            labels: [{ id: "lbl-stat", name: "Metodologi", color: "#c377e0" }],
            checklists: [],
            comments: [],
            order: 1,
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
      {
        id: createId("list"),
        title: "Bimbingan & Revisi Dosen",
        order: 3,
        cards: [
          {
            id: createId("card"),
            title: "Bimbingan Rutin Dosen Pembimbing 1 & 2",
            description: "Konsultasikan hasil analisis data Bab 4, catat poin arahan revisi di logbook bimbingan akademik.",
            coverEmoji: "🤝",
            labels: [{ id: "lbl-bim", name: "Bimbingan", color: "#ff9f1a" }, { id: "lbl-rev", name: "Revisi", color: "#eb5a46" }],
            checklists: [
              {
                id: createId("chk"),
                title: "Catatan Bimbingan",
                items: [
                  { id: createId("item"), text: "Perjelas implikasi praktis di Bab 5", done: false },
                  { id: createId("item"), text: "Koreksi format kutipan APA 7th style", done: false },
                  { id: createId("item"), text: "Minta tanda tangan persetujuan ujian", done: false },
                ],
              },
            ],
            comments: [],
            order: 0,
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
      {
        id: createId("list"),
        title: "Sidang & Publikasi",
        order: 4,
        cards: [
          {
            id: createId("card"),
            title: "Pembuatan Slide Sidang Skripsi (15 Menit)",
            description: "Siapkan 12 slide visual yang tajam: Latar Belakang, Metodologi, Hasil Utama, dan Rekomendasi Solusi.",
            coverEmoji: "🎓",
            labels: [{ id: "lbl-sidang", name: "Sidang", color: "#51e898" }],
            checklists: [],
            comments: [],
            order: 0,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: createId("card"),
            title: "Uji Turnitin & Submit Artikel Ilmiah",
            description: "Pastikan skor plagiarisme Turnitin di bawah 20% dan submit naskah ringkas ke jurnal kampus / eksternal.",
            coverEmoji: "🏆",
            labels: [{ id: "lbl-pub", name: "Publikasi", color: "#00c2e0" }],
            checklists: [],
            comments: [],
            order: 1,
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
    ],
  };
}

export function createProductLaunchBoard(): KanbanBoard {
  const now = formatUpdatedAt(new Date());
  return {
    id: createId("board"),
    title: "Product Launch & Go-To-Market",
    description: "Strategi peluncuran produk dan kampanye pemasaran: Riset audiens, aset konten, teaser pre-launch, eksekusi hari H, dan evaluasi konversi.",
    background: "sunset-glow",
    starred: false,
    createdAt: now,
    updatedAt: now,
    lists: [
      {
        id: createId("list"),
        title: "Riset Pasar & Positioning",
        order: 0,
        cards: [
          {
            id: createId("card"),
            title: "Analisis Target Audiens & Profil ICP",
            description: "Tentukan demografi, tujuan utama, dan hambatan terbesar yang dihadapi pelanggan ideal.",
            coverEmoji: "🔍",
            labels: [{ id: "lbl-mkt", name: "Strategi", color: "#0079bf" }],
            checklists: [],
            comments: [],
            order: 0,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: createId("card"),
            title: "Rumusan Value Proposition & Tagline",
            description: "Susun 1 pesan utama pembeda dari kompetitor yang langsung menonjolkan manfaat nyata.",
            coverEmoji: "💡",
            labels: [{ id: "lbl-copy", name: "Copywriting", color: "#c377e0" }],
            checklists: [],
            comments: [],
            order: 1,
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
      {
        id: createId("list"),
        title: "Aset Desain & Copywriting",
        order: 1,
        cards: [
          {
            id: createId("card"),
            title: "Produksi Video Demo Produk 45 Detik",
            description: "Video demonstrasi alur fitur unggulan dengan motion graphic profesional dan audio suara jernih.",
            coverEmoji: "🎬",
            labels: [{ id: "lbl-cre", name: "Kreatif", color: "#ff9f1a" }],
            checklists: [],
            comments: [],
            order: 0,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: createId("card"),
            title: "Desain Banner Promosi & Email Template",
            description: "Aset banner sosial media untuk Twitter, Instagram, LinkedIn, serta email pengumuman peluncuran.",
            coverEmoji: "🎨",
            labels: [{ id: "lbl-cre", name: "Kreatif", color: "#ff9f1a" }],
            checklists: [],
            comments: [],
            order: 1,
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
      {
        id: createId("list"),
        title: "Pre-Launch & Waitlist",
        order: 2,
        cards: [
          {
            id: createId("card"),
            title: "Buka Akses Waitlist & Early Bird",
            description: "Luncurkan landing page teaser untuk mengumpulkan 200 email pendaftar pertama dengan penawaran diskon spesial.",
            coverEmoji: "⏳",
            labels: [{ id: "lbl-camp", name: "Kampanye", color: "#00c2e0" }],
            checklists: [],
            comments: [],
            order: 0,
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
      {
        id: createId("list"),
        title: "Hari Peluncuran (Launch Day)",
        order: 3,
        cards: [
          {
            id: createId("card"),
            title: "Publish ke Product Hunt & Media Sosial",
            description: "Luncurkan tepat pukul 00:01 PST di Product Hunt, aktif balas feedback komunitas di kolom komentar sepanjang hari.",
            coverEmoji: "🚀",
            labels: [{ id: "lbl-exec", name: "Eksekusi", color: "#eb5a46" }],
            checklists: [],
            comments: [],
            order: 0,
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
      {
        id: createId("list"),
        title: "Evaluasi & Retensi",
        order: 4,
        cards: [
          {
            id: createId("card"),
            title: "Analisis Rasio Konversi & Retensi User",
            description: "Hitung CAC, rasio konversi pengunjung ke signup, serta kumpulkan feedback awal pengguna aktif.",
            coverEmoji: "📊",
            labels: [{ id: "lbl-ana", name: "Analitik", color: "#51e898" }],
            checklists: [],
            comments: [],
            order: 0,
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
    ],
  };
}

export function createAgencyBoard(): KanbanBoard {
  const now = formatUpdatedAt(new Date());
  return {
    id: createId("board"),
    title: "Proyek Klien & Freelance Agency",
    description: "Alur manajemen proyek klien profesional dari onboarding, kesepakatan kontrak, desain, coding, revisi klien, hingga serah terima & pelunasan.",
    background: "slate-clean",
    starred: false,
    createdAt: now,
    updatedAt: now,
    lists: [
      {
        id: createId("list"),
        title: "Briefing & Kontrak",
        order: 0,
        cards: [
          {
            id: createId("card"),
            title: "Kickoff Meeting & Pengumpulan Brief Klien",
            description: "Diskusi target pencapaian proyek, spesifikasi fitur, serta deadline final dengan tim manajerial klien.",
            coverEmoji: "📋",
            labels: [{ id: "lbl-cli", name: "Klien", color: "#0079bf" }],
            checklists: [],
            comments: [],
            order: 0,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: createId("card"),
            title: "Persetujuan Kontrak SPK & DP 50%",
            description: "Tanda tangan perjanjian kerja sama dan konfirmasi bukti transfer pembayaran uang muka sebelum pengerjaan.",
            coverEmoji: "🖋️",
            labels: [{ id: "lbl-fin", name: "Keuangan", color: "#51e898" }],
            checklists: [],
            comments: [],
            order: 1,
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
      {
        id: createId("list"),
        title: "Wireframing & UI/UX",
        order: 1,
        cards: [
          {
            id: createId("card"),
            title: "Desain High-Fidelity & Prototype Interaktif",
            description: "Desain seluruh alur halaman di Figma sesuai pedoman identitas merek klien.",
            coverEmoji: "🎨",
            labels: [{ id: "lbl-des", name: "Design", color: "#c377e0" }],
            checklists: [],
            comments: [],
            order: 0,
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
      {
        id: createId("list"),
        title: "Tahap Development",
        order: 2,
        cards: [
          {
            id: createId("card"),
            title: "Implementasi Frontend & Integrasi Backend",
            description: "Pengembangan halaman responsif menggunakan Next.js dan koneksi database produksi.",
            coverEmoji: "💻",
            labels: [{ id: "lbl-dev", name: "Development", color: "#00c2e0" }],
            checklists: [],
            comments: [],
            order: 0,
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
      {
        id: createId("list"),
        title: "Review & Revisi Klien",
        order: 3,
        cards: [
          {
            id: createId("card"),
            title: "Demo Staging & Notulensi Revisi Klien",
            description: "Berikan tautan preview staging ke klien dan selesaikan poin revisi minor batch 1.",
            coverEmoji: "🔄",
            labels: [{ id: "lbl-rev", name: "Revisi", color: "#ff9f1a" }],
            checklists: [],
            comments: [],
            order: 0,
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
      {
        id: createId("list"),
        title: "Serah Terima & Pelunasan",
        order: 4,
        cards: [
          {
            id: createId("card"),
            title: "Handoff Kredensial, Domain & Invoice Lunas",
            description: "Serahkan hak akses sistem secara penuh dan terbitkan tanda terima pelunasan 100%.",
            coverEmoji: "🤝",
            labels: [{ id: "lbl-done", name: "Selesai", color: "#61bd4f" }],
            checklists: [],
            comments: [],
            order: 0,
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
    ],
  };
}

export function createBugTrackingBoard(): KanbanBoard {
  const now = formatUpdatedAt(new Date());
  return {
    id: createId("board"),
    title: "Bug Tracking & QA Engineering",
    description: "Pelacakan isu kritis, triase bug, perbaikan sistem, dan verifikasi regression testing sebelum deployment patch.",
    background: "sunset-glow",
    starred: false,
    createdAt: now,
    updatedAt: now,
    lists: [
      {
        id: createId("list"),
        title: "Bug Baru Dilaporkan",
        order: 0,
        cards: [
          {
            id: createId("card"),
            title: "Crash saat Upload Avatar format PNG Transparan",
            description: "Muncul error 500 dari modul image processing saat memproses PNG berukuran di atas 2MB.",
            coverEmoji: "🐛",
            labels: [{ id: "lbl-crit", name: "P0 - Kritis", color: "#eb5a46" }],
            checklists: [],
            comments: [],
            order: 0,
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
      {
        id: createId("list"),
        title: "Triaged / Investigating",
        order: 1,
        cards: [
          {
            id: createId("card"),
            title: "Investigasi Memory Leak Timer Pomodoro di Tab Latar Belakang",
            description: "Penggunaan memori browser meningkat drastis setelah 4 jam berjalan tanpa pause.",
            coverEmoji: "🔬",
            labels: [{ id: "lbl-tri", name: "Triaged", color: "#ff9f1a" }],
            checklists: [],
            comments: [],
            order: 0,
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
      {
        id: createId("list"),
        title: "Sedang Diperbaiki",
        order: 2,
        cards: [
          {
            id: createId("card"),
            title: "Patch Regex Validasi Email & Sub-addressing",
            description: "Dukungan alamat email dengan karakter plus (+) seperti user+test@domain.com.",
            coverEmoji: "🔧",
            labels: [{ id: "lbl-dev", name: "In Dev", color: "#0079bf" }],
            checklists: [],
            comments: [],
            order: 0,
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
      {
        id: createId("list"),
        title: "Testing & Verifikasi QA",
        order: 3,
        cards: [
          {
            id: createId("card"),
            title: "Regression Test Fitur Audio Alert di Safari iOS",
            description: "Pastikan suara notifikasi lonceng tetap berbunyi saat layar terkunci / minimised.",
            coverEmoji: "🧪",
            labels: [{ id: "lbl-qa", name: "QA Verified", color: "#c377e0" }],
            checklists: [],
            comments: [],
            order: 0,
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
      {
        id: createId("list"),
        title: "Resolved & Deployed",
        order: 4,
        cards: [
          {
            id: createId("card"),
            title: "Release Hotfix v1.2.4 ke Production",
            description: "Perbaikan berhasil di-merge ke branch main dan deployed tanpa kendala.",
            coverEmoji: "✅",
            labels: [{ id: "lbl-ok", name: "Resolved", color: "#61bd4f" }],
            checklists: [],
            comments: [],
            order: 0,
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
    ],
  };
}

export function createStudyBoard(): KanbanBoard {
  const now = formatUpdatedAt(new Date());
  return {
    id: createId("board"),
    title: "Rencana Belajar & Ujian Sertifikasi",
    description: "Manajemen kurikulum belajar mandiri: Pemetaan silabus, pemahaman konsep dasar, latihan soal, flashcards rumus, hingga simulasi try out.",
    background: "emerald-forest",
    starred: false,
    createdAt: now,
    updatedAt: now,
    lists: [
      {
        id: createId("list"),
        title: "Silabus & Target Belajar",
        order: 0,
        cards: [
          {
            id: createId("card"),
            title: "Pemetaan Blueprint Ujian & Jadwal Belajar",
            description: "Bagi silabus ke dalam 4 modul mingguan dan tentukan waktu fokus rutin 90 menit per hari.",
            coverEmoji: "📚",
            labels: [{ id: "lbl-plan", name: "Rencana", color: "#0079bf" }],
            checklists: [],
            comments: [],
            order: 0,
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
      {
        id: createId("list"),
        title: "Materi Konsep Inti",
        order: 1,
        cards: [
          {
            id: createId("card"),
            title: "Ringkasan Modul Teori Fundamental (Bab 1-3)",
            description: "Buat mind map dan catatan ringkas menggunakan metode Cornell Notes.",
            coverEmoji: "💡",
            labels: [{ id: "lbl-core", name: "Teori", color: "#61bd4f" }],
            checklists: [],
            comments: [],
            order: 0,
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
      {
        id: createId("list"),
        title: "Latihan Soal Mandiri",
        order: 2,
        cards: [
          {
            id: createId("card"),
            title: "Pengerjaan 100 Soal Latihan & Pembahasan",
            description: "Kerjakan bank soal tanpa membuka buku, tandai nomor yang salah untuk evaluasi ulang.",
            coverEmoji: "📝",
            labels: [{ id: "lbl-test", name: "Latihan", color: "#ff9f1a" }],
            checklists: [],
            comments: [],
            order: 0,
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
      {
        id: createId("list"),
        title: "Review Catatan & Rumus",
        order: 3,
        cards: [
          {
            id: createId("card"),
            title: "Flashcards Anki & Spaced Repetition",
            description: "Ulangi 40 kartu rumus cepat dan definisi konsep kunci setiap pagi.",
            coverEmoji: "🃏",
            labels: [{ id: "lbl-rev", name: "Review", color: "#c377e0" }],
            checklists: [],
            comments: [],
            order: 0,
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
      {
        id: createId("list"),
        title: "Simulasi Try Out & Siap Ujian",
        order: 4,
        cards: [
          {
            id: createId("card"),
            title: "Simulasi Ujian Penuh dengan Timer Riil",
            description: "Simulasi ujian 120 menit tanpa interupsi, evaluasi skor akhir dengan passing grade 80%.",
            coverEmoji: "🏆",
            labels: [{ id: "lbl-win", name: "Siap Ujian", color: "#51e898" }],
            checklists: [],
            comments: [],
            order: 0,
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
    ],
  };
}

export function createPersonalKanbanBoard(): KanbanBoard {
  const now = formatUpdatedAt(new Date());
  return {
    id: createId("board"),
    title: "Personal Focus & Produktivitas Harian",
    description: "Alur prioritas harian yang sederhana dan efektif: Ide & Catatan Cepat, To Do Hari Ini, Sedang Dikerjakan, dan Selesai.",
    background: "emerald-forest",
    starred: false,
    createdAt: now,
    updatedAt: now,
    lists: [
      {
        id: createId("list"),
        title: "Ide & Catatan Cepat",
        order: 0,
        cards: [
          {
            id: createId("card"),
            title: "Buku yang Ingin Dibaca Bulan Ini",
            description: "Deep Work oleh Cal Newport dan Atomic Habits oleh James Clear.",
            coverEmoji: "💡",
            labels: [{ id: "lbl-idea", name: "Inspirasi", color: "#ff9f1a" }],
            checklists: [],
            comments: [],
            order: 0,
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
      {
        id: createId("list"),
        title: "Prioritas Hari Ini",
        order: 1,
        cards: [
          {
            id: createId("card"),
            title: "Selesaikan 4 Sesi Pomodoro (100 Menit)",
            description: "Fokus tanpa membuka tab sosial media atau notifikasi chat.",
            coverEmoji: "🎯",
            labels: [{ id: "lbl-focus", name: "Deep Work", color: "#eb5a46" }],
            checklists: [],
            comments: [],
            order: 0,
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
      {
        id: createId("list"),
        title: "Sedang Dikerjakan",
        order: 2,
        cards: [
          {
            id: createId("card"),
            title: "Review Pengeluaran & Anggaran Bulanan",
            description: "Catat pengeluaran rutin dan alokasikan dana tabungan.",
            coverEmoji: "⚡",
            labels: [{ id: "lbl-doing", name: "Fokus", color: "#0079bf" }],
            checklists: [],
            comments: [],
            order: 0,
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
      {
        id: createId("list"),
        title: "Selesai",
        order: 3,
        cards: [
          {
            id: createId("card"),
            title: "Olahraga Pagi & Meditasi 15 Menit",
            description: "Peregangan tubuh dan latihan pernapasan fokus sebelum mulai kerja.",
            coverEmoji: "🧘",
            labels: [{ id: "lbl-health", name: "Kebiasaan Sehat", color: "#61bd4f" }],
            checklists: [],
            comments: [],
            order: 0,
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
    ],
  };
}

export const TEMPLATES: { key: string; name: string; description: string; icon: string; builder: () => KanbanBoard }[] = [
  {
    key: "scrum",
    name: "Project Management (Agile & Scrum)",
    description: "Siklus sprint produk terstruktur: Backlog, Sprint Planning, In Dev, Code Review & QA, hingga Rilis.",
    icon: "⚡",
    builder: createScrumBoard,
  },
  {
    key: "academic",
    name: "Skripsi & Riset Akademik (Pendidikan)",
    description: "Manajemen skripsi, tesis, dan riset ilmiah dari ide judul, proposal, olah data, bimbingan, hingga sidang & jurnal.",
    icon: "🎓",
    builder: createAcademicBoard,
  },
  {
    key: "marketing",
    name: "Product Launch & Go-To-Market",
    description: "Peluncuran produk dan kampanye pemasaran: Riset audiens, aset konten, teaser, eksekusi hari H, dan analitik.",
    icon: "🚀",
    builder: createProductLaunchBoard,
  },
  {
    key: "agency",
    name: "Proyek Klien & Freelance Agency",
    description: "Alur agensi digital & freelancer: Briefing, wireframing, pengembangan, sesi revisi klien, hingga serah terima & pelunasan.",
    icon: "💼",
    builder: createAgencyBoard,
  },
  {
    key: "bugs",
    name: "Bug Tracking & QA Engineering",
    description: "Pelacakan isu kritis, triase bug sistem, perbaikan teknis, dan verifikasi regression test.",
    icon: "🐛",
    builder: createBugTrackingBoard,
  },
  {
    key: "study",
    name: "Rencana Belajar & Ujian Sertifikasi",
    description: "Manajemen kurikulum belajar terarah: Pemetaan silabus, latihan soal, flashcards rumus, hingga simulasi try out.",
    icon: "📚",
    builder: createStudyBoard,
  },
  {
    key: "personal",
    name: "Personal Focus & Harian",
    description: "Alur produktivitas pribadi: Ide & Catatan Cepat, Prioritas Hari Ini, Sedang Dikerjakan, dan Selesai.",
    icon: "🎯",
    builder: createPersonalKanbanBoard,
  },
  {
    key: "growth",
    name: "GT - Growth & Bisnis",
    description: "Board pertumbuhan bisnis, manajemen klien, dan target 101 crucial.",
    icon: "📈",
    builder: createDefaultGrowthBoard,
  },
];

export const INITIAL_BOARDS: KanbanBoard[] = [];

/* ------------------------------------------------------------------ */
/* Storage Parser                                                     */
/* ------------------------------------------------------------------ */

export function normalizeBoard(raw: unknown): KanbanBoard {
  const b = (raw && typeof raw === "object" ? raw : {}) as Partial<KanbanBoard>;
  const now = formatUpdatedAt(new Date());

  const lists = Array.isArray(b.lists)
    ? b.lists.map((l: unknown, lIdx: number) => {
        const listObj = (l && typeof l === "object" ? l : {}) as Partial<KanbanList>;
        const cards = Array.isArray(listObj.cards)
          ? listObj.cards.map((c: unknown, cIdx: number) => {
              const cardObj = (c && typeof c === "object" ? c : {}) as Partial<KanbanCard>;
              return {
                id: typeof cardObj.id === "string" && cardObj.id ? cardObj.id : createId("card"),
                title: typeof cardObj.title === "string" ? cardObj.title : "Kartu",
                description: typeof cardObj.description === "string" ? cardObj.description : "",
                coverColor: typeof cardObj.coverColor === "string" ? cardObj.coverColor : undefined,
                coverEmoji: typeof cardObj.coverEmoji === "string" ? cardObj.coverEmoji : undefined,
                startDate: typeof cardObj.startDate === "string" ? cardObj.startDate : undefined,
                dueDate: typeof cardObj.dueDate === "string" ? cardObj.dueDate : undefined,
                dueCompleted: Boolean(cardObj.dueCompleted),
                archived: Boolean(cardObj.archived),
                labels: Array.isArray(cardObj.labels) ? cardObj.labels : [],
                checklists: Array.isArray(cardObj.checklists)
                  ? cardObj.checklists.map((chk: unknown) => {
                      const chkObj = (chk && typeof chk === "object" ? chk : {}) as {
                        id?: string;
                        title?: string;
                        items?: unknown[];
                      };
                      return {
                        id: typeof chkObj.id === "string" && chkObj.id ? chkObj.id : createId("chk"),
                        title: typeof chkObj.title === "string" ? chkObj.title : "Checklist",
                        items: Array.isArray(chkObj.items)
                          ? chkObj.items.map((it: unknown) => {
                              const itObj = (it && typeof it === "object" ? it : {}) as {
                                id?: string;
                                text?: string;
                                done?: boolean;
                              };
                              return {
                                id: typeof itObj.id === "string" && itObj.id ? itObj.id : createId("item"),
                                text: typeof itObj.text === "string" ? itObj.text : "",
                                done: Boolean(itObj.done),
                              };
                            })
                          : [],
                      };
                    })
                  : [],
                comments: Array.isArray(cardObj.comments) ? cardObj.comments : [],
                assignees: Array.isArray(cardObj.assignees)
                  ? cardObj.assignees.map((a: unknown) => {
                      const aObj = (a && typeof a === "object" ? a : {}) as {
                        id?: string;
                        name?: string;
                        avatarUrl?: string | null;
                        role?: string;
                      };
                      return {
                        id: typeof aObj.id === "string" ? aObj.id : createId("pic"),
                        name: typeof aObj.name === "string" ? aObj.name : "Member",
                        avatarUrl: typeof aObj.avatarUrl === "string" ? aObj.avatarUrl : null,
                        role: typeof aObj.role === "string" ? aObj.role : undefined,
                      };
                    })
                  : cardObj.assigneeName
                  ? [
                      {
                        id: typeof cardObj.assigneeId === "string" ? cardObj.assigneeId : createId("pic"),
                        name: cardObj.assigneeName,
                        avatarUrl: typeof cardObj.assigneeAvatar === "string" ? cardObj.assigneeAvatar : null,
                      },
                    ]
                  : [],
                assigneeId: typeof cardObj.assigneeId === "string" ? cardObj.assigneeId : null,
                assigneeName: typeof cardObj.assigneeName === "string" ? cardObj.assigneeName : null,
                assigneeAvatar: typeof cardObj.assigneeAvatar === "string" ? cardObj.assigneeAvatar : null,
                order: typeof cardObj.order === "number" ? cardObj.order : cIdx,
                createdAt: typeof cardObj.createdAt === "string" ? cardObj.createdAt : now,
                updatedAt: typeof cardObj.updatedAt === "string" ? cardObj.updatedAt : now,
              };
            })
          : [];

        return {
          id: typeof listObj.id === "string" && listObj.id ? listObj.id : createId("list"),
          title: typeof listObj.title === "string" ? listObj.title : "Kolom",
          order: typeof listObj.order === "number" ? listObj.order : lIdx,
          cards,
        };
      })
    : [];

  return {
    id: typeof b.id === "string" && b.id ? b.id : createId("board"),
    userId: typeof b.userId === "string" ? b.userId : undefined,
    title: typeof b.title === "string" && b.title ? b.title : "Board Baru",
    description: typeof b.description === "string" ? b.description : "",
    background:
      typeof b.background === "string" && b.background
        ? (b.id === "board-gt-growth" && b.background === "wave-blue"
            ? "biarfokus-white"
            : b.background)
        : "biarfokus-white",
    starred: Boolean(b.starred),
    archived: Boolean(b.archived),
    archivedAt: typeof b.archivedAt === "string" ? b.archivedAt : undefined,
    role: b.role,
    isShared: Boolean(b.isShared),
    labels: Array.isArray(b.labels) ? b.labels : undefined,
    _isLocalDraft: b._isLocalDraft !== undefined ? Boolean(b._isLocalDraft) : undefined,
    createdAt: typeof b.createdAt === "string" ? b.createdAt : now,
    updatedAt: typeof b.updatedAt === "string" ? b.updatedAt : now,
    lists,
  };
}

export function parseStoredBoardId(raw: string | null): string {
  if (!raw) return "";
  let val = raw;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "string") val = parsed;
  } catch {
    // not JSON
  }
  return val.replace(/^["']|["']$/g, "").trim();
}

export function parseStoredBoards(raw: string | null | unknown): KanbanBoard[] {
  if (!raw) return [];
  try {
    if (Array.isArray(raw)) {
      return raw
        .filter((item): item is KanbanBoard => Boolean(item && typeof item === "object" && typeof (item as { id?: unknown }).id === "string"))
        .map((item) => normalizeBoard(item as unknown as KanbanBoard));
    }
    if (typeof raw === "string") {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item): item is KanbanBoard => Boolean(item && typeof item === "object" && typeof item.id === "string"))
          .map((item) => normalizeBoard(item));
      }
    }
  } catch {
    // Malformed JSON: return empty
  }
  return [];
}

/* ------------------------------------------------------------------ */
/* Immutable Pure Board Operations                                     */
/* ------------------------------------------------------------------ */

export function moveBoardItem(
  boards: KanbanBoard[],
  sourceIndex: number,
  destIndex: number,
): KanbanBoard[] {
  if (sourceIndex < 0 || sourceIndex >= boards.length) return boards;
  if (destIndex < 0 || destIndex >= boards.length) return boards;
  if (sourceIndex === destIndex) return boards;

  const result = [...boards];
  const [removed] = result.splice(sourceIndex, 1);
  if (!removed) return boards;
  result.splice(destIndex, 0, removed);
  return result;
}

export function toggleBoardStarred(
  boards: KanbanBoard[],
  boardId: string,
): { boards: KanbanBoard[]; updatedBoard: KanbanBoard | null } {
  const target = boards.find((b) => b.id === boardId);
  if (!target) return { boards, updatedBoard: null };

  const nextStarred = !target.starred;
  const now = formatUpdatedAt(new Date());
  const updatedBoard: KanbanBoard = {
    ...target,
    starred: nextStarred,
    updatedAt: now,
  };

  const others = boards.filter((b) => b.id !== boardId);
  let nextBoards: KanbanBoard[];

  if (nextStarred) {
    // Pin to top: place after other starred boards (or very first if none)
    const lastStarredIdx = others.findLastIndex((b) => Boolean(b.starred));
    if (lastStarredIdx === -1) {
      nextBoards = [updatedBoard, ...others];
    } else {
      nextBoards = [...others];
      nextBoards.splice(lastStarredIdx + 1, 0, updatedBoard);
    }
  } else {
    // Unpin: place at the start of unstarred boards
    const firstUnstarredIdx = others.findIndex((b) => !b.starred);
    if (firstUnstarredIdx === -1) {
      nextBoards = [...others, updatedBoard];
    } else {
      nextBoards = [...others];
      nextBoards.splice(firstUnstarredIdx, 0, updatedBoard);
    }
  }

  return { boards: nextBoards, updatedBoard };
}

export function archiveBoard(
  boards: KanbanBoard[],
  boardId: string,
): { boards: KanbanBoard[]; updatedBoard: KanbanBoard | null } {
  const target = boards.find((b) => b.id === boardId);
  if (!target) return { boards, updatedBoard: null };

  const now = formatUpdatedAt(new Date());
  const updatedBoard: KanbanBoard = {
    ...target,
    archived: true,
    archivedAt: now,
    updatedAt: now,
  };

  const nextBoards = boards.map((b) => (b.id === boardId ? updatedBoard : b));
  return { boards: nextBoards, updatedBoard };
}

export function restoreBoard(
  boards: KanbanBoard[],
  boardId: string,
): { boards: KanbanBoard[]; updatedBoard: KanbanBoard | null } {
  const target = boards.find((b) => b.id === boardId);
  if (!target) return { boards, updatedBoard: null };

  const now = formatUpdatedAt(new Date());
  const updatedBoard: KanbanBoard = {
    ...target,
    archived: false,
    archivedAt: undefined,
    updatedAt: now,
  };

  const nextBoards = boards.map((b) => (b.id === boardId ? updatedBoard : b));
  return { boards: nextBoards, updatedBoard };
}

export function moveCard(
  board: KanbanBoard,
  sourceListId: string,
  destListId: string,
  sourceIndex: number,
  destIndex: number,
): KanbanBoard {
  const sourceList = board.lists.find((l) => l.id === sourceListId);
  const destList = board.lists.find((l) => l.id === destListId);
  if (!sourceList || !destList) return board;

  const cardToMove = sourceList.cards[sourceIndex];
  if (!cardToMove) return board;

  const now = formatUpdatedAt(new Date());

  if (sourceListId === destListId) {
    // Reorder within the same list
    const newCards = [...sourceList.cards];
    newCards.splice(sourceIndex, 1);
    newCards.splice(destIndex, 0, { ...cardToMove, updatedAt: now });

    return {
      ...board,
      updatedAt: now,
      lists: board.lists.map((l) => (l.id === sourceListId ? { ...l, cards: newCards } : l)),
    };
  }

  // Move across different lists
  const newSourceCards = [...sourceList.cards];
  newSourceCards.splice(sourceIndex, 1);

  const newDestCards = [...destList.cards];
  newDestCards.splice(destIndex, 0, { ...cardToMove, updatedAt: now });

  return {
    ...board,
    updatedAt: now,
    lists: board.lists.map((l) => {
      if (l.id === sourceListId) return { ...l, cards: newSourceCards };
      if (l.id === destListId) return { ...l, cards: newDestCards };
      return l;
    }),
  };
}

export function moveList(board: KanbanBoard, sourceIndex: number, destIndex: number): KanbanBoard {
  if (sourceIndex === destIndex) return board;
  const newLists = [...board.lists];
  const [removed] = newLists.splice(sourceIndex, 1);
  if (!removed) return board;
  newLists.splice(destIndex, 0, removed);

  const reindexed = newLists.map((l, idx) => ({ ...l, order: idx }));
  return {
    ...board,
    updatedAt: formatUpdatedAt(new Date()),
    lists: reindexed,
  };
}

export function addCardToList(
  board: KanbanBoard,
  listId: string,
  title: string,
  meta?: Partial<KanbanCard>,
): KanbanBoard {
  const cleanTitle = title.trim();
  if (!cleanTitle) return board;

  const now = formatUpdatedAt(new Date());
  const newCard: KanbanCard = {
    id: createId("card"),
    title: cleanTitle,
    labels: [],
    checklists: [],
    comments: [],
    order: 0,
    createdAt: now,
    updatedAt: now,
    ...meta,
  };

  return {
    ...board,
    updatedAt: now,
    lists: board.lists.map((l) => {
      if (l.id !== listId) return l;
      return {
        ...l,
        cards: [...l.cards, { ...newCard, order: l.cards.length }],
      };
    }),
  };
}

export function updateCard(
  board: KanbanBoard,
  listId: string,
  cardId: string,
  updates: Partial<KanbanCard>,
): KanbanBoard {
  const now = formatUpdatedAt(new Date());
  return {
    ...board,
    updatedAt: now,
    lists: board.lists.map((l) => {
      if (l.id !== listId) return l;
      return {
        ...l,
        cards: l.cards.map((c) => (c.id === cardId ? { ...c, ...updates, updatedAt: now } : c)),
      };
    }),
  };
}

export function archiveCard(board: KanbanBoard, listId: string, cardId: string): KanbanBoard {
  const now = formatUpdatedAt(new Date());
  return {
    ...board,
    updatedAt: now,
    lists: board.lists.map((l) => ({
      ...l,
      cards: l.cards.map((c) => (c.id === cardId ? { ...c, archived: true, updatedAt: now } : c)),
    })),
  };
}

export function restoreCard(board: KanbanBoard, listId: string, cardId: string): KanbanBoard {
  const now = formatUpdatedAt(new Date());
  return {
    ...board,
    updatedAt: now,
    lists: board.lists.map((l) => ({
      ...l,
      cards: l.cards.map((c) => (c.id === cardId ? { ...c, archived: false, updatedAt: now } : c)),
    })),
  };
}

export function deleteCard(board: KanbanBoard, listId: string, cardId: string): KanbanBoard {
  const now = formatUpdatedAt(new Date());
  return {
    ...board,
    updatedAt: now,
    lists: board.lists.map((l) => {
      if (l.id !== listId) return l;
      return {
        ...l,
        cards: l.cards.filter((c) => c.id !== cardId),
      };
    }),
  };
}

export function addList(board: KanbanBoard, title: string): KanbanBoard {
  const cleanTitle = title.trim();
  if (!cleanTitle) return board;

  const now = formatUpdatedAt(new Date());
  const newList: KanbanList = {
    id: createId("list"),
    title: cleanTitle,
    cards: [],
    order: board.lists.length,
  };

  return {
    ...board,
    updatedAt: now,
    lists: [...board.lists, newList],
  };
}

export function updateListTitle(board: KanbanBoard, listId: string, title: string): KanbanBoard {
  const cleanTitle = title.trim();
  if (!cleanTitle) return board;
  const now = formatUpdatedAt(new Date());

  return {
    ...board,
    updatedAt: now,
    lists: board.lists.map((l) => (l.id === listId ? { ...l, title: cleanTitle } : l)),
  };
}

export function deleteList(board: KanbanBoard, listId: string): KanbanBoard {
  const now = formatUpdatedAt(new Date());
  return {
    ...board,
    updatedAt: now,
    lists: board.lists.filter((l) => l.id !== listId),
  };
}

export function createNewBoard(
  title: string,
  background: string = "biarfokus-white",
  templateKey?: string,
): KanbanBoard {
  const cleanTitle = title.trim() || "Proyek Baru";
  const now = formatUpdatedAt(new Date());

  if (templateKey) {
    const template = TEMPLATES.find((t) => t.key === templateKey);
    if (template) {
      const built = template.builder();
      return {
        ...built,
        id: createId("board"),
        title: cleanTitle,
        background: background || built.background,
        createdAt: now,
        updatedAt: now,
      };
    }
  }

  return {
    id: createId("board"),
    title: cleanTitle,
    background,
    starred: false,
    createdAt: now,
    updatedAt: now,
    lists: [
      { id: createId("list"), title: "To Do", order: 0, cards: [] },
      { id: createId("list"), title: "In Progress", order: 1, cards: [] },
      { id: createId("list"), title: "Done", order: 2, cards: [] },
    ],
  };
}

/**
 * Returns true if a hex color has a light luminance, meaning dark text should be used on top.
 */
export function isLightHexColor(colorStr?: string): boolean {
  if (!colorStr) return false;
  const hex = colorStr.replace("#", "");
  if (hex.length === 3) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 155;
  }
  if (hex.length === 6) {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 155;
  }
  return false;
}
