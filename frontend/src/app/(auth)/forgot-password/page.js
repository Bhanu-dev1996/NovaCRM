import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { siteConfig } from "@/config/site";

export const metadata = {
  title: "Forgot password",
  description: `Reset your ${siteConfig.name} password`,
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
