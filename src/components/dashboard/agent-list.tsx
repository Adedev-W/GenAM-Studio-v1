"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bot, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/common/empty-state";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";

interface Agent {
  id: string;
  name: string;
  slug: string;
  status: string;
  updated_at: string;
}

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  inactive: "bg-muted/50 text-muted-foreground border-border/30",
  draft: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  error: "bg-red-500/10 text-red-500 border-red-500/20",
};

export function AgentList() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    apiFetch<Agent[]>('/api/agents?limit=5')
      .then(data => setAgents(Array.isArray(data) ? data.slice(0, 5) : []))
      .catch((err) => {
        if (err && typeof err === 'object' && 'title' in err) {
          toast({ title: err.title, description: err.message, variant: "destructive" });
        }
      })
      .finally(() => setLoading(false));
  }, [toast]);

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-semibold">Recent Agents</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/agents" className="text-xs text-muted-foreground">View all</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-12 rounded-lg bg-muted/30 animate-pulse" />
            ))}
          </div>
        ) : agents.length === 0 ? (
          <EmptyState
            icon={Bot}
            title="No agents yet"
            description="Create your first agent to get started"
          >
            <Button size="sm" asChild><Link href="/agents">Create Agent</Link></Button>
          </EmptyState>
        ) : (
          <div className="space-y-2">
            {agents.map(agent => (
              <div key={agent.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{agent.name}</p>
                    <p className="text-xs text-muted-foreground font-light">
                      Updated {new Date(agent.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-xs ${statusColors[agent.status] || statusColors.inactive}`}>
                    {agent.status}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                    <Link href={`/agents/${agent.id}`}><ExternalLink className="h-3.5 w-3.5" /></Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
