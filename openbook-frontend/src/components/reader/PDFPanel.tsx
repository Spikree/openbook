import { useState, useRef } from "react";
import type { OpenBook } from "@/store/openBookStore";
import { FileText } from "lucide-react";

export function PDFPanel({ openBook }: { openBook: OpenBook }) {
  const [selectedDocId, setSelectedDocId] = useState<string | null>(
    openBook.documents[0]?.id ?? null,
  );

  const selectedDoc = openBook.documents.find((d) => d.id === selectedDocId);

  if (openBook.documents.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
        <FileText className="w-8 h-8 mb-2 opacity-20" />
        <p className="text-sm">No documents in this OpenBook</p>
        <p className="text-xs mt-1">Add documents from the left panel</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Doc selector if multiple */}
      {openBook.documents.length > 1 && (
        <div className="shrink-0 flex gap-2 px-4 py-2 border-b border-border overflow-x-auto">
          {openBook.documents.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setSelectedDocId(doc.id)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-md transition-colors ${
                selectedDocId === doc.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {doc.name}
            </button>
          ))}
        </div>
      )}

      {/* PDF viewer */}
      <div className="flex-1 overflow-hidden">
        {selectedDoc ? (
          <iframe
            src={selectedDoc.content}
            className="w-full h-full border-none"
            title={selectedDoc.name}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <p className="text-sm">Select a document to view</p>
          </div>
        )}
      </div>
    </div>
  );
}
