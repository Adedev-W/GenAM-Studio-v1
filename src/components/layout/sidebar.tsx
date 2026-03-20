"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Bot, Zap, Layout,
  Bell, Activity,
  Plug,
  Settings,
  MessageSquare,
  Package, UserCircle,
} from "lucide-react";

import { AppLogo } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useOrderBadge } from "@/components/providers/order-badge";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

const navGroups = [
  {
    items: [
      { href: "/dashboard", icon: Home, label: "Dashboard" },
    ],
  },
  {
    label: "Build",
    items: [
      { href: "/agents", icon: Bot, label: "Agents" },
      { href: "/chat", icon: MessageSquare, label: "Chat" },
      { href: "/workflows", icon: Zap, label: "Automasi" },
      { href: "/canvas", icon: Layout, label: "Canvas" },
    ],
  },
  {
    label: "Bisnis",
    items: [
      { href: "/customers", icon: UserCircle, label: "Pelanggan" },
      { href: "/orders", icon: Package, label: "Pesanan" },
    ],
  },
  {
    label: "Monitor",
    items: [
      { href: "/alerts", icon: Bell, label: "Alerts" },
      { href: "/usage", icon: Activity, label: "Usage" },
    ],
  },
  {
    label: "Connect",
    items: [
      { href: "/integrations", icon: Plug, label: "Integrations" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const pendingOrders = useOrderBadge();

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-card sm:flex">
      <nav className="flex flex-col items-center gap-1 px-2 sm:py-4">
        <Link
          href="/dashboard"
          className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base mb-3"
        >
          <AppLogo className="h-4 w-4 transition-all group-hover:scale-110" />
          <span className="sr-only">GenAM Studio</span>
        </Link>

        <TooltipProvider delayDuration={0}>
          {navGroups.map((group, gi) => (
            <div key={gi} className="flex flex-col items-center gap-1 w-full">
              {gi > 0 && <Separator className="my-1.5 w-6" />}
              {group.items.map((item) => (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/50",
                        pathname.startsWith(item.href) && "bg-accent text-accent-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.href === "/orders" && pendingOrders > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-bold text-destructive-foreground">
                          {pendingOrders > 9 ? "9+" : pendingOrders}
                        </span>
                      )}
                      <span className="sr-only">{item.label}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          ))}
        </TooltipProvider>
      </nav>

      <nav className="mt-auto flex flex-col items-center gap-2 px-2 sm:py-4">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/settings"
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/50",
                  pathname.startsWith("/settings") && "bg-accent text-accent-foreground"
                )}
              >
                <Settings className="h-4 w-4" />
                <span className="sr-only">Settings</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">Settings</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </nav>
    </aside>
  );
}
