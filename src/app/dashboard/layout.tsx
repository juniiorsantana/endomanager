
"use client";

import AppSidebar, { MobileSidebar } from "@/components/shared/app-sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <AppSidebar />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-20">
         <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <MobileSidebar />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 transition-all duration-300 ease-in-out sm:pl-8 group-data-[sidebar-open=true]/sidebar:sm:pl-64 md:gap-8 md:p-8">
            {children}
        </main>
      </div>
    </div>
  );
}
