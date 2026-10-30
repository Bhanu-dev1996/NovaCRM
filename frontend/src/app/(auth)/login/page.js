import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";
import { siteConfig } from "@/config/site";

export const metadata = {
  title: "Sign in",
  description: `Sign in to your ${siteConfig.name} workspace`,
};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
