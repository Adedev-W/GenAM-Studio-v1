import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  running: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  compliant: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  ready: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  done: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  processed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",

  draft: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  inactive: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  idle: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  pending: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  todo: "bg-slate-500/10 text-slate-400 border-slate-500/20",

  paused: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  in_progress: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  in_review: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  acknowledged: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  processing: "bg-amber-500/10 text-amber-500 border-amber-500/20",

  error: "bg-red-500/10 text-red-500 border-red-500/20",
  errored: "bg-red-500/10 text-red-500 border-red-500/20",
  failed: "bg-red-500/10 text-red-500 border-red-500/20",
  non_compliant: "bg-red-500/10 text-red-500 border-red-500/20",
  critical: "bg-red-500/10 text-red-500 border-red-500/20",

  archived: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  stopped: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  resolved: "bg-blue-500/10 text-blue-400 border-blue-500/20",

  high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = statusStyles[status] || "bg-muted text-muted-foreground border-border";
  return (
    <Badge
      variant="outline"
      className={cn("font-medium text-xs capitalize", style, className)}
    >
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
