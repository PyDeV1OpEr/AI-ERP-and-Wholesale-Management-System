import type { DashboardDataBundle } from "@/types/dashboard";

export const dashboardDemoData: DashboardDataBundle = {
  stats: [
    {
      id: "revenue",
      title: "Monthly Revenue",
      value: "$182,400",
      trend_percent: 8.4,
      trend_direction: "up",
      subtitle: "vs previous month"
    },
    {
      id: "orders",
      title: "Open Wholesale Orders",
      value: "126",
      trend_percent: 3.1,
      trend_direction: "up",
      subtitle: "active this week"
    },
    {
      id: "stock_health",
      title: "Stock Health Index",
      value: "94%",
      trend_percent: 1.8,
      trend_direction: "up",
      subtitle: "low-risk inventory posture"
    },
    {
      id: "at_risk_payments",
      title: "At-Risk Payments",
      value: "7",
      trend_percent: 2.6,
      trend_direction: "down",
      subtitle: "fewer than last cycle"
    }
  ],
  orders: [
    {
      id: "ORD-3021",
      customer_name: "Nexa Retail Group",
      sku: "RB-XL-445",
      quantity: 320,
      total_amount: 18640,
      status: "Processing",
      ordered_at: new Date().toISOString()
    },
    {
      id: "ORD-3018",
      customer_name: "Aster Distributors",
      sku: "RB-MD-212",
      quantity: 180,
      total_amount: 9730,
      status: "Packed",
      ordered_at: new Date().toISOString()
    }
  ],
  activities: [
    {
      id: "ACT-1",
      title: "Container #IN-77 Cleared",
      description: "Inbound shipment released at local port and routed to warehouse B.",
      level: "success",
      happened_at: new Date().toISOString()
    },
    {
      id: "ACT-2",
      title: "Stock Reorder Triggered",
      description: "6 SKUs crossed reorder threshold and procurement draft was created.",
      level: "warning",
      happened_at: new Date().toISOString()
    }
  ],
  insights: [
    {
      id: "INS-1",
      headline: "Demand Spike on RB-XL-445",
      detail: "Forecast model estimates a 17% demand increase over next 10 days.",
      confidence: 0.91,
      impact: "high"
    }
  ],
  stock: [
    {
      id: "STK-1",
      item_name: "Ribbon Line Premium Roll",
      sku: "RB-XL-445",
      available_units: 1240,
      reorder_level: 600
    }
  ]
};
