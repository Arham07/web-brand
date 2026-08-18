"use client";

import { useEffect, useState } from "react";
import ScrollMarquee from "@/components/shared/ScrollMarquee";

/**
 * W-05: the band used to read "COMING SOON", which is a promise about the
 * studio. This reads as availability, which is a reason to act now.
 *
 * EDIT THIS when the month's capacity changes — scarcity only works while
 * it is true, and a number nobody maintains is the fastest way to lose the
 * trust the rest of the page is buying.
 */
const SLOTS_LEFT = 3;

/**
 * The month is resolved in the browser, not at build time: this site is
 * exported statically, so a month baked into the HTML would still say
 * "NOW BOOKING AUGUST" in November. The server-rendered fallback is the
 * month-free phrase, which keeps hydration identical and is never wrong.
 */
export default function BookingMarquee() {
  const [word, setWord] = useState("NOW BOOKING");

  useEffect(() => {
    const month = new Date()
      .toLocaleString("en-US", { month: "long" })
      .toUpperCase();
    setWord(`NOW BOOKING ${month} · ${SLOTS_LEFT} SLOTS LEFT`);
  }, []);

  return <ScrollMarquee word={word} repeat={5} />;
}
