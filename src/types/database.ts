import type { AccountType, UserRole } from "@/lib/config/roles";

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  location: string | null;
  role: UserRole;
  requested_role: AccountType | null;
  account_status: "active" | "suspended";
  verification_status: "unverified" | "pending" | "verified" | "rejected";
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  handled: boolean;
  created_at: string;
}

export interface AdminUser extends Profile {
  email: string | null;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
}

export interface PublicListing {
  id: string;
  title: string;
  crop_key: string;
  quantity_kg: number;
  price_per_kg_ghs: number;
  quality_grade: "A" | "B" | "C" | null;
  region: string;
  district: string | null;
  available_from: string | null;
  created_at: string;
  crops: { name: string } | null;
}

export interface Listing extends PublicListing {
  seller_id: string;
  description: string | null;
  status: "pending" | "active" | "rejected" | "sold" | "withdrawn";
  moderation_note: string | null;
}

export type OrderStatus = "pending" | "accepted" | "rejected" | "dispatched" | "delivered" | "completed" | "cancelled";

export interface Order {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  title: string;
  crop_key: string;
  quantity_kg: number;
  unit_price_ghs: number;
  total_ghs: number;
  delivery_method: "pickup" | "delivery";
  delivery_address: string | null;
  contact_phone: string;
  notes: string | null;
  status: OrderStatus;
  payment_method: "mobile_money" | "cash" | "bank_transfer";
  payment_status: "unpaid" | "paid";
  payment_reference: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface Enquiry {
  id: string;
  listing_id: string;
  buyer_id: string;
  message: string;
  quantity_kg: number | null;
  offered_price_per_kg_ghs: number | null;
  status: "open" | "replied" | "closed";
  seller_reply: string | null;
  created_at: string;
  listings: { title: string; seller_id: string } | null;
}
