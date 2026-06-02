"use client";

import { ThemeProvider, type ThemeProviderProps } from "@smg-automotive/components";
import Fonts from "@smg-automotive/components/fonts/hosted";
import type { ReactNode } from "react";

const autoScout24Theme = "autoscout24" as ThemeProviderProps["theme"];

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={autoScout24Theme}>
      <Fonts />
      {children}
    </ThemeProvider>
  );
}
