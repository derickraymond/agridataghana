import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card } from "@/components/ui/card";
import { formatDate } from "@/lib/admin/data";
import type { Order } from "@/types/database";

export const metadata = { title: "Orders (admin)" };

export default async function Page() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(100);
  const orders = (data as unknown as Order[] | null) ?? [];
  const value = orders.filter((o) => ["accepted", "dispatched", "delivered", "completed"].includes(o.status)).reduce((s, o) => s + Number(o.total_ghs), 0);
  const paid = orders.filter((o) => o.payment_status === "paid").reduce((s, o) => s + Number(o.total_ghs), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-forest-900">Orders</h1>
        <p className="mt-1 text-charcoal-500">
          Every order on the platform. Payments are recorded by sellers; none are processed by AgriData Ghana.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-charcoal-500">Orders</p>
          <p className="text-2xl font-semibold text-forest-900">{orders.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-charcoal-500">Accepted order value (GHS)</p>
          <p className="text-2xl font-semibold text-forest-900">{value.toLocaleString("en-GB", { minimumFractionDigits: 2 })}</p>
        </Card>
        <Card>
          <p className="text-sm text-charcoal-500">Payments recorded (GHS)</p>
          <p className="text-2xl font-semibold text-forest-900">{paid.toLocaleString("en-GB", { minimumFractionDigits: 2 })}</p>
        </Card>
      </div>
      {orders.length === 0 && <Card className="text-charcoal-500">No orders yet.</Card>}
      {orders.map((o) => (
        <Card key={o.id} className="space-y-1 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-forest-900">{o.title}</p>
            <div className="flex gap-2">
              <Badge tone="earth">{o.status}</Badge>
              <Badge tone={o.payment_status === "paid" ? "green" : "grey"}>{o.payment_status}</Badge>
            </div>
          </div>
          <p className="text-sm text-charcoal-700">
            {Number(o.quantity_kg).toLocaleString("en-GB")} kg · GHS {Number(o.total_ghs).toLocaleString("en-GB", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-charcoal-500">
            {o.id.slice(0, 8)} · {formatDate(o.created_at)} · {o.payment_method.replace("_", " ")} · {o.delivery_method}
          </p>
        </Card>
      ))}
    </div>
  );
}
