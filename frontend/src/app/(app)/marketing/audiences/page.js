import { Suspense } from "react";

import {
  MarketingAudiencesHome,
  MarketingAudiencesSkeleton,
} from "@/components/marketing/marketing-audiences-home";
import { siteConfig } from "@/config/site";

export const metadata = {
  title: "Audiences",
  description: `Marketing segments in ${siteConfig.name}.`,
};

export default function MarketingAudiencesPage() {
  return (
    <Suspense fallback={<MarketingAudiencesSkeleton />}>
      <MarketingAudiencesHome />
    </Suspense>
  );
}
