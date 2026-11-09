import {
  CommunicationsTemplatesHome,
  CommunicationsTemplatesSkeleton,
} from "@/components/communications/communications-templates-home";
import { Suspense } from "react";
import { siteConfig } from "@/config/site";

export const metadata = {
  title: "Message templates",
  description: `Reusable communication templates in ${siteConfig.name}.`,
};

export default function CommunicationsTemplatesPage() {
  return (
    <Suspense fallback={<CommunicationsTemplatesSkeleton />}>
      <CommunicationsTemplatesHome />
    </Suspense>
  );
}
