import { Suspense } from "react";

import {
  MarketingTemplatesHome,
  MarketingTemplatesSkeleton,
} from "@/components/marketing/marketing-templates-home";
import { siteConfig } from "@/config/site";

export const metadata = {
  title: "Marketing templates",
  description: `Reusable campaign content in ${siteConfig.name}.`,
};

export default function MarketingTemplatesPage() {
  return (
    <Suspense fallback={<MarketingTemplatesSkeleton />}>
      <MarketingTemplatesHome />
    </Suspense>
  );
}
