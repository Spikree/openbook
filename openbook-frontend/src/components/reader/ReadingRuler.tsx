import { useEffect, useState } from "react";
import { useSettingsStore } from "@/store/settingsStore";

export function ReadingRuler() {
  const { readingRuler } = useSettingsStore();
  const [y, setY] = useState(0);

  useEffect(() => {
    if (!readingRuler) return;

    const handleMouseMove = (e: MouseEvent) => {
      setY(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [readingRuler]);

  if (!readingRuler) return null;

  return (
    <div
      className="fixed left-0 right-0 pointer-events-none z-50 transition-transform duration-75"
      style={{
        top: y - 12,
        height: 28,
        background: "rgba(255, 255, 0, 0.15)",
        borderTop: "1px solid rgba(255, 255, 0, 0.3)",
        borderBottom: "1px solid rgba(255, 255, 0, 0.3)",
      }}
    />
  );
}
