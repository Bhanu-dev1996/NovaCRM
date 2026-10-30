"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CircleAlert,
  CircleCheck,
  Loader2,
  Mail,
  MailOpen,
} from "lucide-react";
import { motion } from "motion/react";

import { NovaLogo } from "@/components/auth/nova-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, maskEmail } from "@/lib/api";
import { cn } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function StatusBanner({
  tone = "neutral",
  icon: Icon,
  iconClassName,
  title,
  children,
}) {
  const tones = {
    neutral: "border-neutral-200 bg-neutral-50 text-neutral-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    error: "border-error-border bg-error-surface text-error-text",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border px-3.5 py-3",
        tones[tone]
      )}
    >
      {Icon ? (
        <Icon
          className={cn("mt-0.5 size-4 shrink-0", iconClassName)}
          aria-hidden="true"
        />
      ) : null}
      <div className="space-y-1 text-[13px] leading-5">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children}
      </div>
    </div>
  );
}

export function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";

  const [email, setEmail] = useState(initialEmail);
  const [maskedEmail, setMaskedEmail] = useState(
    initialEmail ? maskEmail(initialEmail) : ""
  );
  const [status, setStatus] = useState(token ? "waiting" : "sent");
  const [message, setMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [changingEmail, setChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState(initialEmail);
  const [devVerifyUrl, setDevVerifyUrl] = useState("");

  const applyStatusPayload = useCallback((payload, { redirectIfVerified = false } = {}) => {
    if (payload.email) setEmail(payload.email);
    if (payload.masked_email) setMaskedEmail(payload.masked_email);
    if (typeof payload.cooldown_remaining === "number") {
      setCooldown(payload.cooldown_remaining);
    }
    if (payload.dev_verify_url) setDevVerifyUrl(payload.dev_verify_url);
    if (payload.email_verified || payload.status === "verified") {
      setStatus("verified");
      if (redirectIfVerified) {
        window.setTimeout(() => {
          window.location.assign("/workspace-setup");
        }, 800);
      }
      return;
    }
    if (payload.status === "expired") {
      setStatus("expired");
      return;
    }
    setStatus((current) => (current === "sent" ? "sent" : "waiting"));
  }, []);

  useEffect(() => {
    if (!token) return undefined;

    let cancelled = false;

    async function verifyToken() {
      setStatus("waiting");
      setMessage("");
      try {
        await apiFetch("/api/auth/verify-email", {
          method: "POST",
          body: JSON.stringify({ token }),
        });
        if (!cancelled) {
          setStatus("verified");
          window.setTimeout(() => {
            window.location.assign("/workspace-setup");
          }, 1200);
        }
      } catch (error) {
        if (cancelled) return;
        const text = error instanceof Error ? error.message : "Verification failed";
        if (error?.payload?.email) {
          setEmail(error.payload.email);
          setMaskedEmail(maskEmail(error.payload.email));
          setNewEmail(error.payload.email);
        }
        if (error?.code === "LINK_EXPIRED" || /expired/i.test(text)) {
          setStatus("expired");
        } else {
          setStatus("error");
        }
        setMessage(text);
      }
    }

    verifyToken();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!email || token) return undefined;

    let cancelled = false;

    async function loadStatus() {
      try {
        const data = await apiFetch(
          `/api/auth/verification-status?email=${encodeURIComponent(email)}`
        );
        if (!cancelled) applyStatusPayload(data, { redirectIfVerified: true });
      } catch {
        // Keep the default sent state if status can't be loaded yet.
      }
    }

    loadStatus();
    return () => {
      cancelled = true;
    };
  }, [email, token, applyStatusPayload]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = window.setInterval(() => {
      setCooldown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  async function handleCheckVerified() {
    if (!email) return;
    setChecking(true);
    setMessage("");
    try {
      const data = await apiFetch(
        `/api/auth/verification-status?email=${encodeURIComponent(email)}`
      );
      applyStatusPayload(data);
      if (data.email_verified || data.status === "verified") {
        setStatus("verified");
        window.setTimeout(() => {
          window.location.assign("/workspace-setup");
        }, 800);
      } else if (data.status === "expired") {
        setStatus("expired");
        setMessage("Your verification link has expired. Resend a new email.");
      } else {
        setStatus("waiting");
        setMessage(
          "We haven't confirmed your email yet. Open the link in your inbox, then try again."
        );
      }
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Could not check verification status."
      );
    } finally {
      setChecking(false);
    }
  }

  async function handleResend() {
    if (!email || cooldown > 0) return;
    setResending(true);
    setMessage("");
    try {
      const data = await apiFetch("/api/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      applyStatusPayload(data);
      setStatus("sent");
      setMessage("A new verification email is on the way.");
      setCooldown(data.cooldown_remaining || 60);
    } catch (error) {
      if (error?.status === 429 && error.payload?.cooldown_remaining) {
        setCooldown(error.payload.cooldown_remaining);
        setStatus("cooldown");
      } else {
        setStatus("error");
      }
      setMessage(
        error instanceof Error ? error.message : "Could not resend verification email."
      );
    } finally {
      setResending(false);
    }
  }

  async function handleChangeEmail(event) {
    event.preventDefault();
    const next = newEmail.trim();
    if (!EMAIL_PATTERN.test(next)) {
      setMessage("Enter a valid email address.");
      setStatus("error");
      return;
    }
    if (!email) return;

    setResending(true);
    setMessage("");
    try {
      const data = await apiFetch("/api/auth/change-unverified-email", {
        method: "POST",
        body: JSON.stringify({
          current_email: email,
          new_email: next,
        }),
      });
      applyStatusPayload(data);
      setChangingEmail(false);
      setStatus("sent");
      setMessage("Verification email sent to your updated address.");
      setCooldown(data.cooldown_remaining || 60);
      router.replace(`/verify-email?email=${encodeURIComponent(next)}`);
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Could not update email address."
      );
    } finally {
      setResending(false);
    }
  }

  const heading =
    status === "verified"
      ? "Email verified"
      : status === "expired"
        ? "Link expired"
        : status === "error"
          ? "Verification issue"
          : "Check your inbox";

  const subtitle =
    status === "verified"
      ? "Your email is confirmed. Continuing to workspace setup…"
      : status === "expired"
        ? "That verification link is no longer valid. Request a new one below."
        : "We've sent a verification link to your email address.";

  return (
    <div className="flex h-full min-h-dvh flex-col bg-white">
      <div className="border-b border-neutral-100 bg-[#0b0620] px-6 py-3.5 desktop:hidden">
        <NovaLogo compact markClassName="size-8" />
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-8 desktop:px-10">
        <motion.div
          initial="hidden"
          animate="show"
          className="w-full max-w-[420px]"
        >
          <motion.div
            custom={0.05}
            variants={fadeUp}
            className="mb-6 flex flex-col items-center text-center"
          >
            <div className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-primary-100 bg-primary-50 text-primary-600">
              {status === "verified" ? (
                <MailOpen className="size-7" aria-hidden="true" />
              ) : (
                <Mail className="size-7" aria-hidden="true" />
              )}
            </div>
            <h2 className="text-[28px] leading-8 font-bold tracking-[-0.025em] text-neutral-900">
              {heading}
            </h2>
            <p className="mt-1.5 text-[14px] leading-5 text-neutral-500">
              {subtitle}
            </p>
            {maskedEmail ? (
              <p className="mt-3 rounded-full bg-neutral-100 px-3 py-1 text-[13px] font-medium text-neutral-700">
                {maskedEmail}
              </p>
            ) : null}
          </motion.div>

          <motion.div custom={0.1} variants={fadeUp} className="space-y-3">
            {status === "sent" ? (
              <StatusBanner tone="neutral" icon={Mail} title="Email sent">
                Open the message and click the verification link to continue.
              </StatusBanner>
            ) : null}
            {status === "waiting" ? (
              <StatusBanner
                tone="warning"
                icon={Loader2}
                iconClassName="animate-spin"
                title="Waiting for verification"
              >
                {message ||
                  "Waiting for you to confirm the link from your inbox."}
              </StatusBanner>
            ) : null}
            {status === "verified" ? (
              <StatusBanner tone="success" icon={CircleCheck} title="Verification successful">
                Taking you to workspace setup…
              </StatusBanner>
            ) : null}
            {status === "expired" ? (
              <StatusBanner tone="warning" icon={CircleAlert} title="Link expired">
                {message || "Request a fresh verification email to continue."}
              </StatusBanner>
            ) : null}
            {status === "error" ? (
              <StatusBanner tone="error" icon={CircleAlert} title="Verification error">
                {message || "Something went wrong while verifying your email."}
              </StatusBanner>
            ) : null}
            {status === "cooldown" || cooldown > 0 ? (
              <StatusBanner tone="neutral" title="Resend cooldown">
                You can resend in {cooldown}s.
              </StatusBanner>
            ) : null}
            {devVerifyUrl ? (
              <StatusBanner tone="neutral" title="Local testing link">
                <a
                  href={devVerifyUrl}
                  className="break-all font-medium text-primary-600 hover:text-primary-700"
                >
                  {devVerifyUrl}
                </a>
              </StatusBanner>
            ) : null}
          </motion.div>

          {changingEmail ? (
            <motion.form
              custom={0.14}
              variants={fadeUp}
              onSubmit={handleChangeEmail}
              className="mt-5 space-y-3"
            >
              <div className="space-y-1.5">
                <Label
                  htmlFor="newEmail"
                  className="text-[13px] font-medium text-neutral-700"
                >
                  New email address
                </Label>
                <Input
                  id="newEmail"
                  type="email"
                  value={newEmail}
                  onChange={(event) => setNewEmail(event.target.value)}
                  placeholder="name@company.com"
                  className="h-10 rounded-lg border-neutral-200"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 flex-1"
                  onClick={() => setChangingEmail(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={resending}
                  className="h-10 flex-1 bg-primary-600 text-white hover:bg-primary-700"
                >
                  {resending ? "Saving..." : "Update email"}
                </Button>
              </div>
            </motion.form>
          ) : (
            <motion.div custom={0.14} variants={fadeUp} className="mt-5 space-y-3">
              {status !== "verified" ? (
                <>
                  <Button
                    type="button"
                    disabled={checking || !email}
                    onClick={handleCheckVerified}
                    className={cn(
                      "h-10 w-full gap-2 rounded-lg text-[14px] font-semibold text-white",
                      "bg-primary-600 hover:bg-primary-700"
                    )}
                  >
                    {checking ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        I&apos;ve verified my email
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={resending || cooldown > 0 || !email}
                    onClick={handleResend}
                    className="h-10 w-full rounded-lg border-neutral-200"
                  >
                    {resending
                      ? "Sending..."
                      : cooldown > 0
                        ? `Resend in ${cooldown}s`
                        : "Resend verification email"}
                  </Button>
                </>
              ) : null}

              <div className="flex flex-col items-center gap-2 pt-1 text-[13px]">
                {status !== "verified" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setChangingEmail(true);
                      setNewEmail(email);
                    }}
                    className="font-medium text-primary-600 hover:text-primary-700"
                  >
                    Change email address
                  </button>
                ) : null}
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-neutral-500 hover:text-neutral-800"
                >
                  <ArrowLeft className="size-3.5" />
                  Back to sign in
                </Link>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
