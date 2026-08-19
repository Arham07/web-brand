import type { Metadata } from "next";
import LegalDoc from "@/components/legal/LegalDoc";
import { TERMS } from "@/components/legal/legal-content";
import SiteFooter from "@/components/footer/SiteFooter";

export const metadata: Metadata = {
  title: "Terms and Conditions | American Web Guild",
  description:
    "The terms that govern use of americanwebguild.com and any web design, development or branding services you purchase from us.",
  alternates: {
    canonical: "https://americanwebguild.com/terms-and-conditions",
  },
};

export default function TermsPage() {
  return (
    <div className="legal-page">
      <main className="lg-main">
        <p className="lg-eyebrow">( Legal )</p>
        <h1 className="lg-title">Terms and Conditions</h1>
        <div className="lg-body">
          <LegalDoc markdown={TERMS} />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
