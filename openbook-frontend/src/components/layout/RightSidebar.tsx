import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useOpenBookStore } from "@/store/openBookStore";
import { Brain, GraduationCap, CircleDot } from "lucide-react";
import { FlashcardsPanel } from "@/components/flashcards/FlashcardsPanel";
import { ExamPanel } from "@/components/flashcards/ExamPanel";
import { MCQPanel } from "@/components/flashcards/MCQPanel";

export function RightSidebar() {
  const { openBooks, activeOpenBookId } = useOpenBookStore();
  const activeOpenBook = Object.values(openBooks).find((ob) => ob.id === activeOpenBookId);

  if (!activeOpenBook) {
    return (
      <div className="h-full w-full border-l border-border flex items-center justify-center p-4">
        <p className="text-xs text-muted-foreground text-center">
          Select an OpenBook to use AI features
        </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full border-l border-border flex flex-col overflow-hidden">
      <Tabs defaultValue="flashcards" className="flex flex-col h-full">
        <div className="shrink-0 border-b border-border px-2">
          <TabsList className="bg-transparent h-12 gap-1 w-full">
            <TabsTrigger
              value="flashcards"
              className="flex-1 gap-1.5 text-xs data-[state=active]:bg-muted"
            >
              <Brain className="w-3.5 h-3.5" />
              Flashcards
            </TabsTrigger>
            <TabsTrigger
              value="exam"
              className="flex-1 gap-1.5 text-xs data-[state=active]:bg-muted"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Exam
            </TabsTrigger>
            <TabsTrigger
              value="mcq"
              className="flex-1 gap-1.5 text-xs data-[state=active]:bg-muted"
            >
              <CircleDot className="w-3.5 h-3.5" />
              MCQ
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="flashcards"
          className="flex-1 overflow-y-auto mt-0 p-4"
        >
          <FlashcardsPanel openBook={activeOpenBook} />
        </TabsContent>
        <TabsContent value="exam" className="flex-1 overflow-y-auto mt-0 p-4">
          <ExamPanel openBook={activeOpenBook} />
        </TabsContent>
        <TabsContent value="mcq" className="flex-1 overflow-y-auto mt-0 p-4">
          <MCQPanel openBook={activeOpenBook} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
