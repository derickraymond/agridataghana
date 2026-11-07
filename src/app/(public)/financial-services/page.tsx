import { ContentPage } from "@/components/layout/content-page";
import { CONTENT } from "@/lib/config/content";

export const metadata = { title: CONTENT["financial-services"].title };

export default function Page() {
  return <ContentPage slug="financial-services" />;
}
