import { createFileRoute, redirect } from "@tanstack/react-router";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/write")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  head: () =>
    seo({
      title: "Write",
      description: "Draft a new blog post with markdown and live preview.",
      path: "/write",
      noIndex: true,
    }),
  component: RetiredWritePage,
});

function RetiredWritePage() {
  return null;
}
