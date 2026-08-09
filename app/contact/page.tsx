import type { Metadata } from "next";
import ContactHero from "@/components/contact/ContactHero";
import ContactForm from "@/components/contact/ContactForm";
import ContactMarquee from "@/components/contact/ContactMarquee";
import SiteFooter from "@/components/footer/SiteFooter";

export const metadata: Metadata = {
  title: "Contact | NUDOT Studio — Project Enquiries",
  description:
    "Get in touch with NUDOT Studio — a web design, premium commercial visual and AI motion-image team. Enquiries welcome for brand sites, interactive experience design and Gen-AI visual projects.",
  openGraph: {
    title: "Contact | NUDOT Studio · Web Design & Commercial Visual Collaboration",
    description:
      "Start a conversation about your next digital transformation with NUDOT Studio.",
    url: "https://nudot.com.tw/contact",
  },
  alternates: { canonical: "https://nudot.com.tw/contact" },
};

export default function ContactPage() {
  return (
    <div className="contact-page">
      <ContactHero />
      <ContactForm />
      <ContactMarquee />
      <SiteFooter />
    </div>
  );
}
