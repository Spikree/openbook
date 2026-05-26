import { useRef } from "react";
import { useOpenBookStore } from "@/store/openBookStore";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { FileText, Plus, Trash2, CheckSquare, Square } from "lucide-react";
import { api } from "@/api/client";

export function LeftSidebar() {
  const {
    openBooks,
    activeOpenBookId,
    addDocument,
    removeDocument,
    toggleDocumentSelection,
    selectAllDocuments,
  } = useOpenBookStore();

  const inputRef = useRef<HTMLInputElement>(null);

  const activeOpenBook = Object.values(openBooks).find((ob) => ob.id === activeOpenBookId);

  const processFiles = async (files: FileList | null) => {
    if (!files || !activeOpenBookId) return;
    const pdfs = Array.from(files).filter((f) => f.type === "application/pdf");

    for (const file of pdfs) {
      try {
        const uploaded = await api.uploadDocument(activeOpenBookId, file);
        addDocument(activeOpenBookId, {
          id: uploaded.id,
          name: uploaded.name,
          size: uploaded.size,
          content: "",
          uploadedAt: uploaded.uploaded_at,
        });
      } catch (err) {
        console.error("Upload failed", err);
      }
    }
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
    activeOpenBook.documents.length > 0 &&
    activeOpenBook.documents.every((d) =>
      activeOpenBook.selectedDocumentIds.includes(d.id),
    );

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
      {activeOpenBook.documents.length > 0 && (
        <>
          <div className="px-4 py-2 shrink-0">
            <button
              onClick={() => selectAllDocuments(activeOpenBookId!)}
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
        {activeOpenBook.documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
            <FileText className="w-8 h-8 opacity-20" />
            <p className="text-xs">No documents yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {activeOpenBook.documents.map((doc) => {
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
                    toggleDocumentSelection(activeOpenBookId!, doc.id)
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
                    onClick={(e) => {
                      e.stopPropagation();
                      removeDocument(activeOpenBookId!, doc.id);
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
