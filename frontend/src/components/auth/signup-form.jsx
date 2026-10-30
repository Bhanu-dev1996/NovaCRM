"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  CircleAlert,
  CircleCheck,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
} from "lucide-react";
import { motion } from "motion/react";

import { NovaLogo } from "@/components/auth/nova-logo";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
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

function getPasswordStrength(password) {
  if (!password) {
    return {
      score: 0,
      label: "",
      tone: "bg-neutral-200",
      text: "text-neutral-400",
    };
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) {
    return { score: 1, label: "Weak", tone: "bg-error", text: "text-error" };
  }
  if (score === 3) {
    return {
      score: 2,
      label: "Fair",
      tone: "bg-amber-500",
      text: "text-amber-600",
    };
  }
  if (score === 4) {
    return {
      score: 3,
      label: "Good",
      tone: "bg-primary-500",
      text: "text-primary-600",
    };
  }
  return {
    score: 4,
    label: "Strong",
    tone: "bg-emerald-500",
    text: "text-emerald-600",
  };
}

function PasswordStrength({ password }) {
  const strength = useMemo(() => getPasswordStrength(password), [password]);

  return (
    <div className="space-y-1.5" aria-live="polite">
      <div className="flex gap-1.5">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              index < strength.score ? strength.tone : "bg-neutral-200"
            )}
          />
        ))}
      </div>
      <p className={cn("text-[12px] leading-4", strength.text)}>
        {password
          ? `Password strength: ${strength.label}`
          : "Use 8+ characters with a mix of letters, numbers, and symbols."}
      </p>
    </div>
  );
}

function validateName(value) {
  if (!value.trim()) return "Please enter your full name.";
  return "";
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

function validateConfirmPassword(password, confirmPassword) {
  if (!confirmPassword) return "Please confirm your password.";
  if (confirmPassword !== password) return "Passwords do not match.";
  return "";
}

function SignupSuccess({ email }) {
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
        Account created
      </motion.h2>
      <motion.p
        custom={0.14}
        variants={fadeUp}
        className="mt-2 text-[14px] leading-5 text-neutral-500"
      >
        We&apos;re sending a verification link to{" "}
        <span className="font-medium text-neutral-700">{email}</span>.
      </motion.p>
      <motion.div
        custom={0.18}
        variants={fadeUp}
        className="mt-6 inline-flex items-center gap-2 text-[13px] text-neutral-500"
      >
        <Loader2 className="size-4 animate-spin text-primary-600" />
        Continuing to email verification…
      </motion.div>
    </motion.div>
  );
}

