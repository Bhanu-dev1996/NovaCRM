import { ActivitiesHome } from "@/components/activities/activities-home";
import { siteConfig } from "@/config/site";

export const metadata = {
  title: "Activities",
  description: `Manage tasks, meetings, calls, and customer interactions in ${siteConfig.name}.`,
};

export default function ActivitiesPage() {
  return <ActivitiesHome />;
}
