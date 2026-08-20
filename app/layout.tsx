import type { Metadata, Viewport } from "next";
import {
  DM_Sans,
  Zalando_Sans_SemiExpanded,
  Bitcount_Grid_Single,
} from "next/font/google";

import "../styles/tokens.css";
import "../styles/base.css";
import "../styles/loader.css";
import "../styles/nav.css";
import "../styles/cursor.css";
import "../styles/chrome-misc.css";
import "../styles/cta.css";
import "../styles/transition.css";
import "../styles/shared-marquee.css";
import "../styles/sections/hero.css";
import "../styles/sections/dark-wrapper.css";
import "../styles/sections/stm.css";
import "../styles/sections/ccap.css";
import "../styles/sections/gallery.css";
import "../styles/sections/footer.css";
import "../styles/sections/mobile-cube.css";
import "../styles/sections/about.css";
import "../styles/sections/about-work.css";
import "../styles/sections/about-cube.css";
import "../styles/sections/contact.css";
import "../styles/sections/work.css";
import "../styles/sections/pricing.css";
import "../styles/sections/faq.css";
import "../styles/sections/legal.css";

import AppShell from "@/components/providers/AppShell";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const zalando = Zalando_Sans_SemiExpanded({
  variable: "--font-zalando",
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
});

const bitcount = Bitcount_Grid_Single({
  variable: "--font-bitcount",
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Custom Web Design That Books Calls | American Web Guild",
  description:
    "Custom web design and development for service brands. Strategy, copy, design and code from one team, live in 14 days. See your homepage redesigned free — 72 hours, no call required.",
  metadataBase: new URL("https://americanwebguild.com"),
  openGraph: {
    type: "website",
    url: "https://americanwebguild.com/",
    title: "Custom Web Design That Books Calls | American Web Guild",
    description:
      "Custom web design and development for service brands. Strategy, copy, design and code from one team, live in 14 days. See your homepage redesigned free — 72 hours, no call required.",
    images: [
      {
        url: "/images/og.jpg",
        width: 1200,
        height: 630,
        alt: "American Web Guild — custom web design studio",
      },
    ],
    locale: "en_US", 
    siteName: "American Web Guild",
  },
  twitter: {
    card: "summary_large_image",
  },
  other: {
    "format-detection": "telephone=no",
  },
};

/**
 * Explicit viewport — declared rather than inherited so phones always lay
 * the page out at device width, notched screens fill edge to edge, and the
 * user can still pinch-zoom (maximumScale 5 / userScalable).
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#0b0c0e", // keep in sync with --color-bg-wrapper
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${dmSans.variable} ${zalando.variable} ${bitcount.variable}`}
    >
      <body suppressHydrationWarning>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
