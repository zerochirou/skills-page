import type { ReactNode } from "react";
import { Footer } from "@/components/commons/footer";
import { Navbar } from "@/components/commons/navbar";

export interface HomeTemplateProps {
  children: ReactNode;
}

export function HomeTemplate({ children }: HomeTemplateProps) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas pt-16 text-ink">
      <Navbar />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
