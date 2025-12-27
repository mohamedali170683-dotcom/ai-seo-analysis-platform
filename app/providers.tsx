"use client";

import { ReactNode } from "react";
import { TierProvider } from "@/lib/tier";
import { TierSwitcher } from "@/components/TierSwitcher";
import { ThemeProvider } from "@/lib/theme-context";
import { I18nProvider } from "@/lib/i18n-context";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <TierProvider>
          {children}
          {/* Prototype mode: Tier switcher for testing */}
          <TierSwitcher />
        </TierProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
