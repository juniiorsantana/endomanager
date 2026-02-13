
"use client";

import Link from "next/link";
import {
  CircleDot,
  LayoutDashboard,
  Wrench,
  Users,
  Laptop,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  PanelLeft
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Sheet, SheetTrigger, SheetContent, SheetTitle } from "@/components/ui/sheet";

const navLinks = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/orders", icon: Wrench, label: "Ordens de Serviço" },
  { href: "/dashboard/clients", icon: Users, label: "Clientes" },
  { href: "/dashboard/equipment", icon: Laptop, label: "Equipamentos" },
  { href: "/dashboard/reports", icon: BarChart3, label: "Relatórios" },
];

const NavContent = ({ onNavigate }: { onNavigate?: () => void }) => {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <>
      <nav className="grid gap-2 text-lg font-medium">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-4 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
              pathname === link.href && "bg-accent text-accent-foreground"
            )}
          >
            <link.icon className="h-5 w-5" />
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto">
        <nav className="grid gap-2 text-lg font-medium">
          <Link
            href="/dashboard/settings"
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-4 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
              pathname === "/dashboard/settings" && "bg-accent text-accent-foreground"
            )}
          >
            <Settings className="h-5 w-5" />
            Configurações
          </Link>
          <Button
            variant="ghost"
            className="flex items-center gap-4 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary justify-start"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            Sair
          </Button>
        </nav>
      </div>
    </>
  )
};


export const MobileSidebar = () => {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="icon" variant="outline" className="sm:hidden">
          <PanelLeft className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="sm:max-w-xs flex flex-col">
        <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
        <Link
          href="/dashboard"
          className="group flex h-16 items-center gap-2 border-b text-lg font-semibold"
          onClick={() => setOpen(false)}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <CircleDot className="h-5 w-5 transition-all group-hover:scale-110" />
          </div>
          <span className="text-lg font-bold text-primary">Endoscam</span>
        </Link>
        <NavContent onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    // By adding the group/sidebar class to the html element, 
    // we can use group-data selectors in the main layout.
    root.classList.add('group/sidebar');
    root.dataset.sidebarOpen = isSidebarOpen ? 'true' : 'false';

    return () => {
      root.classList.remove('group/sidebar');
      delete root.dataset.sidebarOpen;
    }
  }, [isSidebarOpen]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-10 hidden flex-col border-r bg-card transition-all duration-300 ease-in-out sm:flex",
        isSidebarOpen ? "w-64" : "w-20"
      )}
    >
      <div className={cn("flex h-16 items-center border-b", isSidebarOpen ? "px-4 justify-between" : "px-4 justify-center")}>
        <Link
          href="/dashboard"
          className={cn("group flex items-center gap-2 font-semibold", !isSidebarOpen && "justify-center")}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <CircleDot className="h-5 w-5 transition-all group-hover:scale-110" />
          </div>
          {isSidebarOpen && (
            <span className="text-lg font-bold text-primary">Endoscam</span>
          )}
        </Link>
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className={cn("hidden sm:flex", !isSidebarOpen && "absolute -right-3 top-6 z-20 h-6 w-6 rounded-full border bg-background shadow-md")}>
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform",
              !isSidebarOpen && "rotate-180"
            )}
          />
        </Button>
      </div>

      <nav className="flex flex-1 flex-col gap-2 p-2">
        <TooltipProvider>
          {navLinks.map((link) => (
            <Tooltip key={link.href} delayDuration={isSidebarOpen ? 1000 : 0}>
              <TooltipTrigger asChild>
                <Link
                  href={link.href}
                  className={cn(
                    "flex h-10 items-center gap-3 rounded-lg px-3 text-muted-foreground transition-colors hover:text-foreground",
                    pathname === link.href && "bg-accent text-accent-foreground",
                    !isSidebarOpen && "justify-center"
                  )}
                >
                  <link.icon className="h-5 w-5 flex-shrink-0" />
                  {isSidebarOpen && (
                    <span className="truncate">{link.label}</span>
                  )}
                </Link>
              </TooltipTrigger>
              {!isSidebarOpen && (
                <TooltipContent side="right">{link.label}</TooltipContent>
              )}
            </Tooltip>
          ))}
        </TooltipProvider>
      </nav>

      <div className="mt-auto border-t p-2">
        <TooltipProvider>
          <Tooltip delayDuration={isSidebarOpen ? 1000 : 0}>
            <TooltipTrigger asChild>
              <Link
                href="/dashboard/settings"
                className={cn(
                  "flex h-10 items-center gap-3 rounded-lg px-3 text-muted-foreground transition-colors hover:text-foreground",
                  pathname === "/dashboard/settings" &&
                  "bg-accent text-accent-foreground",
                  !isSidebarOpen && "justify-center"
                )}
              >
                <Settings className="h-5 w-5 flex-shrink-0" />
                {isSidebarOpen && <span className="truncate">Configurações</span>}
              </Link>
            </TooltipTrigger>
            {!isSidebarOpen && (
              <TooltipContent side="right">Configurações</TooltipContent>
            )}
          </Tooltip>
          <Tooltip delayDuration={isSidebarOpen ? 1000 : 0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "flex h-10 w-full items-center gap-3 rounded-lg px-3 text-muted-foreground transition-colors hover:text-foreground",
                  !isSidebarOpen && "justify-center"
                )}
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5 flex-shrink-0" />
                {isSidebarOpen && <span className="truncate">Sair</span>}
              </Button>
            </TooltipTrigger>
            {!isSidebarOpen && (
              <TooltipContent side="right">Sair</TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className={cn("hidden", !isSidebarOpen ? "sm:flex w-full mt-2" : "sm:hidden")}>
          <ChevronLeft className="h-5 w-5 transition-transform rotate-180" />
        </Button>
      </div>
    </aside>
  );
}
