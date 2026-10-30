"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CircleAlert,
  ImagePlus,
  Loader2,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { NovaLogo } from "@/components/auth/nova-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

const INDUSTRIES = [
  "Software & Technology",
  "Professional Services",
  "Finance & Insurance",
  "Healthcare",
  "Education",
  "Retail & E-commerce",
  "Manufacturing",
  "Real Estate",
  "Media & Marketing",
  "Other",
];

const COMPANY_SIZES = [
  "1–10",
  "11–50",
  "51–200",
  "201–1,000",
  "1,001–5,000",
  "5,000+",
];

const ROLES = [
  "Founder / Owner",
  "Sales Leader",
  "Account Executive",
  "Marketing",
  "Customer Success",
  "Operations",
  "Other",
];

const STEPS = [
  { id: "name", label: "Workspace", optional: false },
  { id: "website", label: "Website", optional: true },
  { id: "company", label: "Company", optional: false },
  { id: "profile", label: "Profile", optional: true },
];

function FieldError({ children }) {
  if (!children) return null;
  return (
    <p role="alert" className="text-[12px] leading-4 text-error">
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

function ProgressIndicator({ step, total }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[12px] text-neutral-500">
        <span>
          Step {step + 1} of {total}
        </span>
        <span>{STEPS[step]?.label}</span>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: total }).map((_, index) => (
          <div
            key={STEPS[index].id}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              index < step
                ? "bg-primary-500"
                : index === step
                  ? "bg-primary-400"
                  : "bg-neutral-200"
            )}
          />
        ))}
      </div>
    </div>
  );
}

function SelectField({ id, label, value, onChange, options, placeholder, error }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-[13px] font-medium text-neutral-700">
        {label}
      </Label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "h-9 w-full rounded-lg border bg-white px-3 text-sm text-neutral-900 outline-none",
          "focus-visible:border-primary-500 focus-visible:ring-3 focus-visible:ring-primary-500/20",
          error ? "border-error" : "border-neutral-200",
          !value && "text-neutral-400"
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <FieldError>{error}</FieldError>
    </div>
  );
}

function WorkspaceCreated({ workspaceName }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={fadeUp}
      className="w-full max-w-[440px] text-center"
    >
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-600">
        <Check className="size-7" aria-hidden="true" />
      </div>
      <h2 className="text-[28px] leading-8 font-bold tracking-[-0.025em] text-neutral-900">
        Workspace created
      </h2>
      <p className="mt-2 text-[14px] leading-5 text-neutral-500">
        <span className="font-medium text-neutral-700">{workspaceName}</span> is
        ready. Next we&apos;ll help you invite your team.
      </p>
      <Button
        type="button"
        onClick={() => window.location.assign("/onboarding/invite")}
        className="mt-6 h-10 w-full gap-2 rounded-lg bg-primary-600 text-[14px] font-semibold text-white hover:bg-primary-700"
      >
        Continue
        <ArrowRight className="size-4" />
      </Button>
    </motion.div>
  );
}

