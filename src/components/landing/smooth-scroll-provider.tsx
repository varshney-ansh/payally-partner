"use client";

import React, { useEffect } from "react";
import Lenis from "lenis";

export function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: true,
      duration: 1.1,
      wheelMultiplier: 0.95,
    });

    return () => {
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}