import { useRef, useState, useCallback } from "react";
import { Navbar } from "./Navbar";
import { LeftSidebar } from "./LeftSidebar";
import { RightSidebar } from "./RightSidebar";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [leftWidth, setLeftWidth] = useState(260);
  const [rightWidth, setRightWidth] = useState(280);
  const containerRef = useRef<HTMLDivElement>(null);

  const startLeftResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = leftWidth;

      const onMouseMove = (e: MouseEvent) => {
        const delta = e.clientX - startX;
        const newWidth = Math.min(Math.max(startWidth + delta, 180), 480);
        setLeftWidth(newWidth);
      };

      const onMouseUp = () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [leftWidth],
  );

  const startRightResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = rightWidth;

      const onMouseMove = (e: MouseEvent) => {
        const delta = startX - e.clientX;
        const newWidth = Math.min(Math.max(startWidth + delta, 180), 480);
        setRightWidth(newWidth);
      };

      const onMouseUp = () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [rightWidth],
  );

  return (
    <div className="flex flex-col h-screen w-screen bg-background overflow-hidden">
      <Navbar />
      <div ref={containerRef} className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <div
          style={{ width: leftWidth, minWidth: leftWidth }}
          className="h-full overflow-hidden"
        >
          <LeftSidebar />
        </div>

        {/* Left resize handle */}
        <div
          onMouseDown={startLeftResize}
          className="w-1 bg-border hover:bg-primary transition-colors cursor-col-resize shrink-0"
        />

        {/* Main content */}
        <div className="flex-1 h-full overflow-y-auto p-6">{children}</div>

        {/* Right resize handle */}
        <div
          onMouseDown={startRightResize}
          className="w-1 bg-border hover:bg-primary transition-colors cursor-col-resize shrink-0"
        />

        {/* Right sidebar */}
        <div
          style={{ width: rightWidth, minWidth: rightWidth }}
          className="h-full overflow-hidden"
        >
          <RightSidebar />
        </div>
      </div>
    </div>
  );
}
