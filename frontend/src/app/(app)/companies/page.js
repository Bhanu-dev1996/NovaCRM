import { Suspense } from "react";

import { CompaniesHome } from "@/components/companies/companies-home";
import { CrmSkeleton } from "@/components/crm/crm-shared";
import { siteConfig } from "@/config/site";

export const metadata = {
  title: "Companies",
  description: `Manage accounts and organizations in ${siteConfig.name}.`,
};

export default function CompaniesPage() {
  return (
    <Suspense fallback={<CrmSkeleton />}>
      <CompaniesHome />
    </Suspense>
  );
}
