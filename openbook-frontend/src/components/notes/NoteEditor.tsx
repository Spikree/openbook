import { useState, useEffect } from "react";
import { useOpenBookStore } from "@/store/openBookStore";
import { useUIStore } from "@/store/uiStore";
import { Button } from "@/components/ui/button";
import { X, Download, Trash2 } from "lucide-react";
import { api } from "@/api/client";
import { CheckCircle2, Loader2 } from "lucide-react";

export function NoteEditor({ openBookId }: { openBookId: string }) {
  const { activeDialog, setActiveDialog } = useUIStore();
  const { openBooks, createNote, updateNote, deleteNote } = useOpenBookStore();

  const noteId = activeDialog?.type === "note" ? activeDialog.noteId : null;
  const activeOpenBook = openBooks[openBookId];
  const existingNote = noteId
    ? activeOpenBook?.notes?.find((n) => n.id === noteId)
    : null;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);
  const [prevNoteId, setPrevNoteId] = useState(noteId);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle",
  );

  if (noteId !== prevNoteId) {
    setPrevNoteId(noteId);
    setTitle(existingNote?.title ?? "");
    setContent(existingNote?.content ?? "");
    setCurrentNoteId(noteId);
  }

  useEffect(() => {
    if (!currentNoteId) return;

    const t = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        await updateNote(openBookId, currentNoteId, { title, content });
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 1500);
      } catch {
        setSaveStatus("idle");
      }
    }, 800);
    return () => clearTimeout(t);
  }, [title, content, currentNoteId]);

  const handleCreate = async () => {
    if (!title.trim()) return;
    try {
      const note = await createNote(openBookId, title.trim());
      setCurrentNoteId(note.id);
    } catch {
      // commenting this out because error messages are handled in main openbookstore
      // toast.error("Failed to create note");
    }
  };

  const handleDelete = async () => {
    if (!currentNoteId) return;
    try {
      await deleteNote(openBookId, currentNoteId);
      setActiveDialog(null);
    } catch {
      // commenting this out because error messages are handled in main openbookstore
      // toast.error("Failed to delete note");
    }
  };

  const handleDownload = () => {
    if (!currentNoteId) return;
    window.open(api.downloadNoteUrl(currentNoteId), "_blank");
  };

  if (activeDialog?.type !== "note") return null;

  return (
    <div className="absolute inset-0 bg-background border-l border-border flex flex-col z-10">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex-1 flex items-center gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleCreate}
            placeholder="Untitled note"
            className="flex-1 bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-1">
          {currentNoteId && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7"
                onClick={handleDownload}
              >
                <Download className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7 hover:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7"
            onClick={() => setActiveDialog(null)}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start writing..."
        disabled={!currentNoteId}
        className="flex-1 resize-none p-4 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
      />

      {!currentNoteId && (
        <p className="text-xs text-muted-foreground px-4 pb-3">
          Enter a title and click outside to create the note
        </p>
      )}

      {saveStatus !== "idle" && (
        <div className="px-4 py-2 flex justify-end border-t border-border">
          {saveStatus === "saving" && (
            <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin shrink-0" />
          )}
          {saveStatus === "saved" && (
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
          )}
        </div>
      )}
    </div>
  );
}
