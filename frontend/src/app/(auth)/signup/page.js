import { SignupForm } from "@/components/auth/signup-form";
import { siteConfig } from "@/config/site";

export const metadata = {
  title: "Create account",
  description: `Create your ${siteConfig.name} workspace`,
};

export default function SignupPage() {
  return <SignupForm />;
}
