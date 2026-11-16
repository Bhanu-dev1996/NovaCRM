import { Suspense } from "react";

import { MarketingCampaignsHome } from "@/components/marketing/marketing-campaigns-home";
import { MarketingOverviewSkeleton } from "@/components/marketing/marketing-overview-home";
import { siteConfig } from "@/config/site";

export const metadata = {
  title: "Campaigns",
  description: `Marketing campaigns in ${siteConfig.name}.`,
};

export default function MarketingCampaignsPage() {
  return (
    <Suspense fallback={<MarketingOverviewSkeleton />}>
      <MarketingCampaignsHome />
    </Suspense>
  );
}
