import type { Metadata } from "next";
import SiteFooter from "@/components/footer/SiteFooter";

/**
 * C-05 — the dedicated conversion destination. The form redirects here on a
 * successful submit, which is what makes Meta's Lead event reliable: fire
 * the pixel on this URL and use it as the campaign's conversion event.
 * Noindexed — this page only exists for people who just submitted.
 */
export const metadata: Metadata = {
  title: "Got it — your concept is being designed | American Web Guild",
  description:
    "We'll reply within the hour, and your custom homepage concept lands within 72 hours.",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://americanwebguild.com/thank-you" },
};

export default function ThankYouPage() {
  return (
    <div className="contact-page">
      <main className="ty-main">
        <p className="ty-eyebrow">( Request Received )</p>
        <h1 className="ty-title">
          Got it. Your concept
          <br />
          is being designed.
        </h1>
        <p className="ty-body">
          We&apos;ll reply within the hour, and your homepage concept will land
          within 72 hours. It&apos;ll come from{" "}
          <strong>info@americanwebguild.com</strong> — add us to your contacts
          so it doesn&apos;t get filtered.
        </p>
        <div className="ty-actions">
          <span className="ty-actions__label">While you wait:</span>
          <a className="ty-link" href="/work" data-transition-label="Work">
            See the builds we&apos;ve shipped &rarr;
          </a>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
