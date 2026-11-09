import { Suspense } from "react";

import {
  ActivityDetailSkeleton,
  ActivityDetailView,
} from "@/components/activities/activity-detail-view";
import { siteConfig } from "@/config/site";

export async function generateMetadata({ params }) {
  const { id } = await params;
  return {
    title: `Activity · ${siteConfig.name}`,
    description: `Activity ${id} in ${siteConfig.name}.`,
  };
}

async function ActivityDetailContent({ params, searchParams }) {
  const { id } = await params;
  const sp = await searchParams;
  const kind = sp?.kind === "task" ? "task" : "activity";
  return <ActivityDetailView activityId={id} kind={kind} />;
}

export default function ActivityDetailRoute({ params, searchParams }) {
  return (
    <Suspense fallback={<ActivityDetailSkeleton />}>
      <ActivityDetailContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
