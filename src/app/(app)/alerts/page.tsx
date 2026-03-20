"use client";

import { Bell, FileClock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/common/page-header";
import { AlertsTab } from "@/components/alerts/alerts-tab";
import { AuditTab } from "@/components/alerts/audit-tab";

export default function AlertsPage() {
  return (
    <Tabs defaultValue="alerts" className="space-y-6">
      <PageHeader title="Alerts & Audit" description="Monitor alerts dan audit log workspace">
        <TabsList>
          <TabsTrigger value="alerts" className="gap-1.5">
            <Bell className="h-3.5 w-3.5" /> Alerts
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-1.5">
            <FileClock className="h-3.5 w-3.5" /> Audit
          </TabsTrigger>
        </TabsList>
      </PageHeader>

      <TabsContent value="alerts"><AlertsTab /></TabsContent>
      <TabsContent value="audit"><AuditTab /></TabsContent>
    </Tabs>
  );
}
