import { createClient } from "@/lib/supabase/server";
import type { AdminUser, Profile } from "@/types/database";

export const PAGE_SIZE = 25;

type AdminAuthRow = { id: string; email: string | null; email_confirmed_at: string | null; last_sign_in_at: string | null };

// Profiles joined with auth data (email, sign-in times) from the admin-only database function.
export async function listAdminUsers(filter?: {
  verification?: string[];
  role?: string;
  status?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}) {
  const supabase = await createClient();
  const pageSize = filter?.pageSize ?? PAGE_SIZE;
  const page = Math.max(1, filter?.page ?? 1);

  let query = supabase.from("profiles").select("*", { count: "exact" }).is("deleted_at", null);
  if (filter?.verification?.length) query = query.in("verification_status", filter.verification);
  if (filter?.role) query = query.eq("role", filter.role);
  if (filter?.status) query = query.eq("account_status", filter.status);
  if (filter?.q) {
    const term = filter.q.replace(/[%,()*]/g, " ").trim();
    if (term) query = query.or(`full_name.ilike.%${term}%,phone.ilike.%${term}%,location.ilike.%${term}%`);
  }
  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const { data: auth } = await supabase.rpc("admin_list_users");
  const byId = new Map<string, AdminAuthRow>((auth as AdminAuthRow[] | null)?.map((a) => [a.id, a]) ?? []);

  const users = ((data as Profile[] | null) ?? []).map<AdminUser>((p) => ({
    ...p,
    email: byId.get(p.id)?.email ?? null,
    email_confirmed_at: byId.get(p.id)?.email_confirmed_at ?? null,
    last_sign_in_at: byId.get(p.id)?.last_sign_in_at ?? null,
  }));
  return { users, total: count ?? 0, page, pageSize };
}

export async function countProfiles(match: Record<string, string>, notVerified = false) {
  const supabase = await createClient();
  let q = supabase.from("profiles").select("id", { count: "exact", head: true }).is("deleted_at", null);
  for (const [k, v] of Object.entries(match)) q = q.eq(k, v);
  if (notVerified) q = q.in("verification_status", ["unverified", "pending"]);
  const { count } = await q;
  return count ?? 0;
}

export function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Accra" }).format(new Date(value));
}
