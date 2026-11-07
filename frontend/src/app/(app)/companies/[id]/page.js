import { Suspense } from "react";

import { CompanyDetailView } from "@/components/companies/company-detail-view";
import { CompanyDetailSkeleton } from "@/components/companies/company-detail-view-skeleton";
import { siteConfig } from "@/config/site";

export async function generateMetadata({ params }) {
  const { id } = await params;
  return {
    title: `Company · ${siteConfig.name}`,
    description: `Company profile ${id} in ${siteConfig.name}.`,
  };
}

async function CompanyDetailContent({ params }) {
  const { id } = await params;
  return <CompanyDetailView companyId={id} />;
}

export default function CompanyDetailPage({ params }) {
  return (
    <Suspense fallback={<CompanyDetailSkeleton />}>
      <CompanyDetailContent params={params} />
    </Suspense>
  );
}
