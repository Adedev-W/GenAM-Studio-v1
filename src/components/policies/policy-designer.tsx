"use client";

import { useFormState, useFormStatus } from "react-dom";
import { generatePolicySuggestions } from "@/app/actions";
import { Bot, Sparkles, Wand2, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const initialState = {
  message: null,
  errors: null,
  suggestions: [],
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        "Generating..."
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" /> Generate with AI
        </>
      )}
    </Button>
  );
}

export default function PolicyDesigner() {
  const [state, formAction] = useFormState(generatePolicySuggestions, initialState);

  return (
    <Card className="sticky top-20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-6 w-6 text-primary" />
          AI Policy Designer
        </CardTitle>
        <CardDescription>
          Describe a policy in plain language. Our AI will draft the rules for you.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="description">Policy Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="e.g., 'If an agent's CPU usage is high for 5 minutes, send an alert and try to scale it up.'"
              rows={4}
            />
            {state.errors?.description && (
              <p className="text-sm text-red-500">{state.errors.description[0]}</p>
            )}
          </div>
          {state.message && state.message !== 'success' && (
             <p className="text-sm text-red-500">{state.message}</p>
          )}
        </CardContent>
        <CardFooter>
          <SubmitButton />
        </CardFooter>
      </form>
      {state.suggestions && state.suggestions.length > 0 && (
        <div className="p-6 pt-0">
          <h3 className="text-md font-semibold mb-4 flex items-center"><Bot className="mr-2 h-5 w-5" /> AI Suggestions</h3>
          <div className="grid gap-4">
            {state.suggestions.map((policy, index) => (
              <Card key={index} className="bg-background">
                <CardContent className="p-4">
                  <div className="font-mono text-sm space-y-2">
                    <div className="flex items-center">
                        <span className="text-muted-foreground mr-2">IF</span> 
                        <span className="text-foreground">{policy.condition}</span>
                    </div>
                    <div className="flex items-center">
                        <ArrowRight className="h-4 w-4 text-primary mr-2" />
                        <span className="text-muted-foreground mr-2">THEN</span>
                        <Badge variant="secondary" className="font-mono">{policy.action}</Badge>
                    </div>
                  </div>
                  {policy.description && <p className="text-xs text-muted-foreground mt-2">{policy.description}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
