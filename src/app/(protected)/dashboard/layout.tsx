import { Suspense, type ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SWRProvider } from "@/components/providers/swr-provider";
import { Sidebar, SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { EditorSidebarProvider } from "@/features/skills/context/editor-sidebar-context";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SWRProvider>
      <EditorSidebarProvider>
        <SidebarProvider className="h-svh overflow-hidden overscroll-none">
          <Suspense fallback={<Sidebar variant="inset" />}>
            <AppSidebar />
          </Suspense>
          <SidebarInset className="min-h-0 overflow-hidden">
            <Suspense
              fallback={
                <header className="h-14 shrink-0 border-b border-border" />
              }
            >
              <DashboardHeader />
            </Suspense>
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain p-4 md:p-6">
              <Suspense
                fallback={
                  <div className="flex flex-col gap-4">
                    <Skeleton className="h-8 w-56" />
                    <Skeleton className="h-64 w-full rounded-[12px]" />
                  </div>
                }
              >
                {children}
              </Suspense>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </EditorSidebarProvider>
    </SWRProvider>
  );
}
