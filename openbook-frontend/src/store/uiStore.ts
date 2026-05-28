import { create } from "zustand";

interface UIStore {
  pendingChatMessage: string | null;
  setPendingChatMessage: (msg: string | null) => void;
  activeReaderTab: string;
  setActiveReaderTab: (tab: string) => void;
}

export const useUIStore = create<UIStore>()((set) => ({
  pendingChatMessage: null,
  setPendingChatMessage: (msg) => set({ pendingChatMessage: msg }),
  activeReaderTab: "chat",
  setActiveReaderTab: (tab) => set({ activeReaderTab: tab }),
}));
