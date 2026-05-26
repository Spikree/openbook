import { useState } from "react";
import type { OpenBook } from "@/store/openBookStore";
import { Button } from "@/components/ui/button";
import { Sparkles, CircleDot, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MCQQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  selectedIndex: number | null;
}

export function MCQPanel({ openBook }: { openBook: OpenBook }) {
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);

  const selectedDocs = openBook.documents.filter((d) =>
    openBook.selectedDocumentIds.includes(d.id),
  );

  const handleGenerate = () => {
    if (selectedDocs.length === 0 || isLoading) return;
    setIsLoading(true);

    setTimeout(() => {
      setQuestions([
        {
          id: crypto.randomUUID(),
          question: "Which of the following best describes the main topic?",
          options: [
            "Option A (mocked)",
            "Option B (mocked)",
            "Option C (mocked)",
            "Option D (mocked)",
          ],
          correctIndex: 0,
          selectedIndex: null,
        },
        {
          id: crypto.randomUUID(),
          question: "What is the significance of the key finding?",
          options: [
            "It proves X",
            "It disproves Y",
            "It suggests Z",
            "None of the above",
          ],
          correctIndex: 2,
          selectedIndex: null,
        },
        {
          id: crypto.randomUUID(),
          question: "According to the document, which statement is true?",
          options: ["Statement A", "Statement B", "Statement C", "Statement D"],
          correctIndex: 1,
          selectedIndex: null,
        },
      ]);
      setIsLoading(false);
    }, 1000);
  };

  const handleSelect = (questionId: string, index: number) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId && q.selectedIndex === null
          ? { ...q, selectedIndex: index }
          : q,
      ),
    );
  };

  const score = questions.filter(
    (q) => q.selectedIndex === q.correctIndex,
  ).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {questions.length > 0
            ? `${score}/${questions.length} correct`
            : `${questions.length} questions`}
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
          <CircleDot className="w-8 h-8 mx-auto mb-2 opacity-20" />
          <p className="text-xs">
            {selectedDocs.length === 0
              ? "Select documents in the left panel first"
              : "Generate MCQ questions from your documents"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, i) => (
            <div
              key={q.id}
              className="rounded-lg border border-border bg-card p-4 space-y-3"
            >
              <p className="text-xs text-muted-foreground">Q{i + 1}</p>
              <p className="text-sm text-foreground font-medium">
                {q.question}
              </p>
              <div className="space-y-2">
                {q.options.map((option, idx) => {
                  const isSelected = q.selectedIndex === idx;
                  const isCorrect = q.correctIndex === idx;
                  const isAnswered = q.selectedIndex !== null;

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
          ))}
        </div>
      )}
    </div>
  );
}
