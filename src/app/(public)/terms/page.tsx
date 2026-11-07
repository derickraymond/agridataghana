import { ContentPage } from "@/components/layout/content-page";
import { CONTENT } from "@/lib/config/content";

export const metadata = { title: CONTENT["terms"].title };

export default function Page() {
  return <ContentPage slug="terms" />;
}
