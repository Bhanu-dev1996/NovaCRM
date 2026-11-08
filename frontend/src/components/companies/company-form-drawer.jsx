"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

import {
  COMPANY_INDUSTRIES,
  COMPANY_SIZES,
  COMPANY_TYPES,
} from "@/components/companies/companies-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { FormFieldDropdown } from "@/components/shared/form-field-dropdown";
import { LocationFormFields } from "@/components/shared/location-form-fields";
import { cn } from "@/lib/utils";

function listOptions(items) {
  return (items || []).map((label) => ({ value: label, label }));
}

const EMPTY = {
  name: "",
  domain: "",
  website: "",
  logoUrl: "",
  industry: "",
  companyType: "",
  size: "",
  annualRevenue: "",
  phone: "",
  foundedYear: "",
  country: "",
  state: "",
  city: "",
  address: "",
  ownerId: "",
  description: "",
};

function FieldError({ message }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1 text-[11px] text-error-text">
      {message}
    </p>
  );
}

function FieldLabel({ htmlFor, required, children }) {
  return (
    <Label htmlFor={htmlFor} className="gap-1">
      {required ? (
        <span className="text-error-text" aria-hidden="true">
          *
        </span>
      ) : null}
      {children}
    </Label>
  );
}

function normalizeUrl(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
}

function isValidUrl(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return true;
  try {
    const url = new URL(
      trimmed.includes("://") ? trimmed : `https://${trimmed}`
    );
    return Boolean(url.hostname);
  } catch {
    return false;
  }
}

function currentYear() {
  return new Date().getFullYear();
}

function errorFor(field, values) {
  if (field === "name" && !String(values.name || "").trim()) {
    return "Company name is required";
  }
  if (field === "website" && !isValidUrl(values.website)) {
    return "Enter a valid website URL";
  }
  if (field === "logoUrl" && String(values.logoUrl || "").trim() && !isValidUrl(values.logoUrl)) {
    return "Enter a valid logo URL";
  }
  if (field === "annualRevenue") {
    if (values.annualRevenue !== "" && Number.isNaN(Number(values.annualRevenue))) {
      return "Revenue must be a number";
    }
    if (values.annualRevenue !== "" && Number(values.annualRevenue) < 0) {
      return "Revenue cannot be negative";
    }
  }
  if (field === "foundedYear" && values.foundedYear !== "") {
    const year = Number(values.foundedYear);
    if (!Number.isInteger(year) || year < 1800 || year > currentYear()) {
      return `Enter a year between 1800 and ${currentYear()}`;
    }
  }
  if (field === "ownerId" && !values.ownerId) {
    return "Company owner is required";
  }
  return undefined;
}

