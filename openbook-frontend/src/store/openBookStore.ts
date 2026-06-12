import { api } from "@/api/client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import { toast } from "sonner";

// ───────────────────────── entities ─────────────────────────

export interface Message {
  id: string;
  openBookId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  image?: string;
}

export interface OpenBookDocument {
  id: string;
  openBookId: string;
  name: string;
  size: number;
  content: string;
  uploadedAt: string;
}

export interface Flashcard {
  id: string;
  openBookId: string;
  front: string;
  back: string;
  interval: number;
  easeFactor: number;
  dueDate: string;
  createdAt: string;
}

export interface MarkingResult {
  total_score: number;
  max_score: number;
  percentage: number;
  results: {
    question: string;
    user_answer: string;
    score: number;
    max_score: number;
    feedback: string;
    what_you_got_right: string;
    what_you_missed: string;
  }[];
}

export interface ExamSession {
  id: string;
  openBookId: string;
  questions: {
    id: string;
    question: string;
    answer: string;
    userAnswer: string;
  }[];
  result: MarkingResult | null;
  createdAt: string;
}

export interface MCQSession {
  id: string;
  openBookId: string;
  questions: {
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    selectedIndex: number | null;
  }[];
  createdAt: string;
}

export interface SummarySession {
  id: string;
  openBookId: string;
  content: string;
  createdAt: string;
}

export interface Summary {
  id: string;
  openBookId: string;
  documentId: string;
  content: string;
  createdAt: string;
}

export interface Note {
  id: string;
  openbook_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface OpenBook {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  documentIds: string[];
  noteIds: string[];
  flashcardIds: string[];
  examSessionIds: string[];
  mcqSessionIds: string[];
  summarySessionIds: string[];
  summaryIds: string[];
  messageIds: string[];
  selectedDocumentIds: string[];
}

// ───────────────────────── store ─────────────────────────

interface OpenBookStore {
  openBooks: Record<string, OpenBook>;
  documents: Record<string, OpenBookDocument>;
  notes: Record<string, Note>;
  flashcards: Record<string, Flashcard>;
  examSessions: Record<string, ExamSession>;
  mcqSessions: Record<string, MCQSession>;
  summarySessions: Record<string, SummarySession>;
  summaries: Record<string, Summary>;
  messages: Record<string, Message>;

  createOpenBook: (name: string) => Promise<OpenBook | null>;
  deleteOpenBook: (id: string) => Promise<void>;
  renameOpenBook: (id: string, name: string) => Promise<void>;

  loadOpenBooks: () => Promise<void>;

  uploadDocument: (openBookId: string, file: File) => Promise<void>;
  removeDocument: (openBookId: string, docId: string) => Promise<void>;
  toggleDocumentSelection: (openBookId: string, docId: string) => void;
  selectAllDocuments: (openBookId: string) => void;
  clearDocumentSelection: (openBookId: string) => void;

  addMessage: (
    openBookId: string,
    message: Omit<Message, "openBookId">,
  ) => void;
  clearConversation: (openBookId: string) => void;

  generateFlashcards: (openBookId: string) => Promise<void>;
  addFlashcard: (
    openBookId: string,
    flashcard: Omit<Flashcard, "openBookId">,
  ) => void;
  removeFlashcard: (openBookId: string, flashcardId: string) => void;

  generateExam: (openBookId: string) => Promise<void>;
  generateMCQ: (openBookId: string) => Promise<void>;
  addExamSession: (
    openBookId: string,
    session: Omit<ExamSession, "openBookId">,
  ) => void;
  addMCQSession: (
    openBookId: string,
    session: Omit<MCQSession, "openBookId">,
  ) => void;
  addSummarySession: (
    openBookId: string,
    session: Omit<SummarySession, "openBookId">,
  ) => void;
  removeExamSession: (openBookId: string, sessionId: string) => void;
  removeMCQSession: (openBookId: string, sessionId: string) => void;
  removeSummarySession: (openBookId: string, sessionId: string) => void;

  addSummary: (
    openBookId: string,
    summary: Omit<Summary, "openBookId">,
  ) => void;
  removeSummary: (openBookId: string, summaryId: string) => void;

