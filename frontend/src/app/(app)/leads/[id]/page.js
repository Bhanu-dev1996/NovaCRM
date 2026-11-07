import { Suspense } from "react";

import { LeadDetailView } from "@/components/leads/lead-detail-view";
import { LeadDetailSkeleton } from "@/components/leads/lead-skeletons";
import { siteConfig } from "@/config/site";

export async function generateMetadata({ params }) {
  const { id } = await params;
  return {
    title: `Lead · ${siteConfig.name}`,
    description: `Lead profile ${id} in ${siteConfig.name}.`,
  };
}

async function LeadDetailContent({ params }) {
  const { id } = await params;
  return <LeadDetailView leadId={id} />;
}

export default function LeadDetailPage({ params }) {
  return (
    <Suspense fallback={<LeadDetailSkeleton />}>
      <LeadDetailContent params={params} />
    </Suspense>
  );
}
