"use client";

import * as React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Clock,
  Codepen,
  Cpu,
  FileClock,
  Flag,
  GitCommit,
  Globe,
  PlusCircle,
  Save,
  Shield,
  Sliders as SlidersIcon,
  Sparkles,
  Terminal,
  Users,
  Webhook,
  Zap,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function ConfigPolicyForm() {
  const [actions, setActions] = React.useState([
    { id: 1, type: "control" },
  ]);

  const addAction = () => {
    setActions([...actions, { id: Date.now(), type: "control" }]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configure Policy</CardTitle>
        <CardDescription>
          Create or edit a policy with detailed triggers, logic, and actions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" defaultValue={["item-1"]} className="w-full">
          {/* Section 1: General */}
          <AccordionItem value="item-1">
            <AccordionTrigger>
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <SlidersIcon className="h-5 w-5" /> General
              </h3>
            </AccordionTrigger>
            <AccordionContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="policy-name">Policy Name *</Label>
                <Input id="policy-name" placeholder="e.g., High CPU Alert" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the purpose of this policy"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <NumberInput id="priority" defaultValue="100" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scope">Scope</Label>
                <Select defaultValue="global">
                  <SelectTrigger id="scope">
                    <SelectValue placeholder="Select scope" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" /> Global
                      </div>
                    </SelectItem>
                    <SelectItem value="agent-group">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" /> Agent Group
                      </div>
                    </SelectItem>
                    <SelectItem value="single-agent">
                      <div className="flex items-center gap-2">
                        <Codepen className="h-4 w-4" /> Single Agent
                      </div>
                    </SelectItem>
                    <SelectItem value="tag-based">
                      <div className="flex items-center gap-2">
                        <Flag className="h-4 w-4" /> Tag-based
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="enabled" defaultChecked />
                <Label htmlFor="enabled">Enabled</Label>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Section 2: Trigger */}
          <AccordionItem value="item-2">
            <AccordionTrigger>
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <Zap className="h-5 w-5" /> Trigger
              </h3>
            </AccordionTrigger>
            <AccordionContent className="p-4 space-y-6">
                <div className="space-y-4 p-4 border rounded-lg">
                    <h4 className="font-semibold flex items-center gap-2"><Cpu className="h-5 w-5 text-primary"/>Metric-based Trigger</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Metric</Label>
                            <Select><SelectTrigger><SelectValue placeholder="CPU_USAGE" /></SelectTrigger><SelectContent><SelectItem value="cpu">CPU_USAGE</SelectItem><SelectItem value="memory">MEMORY_USAGE</SelectItem></SelectContent></Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Operator</Label>
                             <Select><SelectTrigger><SelectValue placeholder=">" /></SelectTrigger><SelectContent><SelectItem value="gt">&gt;</SelectItem><SelectItem value="lt">&lt;</SelectItem></SelectContent></Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Threshold</Label>
                            <NumberInput placeholder="80" />
                        </div>
                         <div className="space-y-2">
                            <Label>Time Window (s)</Label>
                            <NumberInput placeholder="300" />
                        </div>
                         <div className="space-y-2">
                            <Label>Aggregation</Label>
                             <Select><SelectTrigger><SelectValue placeholder="Average" /></SelectTrigger><SelectContent><SelectItem value="avg">Average</SelectItem><SelectItem value="max">Maximum</SelectItem></SelectContent></Select>
                        </div>
                    </div>
                </div>
                 <div className="space-y-4 p-4 border rounded-lg">
                    <h4 className="font-semibold flex items-center gap-2"><Webhook className="h-5 w-5 text-primary"/>Event-based Trigger</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Event Type</Label>
                            <Select><SelectTrigger><SelectValue placeholder="Select event type" /></SelectTrigger><SelectContent><SelectItem value="error">Agent Error</SelectItem></SelectContent></Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Pattern Match (optional)</Label>
                            <Input placeholder="e.g., *TimeoutException*" />
                        </div>
                    </div>
                </div>
                 <div className="space-y-4 p-4 border rounded-lg">
                    <h4 className="font-semibold flex items-center gap-2"><Clock className="h-5 w-5 text-primary"/>Scheduled Trigger</h4>
                    <div className="space-y-2">
                        <Label>Cron Expression</Label>
                        <Input placeholder="e.g., 0 0 * * *" />
                    </div>
                </div>
                 <div className="space-y-4 p-4 border rounded-lg bg-secondary/30">
                     <h4 className="font-semibold flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary"/>NLP Intent Trigger (Optional)</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Intent Phrase</Label>
                            <Input placeholder="e.g., 'Are any agents overloaded?'" />
                        </div>
                        <div className="space-y-2">
                            <Label>Confidence Threshold</Label>
                            <div className="flex items-center gap-2">
                                <Slider defaultValue={[80]} max={100} step={1} />
                                <span className="w-12 text-right">80%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </AccordionContent>
          </AccordionItem>

          {/* Section 3: Logic */}
          <AccordionItem value="item-3">
            <AccordionTrigger>
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <GitCommit className="h-5 w-5" /> Logic
              </h3>
            </AccordionTrigger>
            <AccordionContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Condition Logic</Label>
                <RadioGroup defaultValue="and" className="flex items-center gap-4 pt-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="and" id="and" />
                    <Label htmlFor="and">AND</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="or" id="or" />
                    <Label htmlFor="or">OR</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                 <Label>Interval (seconds)</Label>
                 <NumberInput defaultValue="10" />
              </div>
              <div className="flex items-center space-x-2 md:col-span-2">
                <Switch id="realtime-eval" />
                <Label htmlFor="realtime-eval">Realtime Evaluation</Label>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Section 4: Actions */}
          <AccordionItem value="item-4">
            <AccordionTrigger>
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                    <Zap className="h-5 w-5" /> Actions
                </h3>
            </AccordionTrigger>
            <AccordionContent className="p-4 space-y-4">
              {actions.map((action) => (
                <Card key={action.id} className="relative bg-background">
                  <CardContent className="p-4 grid gap-4">
                    <div className="space-y-2">
                      <Label>Action Type</Label>
                      <Select defaultValue="control">
                        <SelectTrigger>
                          <SelectValue placeholder="Select action" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="control">Control</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                          <SelectItem value="notification">Notification</SelectItem>
                          <SelectItem value="safety">Safety</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* For now, just show the Control action fields as an example */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Control Action</Label>
                            <Select defaultValue="restart">
                                <SelectTrigger><SelectValue placeholder="Select control action"/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="restart">Restart</SelectItem>
                                    <SelectItem value="pause">Pause</SelectItem>
                                    <SelectItem value="resume">Resume</SelectItem>
                                    <SelectItem value="scale">Scale</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Scale Count</Label>
                            <NumberInput defaultValue="1" placeholder="Only if action is 'scale'"/>
                        </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button variant="outline" onClick={addAction} className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Action
              </Button>
            </AccordionContent>
          </AccordionItem>

           {/* Section 5: Safeguards */}
          <AccordionItem value="item-5">
            <AccordionTrigger>
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <Shield className="h-5 w-5" /> Safeguards
              </h3>
            </AccordionTrigger>
            <AccordionContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Cooldown (seconds)</Label>
                <NumberInput defaultValue="60" />
              </div>
              <div className="space-y-2">
                <Label>Max Triggers per Hour</Label>
                <NumberInput defaultValue="10" />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="require-approval" />
                <Label htmlFor="require-approval">Require Approval</Label>
              </div>
               <div className="flex items-center space-x-2">
                <Switch id="dry-run" defaultChecked/>
                <Label htmlFor="dry-run">Dry Run</Label>
              </div>
               <div className="flex items-center space-x-2">
                <Switch id="kill-switch" />
                <Label htmlFor="kill-switch">Kill Switch</Label>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          {/* Section 6: Test */}
          <AccordionItem value="item-6">
            <AccordionTrigger>
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <Terminal className="h-5 w-5" /> Test
              </h3>
            </AccordionTrigger>
            <AccordionContent className="p-4 space-y-4">
                <div className="space-y-2">
                    <Label>Manual Metric JSON</Label>
                    <Textarea rows={4} placeholder='{ "CPU_USAGE": 95, "MEMORY_USAGE": 80 }' />
                </div>
                <Button>Run Simulation</Button>
                <div className="mt-4">
                    <Label>Result Log</Label>
                    <div className="bg-black/80 text-white rounded-md p-4 h-48 font-mono text-xs border overflow-y-auto">
                        <pre>
[SIMULATION] Waiting for input...
                        </pre>
                    </div>
                </div>
            </AccordionContent>
          </AccordionItem>

          {/* Section 7: Versioning */}
          <AccordionItem value="item-7">
            <AccordionTrigger>
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <FileClock className="h-5 w-5" /> Versioning
              </h3>
            </AccordionTrigger>
            <AccordionContent className="p-4 flex items-center gap-4">
                <div className="space-y-2 flex-1">
                    <Label>Version History</Label>
                    <Select>
                        <SelectTrigger><SelectValue placeholder="v3 (Current)"/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="v3">v3 (Current) - 2024-07-29</SelectItem>
                            <SelectItem value="v2">v2 - 2024-07-28</SelectItem>
                            <SelectItem value="v1">v1 - 2024-07-27</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button variant="outline" className="mt-5">Compare Diff</Button>
            </AccordionContent>
          </AccordionItem>

        </Accordion>
        <Separator className="my-8"/>
        <div className="flex justify-end gap-2">
            <Button variant="outline">Cancel</Button>
            <Button variant="secondary">Save Draft</Button>
            <Button><Save className="mr-2 h-4 w-4"/>Save & Activate</Button>
        </div>
      </CardContent>
    </Card>
  );
}
