import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Alert, Badge, Card } from "@/components/ui/card";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { advanceOrder, recordPayment } from "@/features/orders/actions";
import { formatDate } from "@/lib/admin/data";
import { ROLE_DASHBOARD } from "@/lib/config/roles";
import type { Order, OrderStatus } from "@/types/database";

export const metadata = { title: "Orders" };

const TRADERS = ["farmer", "cooperative", "aggregator", "agro_dealer", "buyer", "processor", "exporter"] as const;
const TONE: Record<OrderStatus, "green" | "earth" | "grey"> = {
  pending: "earth",
  accepted: "green",
  dispatched: "green",
  delivered: "green",
  completed: "green",
  rejected: "grey",
  cancelled: "grey",
};
const METHOD = { mobile_money: "Mobile money", cash: "Cash", bank_transfer: "Bank transfer" } as const;

function Act({ id, status, label, variant = "primary" }: { id: string; status: string; label: string; variant?: "primary" | "outline" }) {
  return (
    <form action={advanceOrder}>
      <input type="hidden" name="orderId" value={id} />
      <input type="hidden" name="status" value={status} />
      <Button size="sm" variant={variant}>
        {label}
      </Button>
    </form>
  );
}

function OrderCard({ o, mine }: { o: Order; mine: "buyer" | "seller" }) {
  const seller = mine === "seller";
  return (
    <Card className="space-y-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href={`/marketplace/${o.listing_id}`} className="font-semibold text-forest-900 underline">
          {o.title}
        </Link>
        <div className="flex gap-2">
          <Badge tone={TONE[o.status]}>{o.status}</Badge>
          <Badge tone={o.payment_status === "paid" ? "green" : "grey"}>{o.payment_status === "paid" ? "Paid" : "Unpaid"}</Badge>
        </div>
      </div>
      <p className="text-sm text-charcoal-700">
        {Number(o.quantity_kg).toLocaleString("en-GB")} kg × GHS {Number(o.unit_price_ghs).toFixed(2)} ={" "}
        <strong>GHS {Number(o.total_ghs).toLocaleString("en-GB", { minimumFractionDigits: 2 })}</strong>
      </p>
      <p className="text-xs text-charcoal-500">
        Order {o.id.slice(0, 8)} · {formatDate(o.created_at)} · {METHOD[o.payment_method]} ·{" "}
        {o.delivery_method === "delivery" ? `Delivery to ${o.delivery_address}` : "Pickup"} · Contact {o.contact_phone}
      </p>
      {o.notes && <p className="text-sm text-charcoal-700">Note: {o.notes}</p>}
      {o.payment_status === "paid" && (
        <p className="rounded-lg bg-forest-50 p-2 text-sm text-forest-900">
          Payment recorded{o.payment_reference ? ` (ref ${o.payment_reference})` : ""}
          {o.paid_at ? ` on ${formatDate(o.paid_at)}` : ""}.
        </p>
      )}
      <div className="flex flex-wrap items-end gap-2">
        {seller && o.status === "pending" && (
          <>
            <Act id={o.id} status="accepted" label="Accept" />
            <Act id={o.id} status="rejected" label="Reject" variant="outline" />
          </>
        )}
        {seller && o.status === "accepted" && <Act id={o.id} status="dispatched" label="Mark dispatched" />}
        {seller && o.status === "dispatched" && <Act id={o.id} status="delivered" label="Mark delivered" />}
        {!seller && o.status === "delivered" && <Act id={o.id} status="completed" label="Confirm received" />}
        {!seller && ["pending", "accepted"].includes(o.status) && o.payment_status === "unpaid" && (
          <Act id={o.id} status="cancelled" label="Cancel order" variant="outline" />
        )}
        {seller && o.payment_status === "unpaid" && ["accepted", "dispatched", "delivered", "completed"].includes(o.status) && (
          <form action={recordPayment} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="orderId" value={o.id} />
            <Input name="reference" placeholder="Payment reference (optional)" maxLength={80} aria-label="Payment reference" className="w-56" />
            <Button size="sm" variant="outline">
              Record payment received
            </Button>
          </form>
        )}
      </div>
    </Card>
  );
}

export default async function Page({ searchParams }: { searchParams: Promise<{ placed?: string }> }) {
  const { profile } = await requireRole([...TRADERS]);
  const { placed } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(100);
  const all = (data as unknown as Order[] | null) ?? [];
  const received = all.filter((o) => o.seller_id === profile.id);
  const placedOrders = all.filter((o) => o.buyer_id === profile.id);
  const isSeller = ["farmer", "cooperative", "aggregator"].includes(profile.role);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-forest-900">Orders</h1>
          <p className="mt-1 text-charcoal-500">Orders you have placed and received, with delivery and payment records.</p>
        </div>
        <div className="flex gap-2">
          <ButtonLink href="/marketplace" variant="outline" size="sm">
            Marketplace
          </ButtonLink>
          <ButtonLink href={ROLE_DASHBOARD[profile.role]} variant="outline" size="sm">
            Dashboard
          </ButtonLink>
        </div>
      </div>
      {placed && <Alert tone="success">Order placed. The seller will review it.</Alert>}

      {(isSeller || received.length > 0) && (
        <section aria-label="Orders received" className="space-y-3">
          <h2 className="text-xl font-semibold text-forest-900">Received ({received.length})</h2>
          {received.length === 0 && <Card className="text-charcoal-500">No orders on your listings yet.</Card>}
          {received.map((o) => (
            <OrderCard key={o.id} o={o} mine="seller" />
          ))}
        </section>
      )}

      <section aria-label="Orders placed" className="space-y-3">
        <h2 className="text-xl font-semibold text-forest-900">Placed ({placedOrders.length})</h2>
        {placedOrders.length === 0 && (
          <Card className="text-charcoal-500">
            You have not placed any orders. Browse the{" "}
            <Link href="/marketplace" className="font-semibold text-forest-700 underline">
              marketplace
            </Link>
            .
          </Card>
        )}
        {placedOrders.map((o) => (
          <OrderCard key={o.id} o={o} mine="buyer" />
        ))}
      </section>
    </div>
  );
}
