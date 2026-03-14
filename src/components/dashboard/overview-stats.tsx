import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
import { Activity, CheckCircle, AlertTriangle, Cpu, CircleOff } from "lucide-react";
import { agents } from "@/lib/data";
  
  export default function OverviewStats() {
    const totalAgents = agents.length;
    const runningAgents = agents.filter(a => a.status === 'running').length;
    const idleAgents = agents.filter(a => a.status === 'idle').length;
    const erroredAgents = agents.filter(a => a.status === 'errored').length;
  
    return (
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Agents
            </CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAgents}</div>
            <p className="text-xs text-muted-foreground">
              All provisioned agents
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Running Agents
            </CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{runningAgents}</div>
            <p className="text-xs text-muted-foreground">
              Currently active and processing tasks
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Idle Agents</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{idleAgents}</div>
            <p className="text-xs text-muted-foreground">
              Online and waiting for tasks
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errored Agents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{erroredAgents}</div>
            <p className="text-xs text-muted-foreground">
              Agents that require attention
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  