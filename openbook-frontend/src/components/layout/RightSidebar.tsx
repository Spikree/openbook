import { useState } from "react";
import { useOpenBookStore } from "@/store/openBookStore";
import type { ExamSession, MCQSession, Flashcard } from "@/store/openBookStore";
import { Separator } from "@/components/ui/separator";
import {
  Brain,
  GraduationCap,
  CircleDot,
  Clock,
  Trash2,
  Sparkles,
} from "lucide-react";
import { api } from "@/api/client";
import { FlashcardsDialog } from "../flashcards/FlashcardsDialog";
import { ExamDialog } from "@/components/flashcards/ExamDialog";
import { MCQDialog } from "@/components/flashcards/MCQDialog";

type ActiveDialog = ExamSession | MCQSession | Flashcard;

export function RightSidebar() {
  const {
    openBooks,
    activeOpenBookId,
    addFlashcard,
    addExamSession,
    addMCQSession,
    removeExamSession,
    removeMCQSession,
    removeFlashcard,
  } = useOpenBookStore();

  const activeOpenBook = openBooks[activeOpenBookId ?? ""];
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [activeDialog, setActiveDialog] = useState<{
    type: "flashcards" | "exam" | "mcq";
    data: ActiveDialog;
  } | null>(null);

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

  const handleGenerate = async (type: "flashcards" | "exam" | "mcq") => {
    if (selectedDocs.length === 0 || isGenerating) return;
    setIsGenerating(type);

    try {
      if (type === "flashcards") {
        const data = await api.generateFlashcards(
          activeOpenBook.id,
          activeOpenBook.selectedDocumentIds,
        );
        const cards = data.flashcards.map(
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
        cards.forEach((card: any) => addFlashcard(activeOpenBook.id, card));
        setActiveDialog({ type: "flashcards", data: cards });
      } else if (type === "exam") {
        const data = await api.generateExam(
          activeOpenBook.id,
          activeOpenBook.selectedDocumentIds,
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
        addExamSession(activeOpenBook.id, session);
        setActiveDialog({ type: "exam", data: session });
      } else if (type === "mcq") {
        const data = await api.generateMCQ(
          activeOpenBook.id,
          activeOpenBook.selectedDocumentIds,
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
        addMCQSession(activeOpenBook.id, session);
        setActiveDialog({ type: "mcq", data: session });
      }
    } catch (err) {
      console.error(err);
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
  };

  const allHistory = [
    ...(activeOpenBook.flashcards.length > 0
      ? [
          {
            type: "flashcards" as const,
            id: "flashcards",
            label: `Flashcards (${activeOpenBook.flashcards.length} cards)`,
            createdAt: activeOpenBook.flashcards[0]?.createdAt,
            data: activeOpenBook.flashcards,
          },
        ]
      : []),
    ...(activeOpenBook.examSessions ?? []).map((s) => ({
      type: "exam" as const,
      id: s.id,
      label: `Exam (${s.questions.length} questions)`,
      createdAt: s.createdAt,
      data: s,
    })),
    ...(activeOpenBook.mcqSessions ?? []).map((s) => ({
      type: "mcq" as const,
      id: s.id,
      label: `MCQ (${s.questions.length} questions)`,
      createdAt: s.createdAt,
      data: s,
    })),
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="h-full w-full border-l border-border flex flex-col overflow-hidden">
      {/* Upper half — actions */}
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

        {selectedDocs.length === 0 && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            Select documents in the left panel first
          </p>
        )}
      </div>

      <Separator />

      {/* Lower half — history */}
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
                  key={item.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <button
                    className="flex items-center gap-3 flex-1 text-left min-w-0"
                    onClick={() =>
                      setActiveDialog({ type: item.type, data: item.data })
                    }
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
                      }
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

      {/* Dialogs */}
      {activeDialog?.type === "flashcards" && (
        <FlashcardsDialog
          open={true}
          onOpenChange={() => setActiveDialog(null)}
          flashcards={activeDialog.data}
          openBookId={activeOpenBook.id}
        />
      )}
      {activeDialog?.type === "exam" && (
        <ExamDialog
          open={true}
          onOpenChange={() => setActiveDialog(null)}
          session={activeDialog.data}
          openBookId={activeOpenBook.id}
        />
      )}
      {activeDialog?.type === "mcq" && (
        <MCQDialog
          open={true}
          onOpenChange={() => setActiveDialog(null)}
          session={activeDialog.data}
          openBookId={activeOpenBook.id}
        />
      )}
    </div>
  );
}
