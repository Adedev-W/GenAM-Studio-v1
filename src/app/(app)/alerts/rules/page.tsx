"use client";

import { useState } from "react";
import { Plus, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/common/empty-state";

interface AlertRule {
  id: string;
  name: string;
  metric: string;
  operator: string;
  threshold: number;
  severity: string;
  agent: string;
  is_active: boolean;
  channels: string[];
}

const metrics = ["CPU_USAGE", "MEMORY_USAGE", "ERROR_RATE", "LATENCY", "TOKEN_USAGE", "COST"];
const operators = [
  { value: ">", label: "Greater than" },
  { value: ">=", label: "Greater than or equal" },
  { value: "<", label: "Less than" },
  { value: "<=", label: "Less than or equal" },
  { value: "==", label: "Equal to" },
];
const severities = ["critical", "high", "medium", "low"];
const notificationChannels = ["Email", "Slack", "Webhook", "SMS"];
const agents = ["All Agents", "Customer Support Bot", "Data Analyzer", "Code Review Agent", "Content Writer", "Sales Outreach"];

const metricLabels: Record<string, string> = {
  CPU_USAGE: "CPU Usage (%)",
  MEMORY_USAGE: "Memory Usage (%)",
  ERROR_RATE: "Error Rate (%)",
  LATENCY: "Latency (ms)",
  TOKEN_USAGE: "Token Usage",
  COST: "Cost ($)",
};

const initialRules: AlertRule[] = [
  {
    id: "rule_1",
    name: "High Error Rate",
    metric: "ERROR_RATE",
    operator: ">",
    threshold: 5,
    severity: "critical",
    agent: "All Agents",
    is_active: true,
    channels: ["Email", "Slack"],
  },
  {
    id: "rule_2",
    name: "Latency Spike",
    metric: "LATENCY",
    operator: ">",
    threshold: 2000,
    severity: "high",
    agent: "All Agents",
    is_active: true,
    channels: ["Slack"],
  },
  {
    id: "rule_3",
    name: "Token Budget Warning",
    metric: "TOKEN_USAGE",
    operator: ">",
    threshold: 100000,
    severity: "medium",
    agent: "Content Writer",
    is_active: true,
    channels: ["Email"],
  },
  {
    id: "rule_4",
    name: "Cost Threshold",
    metric: "COST",
    operator: ">=",
    threshold: 50,
    severity: "high",
    agent: "All Agents",
    is_active: false,
    channels: ["Email", "Slack", "Webhook"],
  },
];

export default function AlertRulesPage() {
  const [rules, setRules] = useState<AlertRule[]>(initialRules);
  const [createOpen, setCreateOpen] = useState(false);

  const [formName, setFormName] = useState("");
  const [formMetric, setFormMetric] = useState("");
  const [formOperator, setFormOperator] = useState(">");
  const [formThreshold, setFormThreshold] = useState("");
  const [formSeverity, setFormSeverity] = useState("medium");
  const [formAgent, setFormAgent] = useState("All Agents");
  const [formChannels, setFormChannels] = useState<string[]>([]);

  const resetForm = () => {
    setFormName("");
    setFormMetric("");
    setFormOperator(">");
    setFormThreshold("");
    setFormSeverity("medium");
    setFormAgent("All Agents");
    setFormChannels([]);
  };

  const handleCreate = () => {
    const newRule: AlertRule = {
      id: `rule_${Date.now()}`,
      name: formName,
      metric: formMetric,
      operator: formOperator,
      threshold: parseFloat(formThreshold),
      severity: formSeverity,
      agent: formAgent,
      is_active: true,
      channels: formChannels,
    };
    setRules([...rules, newRule]);
    setCreateOpen(false);
    resetForm();
  };

  const toggleActive = (id: string) => {
    setRules(rules.map((r) => (r.id === id ? { ...r, is_active: !r.is_active } : r)));
  };

  const toggleChannel = (channel: string) => {
    setFormChannels((prev) =>
      prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Alert Rules" description="Configure automated alerting rules for your agents">
        <Button variant="ghost" size="sm" className="bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary font-medium" onClick={() => { resetForm(); setCreateOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Create Rule
        </Button>
      </PageHeader>

      {rules.length === 0 ? (
        <EmptyState icon={Shield} title="No alert rules" description="Create your first alert rule to start monitoring your agents">
          <Button variant="ghost" size="sm" className="bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary font-medium" onClick={() => { resetForm(); setCreateOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Create Rule
          </Button>
        </EmptyState>
      ) : (
        <Card className="border-border/50">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-medium">Name</TableHead>
                  <TableHead className="font-medium">Metric</TableHead>
                  <TableHead className="font-medium">Condition</TableHead>
                  <TableHead className="font-medium">Severity</TableHead>
                  <TableHead className="font-medium">Agent</TableHead>
                  <TableHead className="font-medium">Channels</TableHead>
                  <TableHead className="font-medium text-center">Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-semibold text-sm">{rule.name}</TableCell>
                    <TableCell className="text-sm font-light text-muted-foreground">
                      {metricLabels[rule.metric] || rule.metric}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs font-mono bg-muted/50 px-2 py-1 rounded">
                        {rule.operator} {rule.threshold}
                      </code>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={rule.severity} />
                    </TableCell>
                    <TableCell className="text-sm font-light">{rule.agent}</TableCell>
                    <TableCell className="text-xs font-light text-muted-foreground">
                      {rule.channels.join(", ")}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={() => toggleActive(rule.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={createOpen} onOpenChange={(open) => { if (!open) { setCreateOpen(false); resetForm(); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-semibold">Create Alert Rule</DialogTitle>
            <DialogDescription className="font-light">
              Define conditions that will trigger alerts for your agents
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-medium text-sm">Rule Name</Label>
              <Input placeholder="e.g., High Error Rate" value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-medium text-sm">Metric</Label>
                <Select value={formMetric} onValueChange={setFormMetric}>
                  <SelectTrigger><SelectValue placeholder="Select metric" /></SelectTrigger>
                  <SelectContent>
                    {metrics.map((m) => (
                      <SelectItem key={m} value={m}>{metricLabels[m] || m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-sm">Severity</Label>
                <Select value={formSeverity} onValueChange={setFormSeverity}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {severities.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-medium text-sm">Operator</Label>
                <Select value={formOperator} onValueChange={setFormOperator}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {operators.map((op) => (
                      <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-sm">Threshold</Label>
                <Input type="number" placeholder="e.g., 5" value={formThreshold} onChange={(e) => setFormThreshold(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-medium text-sm">Agent</Label>
              <Select value={formAgent} onValueChange={setFormAgent}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {agents.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-medium text-sm">Notification Channels</Label>
              <div className="flex flex-wrap gap-4 pt-1">
                {notificationChannels.map((ch) => (
                  <div key={ch} className="flex items-center gap-2">
                    <Checkbox
                      id={`ch-${ch}`}
                      checked={formChannels.includes(ch)}
                      onCheckedChange={() => toggleChannel(ch)}
                    />
                    <label htmlFor={`ch-${ch}`} className="text-sm font-light cursor-pointer">
                      {ch}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button variant="ghost" className="bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary" onClick={handleCreate} disabled={!formName || !formMetric || !formThreshold}>
              Create Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