  createNote: (openBookId: string, title: string) => Promise<Note>;
  updateNote: (
    noteId: string,
    data: { title?: string; content?: string },
  ) => Promise<void>;
  deleteNote: (openBookId: string, noteId: string) => Promise<void>;
  loadNotes: (openBookId: string) => Promise<void>;
}

const toastError = (message: string, err: unknown) => {
  toast.error(message, {
    description: err instanceof Error ? err.message : "Try again",
  });
};

// remove a set of ids from an entity table
const omitIds = <T>(
  table: Record<string, T>,
  ids: string[],
): Record<string, T> => {
  if (ids.length === 0) return table;
  const next = { ...table };
  ids.forEach((id) => delete next[id]);
  return next;
};

const emptyBook = (
  id: string,
  name: string,
  createdAt?: string,
  updatedAt?: string,
): OpenBook => ({
  id,
  name,
  createdAt: createdAt ?? new Date().toISOString(),
  updatedAt: updatedAt ?? new Date().toISOString(),
  documentIds: [],
  noteIds: [],
  flashcardIds: [],
  examSessionIds: [],
  mcqSessionIds: [],
  summarySessionIds: [],
  summaryIds: [],
  messageIds: [],
  selectedDocumentIds: [],
});

export const useOpenBookStore = create<OpenBookStore>()(
  persist(
    (set, get) => ({
      openBooks: {},
      documents: {},
      notes: {},
      flashcards: {},
      examSessions: {},
      mcqSessions: {},
      summarySessions: {},
      summaries: {},
      messages: {},

      // ───────── books ─────────

      createOpenBook: async (name) => {
        try {
          const created = await api.createOpenBook(name);
          const book = emptyBook(
            created.id,
            created.name,
            created.created_at,
            created.updated_at,
          );
          set((state) => ({
            openBooks: { ...state.openBooks, [book.id]: book },
          }));
          return book;
        } catch (err) {
          toastError("Failed to create OpenBook", err);
          return null;
        }
      },

      deleteOpenBook: async (id) => {
        try {
          await api.deleteOpenBook(id);
          // normalized delete = cascade: every child id the book references
          // must be removed from its table, or we leak orphaned entities
          set((state) => {
            const book = state.openBooks[id];
            if (!book) return state;
            const { [id]: _removed, ...restBooks } = state.openBooks;
            return {
              openBooks: restBooks,
              documents: omitIds(state.documents, book.documentIds),
              notes: omitIds(state.notes, book.noteIds),
              flashcards: omitIds(state.flashcards, book.flashcardIds),
              examSessions: omitIds(state.examSessions, book.examSessionIds),
              mcqSessions: omitIds(state.mcqSessions, book.mcqSessionIds),
              summarySessions: omitIds(
                state.summarySessions,
                book.summarySessionIds,
              ),
              summaries: omitIds(state.summaries, book.summaryIds),
              messages: omitIds(state.messages, book.messageIds),
            };
          });
        } catch (err) {
          toastError("Failed to delete OpenBook", err);
          throw err;
        }
      },

      renameOpenBook: async (id, name) => {
        try {
          await api.renameOpenBook(id, name);
          set((state) => {
            const book = state.openBooks[id];
            if (!book) return state;
            return {
              openBooks: {
                ...state.openBooks,
                [id]: { ...book, name, updatedAt: new Date().toISOString() },
              },
            };
          });
        } catch (err) {
          toastError("Failed to rename OpenBook", err);
          throw err;
        }
      },

      loadOpenBooks: async () => {
        try {
          const list = await api.getOpenBooks();
          const fullBooks = await Promise.all(
            list.map((ob: { id: string }) => api.getOpenBookFull(ob.id)),
          );
          const notesByBook = await Promise.all(
            list.map((ob: { id: string }) => api.getNotes(ob.id)),
          );

          // normalize: flatten nested API responses into entity tables
          const openBooks: Record<string, OpenBook> = {};
          const documents: Record<string, OpenBookDocument> = {};
          const notes: Record<string, Note> = {};

          fullBooks.forEach((ob: any, i: number) => {
            const documentIds: string[] = [];
            ob.documents.forEach((d: any) => {
              documents[d.id] = {
                id: d.id,
                openBookId: ob.id,
                name: d.name,
                size: d.size,
                content: d.content,
                uploadedAt: d.uploaded_at,
              };
              documentIds.push(d.id);
            });

            const noteIds: string[] = [];
            (notesByBook[i] ?? []).forEach((n: Note) => {
              notes[n.id] = n;
              noteIds.push(n.id);
            });

            openBooks[ob.id] = {
              ...emptyBook(ob.id, ob.name, ob.created_at, ob.updated_at),
              documentIds,
              noteIds,
              selectedDocumentIds: documentIds, // select all by default, as before
            };
          });

          // sessions/messages were never persisted — reset on load, as before
          set({
            openBooks,
            documents,
            notes,
            flashcards: {},
            examSessions: {},
            mcqSessions: {},
            summarySessions: {},
            summaries: {},
            messages: {},
          });
        } catch (err) {
          toastError("Failed to load OpenBooks", err);
        }
      },

      // ───────── documents ─────────

      uploadDocument: async (openBookId, file) => {
        try {
          const uploaded = await api.uploadDocument(openBookId, file);
          // two-step write: entity into table, id into parent array
          set((state) => {
            const book = state.openBooks[openBookId];
            if (!book) return state;
            return {
              documents: {
                ...state.documents,
                [uploaded.id]: {
                  id: uploaded.id,
                  openBookId,
                  name: uploaded.name,
                  size: uploaded.size,
                  content: "",
                  uploadedAt: uploaded.uploaded_at,
                },
              },
              openBooks: {
                ...state.openBooks,
                [openBookId]: {
                  ...book,
                  documentIds: [...book.documentIds, uploaded.id],
                  selectedDocumentIds: [
                    ...book.selectedDocumentIds,
                    uploaded.id,
                  ],
                  updatedAt: new Date().toISOString(),
                },
              },
            };
          });
        } catch (err) {
          toastError(`Failed to upload ${file.name}`, err);
          throw err;
        }
      },

      removeDocument: async (openBookId, docId) => {
        try {
          await api.deleteDocument(docId);
          set((state) => {
            const book = state.openBooks[openBookId];
            if (!book) return state;
            return {
              documents: omitIds(state.documents, [docId]),
              openBooks: {
                ...state.openBooks,
                [openBookId]: {
                  ...book,
                  documentIds: book.documentIds.filter((id) => id !== docId),
                  selectedDocumentIds: book.selectedDocumentIds.filter(
                    (id) => id !== docId,
                  ),
                  updatedAt: new Date().toISOString(),
                },
              },
            };
          });
        } catch (err) {
          toastError("Failed to delete document", err);
          throw err;
        }
      },

      toggleDocumentSelection: (openBookId, docId) =>
        set((state) => {
          const book = state.openBooks[openBookId];
          if (!book) return state;
          return {
            openBooks: {
              ...state.openBooks,
              [openBookId]: {
                ...book,
                selectedDocumentIds: book.selectedDocumentIds.includes(docId)
                  ? book.selectedDocumentIds.filter((id) => id !== docId)
                  : [...book.selectedDocumentIds, docId],
              },
            },
          };
        }),

      selectAllDocuments: (openBookId) =>
        set((state) => {
          const book = state.openBooks[openBookId];
          if (!book) return state;
          return {
            openBooks: {
              ...state.openBooks,
              [openBookId]: {
                ...book,
                selectedDocumentIds: [...book.documentIds],
              },
            },
          };
        }),

      clearDocumentSelection: (openBookId) =>
        set((state) => {
          const book = state.openBooks[openBookId];
          if (!book) return state;
          return {
            openBooks: {
              ...state.openBooks,
              [openBookId]: { ...book, selectedDocumentIds: [] },
            },
          };
        }),

      // ───────── messages ─────────

      addMessage: (openBookId, message) =>
        set((state) => {
          const book = state.openBooks[openBookId];
          if (!book) return state;
          return {
            messages: {
              ...state.messages,
              [message.id]: { ...message, openBookId }, // FK stamped here, not by callers
            },
            openBooks: {
              ...state.openBooks,
              [openBookId]: {
                ...book,
                messageIds: [...book.messageIds, message.id],
                updatedAt: new Date().toISOString(),
              },
            },
          };
        }),

      clearConversation: (openBookId) =>
        set((state) => {
          const book = state.openBooks[openBookId];
          if (!book) return state;
          return {
            messages: omitIds(state.messages, book.messageIds),
            openBooks: {
              ...state.openBooks,
              [openBookId]: {
                ...book,
                messageIds: [],
                updatedAt: new Date().toISOString(),
              },
            },
          };
        }),

      // ───────── flashcards ─────────

      generateFlashcards: async (openBookId) => {
        try {
          const book = get().openBooks[openBookId];
          if (!book) return;
          const data = await api.generateFlashcards(
            openBookId,
            book.selectedDocumentIds,
          );
          const cards: Flashcard[] = data.flashcards.map(
            (card: {
              front?: string;
              back?: string;
              question?: string;
              answer?: string;
            }) => ({
              id: crypto.randomUUID(),
              openBookId,
              front: card.front ?? card.question ?? "",
              back: card.back ?? card.answer ?? "",
              interval: 1,
              easeFactor: 2.5,
              dueDate: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            }),
          );
          set((state) => {
            const b = state.openBooks[openBookId];
            if (!b) return state;
            const table = { ...state.flashcards };
            cards.forEach((c) => (table[c.id] = c));
            return {
              flashcards: table,
              openBooks: {
                ...state.openBooks,
                [openBookId]: {
                  ...b,
                  flashcardIds: [...b.flashcardIds, ...cards.map((c) => c.id)],
                  updatedAt: new Date().toISOString(),
                },
              },
            };
          });
        } catch (err) {
          toastError("Failed to generate flashcards", err);
          throw err;
        }
      },

      addFlashcard: (openBookId, flashcard) =>
        set((state) => {
          const book = state.openBooks[openBookId];
          if (!book) return state;
          const exists = book.flashcardIds.includes(flashcard.id);
          return {
            flashcards: {
              ...state.flashcards,
              [flashcard.id]: { ...flashcard, openBookId },
            },
            openBooks: exists
              ? state.openBooks // upsert: table write only, id already in array
              : {
                  ...state.openBooks,
                  [openBookId]: {
                    ...book,
                    flashcardIds: [...book.flashcardIds, flashcard.id],
                  },
                },
          };
        }),

      removeFlashcard: (openBookId, flashcardId) =>
        set((state) => {
          const book = state.openBooks[openBookId];
          if (!book) return state;
          return {
            flashcards: omitIds(state.flashcards, [flashcardId]),
            openBooks: {
              ...state.openBooks,
              [openBookId]: {
                ...book,
                flashcardIds: book.flashcardIds.filter(
                  (id) => id !== flashcardId,
                ),
              },
            },
          };
        }),

      // ───────── exam / mcq / summary sessions ─────────

      generateExam: async (openBookId) => {
        try {
          const book = get().openBooks[openBookId];
          if (!book) throw new Error("OpenBook not found");
          const data = await api.generateExam(
            openBookId,
            book.selectedDocumentIds,
          );
          const session: ExamSession = {
            id: crypto.randomUUID(),
            openBookId,
            questions: data.questions.map(
              (q: { question: string; answer: string }) => ({
                id: crypto.randomUUID(),
                question: q.question,
                answer: q.answer,
                userAnswer: "",
              }),
            ),
            result: null,
            createdAt: new Date().toISOString(),
          };
          get().addExamSession(openBookId, session);
        } catch (err) {
          toastError("Failed to generate exam", err);
          throw err;
        }
      },

      generateMCQ: async (openBookId) => {
        try {
          const book = get().openBooks[openBookId];
          if (!book) throw new Error("OpenBook not found");
          const data = await api.generateMCQ(
            openBookId,
            book.selectedDocumentIds,
          );
          const session: MCQSession = {
            id: crypto.randomUUID(),
            openBookId,
            questions: data.questions.map(
              (q: {
                question: string;
                options: string[];
                correct_index?: number;
                answer?: string;
              }) => {
                let correctIndex = q.correct_index ?? 0;
                if (q.answer && q.correct_index === undefined) {
                  const found = q.options.findIndex(
                    (o) =>
                      o.toLowerCase().trim() === q.answer!.toLowerCase().trim(),
                  );
                  if (found !== -1) correctIndex = found;
                }
                return {
                  id: crypto.randomUUID(),
                  question: q.question,
                  options: q.options,
                  correctIndex,
                  selectedIndex: null,
                };
              },
            ),
            createdAt: new Date().toISOString(),
          };
          get().addMCQSession(openBookId, session);
        } catch (err) {
          toastError("Failed to generate MCQ", err);
          throw err;
        }
      },

      addExamSession: (openBookId, session) =>
        set((state) => {
          const book = state.openBooks[openBookId];
          if (!book) return state;
          const exists = book.examSessionIds.includes(session.id);
          return {
            examSessions: {
              ...state.examSessions,
              [session.id]: { ...session, openBookId },
            },
            openBooks: exists
              ? state.openBooks
              : {
                  ...state.openBooks,
                  [openBookId]: {
                    ...book,
                    examSessionIds: [...book.examSessionIds, session.id],
                  },
                },
          };
        }),

      addMCQSession: (openBookId, session) =>
        set((state) => {
          const book = state.openBooks[openBookId];
          if (!book) return state;
          const exists = book.mcqSessionIds.includes(session.id);
          return {
            mcqSessions: {
              ...state.mcqSessions,
              [session.id]: { ...session, openBookId },
            },
            openBooks: exists
              ? state.openBooks
              : {
                  ...state.openBooks,
                  [openBookId]: {
                    ...book,
                    mcqSessionIds: [...book.mcqSessionIds, session.id],
                  },
                },
          };
        }),

      addSummarySession: (openBookId, session) =>
        set((state) => {
          const book = state.openBooks[openBookId];
          if (!book) return state;
          const exists = book.summarySessionIds.includes(session.id);
          return {
            summarySessions: {
              ...state.summarySessions,
              [session.id]: { ...session, openBookId },
            },
            openBooks: exists
              ? state.openBooks
              : {
                  ...state.openBooks,
                  [openBookId]: {
                    ...book,
                    summarySessionIds: [...book.summarySessionIds, session.id],
                  },
                },
          };
        }),

      removeExamSession: (openBookId, sessionId) =>
        set((state) => {
          const book = state.openBooks[openBookId];
          if (!book) return state;
          return {
            examSessions: omitIds(state.examSessions, [sessionId]),
            openBooks: {
              ...state.openBooks,
              [openBookId]: {
                ...book,
                examSessionIds: book.examSessionIds.filter(
                  (id) => id !== sessionId,
                ),
              },
            },
          };
        }),

      removeMCQSession: (openBookId, sessionId) =>
        set((state) => {
          const book = state.openBooks[openBookId];
          if (!book) return state;
          return {
            mcqSessions: omitIds(state.mcqSessions, [sessionId]),
            openBooks: {
              ...state.openBooks,
              [openBookId]: {
                ...book,
                mcqSessionIds: book.mcqSessionIds.filter(
                  (id) => id !== sessionId,
                ),
              },
            },
          };
        }),

      removeSummarySession: (openBookId, sessionId) =>
        set((state) => {
          const book = state.openBooks[openBookId];
          if (!book) return state;
          return {
            summarySessions: omitIds(state.summarySessions, [sessionId]),
            openBooks: {
              ...state.openBooks,
              [openBookId]: {
                ...book,
                summarySessionIds: book.summarySessionIds.filter(
                  (id) => id !== sessionId,
                ),
              },
            },
          };
        }),

      // ───────── summaries ─────────

      addSummary: (openBookId, summary) =>
        set((state) => {
          const book = state.openBooks[openBookId];
          if (!book) return state;
          const exists = book.summaryIds.includes(summary.id);
          return {
            summaries: {
              ...state.summaries,
              [summary.id]: { ...summary, openBookId },
            },
            openBooks: exists
              ? state.openBooks
              : {
                  ...state.openBooks,
                  [openBookId]: {
                    ...book,
                    summaryIds: [...book.summaryIds, summary.id],
                  },
                },
          };
        }),

      removeSummary: (openBookId, summaryId) =>
        set((state) => {
          const book = state.openBooks[openBookId];
          if (!book) return state;
          return {
            summaries: omitIds(state.summaries, [summaryId]),
            openBooks: {
              ...state.openBooks,
              [openBookId]: {
                ...book,
                summaryIds: book.summaryIds.filter((id) => id !== summaryId),
              },
            },
          };
        }),

      // ───────── notes ─────────

      createNote: async (openBookId, title) => {
        try {
          const note = await api.createNote(openBookId, title);
          set((state) => {
            const book = state.openBooks[openBookId];
            if (!book) return state;
            return {
              notes: { ...state.notes, [note.id]: note },
              openBooks: {
                ...state.openBooks,
                [openBookId]: { ...book, noteIds: [note.id, ...book.noteIds] }, // newest first
              },
            };
          });
          return note;
        } catch (err) {
          toastError("Failed to create note", err);
          throw err;
        }
      },

      updateNote: async (noteId, data) => {
        try {
          const updated = await api.updateNote(noteId, data);
          // the payoff: only notes[noteId] changes. the book object is untouched,
          // so nothing watching the book re-renders on every autosave
          set((state) => ({
            notes: { ...state.notes, [noteId]: updated },
          }));
        } catch (err) {
          toastError("Failed to update note", err);
          throw err;
        }
      },

      deleteNote: async (openBookId, noteId) => {
        try {
          await api.deleteNote(noteId);
          set((state) => {
            const book = state.openBooks[openBookId];
            if (!book) return state;
            return {
              notes: omitIds(state.notes, [noteId]),
              openBooks: {
                ...state.openBooks,
                [openBookId]: {
                  ...book,
                  noteIds: book.noteIds.filter((id) => id !== noteId),
                },
              },
            };
          });
        } catch (err) {
          toastError("Failed to delete note", err);
          throw err;
        }
      },

      loadNotes: async (openBookId) => {
        try {
          const fetched: Note[] = await api.getNotes(openBookId);
          set((state) => {
            const book = state.openBooks[openBookId];
            if (!book) return state;
            const nextNotes = omitIds(state.notes, book.noteIds); // drop this book's old notes
            const noteIds: string[] = [];
            fetched.forEach((n) => {
              nextNotes[n.id] = n;
              noteIds.push(n.id);
            });
            return {
              notes: nextNotes,
              openBooks: {
                ...state.openBooks,
                [openBookId]: { ...book, noteIds },
              },
            };
          });
        } catch (err) {
          toastError("Failed to load notes", err);
        }
      },
    }),
    {
      name: "openbook-store",
      version: 1, // old nested shape is incompatible; backend rebuilds on startup
      migrate: () => undefined as never,
      partialize: (state) => ({
        openBooks: state.openBooks,
        documents: Object.fromEntries(
          Object.entries(state.documents).map(([id, d]) => [
            id,
            { ...d, content: "" },
          ]),
        ),
      }),
    },
  ),
);

// ───────────────────────── selectors ─────────────────────────
// these build new arrays each call, so useShallow compares contents
// (entity references) instead of the array reference — entities only
// change when actually edited, so re-renders stay surgical

const isDefined = <T>(x: T | undefined): x is T => x !== undefined;

export const useBookDocuments = (bookId: string | null | undefined) =>
  useOpenBookStore(
    useShallow((s) => {
      const book = bookId ? s.openBooks[bookId] : undefined;
      return book
        ? book.documentIds.map((id) => s.documents[id]).filter(isDefined)
        : [];
    }),
  );

export const useBookMessages = (bookId: string | null | undefined) =>
  useOpenBookStore(
    useShallow((s) => {
      const book = bookId ? s.openBooks[bookId] : undefined;
      return book
        ? book.messageIds.map((id) => s.messages[id]).filter(isDefined)
        : [];
    }),
  );

export const useBookNotes = (bookId: string | null | undefined) =>
  useOpenBookStore(
    useShallow((s) => {
      const book = bookId ? s.openBooks[bookId] : undefined;
      return book
        ? book.noteIds.map((id) => s.notes[id]).filter(isDefined)
        : [];
    }),
  );

export const useBookFlashcards = (bookId: string | null | undefined) =>
  useOpenBookStore(
    useShallow((s) => {
      const book = bookId ? s.openBooks[bookId] : undefined;
      return book
        ? book.flashcardIds.map((id) => s.flashcards[id]).filter(isDefined)
        : [];
    }),
  );

export const useBookExamSessions = (bookId: string | null | undefined) =>
  useOpenBookStore(
    useShallow((s) => {
      const book = bookId ? s.openBooks[bookId] : undefined;
      return book
        ? book.examSessionIds.map((id) => s.examSessions[id]).filter(isDefined)
        : [];
    }),
  );

export const useBookMCQSessions = (bookId: string | null | undefined) =>
  useOpenBookStore(
    useShallow((s) => {
      const book = bookId ? s.openBooks[bookId] : undefined;
      return book
        ? book.mcqSessionIds.map((id) => s.mcqSessions[id]).filter(isDefined)
        : [];
    }),
  );

export const useBookSummaries = (bookId: string | null | undefined) =>
  useOpenBookStore(
    useShallow((s) => {
      const book = bookId ? s.openBooks[bookId] : undefined;
      return book
        ? book.summaryIds.map((id) => s.summaries[id]).filter(isDefined)
        : [];
    }),
  );
