import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";

export const metadata = {
  title: "Communications",
  description: "Email and conversation history.",
};

export default function CommunicationsPage() {
  return (
    <ModulePlaceholder
      title="Communications"
      description="Email threads, call logs, and customer conversations."
    />
  );
}
