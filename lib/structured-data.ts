/**
 * JSON-LD builders — the machine-readable identity Google reads.
 *
 * One module owns every schema object so the brand facts (name, address,
 * logo) exist in exactly one place. Emitted server-side from layout/pages;
 * nothing here ships to the client bundle as executable code.
 */

const SITE = "https://americanwebguild.com";

export const ORGANIZATION_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE}/#organization`,
  name: "American Web Guild",
  url: SITE,
  // The bare 512x512 mark. NOT the web-app-manifest icons — those are
  // maskable (safe-zone padding baked in), and Google wants the unpadded logo.
  logo: {
    "@type": "ImageObject",
    url: `${SITE}/images/fav.png`,
    width: 512,
    height: 512,
  },
  email: "info@americanwebguild.com",
  // TODO: dummy number (555-01xx is reserved-for-fiction), kept here by
  // explicit owner decision. Replace with the real VOIP line BEFORE ads run —
  // schema values can surface directly in Google's brand panel.
  telephone: "+1-213-555-0142",
  address: {
    "@type": "PostalAddress",
    streetAddress: "2108 N St Ste N",
    addressLocality: "Sacramento",
    addressRegion: "CA",
    postalCode: "95816",
    addressCountry: "US",
  },
  foundingDate: "2020",
  description:
    "American Web Guild — custom web design, development and brand visuals. Conversion-focused custom websites for service brands: strategy, copy, design, motion and code from one team.",
} as const;

export const WEBSITE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE}/#website`,
  name: "American Web Guild",
  alternateName: "AWG",
  url: SITE,
  publisher: { "@id": `${SITE}/#organization` },
} as const;

export function faqPageJsonLd(faqs: readonly { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/**
 * Serialise for a <script type="application/ld+json"> tag.
 * `<` is escaped so no string value could ever terminate the script tag
 * early (`</script>` injection). Our data is static today; the pattern is
 * cheap insurance for the day someone feeds this user-supplied text.
 */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
