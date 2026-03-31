"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home, Bot, Zap, Layout,
  PanelLeft, User,
  Package, UserCircle,
  ShoppingBag, MessageSquare,
  Activity, Bell, Plug, Settings,
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

const mobileNavGroups = [
  {
    items: [
      { href: "/dashboard", icon: Home, label: "Dashboard" },
    ],
  },
  {
    label: "Toko",
    items: [
      { href: "/products", icon: ShoppingBag, label: "Produk" },
      { href: "/customers", icon: UserCircle, label: "Pelanggan" },
      { href: "/orders", icon: Package, label: "Pesanan" },
    ],
  },
  {
    label: "Otomasi",
    items: [
      { href: "/agents", icon: Bot, label: "Agen" },
      { href: "/workflows", icon: Zap, label: "Alur Kerja" },
      { href: "/canvas", icon: Layout, label: "Kanvas" },
      { href: "/chat", icon: MessageSquare, label: "Percakapan" },
    ],
  },
  {
    label: "Sistem",
    items: [
      { href: "/integrations", icon: Plug, label: "Integrasi" },
      { href: "/usage", icon: Activity, label: "Pemakaian" },
      { href: "/alerts/rules", icon: Bell, label: "Peringatan" },
    ],
  },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const allItems = mobileNavGroups.flatMap(g => g.items);
  const pageTitle = allItems.find(item => pathname.startsWith(item.href))?.label || "Dashboard";

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border/50 bg-background/80 backdrop-blur-sm px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:pt-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="ghost" className="sm:hidden h-9 w-9 bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary">
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          <SheetTitle className="sr-only">Navigasi</SheetTitle>
          <nav className="flex flex-col gap-4 text-sm">
            <Link
              href="/dashboard"
              className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
            >
              <AppLogo className="h-5 w-5 transition-all group-hover:scale-110" />
              <span className="sr-only">GenAM Studio</span>
            </Link>
            {mobileNavGroups.map((group, gi) => (
              <div key={gi} className="space-y-1">
                {group.label && (
                  <p className="px-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    {group.label}
                  </p>
                )}
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground",
                      pathname.startsWith(item.href) && "text-foreground font-medium"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ))}
              </div>
            ))}
            <div className="border-t pt-2 space-y-1">
              <Link href="/settings" className="flex items-center gap-3 px-2.5 py-1.5 text-muted-foreground hover:text-foreground">
                <Settings className="h-4 w-4" /> Pengaturan
              </Link>
            </div>
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
            <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild><Link href="/akun">Profil</Link></DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">Keluar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
