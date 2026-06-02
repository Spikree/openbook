import { useState, useEffect } from "react";
import { useOpenBookStore } from "@/store/openBookStore";
import { useUIStore } from "@/store/uiStore";
import { Button } from "@/components/ui/button";
import { X, Download, Trash2 } from "lucide-react";
import { api } from "@/api/client";

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

  if (noteId !== prevNoteId) {
    setPrevNoteId(noteId);
    setTitle(existingNote?.title ?? "");
    setContent(existingNote?.content ?? "");
    setCurrentNoteId(noteId);
  }

  // autosave with debounce
  useEffect(() => {
    if (!currentNoteId) return;
    const t = setTimeout(() => {
      updateNote(openBookId, currentNoteId, { title, content });
    }, 800);
    return () => clearTimeout(t);
  }, [title, content, currentNoteId, openBookId, updateNote]);

  const handleCreate = async () => {
    if (!title.trim()) return;
    const note = await createNote(openBookId, title.trim());
    setCurrentNoteId(note.id);
  };

  const handleDelete = async () => {
    if (!currentNoteId) return;
    await deleteNote(openBookId, currentNoteId);
    setActiveDialog(null);
  };

  const handleDownload = () => {
    if (!currentNoteId) return;
    window.open(api.downloadNoteUrl(currentNoteId), "_blank");
  };

  if (activeDialog?.type !== "note") return null;

  return (
    <div className="absolute inset-0 bg-background border-l border-border flex flex-col z-10">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleCreate}
          placeholder="Untitled note"
          className="flex-1 bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
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
    </div>
  );
}
