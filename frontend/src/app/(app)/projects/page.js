import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";

export const metadata = {
  title: "Projects",
  description: "Delivery and project tracking.",
};

export default function ProjectsPage() {
  return (
    <ModulePlaceholder
      title="Projects"
      description="Track delivery work tied to accounts and closed deals."
    />
  );
}
