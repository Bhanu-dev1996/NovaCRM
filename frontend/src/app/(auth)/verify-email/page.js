import { Suspense } from "react";

import { VerifyEmailForm } from "@/components/auth/verify-email-form";
import { siteConfig } from "@/config/site";

export const metadata = {
  title: "Verify email",
  description: `Confirm your email to continue to ${siteConfig.name}`,
};

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailForm />
    </Suspense>
  );
}
