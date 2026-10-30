import { Suspense } from "react";

import {
  DashboardHome,
  DashboardSkeleton,
} from "@/components/dashboard/dashboard-home";
import { siteConfig } from "@/config/site";

export const metadata = {
  title: "Overview",
  description: `${siteConfig.name} overview`,
};

export default function OverviewPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardHome />
    </Suspense>
  );
}
