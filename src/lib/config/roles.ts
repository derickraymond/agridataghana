export const ACCOUNT_TYPES = [
  "farmer",
  "cooperative",
  "aggregator",
  "agro_dealer",
  "buyer",
  "processor",
  "exporter",
  "extension_agent",
  "administrator",
  "institutional_analyst",
] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];

// Granted roles = account types plus "pending_review" for privileged requests awaiting approval.
export type UserRole = AccountType | "pending_review";

// Types a user may select at sign-up. Others require administrator approval,
// and "administrator" can never be requested through registration.
export const SELF_SERVICE_TYPES: AccountType[] = [
  "farmer",
  "cooperative",
  "aggregator",
  "agro_dealer",
  "buyer",
  "processor",
  "exporter",
];

export const APPROVAL_REQUIRED_TYPES: AccountType[] = ["extension_agent", "institutional_analyst"];

export const REGISTRATION_TYPES: AccountType[] = [...SELF_SERVICE_TYPES, ...APPROVAL_REQUIRED_TYPES];

export const ANALYTICS_ROLES: UserRole[] = ["administrator", "farmer", "buyer", "exporter"];

export const ROLE_LABELS: Record<UserRole, string> = {
  farmer: "Farmer",
  cooperative: "Cooperative",
  aggregator: "Aggregator",
  agro_dealer: "Agro-dealer",
  buyer: "Buyer",
  processor: "Processor",
  exporter: "Exporter",
  extension_agent: "Extension Agent",
  administrator: "Administrator",
  institutional_analyst: "Institutional Analyst",
  pending_review: "Pending approval",
};

export const ROLE_DASHBOARD: Record<UserRole, string> = {
  farmer: "/dashboard/farmer",
  cooperative: "/dashboard/cooperative",
  aggregator: "/dashboard/cooperative",
  agro_dealer: "/dashboard/dealer",
  buyer: "/dashboard/buyer",
  processor: "/dashboard/buyer",
  exporter: "/dashboard/buyer",
  extension_agent: "/dashboard/extension",
  administrator: "/dashboard/admin",
  institutional_analyst: "/dashboard/analyst",
  pending_review: "/dashboard/pending",
};

export const GHANA_REGIONS = [
  "Ahafo",
  "Ashanti",
  "Bono",
  "Bono East",
  "Central",
  "Eastern",
  "Greater Accra",
  "North East",
  "Northern",
  "Oti",
  "Savannah",
  "Upper East",
  "Upper West",
  "Volta",
  "Western",
  "Western North",
] as const;
