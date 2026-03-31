"use client";

import dynamic from "next/dynamic";

// Dynamically import Sidebar & Header with ssr:false to avoid Radix hydration mismatch
const Sidebar = dynamic(() => import("@/components/layout/sidebar"), {
  ssr: false,
  loading: () => (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-56 flex-col border-r bg-card sm:flex">
      <div className="flex flex-col gap-3 px-3 pt-4 pb-2">
        <div className="flex items-center gap-2 px-1">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary" />
          <span className="text-sm font-semibold text-transparent">GenAM Studio</span>
        </div>
        <div className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm">
          <div className="h-7 w-7 shrink-0 rounded-md bg-muted animate-pulse" />
          <div className="h-4 flex-1 rounded bg-muted animate-pulse" />
        </div>
      </div>
    </aside>
  ),
});

const Header = dynamic(() => import("@/components/layout/header"), {
  ssr: false,
  loading: () => (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border/50 bg-background/80 backdrop-blur-sm px-6 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:pt-6">
      <div className="sm:hidden h-9 w-9" />
      <div className="flex items-center gap-4 md:grow-0">
        <div className="h-7 w-24 rounded bg-muted animate-pulse hidden sm:block" />
      </div>
      <div className="flex w-full items-center gap-4 md:ml-auto md:flex-grow-0 md:justify-end">
        <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
      </div>
    </header>
  ),
});

export function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <div className="flex flex-1 flex-col sm:pl-56">
        <Header />
        {children}
      </div>
    </div>
  );
}
