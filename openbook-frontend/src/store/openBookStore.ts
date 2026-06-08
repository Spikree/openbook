import { api } from "@/api/client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "sonner";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  image?: string;
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
  content: string;
  createdAt: string;
}

export interface OpenBookDocument {
  id: string;
  name: string;
  size: number;
  content: string;
  uploadedAt: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  interval: number;
  easeFactor: number;
  dueDate: string;
  createdAt: string;
}

export interface Summary {
  id: string;
  content: string;
  documentId: string;
  createdAt: string;
}

export interface OpenBook {
  id: string;
  name: string;
  documents: OpenBookDocument[];
  conversations: Message[];
  flashcards: Flashcard[];
  summaries: Summary[];
  selectedDocumentIds: string[];
  examSessions: ExamSession[];
  mcqSessions: MCQSession[];
  summarySessions: SummarySession[];
  notes: Note[];
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  openbook_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface OpenBookStore {
  openBooks: Record<string, OpenBook>;
  activeOpenBookId: string | null;

  toggleDocumentSelection: (openBookId: string, docId: string) => void;
  selectAllDocuments: (openBookId: string) => void;
  clearActiveOpenBook: () => void;

  addExamSession: (openBookId: string, session: ExamSession) => void;
  addMCQSession: (openBookId: string, session: MCQSession) => void;
  addSummarySession: (openBookId: string, session: SummarySession) => void;
  removeExamSession: (openBookId: string, sessionId: string) => void;
  removeMCQSession: (openBookId: string, sessionId: string) => void;
  removeSummarySession: (openBookId: string, sessionId: string) => void;

  createOpenBook: (name: string, id?: string) => void;
  deleteOpenBook: (id: string) => void;
  renameOpenBook: (id: string, name: string) => Promise<void>;
  setActiveOpenBook: (id: string) => void;
  loadOpenBooks: () => Promise<void>;

  uploadDocument: (openBookId: string, file: File) => Promise<void>;
  removeDocument: (openBookId: string, docId: string) => Promise<void>;

  addMessage: (openBookId: string, message: Message) => void;
  clearConversation: (openBookId: string) => void;

  addFlashcard: (openBookId: string, flashcard: Flashcard) => void;
  removeFlashcard: (openBookId: string, flashcardId: string) => void;

  addSummary: (openBookId: string, summary: Summary) => void;
  removeSummary: (openBookId: string, summaryId: string) => void;

  generateFlashcards: (openBookId: string) => Promise<void>;
  generateExam: (openBookId: string) => Promise<void>;
  generateMCQ: (openBookId: string) => Promise<void>;

  createNote: (openBookId: string, title: string) => Promise<Note>;
  updateNote: (
    openBookId: string,
    noteId: string,
    data: { title?: string; content?: string },
  ) => Promise<void>;
  deleteNote: (openBookId: string, noteId: string) => Promise<void>;
  loadNotes: (openBookId: string) => Promise<void>;
}

const updateBook = (
  openBooks: Record<string, OpenBook>,
  openBookId: string,
  updater: (ob: OpenBook) => OpenBook,
): Record<string, OpenBook> => {
  const book = openBooks[openBookId];
  if (!book) return openBooks;
  return {
    ...openBooks,
    [openBookId]: updater(book),
  };
};

const toastError = (message: string, err: unknown) => {
  toast.error(message, {
    description: err instanceof Error ? err.message : "Try again",
  });
};

export const useOpenBookStore = create<OpenBookStore>()(
  persist(
    (set, get) => ({
      openBooks: {},
      activeOpenBookId: null,

      createOpenBook: (name, id) => {
        const bookId = id ?? crypto.randomUUID();
        set((state) => ({
          openBooks: {
            ...state.openBooks,
            [bookId]: {
              id: bookId,
              name,
              documents: [],
              selectedDocumentIds: [],
              conversations: [],
              flashcards: [],
              summaries: [],
              examSessions: [],
              mcqSessions: [],
              summarySessions: [],
              notes: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          },
        }));
      },

      deleteOpenBook: (id) =>
        set((state) => {
          const { [id]: _, ...rest } = state.openBooks;
          return {
            openBooks: rest,
            activeOpenBookId:
              state.activeOpenBookId === id ? null : state.activeOpenBookId,
          };
        }),

      renameOpenBook: async (id, name) => {
        try {
          await api.renameOpenBook(id, name);
          set((state) => ({
            openBooks: updateBook(state.openBooks, id, (ob) => ({
              ...ob,
              name,
              updatedAt: new Date().toISOString(),
            })),
          }));
        } catch (err) {
          toastError("Failed to rename OpenBook", err);
          throw err;
        }
      },

      setActiveOpenBook: (id) => set({ activeOpenBookId: id }),

      uploadDocument: async (openBookId, file) => {
        try {
          const uploaded = await api.uploadDocument(openBookId, file);
          set((state) => ({
            openBooks: updateBook(state.openBooks, openBookId, (ob) => ({
              ...ob,
              documents: [
                ...ob.documents,
                {
                  id: uploaded.id,
                  name: uploaded.name,
                  size: uploaded.size,
                  content: "",
                  uploadedAt: uploaded.uploaded_at,
                },
              ],
              selectedDocumentIds: [...ob.selectedDocumentIds, uploaded.id],
              updatedAt: new Date().toISOString(),
            })),
          }));
        } catch (err) {
          toastError(`Failed to upload ${file.name}`, err);
          throw err;
        }
      },

      removeDocument: async (openBookId, docId) => {
        try {
          await api.deleteDocument(docId);
          set((state) => ({
            openBooks: updateBook(state.openBooks, openBookId, (ob) => ({
              ...ob,
              documents: ob.documents.filter((d) => d.id !== docId),
              selectedDocumentIds: ob.selectedDocumentIds.filter(
                (id) => id !== docId,
              ),
              updatedAt: new Date().toISOString(),
            })),
          }));
        } catch (err) {
          toastError("Failed to delete document", err);
          throw err;
        }
      },

      toggleDocumentSelection: (openBookId, docId) =>
        set((state) => ({
          openBooks: updateBook(state.openBooks, openBookId, (ob) => ({
            ...ob,
            selectedDocumentIds: ob.selectedDocumentIds.includes(docId)
              ? ob.selectedDocumentIds.filter((id) => id !== docId)
              : [...ob.selectedDocumentIds, docId],
          })),
        })),

      selectAllDocuments: (openBookId) =>
        set((state) => ({
          openBooks: updateBook(state.openBooks, openBookId, (ob) => ({
            ...ob,
            selectedDocumentIds: ob.documents.map((d) => d.id),
          })),
        })),

      addMessage: (openBookId, message) =>
        set((state) => ({
          openBooks: updateBook(state.openBooks, openBookId, (ob) => ({
            ...ob,
            conversations: [...ob.conversations, message],
            updatedAt: new Date().toISOString(),
          })),
        })),

      clearConversation: (openBookId) =>
        set((state) => ({
          openBooks: updateBook(state.openBooks, openBookId, (ob) => ({
            ...ob,
            conversations: [],
            updatedAt: new Date().toISOString(),
          })),
        })),

      addFlashcard: (openBookId, flashcard) =>
        set((state) => ({
          openBooks: updateBook(state.openBooks, openBookId, (ob) => ({
            ...ob,
            flashcards: [...ob.flashcards, flashcard],
            updatedAt: new Date().toISOString(),
          })),
        })),

      removeFlashcard: (openBookId, flashcardId) =>
        set((state) => ({
          openBooks: updateBook(state.openBooks, openBookId, (ob) => ({
            ...ob,
            flashcards: ob.flashcards.filter((f) => f.id !== flashcardId),
            updatedAt: new Date().toISOString(),
          })),
        })),

      addSummary: (openBookId, summary) =>
        set((state) => ({
          openBooks: updateBook(state.openBooks, openBookId, (ob) => ({
            ...ob,
            summaries: [...ob.summaries, summary],
            updatedAt: new Date().toISOString(),
          })),
        })),

      removeSummary: (openBookId, summaryId) =>
        set((state) => ({
          openBooks: updateBook(state.openBooks, openBookId, (ob) => ({
            ...ob,
            summaries: ob.summaries.filter((s) => s.id !== summaryId),
            updatedAt: new Date().toISOString(),
          })),
        })),

      addExamSession: (openBookId, session) =>
        set((state) => ({
          openBooks: updateBook(state.openBooks, openBookId, (ob) => ({
            ...ob,
            examSessions: [...(ob.examSessions ?? []), session],
          })),
        })),

      addMCQSession: (openBookId, session) =>
        set((state) => ({
          openBooks: updateBook(state.openBooks, openBookId, (ob) => ({
            ...ob,
            mcqSessions: [...(ob.mcqSessions ?? []), session],
          })),
        })),

      addSummarySession: (openBookId, session) =>
        set((state) => ({
          openBooks: updateBook(state.openBooks, openBookId, (ob) => ({
            ...ob,
            summarySessions: [...(ob.summarySessions ?? []), session],
          })),
        })),

      removeExamSession: (openBookId, sessionId) =>
        set((state) => ({
          openBooks: updateBook(state.openBooks, openBookId, (ob) => ({
            ...ob,
            examSessions: ob.examSessions.filter((s) => s.id !== sessionId),
          })),
        })),

      removeMCQSession: (openBookId, sessionId) =>
        set((state) => ({
          openBooks: updateBook(state.openBooks, openBookId, (ob) => ({
            ...ob,
            mcqSessions: ob.mcqSessions.filter((s) => s.id !== sessionId),
          })),
        })),

      removeSummarySession: (openBookId, sessionId) =>
        set((state) => ({
          openBooks: updateBook(state.openBooks, openBookId, (ob) => ({
            ...ob,
            summarySessions: ob.summarySessions.filter(
              (s) => s.id !== sessionId,
            ),
          })),
        })),

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
              front: card.front ?? card.question ?? "",
              back: card.back ?? card.answer ?? "",
              interval: 1,
              easeFactor: 2.5,
              dueDate: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            }),
          );
          set((state) => ({
            openBooks: updateBook(state.openBooks, openBookId, (ob) => ({
              ...ob,
              flashcards: [...ob.flashcards, ...cards],
              updatedAt: new Date().toISOString(),
            })),
          }));
        } catch (err) {
          toastError("Failed to generate flashcards", err);
          throw err;
        }
      },

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
          set((state) => ({
            openBooks: updateBook(state.openBooks, openBookId, (ob) => ({
              ...ob,
              examSessions: [...(ob.examSessions ?? []), session],
            })),
          }));
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
          set((state) => ({
            openBooks: updateBook(state.openBooks, openBookId, (ob) => ({
              ...ob,
              mcqSessions: [...(ob.mcqSessions ?? []), session],
            })),
          }));
        } catch (err) {
          toastError("Failed to generate MCQ", err);
          throw err;
        }
      },

      loadOpenBooks: async () => {
        try {
          const openBooks = await api.getOpenBooks();
          const fullBooks = await Promise.all(
            openBooks.map((ob: { id: string }) => api.getOpenBookFull(ob.id)),
          );

          const notesByBook = await Promise.all(
            openBooks.map((ob: { id: string }) => api.getNotes(ob.id)),
          );

          const record: Record<string, OpenBook> = {};
          fullBooks.forEach((ob: any, i: number) => {
            record[ob.id] = {
              id: ob.id,
              name: ob.name,
              documents: ob.documents.map((d: any) => ({
                id: d.id,
                name: d.name,
                size: d.size,
                content: d.content,
                uploadedAt: d.uploadedAt,
              })),
              selectedDocumentIds: ob.documents.map((d: any) => d.id),
              conversations: [],
              flashcards: [],
              summaries: [],
              examSessions: [],
              mcqSessions: [],
              summarySessions: [],
              notes: notesByBook[i] ?? [],
              createdAt: ob.created_at,
              updatedAt: ob.updated_at,
            };
          });
          set({ openBooks: record });
        } catch (err) {
          toastError("Failed to load OpenBooks", err);
        }
      },

      createNote: async (openBookId, title) => {
        try {
          const note = await api.createNote(openBookId, title);
          set((state) => ({
            openBooks: updateBook(state.openBooks, openBookId, (ob) => ({
              ...ob,
              notes: [note, ...(ob.notes ?? [])],
            })),
          }));
          return note;
        } catch (err) {
          toastError("Failed to create note", err);
          throw err;
        }
      },

      updateNote: async (openBookId, noteId, data) => {
        try {
          const updated = await api.updateNote(noteId, data);
          set((state) => ({
            openBooks: updateBook(state.openBooks, openBookId, (ob) => ({
              ...ob,
              notes: (ob.notes ?? []).map((n) =>
                n.id === noteId ? updated : n,
              ),
            })),
          }));
        } catch (err) {
          toastError("Failed to update note", err);
          throw err;
        }
      },

      deleteNote: async (openBookId, noteId) => {
        try {
          await api.deleteNote(noteId);
          set((state) => ({
            openBooks: updateBook(state.openBooks, openBookId, (ob) => ({
              ...ob,
              notes: (ob.notes ?? []).filter((n) => n.id !== noteId),
            })),
          }));
        } catch (err) {
          toastError("Failed to delete note", err);
          throw err;
        }
      },

      loadNotes: async (openBookId) => {
        try {
          const notes = await api.getNotes(openBookId);
          set((state) => ({
            openBooks: updateBook(state.openBooks, openBookId, (ob) => ({
              ...ob,
              notes,
            })),
          }));
        } catch (err) {
          toastError("Failed to load notes", err);
        }
      },

      clearActiveOpenBook: () => set({ activeOpenBookId: null }),
    }),

    {
      name: "openbook-store",
      partialize: (state) => ({
        activeOpenBookId: state.activeOpenBookId,
        openBooks: Object.fromEntries(
          Object.entries(state.openBooks).map(([id, ob]) => [
            id,
            {
              ...ob,
              documents: ob.documents.map(({ content: _, ...rest }) => rest),
            },
          ]),
        ),
      }),
    },
  ),
);
