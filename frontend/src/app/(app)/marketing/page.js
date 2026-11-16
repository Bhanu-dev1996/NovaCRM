import { Suspense } from "react";

import {
  MarketingOverviewHome,
  MarketingOverviewSkeleton,
} from "@/components/marketing/marketing-overview-home";
import { siteConfig } from "@/config/site";

export const metadata = {
  title: "Marketing",
  description: `Campaigns, audiences, and engagement in ${siteConfig.name}.`,
};

export default function MarketingPage() {
  return (
    <Suspense fallback={<MarketingOverviewSkeleton />}>
      <MarketingOverviewHome />
    </Suspense>
  );
}
