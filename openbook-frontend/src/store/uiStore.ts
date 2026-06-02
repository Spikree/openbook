import { create } from "zustand";

type ActiveDialog =
  | { type: "flashcards" }
  | { type: "exam"; sessionId: string }
  | { type: "mcq"; sessionId: string }
  | { type: "note"; noteId: string | null }
  | null;

interface UIStore {
  pendingChatMessage: string | null;
  setPendingChatMessage: (msg: string | null) => void;

  activeReaderTab: string;
  setActiveReaderTab: (tab: string) => void;

  activeDialog: ActiveDialog;
  setActiveDialog: (dialog: ActiveDialog) => void;
}

export const useUIStore = create<UIStore>()((set) => ({
  pendingChatMessage: null,
  setPendingChatMessage: (msg) => set({ pendingChatMessage: msg }),

  activeReaderTab: "chat",
  setActiveReaderTab: (tab) => set({ activeReaderTab: tab }),

  activeDialog: null,
  setActiveDialog: (dialog) => set({ activeDialog: dialog }),
}));
