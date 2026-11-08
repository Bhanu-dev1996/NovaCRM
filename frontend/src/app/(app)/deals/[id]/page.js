import { Suspense } from "react";

import {
  DealDetailSkeleton,
  DealDetailView,
} from "@/components/deals/deal-detail-view";
import { siteConfig } from "@/config/site";

export async function generateMetadata({ params }) {
  const { id } = await params;
  return {
    title: `Deal · ${siteConfig.name}`,
    description: `Deal ${id} in ${siteConfig.name}.`,
  };
}

async function DealDetailContent({ params }) {
  const { id } = await params;
  return <DealDetailView dealId={id} />;
}

export default function DealDetailRoute({ params }) {
  return (
    <Suspense fallback={<DealDetailSkeleton />}>
      <DealDetailContent params={params} />
    </Suspense>
  );
}
