import { useParams } from "@tanstack/react-router";
import { useOpenBookStore } from "@/store/openBookStore";

export function useActiveOpenBook() {
  const { openBookId } = useParams({ strict: false });
  return useOpenBookStore((s) =>
    openBookId ? s.openBooks[openBookId] : undefined,
  );
}
