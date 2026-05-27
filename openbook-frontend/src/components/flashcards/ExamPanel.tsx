import { useState } from "react";
import type { OpenBook } from "@/store/openBookStore";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  GraduationCap,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { api } from "@/api/client";

interface ExamQuestion {
  id: string;
  question: string;
  answer: string;
  userAnswer: string;
}

interface MarkingResult {
  total_score: number;
  max_score: number;
  percentage: number;
  results: {
    question: string;
    user_answer: string;
    score: number;
    max_score: number;
    feedback: string;
    what_you_got_right: string;
    what_you_missed: string;
  }[];
}

type ExamView = "questions" | "answering" | "results";

export function ExamPanel({ openBook }: { openBook: OpenBook }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isMarking, setIsMarking] = useState(false);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [markingResult, setMarkingResult] = useState<MarkingResult | null>(
    null,
  );
  const [view, setView] = useState<ExamView>("questions");

  const selectedDocs = openBook.documents.filter((d) =>
    openBook.selectedDocumentIds.includes(d.id),
  );

  const handleGenerate = async () => {
    if (selectedDocs.length === 0 || isLoading) return;
    setIsLoading(true);
    setMarkingResult(null);
    setView("questions");

    try {
      const data = await api.generateExam(
        openBook.id,
        openBook.selectedDocumentIds,
      );
      setQuestions(
        data.questions.map((q: { question: string; answer: string }) => ({
          id: crypto.randomUUID(),
          question: q.question,
          answer: q.answer,
          userAnswer: "",
        })),
      );
      setView("answering");
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    const unanswered = questions.filter((q) => !q.userAnswer.trim());
    if (unanswered.length > 0) return;
    setIsMarking(true);

    try {
      const result = await api.markExam(
        openBook.id,
        questions.map((q) => ({
          question: q.question,
          model_answer: q.answer,
          user_answer: q.userAnswer,
        })),
      );
      setMarkingResult(result);
      setView("results");
    } catch (err) {
      console.error(err);
    } finally {
      setIsMarking(false);
    }
  };

  const handleReset = () => {
    setQuestions([]);
    setMarkingResult(null);
    setView("questions");
  };

  // Results view
  if (view === "results" && markingResult) {
    const percentage = markingResult.percentage;
    const color =
      percentage >= 70
        ? "text-green-500"
        : percentage >= 50
          ? "text-yellow-500"
          : "text-red-500";

    return (
      <div className="space-y-4">
        {/* Score header */}
        <div className="rounded-xl border border-border bg-card p-6 text-center space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            Your Score
          </p>
          <p className={`text-4xl font-bold ${color}`}>
            {markingResult.total_score}/{markingResult.max_score}
          </p>
          <p className={`text-sm font-medium ${color}`}>{percentage}%</p>
        </div>

        {/* Per question results */}
        <div className="space-y-3">
          {markingResult.results.map((result, i) => {
            const passed = result.score >= result.max_score * 0.5;
            return (
              <div
                key={i}
                className="rounded-lg border border-border bg-card p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {result.question}
                  </p>
                  <div className="flex items-center gap-1 shrink-0">
                    {passed ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-xs font-medium text-muted-foreground">
                      {result.score}/{result.max_score}
                    </span>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-md p-3 space-y-1">
                  <p className="text-xs text-muted-foreground">Your answer</p>
                  <p className="text-xs text-foreground">
                    {result.user_answer}
                  </p>
                </div>

                <div className="prose prose-sm dark:prose-invert max-w-none text-xs space-y-1">
                  <p className="text-xs font-medium text-foreground">
                    {result.feedback}
                  </p>
                  {result.what_you_got_right && (
                    <p className="text-xs text-green-600 dark:text-green-400">
                      ✓ {result.what_you_got_right}
                    </p>
                  )}
                  {result.what_you_missed && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      ✗ {result.what_you_missed}
                    </p>
                  )}
                </div>
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
    );
  }

  // Answering view
  if (view === "answering" && questions.length > 0) {
    const allAnswered = questions.every((q) => q.userAnswer.trim());

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {questions.filter((q) => q.userAnswer.trim()).length}/
            {questions.length} answered
          </p>
          <Button
            size="sm"
            className="gap-2"
            onClick={handleSubmit}
            disabled={!allAnswered || isMarking}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            {isMarking ? "Marking..." : "Submit for Marking"}
          </Button>
        </div>

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
        </div>

        {!allAnswered && (
          <p className="text-xs text-muted-foreground text-center">
            Answer all questions before submitting
          </p>
        )}
      </div>
    );
  }

  // Default view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {questions.length} question{questions.length !== 1 ? "s" : ""}
        </p>
        <Button
          size="sm"
          className="gap-2"
          onClick={handleGenerate}
          disabled={isLoading || selectedDocs.length === 0}
        >
          <Sparkles className="w-3.5 h-3.5" />
          {isLoading ? "Generating..." : "Generate"}
        </Button>
      </div>

      <div className="text-center py-12 text-muted-foreground">
        <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-20" />
        <p className="text-xs">
          {selectedDocs.length === 0
            ? "Select documents in the left panel first"
            : "Generate exam questions from your documents"}
        </p>
      </div>
    </div>
  );
}
