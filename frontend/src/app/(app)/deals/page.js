import { Suspense } from "react";

import { CrmSkeleton } from "@/components/crm/crm-shared";
import { DealsHome } from "@/components/deals/deals-home";
import { siteConfig } from "@/config/site";

export const metadata = {
  title: "Deals",
  description: `Track opportunities across stages in ${siteConfig.name}.`,
};

export default function DealsPage() {
  return (
    <Suspense fallback={<CrmSkeleton />}>
      <DealsHome />
    </Suspense>
  );
}
