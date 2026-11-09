import { Suspense } from "react";

import {
  CommunicationsHome,
  CommunicationsSkeleton,
} from "@/components/communications/communications-home";
import { siteConfig } from "@/config/site";

export const metadata = {
  title: "Communications",
  description: `Unified inbox and customer conversations in ${siteConfig.name}.`,
};

export default function CommunicationsPage() {
  return (
    <Suspense fallback={<CommunicationsSkeleton />}>
      <CommunicationsHome />
    </Suspense>
  );
}
