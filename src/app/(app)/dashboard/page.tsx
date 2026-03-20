import { AgentList } from "@/components/dashboard/agent-list";
import { OverviewStats } from "@/components/dashboard/overview-stats";
import { TelemetryCharts } from "@/components/dashboard/telemetry-charts";
import { RecentOrders } from "@/components/dashboard/recent-orders";

export default function DashboardPage() {
  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
      <OverviewStats />
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RecentOrders />
        </div>
        <AgentList />
      </div>
      <TelemetryCharts />
    </div>
  );
}
