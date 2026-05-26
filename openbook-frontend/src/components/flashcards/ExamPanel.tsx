import { useState } from "react";
import type { OpenBook } from "@/store/openBookStore";
import { Button } from "@/components/ui/button";
import { Sparkles, GraduationCap } from "lucide-react";
import { api } from "@/api/client";

interface ExamQuestion {
  id: string;
  question: string;
  answer: string;
  revealed: boolean;
}

export function ExamPanel({ openBook }: { openBook: OpenBook }) {
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);

  const selectedDocs = openBook.documents.filter((d) =>
    openBook.selectedDocumentIds.includes(d.id),
  );

  const handleGenerate = async () => {
    if (selectedDocs.length === 0 || isLoading) return;
    setIsLoading(true);
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
          revealed: false,
        })),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleReveal = (id: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, revealed: !q.revealed } : q)),
    );
  };

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

      {questions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-20" />
          <p className="text-xs">
            {selectedDocs.length === 0
              ? "Select documents in the left panel first"
              : "Generate exam questions from your documents"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q, i) => (
            <div
              key={q.id}
              className="rounded-lg border border-border bg-card p-4 space-y-2"
            >
              <p className="text-xs text-muted-foreground">Q{i + 1}</p>
              <p className="text-sm text-foreground font-medium">
                {q.question}
              </p>
              {q.revealed && (
                <p className="text-sm text-muted-foreground leading-relaxed border-t border-border pt-2 mt-2">
                  {q.answer}
                </p>
              )}
              <button
                onClick={() => toggleReveal(q.id)}
                className="text-xs text-primary hover:underline"
              >
                {q.revealed ? "Hide answer" : "Show answer"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
