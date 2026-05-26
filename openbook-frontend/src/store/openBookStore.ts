import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Message {
  id: string;
  role: "user" | "assistant";
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
  createdAt: string;
  updatedAt: string;
}

interface OpenBookStore {
  openBooks: Record<string, OpenBook>;
  activeOpenBookId: string | null;

  toggleDocumentSelection: (openBookId: string, docId: string) => void;
  selectAllDocuments: (openBookId: string) => void;

  createOpenBook: (name: string) => void;
  deleteOpenBook: (id: string) => void;
  setActiveOpenBook: (id: string) => void;

  addDocument: (openBookId: string, doc: OpenBookDocument) => void;
  removeDocument: (openBookId: string, docId: string) => void;

  addMessage: (openBookId: string, message: Message) => void;
  clearConversation: (openBookId: string) => void;

  addFlashcard: (openBookId: string, flashcard: Flashcard) => void;
  removeFlashcard: (openBookId: string, flashcardId: string) => void;

  addSummary: (openBookId: string, summary: Summary) => void;
  removeSummary: (openBookId: string, summaryId: string) => void;
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

export const useOpenBookStore = create<OpenBookStore>()(
  persist(
    (set) => ({
      openBooks: {},
      activeOpenBookId: null,

      createOpenBook: (name) => {
        const id = crypto.randomUUID();
        set((state) => ({
          openBooks: {
            ...state.openBooks,
            [id]: {
              id,
              name,
              documents: [],
              selectedDocumentIds: [],
              conversations: [],
              flashcards: [],
              summaries: [],
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

      setActiveOpenBook: (id) => set({ activeOpenBookId: id }),

      addDocument: (openBookId, doc) =>
        set((state) => ({
          openBooks: updateBook(state.openBooks, openBookId, (ob) => ({
            ...ob,
            documents: [...ob.documents, doc],
            selectedDocumentIds: [...ob.selectedDocumentIds, doc.id],
            updatedAt: new Date().toISOString(),
          })),
        })),

      removeDocument: (openBookId, docId) =>
        set((state) => ({
          openBooks: updateBook(state.openBooks, openBookId, (ob) => ({
            ...ob,
            documents: ob.documents.filter((d) => d.id !== docId),
            selectedDocumentIds: ob.selectedDocumentIds.filter(
              (id) => id !== docId,
            ),
            updatedAt: new Date().toISOString(),
          })),
        })),

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
              conversations: ob.conversations,
            },
          ]),
        ),
      }),
    },
  ),
);
