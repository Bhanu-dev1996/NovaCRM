"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  CircleCheck,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  X,
} from "lucide-react";
import { motion } from "motion/react";

import { NovaLogo } from "@/components/auth/nova-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

const REQUIREMENTS = [
  {
    id: "length",
    label: "At least 8 characters",
    test: (value) => value.length >= 8,
  },
  {
    id: "case",
    label: "Upper and lowercase letters",
    test: (value) => /[a-z]/.test(value) && /[A-Z]/.test(value),
  },
  {
    id: "number",
    label: "At least one number",
    test: (value) => /\d/.test(value),
  },
  {
    id: "symbol",
    label: "At least one symbol",
    test: (value) => /[^A-Za-z0-9]/.test(value),
  },
];

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

function PasswordRequirements({ password, showUnmet }) {
  return (
    <ul className="space-y-1.5" aria-live="polite">
      {REQUIREMENTS.map((requirement) => {
        const met = requirement.test(password);
        const emphasize = showUnmet && !met;
        return (
          <li
            key={requirement.id}
            className={cn(
              "flex items-center gap-2 text-[12px] leading-4",
              met
                ? "text-emerald-600"
                : emphasize
                  ? "text-error"
                  : "text-neutral-500"
            )}
          >
            <span
              className={cn(
                "flex size-4 items-center justify-center rounded-full",
                met
                  ? "bg-emerald-100 text-emerald-600"
                  : emphasize
                    ? "bg-error-surface text-error"
                    : "bg-neutral-100 text-neutral-400"
              )}
            >
              {met ? (
                <Check className="size-2.5" strokeWidth={3} />
              ) : (
                <X className="size-2.5" strokeWidth={3} />
              )}
            </span>
            {requirement.label}
          </li>
        );
      })}
    </ul>
  );
}

function ResetSuccess() {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      className="w-full max-w-[400px] text-center"
    >
      <motion.div
        custom={0.05}
        variants={fadeUp}
        className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-600"
      >
        <CircleCheck className="size-7" aria-hidden="true" />
      </motion.div>
      <motion.h2
        custom={0.1}
        variants={fadeUp}
        className="text-[28px] leading-8 font-bold tracking-[-0.025em] text-neutral-900"
      >
        Password updated
      </motion.h2>
      <motion.p
        custom={0.14}
        variants={fadeUp}
        className="mt-2 text-[14px] leading-5 text-neutral-500"
      >
        Your password has been reset successfully. You can sign in with your
        new password.
      </motion.p>
      <motion.div custom={0.2} variants={fadeUp} className="mt-6">
        <Link
          href="/login"
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary-600 text-[14px] font-semibold text-white hover:bg-primary-700"
        >
          <ArrowLeft className="size-4" />
          Back to Sign In
        </Link>
      </motion.div>
    </motion.div>
  );
}

