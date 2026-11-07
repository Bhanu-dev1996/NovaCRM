import { Suspense } from "react";

import { CompaniesHome } from "@/components/companies/companies-home";
import { CrmSkeleton } from "@/components/crm/crm-shared";
import { siteConfig } from "@/config/site";

export const metadata = {
  title: "Companies",
  description: `Manage organizations, business relationships, and company accounts in ${siteConfig.name}.`,
};

export default function CompaniesPage() {
  return (
    <Suspense fallback={<CrmSkeleton />}>
      <CompaniesHome />
    </Suspense>
  );
}
