"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CircleAlert,
  CircleCheck,
  Loader2,
  Mail,
} from "lucide-react";
import { motion } from "motion/react";

import { NovaLogo } from "@/components/auth/nova-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, maskEmail } from "@/lib/api";
import { cn } from "@/lib/utils";

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

function ResetSentConfirmation({ email, onSendAnother }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      className="w-full max-w-[400px]"
    >
      <motion.div
        custom={0.05}
        variants={fadeUp}
        className="mb-6 flex flex-col items-center text-center"
      >
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-600">
          <CircleCheck className="size-7" aria-hidden="true" />
        </div>
        <h2 className="text-[28px] leading-8 font-bold tracking-[-0.025em] text-neutral-900">
          Check your inbox
        </h2>
        <p className="mt-1.5 text-[14px] leading-5 text-neutral-500">
          If an account exists for{" "}
          <span className="font-medium text-neutral-700">
            {maskEmail(email)}
          </span>
          , we&apos;ve sent a password reset link. Follow it to choose a new
          password.
        </p>
      </motion.div>

      <motion.div custom={0.12} variants={fadeUp} className="space-y-3">
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-3 text-[13px] leading-5 text-neutral-600">
          Didn&apos;t get the email? Check spam, wait a minute, then try again
          from this page.
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={onSendAnother}
          className="h-10 w-full rounded-lg border-neutral-200"
        >
          Send another link
        </Button>
        <div className="pt-1 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-[13px] font-medium text-neutral-500 hover:text-neutral-800"
          >
            <ArrowLeft className="size-3.5" />
            Back to sign in
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const emailInvalid = Boolean(touched && error);

  async function handleSubmit(event) {
    event.preventDefault();

    const nextError = validateEmail(email);
    setTouched(true);
    setError(nextError);

    if (nextError) {
      setFormError("");
      return;
    }

    setFormError("");
    setIsSending(true);
    const normalizedEmail = email.trim();

    try {
      await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: normalizedEmail }),
      });
      setSentEmail(normalizedEmail);
    } catch (err) {
      setIsSending(false);
      setFormError(
        err instanceof Error
          ? err.message
          : "Could not send a reset link. Please try again."
      );
    }
  }

  return (
    <div className="flex h-full min-h-dvh flex-col bg-white">
      <div className="border-b border-neutral-100 bg-[#0b0620] px-6 py-3.5 desktop:hidden">
        <NovaLogo compact markClassName="size-8" />
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-8 desktop:px-10">
        {sentEmail ? (
          <ResetSentConfirmation
            email={sentEmail}
            onSendAnother={() => {
              setSentEmail("");
              setIsSending(false);
              setFormError("");
              setTouched(false);
              setError("");
            }}
          />
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            className="w-full max-w-[400px]"
          >
            <motion.div custom={0.05} variants={fadeUp} className="mb-6">
              <h2 className="text-[28px] leading-8 font-bold tracking-[-0.025em] text-neutral-900">
                Forgot your password?
              </h2>
              <p className="mt-1.5 text-[14px] leading-5 text-neutral-500">
                Enter your email and we&apos;ll send you a password reset link.
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
                    disabled={isSending}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setFormError("");
                      if (touched) {
                        setError(validateEmail(event.target.value));
                      }
                    }}
                    onBlur={() => {
                      setTouched(true);
                      setError(validateEmail(email));
                    }}
                    aria-invalid={emailInvalid || undefined}
                    aria-describedby={emailInvalid ? "email-error" : undefined}
                    className={cn(
                      "h-10 rounded-lg border-neutral-200 bg-white pl-10 text-[14px] text-neutral-900 placeholder:text-neutral-400",
                      emailInvalid
                        ? "border-error focus-visible:border-error focus-visible:ring-error/20"
                        : "focus-visible:border-primary-500 focus-visible:ring-primary-500/20"
                    )}
                  />
                </div>
                <FieldError id="email-error">
                  {emailInvalid ? error : null}
                </FieldError>
              </div>

              <Button
                type="submit"
                disabled={isSending}
                className={cn(
                  "h-10 w-full gap-2 rounded-lg text-[14px] font-semibold text-white shadow-2",
                  "transition-all active:scale-[0.99]",
                  isSending
                    ? "cursor-wait bg-primary-300 hover:bg-primary-300 disabled:opacity-100"
                    : "bg-primary-600 hover:bg-primary-700"
                )}
              >
                {isSending ? (
                  <>
                    <Loader2 className="size-4 animate-spin text-white/90" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send reset link
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
                Back to sign in
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
