"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  ShoppingCart, MessageSquare, UserPlus, Clock, Gauge,
  ArrowRightLeft, Send, Bell, Bot, Zap, Filter,
} from "lucide-react";

const TRIGGER_ICONS: Record<string, any> = {
  order_created: ShoppingCart,
  order_status_changed: ArrowRightLeft,
  chat_keyword: MessageSquare,
  new_customer: UserPlus,
  schedule: Clock,
  token_limit: Gauge,
};

const ACTION_ICONS: Record<string, any> = {
  send_message: Send,
  update_order_status: ArrowRightLeft,
  notify_webhook: Bell,
  auto_reply: MessageSquare,
  assign_agent: Bot,
};

const NODE_STYLES: Record<string, { gradient: string; border: string; glow: string; iconBg: string }> = {
  trigger: {
    gradient: "from-blue-500/5 to-blue-600/10",
    border: "border-blue-500/30",
    glow: "shadow-blue-500/10",
    iconBg: "bg-blue-500/15 text-blue-500",
  },
  condition: {
    gradient: "from-amber-500/5 to-amber-600/10",
    border: "border-amber-500/30",
    glow: "shadow-amber-500/10",
    iconBg: "bg-amber-500/15 text-amber-500",
  },
  action: {
    gradient: "from-emerald-500/5 to-emerald-600/10",
    border: "border-emerald-500/30",
    glow: "shadow-emerald-500/10",
    iconBg: "bg-emerald-500/15 text-emerald-500",
  },
};

interface AutomationNodeData {
  nodeType: "trigger" | "condition" | "action";
  label: string;
  subLabel?: string;
  subType?: string;
  configured?: boolean;
}

function AutomationNodeComponent({ data, selected }: NodeProps & { data: AutomationNodeData }) {
  const style = NODE_STYLES[data.nodeType] || NODE_STYLES.trigger;
  const isCondition = data.nodeType === "condition";

  let Icon = Zap;
  if (data.nodeType === "trigger" && data.subType) {
    Icon = TRIGGER_ICONS[data.subType] || Zap;
  } else if (data.nodeType === "action" && data.subType) {
    Icon = ACTION_ICONS[data.subType] || Zap;
  } else if (isCondition) {
    Icon = Filter;
  }

  return (
    <div
      className={`
        relative rounded-2xl border-2 bg-gradient-to-br backdrop-blur-sm
        transition-all duration-300 cursor-pointer
        ${style.gradient} ${selected ? `${style.border} shadow-lg ${style.glow}` : "border-border/40 hover:border-border/70"}
        ${selected ? "scale-[1.02]" : "hover:scale-[1.01]"}
        min-w-[200px] max-w-[220px]
      `}
    >
      {/* Top label */}
      <div className={`px-3 py-1.5 rounded-t-xl text-[10px] font-semibold uppercase tracking-widest ${style.iconBg} text-center`}>
        {data.nodeType === "trigger" ? "Trigger" : data.nodeType === "condition" ? "Kondisi" : "Aksi"}
      </div>

      {/* Body */}
      <div className="p-4 space-y-2.5">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${style.iconBg}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-tight truncate">{data.label}</p>
            {data.subLabel && (
              <p className="text-[11px] text-muted-foreground font-light truncate mt-0.5">{data.subLabel}</p>
            )}
          </div>
        </div>

        {/* Status indicator */}
        <div className={`flex items-center gap-1.5 text-[10px] font-medium ${data.configured ? "text-emerald-500" : "text-muted-foreground"}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${data.configured ? "bg-emerald-500" : "bg-muted-foreground/30"}`} />
          {data.configured ? "Dikonfigurasi" : "Belum dikonfigurasi"}
        </div>
      </div>

      {/* Handles */}
      {data.nodeType !== "trigger" && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !rounded-full !border-2 !border-background !bg-primary/60"
        />
      )}
      {data.nodeType !== "action" && (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !rounded-full !border-2 !border-background !bg-primary/60"
        />
      )}
    </div>
  );
}

export const AutomationNode = memo(AutomationNodeComponent);
