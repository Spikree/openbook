import { Moon, Sun, Plus, BookOpen, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { useOpenBookStore } from "@/store/openBookStore";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "@tanstack/react-router";

type DialogView = "choice" | "create";

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { openBooks, activeOpenBookId, createOpenBook, setActiveOpenBook } =
    useOpenBookStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [view, setView] = useState<DialogView>("choice");
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const activeOpenBook = openBooks.find((ob) => ob.id === activeOpenBookId);

  const handleOpen = () => {
    setView("choice");
    setName("");
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setTimeout(() => setView("choice"), 200);
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    createOpenBook(name.trim());
    setName("");
    handleClose();
  };

  const handleSwitch = (id: string) => {
    setActiveOpenBook(id);
    navigate({ to: "/reader" });
  };

  const handleOpenExisting = (id: string) => {
    handleSwitch(id);
    handleClose();
  };

  return (
    <>
      <header className="h-16 flex items-center justify-between px-6 bg-card border-b border-border gap-4">
        {/* Left — open/create */}
        <Button
          size="sm"
          variant="outline"
          className="gap-2"
          onClick={handleOpen}
        >
          <Plus className="w-4 h-4" />
          New OpenBook
        </Button>

        {/* Center — active book switcher */}
        <div className="flex-1 flex justify-center">
          {activeOpenBook ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 font-medium max-w-xs">
                  <BookOpen className="w-4 h-4 text-primary shrink-0" />
                  <span className="truncate">{activeOpenBook.name}</span>
                  <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-56">
                {openBooks.map((ob) => (
                  <DropdownMenuItem
                    key={ob.id}
                    onClick={() => handleSwitch(ob.id)}
                    className="gap-2"
                  >
                    <BookOpen className="w-4 h-4 text-primary" />
                    <span className="flex-1 truncate">{ob.name}</span>
                    {ob.id === activeOpenBookId && (
                      <span className="text-xs text-muted-foreground">
                        active
                      </span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <span className="text-sm text-muted-foreground">
              No OpenBook selected
            </span>
          )}
        </div>

        {/* Right — theme toggle */}
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === "dark" ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </Button>
      </header>

      <Dialog open={dialogOpen} onOpenChange={handleClose}>
        <DialogContent className="!bg-card sm:max-w-md border border-border">
          {view === "choice" && (
            <>
              <DialogHeader>
                <DialogTitle>OpenBooks</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <Button
                  className="w-full gap-2"
                  onClick={() => setView("create")}
                >
                  <Plus className="w-4 h-4" />
                  Create New OpenBook
                </Button>

                {openBooks.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                      Your OpenBooks
                    </p>
                    <div className="space-y-1 max-h-64 overflow-y-auto">
                      {openBooks.map((ob) => (
                        <button
                          key={ob.id}
                          onClick={() => handleOpenExisting(ob.id)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                            <BookOpen className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {ob.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {ob.documents.length} doc
                              {ob.documents.length !== 1 ? "s" : ""} ·{" "}
                              {new Date(ob.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                          {ob.id === activeOpenBookId && (
                            <span className="text-xs text-primary font-medium">
                              active
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {view === "create" && (
            <>
              <DialogHeader>
                <DialogTitle>New OpenBook</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <input
                  type="text"
                  placeholder="e.g. Biology Notes, Law Essay..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setView("choice")}>
                    Back
                  </Button>
                  <Button onClick={handleCreate} disabled={!name.trim()}>
                    Create
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
