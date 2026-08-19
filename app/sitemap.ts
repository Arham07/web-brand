import type { MetadataRoute } from "next";

const SITE = "https://americanwebguild.com";

/**
 * Served at /sitemap.xml — the list of pages we actually want indexed.
 *
 * Two deliberate absences:
 *
 * - `/thank-you` carries `robots: { index: false }` (it is the conversion
 *   destination, not a landing page). Listing a noindexed URL in a sitemap
 *   sends Google two contradictory instructions about the same page.
 * - `app/[slug]` renders six work slugs that nothing on the site links to.
 *   They are not part of the public site, so they are not advertised here.
 *
 * `priority` is a hint about relative importance within this site only — it
 * says nothing to Google about ranking against other sites. The order below
 * follows what actually earns money: the pages a paid click is sent to come
 * first, the legal pages last.
 */
type Entry = {
  path: string;
  priority: number;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
};

const PAGES: Entry[] = [
  { path: "", priority: 1.0, changeFrequency: "weekly" },
  { path: "/work", priority: 0.9, changeFrequency: "weekly" },
  { path: "/pricing", priority: 0.9, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.9, changeFrequency: "monthly" },
  { path: "/about", priority: 0.8, changeFrequency: "monthly" },
  { path: "/privacy-policy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms-and-conditions", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  // These are statically rendered pages, so the build is genuinely the last
  // time their HTML changed — one timestamp for the whole set is accurate,
  // not a guess.
  const lastModified = new Date();

  return PAGES.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
