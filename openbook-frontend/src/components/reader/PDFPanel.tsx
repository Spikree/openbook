import { useState } from "react";
import type { OpenBook } from "@/store/openBookStore";
import { FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { api } from "@/api/client";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

export function PDFPanel({ openBook }: { openBook: OpenBook }) {
  const [selectedDocId, setSelectedDocId] = useState<string | null>(
    openBook.documents[0]?.id ?? null,
  );
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);

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
      {openBook.documents.length > 1 && (
        <div className="shrink-0 flex gap-2 px-4 py-2 border-b border-border overflow-x-auto">
          {openBook.documents.map((doc) => (
            <button
              key={doc.id}
              onClick={() => {
                setSelectedDocId(doc.id);
                setPageNumber(1);
              }}
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

      {/* Page controls */}
      {numPages > 0 && (
        <div className="shrink-0 flex items-center justify-center gap-3 px-4 py-2 border-b border-border">
          <Button
            variant="outline"
            size="icon"
            className="w-7 h-7"
            onClick={() => setPageNumber((p) => Math.max(p - 1, 1))}
            disabled={pageNumber <= 1}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>
          <p className="text-xs text-muted-foreground">
            {pageNumber} / {numPages}
          </p>
          <Button
            variant="outline"
            size="icon"
            className="w-7 h-7"
            onClick={() => setPageNumber((p) => Math.min(p + 1, numPages))}
            disabled={pageNumber >= numPages}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto flex justify-center p-4">
        {selectedDoc ? (
          <Document
            file={api.getDocumentFileUrl(selectedDoc.id)}
            onLoadSuccess={({ numPages }) => {
              setNumPages(numPages);
              setPageNumber(1);
            }}
            loading={
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p className="text-sm">Loading PDF...</p>
              </div>
            }
            error={
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p className="text-sm">Failed to load PDF</p>
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              renderTextLayer={true}
              scale={0.8}
              renderAnnotationLayer={true}
            />
          </Document>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <p className="text-sm">Select a document to view</p>
          </div>
        )}
      </div>
    </div>
  );
}
