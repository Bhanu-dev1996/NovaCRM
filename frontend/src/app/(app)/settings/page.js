import { Suspense } from "react";

import {
  SettingsHome,
  SettingsSkeletonExport as SettingsSkeleton,
} from "@/components/settings/settings-home";
import { siteConfig } from "@/config/site";

export const metadata = {
  title: "Settings",
  description: `Manage your ${siteConfig.name} workspace`,
};

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsHome />
    </Suspense>
  );
}
