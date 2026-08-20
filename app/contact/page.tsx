import type { Metadata } from "next";
import ContactHero from "@/components/contact/ContactHero";
import ContactForm from "@/components/contact/ContactForm";
import ScrollMarquee from "@/components/shared/ScrollMarquee";
import SiteFooter from "@/components/footer/SiteFooter";

export const metadata: Metadata = {
  title: "Get a Free Homepage Design Concept | American Web Guild",
  description:
    "Send your site and what you sell. In 72 hours we'll send back a custom homepage concept for your business — free, no call required, yours to keep.",
  openGraph: {
    images: ["/images/og.jpg"],
    title: "Get a Free Homepage Design Concept | American Web Guild",
    description:
      "Send your site and what you sell. In 72 hours we'll send back a custom homepage concept for your business — free, no call required, yours to keep.",
    url: "https://americanwebguild.com/contact",
  },
  alternates: { canonical: "https://americanwebguild.com/contact" },
};

export default function ContactPage() {
  return (
    <div className="contact-page">
      <ContactHero />
      <ContactForm />
      <ScrollMarquee word="LET'S TALK" />
      <SiteFooter />
    </div>
  );
}
