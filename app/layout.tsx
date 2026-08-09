import type { Metadata } from "next";
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
  title: "NUDOT Studio | Web Design x Brand Visuals x Motion Design",
  description:
    "NUDOT is a leading creative studio specializing in high-end web design, motion design, and brand visual elevation. We blend fluid minimalist aesthetics with advanced front-end technology to build immersive, interactive websites with an international standard of craft — turning digital experience into your strongest business asset.",
  metadataBase: new URL("https://nudot.com.tw"),
  openGraph: {
    type: "website",
    url: "https://nudot.com.tw/",
    title: "NUDOT Studio | Web Design x Motion Design x Brand Visuals",
    description:
      "NUDOT is a leading creative studio specializing in high-end web design, motion design, and brand visual elevation, building immersive, interactive websites with an international standard of craft.",
    images: ["/images/og.jpg"],
    locale: "en_US",
    siteName: "NUDOT Studio",
  },
  twitter: {
    card: "summary_large_image",
  },
  other: {
    "theme-color": "#030303",
    "format-detection": "telephone=no",
  },
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
