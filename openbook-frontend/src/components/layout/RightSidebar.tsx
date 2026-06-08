import { useEffect, useState } from "react";
import { useOpenBookStore } from "@/store/openBookStore";
import { useUIStore } from "@/store/uiStore";
import { Separator } from "@/components/ui/separator";
import {
  Brain,
  GraduationCap,
  CircleDot,
  Clock,
  Trash2,
  Sparkles,
  StickyNote,
} from "lucide-react";
import { FlashcardsDialog } from "@/components/flashcards/FlashcardsDialog";
import { ExamDialog } from "@/components/flashcards/ExamDialog";
import { MCQDialog } from "@/components/flashcards/MCQDialog";
import { NoteEditor } from "@/components/notes/NoteEditor";

type GenerateType = "flashcards" | "exam" | "mcq";

export function RightSidebar() {
  const {
    openBooks,
    activeOpenBookId,
    removeExamSession,
    removeMCQSession,
    removeFlashcard,
    deleteNote,
    loadNotes,
    generateFlashcards,
    generateExam,
    generateMCQ,
  } = useOpenBookStore();
  const { setActiveDialog } = useUIStore();

  const activeOpenBook = openBooks[activeOpenBookId ?? ""];
  const [isGenerating, setIsGenerating] = useState<GenerateType | null>(null);

  useEffect(() => {
    if (activeOpenBookId) loadNotes(activeOpenBookId);
  }, [activeOpenBookId]);

  if (!activeOpenBook) {
    return (
      <div className="h-full w-full border-l border-border flex items-center justify-center p-4">
        <p className="text-xs text-muted-foreground text-center">
          Select an OpenBook to use AI features
        </p>
      </div>
    );
  }

  const selectedDocs = activeOpenBook.documents.filter((d) =>
    activeOpenBook.selectedDocumentIds.includes(d.id),
  );

  const handleGenerate = async (type: GenerateType) => {
    if (selectedDocs.length === 0 || isGenerating) return;
    setIsGenerating(type);
    try {
      if (type === "flashcards") {
        await generateFlashcards(activeOpenBook.id);
        setActiveDialog({ type: "flashcards" });
      } else if (type === "exam") {
        await generateExam(activeOpenBook.id);
        const sessions =
          useOpenBookStore.getState().openBooks[activeOpenBook.id].examSessions;
        setActiveDialog({
          type: "exam",
          sessionId: sessions[sessions.length - 1].id,
        });
      } else if (type === "mcq") {
        await generateMCQ(activeOpenBook.id);
        const sessions =
          useOpenBookStore.getState().openBooks[activeOpenBook.id].mcqSessions;
        setActiveDialog({
          type: "mcq",
          sessionId: sessions[sessions.length - 1].id,
        });
      }
    } catch {
      // commenting this out because error messages are handled in main openbookstore
      // toast.error(`Failed to generate ${type}`, {
      //   description: err instanceof Error ? err.message : "Try again",
      // });
    } finally {
      setIsGenerating(null);
    }
  };

  const actions = [
    { type: "flashcards" as const, label: "Generate Flashcards", icon: Brain },
    { type: "exam" as const, label: "Generate Exam", icon: GraduationCap },
    { type: "mcq" as const, label: "Generate MCQ", icon: CircleDot },
  ];

  const typeIcon = {
    flashcards: Brain,
    exam: GraduationCap,
    mcq: CircleDot,
    note: StickyNote,
  };

  const allHistory = [
    ...(activeOpenBook.flashcards.length > 0
      ? [
          {
            type: "flashcards" as const,
            id: "flashcards",
            label: `Flashcards (${activeOpenBook.flashcards.length} cards)`,
            createdAt: activeOpenBook.flashcards[0]?.createdAt,
          },
        ]
      : []),
    ...(activeOpenBook.examSessions ?? []).map((s) => ({
      type: "exam" as const,
      id: s.id,
      label: `Exam (${s.questions.length} questions)`,
      createdAt: s.createdAt,
    })),
    ...(activeOpenBook.mcqSessions ?? []).map((s) => ({
      type: "mcq" as const,
      id: s.id,
      label: `MCQ (${s.questions.length} questions)`,
      createdAt: s.createdAt,
    })),
    ...(activeOpenBook.notes ?? []).map((n) => ({
      type: "note" as const,
      id: n.id,
      label: n.title || "Untitled note",
      createdAt: n.updated_at,
    })),
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="h-full w-full border-l border-border flex flex-col overflow-hidden relative">
      <div className="flex-1 p-3 space-y-2 overflow-y-auto">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Generate
        </p>
        {actions.map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            onClick={() => handleGenerate(type)}
            disabled={!!isGenerating || selectedDocs.length === 0}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
              {isGenerating === type ? (
                <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
              ) : (
                <Icon className="w-3.5 h-3.5 text-primary" />
              )}
            </div>
            <span className="text-sm text-foreground">
              {isGenerating === type ? "Generating..." : label}
            </span>
          </button>
        ))}

        <button
          onClick={() => setActiveDialog({ type: "note", noteId: null })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
        >
          <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
            <StickyNote className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-sm text-foreground">New Note</span>
        </button>

        {selectedDocs.length === 0 && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            Select documents in the left panel first
          </p>
        )}
      </div>

      <Separator />

      <div className="flex-1 p-3 overflow-y-auto">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          This Session
        </p>

        {allHistory.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-6 h-6 mx-auto mb-2 opacity-20" />
            <p className="text-xs">Nothing generated yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {allHistory.map((item) => {
              const Icon = typeIcon[item.type];
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <button
                    className="flex items-center gap-3 flex-1 text-left min-w-0"
                    onClick={() => {
                      if (item.type === "flashcards")
                        setActiveDialog({ type: "flashcards" });
                      else if (item.type === "exam")
                        setActiveDialog({ type: "exam", sessionId: item.id });
                      else if (item.type === "mcq")
                        setActiveDialog({ type: "mcq", sessionId: item.id });
                      else if (item.type === "note")
                        setActiveDialog({ type: "note", noteId: item.id });
                    }}
                  >
                    <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground truncate">
                        {item.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      if (item.type === "exam")
                        removeExamSession(activeOpenBook.id, item.id);
                      else if (item.type === "mcq")
                        removeMCQSession(activeOpenBook.id, item.id);
                      else if (item.type === "flashcards") {
                        activeOpenBook.flashcards.forEach((f) =>
                          removeFlashcard(activeOpenBook.id, f.id),
                        );
                      } else if (item.type === "note")
                        deleteNote(activeOpenBook.id, item.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <FlashcardsDialog />
      <ExamDialog openBookId={activeOpenBook.id} />
      <MCQDialog openBookId={activeOpenBook.id} />
      <NoteEditor openBookId={activeOpenBook.id} />
    </div>
  );
}
