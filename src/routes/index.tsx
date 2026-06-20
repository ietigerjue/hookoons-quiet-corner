import { createFileRoute } from "@tanstack/react-router";
import { HeroSection } from "@/components/home/HeroSection";
import { LatestPosts } from "@/components/home/LatestPosts";
import { buildSeo, siteConfig } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () =>
    buildSeo({
      description: siteConfig.siteDescription,
      path: "/",
    }),
  component: Home,
});

function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-5 sm:py-10">
      <div className="fade-up">
        <HeroSection />
      </div>
      <LatestPosts />
    </div>
  );
}
