import { Suspense } from "react";

import { MarketingCampaignWizardProvider } from "@/components/marketing/marketing-campaign-wizard-provider";

export default function MarketingLayout({ children }) {
  return (
    <Suspense>
      <MarketingCampaignWizardProvider>{children}</MarketingCampaignWizardProvider>
    </Suspense>
  );
}