"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ShoppingCart, MessageSquare, UserPlus, Clock, Gauge,
  ArrowRightLeft, Send, Bell, Bot, Zap, Filter,
} from "lucide-react";

const TRIGGER_OPTIONS = [
  { value: "order_created", label: "Pesanan Masuk", icon: ShoppingCart },
  { value: "order_status_changed", label: "Status Pesanan Berubah", icon: ArrowRightLeft },
  { value: "chat_keyword", label: "Keyword di Chat", icon: MessageSquare },
  { value: "new_customer", label: "Pelanggan Baru", icon: UserPlus },
  { value: "schedule", label: "Jadwal", icon: Clock },
  { value: "token_limit", label: "Token Limit", icon: Gauge },
];

const ACTION_OPTIONS = [
  { value: "send_message", label: "Kirim Pesan", icon: Send },
  { value: "update_order_status", label: "Update Status Order", icon: ArrowRightLeft },
  { value: "notify_webhook", label: "Notify Webhook", icon: Bell },
  { value: "auto_reply", label: "Balas Otomatis", icon: MessageSquare },
  { value: "assign_agent", label: "Assign Agent", icon: Bot },
];

const ORDER_STATUSES = ["pending", "confirmed", "paid", "processing", "completed", "cancelled"];
const SCHEDULE_FREQ = [
  { value: "daily", label: "Setiap Hari" },
  { value: "weekly", label: "Setiap Minggu" },
  { value: "monthly", label: "Setiap Bulan" },
];

interface ConfigPanelProps {
  nodeType: "trigger" | "condition" | "action";
  triggerType: string;
  triggerConfig: any;
  conditionField: string;
  conditionOperator: string;
  conditionValue: string;
  actionType: string;
  actionConfig: any;
  agents: any[];
  onChange: (field: string, value: any) => void;
}

export function ConfigPanel({
  nodeType, triggerType, triggerConfig, conditionField,
  conditionOperator, conditionValue, actionType, actionConfig,
  agents, onChange,
}: ConfigPanelProps) {
  if (nodeType === "trigger") return (
    <TriggerConfig
      type={triggerType}
      config={triggerConfig}
      onChange={onChange}
    />
  );
  if (nodeType === "condition") return (
    <ConditionConfig
      field={conditionField}
      operator={conditionOperator}
      value={conditionValue}
      onChange={onChange}
    />
  );
  return (
    <ActionConfig
      type={actionType}
      config={actionConfig}
      agents={agents}
      onChange={onChange}
    />
  );
}

function TriggerConfig({ type, config, onChange }: { type: string; config: any; onChange: (f: string, v: any) => void }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipe Trigger</Label>
        <Select value={type || ""} onValueChange={v => { onChange("trigger_type", v); onChange("trigger_config", {}); }}>
          <SelectTrigger className="h-9"><SelectValue placeholder="Pilih trigger..." /></SelectTrigger>
          <SelectContent>
            {TRIGGER_OPTIONS.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {type === "order_status_changed" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs">Dari Status</Label>
            <Select value={config?.from_status || ""} onValueChange={v => onChange("trigger_config", { ...config, from_status: v })}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Semua" /></SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Ke Status</Label>
            <Select value={config?.to_status || ""} onValueChange={v => onChange("trigger_config", { ...config, to_status: v })}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Semua" /></SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {type === "chat_keyword" && (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs">Keyword</Label>
            <Input
              placeholder="contoh: komplain, stok habis"
              value={config?.keyword || ""}
              onChange={e => onChange("trigger_config", { ...config, keyword: e.target.value })}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Tipe Pencocokan</Label>
            <Select value={config?.match_type || "contains"} onValueChange={v => onChange("trigger_config", { ...config, match_type: v })}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="contains">Mengandung</SelectItem>
                <SelectItem value="exact">Persis sama</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {type === "schedule" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs">Frekuensi</Label>
            <Select value={config?.frequency || "daily"} onValueChange={v => onChange("trigger_config", { ...config, frequency: v })}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SCHEDULE_FREQ.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Jam</Label>
            <Input
              type="time"
              value={config?.time || "08:00"}
              onChange={e => onChange("trigger_config", { ...config, time: e.target.value })}
              className="h-9"
            />
          </div>
        </div>
      )}

      {type === "token_limit" && (
        <div className="space-y-2">
          <Label className="text-xs">Threshold (%)</Label>
          <Input
            type="number"
            min={1}
            max={100}
            placeholder="80"
            value={config?.threshold_percent || ""}
            onChange={e => onChange("trigger_config", { ...config, threshold_percent: parseInt(e.target.value) || "" })}
            className="h-9"
          />
        </div>
      )}
    </div>
  );
}

