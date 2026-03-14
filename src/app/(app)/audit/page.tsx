import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileClock } from "lucide-react";

export default function AuditPage() {
    return (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
            <div className="flex flex-col items-center gap-1 text-center">
                <FileClock className="h-16 w-16 text-muted-foreground/50" />
                <h3 className="text-2xl font-bold tracking-tight">
                    Audit Trail & History
                </h3>
                <p className="text-sm text-muted-foreground">
                    This section will contain immutable logs of all agent and user actions.
                </p>
            </div>
        </div>
    );
}
