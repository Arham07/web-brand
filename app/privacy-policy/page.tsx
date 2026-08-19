import type { Metadata } from "next";
import LegalDoc from "@/components/legal/LegalDoc";
import { PRIVACY_POLICY } from "@/components/legal/legal-content";
import SiteFooter from "@/components/footer/SiteFooter";

export const metadata: Metadata = {
  title: "Privacy Policy | American Web Guild",
  description:
    "How American Web Guild collects, uses, shares and retains your information, and the rights you have over it.",
  alternates: { canonical: "https://americanwebguild.com/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="legal-page">
      <main className="lg-main">
        <p className="lg-eyebrow">( Legal )</p>
        <h1 className="lg-title">Privacy Policy</h1>
        <div className="lg-body">
          <LegalDoc markdown={PRIVACY_POLICY} />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
