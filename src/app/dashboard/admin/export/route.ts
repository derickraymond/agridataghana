import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { csvCell } from "@/lib/csv";

export const dynamic = "force-dynamic";

type Spec = { table: string; columns: string[]; order: string };

const SPECS: Record<string, Spec> = {
  users: { table: "profiles", columns: ["id", "full_name", "phone", "location", "role", "requested_role", "account_status", "verification_status", "created_at"], order: "created_at" },
  listings: { table: "listings", columns: ["id", "title", "crop_key", "quantity_kg", "price_per_kg_ghs", "region", "district", "status", "created_at"], order: "created_at" },
  orders: { table: "orders", columns: ["id", "title", "crop_key", "quantity_kg", "unit_price_ghs", "total_ghs", "status", "payment_method", "payment_status", "created_at"], order: "created_at" },
  harvests: { table: "harvests", columns: ["id", "cycle_id", "harvest_date", "quantity_kg", "quality_grade", "created_at"], order: "created_at" },
  prices: { table: "commodity_prices", columns: ["id", "crop_key", "market", "region", "price_per_kg_ghs", "observed_on", "source", "created_at"], order: "created_at" },
  audit: { table: "audit_logs", columns: ["id", "actor_id", "action", "entity_type", "entity_id", "created_at"], order: "created_at" },
};

export async function GET(request: Request) {
  const type = new URL(request.url).searchParams.get("type") ?? "";
  const spec = SPECS[type];
  if (!spec) return NextResponse.json({ error: "Unknown export" }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role, account_status").eq("id", user.id).maybeSingle();
  if (!profile || profile.role !== "administrator" || profile.account_status !== "active") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase.from(spec.table).select(spec.columns.join(",")).order(spec.order, { ascending: false }).limit(10000);
  if (error) return NextResponse.json({ error: "Export failed" }, { status: 500 });

  await supabase.rpc("log_export", { p_type: type });
  const rows = (data as unknown as Record<string, unknown>[]) ?? [];
  const csv = [spec.columns.join(","), ...rows.map((r) => spec.columns.map((c) => csvCell(r[c])).join(","))].join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="agridata-${type}-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
