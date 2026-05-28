import { ActivityTimeline } from "@/components/dashboard/activity-timeline";
import { AiInsights } from "@/components/dashboard/ai-insights";
import { HeroStrip } from "@/components/dashboard/hero-strip";
import { Navbar } from "@/components/dashboard/navbar";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentOrders } from "@/components/dashboard/recent-orders";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { StockOverview } from "@/components/dashboard/stock-overview";
import { getDashboardData } from "@/lib/api";

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <>
      <Navbar />
      <div className="space-y-4">
        <HeroStrip />
        <StatsCards stats={data.stats} />
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <RecentOrders orders={data.orders} />
            <StockOverview stock={data.stock} />
          </div>
          <div className="space-y-4">
            <AiInsights insights={data.insights} />
            <QuickActions />
            <ActivityTimeline activities={data.activities} />
          </div>
        </section>
      </div>
    </>
  );
}
