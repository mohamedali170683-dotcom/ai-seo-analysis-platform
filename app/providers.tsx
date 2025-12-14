"use client";

import { ReactNode } from "react";
import { TierProvider } from "@/lib/tier";
import { TierSwitcher } from "@/components/TierSwitcher";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <TierProvider>
      {children}
      {/* Prototype mode: Tier switcher for testing */}
      <TierSwitcher />
    </TierProvider>
  );
}
