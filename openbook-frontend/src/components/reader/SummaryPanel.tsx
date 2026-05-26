import { useState } from "react";
import type { OpenBook } from "@/store/openBookStore";
import { useOpenBookStore } from "@/store/openBookStore";
import { Button } from "@/components/ui/button";
import { FileText, Sparkles, Trash2 } from "lucide-react";
import { api } from "@/api/client";
import ReactMarkdown from "react-markdown";

export function SummaryPanel({ openBook }: { openBook: OpenBook }) {
  const { addSummary, removeSummary } = useOpenBookStore();
  const [isLoading, setIsLoading] = useState(false);

  const selectedDocs = openBook.documents.filter((d) =>
    openBook.selectedDocumentIds.includes(d.id),
  );

  const handleGenerate = async () => {
    if (selectedDocs.length === 0 || isLoading) return;
    setIsLoading(true);
    try {
      const data = await api.summarise(
        openBook.id,
        openBook.selectedDocumentIds,
      );
      addSummary(openBook.id, {
        id: crypto.randomUUID(),
        content: data.summary,
        documentId: selectedDocs[0].id,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {selectedDocs.length} document{selectedDocs.length !== 1 ? "s" : ""}{" "}
          selected
        </p>
        <Button
          size="sm"
          className="gap-2"
          onClick={handleGenerate}
          disabled={isLoading || selectedDocs.length === 0}
        >
          <Sparkles className="w-3.5 h-3.5" />
          {isLoading ? "Generating..." : "Generate Summary"}
        </Button>
      </div>

      {selectedDocs.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-20" />
          <p className="text-xs">Select documents in the left panel first</p>
        </div>
      )}

      {openBook.summaries.length === 0 && selectedDocs.length > 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-20" />
          <p className="text-xs">Click generate to summarise your documents</p>
        </div>
      )}

      <div className="space-y-4">
        {openBook.summaries.map((summary) => (
          <div
            key={summary.id}
            className="rounded-lg border border-border bg-card p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {new Date(summary.createdAt).toLocaleDateString()}
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6 text-muted-foreground hover:text-destructive"
                onClick={() => removeSummary(openBook.id, summary.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none text-foreground">
              <ReactMarkdown>{summary.content}</ReactMarkdown>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
