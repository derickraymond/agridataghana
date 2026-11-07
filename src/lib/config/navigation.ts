export const NAV_GROUPS = [
  {
    label: "Solutions",
    items: [
      { href: "/for-farmers", label: "For Farmers" },
      { href: "/for-cooperatives", label: "For Cooperatives" },
      { href: "/for-agro-dealers", label: "For Agro-dealers" },
      { href: "/for-buyers", label: "For Buyers" },
      { href: "/for-exporters", label: "For Exporters" },
    ],
  },
  {
    label: "Platform",
    items: [
      { href: "/marketplace", label: "Marketplace" },
      { href: "/commodity-prices", label: "Commodity Prices" },
      { href: "/weather", label: "Weather & Advisory" },
      { href: "/traceability", label: "Farm Traceability" },
      { href: "/organizations", label: "Organisation Directory" },
      { href: "/equipment", label: "Agricultural Equipment" },
      { href: "/financial-services", label: "Financial Services" },
    ],
  },
  {
    label: "Company",
    items: [
      { href: "/about", label: "About Us" },
      { href: "/how-it-works", label: "How It Works" },
      { href: "/partnerships", label: "Partnerships" },
      { href: "/help", label: "Help Centre" },
      { href: "/contact", label: "Contact Us" },
    ],
  },
] as const;

export const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms & Conditions" },
] as const;
