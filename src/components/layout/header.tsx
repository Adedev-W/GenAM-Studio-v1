"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  BrainCircuit,
  FileClock,
  Home,
  PanelLeft,
  Settings,
  Shapes,
  User,
  Package,
  UserCircle,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { AppLogo } from "@/components/icons";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/agents", icon: Shapes, label: "Agents" },
  { href: "/orders", icon: Package, label: "Pesanan" },
  { href: "/customers", icon: UserCircle, label: "Pelanggan" },
  { href: "/alerts", icon: Bell, label: "Alerts" },
  { href: "/audit", icon: FileClock, label: "Audit Trail" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const pageTitle = navItems.find(item => pathname.startsWith(item.href))?.label || "Dashboard";

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border/50 bg-background/80 backdrop-blur-sm px-6 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:pt-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="ghost" className="sm:hidden h-9 w-9 bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary">
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              href="/dashboard"
              className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
            >
              <AppLogo className="h-5 w-5 transition-all group-hover:scale-110" />
              <span className="sr-only">GenAM Studio</span>
            </Link>
            {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn("flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground", pathname.startsWith(item.href) && "text-foreground")}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
      
      <div className="flex items-center gap-4 md:grow-0">
         <h1 className="text-xl font-semibold hidden sm:block">{pageTitle}</h1>
      </div>


      <div className="flex w-full items-center gap-4 md:ml-auto md:flex-grow-0 md:justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="overflow-hidden rounded-full h-9 w-9 bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary"
            >
              <User className="h-4.5 w-4.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild><Link href="/settings">Settings</Link></DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
