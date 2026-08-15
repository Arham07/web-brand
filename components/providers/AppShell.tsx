"use client";

import { useEffect, type ReactNode } from "react";
import dynamic from "next/dynamic";

import ScrollProvider from "./ScrollProvider";
import TransitionProvider from "./TransitionProvider";
import Loader from "@/components/chrome/Loader";
import FixedLogo from "@/components/chrome/FixedLogo";
import ScrollNav from "@/components/chrome/ScrollNav";
import ScrollProgress from "@/components/chrome/ScrollProgress";
import FloatingCta from "@/components/chrome/FloatingCta";
import { initLazyMedia, initVideoPlaybackManager } from "@/lib/lazy-media";

const Cursor = dynamic(() => import("@/components/chrome/Cursor"), { ssr: false });
const FilmGrain = dynamic(() => import("@/components/chrome/FilmGrain"), { ssr: false });

export default function AppShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    initLazyMedia();
    initVideoPlaybackManager();
  }, []);

  return (
    <>
      <ScrollProvider />
      <TransitionProvider />
      <ScrollProgress />
      <FixedLogo />
      <ScrollNav />
      <FloatingCta />
      <Loader />
      {children}
      <Cursor />
      <FilmGrain />
    </>
  );
}
