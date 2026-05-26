import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useOpenBookStore } from "@/store/openBookStore";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MessageSquare, FileText, BookOpen } from "lucide-react";
import { ChatPanel } from "@/components/reader/ChatPanel";
import { SummaryPanel } from "@/components/reader/SummaryPanel";
import { PDFPanel } from "@/components/reader/PDFPanel";

export const Route = createFileRoute("/reader")({
  component: Reader,
});

function Reader() {
  const { openBooks, activeOpenBookId } = useOpenBookStore();
  const activeOpenBook = openBooks.find((ob) => ob.id === activeOpenBookId);

  if (!activeOpenBook) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">No OpenBook selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="chat" className="flex flex-col h-full">
        <div className="shrink-0 border-b border-border px-4">
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

        <TabsContent value="chat" className="flex-1 overflow-hidden mt-0">
          <ChatPanel openBook={activeOpenBook} />
        </TabsContent>
        <TabsContent
          value="summary"
          className="flex-1 overflow-y-auto mt-0 p-4"
        >
          <SummaryPanel openBook={activeOpenBook} />
        </TabsContent>
        <TabsContent value="pdf" className="flex-1 overflow-hidden mt-0">
          <PDFPanel openBook={activeOpenBook} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
