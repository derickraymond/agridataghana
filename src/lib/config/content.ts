export interface ContentItem {
  title: string;
  text: string;
}
export interface ContentSection {
  heading: string;
  items?: ContentItem[];
  paragraphs?: string[];
}
export interface ContentPageData {
  title: string;
  eyebrow: string;
  intro: string;
  status?: string;
  legalDraft?: boolean;
  cta?: { label: string; href: string };
  sections: ContentSection[];
}

export const CONTENT: Record<string, ContentPageData> = {
  about: {
    title: "About AgriData Ghana",
    eyebrow: "Our mission",
    intro:
      "AgriData Ghana is building shared digital infrastructure for agriculture: trusted farm records, transparent markets and traceable supply chains, starting in Ghana and designed to scale across Africa.",
    sections: [
      {
        heading: "What we are building",
        items: [
          { title: "Farmer identity & records", text: "Registered farmers, farms, crops and harvests in one secure, permission-controlled system." },
          { title: "Fair, transparent markets", text: "A marketplace and price intelligence so producers and buyers can trade with confidence." },
          { title: "Traceable supply chains", text: "Batch-level traceability from farm to export shipment with auditable events." },
        ],
      },
      {
        heading: "Our principles",
        items: [
          { title: "Privacy first", text: "Farmer and business data is private by default and shared only with consent, in line with Act 843." },
          { title: "Honest data", text: "We label every data source and never present demonstration data as real market information." },
          { title: "Built for low bandwidth", text: "Mobile-first, lightweight pages and offline-friendly data capture for rural connectivity." },
        ],
      },
    ],
    cta: { label: "Create an account", href: "/register" },
  },
  "how-it-works": {
    title: "How AgriData Ghana works",
    eyebrow: "How it works",
    intro: "Four steps take you from registration to trading, with verification and security built in at every stage.",
    sections: [
      {
        heading: "From sign-up to sale",
        items: [
          { title: "1. Register & verify", text: "Create an account for your role, verify your email and complete profile verification." },
          { title: "2. Record your operations", text: "Farmers register farms, crops and harvests; businesses set up their organisation profile." },
          { title: "3. Connect & trade", text: "List produce or inputs, request quotations, make offers and manage orders." },
          { title: "4. Track & report", text: "Follow deliveries, trace batches and download reports you are permitted to see." },
        ],
      },
    ],
    cta: { label: "Get started", href: "/register" },
  },
  "for-farmers": {
    title: "For farmers",
    eyebrow: "Farmers",
    intro: "Keep reliable farm records, learn what your crops are worth and reach buyers directly.",
    sections: [
      {
        heading: "What farmers can do",
        items: [
          { title: "Register farms & map boundaries", text: "Multiple farms with GPS location and size. Sensitive coordinates stay private." },
          { title: "Record crops & harvests", text: "Planting dates, inputs, activities, yields and photos, including offline entry that syncs later." },
          { title: "Sell produce", text: "Create listings, receive buyer enquiries and manage orders." },
          { title: "Stay informed", text: "Market prices, weather and advisory for your location." },
        ],
      },
    ],
    cta: { label: "Join as a farmer", href: "/register" },
  },
  "for-cooperatives": {
    title: "For cooperatives",
    eyebrow: "Cooperatives & aggregators",
    intro: "Manage members, collect and grade produce in bulk and negotiate with buyers from one workspace.",
    sections: [
      {
        heading: "Cooperative tools",
        items: [
          { title: "Member management", text: "Register members, verify farmers and keep membership records." },
          { title: "Produce collection", text: "Record deliveries, weights and quality grades into aggregated inventory." },
          { title: "Bulk listings & contracts", text: "List bulk produce and manage buyer contracts." },
          { title: "Statements & reports", text: "Member statements, payments and production reports." },
        ],
      },
    ],
    cta: { label: "Register your cooperative", href: "/register" },
  },
  "for-agro-dealers": {
    title: "For agro-dealers",
    eyebrow: "Agro-dealers",
    intro: "Sell seeds, fertilisers, crop protection, tools and machinery to farmers across Ghana.",
    sections: [
      {
        heading: "Dealer tools",
        items: [
          { title: "Business verification", text: "Registered, verified dealers build trust. Relevant licences and product approvals are checked." },
          { title: "Catalogue & inventory", text: "Manage products, images, pricing and stock." },
          { title: "Orders & delivery", text: "Process orders and manage deliveries." },
          { title: "Sales analytics", text: "Understand demand by product and region." },
        ],
      },
    ],
    cta: { label: "Register as a dealer", href: "/register" },
  },
  "for-buyers": {
    title: "For buyers",
    eyebrow: "Buyers & processors",
    intro: "Discover verified suppliers, compare quality and quantity, and buy with clear records.",
    sections: [
      {
        heading: "Buyer tools",
        items: [
          { title: "Supplier discovery", text: "Search by commodity, location, quantity and quality grade." },
          { title: "Quotations & offers", text: "Request quotations, make offers and request samples." },
          { title: "Orders & contracts", text: "Purchase orders, contracts and delivery tracking." },
          { title: "Supplier communication", text: "Keep enquiries and documents together." },
        ],
      },
    ],
    cta: { label: "Register as a buyer", href: "/register" },
  },
  "for-exporters": {
    title: "For exporters & international buyers",
    eyebrow: "Exporters",
    intro: "Source traceable Ghanaian produce with documented origin, quality records and shipment milestones.",
    sections: [
      {
        heading: "Export tools",
        items: [
          { title: "Traceable sourcing", text: "Batch records linking produce to farms, handling and quality checks." },
          { title: "Shipment milestones", text: "Track consignments and keep export documents in one place." },
          { title: "Certification records", text: "Upload and display certifications. Compliance claims require independent verification." },
        ],
      },
    ],
    cta: { label: "Register as an exporter", href: "/register" },
  },
  traceability: {
    title: "Farm-to-market traceability",
    eyebrow: "Traceability",
    status: "Planned — Phase 7",
    intro: "Follow produce from farm to export with unique batch identification, QR codes and auditable events.",
    sections: [
      {
        heading: "The traceability chain",
        items: [
          { title: "Farm to harvest", text: "Farmer, farm, plot, crop, production activities, harvest and harvest batch." },
          { title: "Aggregation to delivery", text: "Aggregation, quality inspection, storage, transportation and delivery." },
          { title: "Export", text: "Export shipment information and downloadable reports." },
        ],
      },
      {
        heading: "A note on compliance",
        paragraphs: [
          "Traceability records support due-diligence but do not by themselves certify compliance with the EU Deforestation Regulation or any certification scheme. Compliance claims require appropriate independent verification.",
        ],
      },
    ],
    cta: { label: "Register to be notified", href: "/register" },
  },
  equipment: {
    title: "Agricultural equipment & inputs",
    eyebrow: "Supplies marketplace",
    status: "Planned — Phase 4",
    intro: "A dedicated marketplace for farm inputs and equipment from verified dealers.",
    sections: [
      {
        heading: "Categories",
        items: [
          { title: "Seeds & fertilisers", text: "Certified seed and fertiliser products." },
          { title: "Crop protection", text: "Products subject to regulatory approval and verification." },
          { title: "Tools & irrigation", text: "Hand tools and irrigation systems." },
          { title: "Tractors & machinery", text: "Harvesting equipment, tractors and machinery rentals." },
          { title: "Agricultural services", text: "Ploughing, spraying, transport and other services." },
        ],
      },
    ],
    cta: { label: "Register as a dealer", href: "/register" },
  },
  "financial-services": {
    title: "Financial services",
    eyebrow: "Finance & insurance",
    status: "Planned — Phase 5",
    intro: "Information and referrals to agricultural finance and insurance, with farmer-authorised data sharing.",
    sections: [
      {
        heading: "What will be available",
        items: [
          { title: "Financing information", text: "Understand loan and input-finance options." },
          { title: "Partner referrals", text: "Referral applications tracked in your account. You decide what data is shared." },
          { title: "Financial education", text: "Practical guides on credit, savings and insurance." },
        ],
      },
      {
        heading: "Important",
        paragraphs: [
          "AgriData Ghana is not a lender or insurer. Financial products are provided by appropriately licensed partners, and no products are available until partners are onboarded.",
        ],
      },
    ],
  },
  partnerships: {
    title: "Partnerships",
    eyebrow: "Partner with us",
    intro: "We work with government agencies, financial institutions, NGOs, research bodies and agribusinesses to strengthen Ghana's agricultural data ecosystem.",
    sections: [
      {
        heading: "Ways to partner",
        items: [
          { title: "Data & research", text: "Access aggregated, anonymised analytics through authorised institutional accounts." },
          { title: "Finance & insurance", text: "Offer products to farmers who choose to share their records." },
          { title: "Technology & logistics", text: "Payments, SMS, mapping, transport and storage integrations." },
        ],
      },
    ],
    cta: { label: "Contact the partnerships team", href: "/contact" },
  },
  help: {
    title: "Help Centre",
    eyebrow: "Support",
    intro: "Answers to common questions. Cannot find what you need? Contact us.",
    sections: [
      {
        heading: "Frequently asked questions",
        items: [
          { title: "How do I create an account?", text: "Use Register, choose your account type, then verify your email address." },
          { title: "I did not receive a verification email", text: "Check spam, then try to log in to be offered a fresh link, or contact support." },
          { title: "How do I reset my password?", text: "Use 'Forgot password' on the login page. A reset link is sent to your email." },
          { title: "Why is my account awaiting approval?", text: "Extension agent and institutional analyst accounts are reviewed by an administrator." },
          { title: "Who can see my farm data?", text: "Only you and authorised administrators, unless you explicitly share it. Exact coordinates are restricted." },
          { title: "Are prices on the site live?", text: "Price data appears only when published with a source and date. Demonstration data is always labelled." },
        ],
      },
    ],
    cta: { label: "Contact support", href: "/contact" },
  },
  privacy: {
    title: "Privacy Policy",
    eyebrow: "Legal",
    legalDraft: true,
    intro: "How AgriData Ghana collects, uses and protects personal data, designed with the Data Protection Act, 2012 (Act 843) in mind.",
    sections: [
      {
        heading: "Data we collect",
        paragraphs: ["Account details (name, phone, email, location, account type), farm and business records you enter, transaction records, and technical data needed to keep the service secure."],
      },
      {
        heading: "How we use it",
        paragraphs: ["To provide the platform, verify accounts, process orders, prevent fraud and meet legal obligations. Optional marketing communications require separate consent."],
      },
      {
        heading: "Sharing",
        paragraphs: ["We do not sell personal data. Farm and business information is shared only with parties you authorise, service providers acting on our instructions, or where required by law."],
      },
      {
        heading: "Your rights",
        paragraphs: ["You may request access to, correction of, export of or deletion of your data, subject to legal retention requirements, and may withdraw consent at any time. Contact us to exercise these rights."],
      },
      {
        heading: "Security",
        paragraphs: ["Data is encrypted in transit, protected by row-level access controls and monitored through audit logs."],
      },
    ],
  },
  terms: {
    title: "Terms & Conditions",
    eyebrow: "Legal",
    legalDraft: true,
    intro: "The terms that apply when you use AgriData Ghana.",
    sections: [
      {
        heading: "Using the platform",
        paragraphs: ["You must provide accurate information, keep your credentials secure and use the platform lawfully. We may suspend accounts that breach these terms."],
      },
      {
        heading: "Marketplace",
        paragraphs: ["AgriData Ghana provides the platform that connects buyers and sellers. Contracts are between users. Listings are subject to moderation and may be removed."],
      },
      {
        heading: "Payments",
        paragraphs: ["Payments are processed by licensed third-party providers. We never store raw card details."],
      },
      {
        heading: "Information accuracy",
        paragraphs: ["Prices, weather and advisory content are provided for guidance and labelled with their sources. They are not a guarantee of any outcome."],
      },
    ],
  },
};
