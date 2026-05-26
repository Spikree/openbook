import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useOpenBookStore } from "@/store/openBookStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Trash2, FileText } from "lucide-react";
import { api } from "@/api/client";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { openBooks, deleteOpenBook, setActiveOpenBook } = useOpenBookStore();
  const navigate = useNavigate();

  const handleOpen = (id: string) => {
    setActiveOpenBook(id);
    navigate({ to: "/reader" });
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.deleteOpenBook(id);
      deleteOpenBook(id);
    } catch (err) {
      console.error(err);
    }
  };

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
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={(e) => handleDelete(e, ob.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
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
                  {ob.documents.length} document
                  {ob.documents.length !== 1 ? "s" : ""}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
