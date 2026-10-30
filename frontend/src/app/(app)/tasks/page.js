import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";
import { siteConfig } from "@/config/site";

export const metadata = {
  title: "Tasks",
  description: "Follow-ups and to-dos for your team.",
};

export default function TasksPage() {
  return (
    <ModulePlaceholder
      title="Tasks"
      description={`Follow-ups and to-dos for your team. Connected to your ${siteConfig.name} workspace.`}
    />
  );
}
