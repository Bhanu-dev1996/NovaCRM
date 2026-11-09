import {
  CommunicationsSettingsHome,
  CommunicationsSettingsSkeleton,
} from "@/components/communications/communications-settings-home";
import { Suspense } from "react";
import { siteConfig } from "@/config/site";

export const metadata = {
  title: "Communication settings",
  description: `Channel and notification settings for ${siteConfig.name}.`,
};

export default function CommunicationsSettingsPage() {
  return (
    <Suspense fallback={<CommunicationsSettingsSkeleton />}>
      <CommunicationsSettingsHome />
    </Suspense>
  );
}
