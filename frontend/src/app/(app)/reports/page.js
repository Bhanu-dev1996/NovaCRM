import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";

export const metadata = {
  title: "Reports & Analytics",
  description: "Performance reporting.",
};

export default function ReportsPage() {
  return (
    <ModulePlaceholder
      title="Reports & Analytics"
      description="Pipeline health, conversion, and team performance reports."
    />
  );
}