export function CompanyFormDrawer({
  open,
  onOpenChange,
  initialCompany,
  onSave,
  owners = [],
  defaultOwnerId = "",
  existingCompanies = [],
}) {
  const isEditMode = Boolean(initialCompany?.id);

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initialCompany?.id) {
      setForm({
        name: initialCompany.name || "",
        domain: initialCompany.domain || "",
        website: initialCompany.website || "",
        logoUrl: initialCompany.logoUrl || "",
        industry: initialCompany.industry || "",
        companyType: initialCompany.companyType || "",
        size: initialCompany.size || "",
        annualRevenue:
          initialCompany.annualRevenue !== "" &&
          initialCompany.annualRevenue != null
            ? String(initialCompany.annualRevenue)
            : "",
        phone: initialCompany.phone || "",
        foundedYear:
          initialCompany.foundedYear !== "" &&
          initialCompany.foundedYear != null
            ? String(initialCompany.foundedYear)
            : "",
        country: initialCompany.country || "",
        state: initialCompany.state || "",
        city: initialCompany.city || "",
        address: initialCompany.address || "",
        ownerId: String(
          initialCompany.ownerId || defaultOwnerId || ""
        ),
        description: initialCompany.description || "",
      });
    } else {
      setForm({ ...EMPTY });
    }
    setErrors({});
  }, [open, initialCompany, defaultOwnerId]);

  const ownerOptions = useMemo(
    () =>
      owners.map((owner) => ({
        value: String(owner.id),
        label: owner.name,
        searchText: `${owner.name} ${owner.email || ""}`.trim(),
      })),
    [owners]
  );

  const industryOptions = useMemo(
    () => listOptions(COMPANY_INDUSTRIES),
    []
  );
  const companyTypeOptions = useMemo(() => listOptions(COMPANY_TYPES), []);
  const companySizeOptions = useMemo(() => listOptions(COMPANY_SIZES), []);

  const duplicateWarning = useMemo(() => {
    const name = form.name.trim().toLowerCase();
    const site = normalizeUrl(form.website);
    if (!name && !site) return null;
    const hit = existingCompanies.find((row) => {
      if (isEditMode && row.id === initialCompany?.id) return false;
      const sameName = String(row.name || "").trim().toLowerCase() === name;
      const sameSite =
        site &&
        row.website &&
        normalizeUrl(row.website) === site;
      return sameName || sameSite;
    });
    return hit
      ? `Possible duplicate: “${hit.name}” already exists in your workspace.`
      : null;
  }, [form.name, form.website, existingCompanies, isEditMode, initialCompany?.id]);

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function updateCountry(value) {
    setForm((prev) => ({
      ...prev,
      country: value,
      state: "",
      city: "",
    }));
  }

  function updateState(value) {
    setForm((prev) => ({
      ...prev,
      state: value,
      city: "",
    }));
  }

  function handleBlur(field, snapshot = form) {
    const message = errorFor(field, snapshot);
    setErrors((prev) => {
      if (!message) {
        if (prev[field] === undefined) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      }
      return { ...prev, [field]: message };
    });
  }

  function validateAll() {
    const fields = [
      "name",
      "website",
      "logoUrl",
      "annualRevenue",
      "foundedYear",
      "ownerId",
    ];
    const next = {};
    for (const field of fields) {
      const message = errorFor(field, form);
      if (message) next[field] = message;
    }
    setErrors(next);
    if (Object.keys(next).length) {
      const first = Object.keys(next)[0];
      const idByField = {
        name: "co-name",
        website: "co-website",
        logoUrl: "co-logo",
        annualRevenue: "co-revenue",
        foundedYear: "co-founded",
        ownerId: "co-owner",
      };
      requestAnimationFrame(() => {
        document.getElementById(idByField[first])?.focus();
      });
    }
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validateAll()) return;
    setSaving(true);
    try {
      await onSave?.(
        {
          ...(initialCompany || {}),
          ...form,
          name: form.name.trim(),
          phone: form.phone.trim(),
          annualRevenue:
            form.annualRevenue === "" ? "" : Number(form.annualRevenue),
          foundedYear:
            form.foundedYear === "" ? "" : Number(form.foundedYear),
          ownerId: form.ownerId || defaultOwnerId || "",
        },
        { isEdit: isEditMode }
      );
      onOpenChange?.(false);
    } catch {
      /* parent toasts */
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        hideHeader
        maxWidth={480}
        onClose={() => onOpenChange?.(false)}
        className="overflow-hidden rounded-none"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.02em]">
              {isEditMode ? "Edit Company" : "Add Company"}
            </h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              {isEditMode
                ? "Update company details"
                : "Required fields are marked with *"}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="Close"
            onClick={() => onOpenChange?.(false)}
          >
            <X className="size-4" />
          </Button>
        </div>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={handleSubmit}
          noValidate
        >
          <SheetBody className="space-y-4 px-6 py-5">
            <section className="space-y-4">
              <h3 className="text-[11px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
                Basic information
              </h3>
              <div>
                <FieldLabel htmlFor="co-name" required>
                  Company Name
                </FieldLabel>
                <Input
                  id="co-name"
                  className="mt-1.5 h-10"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  onBlur={() => handleBlur("name")}
                  placeholder="Acme Corporation"
                  aria-invalid={Boolean(errors.name)}
                />
                <FieldError message={errors.name} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="co-website">Website</Label>
                  <Input
                    id="co-website"
                    className="mt-1.5 h-10"
                    value={form.website}
                    onChange={(e) => update("website", e.target.value)}
                    onBlur={() => handleBlur("website")}
                    placeholder="https://example.com"
                    aria-invalid={Boolean(errors.website)}
                  />
                  <FieldError message={errors.website} />
                </div>
                <div>
                  <Label htmlFor="co-domain">Domain</Label>
                  <Input
                    id="co-domain"
                    className="mt-1.5 h-10"
                    value={form.domain}
                    onChange={(e) => update("domain", e.target.value)}
                    placeholder="example.com"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="co-logo">Company Logo URL</Label>
                <Input
                  id="co-logo"
                  className="mt-1.5 h-10"
                  value={form.logoUrl}
                  onChange={(e) => update("logoUrl", e.target.value)}
                  onBlur={() => handleBlur("logoUrl")}
                  placeholder="https://cdn.example.com/logo.png"
                  aria-invalid={Boolean(errors.logoUrl)}
                />
                <FieldError message={errors.logoUrl} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="co-industry">Industry</Label>
                  <FormFieldDropdown
                    id="co-industry"
                    value={form.industry}
                    onChange={(value) => update("industry", value ?? "")}
                    options={industryOptions}
                    placeholder="Select industry"
                    searchPlaceholder="Search industries…"
                    searchable
                    listClassName="min-h-40"
                  />
                </div>
                <div>
                  <Label htmlFor="co-companyType">Company Type</Label>
                  <FormFieldDropdown
                    id="co-companyType"
                    value={form.companyType}
                    onChange={(value) => update("companyType", value ?? "")}
                    options={companyTypeOptions}
                    placeholder="Select type"
                    listClassName="min-h-40"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-[11px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
                Business information
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="co-size">Company Size</Label>
                  <FormFieldDropdown
                    id="co-size"
                    value={form.size}
                    onChange={(value) => update("size", value ?? "")}
                    options={companySizeOptions}
                    placeholder="Select company size"
                    listClassName="min-h-40"
                  />
                </div>
                <div>
                  <Label htmlFor="co-revenue">Annual Revenue</Label>
                  <Input
                    id="co-revenue"
                    type="number"
                    min={0}
                    className="mt-1.5 h-10"
                    value={form.annualRevenue}
                    onChange={(e) => update("annualRevenue", e.target.value)}
                    onBlur={() => handleBlur("annualRevenue")}
                    placeholder="e.g. 2500000"
                    aria-invalid={Boolean(errors.annualRevenue)}
                  />
                  <FieldError message={errors.annualRevenue} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="co-phone">Phone</Label>
                  <PhoneInput
                    id="co-phone"
                    value={form.phone}
                    onChange={(next) => update("phone", next)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="co-founded">Founded Year</Label>
                  <Input
                    id="co-founded"
                    type="number"
                    className="mt-1.5 h-10"
                    value={form.foundedYear}
                    onChange={(e) => update("foundedYear", e.target.value)}
                    onBlur={() => handleBlur("foundedYear")}
                    placeholder="2018"
                    aria-invalid={Boolean(errors.foundedYear)}
                  />
                  <FieldError message={errors.foundedYear} />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-[11px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
                Location & ownership
              </h3>
              <LocationFormFields
                open={open}
                country={form.country}
                state={form.state}
                city={form.city}
                onCountryChange={updateCountry}
                onStateChange={updateState}
                onCityChange={(value) => update("city", value)}
              />
              <div>
                <Label htmlFor="co-address">Address</Label>
                <Textarea
                  id="co-address"
                  rows={3}
                  className="mt-1.5"
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                  placeholder="Street address, suite, postal code…"
                />
              </div>
              <div>
                <FieldLabel htmlFor="co-owner" required>
                  Company Owner
                </FieldLabel>
                <FormFieldDropdown
                  id="co-owner"
                  value={form.ownerId || ""}
                  onChange={(value) => update("ownerId", value ?? "")}
                  onBlur={() => handleBlur("ownerId")}
                  options={ownerOptions}
                  placeholder="Select company owner"
                  searchable
                  searchPlaceholder="Search team…"
                  emptyLabel="No team members found"
                  listClassName="min-h-48"
                  invalid={Boolean(errors.ownerId)}
                />
                <FieldError message={errors.ownerId} />
              </div>
              <div>
                <Label htmlFor="co-desc">Description</Label>
                <Textarea
                  id="co-desc"
                  rows={3}
                  className="mt-1.5"
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="Industry focus, products, and account notes for your team…"
                />
              </div>
            </section>

            {duplicateWarning ? (
              <div
                className={cn(
                  "flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12px] text-amber-900",
                  "dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
                )}
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <p>{duplicateWarning}</p>
              </div>
            ) : null}
          </SheetBody>
          <SheetFooter className="flex-wrap justify-end gap-2 px-6 [&>button]:flex-none">
            <Button
              type="button"
              variant="outline"
              className="rounded-lg"
              onClick={() => onOpenChange?.(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="min-w-[118px] rounded-lg bg-primary-600 text-white hover:bg-primary-700"
              disabled={saving}
            >
              {saving ? "Saving…" : "Save Company"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