export function WorkspaceSetupForm() {
  const fileInputRef = useRef(null);
  const [step, setStep] = useState(0);
  const [workspaceName, setWorkspaceName] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [logoDataUrl, setLogoDataUrl] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [created, setCreated] = useState(false);
  const [loadingWorkspace, setLoadingWorkspace] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadWorkspace() {
      try {
        const data = await apiFetch("/api/workspace");
        if (cancelled) return;
        const org = data.organization || {};
        if (org.name && !org.name.endsWith("'s Workspace")) {
          setWorkspaceName(org.name);
        } else if (org.name) {
          setWorkspaceName(org.name);
        }
        if (org.website) setWebsite(org.website);
        if (org.industry) setIndustry(org.industry);
        if (org.company_size) setCompanySize(org.company_size);
        if (data.user?.job_role) setJobRole(data.user.job_role);
        if (org.logo_url) {
          setLogoPreview(org.logo_url);
          setLogoDataUrl(org.logo_url);
        }
        if (org.setup_completed) {
          setCreated(true);
        }
      } catch (error) {
        if (!cancelled) {
          setFormError(
            error instanceof Error
              ? error.message
              : "Could not load your workspace. Please sign in again."
          );
        }
      } finally {
        if (!cancelled) setLoadingWorkspace(false);
      }
    }

    loadWorkspace();
    return () => {
      cancelled = true;
    };
  }, []);

  const canSkip = useMemo(() => STEPS[step]?.optional, [step]);

  function validateStep(currentStep = step) {
    const nextErrors = {};
    if (currentStep === 0) {
      if (!workspaceName.trim()) {
        nextErrors.workspaceName = "Please enter a workspace name.";
      } else if (workspaceName.trim().length < 2) {
        nextErrors.workspaceName = "Workspace name must be at least 2 characters.";
      }
    }
    if (currentStep === 2) {
      if (!industry) nextErrors.industry = "Please select an industry.";
      if (!companySize) nextErrors.companySize = "Please select a company size.";
    }
    if (currentStep === 3) {
      if (!jobRole) nextErrors.jobRole = "Please select your role.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleLogoChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrors((current) => ({
        ...current,
        logo: "Please upload an image file (PNG, JPG, or SVG).",
      }));
      return;
    }
    if (file.size > 1024 * 1024) {
      setErrors((current) => ({
        ...current,
        logo: "Logo must be under 1MB.",
      }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setLogoDataUrl(result);
      setLogoPreview(result);
      setErrors((current) => ({ ...current, logo: "" }));
    };
    reader.readAsDataURL(file);
  }

  function clearLogo() {
    setLogoDataUrl("");
    setLogoPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function saveWorkspace() {
    setIsSaving(true);
    setFormError("");
    try {
      await apiFetch("/api/workspace", {
        method: "PATCH",
        body: JSON.stringify({
          name: workspaceName.trim(),
          website: website.trim() || null,
          industry: industry || null,
          company_size: companySize || null,
          job_role: jobRole || null,
          logo_url: logoDataUrl || null,
        }),
      });
      setCreated(true);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Could not save workspace setup. Please try again."
      );
      setIsSaving(false);
    }
  }

  function handleContinue() {
    if (!validateStep(step)) return;
    setFormError("");

    if (step < STEPS.length - 1) {
      setStep((value) => value + 1);
      return;
    }
    saveWorkspace();
  }

  function handleSkip() {
    if (step === 1) setWebsite("");
    if (step === 3) {
      // Role is required on final step — skip only clears logo.
      clearLogo();
    }
    setErrors({});
    setFormError("");
    if (step < STEPS.length - 1) {
      setStep((value) => value + 1);
      return;
    }
    if (validateStep(3)) {
      saveWorkspace();
    }
  }

  function handleBack() {
    setErrors({});
    setFormError("");
    setStep((value) => Math.max(0, value - 1));
  }

  if (loadingWorkspace) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-white text-[14px] text-neutral-500">
        <Loader2 className="mr-2 size-4 animate-spin text-primary-600" />
        Loading workspace…
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-dvh flex-col bg-white">
      <div className="border-b border-neutral-100 bg-[#0b0620] px-6 py-3.5 desktop:hidden">
        <NovaLogo compact markClassName="size-8" />
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-8 desktop:px-10">
        {created ? (
          <WorkspaceCreated workspaceName={workspaceName.trim()} />
        ) : (
          <div className="w-full max-w-[440px]">
            <div className="mb-6">
              <div className="mb-4 flex size-12 items-center justify-center rounded-2xl border border-primary-100 bg-primary-50 text-primary-600">
                <Building2 className="size-6" aria-hidden="true" />
              </div>
              <h2 className="text-[28px] leading-8 font-bold tracking-[-0.025em] text-neutral-900">
                Let&apos;s set up your workspace
              </h2>
              <p className="mt-1.5 text-[14px] leading-5 text-neutral-500">
                Personalize NovaCRM for your team.
              </p>
            </div>

            <div className="mb-6">
              <ProgressIndicator step={step} total={STEPS.length} />
            </div>

            {formError ? (
              <div className="mb-4">
                <AuthErrorBanner>{formError}</AuthErrorBanner>
              </div>
            ) : null}

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial="hidden"
                animate="show"
                exit="exit"
                variants={fadeUp}
                className="space-y-4"
              >
                {step === 0 ? (
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="workspaceName"
                      className="text-[13px] font-medium text-neutral-700"
                    >
                      Workspace name
                    </Label>
                    <Input
                      id="workspaceName"
                      value={workspaceName}
                      disabled={isSaving}
                      placeholder="Acme Sales"
                      onChange={(event) => {
                        setWorkspaceName(event.target.value);
                        setErrors((current) => ({
                          ...current,
                          workspaceName: "",
                        }));
                      }}
                      className={cn(
                        "rounded-lg border-neutral-200",
                        errors.workspaceName &&
                          "border-error focus-visible:border-error focus-visible:ring-error/20"
                      )}
                    />
                    <FieldError>{errors.workspaceName}</FieldError>
                  </div>
                ) : null}

                {step === 1 ? (
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="website"
                      className="text-[13px] font-medium text-neutral-700"
                    >
                      Company website{" "}
                      <span className="font-normal text-neutral-400">
                        (optional)
                      </span>
                    </Label>
                    <Input
                      id="website"
                      type="url"
                      value={website}
                      disabled={isSaving}
                      placeholder="https://company.com"
                      onChange={(event) => setWebsite(event.target.value)}
                      className="rounded-lg border-neutral-200"
                    />
                    <p className="text-[12px] text-neutral-400">
                      You can skip this and add it later in settings.
                    </p>
                  </div>
                ) : null}

                {step === 2 ? (
                  <div className="space-y-3.5">
                    <SelectField
                      id="industry"
                      label="Industry"
                      value={industry}
                      onChange={(value) => {
                        setIndustry(value);
                        setErrors((current) => ({ ...current, industry: "" }));
                      }}
                      options={INDUSTRIES}
                      placeholder="Select industry"
                      error={errors.industry}
                    />
                    <SelectField
                      id="companySize"
                      label="Company size"
                      value={companySize}
                      onChange={(value) => {
                        setCompanySize(value);
                        setErrors((current) => ({
                          ...current,
                          companySize: "",
                        }));
                      }}
                      options={COMPANY_SIZES}
                      placeholder="Select company size"
                      error={errors.companySize}
                    />
                  </div>
                ) : null}

                {step === 3 ? (
                  <div className="space-y-3.5">
                    <SelectField
                      id="jobRole"
                      label="Your role"
                      value={jobRole}
                      onChange={(value) => {
                        setJobRole(value);
                        setErrors((current) => ({ ...current, jobRole: "" }));
                      }}
                      options={ROLES}
                      placeholder="Select your role"
                      error={errors.jobRole}
                    />

                    <div className="space-y-1.5">
                      <Label className="text-[13px] font-medium text-neutral-700">
                        Company logo{" "}
                        <span className="font-normal text-neutral-400">
                          (optional)
                        </span>
                      </Label>
                      <div className="flex items-center gap-3 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/80 p-3">
                        <div className="flex size-14 items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-white">
                          {logoPreview ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={logoPreview}
                              alt="Logo preview"
                              className="size-full object-contain"
                            />
                          ) : (
                            <ImagePlus className="size-5 text-neutral-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 space-y-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/svg+xml"
                            className="hidden"
                            onChange={handleLogoChange}
                          />
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              disabled={isSaving}
                              onClick={() => fileInputRef.current?.click()}
                              className="h-8 rounded-lg border-neutral-200 px-3 text-[13px]"
                            >
                              {logoPreview ? "Replace logo" : "Upload logo"}
                            </Button>
                            {logoPreview ? (
                              <Button
                                type="button"
                                variant="ghost"
                                disabled={isSaving}
                                onClick={clearLogo}
                                className="h-8 px-2 text-[13px] text-neutral-500"
                              >
                                <X className="size-3.5" />
                                Remove
                              </Button>
                            ) : null}
                          </div>
                          <p className="text-[12px] text-neutral-400">
                            PNG, JPG, or SVG up to 1MB.
                          </p>
                        </div>
                      </div>
                      <FieldError>{errors.logo}</FieldError>
                    </div>
                  </div>
                ) : null}
              </motion.div>
            </AnimatePresence>

            <div className="mt-6 flex items-center gap-2">
              {step > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSaving}
                  onClick={handleBack}
                  className="h-10 gap-1.5 rounded-lg border-neutral-200 px-4"
                >
                  <ArrowLeft className="size-4" />
                  Back
                </Button>
              ) : null}

              <div className="ml-auto flex items-center gap-2">
                {canSkip ? (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={isSaving}
                    onClick={handleSkip}
                    className="h-10 px-3 text-[13px] text-neutral-500"
                  >
                    Skip
                  </Button>
                ) : null}
                <Button
                  type="button"
                  disabled={isSaving}
                  onClick={handleContinue}
                  className={cn(
                    "h-10 gap-2 rounded-lg px-4 text-[14px] font-semibold text-white",
                    isSaving
                      ? "cursor-wait bg-primary-300 hover:bg-primary-300 disabled:opacity-100"
                      : "bg-primary-600 hover:bg-primary-700"
                  )}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Saving...
                    </>
                  ) : step === STEPS.length - 1 ? (
                    <>
                      Create workspace
                      <ArrowRight className="size-4" />
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
