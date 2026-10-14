import { useRef } from "react";
import { useOpenBookStore, useBookDocuments } from "@/store/openBookStore";
import { useActiveOpenBook } from "@/hooks/useActiveOpenBook";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { FileText, Plus, Trash2, CheckSquare, Square } from "lucide-react";

export function LeftSidebar() {
  const uploadDocument = useOpenBookStore((s) => s.uploadDocument);
  const removeDocument = useOpenBookStore((s) => s.removeDocument);
  const clearDocumentSelection = useOpenBookStore(
    (s) => s.clearDocumentSelection,
  );
  const toggleDocumentSelection = useOpenBookStore(
    (s) => s.toggleDocumentSelection,
  );
  const selectAllDocuments = useOpenBookStore((s) => s.selectAllDocuments);

  // data: book meta + resolved documents via selector hooks
  const activeOpenBook = useActiveOpenBook();
  const documents = useBookDocuments(activeOpenBook?.id);

  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (files: FileList | null) => {
    if (!files || !activeOpenBook) return;
    const pdfs = Array.from(files).filter((f) => f.type === "application/pdf");

    await Promise.all(
      pdfs.map(async (file) => {
        try {
          await uploadDocument(activeOpenBook.id, file);
        } catch {
          // store handles toast
        }
      }),
    );
  };

  if (!activeOpenBook) {
    return (
      <div className="h-full w-full border-r border-border flex items-center justify-center p-4">
        <p className="text-xs text-muted-foreground text-center">
          Select or create an OpenBook to get started
        </p>
      </div>
    );
  }

  const allSelected =
    documents.length > 0 &&
    documents.every((d) => activeOpenBook.selectedDocumentIds.includes(d.id));

  return (
    <div className="h-full w-full border-r border-border flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 shrink-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Documents
        </p>
        <Button
          size="sm"
          className="w-full gap-2"
          onClick={() => inputRef.current?.click()}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Document
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          multiple
          hidden
          onChange={(e) => processFiles(e.target.files)}
        />
      </div>

      <Separator />

      {/* Select all */}
      {documents.length > 0 && (
        <>
          <div className="px-4 py-2 shrink-0">
            <button
              onClick={() =>
                allSelected
                  ? clearDocumentSelection(activeOpenBook.id)
                  : selectAllDocuments(activeOpenBook.id)
              }
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {allSelected ? (
                <CheckSquare className="w-3.5 h-3.5 text-primary" />
              ) : (
                <Square className="w-3.5 h-3.5" />
              )}
              Select all for AI
            </button>
          </div>
          <Separator />
        </>
      )}

      {/* Document list */}
      <div className="flex-1 overflow-y-auto p-2">
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
            <FileText className="w-8 h-8 opacity-20" />
            <p className="text-xs">No documents yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {documents.map((doc) => {
              const isSelected = activeOpenBook.selectedDocumentIds.includes(
                doc.id,
              );
              return (
                <div
                  key={doc.id}
                  className={`flex items-center gap-2 px-2 py-2 rounded-md group transition-colors cursor-pointer hover:bg-muted/50 ${
                    isSelected ? "bg-primary/5" : ""
                  }`}
                  onClick={() =>
                    toggleDocumentSelection(activeOpenBook.id, doc.id)
                  }
                >
                  {isSelected ? (
                    <CheckSquare className="w-3.5 h-3.5 text-primary shrink-0" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  )}
                  <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs text-foreground truncate flex-1">
                    {doc.name}
                  </span>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      await removeDocument(activeOpenBook.id, doc.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
