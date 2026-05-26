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
  openBooks: OpenBook[];
  activeOpenBookId: string | null;

  toggleDocumentSelection: (openBookId: string, docId: string) => void;
  selectAllDocuments: (openBookId: string) => void;

  createOpenBook: (name: string) => void;
  deleteOpenBook: (id: string) => void;
  setActiveOpenBook: (id: string) => void;

  addDocument: (openBookId: string, doc: OpenBookDocument) => void;
  removeDocument: (openBookId: string, docId: string) => void;
  removeSummary: (openBookId: string, summaryId: string) => void;

  addMessage: (openBookId: string, message: Message) => void;
  clearConversation: (openBookId: string) => void;

  addFlashcard: (openBookId: string, flashcard: Flashcard) => void;
  removeFlashcard: (openBookId: string, flashcardId: string) => void;

  addSummary: (openBookId: string, summary: Summary) => void;
}

export const useOpenBookStore = create<OpenBookStore>()(
  persist(
    (set) => ({
      openBooks: [],
      activeOpenBookId: null,

      createOpenBook: (name) =>
        set((state) => ({
          openBooks: [
            ...state.openBooks,
            {
              id: crypto.randomUUID(),
              name,
              documents: [],
              selectedDocumentIds: [],
              conversations: [],
              flashcards: [],
              summaries: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        })),

      deleteOpenBook: (id) =>
        set((state) => ({
          openBooks: state.openBooks.filter((ob) => ob.id !== id),
          activeOpenBookId:
            state.activeOpenBookId === id ? null : state.activeOpenBookId,
        })),

      setActiveOpenBook: (id) => set({ activeOpenBookId: id }),

      addDocument: (openBookId, doc) =>
        set((state) => ({
          openBooks: state.openBooks.map((ob) =>
            ob.id === openBookId
              ? {
                  ...ob,
                  documents: [...ob.documents, doc],
                  selectedDocumentIds: [...ob.selectedDocumentIds, doc.id],
                  updatedAt: new Date().toISOString(),
                }
              : ob,
          ),
        })),

      removeDocument: (openBookId, docId) =>
        set((state) => ({
          openBooks: state.openBooks.map((ob) =>
            ob.id === openBookId
              ? {
                  ...ob,
                  documents: ob.documents.filter((d) => d.id !== docId),
                  selectedDocumentIds: ob.selectedDocumentIds.filter(
                    (id) => id !== docId,
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : ob,
          ),
        })),

      toggleDocumentSelection: (openBookId, docId) =>
        set((state) => ({
          openBooks: state.openBooks.map((ob) =>
            ob.id === openBookId
              ? {
                  ...ob,
                  selectedDocumentIds: ob.selectedDocumentIds.includes(docId)
                    ? ob.selectedDocumentIds.filter((id) => id !== docId)
                    : [...ob.selectedDocumentIds, docId],
                }
              : ob,
          ),
        })),

      selectAllDocuments: (openBookId) =>
        set((state) => ({
          openBooks: state.openBooks.map((ob) =>
            ob.id === openBookId
              ? { ...ob, selectedDocumentIds: ob.documents.map((d) => d.id) }
              : ob,
          ),
        })),

      addMessage: (openBookId, message) =>
        set((state) => ({
          openBooks: state.openBooks.map((ob) =>
            ob.id === openBookId
              ? {
                  ...ob,
                  conversations: [...ob.conversations, message],
                  updatedAt: new Date().toISOString(),
                }
              : ob,
          ),
        })),

      clearConversation: (openBookId) =>
        set((state) => ({
          openBooks: state.openBooks.map((ob) =>
            ob.id === openBookId
              ? {
                  ...ob,
                  conversations: [],
                  updatedAt: new Date().toISOString(),
                }
              : ob,
          ),
        })),

      addFlashcard: (openBookId, flashcard) =>
        set((state) => ({
          openBooks: state.openBooks.map((ob) =>
            ob.id === openBookId
              ? {
                  ...ob,
                  flashcards: [...ob.flashcards, flashcard],
                  updatedAt: new Date().toISOString(),
                }
              : ob,
          ),
        })),

      removeFlashcard: (openBookId, flashcardId) =>
        set((state) => ({
          openBooks: state.openBooks.map((ob) =>
            ob.id === openBookId
              ? {
                  ...ob,
                  flashcards: ob.flashcards.filter((f) => f.id !== flashcardId),
                  updatedAt: new Date().toISOString(),
                }
              : ob,
          ),
        })),

      addSummary: (openBookId, summary) =>
        set((state) => ({
          openBooks: state.openBooks.map((ob) =>
            ob.id === openBookId
              ? {
                  ...ob,
                  summaries: [...ob.summaries, summary],
                  updatedAt: new Date().toISOString(),
                }
              : ob,
          ),
        })),

      removeSummary: (openBookId, summaryId) =>
        set((state) => ({
          openBooks: state.openBooks.map((ob) =>
            ob.id === openBookId
              ? {
                  ...ob,
                  summaries: ob.summaries.filter((s) => s.id !== summaryId),
                  updatedAt: new Date().toISOString(),
                }
              : ob,
          ),
        })),
    }),
    { name: "openbook-store" },
  ),
);
