import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useOpenBookStore } from "@/store/openBookStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Trash2, FileText, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState } from "react";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const openBooks = useOpenBookStore((s) => s.openBooks);
  const deleteOpenBook = useOpenBookStore((s) => s.deleteOpenBook);
  const renameOpenBook = useOpenBookStore((s) => s.renameOpenBook);

  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  const handleOpen = (id: string) => {
    navigate({ to: "/reader/$openBookId", params: { openBookId: id } });
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteId(id);
  };

  const handleRenameClick = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    setRenameId(id);
    setNewName(name);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteOpenBook(deleteId); // store: API + cascade + toast
    } catch {
      // store handles toast
    } finally {
      setDeleteId(null);
    }
  };

  const confirmRename = async () => {
    if (!renameId || !newName.trim()) return;
    try {
      await renameOpenBook(renameId, newName.trim());
    } catch {
      // store handles toast
    } finally {
      setRenameId(null);
      setNewName("");
    }
  };

  const bookToDelete = deleteId ? openBooks[deleteId] : null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Your OpenBooks
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Select an OpenBook to continue or create a new one
        </p>
      </div>

      {Object.keys(openBooks).length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="text-sm font-medium">No OpenBooks yet</p>
          <p className="text-xs mt-1">
            Click "New OpenBook" in the navbar to get started
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.values(openBooks).map((ob) => (
            <Card
              key={ob.id}
              onClick={() => handleOpen(ob.id)}
              className="p-5 flex flex-col gap-4 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={(e) => handleRenameClick(e, ob.id, ob.name)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={(e) => handleDeleteClick(e, ob.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div>
                <p className="font-medium text-foreground">{ob.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(ob.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <FileText className="w-3 h-3" />
                <span>
                  {ob.documentIds.length} document
                  {ob.documentIds.length !== 1 ? "s" : ""}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete OpenBook?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete{" "}
            <span className="font-medium text-foreground">
              "{bookToDelete?.name}"
            </span>{" "}
            and all its documents, notes, chat history, and generated content.
            This cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!renameId} onOpenChange={(o) => !o && setRenameId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename OpenBook</DialogTitle>
          </DialogHeader>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && confirmRename()}
            className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            autoFocus
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRenameId(null)}>
              Cancel
            </Button>
            <Button onClick={confirmRename} disabled={!newName.trim()}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
