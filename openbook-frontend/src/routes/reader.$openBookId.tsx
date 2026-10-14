import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, FileText, BookOpen } from "lucide-react";
import { ChatPanel } from "@/components/reader/ChatPanel";
import { SummaryPanel } from "@/components/reader/SummaryPanel";
import { PDFPanel } from "@/components/reader/PDFPanel";
import { useOpenBookStore } from "@/store/openBookStore";
import { useUIStore } from "@/store/uiStore";

export const Route = createFileRoute("/reader/$openBookId")({
  component: Reader,
});

function Reader() {
  const { openBookId } = Route.useParams();
  const book = useOpenBookStore((s) => s.openBooks[openBookId]);
  const activeReaderTab = useUIStore((s) => s.activeReaderTab);
  const setActiveReaderTab = useUIStore((s) => s.setActiveReaderTab);

  if (!book) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">
            OpenBook not found — it may still be loading, or was deleted
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <Tabs
        value={activeReaderTab}
        onValueChange={(v) =>
          setActiveReaderTab(v as "chat" | "summary" | "pdf")
        }
        className="flex flex-col h-full"
      >
        <div className="shrink-0  border-border px-4">
          <TabsList className="bg-transparent h-12 gap-1">
            <TabsTrigger
              value="chat"
              className="gap-2 data-[state=active]:bg-muted"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Chat
            </TabsTrigger>
            <TabsTrigger
              value="summary"
              className="gap-2 data-[state=active]:bg-muted"
            >
              <FileText className="w-3.5 h-3.5" />
              Summary
            </TabsTrigger>
            <TabsTrigger
              value="pdf"
              className="gap-2 data-[state=active]:bg-muted"
            >
              <BookOpen className="w-3.5 h-3.5" />
              PDF
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="chat"
          forceMount
          className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden"
        >
          <ChatPanel openBookId={openBookId} />
        </TabsContent>
        <TabsContent
          value="summary"
          forceMount
          className="flex-1 overflow-y-auto mt-0 p-4 data-[state=inactive]:hidden"
        >
          <SummaryPanel openBookId={openBookId} />
        </TabsContent>
        <TabsContent
          value="pdf"
          forceMount
          className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden"
        >
          <PDFPanel openBookId={openBookId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
