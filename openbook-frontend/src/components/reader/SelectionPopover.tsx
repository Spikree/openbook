import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, BookOpen, Search } from "lucide-react";

interface SelectionPopoverProps {
  onExplain: (text: string) => void;
  onSimplify: (text: string) => void;
  onDefine: (text: string) => void;
}

export function SelectionPopover({
  onExplain,
  onSimplify,
  onDefine,
}: SelectionPopoverProps) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [selectedText, setSelectedText] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseUp = (_e: MouseEvent) => {
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
          onExplain(selectedText);
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
          onSimplify(selectedText);
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
          onDefine(selectedText);
          setPosition(null);
        }}
      >
        <Search className="w-3 h-3" />
        Define
      </Button>
    </div>
  );
}
