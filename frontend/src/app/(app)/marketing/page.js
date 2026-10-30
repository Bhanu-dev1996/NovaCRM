import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";

export const metadata = {
  title: "Marketing",
  description: "Campaigns and nurturing.",
};

export default function MarketingPage() {
  return (
    <ModulePlaceholder
      title="Marketing"
      description="Campaigns, sequences, and lead nurturing tools."
    />
  );
}
