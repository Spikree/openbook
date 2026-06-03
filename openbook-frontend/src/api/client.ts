const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
// const BASE_URL = import.meta.env.VITE_API_BASE_URL;

import { useSettingsStore } from "@/store/settingsStore";

const getOllamaConfig = () => {
  const { ollamaUrl, ollamaModel } = useSettingsStore.getState();
  return { ollama_url: ollamaUrl, ollama_model: ollamaModel };
};

export const api = {
  // OpenBooks
  createOpenBook: async (name: string) => {
    const res = await fetch(`${BASE_URL}/openbooks/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error("Failed to create OpenBook");
    return res.json();
  },

  getOpenBookFull: async (id: string) => {
    const res = await fetch(`${BASE_URL}/openbooks/${id}/full`);
    if (!res.ok) throw new Error("Failed to fetch OpenBook");
    return res.json();
  },

  getOpenBooks: async () => {
    const res = await fetch(`${BASE_URL}/openbooks/`);
    if (!res.ok) throw new Error("Failed to fetch OpenBooks");
    return res.json();
  },

  deleteOpenBook: async (id: string) => {
    const res = await fetch(`${BASE_URL}/openbooks/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete OpenBook");
    return res.json();
  },

  renameOpenBook: async (id: string, name: string) => {
    const res = await fetch(`${BASE_URL}/openbooks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error("Failed to rename OpenBook");
    return res.json();
  },

  // Documents
  uploadDocument: async (openBookId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${BASE_URL}/documents/${openBookId}/upload`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Failed to upload document");
    return res.json();
  },

  getDocuments: async (openBookId: string) => {
    const res = await fetch(`${BASE_URL}/documents/${openBookId}`);
    if (!res.ok) throw new Error("Failed to fetch documents");
    return res.json();
  },

  deleteDocument: async (documentId: string) => {
    const res = await fetch(`${BASE_URL}/documents/${documentId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete document");
    return res.json();
  },

  getDocumentFileUrl: (documentId: string) =>
    `${BASE_URL}/documents/file/${documentId}`,

  // AI
  summarise: async (openBookId: string, selectedDocumentIds: string[]) => {
    const res = await fetch(`${BASE_URL}/ai/summarise`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        openbook_id: openBookId,
        selected_document_ids: selectedDocumentIds,
        ...getOllamaConfig(),
      }),
    });
    if (!res.ok) throw new Error("Failed to generate summary");
    return res.json();
  },

  generateFlashcards: async (
    openBookId: string,
    selectedDocumentIds: string[],
  ) => {
    const res = await fetch(`${BASE_URL}/ai/flashcards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        openbook_id: openBookId,
        selected_document_ids: selectedDocumentIds,
        ...getOllamaConfig(),
      }),
    });
    if (!res.ok) throw new Error("Failed to generate flashcards");
    return res.json();
  },

  generateExam: async (openBookId: string, selectedDocumentIds: string[]) => {
    const res = await fetch(`${BASE_URL}/ai/exam`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        openbook_id: openBookId,
        selected_document_ids: selectedDocumentIds,
        ...getOllamaConfig(),
      }),
    });
    if (!res.ok) throw new Error("Failed to generate exam");
    return res.json();
  },

  generateMCQ: async (openBookId: string, selectedDocumentIds: string[]) => {
    const res = await fetch(`${BASE_URL}/ai/mcq`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        openbook_id: openBookId,
        selected_document_ids: selectedDocumentIds,
        ...getOllamaConfig(),
      }),
    });
    if (!res.ok) throw new Error("Failed to generate MCQ");
    return res.json();
  },

  chat: async (
    openBookId: string,
    message: string,
    selectedDocumentIds: string[],
    conversationHistory: { role: string; content: string }[],
    onChunk: (chunk: string) => void,
    onDone: (full: string) => void,
    images?: string[],
  ) => {
    const res = await fetch(`${BASE_URL}/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        openbook_id: openBookId,
        message,
        selected_document_ids: selectedDocumentIds,
        conversation_history: conversationHistory,
        images,
        ...getOllamaConfig(),
      }),
    });

    if (!res.ok) throw new Error("Failed to chat");

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value);
      const lines = text.split("\n").filter((l) => l.startsWith("data: "));
      for (const line of lines) {
        const data = JSON.parse(line.replace("data: ", ""));
        if (data.done) {
          onDone(data.full);
        } else {
          onChunk(data.chunk);
        }
      }
    }
  },

  markExam: async (
    openBookId: string,
    questionsAndAnswers: {
      question: string;
      model_answer: string;
      user_answer: string;
    }[],
  ) => {
    const res = await fetch(`${BASE_URL}/ai/mark-exam`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        openbook_id: openBookId,
        questions_and_answers: questionsAndAnswers,
        ...getOllamaConfig(),
      }),
    });
    if (!res.ok) throw new Error("Failed to mark exam");
    return res.json();
  },

  // Notes
  createNote: async (openBookId: string, title: string) => {
    const res = await fetch(`${BASE_URL}/notes/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ openbook_id: openBookId, title }),
    });
    if (!res.ok) throw new Error("Failed to create note");
    return res.json();
  },

  getNotes: async (openBookId: string) => {
    const res = await fetch(`${BASE_URL}/notes/${openBookId}`);
    if (!res.ok) throw new Error("Failed to fetch notes");
    return res.json();
  },

  updateNote: async (
    noteId: string,
    data: { title?: string; content?: string },
  ) => {
    const res = await fetch(`${BASE_URL}/notes/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update note");
    return res.json();
  },

  deleteNote: async (noteId: string) => {
    const res = await fetch(`${BASE_URL}/notes/${noteId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete note");
    return res.json();
  },

  downloadNoteUrl: (noteId: string) => `${BASE_URL}/notes/${noteId}/download`,

  getModels: async () => {
    const res = await fetch(`${BASE_URL}/ai/models`);
    if (!res.ok) throw new Error("Failed to fetch models");
    return res.json();
  },
};
