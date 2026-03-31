"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home, Bot, Zap, Layout,
  Activity, Bell,
  Settings, MessageSquare,
  ShoppingBag,
  Package, UserCircle,
  Plug, User, LogOut, MoreHorizontal,
} from "lucide-react";

import { AppLogo } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useOrderBadge } from "@/components/providers/order-badge";
import { BusinessSwitcher } from "@/components/layout/business-switcher";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";

const navGroups = [
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

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const pendingOrders = useOrderBadge();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-56 flex-col border-r bg-card sm:flex">
      {/* Top: Logo + Business Switcher */}
      <div className="flex flex-col gap-3 px-3 pt-4 pb-2">
        <Link href="/dashboard" className="flex items-center gap-2 px-1">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <AppLogo className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-semibold">GenAM Studio</span>
        </Link>
        <BusinessSwitcher />
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {navGroups.map((group, gi) => (
          <div key={gi} className={gi > 0 ? "pt-4" : ""}>
            {group.label && (
              <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/50",
                    pathname.startsWith(item.href) && "bg-accent text-accent-foreground font-medium"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                  {item.href === "/orders" && pendingOrders > 0 && (
                    <span className="ml-auto flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                      {pendingOrders > 9 ? "9+" : pendingOrders}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <Separator />

      {/* Bottom: Settings + User */}
      <div className="px-3 py-3 space-y-1">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/50",
            pathname.startsWith("/settings") && "bg-accent text-accent-foreground font-medium"
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          <span>Pengaturan</span>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <User className="h-3 w-3" />
              </div>
              <span className="flex-1 truncate text-left">Akun</span>
              <MoreHorizontal className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-44">
            <DropdownMenuItem onClick={() => router.push("/akun")} className="text-xs gap-2">
              <User className="h-3 w-3" />
              Akun Saya
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-xs gap-2 text-destructive focus:text-destructive">
              <LogOut className="h-3 w-3" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