function InvalidLink({ message }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      className="w-full max-w-[400px] text-center"
    >
      <motion.div
        custom={0.05}
        variants={fadeUp}
        className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-700"
      >
        <CircleAlert className="size-7" aria-hidden="true" />
      </motion.div>
      <motion.h2
        custom={0.1}
        variants={fadeUp}
        className="text-[28px] leading-8 font-bold tracking-[-0.025em] text-neutral-900"
      >
        Link expired or invalid
      </motion.h2>
      <motion.p
        custom={0.14}
        variants={fadeUp}
        className="mt-2 text-[14px] leading-5 text-neutral-500"
      >
        {message ||
          "This password reset link is no longer valid. Request a new one to continue."}
      </motion.p>
      <motion.div custom={0.2} variants={fadeUp} className="mt-6 space-y-3">
        <Link
          href="/forgot-password"
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary-600 text-[14px] font-semibold text-white hover:bg-primary-700"
        >
          Request a new link
          <ArrowRight className="size-4" />
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-1 text-[13px] font-medium text-neutral-500 hover:text-neutral-800"
        >
          <ArrowLeft className="size-3.5" />
          Back to Sign In
        </Link>
      </motion.div>
    </motion.div>
  );
}

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [linkStatus, setLinkStatus] = useState(token ? "checking" : "invalid");
  const [linkMessage, setLinkMessage] = useState(
    token ? "" : "This password reset link is missing or incomplete."
  );
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState({
    password: false,
    confirmPassword: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);

  const requirementsMet = useMemo(
    () => REQUIREMENTS.every((requirement) => requirement.test(password)),
    [password]
  );
  const passwordsMatch =
    Boolean(confirmPassword) && confirmPassword === password;
  const showUnmet = submitted || touched.password;
  const passwordError =
    showUnmet && !requirementsMet
      ? "Please meet all password requirements."
      : "";
  const confirmError =
    (submitted || touched.confirmPassword) && !passwordsMatch
      ? confirmPassword
        ? "Passwords do not match."
        : "Please confirm your password."
      : "";

  useEffect(() => {
    if (!token) return undefined;

    let cancelled = false;

    async function checkToken() {
      try {
        await apiFetch(
          `/api/auth/reset-password-status?token=${encodeURIComponent(token)}`
        );
        if (!cancelled) {
          setLinkStatus("valid");
          setLinkMessage("");
        }
      } catch (error) {
        if (cancelled) return;
        setLinkStatus("invalid");
        setLinkMessage(
          error instanceof Error
            ? error.message
            : "This password reset link is invalid or has expired."
        );
      }
    }

    checkToken();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
    setTouched({ password: true, confirmPassword: true });

    if (!requirementsMet || !passwordsMatch) {
      setFormError("");
      return;
    }

    setFormError("");
    setIsSubmitting(true);

    try {
      await apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      setResetComplete(true);
    } catch (error) {
      if (
        error?.code === "RESET_EXPIRED" ||
        error?.code === "RESET_INVALID" ||
        /expired|invalid/i.test(error?.message || "")
      ) {
        setLinkStatus("invalid");
        setLinkMessage(
          error instanceof Error
            ? error.message
            : "This password reset link is invalid or has expired."
        );
      } else {
        setFormError(
          error instanceof Error
            ? error.message
            : "Could not reset your password. Please try again."
        );
      }
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex h-full min-h-dvh flex-col bg-white">
      <div className="border-b border-neutral-100 bg-[#0b0620] px-6 py-3.5 desktop:hidden">
        <NovaLogo compact markClassName="size-8" />
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-8 desktop:px-10">
        {linkStatus === "checking" ? (
          <div className="flex items-center gap-2 text-[14px] text-neutral-500">
            <Loader2 className="size-4 animate-spin text-primary-600" />
            Checking reset link…
          </div>
        ) : resetComplete ? (
          <ResetSuccess />
        ) : linkStatus === "invalid" ? (
          <InvalidLink message={linkMessage} />
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            className="w-full max-w-[400px]"
          >
            <motion.div custom={0.05} variants={fadeUp} className="mb-6">
              <h2 className="text-[28px] leading-8 font-bold tracking-[-0.025em] text-neutral-900">
                Create a new password
              </h2>
              <p className="mt-1.5 text-[14px] leading-5 text-neutral-500">
                Choose a strong password to secure your account.
              </p>
            </motion.div>

            {formError ? (
              <motion.div custom={0.08} variants={fadeUp} className="mb-4">
                <AuthErrorBanner>{formError}</AuthErrorBanner>
              </motion.div>
            ) : null}

            <motion.form
              custom={0.1}
              variants={fadeUp}
              onSubmit={handleSubmit}
              noValidate
              className="space-y-3.5"
            >
              <div className="space-y-1.5">
                <Label
                  htmlFor="password"
                  className="text-[13px] font-medium text-neutral-700"
                >
                  New password
                </Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Create a password"
                    value={password}
                    disabled={isSubmitting}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setFormError("");
                    }}
                    onBlur={() =>
                      setTouched((current) => ({ ...current, password: true }))
                    }
                    aria-invalid={Boolean(passwordError) || undefined}
                    className={cn(
                      "h-10 rounded-lg border-neutral-200 bg-white pl-10 pr-10 text-[14px] text-neutral-900 placeholder:text-neutral-400",
                      passwordError
                        ? "border-error focus-visible:border-error focus-visible:ring-error/20"
                        : "focus-visible:border-primary-500 focus-visible:ring-primary-500/20"
                    )}
                  />
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 transition-colors hover:text-neutral-600 disabled:opacity-50"
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
                <PasswordRequirements
                  password={password}
                  showUnmet={showUnmet}
                />
                <FieldError id="password-error">{passwordError}</FieldError>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="confirmPassword"
                  className="text-[13px] font-medium text-neutral-700"
                >
                  Confirm password
                </Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    disabled={isSubmitting}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      setFormError("");
                    }}
                    onBlur={() =>
                      setTouched((current) => ({
                        ...current,
                        confirmPassword: true,
                      }))
                    }
                    aria-invalid={Boolean(confirmError) || undefined}
                    className={cn(
                      "h-10 rounded-lg border-neutral-200 bg-white pl-10 pr-10 text-[14px] text-neutral-900 placeholder:text-neutral-400",
                      confirmError
                        ? "border-error focus-visible:border-error focus-visible:ring-error/20"
                        : "focus-visible:border-primary-500 focus-visible:ring-primary-500/20"
                    )}
                  />
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 transition-colors hover:text-neutral-600 disabled:opacity-50"
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                <FieldError id="confirm-password-error">
                  {confirmError}
                </FieldError>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "h-10 w-full gap-2 rounded-lg text-[14px] font-semibold text-white shadow-2",
                  "transition-all active:scale-[0.99]",
                  isSubmitting
                    ? "cursor-wait bg-primary-300 hover:bg-primary-300 disabled:opacity-100"
                    : "bg-primary-600 hover:bg-primary-700"
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin text-white/90" />
                    Resetting password...
                  </>
                ) : (
                  <>
                    Reset password
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </motion.form>

            <motion.div
              custom={0.18}
              variants={fadeUp}
              className="mt-5 text-center"
            >
              <Link
                href="/login"
                className="inline-flex items-center gap-1 text-[13px] font-medium text-neutral-500 hover:text-neutral-800"
              >
                <ArrowLeft className="size-3.5" />
                Back to Sign In
              </Link>
            </motion.div>
          </motion.div>
        )}
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
