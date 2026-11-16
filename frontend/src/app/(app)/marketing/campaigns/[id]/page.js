import { Suspense } from "react";

import { MarketingCampaignDetail } from "@/components/marketing/marketing-campaign-detail";
import { MarketingOverviewSkeleton } from "@/components/marketing/marketing-overview-home";
import { siteConfig } from "@/config/site";

export const metadata = {
  title: "Campaign",
  description: `Campaign detail in ${siteConfig.name}.`,
};

export default async function CampaignDetailPage({ params }) {
  const { id } = await params;
  return (
    <Suspense fallback={<MarketingOverviewSkeleton />}>
      <MarketingCampaignDetail campaignId={id} />
    </Suspense>
  );
}
