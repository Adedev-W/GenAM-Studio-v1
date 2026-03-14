
"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import {
  Badge,
  GitBranch,
  KeyRound,
  PlusCircle,
  Save,
  Search,
  Settings,
  SlidersHorizontal,
  ToyBrick,
  Wrench,
  ChevronDown,
  MoreHorizontal,
  Copy,
  Trash2,
} from "lucide-react";
import { agents as agentData } from "@/lib/data";
import type { AgentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const apiKeys = [
  { id: 1, service: "OpenAI", key: "sk-...", added: "2024-07-20", status: "active" },
  { id: 2, service: "Anthropic", key: "cl-...", added: "2024-07-15", status: "active" },
  { id: 3, service: "Google AI", key: "g-...", added: "2024-06-01", status: "revoked" },
];

const tools = [
  { id: "tool-search", name: "Web Search", description: "Enables the agent to search the web for real-time information.", icon: Search },
  { id: "tool-wrench", name: "Code Interpreter", description: "Allows the agent to execute Python code in a sandboxed environment.", icon: Wrench },
  { id: "tool-git", name: "Data Analysis", description: "Provides capabilities for analyzing data sets and generating insights.", icon: GitBranch },
];

const statusDotStyles: Record<AgentStatus, string> = {
  running: "bg-green-500",
  idle: "bg-blue-500",
  errored: "bg-red-500",
  stopped: "bg-gray-500",
};

const statusTextStyles: Record<AgentStatus, string> = {
  running: "text-green-500",
  idle: "text-blue-500",
  errored: "text-red-500",
  stopped: "text-gray-500",
};

export default function AgentsPage() {
  const [selectedAgentId, setSelectedAgentId] = React.useState(agentData[0].id);
  const selectedAgent = agentData.find(agent => agent.id === selectedAgentId) || agentData[0];

  return (
    <div className="grid lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-1 grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Agents</CardTitle>
                <CardDescription>Select an agent to configure</CardDescription>
              </div>
              <Button size="sm">
                <PlusCircle className="mr-2 h-4 w-4" /> New
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-1">
            <TooltipProvider>
              {agentData.map((agent) => (
                <div key={agent.id} className={cn("flex items-center rounded-md")}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-between gap-3 px-3 flex-grow hover:bg-transparent",
                      selectedAgentId === agent.id && "text-primary hover:text-primary"
                    )}
                    onClick={() => setSelectedAgentId(agent.id)}
                  >
                    <span className="truncate text-left">{agent.name}</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono">{agent.tokenUsage}%</span>
                          <Progress value={agent.tokenUsage} className="h-1 w-12" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <div className="flex items-center gap-2">
                          <div className={cn("h-2 w-2 rounded-full", statusDotStyles[agent.status])} />
                          <span className={cn("font-medium capitalize", statusTextStyles[agent.status])}>{agent.status}</span>
                          <div className="flex-1 border-t border-dashed mx-2 border-border"></div>
                          <span className="font-mono text-sm">{agent.tokenCount} Tokens</span>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 mr-1">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Agent options</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-500 focus:bg-destructive/10 focus:text-red-500">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </TooltipProvider>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Tabs defaultValue="config" className="grid gap-6">
          <div className="flex items-center">
            <TabsList>
              <TabsTrigger value="config"><Settings className="mr-2 h-4 w-4"/>Configuration</TabsTrigger>
              <TabsTrigger value="keys"><KeyRound className="mr-2 h-4 w-4"/>API Keys</TabsTrigger>
              <TabsTrigger value="tools"><Wrench className="mr-2 h-4 w-4"/>Tools</TabsTrigger>
              <TabsTrigger value="models"><ToyBrick className="mr-2 h-4 w-4"/>Models</TabsTrigger>
            </TabsList>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline">Discard</Button>
              <Button className="transition-shadow duration-300 ease-in-out hover:shadow-lg hover:shadow-primary/40"><Save className="mr-2 h-4 w-4" /> Save Agent</Button>
            </div>
          </div>

          <TabsContent value="config" key={selectedAgent.id}>
            <Card>
              <CardHeader>
                <CardTitle>Agent Configuration</CardTitle>
                <CardDescription>
                  Define the core identity and behavior of your agent.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-8 pt-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="agent-name">Agent Name</Label>
                    <Input id="agent-name" placeholder="e.g., SupportBot-v2" defaultValue={selectedAgent.name}/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="agent-version">Version</Label>
                    <Input id="agent-version" placeholder="e.g., 1.2.0" defaultValue="1.0.0" />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="agent-description">Agent Description</Label>
                    <Textarea
                      id="agent-description"
                      placeholder="Describe the agent's purpose and capabilities."
                      defaultValue={selectedAgent.currentObjective}
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6 items-start">
                  <div className="space-y-2">
                    <Label>System Prompt</Label>
                    <Textarea placeholder="Define the agent's core instructions and persona here..." rows={12}
                      defaultValue="You are a helpful AI assistant specialized in data analysis. Your goal is to identify trends and anomalies in time-series data. Respond concisely and provide clear, actionable insights. Do not speculate on data you have not seen."/>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="temperature">Temperature</Label>
                      <div className="flex items-center gap-4">
                        <Slider id="temperature" defaultValue={[75]} max={100} step={1} />
                        <span className="font-mono text-lg w-12 text-right">0.75</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Controls randomness. Lower is more deterministic.</p>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="top-p">Top-P</Label>
                      <div className="flex items-center gap-4">
                        <Slider id="top-p" defaultValue={[90]} max={100} step={1} />
                        <span className="font-mono text-lg w-12 text-right">0.90</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Nucleus sampling. Considers a smaller, more probable set of tokens.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="keys">
            <Card>
              <CardHeader className="flex flex-row items-center">
                <div className="grid gap-2">
                  <CardTitle>API Keys</CardTitle>
                  <CardDescription>
                    Manage external service credentials for your agent.
                  </CardDescription>
                </div>
                <Button asChild size="sm" className="ml-auto gap-1">
                  <a href="#">
                    <PlusCircle className="h-3.5 w-3.5" />
                    Add New Key
                  </a>
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Key</TableHead>
                      <TableHead>Added On</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiKeys.map((key) => (
                      <TableRow key={key.id}>
                        <TableCell className="font-medium">{key.service}</TableCell>
                        <TableCell className="font-mono">{key.key}</TableCell>
                        <TableCell>{key.added}</TableCell>
                        <TableCell>
                          <Badge variant={key.status === 'active' ? 'secondary' : 'destructive'} className="capitalize">{key.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon">
                            <ChevronDown className="h-4 w-4"/>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tools">
            <Card>
              <CardHeader>
                <CardTitle>Tool Configuration</CardTitle>
                <CardDescription>Enable or disable tools to grant specific capabilities to your agent.</CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tools.map((tool) => (
                  <Card key={tool.id} className="flex flex-col">
                    <CardHeader className="flex-row gap-4 items-center">
                      <tool.icon className="h-8 w-8 text-primary" />
                      <div>
                        <CardTitle className="text-lg">{tool.name}</CardTitle>
                      </div>
                      <Switch className="ml-auto" defaultChecked={tool.id !== 'tool-git'}/>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <p className="text-sm text-muted-foreground">{tool.description}</p>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                      <Button variant="ghost" size="sm">
                        <SlidersHorizontal className="mr-2 h-4 w-4"/>
                        Configure
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="models">
            <Card>
              <CardHeader>
                <CardTitle>Model Selection</CardTitle>
                <CardDescription>Choose the foundational and enterprise models for your agent.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Primary Model</CardTitle>
                      <CardDescription>The main model for reasoning and generation.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Select defaultValue="gemini-2.5-pro">
                        <SelectTrigger>
                          <SelectValue placeholder="Select a model" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro (Google)</SelectItem>
                          <SelectItem value="gpt-4o">GPT-4o (OpenAI)</SelectItem>
                          <SelectItem value="claude-3.5-sonnet">Claude 3.5 Sonnet (Anthropic)</SelectItem>
                          <SelectItem value="llama-3-70b">Llama 3 70B (Meta)</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Fallback Model</CardTitle>
                      <CardDescription>Used if the primary model fails or is unavailable.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Select defaultValue="gemini-2.5-flash">
                        <SelectTrigger>
                          <SelectValue placeholder="Select a fallback" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash (Google)</SelectItem>
                          <SelectItem value="gpt-4-turbo">GPT-4 Turbo (OpenAI)</SelectItem>
                          <SelectItem value="claude-3-haiku">Claude 3 Haiku (Anthropic)</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}

    