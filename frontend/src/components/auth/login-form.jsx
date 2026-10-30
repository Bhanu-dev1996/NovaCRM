"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CircleAlert,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
} from "lucide-react";
import { motion } from "motion/react";

import { GoogleIcon } from "@/components/auth/google-icon";
import { NovaLogo } from "@/components/auth/nova-logo";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, getGoogleAuthUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

const OAUTH_ERROR_MESSAGES = {
  OAuthSignin: "Could not start Google sign-in. Please try again.",
  OAuthCallback: "Google sign-in failed during callback. Please try again.",
  OAuthCreateAccount: "Could not create your account with Google.",
  OAuthAccountNotLinked:
    "This email is already linked to another sign-in method.",
  Callback: "Google sign-in was interrupted. Please try again.",
  AccessDenied: "Google sign-in was cancelled or access was denied.",
  access_denied: "Google sign-in was cancelled or access was denied.",
  Configuration:
    "Sign-in is not configured. Check Google OAuth and Supabase settings on the backend.",
  Default: "Something went wrong with Google sign-in. Please try again.",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

function FieldError({ id, children }) {
  if (!children) return null;

  return (
    <p id={id} role="alert" className="text-[12px] leading-4 text-error">
      {children}
    </p>
  );
}

function AuthErrorBanner({ children }) {
  if (!children) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-lg border border-error-border bg-error-surface px-3 py-2.5"
    >
      <CircleAlert
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-error"
      />
      <p className="text-[13px] leading-5 text-error-text">{children}</p>
    </div>
  );
}

function validateEmail(value) {
  const email = value.trim();
  if (!email) return "Please enter your email address.";
  if (!EMAIL_PATTERN.test(email)) {
    return "Please enter a valid email address (e.g. name@company.com)";
  }
  return "";
}

