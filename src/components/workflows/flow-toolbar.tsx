"use client";

import {
  ZoomIn, ZoomOut, Maximize2, RotateCcw, Lock, Unlock,
} from "lucide-react";
import { useReactFlow } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface FlowToolbarProps {
  locked: boolean;
  onToggleLock: () => void;
}

export function FlowToolbar({ locked, onToggleLock }: FlowToolbarProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 px-2 py-1.5 rounded-xl border border-border/50 bg-background/80 backdrop-blur-md shadow-lg">
      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => zoomIn({ duration: 200 })}>
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => zoomOut({ duration: 200 })}>
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => fitView({ duration: 300, padding: 0.3 })}>
        <Maximize2 className="h-4 w-4" />
      </Button>
      <Separator orientation="vertical" className="h-5 mx-1" />
      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={onToggleLock}>
        {locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
      </Button>
    </div>
  );
}
