import { Suspense } from "react";

import { LeadsHome, LeadsSkeleton } from "@/components/leads/leads-home";
import { siteConfig } from "@/config/site";

export const metadata = {
  title: "Leads",
  description: `Capture, organize, and convert prospects in ${siteConfig.name}.`,
};

export default function LeadsPage() {
  return (
    <Suspense fallback={<LeadsSkeleton />}>
      <LeadsHome />
    </Suspense>
  );
}
