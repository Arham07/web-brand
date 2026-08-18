import type { Metadata } from "next";
import PricingHero from "@/components/pricing/PricingHero";
import PricingSection from "@/components/pricing/PricingSection";
import ScrollMarquee from "@/components/shared/ScrollMarquee";
import SiteFooter from "@/components/footer/SiteFooter";

export const metadata: Metadata = {
  title: "Website Design Pricing — $349 to $1,299 | American Web Guild",
  description:
    "Published website design pricing with no discovery call required. Three packages from $349, custom quotes in 24 hours, and a money-back guarantee on every build.",
  openGraph: {
    title: "Website Design Pricing — $349 to $1,299 | American Web Guild",
    description:
      "Published website design pricing with no discovery call required. Three packages from $349, custom quotes in 24 hours, and a money-back guarantee on every build.",
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
