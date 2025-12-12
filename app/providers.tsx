"use client";

import { ReactNode } from "react";
import { TierProvider } from "@/lib/tier";

export function Providers({ children }: { children: ReactNode }) {
  return <TierProvider>{children}</TierProvider>;
}
