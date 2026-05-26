import { useState } from "react";
import type { OpenBook } from "@/store/openBookStore";
import { useOpenBookStore } from "@/store/openBookStore";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Trash2,
  Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function FlashcardsPanel({ openBook }: { openBook: OpenBook }) {
  const { addFlashcard, removeFlashcard } = useOpenBookStore();
  const [isLoading, setIsLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [view, setView] = useState<"list" | "review">("list");

  const selectedDocs = openBook.documents.filter((d) =>
    openBook.selectedDocumentIds.includes(d.id),
  );

  const handleGenerate = () => {
    if (selectedDocs.length === 0 || isLoading) return;
    setIsLoading(true);

    setTimeout(() => {
      const mockCards = [
        {
          front: "What is the main topic of the document?",
          back: "This is a mocked answer. Connect Ollama to get real flashcards.",
        },
        {
          front: "Define the key concept discussed.",
          back: "Mocked definition. Real answers will come from your documents.",
        },
        {
          front: "What are the three main points?",
          back: "1. Point one\n2. Point two\n3. Point three (mocked)",
        },
      ];

      mockCards.forEach((card) => {
        addFlashcard(openBook.id, {
          id: crypto.randomUUID(),
          front: card.front,
          back: card.back,
          interval: 1,
          easeFactor: 2.5,
          dueDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        });
      });

      setIsLoading(false);
    }, 1000);
  };

  const handleReview = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setView("review");
  };

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(
      () =>
        setCurrentIndex((i) => Math.min(i + 1, openBook.flashcards.length - 1)),
      150,
    );
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex((i) => Math.max(i - 1, 0)), 150);
  };

  if (view === "review" && openBook.flashcards.length > 0) {
    const card = openBook.flashcards[currentIndex];
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView("list")}
            className="gap-1 text-xs"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Back
          </Button>
          <p className="text-xs text-muted-foreground">
            {currentIndex + 1} / {openBook.flashcards.length}
          </p>
        </div>

        {/* Card */}
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className={cn(
            "min-h-48 rounded-xl border border-border bg-card p-6 cursor-pointer flex flex-col items-center justify-center text-center transition-all duration-200 hover:shadow-md",
            isFlipped && "bg-primary/5 border-primary/30",
          )}
        >
          <p className="text-xs text-muted-foreground mb-3">
            {isFlipped ? "Answer" : "Question — click to reveal"}
          </p>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
            {isFlipped ? card.back : card.front}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrev}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFlipped(!isFlipped)}
            className="gap-2 text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Flip
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNext}
            disabled={currentIndex === openBook.flashcards.length - 1}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {openBook.flashcards.length} card
          {openBook.flashcards.length !== 1 ? "s" : ""}
        </p>
        <div className="flex gap-2">
          {openBook.flashcards.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleReview}
              className="gap-2"
            >
              <Brain className="w-3.5 h-3.5" />
              Review
            </Button>
          )}
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
      </div>

      {openBook.flashcards.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Brain className="w-8 h-8 mx-auto mb-2 opacity-20" />
          <p className="text-xs">
            {selectedDocs.length === 0
              ? "Select documents in the left panel first"
              : "Generate flashcards from your documents"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {openBook.flashcards.map((card, i) => (
            <div
              key={card.id}
              className="rounded-lg border border-border bg-card p-3 flex items-start justify-between gap-2"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Q{i + 1}</p>
                <p className="text-xs text-foreground truncate">{card.front}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeFlashcard(openBook.id, card.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
