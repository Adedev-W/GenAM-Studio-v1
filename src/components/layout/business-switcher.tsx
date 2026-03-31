"use client";

import { useRouter } from "next/navigation";
import { ChevronsUpDown, Check, Plus } from "lucide-react";
import { useBusiness } from "@/contexts/business-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function BusinessSwitcher() {
  const router = useRouter();
  const { business, businesses, switchBusiness } = useBusiness();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-muted/50 transition-colors">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-semibold">
            {business?.name?.charAt(0).toUpperCase() || "B"}
          </div>
          <span className="flex-1 truncate text-sm font-medium">{business?.name || "Bisnis"}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        {businesses.map((b) => (
          <DropdownMenuItem
            key={b.id}
            onClick={() => switchBusiness(b.id)}
            className={cn("gap-2 text-xs", b.id === business?.id && "font-medium")}
          >
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/10 text-primary text-[10px] font-semibold">
              {b.name.charAt(0).toUpperCase()}
            </div>
            <span className="flex-1 truncate">{b.name}</span>
            {b.id === business?.id && <Check className="h-3 w-3 shrink-0 text-primary" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/buat-bisnis")} className="gap-2 text-xs text-muted-foreground">
          <Plus className="h-3.5 w-3.5" />
          Buat Bisnis Baru
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
