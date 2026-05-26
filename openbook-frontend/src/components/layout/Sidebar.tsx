import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  Brain,
  Home,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { label: "Home", icon: Home, to: "/" },
  { label: "Reader", icon: BookOpen, to: "/reader" },
  { label: "Flashcards", icon: Brain, to: "/flashcards" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "relative flex flex-col h-screen bg-card border-r border-border transition-all duration-300 ease-in-out",
          collapsed ? "w-16" : "w-56",
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex items-center h-16 px-4 gap-3",
            collapsed && "justify-center px-0",
          )}
        >
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-foreground tracking-tight">
              OpenBook
            </span>
          )}
        </div>

        <Separator />

        {/* Nav items */}
        <nav className="flex flex-col gap-1 p-2 flex-1">
          {navItems.map(({ label, icon: Icon, to }) => (
            <Tooltip key={to}>
              <TooltipTrigger asChild>
                <Link
                  to={to}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors",
                    collapsed && "justify-center px-0",
                  )}
                  activeProps={{
                    className: "text-foreground bg-accent/10 font-medium",
                  }}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>{label}</span>}
                </Link>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right">{label}</TooltipContent>
              )}
            </Tooltip>
          ))}
        </nav>

        <Separator />

        {/* Settings + collapse */}
        <div className="p-2 flex flex-col gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/settings"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors",
                  collapsed && "justify-center px-0",
                )}
                activeProps={{
                  className: "text-foreground bg-accent/10 font-medium",
                }}
              >
                <Settings className="w-4 h-4 shrink-0" />
                {!collapsed && <span>Settings</span>}
              </Link>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right">Settings</TooltipContent>
            )}
          </Tooltip>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors w-full",
              collapsed && "justify-center px-0",
            )}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4 shrink-0" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 shrink-0" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
