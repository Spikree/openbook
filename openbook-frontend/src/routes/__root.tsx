import { Outlet, createRootRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useApplySettings } from "@/hooks/useApplySettings";
import { ReadingRuler } from "@/components/reader/ReadingRuler";
import { useOpenBookStore } from "@/store/openBookStore";
import { useEffect } from "react";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  useApplySettings();
  const { loadOpenBooks } = useOpenBookStore();

  useEffect(() => {
    loadOpenBooks();
  }, []);

  return (
    <>
      <ReadingRuler />
      <AppShell>
        <Outlet />
      </AppShell>
    </>
  );
}
