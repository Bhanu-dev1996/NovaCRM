import { Suspense } from "react";

import { CalendarHome } from "@/components/calendar/calendar-home";
import { CrmSkeleton } from "@/components/crm/crm-shared";
import { siteConfig } from "@/config/site";

export const metadata = {
  title: "Calendar",
  description: `Meetings and schedule in ${siteConfig.name}.`,
};

export default function CalendarPage() {
  return (
    <Suspense fallback={<CrmSkeleton />}>
      <CalendarHome />
    </Suspense>
  );
}
