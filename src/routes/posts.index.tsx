import { createFileRoute, redirect } from "@tanstack/react-router";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/posts/")({
  beforeLoad: () => {
    throw redirect({ to: "/blog", statusCode: 301, replace: true });
  },
  head: () =>
    seo({
      title: "Posts",
      description:
        "All long-form posts on AI, materials science, product building, and personal notes.",
      path: "/blog",
    }),
});
