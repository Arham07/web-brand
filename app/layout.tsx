import type { Metadata } from "next";
import {
  DM_Sans,
  Zalando_Sans_SemiExpanded,
  Bitcount_Grid_Single,
} from "next/font/google";

import "../styles/tokens.css";
import "../styles/base.css";

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
  title: "核點 Nudot Studio｜台中網頁設計 × 品牌視覺升級 × 動態特效",
  description:
    "專注於台中網頁設計的頂尖團隊——核點設計 NUDOT。我們深耕高階網頁設計、動態特效設計與品牌視覺升級。結合流體極簡美學與高階前端技術，為企業打造具備國際大器格局的沉浸式互動網站，讓數位體驗成為您最強的商業資產。",
  metadataBase: new URL("https://nudot.com.tw"),
  openGraph: {
    type: "website",
    url: "https://nudot.com.tw/",
    title: "核點設計 NUDOT｜台中網頁設計 × 動態特效設計 × 品牌視覺升級",
    description:
      "專注於台中網頁設計的頂尖團隊——核點設計 NUDOT。深耕高階網頁設計、動態特效設計與品牌視覺升級，為企業打造具備國際大器格局的沉浸式互動網站。",
    images: ["/images/og.jpg"],
    locale: "zh_TW",
    siteName: "核點設計 NUDOT",
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
      lang="zh-TW"
      suppressHydrationWarning
      className={`${dmSans.variable} ${zalando.variable} ${bitcount.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
