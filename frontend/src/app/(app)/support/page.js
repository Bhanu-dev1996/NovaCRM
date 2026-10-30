import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";

export const metadata = {
  title: "Customer Support",
  description: "Tickets and customer care.",
};

export default function SupportPage() {
  return (
    <ModulePlaceholder
      title="Customer Support"
      description="Tickets, SLAs, and customer care workflows."
    />
  );
}
