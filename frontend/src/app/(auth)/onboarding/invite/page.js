import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";

import { NovaLogo } from "@/components/auth/nova-logo";
import { siteConfig } from "@/config/site";

export const metadata = {
  title: "Invite your team",
  description: `Invite teammates to your ${siteConfig.name} workspace`,
};

export default function InviteOnboardingPage() {
  return (
    <div className="flex h-full min-h-dvh flex-col bg-white">
      <div className="border-b border-neutral-100 bg-[#0b0620] px-6 py-3.5 desktop:hidden">
        <NovaLogo compact markClassName="size-8" />
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-8 desktop:px-10">
        <div className="w-full max-w-[420px] text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl border border-primary-100 bg-primary-50 text-primary-600">
            <Users className="size-7" aria-hidden="true" />
          </div>
          <h2 className="text-[28px] leading-8 font-bold tracking-[-0.025em] text-neutral-900">
            Invite your team
          </h2>
          <p className="mt-2 text-[14px] leading-5 text-neutral-500">
            Team invites come next. For now you can continue into your
            workspace and invite teammates from settings later.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary-600 text-[14px] font-semibold text-white hover:bg-primary-700"
          >
            Go to dashboard
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
