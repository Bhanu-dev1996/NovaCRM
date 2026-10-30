import { Suspense } from "react";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { siteConfig } from "@/config/site";

export const metadata = {
  title: "Reset password",
  description: `Create a new ${siteConfig.name} password`,
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
