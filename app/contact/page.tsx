import type { Metadata } from "next";
import ContactHero from "@/components/contact/ContactHero";
import ContactForm from "@/components/contact/ContactForm";
import ScrollMarquee from "@/components/shared/ScrollMarquee";
import SiteFooter from "@/components/footer/SiteFooter";

export const metadata: Metadata = {
  title: "Contact | American Web Guild — Project Enquiries",
  description:
    "Get in touch with American Web Guild — a web design, premium commercial visual and AI motion-image team. Enquiries welcome for brand sites, interactive experience design and Gen-AI visual projects.",
  openGraph: {
    title: "Contact | American Web Guild · Web Design & Commercial Visual Collaboration",
    description:
      "Start a conversation about your next digital transformation with American Web Guild.",
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
