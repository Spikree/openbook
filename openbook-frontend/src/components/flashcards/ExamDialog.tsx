import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ExamSession, MarkingResult } from "@/store/openBookStore";
import { GraduationCap, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { api } from "@/api/client";

interface ExamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: ExamSession;
  openBookId: string;
}

export function ExamDialog({
  open,
  onOpenChange,
  session,
  openBookId,
}: ExamDialogProps) {
  const [questions, setQuestions] = useState(session.questions);
  const [result, setResult] = useState<MarkingResult | null>(session.result);
  const [isMarking, setIsMarking] = useState(false);

  const allAnswered = questions.every((q) => q.userAnswer.trim());

  const handleSubmit = async () => {
    if (!allAnswered || isMarking) return;
    setIsMarking(true);
    try {
      const data = await api.markExam(
        openBookId,
        questions.map((q) => ({
          question: q.question,
          model_answer: q.answer,
          user_answer: q.userAnswer,
        })),
      );
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsMarking(false);
    }
  };

  const handleReset = () => {
    setQuestions(questions.map((q) => ({ ...q, userAnswer: "" })));
    setResult(null);
  };

  if (result) {
    const color =
      result.percentage >= 70
        ? "text-green-500"
        : result.percentage >= 50
          ? "text-yellow-500"
          : "text-red-500";

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Exam Results</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-6 text-center space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Your Score
              </p>
              <p className={`text-4xl font-bold ${color}`}>
                {result.total_score}/{result.max_score}
              </p>
              <p className={`text-sm font-medium ${color}`}>
                {result.percentage}%
              </p>
            </div>

            <div className="space-y-3">
              {result.results.map((r, i) => {
                const passed = r.score >= r.max_score * 0.5;
                return (
                  <div
                    key={i}
                    className="rounded-lg border border-border bg-card p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {r.question}
                      </p>
                      <div className="flex items-center gap-1 shrink-0">
                        {passed ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {r.score}/{r.max_score}
                        </span>
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded-md p-3">
                      <p className="text-xs text-muted-foreground">
                        Your answer
                      </p>
                      <p className="text-xs text-foreground">{r.user_answer}</p>
                    </div>
                    <p className="text-xs font-medium text-foreground">
                      {r.feedback}
                    </p>
                    {r.what_you_got_right && (
                      <p className="text-xs text-green-600 dark:text-green-400">
                        ✓ {r.what_you_got_right}
                      </p>
                    )}
                    {r.what_you_missed && (
                      <p className="text-xs text-red-600 dark:text-red-400">
                        ✗ {r.what_you_missed}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleReset}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Try Again
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between mr-8">
            <DialogTitle>Exam</DialogTitle>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {questions.filter((q) => q.userAnswer.trim()).length}/
                {questions.length} answered
              </span>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!allAnswered || isMarking}
                className="gap-2"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                {isMarking ? "Marking..." : "Submit"}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {questions.map((q, i) => (
            <div
              key={q.id}
              className="rounded-lg border border-border bg-card p-4 space-y-3"
            >
              <div className="flex items-start gap-2">
                <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
                  Q{i + 1}
                </span>
                <p className="text-sm font-medium text-foreground">
                  {q.question}
                </p>
              </div>
              <textarea
                value={q.userAnswer}
                onChange={(e) =>
                  setQuestions((prev) =>
                    prev.map((question) =>
                      question.id === q.id
                        ? { ...question, userAnswer: e.target.value }
                        : question,
                    ),
                  )
                }
                placeholder="Type your answer here..."
                rows={3}
                className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          ))}
          {!allAnswered && (
            <p className="text-xs text-muted-foreground text-center">
              Answer all questions before submitting
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
