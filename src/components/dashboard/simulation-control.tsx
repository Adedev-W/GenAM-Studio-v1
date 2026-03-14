"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Bot } from "lucide-react";

export default function SimulationControl() {
  const [speed, setSpeed] = React.useState(50);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          Simulation Control
        </CardTitle>
        <CardDescription>
          Adjust simulation parameters in real-time.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="speed">Simulation Speed</Label>
            <div className="flex items-center gap-4">
              <Slider
                id="speed"
                min={0}
                max={100}
                step={1}
                value={[speed]}
                onValueChange={(value) => setSpeed(value[0])}
                className="w-full"
              />
              <span className="font-mono text-lg w-12 text-right">{speed}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
