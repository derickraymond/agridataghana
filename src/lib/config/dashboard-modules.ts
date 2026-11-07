import type { UserRole } from "@/lib/config/roles";

export interface DashboardModule {
  title: string;
  description: string;
  phase: number;
}

const farm: DashboardModule[] = [];

const business: DashboardModule[] = [
  { title: "Reports", description: "Member statements, production and financial reports.", phase: 8 },
];

export const ROLE_MODULES: Record<UserRole, DashboardModule[]> = {
  farmer: farm,
  cooperative: business,
  aggregator: business,
  agro_dealer: [
    { title: "Sales analytics", description: "Sales performance and demand insights.", phase: 6 },
  ],
  buyer: [],
  processor: [],
  exporter: [
    { title: "Shipments & documents", description: "Shipment milestones and export documentation.", phase: 8 },
  ],
  extension_agent: [
    { title: "Farmer support", description: "Support farmers in your assigned districts.", phase: 6 },
  ],
  institutional_analyst: [],
  administrator: [],
  pending_review: [],
};
