import type { Post } from "@/lib/posts";

const LOCAL_SITE_URL = "http://localhost:3000";

let warnedMissingSiteUrl = false;

export const siteConfig = {
  siteName: "Hookoon's Quiet Corner",
  siteDescription: "记录 AI Agent、个人项目、材料学习、价格行为学笔记与长期思考",
  author: "Hookoon",
  defaultOgImage: "/images/og-default.png",
  // Backwards-compatible aliases used by existing layout code.
  name: "Hookoon's Quiet Corner",
  description: "记录 AI Agent、个人项目、材料学习、价格行为学笔记与长期思考",
};

export function getSiteUrl() {
  const configured = import.meta.env.VITE_SITE_URL?.trim();
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      console.warn(
        `VITE_SITE_URL is invalid: ${configured}. Falling back to ${LOCAL_SITE_URL} for SEO URLs.`,
      );
    }
  }

  if (import.meta.env.PROD && !warnedMissingSiteUrl) {
    warnedMissingSiteUrl = true;
    console.warn(
      "VITE_SITE_URL is not configured. Falling back to http://localhost:3000 for SEO URLs.",
    );
  }

  return LOCAL_SITE_URL;
}

export function buildCanonicalUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const cleanPath = normalizedPath === "/" ? "/" : normalizedPath.replace(/\/+$/, "");
  return new URL(cleanPath, `${getSiteUrl()}/`).toString();
}

export function buildPageTitle(title?: string) {
  return title ? `${title} | ${siteConfig.siteName}` : siteConfig.siteName;
}

export function getDefaultOgImage() {
  return absoluteAssetUrl(siteConfig.defaultOgImage);
}

export const defaultSeo = {
  title: siteConfig.siteName,
  description: siteConfig.siteDescription,
  canonical: buildCanonicalUrl("/"),
  image: getDefaultOgImage(),
};

type SeoType = "website" | "article";

type SeoOptions = {
  title?: string;
  description?: string;
  path?: string;
  type?: SeoType;
  image?: string;
  publishedTime?: string;
  tags?: string[];
  noIndex?: boolean;
};

function absoluteAssetUrl(value?: string) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  const path = value.startsWith("/") ? value : `/${value}`;
  return buildCanonicalUrl(path);
}

export function buildSeo({
  title,
  description = siteConfig.siteDescription,
  path = "/",
  type = "website",
  image,
  publishedTime,
  tags = [],
  noIndex = false,
}: SeoOptions) {
  const pageTitle = buildPageTitle(title);
  const canonical = buildCanonicalUrl(path);
  const ogImage = absoluteAssetUrl(image) || getDefaultOgImage();

  return {
    meta: [
      { title: pageTitle },
      { name: "description", content: description },
      { name: "author", content: siteConfig.author },
      { property: "og:title", content: pageTitle },
      { property: "og:description", content: description },
      { property: "og:type", content: type },
      { property: "og:url", content: canonical },
      { property: "og:site_name", content: siteConfig.siteName },
      { property: "og:image", content: ogImage },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: pageTitle },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: ogImage },
      ...(publishedTime ? [{ property: "article:published_time", content: publishedTime }] : []),
      ...(tags.length > 0 ? [{ property: "article:tag", content: tags.join(", ") }] : []),
      ...(noIndex ? [{ name: "robots", content: "noindex,nofollow" }] : []),
    ],
    links: [{ rel: "canonical", href: canonical }],
  };
}

export function buildPostSeo(
  post: Pick<Post, "title" | "titleEn" | "excerpt" | "slug" | "cover" | "date" | "tags">,
) {
  const title = post.titleEn ? `${post.title} / ${post.titleEn}` : post.title;
  return buildSeo({
    title,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
    type: "article",
    image: post.cover || siteConfig.defaultOgImage,
    publishedTime: post.date,
    tags: post.tags,
  });
}

// Compatibility for existing route imports.
export const seo = buildSeo;
export const pageTitle = buildPageTitle;
export const absoluteUrl = buildCanonicalUrl;
