import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RotateCcw, Trash2 } from "lucide-react";
import type { Flashcard } from "@/store/openBookStore";
import { useOpenBookStore } from "@/store/openBookStore";
import { cn } from "@/lib/utils";

interface FlashcardsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flashcards: Flashcard[];
  openBookId: string;
}

export function FlashcardsDialog({
  open,
  onOpenChange,
  flashcards,
  openBookId,
}: FlashcardsDialogProps) {
  const { removeFlashcard } = useOpenBookStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [view, setView] = useState<"review" | "list">("review");

  if (flashcards.length === 0) return null;

  const card = flashcards[Math.min(currentIndex, flashcards.length - 1)];

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(
      () => setCurrentIndex((i) => Math.min(i + 1, flashcards.length - 1)),
      150,
    );
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex((i) => Math.max(i - 1, 0)), 150);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between mr-8">
            <DialogTitle>Flashcards ({flashcards.length})</DialogTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={view === "review" ? "default" : "outline"}
                onClick={() => setView("review")}
              >
                Review
              </Button>
              <Button
                size="sm"
                variant={view === "list" ? "default" : "outline"}
                onClick={() => setView("list")}
              >
                List
              </Button>
            </div>
          </div>
        </DialogHeader>

        {view === "review" ? (
          <div className="space-y-4">
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

            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrev}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground">
                  {currentIndex + 1} / {flashcards.length}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="gap-2 text-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Flip
                </Button>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNext}
                disabled={currentIndex === flashcards.length - 1}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {flashcards.map((card, i) => (
              <div
                key={card.id}
                className="rounded-lg border border-border bg-card p-3 flex items-start justify-between gap-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">Q{i + 1}</p>
                  <p className="text-xs text-foreground">{card.front}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeFlashcard(openBookId, card.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
