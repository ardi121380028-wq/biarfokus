import type {
  KanbanBoard,
  KanbanCard,
  KanbanList,
} from "@/types/domain";

export const KANBAN_STORAGE_PREFIX = "biarfokus.kanban";

export function getStorageKey(userId?: string | null): string {
  return userId ? `${KANBAN_STORAGE_PREFIX}.${userId}.boards` : `${KANBAN_STORAGE_PREFIX}.guest.boards`;
}

export function getActiveBoardStorageKey(userId?: string | null): string {
  return userId ? `${KANBAN_STORAGE_PREFIX}.${userId}.active` : `${KANBAN_STORAGE_PREFIX}.guest.active`;
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
    title: "Project Management (Scrum)",
    description: "Siklus sprint produk dari backlog hingga QA dan rilis.",
    background: "purple-haze",
    starred: false,
    createdAt: now,
    updatedAt: now,
    lists: [
      { id: createId("list"), title: "Backlog", order: 0, cards: [
        { id: createId("card"), title: "Riset kebutuhan user", labels: [{ id: "l-1", name: "Dev / Tech", color: "#0079bf" }], checklists: [], comments: [], order: 0, createdAt: now, updatedAt: now },
      ] },
      { id: createId("list"), title: "Sprint To Do", order: 1, cards: [] },
      { id: createId("list"), title: "In Progress", order: 2, cards: [] },
      { id: createId("list"), title: "Code Review / QA", order: 3, cards: [] },
      { id: createId("list"), title: "Done", order: 4, cards: [] },
    ],
  };
}

export function createBugTrackingBoard(): KanbanBoard {
  const now = formatUpdatedAt(new Date());
  return {
    id: createId("board"),
    title: "Bug Tracking & Issues",
    description: "Pelacakan issue dan perbaikan bug sistem.",
    background: "sunset-glow",
    starred: false,
    createdAt: now,
    updatedAt: now,
    lists: [
      { id: createId("list"), title: "Reported Bugs", order: 0, cards: [] },
      { id: createId("list"), title: "Triaged / Investigating", order: 1, cards: [] },
      { id: createId("list"), title: "Fix in Progress", order: 2, cards: [] },
      { id: createId("list"), title: "Testing / Verified", order: 3, cards: [] },
      { id: createId("list"), title: "Resolved", order: 4, cards: [] },
    ],
  };
}

export function createPersonalKanbanBoard(): KanbanBoard {
  const now = formatUpdatedAt(new Date());
  return {
    id: createId("board"),
    title: "Personal Focus Kanban",
    description: "Manajemen prioritas pribadi harian dan mingguan.",
    background: "emerald-forest",
    starred: false,
    createdAt: now,
    updatedAt: now,
    lists: [
      { id: createId("list"), title: "Ide & Brainstorm", order: 0, cards: [] },
      { id: createId("list"), title: "To Do Hari Ini", order: 1, cards: [] },
      { id: createId("list"), title: "Sedang Dikerjakan", order: 2, cards: [] },
      { id: createId("list"), title: "Selesai", order: 3, cards: [] },
    ],
  };
}

export const TEMPLATES: { key: string; name: string; description: string; icon: string; builder: () => KanbanBoard }[] = [
  {
    key: "growth",
    name: "GT - Growth",
    description: "Board pertumbuhan bisnis, manajemen klien, dan target 101 crucial.",
    icon: "🚀",
    builder: createDefaultGrowthBoard,
  },
  {
    key: "scrum",
    name: "Project Management (Scrum)",
    description: "Manajemen backlog, sprint aktif, code review, dan rilis.",
    icon: "⚡",
    builder: createScrumBoard,
  },
  {
    key: "bugs",
    name: "Bug Tracking",
    description: "Pelacakan isu kritis, triase bug, dan verifikasi perbaikan.",
    icon: "🐛",
    builder: createBugTrackingBoard,
  },
  {
    key: "personal",
    name: "Personal Productivity",
    description: "Alur fokus pribadi sederhana: Ide, To Do, Doing, Selesai.",
    icon: "🎯",
    builder: createPersonalKanbanBoard,
  },
];

export const INITIAL_BOARDS: KanbanBoard[] = [createDefaultGrowthBoard()];

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
    title: typeof b.title === "string" && b.title ? b.title : "Board Baru",
    description: typeof b.description === "string" ? b.description : "",
    background:
      typeof b.background === "string" && b.background
        ? (b.id === "board-gt-growth" && b.background === "wave-blue"
            ? "biarfokus-white"
            : b.background)
        : "biarfokus-white",
    starred: Boolean(b.starred),
    role: b.role,
    isShared: Boolean(b.isShared),
    labels: Array.isArray(b.labels) ? b.labels : undefined,
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

export function parseStoredBoards(raw: string | null): KanbanBoard[] {
  if (!raw) return INITIAL_BOARDS;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0].id === "string") {
      return parsed.map((item) => normalizeBoard(item));
    }
  } catch {
    // Malformed JSON: return defaults
  }
  return INITIAL_BOARDS;
}

/* ------------------------------------------------------------------ */
/* Immutable Pure Board Operations                                     */
/* ------------------------------------------------------------------ */

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
