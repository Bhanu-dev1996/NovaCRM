import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";
import { siteConfig } from "@/config/site";

export const metadata = {
  title: "Activities",
  description: "Calls, emails, and meeting history.",
};

export default function ActivitiesPage() {
  return (
    <ModulePlaceholder
      title="Activities"
      description={`Calls, emails, and meeting history. Connected to your ${siteConfig.name} workspace.`}
    />
  );
}
