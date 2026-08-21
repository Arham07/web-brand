// The eight objections standing between a visitor and a message (copy doc
// H-10). Q3/Q4/Q7 carry the heaviest load for cold Meta traffic — money
// risk, time risk and lock-in risk, in that order.
//
// Lives in its own file (no "use client") so the server-rendered FAQPage
// JSON-LD in app/page.tsx and the client accordion read the SAME array —
// Google penalises FAQ markup that doesn't match the visible page, so the
// two must never be able to drift apart.
export const FAQS = [
  {
    q: "How much does a custom website cost?",
    a: "Our packages run $349 to $1,299, and most fully custom builds land between $1,500 and $6,000. You get an exact number in writing before anything starts. No hourly billing, no surprises at the end.",
  },
  {
    q: "How long does it take?",
    a: "Fourteen days from kickoff to live for a standard build. E-commerce and larger custom projects run three to six weeks. We put the date in writing, and if we miss it, the build is free.",
  },
  {
    q: "What if I don't like the design?",
    a: "Then you don't pay. You see a full homepage concept before you commit a dollar. If it's not right, we revise it or you walk — no charge, and you keep the concept.",
  },
  {
    q: "Do I have to get on a call?",
    a: "No. You can get your free homepage concept without ever speaking to us. Send the brief, get the design in 72 hours, decide from there.",
  },
  {
    q: "Will it actually rank on Google?",
    a: "We build SEO in at the structure level: clean semantic HTML, fast Core Web Vitals, schema markup, proper headings and metadata, sitemap submitted. Ranking also depends on your market and your content, so we'll tell you honestly what to expect rather than promise page one.",
  },
  {
    q: "Can I edit it myself after launch?",
    a: "Yes. Every site ships on a CMS, and we record a walkthrough video using your site, not a generic tutorial. Or hand it to us on a care plan and never think about it.",
  },
  {
    q: "Who owns the website?",
    a: "You do — code, domain, hosting, content, all transferred at launch. We don't hold anything hostage, and you can leave whenever you like.",
  },
  {
    q: "I already have a site. Is a rebuild overkill?",
    a: "Sometimes. Send it over and we'll audit it free. If the honest answer is “keep it and fix three things,” we'll say so — we'd rather have your trust than a project that shouldn't happen.",
  },
] as const;
