"use client";

import type { ReactNode } from "react";
import { SWRConfig } from "swr";
import { dashboardSwrConfig } from "@/lib/swr";

export function SWRProvider({ children }: { children: ReactNode }) {
  return <SWRConfig value={dashboardSwrConfig}>{children}</SWRConfig>;
}
