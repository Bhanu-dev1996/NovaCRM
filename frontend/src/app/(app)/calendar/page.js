import { Suspense } from "react";

import { CalendarHome } from "@/components/calendar/calendar-home";
import { CalendarSkeleton } from "@/components/calendar/calendar-skeleton";
import { siteConfig } from "@/config/site";

export const metadata = {
  title: "Calendar",
  description: `Full calendar for meetings, tasks, and due dates in ${siteConfig.name}.`,
};

export default function CalendarPage() {
  return (
    <Suspense fallback={<CalendarSkeleton />}>
      <CalendarHome />
    </Suspense>
  );
}
