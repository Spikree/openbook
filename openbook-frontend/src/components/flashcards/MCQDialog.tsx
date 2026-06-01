import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useOpenBookStore } from "@/store/openBookStore";
import { useUIStore } from "@/store/uiStore";
import { CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export function MCQDialog({ openBookId }: { openBookId: string }) {
  const { activeDialog, setActiveDialog } = useUIStore();
  const { openBooks } = useOpenBookStore();
  const activeOpenBook = openBooks[openBookId];

  const sessionId =
    activeDialog?.type === "mcq" ? activeDialog.sessionId : null;
  const session = sessionId
    ? activeOpenBook?.mcqSessions.find((s) => s.id === sessionId)
    : null;

  const [questions, setQuestions] = useState(session?.questions ?? []);
  const [prevSessionId, setPrevSessionId] = useState(sessionId);

  if (sessionId !== prevSessionId) {
    setPrevSessionId(sessionId);
    setQuestions(session?.questions ?? []);
  }

  const open = activeDialog?.type === "mcq";

  const handleSelect = (questionId: string, index: number) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId && q.selectedIndex === null
          ? { ...q, selectedIndex: index }
          : q,
      ),
    );
  };

  const handleReset = () => {
    if (session) {
      setQuestions(
        session.questions.map((q) => ({ ...q, selectedIndex: null })),
      );
    }
  };

  const score = questions.filter(
    (q) => q.selectedIndex === q.correctIndex,
  ).length;
  const answered = questions.filter((q) => q.selectedIndex !== null).length;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && setActiveDialog(null)}>
      {session && (
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between mr-8">
              <DialogTitle>Multiple Choice</DialogTitle>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {answered === questions.length
                    ? `${score}/${questions.length} correct`
                    : `${answered}/${questions.length} answered`}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {questions.map((q, i) => {
              const isAnswered = q.selectedIndex !== null;
              return (
                <div
                  key={q.id}
                  className="rounded-lg border border-border bg-card p-4 space-y-3"
                >
                  <p className="text-xs text-muted-foreground">Q{i + 1}</p>
                  <p className="text-sm font-medium text-foreground">
                    {q.question}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((option, idx) => {
                      const isSelected = q.selectedIndex === idx;
                      const isCorrect = q.correctIndex === idx;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleSelect(q.id, idx)}
                          disabled={isAnswered}
                          className={cn(
                            "w-full text-left text-xs px-3 py-2 rounded-md border transition-colors flex items-center gap-2",
                            !isAnswered && "border-border hover:bg-muted/50",
                            isAnswered &&
                              isCorrect &&
                              "border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400",
                            isAnswered &&
                              isSelected &&
                              !isCorrect &&
                              "border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400",
                            isAnswered &&
                              !isSelected &&
                              !isCorrect &&
                              "border-border opacity-50",
                          )}
                        >
                          {isAnswered && isCorrect && (
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          )}
                          {isAnswered && isSelected && !isCorrect && (
                            <XCircle className="w-3.5 h-3.5 shrink-0" />
                          )}
                          {(!isAnswered || (!isCorrect && !isSelected)) && (
                            <span className="w-3.5 h-3.5 shrink-0" />
                          )}
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
