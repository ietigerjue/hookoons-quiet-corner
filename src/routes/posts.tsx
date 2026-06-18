import { createFileRoute, Outlet, useMatches } from "@tanstack/react-router";

export const Route = createFileRoute("/posts")({
  component: () => <Outlet />,
});
