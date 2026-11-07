import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { markMessageHandled } from "@/features/admin/actions";
import { formatDate } from "@/lib/admin/data";
import type { ContactMessage } from "@/types/database";

export const metadata = { title: "Messages" };

export default async function Page() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(100);
  const messages = (data as ContactMessage[] | null) ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-semibold text-forest-900">Contact messages</h1>
        <p className="mt-1 text-charcoal-500">Messages sent through the public contact form.</p>
      </div>
      {messages.length === 0 && <Card className="text-charcoal-500">No messages yet.</Card>}
      {messages.map((m) => (
        <Card key={m.id} className="space-y-2 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-forest-900">{m.subject}</p>
            <Badge tone={m.handled ? "green" : "earth"}>{m.handled ? "Handled" : "New"}</Badge>
          </div>
          <p className="text-sm text-charcoal-500">
            {m.name} · <a className="text-forest-700 underline" href={`mailto:${m.email}`}>{m.email}</a> · {formatDate(m.created_at)}
          </p>
          <p className="whitespace-pre-wrap text-sm text-charcoal-700">{m.message}</p>
          <form action={markMessageHandled}>
            <input type="hidden" name="messageId" value={m.id} />
            <input type="hidden" name="handled" value={String(!m.handled)} />
            <Button size="sm" variant="outline">
              {m.handled ? "Mark as new" : "Mark as handled"}
            </Button>
          </form>
        </Card>
      ))}
    </div>
  );
}