function ConditionConfig({ field, operator, value, onChange }: {
  field: string; operator: string; value: string;
  onChange: (f: string, v: any) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground font-light">Kondisi opsional — jika tidak diisi, aksi akan selalu dijalankan.</p>
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Field</Label>
        <Select value={field || ""} onValueChange={v => onChange("condition_field", v)}>
          <SelectTrigger className="h-9"><SelectValue placeholder="Pilih field..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="order.total">Total Pesanan</SelectItem>
            <SelectItem value="order.item_count">Jumlah Item</SelectItem>
            <SelectItem value="order.status">Status Pesanan</SelectItem>
            <SelectItem value="customer.order_count">Total Order Pelanggan</SelectItem>
            <SelectItem value="usage.token_percent">Token Usage (%)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs">Operator</Label>
          <Select value={operator || ""} onValueChange={v => onChange("condition_operator", v)}>
            <SelectTrigger className="h-9"><SelectValue placeholder="..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="<">Kurang dari</SelectItem>
              <SelectItem value=">">Lebih dari</SelectItem>
              <SelectItem value="=">Sama dengan</SelectItem>
              <SelectItem value="contains">Mengandung</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Nilai</Label>
          <Input
            placeholder="contoh: 100000"
            value={value || ""}
            onChange={e => onChange("condition_value", e.target.value)}
            className="h-9"
          />
        </div>
      </div>
    </div>
  );
}

function ActionConfig({ type, config, agents, onChange }: {
  type: string; config: any; agents: any[];
  onChange: (f: string, v: any) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipe Aksi</Label>
        <Select value={type || ""} onValueChange={v => { onChange("action_type", v); onChange("action_config", {}); }}>
          <SelectTrigger className="h-9"><SelectValue placeholder="Pilih aksi..." /></SelectTrigger>
          <SelectContent>
            {ACTION_OPTIONS.map(a => (
              <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(type === "send_message" || type === "auto_reply") && (
        <div className="space-y-2">
          <Label className="text-xs">Pesan</Label>
          <Textarea
            placeholder="Tulis pesan yang akan dikirim..."
            value={config?.message || ""}
            onChange={e => onChange("action_config", { ...config, message: e.target.value })}
            rows={3}
          />
        </div>
      )}

      {type === "update_order_status" && (
        <div className="space-y-2">
          <Label className="text-xs">Status Baru</Label>
          <Select value={config?.new_status || ""} onValueChange={v => onChange("action_config", { ...config, new_status: v })}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Pilih status..." /></SelectTrigger>
            <SelectContent>
              {["confirmed", "paid", "processing", "completed", "cancelled"].map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {type === "notify_webhook" && (
        <div className="space-y-2">
          <Label className="text-xs">Webhook URL</Label>
          <Input
            placeholder="https://..."
            value={config?.webhook_url || ""}
            onChange={e => onChange("action_config", { ...config, webhook_url: e.target.value })}
            className="h-9"
          />
        </div>
      )}

      {(type === "auto_reply" || type === "assign_agent") && (
        <div className="space-y-2">
          <Label className="text-xs">Agent</Label>
          <Select value={config?.agent_id || ""} onValueChange={v => onChange("action_config", { ...config, agent_id: v })}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Pilih agent..." /></SelectTrigger>
            <SelectContent>
              {agents.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
