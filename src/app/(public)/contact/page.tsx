import { Alert } from "@/components/ui/card";
import { ContactForm } from "@/features/authentication/contact-form";
import { isSupabaseConfigured } from "@/lib/config/env";

export const metadata = { title: "Contact Us" };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-widest text-fresh-600">Contact</p>
      <h1 className="mt-2 text-4xl font-semibold text-forest-900">Contact us</h1>
      <p className="mt-3 text-charcoal-500">Questions, partnerships or support requests: send us a message and we will reply by email.</p>
      <div className="mt-8 space-y-4">
        {!isSupabaseConfigured && <Alert tone="warning">Messaging is pending configuration of the platform database.</Alert>}
        <ContactForm />
      </div>
    </div>
  );
}
