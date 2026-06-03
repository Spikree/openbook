import { Outlet, createRootRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useApplySettings } from "@/hooks/useApplySettings";
import { ReadingRuler } from "@/components/reader/ReadingRuler";
import { useOpenBookStore } from "@/store/openBookStore";
import { useSettingsStore } from "@/store/settingsStore";
import { api } from "@/api/client";
import { useEffect } from "react";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  useApplySettings();
  const { loadOpenBooks } = useOpenBookStore();
  const { ollamaModel, setSelectedModelCapabilities } = useSettingsStore();

  // all the fetching is done in the store so we dont need to add anything to the dep array
  useEffect(() => {
    loadOpenBooks();

    api
      .getModels()
      .then((data: { models: { name: string; capabilities: string[] }[] }) => {
        const selected = data.models.find((m) => m.name === ollamaModel);
        setSelectedModelCapabilities(selected?.capabilities ?? []);
      })
      .catch(() => setSelectedModelCapabilities([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
