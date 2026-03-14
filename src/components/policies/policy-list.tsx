import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { policies } from "@/lib/data";
import { Bot } from "lucide-react";

export default function PolicyList() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Existing Policies</CardTitle>
                <CardDescription>
                    Review and manage the active policies governing your agents.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Condition</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead className="text-right">Priority</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {policies.map((policy) => (
                            <TableRow key={policy.id}>
                                <TableCell>
                                    <div className="font-mono text-sm">{policy.condition}</div>
                                    <div className="text-xs text-muted-foreground">{policy.description}</div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="font-mono">{policy.action}</Badge>
                                        {policy.createdBy === 'ai' && <Badge variant="outline" className="border-primary/50 text-primary"><Bot className="h-3 w-3 mr-1" /> AI</Badge>}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">{policy.priority}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}