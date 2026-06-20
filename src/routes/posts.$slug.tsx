import { createFileRoute, redirect } from "@tanstack/react-router";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/posts/$slug")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/blog/$slug",
      params: { slug: params.slug },
      statusCode: 301,
      replace: true,
    });
  },
  head: ({ params }) =>
    seo({
      title: "Post",
      description: "This post has moved to its canonical blog URL.",
      path: `/blog/${params.slug}`,
    }),
});
