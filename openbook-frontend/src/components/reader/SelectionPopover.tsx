import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, BookOpen, Search } from "lucide-react";
import { useUIStore } from "@/store/uiStore";

export function SelectionPopover() {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [selectedText, setSelectedText] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);
  const { setPendingChatMessage, setActiveReaderTab } = useUIStore();

  useEffect(() => {
    const handleMouseUp = () => {
      setTimeout(() => {
        const selection = window.getSelection();
        const text = selection?.toString().trim();
        if (!text || text.length < 3) {
          setPosition(null);
          setSelectedText("");
          return;
        }
        const range = selection?.getRangeAt(0);
        const rect = range?.getBoundingClientRect();
        if (rect) {
          setPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 10,
          });
          setSelectedText(text);
        }
      }, 10);
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setPosition(null);
        setSelectedText("");
      }
    };

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  if (!position || !selectedText) return null;

  return (
    <div
      ref={popoverRef}
      className="fixed z-50 flex items-center gap-1 bg-card border border-border rounded-lg shadow-lg p-1"
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -100%)",
      }}
    >
      <Button
        size="sm"
        variant="ghost"
        className="h-7 px-2 text-xs gap-1.5"
        onClick={() => {
          setActiveReaderTab("chat");
          setPendingChatMessage(`Explain this: "${selectedText}"`);
          setPosition(null);
        }}
      >
        <Sparkles className="w-3 h-3" />
        Explain
      </Button>
      <div className="w-px h-4 bg-border" />
      <Button
        size="sm"
        variant="ghost"
        className="h-7 px-2 text-xs gap-1.5"
        onClick={() => {
          setActiveReaderTab("chat");
          setPendingChatMessage(`Simplify this text: "${selectedText}"`);
          setPosition(null);
        }}
      >
        <BookOpen className="w-3 h-3" />
        Simplify
      </Button>
      <div className="w-px h-4 bg-border" />
      <Button
        size="sm"
        variant="ghost"
        className="h-7 px-2 text-xs gap-1.5"
        onClick={() => {
          setActiveReaderTab("chat");
          setPendingChatMessage(`Define this term: "${selectedText}"`);
          setPosition(null);
        }}
      >
        <Search className="w-3 h-3" />
        Define
      </Button>
    </div>
  );
}
