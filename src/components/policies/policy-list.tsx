"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";

interface Policy {
  id: string;
  name: string;
  condition: string;
  action: string;
  priority: number;
  is_active: boolean;
}

const actionColors: Record<string, string> = {
  SCALE_AGENT_UP: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  SCALE_AGENT_DOWN: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  PAUSE_AGENT: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  RESUME_AGENT: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  RESTART_AGENT: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  SEND_ALERT_TO_SLACK: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  SEND_ALERT_TO_EMAIL: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
};

export function PolicyList() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/policies')
      .then(r => r.json())
      .then(data => setPolicies(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Active Policies</CardTitle>
        <CardDescription className="font-light">Governance rules applied to your agents</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-10 bg-muted/20 rounded animate-pulse" />)}
          </div>
        ) : policies.length === 0 ? (
          <EmptyState icon={Shield} title="No policies yet" description="Create governance policies to control agent behavior" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border/30">
                <TableHead className="text-xs font-medium">Name</TableHead>
                <TableHead className="text-xs font-medium">Condition</TableHead>
                <TableHead className="text-xs font-medium">Action</TableHead>
                <TableHead className="text-xs font-medium">Priority</TableHead>
                <TableHead className="text-xs font-medium">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {policies.map(p => (
                <TableRow key={p.id} className="border-border/30">
                  <TableCell className="text-sm font-medium">{p.name}</TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground max-w-[200px] truncate">{p.condition}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs ${actionColors[p.action] || 'bg-muted/30 text-muted-foreground'}`}>
                      {p.action?.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{p.priority}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={p.is_active ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs" : "bg-muted/30 text-muted-foreground text-xs"}>
                      {p.is_active ? "active" : "inactive"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
