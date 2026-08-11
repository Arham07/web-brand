import type { Metadata } from "next";
import PricingHero from "@/components/pricing/PricingHero";
import PricingSection from "@/components/pricing/PricingSection";
import ScrollMarquee from "@/components/shared/ScrollMarquee";
import SiteFooter from "@/components/footer/SiteFooter";

export const metadata: Metadata = {
  title: "Pricing | American Web Guild — Better Packages, Better Prices",
  description:
    "Transparent pricing from American Web Guild: website design, e-commerce, logo design, SEO, branding and social media marketing packages — premium quality with a 100% satisfaction guarantee.",
  openGraph: {
    title: "Pricing | American Web Guild — Better Packages, Better Prices",
    description:
      "Website design, e-commerce, logo, SEO, branding and SMM packages — transparent pricing, premium execution.",
    url: "https://americanwebguild.com/pricing",
  },
  alternates: { canonical: "https://americanwebguild.com/pricing" },
};

export default function PricingPage() {
  return (
    <div className="pricing-page">
      <main>
        <PricingHero />
        <PricingSection />
      </main>
      <ScrollMarquee word="LET'S TALK" />
      <SiteFooter />
    </div>
  );
}
