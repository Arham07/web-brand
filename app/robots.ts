import type { MetadataRoute } from "next";

const SITE = "https://americanwebguild.com";

/**
 * Served at /robots.txt.
 *
 * `/thank-you` is deliberately NOT disallowed here even though it is
 * noindexed. Disallowing a URL in robots.txt stops Googlebot from fetching
 * it at all — which means it never reads the `noindex` meta tag on the page,
 * and the URL stays eligible to show up in results as a bare link. The meta
 * tag only works on a page Google is allowed to crawl.
 *
 * `/api/` is disallowed because it is a POST-only endpoint with nothing to
 * index; there is no reason to spend crawl budget on it.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
