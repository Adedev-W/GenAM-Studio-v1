"use client";

import {
  MoreHorizontal,
  PlayCircle,
  PauseCircle,
  StopCircle,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { agents } from "@/lib/data";
import { cn } from "@/lib/utils";
import type { AgentStatus } from "@/lib/types";

const statusStyles: Record<AgentStatus, string> = {
  running: "bg-green-500/20 text-green-400 border-green-500/30",
  idle: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  errored: "bg-red-500/20 text-red-400 border-red-500/30",
  stopped: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

export default function AgentList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Agents</CardTitle>
        <CardDescription>
          Manage and monitor your autonomous agents.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden w-[100px] sm:table-cell">
                Status
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Objective</TableHead>
              <TableHead className="hidden md:table-cell w-[180px]">CPU / Mem</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agents.map((agent) => (
              <TableRow key={agent.id}>
                <TableCell className="hidden sm:table-cell">
                  <Badge
                    variant="outline"
                    className={cn("capitalize", statusStyles[agent.status])}
                  >
                    {agent.status}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{agent.name}</TableCell>
                <TableCell>
                  <div className="w-48 truncate text-muted-foreground">
                    {agent.currentObjective}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">CPU</span>
                          <Progress value={agent.cpuUsage} className="h-2 w-full" />
                          <span className="text-xs w-8 text-right font-mono">{agent.cpuUsage}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Mem</span>
                          <Progress value={agent.memoryUsage} className="h-2 w-full" />
                          <span className="text-xs w-8 text-right font-mono">{agent.memoryUsage}%</span>
                      </div>
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>
                        <PlayCircle className="mr-2 h-4 w-4" />
                        Start/Resume
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <PauseCircle className="mr-2 h-4 w-4" />
                        Pause
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <StopCircle className="mr-2 h-4 w-4" />
                        Stop
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-500">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Restart
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