function validatePassword(value) {
  if (!value) return "Please enter your password.";
  if (value.length < 8) return "Password must be at least 8 characters.";
  return "";
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [formError, setFormError] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    const errorCode = searchParams.get("error");
    if (!errorCode) return;

    setFormError(
      OAUTH_ERROR_MESSAGES[errorCode] ?? OAUTH_ERROR_MESSAGES.Default
    );
  }, [searchParams]);

  function setFieldError(field, message) {
    setErrors((current) => ({ ...current, [field]: message }));
  }

  function handleGoogleSignIn() {
    setFormError("");
    setIsGoogleLoading(true);
    window.location.href = getGoogleAuthUrl();
  }

  function handleEmailBlur() {
    setTouched((current) => ({ ...current, email: true }));
    setFieldError("email", validateEmail(email));
  }

  function handlePasswordBlur() {
    setTouched((current) => ({ ...current, password: true }));
    setFieldError("password", validatePassword(password));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = {
      email: validateEmail(email),
      password: validatePassword(password),
    };

    setTouched({ email: true, password: true });
    setErrors(nextErrors);

    if (nextErrors.email || nextErrors.password) {
      setFormError("");
      return;
    }

    setFormError("");
    setIsSigningIn(true);

    try {
      await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });
      // Full navigation avoids the Sign In click landing on Sign out.
      window.location.assign("/");
    } catch (error) {
      if (error?.code === "EMAIL_NOT_VERIFIED") {
        const pendingEmail =
          error.payload?.email || email.trim();
        window.location.assign(
          `/verify-email?email=${encodeURIComponent(pendingEmail)}`
        );
        return;
      }
      setIsSigningIn(false);
      setFormError(
        error instanceof Error
          ? error.message
          : "Invalid email or password. Please verify your credentials."
      );
    }
  }

  const emailInvalid = Boolean(touched.email && errors.email);
  const passwordInvalid = Boolean(touched.password && errors.password);

  return (
    <div className="flex h-full min-h-dvh flex-col bg-white">
      <div className="border-b border-neutral-100 bg-[#0b0620] px-6 py-3.5 desktop:hidden">
        <NovaLogo compact markClassName="size-8" />
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-4 desktop:px-10">
        <motion.div
          initial="hidden"
          animate="show"
          className="w-full max-w-[400px]"
        >
          <motion.div custom={0.05} variants={fadeUp} className="mb-5">
            <h2 className="text-[28px] leading-8 font-bold tracking-[-0.025em] text-neutral-900">
              Welcome back
            </h2>
            <p className="mt-1.5 text-[14px] leading-5 text-neutral-500">
              Sign in to continue to your workspace.
            </p>
          </motion.div>

          {formError ? (
            <motion.div custom={0.08} variants={fadeUp} className="mb-4">
              <AuthErrorBanner>{formError}</AuthErrorBanner>
            </motion.div>
          ) : null}

          <motion.div custom={0.1} variants={fadeUp}>
            <Button
              type="button"
              variant="outline"
              disabled={isGoogleLoading || isSigningIn}
              onClick={handleGoogleSignIn}
              className="h-10 w-full justify-center gap-2.5 rounded-lg border-neutral-200 bg-white text-[14px] font-medium text-neutral-800 shadow-none hover:bg-neutral-50 disabled:opacity-100"
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin text-neutral-500" />
                  Connecting to Google...
                </>
              ) : (
                <>
                  <GoogleIcon className="size-[18px]" />
                  Continue with Google
                </>
              )}
            </Button>
          </motion.div>

          <motion.div
            custom={0.14}
            variants={fadeUp}
            className="my-4 flex items-center gap-3"
          >
            <div className="h-px flex-1 bg-neutral-200" />
            <span className="text-[11px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
              Or continue with email
            </span>
            <div className="h-px flex-1 bg-neutral-200" />
          </motion.div>

          <motion.form
            custom={0.18}
            variants={fadeUp}
            onSubmit={handleSubmit}
            noValidate
            className="space-y-3.5"
          >
            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-[13px] font-medium text-neutral-700"
              >
                Email
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setFormError("");
                    if (touched.email) {
                      setFieldError("email", validateEmail(event.target.value));
                    }
                  }}
                  onBlur={handleEmailBlur}
                  aria-invalid={emailInvalid || undefined}
                  aria-describedby={emailInvalid ? "email-error" : undefined}
                  className={cn(
                    "h-10 rounded-lg border-neutral-200 bg-white pl-10 text-[14px] text-neutral-900 placeholder:text-neutral-400",
                    emailInvalid
                      ? "border-error pr-10 focus-visible:border-error focus-visible:ring-error/20"
                      : "pr-3 focus-visible:border-primary-500 focus-visible:ring-primary-500/20"
                  )}
                />
                {emailInvalid ? (
                  <CircleAlert
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-error"
                  />
                ) : null}
              </div>
              <FieldError id="email-error">
                {emailInvalid ? errors.email : null}
              </FieldError>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <Label
                  htmlFor="password"
                  className="text-[13px] font-medium text-neutral-700"
                >
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-[13px] font-medium text-primary-600 hover:text-primary-700"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setFormError("");
                    if (touched.password) {
                      setFieldError(
                        "password",
                        validatePassword(event.target.value)
                      );
                    }
                  }}
                  onBlur={handlePasswordBlur}
                  aria-invalid={passwordInvalid || undefined}
                  aria-describedby={
                    passwordInvalid ? "password-error" : undefined
                  }
                  className={cn(
                    "h-10 rounded-lg border-neutral-200 bg-white pl-10 text-[14px] text-neutral-900 placeholder:text-neutral-400",
                    passwordInvalid
                      ? "border-error pr-16 focus-visible:border-error focus-visible:ring-error/20"
                      : "pr-10 focus-visible:border-primary-500 focus-visible:ring-primary-500/20"
                  )}
                />
                <div className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-1.5">
                  {passwordInvalid ? (
                    <CircleAlert
                      aria-hidden="true"
                      className="size-4 text-error"
                    />
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="text-neutral-400 transition-colors hover:text-neutral-600"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>
              <FieldError id="password-error">
                {passwordInvalid ? errors.password : null}
              </FieldError>
            </div>

            <label className="flex cursor-pointer items-center gap-2.5">
              <Checkbox
                checked={remember}
                onCheckedChange={(value) => setRemember(Boolean(value))}
                className="size-[18px] rounded-[4px] border-neutral-300 data-checked:border-primary-600 data-checked:bg-primary-600"
              />
              <span className="text-[13px] text-neutral-600">
                Remember this device for 30 days
              </span>
            </label>

            <Button
              type="submit"
              disabled={isSigningIn}
              className={cn(
                "h-10 w-full gap-2 rounded-lg text-[14px] font-semibold text-white shadow-2",
                "transition-all active:scale-[0.99]",
                isSigningIn
                  ? "cursor-wait bg-primary-300 hover:bg-primary-300 disabled:opacity-100"
                  : "bg-primary-600 hover:bg-primary-700"
              )}
            >
              {isSigningIn ? (
                <>
                  <Loader2 className="size-4 animate-spin text-white/90" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </motion.form>

          <motion.p
            custom={0.24}
            variants={fadeUp}
            className="mt-5 text-center text-[13px] text-neutral-500"
          >
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-semibold text-primary-600 hover:text-primary-700"
            >
              Create account
            </Link>
          </motion.p>
        </motion.div>
      </div>

      <footer className="flex shrink-0 flex-wrap items-center justify-center gap-x-2 gap-y-1 px-6 py-4 text-[12px] text-neutral-400 desktop:px-10">
        <Link
          href="/terms"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-neutral-600"
        >
          Terms of Service
        </Link>
        <span aria-hidden="true">·</span>
        <Link
          href="/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-neutral-600"
        >
          Privacy Policy
        </Link>
        <span aria-hidden="true">·</span>
        <Link
          href="/help"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-neutral-600"
        >
          Help &amp; Documentation
        </Link>
      </footer>
    </div>
  );
}
