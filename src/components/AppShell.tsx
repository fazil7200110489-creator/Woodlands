"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import SmoothScroll from "@/app/providers/SmoothScroll";
import Loader from "@/components/Loader";

const CustomCursor = dynamic(() => import("@/components/Cursor"), { ssr: false });
const PageTransition = dynamic(() => import("@/components/PageTransition"), { ssr: false });

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <SmoothScroll>
      {!loaded && <Loader onComplete={() => setLoaded(true)} />}
      <CustomCursor />
      <PageTransition>{children}</PageTransition>
    </SmoothScroll>
  );
}