export function SignupForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    terms: "",
  });
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createdEmail, setCreatedEmail] = useState("");

  function setFieldError(field, message) {
    setErrors((current) => ({ ...current, [field]: message }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);

    const nextErrors = {
      name: validateName(name),
      email: validateEmail(email),
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(password, confirmPassword),
      terms: acceptedTerms
        ? ""
        : "Please accept the Terms of Service and Privacy Policy.",
    };

    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
    });
    setErrors(nextErrors);

    if (
      nextErrors.name ||
      nextErrors.email ||
      nextErrors.password ||
      nextErrors.confirmPassword ||
      nextErrors.terms
    ) {
      setFormError("");
      return;
    }

    setFormError("");
    setIsCreating(true);

    const normalizedEmail = email.trim();

    try {
      await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          email: normalizedEmail,
          password,
        }),
      });
      setCreatedEmail(normalizedEmail);
      window.setTimeout(() => {
        window.location.assign(
          `/verify-email?email=${encodeURIComponent(normalizedEmail)}`
        );
      }, 1200);
    } catch (error) {
      setIsCreating(false);
      setFormError(
        error instanceof Error
          ? error.message
          : "Could not create your account. Please try again."
      );
    }
  }

  const nameInvalid = Boolean(touched.name && errors.name);
  const emailInvalid = Boolean(touched.email && errors.email);
  const passwordInvalid = Boolean(touched.password && errors.password);
  const confirmInvalid = Boolean(
    touched.confirmPassword && errors.confirmPassword
  );
  const termsInvalid = Boolean(submitted && errors.terms);
  const fieldsDisabled = isCreating || Boolean(createdEmail);

  return (
    <div className="flex h-full min-h-dvh flex-col bg-white">
      <div className="border-b border-neutral-100 bg-[#0b0620] px-6 py-3.5 desktop:hidden">
        <NovaLogo compact markClassName="size-8" />
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-4 desktop:px-10">
        {createdEmail ? (
          <SignupSuccess email={createdEmail} />
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            className="w-full max-w-[400px]"
          >
            <motion.div custom={0.05} variants={fadeUp} className="mb-5">
              <h2 className="text-[28px] leading-8 font-bold tracking-[-0.025em] text-neutral-900">
                Create your account
              </h2>
              <p className="mt-1.5 text-[14px] leading-5 text-neutral-500">
                Start building stronger customer relationships.
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
                  htmlFor="name"
                  className="text-[13px] font-medium text-neutral-700"
                >
                  Full name
                </Label>
                <div className="relative">
                  <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Alex Rivera"
                    value={name}
                    disabled={fieldsDisabled}
                    onChange={(event) => {
                      setName(event.target.value);
                      setFormError("");
                      if (touched.name) {
                        setFieldError("name", validateName(event.target.value));
                      }
                    }}
                    onBlur={() => {
                      setTouched((current) => ({ ...current, name: true }));
                      setFieldError("name", validateName(name));
                    }}
                    aria-invalid={nameInvalid || undefined}
                    aria-describedby={nameInvalid ? "name-error" : undefined}
                    className={cn(
                      "h-10 rounded-lg border-neutral-200 bg-white pl-10 text-[14px] text-neutral-900 placeholder:text-neutral-400",
                      nameInvalid
                        ? "border-error focus-visible:border-error focus-visible:ring-error/20"
                        : "focus-visible:border-primary-500 focus-visible:ring-primary-500/20"
                    )}
                  />
                </div>
                <FieldError id="name-error">
                  {nameInvalid ? errors.name : null}
                </FieldError>
              </div>

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
                    disabled={fieldsDisabled}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setFormError("");
                      if (touched.email) {
                        setFieldError(
                          "email",
                          validateEmail(event.target.value)
                        );
                      }
                    }}
                    onBlur={() => {
                      setTouched((current) => ({ ...current, email: true }));
                      setFieldError("email", validateEmail(email));
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
                  {emailInvalid ? errors.email : null}
                </FieldError>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="password"
                  className="text-[13px] font-medium text-neutral-700"
                >
                  Password
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
                    disabled={fieldsDisabled}
                    onChange={(event) => {
                      const value = event.target.value;
                      setPassword(value);
                      setFormError("");
                      if (touched.password) {
                        setFieldError("password", validatePassword(value));
                      }
                      if (touched.confirmPassword) {
                        setFieldError(
                          "confirmPassword",
                          validateConfirmPassword(value, confirmPassword)
                        );
                      }
                    }}
                    onBlur={() => {
                      setTouched((current) => ({ ...current, password: true }));
                      setFieldError("password", validatePassword(password));
                    }}
                    aria-invalid={passwordInvalid || undefined}
                    aria-describedby={
                      passwordInvalid ? "password-error" : undefined
                    }
                    className={cn(
                      "h-10 rounded-lg border-neutral-200 bg-white pl-10 pr-10 text-[14px] text-neutral-900 placeholder:text-neutral-400",
                      passwordInvalid
                        ? "border-error focus-visible:border-error focus-visible:ring-error/20"
                        : "focus-visible:border-primary-500 focus-visible:ring-primary-500/20"
                    )}
                  />
                  <button
                    type="button"
                    disabled={fieldsDisabled}
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
                <PasswordStrength password={password} />
                <FieldError id="password-error">
                  {passwordInvalid ? errors.password : null}
                </FieldError>
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
                    disabled={fieldsDisabled}
                    onChange={(event) => {
                      const value = event.target.value;
                      setConfirmPassword(value);
                      setFormError("");
                      if (touched.confirmPassword) {
                        setFieldError(
                          "confirmPassword",
                          validateConfirmPassword(password, value)
                        );
                      }
                    }}
                    onBlur={() => {
                      setTouched((current) => ({
                        ...current,
                        confirmPassword: true,
                      }));
                      setFieldError(
                        "confirmPassword",
                        validateConfirmPassword(password, confirmPassword)
                      );
                    }}
                    aria-invalid={confirmInvalid || undefined}
                    aria-describedby={
                      confirmInvalid ? "confirm-password-error" : undefined
                    }
                    className={cn(
                      "h-10 rounded-lg border-neutral-200 bg-white pl-10 pr-10 text-[14px] text-neutral-900 placeholder:text-neutral-400",
                      confirmInvalid
                        ? "border-error focus-visible:border-error focus-visible:ring-error/20"
                        : "focus-visible:border-primary-500 focus-visible:ring-primary-500/20"
                    )}
                  />
                  <button
                    type="button"
                    disabled={fieldsDisabled}
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
                  {confirmInvalid ? errors.confirmPassword : null}
                </FieldError>
              </div>

              <div className="space-y-1.5">
                <label className="flex cursor-pointer items-start gap-2.5">
                  <Checkbox
                    checked={acceptedTerms}
                    disabled={fieldsDisabled}
                    onCheckedChange={(value) => {
                      const checked = Boolean(value);
                      setAcceptedTerms(checked);
                      if (submitted) {
                        setFieldError(
                          "terms",
                          checked
                            ? ""
                            : "Please accept the Terms of Service and Privacy Policy."
                        );
                      }
                    }}
                    aria-invalid={termsInvalid || undefined}
                    className={cn(
                      "mt-0.5 size-[18px] rounded-[4px] border-neutral-300 data-checked:border-primary-600 data-checked:bg-primary-600",
                      termsInvalid && "border-error"
                    )}
                  />
                  <span className="text-[13px] leading-5 text-neutral-600">
                    I agree to the{" "}
                  <Link
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary-600 hover:text-primary-700"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary-600 hover:text-primary-700"
                  >
                    Privacy Policy
                  </Link>
                    .
                  </span>
                </label>
                <FieldError id="terms-error">
                  {termsInvalid ? errors.terms : null}
                </FieldError>
              </div>

              <Button
                type="submit"
                disabled={fieldsDisabled}
                className={cn(
                  "h-10 w-full gap-2 rounded-lg text-[14px] font-semibold text-white shadow-2",
                  "transition-all active:scale-[0.99]",
                  isCreating
                    ? "cursor-wait bg-primary-300 hover:bg-primary-300 disabled:opacity-100"
                    : "bg-primary-600 hover:bg-primary-700"
                )}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="size-4 animate-spin text-white/90" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </motion.form>

            <motion.p
              custom={0.2}
              variants={fadeUp}
              className="mt-5 text-center text-[13px] text-neutral-500"
            >
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-primary-600 hover:text-primary-700"
              >
                Sign in
              </Link>
            </motion.p>
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
