import { WorkspaceSetupForm } from "@/components/auth/workspace-setup-form";
import { siteConfig } from "@/config/site";

export const metadata = {
  title: "Workspace setup",
  description: `Set up your ${siteConfig.name} workspace`,
};

export default function WorkspaceSetupPage() {
  return <WorkspaceSetupForm />;
}
