import { Outlet, createRootRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useApplySettings } from "@/hooks/useApplySettings";
import { ReadingRuler } from "@/components/reader/ReadingRuler";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  useApplySettings();

  return (
    <>
      <ReadingRuler />
      <AppShell>
        <Outlet />
      </AppShell>
    </>
  );
}
