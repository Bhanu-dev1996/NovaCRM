"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  LEAD_COMPANIES,
  LEAD_INDUSTRIES,
  LEAD_OWNERS,
  LEAD_SOURCES,
  LEAD_SOURCE_STYLES,
  LEAD_STATUSES,
  LEAD_STATUS_STYLES,
} from "@/components/leads/leads-data";
import { cn } from "@/lib/utils";

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  company: "",
  title: "",
  source: "Website",
  industry: "",
  status: "New",
  ownerId: "",
  score: "50",
  notes: "",
};

const PUBLIC_EMAIL_HOSTS = new Set([
  "gmail",
  "yahoo",
  "hotmail",
  "outlook",
  "icloud",
  "aol",
  "live",
  "msn",
  "proton",
  "me",
  "googlemail",
]);

function FieldError({ message }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1 text-[11px] text-error-text">
      {message}
    </p>
  );
}

function ValidatedInput({ field, onValidate, className, ...props }) {
  const inputRef = useRef(null);
  const onValidateRef = useRef(onValidate);
  onValidateRef.current = onValidate;
  const fieldRef = useRef(field);
  fieldRef.current = field;

  useEffect(() => {
    const node = inputRef.current;
    if (!node) return undefined;

    const validate = () => onValidateRef.current(fieldRef.current, node.value);
    const onPointerDown = (event) => {
      if (document.activeElement !== node) return;
      if (event.target === node || node.contains(event.target)) return;
      const label = event.target.closest?.("label");
      if (label && (label.htmlFor === node.id || label.contains(node))) return;
      validate();
    };

    node.addEventListener("blur", validate);
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      node.removeEventListener("blur", validate);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, []);

  return (
    <input
      {...props}
      ref={inputRef}
      onBlur={(event) => onValidate(field, event.target.value)}
      className={cn(
        "h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
    />
  );
}

function FieldLabel({ htmlFor, required = false, children }) {
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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function errorFor(field, values) {
  const value = String(values[field] ?? "");
  if (field === "firstName" && !value.trim()) return "First name is required";
  if (field === "lastName" && !value.trim()) return "Last name is required";
  if (field === "email") {
    if (!value.trim()) return "Email is required";
    if (!EMAIL_PATTERN.test(value.trim())) return "Enter a valid email";
  }
  if (field === "score") {
    const score = Number(value);
    if (Number.isNaN(score) || score < 0 || score > 100) {
      return "Score must be between 0 and 100";
    }
  }
  return undefined;
}

function initialsFrom(first, last) {
  const value = `${first || ""} ${last || ""}`
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return value || "+";
}

function companyFromEmail(email) {
  const domain = String(email || "")
    .split("@")[1]
    ?.trim()
    .toLowerCase();
  if (!domain) return "";
  const host = domain.split(".")[0] || "";
  if (!host || PUBLIC_EMAIL_HOSTS.has(host)) return "";
  return host.charAt(0).toUpperCase() + host.slice(1);
}

function scoreTone(score) {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-primary-500";
}

function CompanyCombobox({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((name) => name.toLowerCase().includes(q));
  }, [options, query]);

  const exactMatch = options.some(
    (name) => name.toLowerCase() === query.trim().toLowerCase()
  );
  const canCreate = query.trim().length > 0 && !exactMatch;

  function selectCompany(name) {
    onChange(name);
    setOpen(false);
    setQuery("");
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="mt-1.5 h-10 w-full justify-between rounded-lg border-input bg-transparent px-2.5 text-[13px] font-normal shadow-none dark:bg-input/30"
          />
        }
      >
        <span className={cn("truncate", !value && "text-muted-foreground")}>
          {value || "Search or add a company"}
        </span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        positionMethod="fixed"
        collisionAvoidance={{
          side: "flip",
          align: "shift",
          fallbackAxisSide: "none",
        }}
        className="w-(--anchor-width) min-w-(--anchor-width) gap-0 overflow-hidden rounded-xl p-0"
      >
        <div className="border-b border-border p-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Type a company name"
            className="h-9"
            autoFocus
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                if (canCreate) selectCompany(query.trim());
                else if (filtered[0]) selectCompany(filtered[0]);
              }
            }}
          />
        </div>
        <div className="max-h-48 overflow-y-auto p-1">
          {filtered.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => selectCompany(name)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted",
                value === name && "bg-muted"
              )}
            >
              <Check
                className={cn(
                  "size-3.5 shrink-0",
                  value === name ? "opacity-100" : "opacity-0"
                )}
              />
              <span className="truncate">{name}</span>
            </button>
          ))}
          {filtered.length === 0 && !canCreate ? (
            <p className="px-2 py-3 text-center text-[12px] text-muted-foreground">
              No companies found
            </p>
          ) : null}
          {canCreate ? (
            <button
              type="button"
              onClick={() => selectCompany(query.trim())}
              className="mt-0.5 flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-primary-950"
            >
              <Plus className="size-3.5 shrink-0" />
              <span className="truncate">Add “{query.trim()}”</span>
            </button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function SearchSelect({
  value,
  onChange,
  options,
  placeholder = "Select",
  searchPlaceholder = "Search…",
  emptyLabel = "No matches",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const selected = options.find((item) => item.value === value);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((item) =>
      (item.searchText || item.label).toLowerCase().includes(q)
    );
  }, [options, query]);

  function selectItem(item) {
    onChange(item.value);
    setOpen(false);
    setQuery("");
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="mt-1.5 h-10 w-full justify-between rounded-lg border-input bg-transparent px-2.5 text-[13px] font-normal shadow-none dark:bg-input/30"
          />
        }
      >
        <span className={cn("flex min-w-0 items-center gap-2", !selected && "text-muted-foreground")}>
          {selected?.trigger || selected?.label || placeholder}
        </span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={6}
        positionMethod="fixed"
        collisionAvoidance={{
          side: "none",
          align: "none",
          fallbackAxisSide: "none",
        }}
        className="z-[120] w-(--anchor-width) min-w-(--anchor-width) gap-0 overflow-hidden rounded-xl p-0"
      >
        <div className="border-b border-border p-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-9"
            autoFocus
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                if (filtered[0]) selectItem(filtered[0]);
              }
            }}
          />
        </div>
        <div className="max-h-48 overflow-y-auto p-1">
          {filtered.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => selectItem(item)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted",
                value === item.value && "bg-muted"
              )}
            >
              <Check
                className={cn(
                  "size-3.5 shrink-0",
                  value === item.value ? "opacity-100" : "opacity-0"
                )}
              />
              <span className="min-w-0 flex-1">{item.option || item.label}</span>
            </button>
          ))}
          {filtered.length === 0 ? (
            <p className="px-2 py-3 text-center text-[12px] text-muted-foreground">
              {emptyLabel}
            </p>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function StatusChip({ label, className }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-full px-2 text-[11px] font-medium",
        className
      )}
    >
      {label}
    </span>
  );
}

function OwnerRow({ owner, compact = false }) {
  if (!owner) return null;
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-bold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
          compact ? "size-5" : "size-6"
        )}
      >
        {owner.initials || "?"}
      </span>
      <span className="truncate">{owner.name}</span>
    </span>
  );
}

export function LeadFormDrawer({
  open,
  onOpenChange,
  initialLead = null,
  onSave,
  owners = LEAD_OWNERS,
  defaultOwnerId = "",
}) {
  const isEdit = Boolean(initialLead);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const ownerOptions = owners?.length ? owners : LEAD_OWNERS;
  const fallbackOwnerId = defaultOwnerId || ownerOptions[0]?.id || "";

  useEffect(() => {
    if (!open) return;
    if (initialLead) {
      setForm({
        firstName: initialLead.firstName || "",
        lastName: initialLead.lastName || "",
        email: initialLead.email || "",
        phone: initialLead.phone || "",
        company: initialLead.company || "",
        title: initialLead.title === "—" ? "" : initialLead.title || "",
        source: initialLead.source || "Website",
        industry: initialLead.industry || "",
        status: initialLead.status || "New",
        ownerId: initialLead.ownerId || fallbackOwnerId,
        score: String(initialLead.score ?? 50),
        notes: initialLead.notes || "",
      });
    } else {
      setForm({ ...EMPTY_FORM, ownerId: fallbackOwnerId });
    }
    setErrors({});
    setSaving(false);
  }, [open, initialLead, fallbackOwnerId]);

  const companyOptions = useMemo(() => {
    if (form.company && !LEAD_COMPANIES.includes(form.company)) {
      return [form.company, ...LEAD_COMPANIES];
    }
    return LEAD_COMPANIES;
  }, [form.company]);

  const sourceOptions = useMemo(
    () =>
      LEAD_SOURCES.map((item) => ({
        value: item,
        label: item,
        trigger: (
          <StatusChip
            label={item}
            className={LEAD_SOURCE_STYLES[item] || LEAD_SOURCE_STYLES.Manual}
          />
        ),
        option: (
          <StatusChip
            label={item}
            className={LEAD_SOURCE_STYLES[item] || LEAD_SOURCE_STYLES.Manual}
          />
        ),
      })),
    []
  );

  const statusOptions = useMemo(
    () =>
      LEAD_STATUSES.map((item) => ({
        value: item,
        label: item,
        trigger: (
          <StatusChip
            label={item}
            className={LEAD_STATUS_STYLES[item] || LEAD_STATUS_STYLES.New}
          />
        ),
        option: (
          <StatusChip
            label={item}
            className={LEAD_STATUS_STYLES[item] || LEAD_STATUS_STYLES.New}
          />
        ),
      })),
    []
  );

  const ownerSelectOptions = useMemo(() => {
    const sorted = fallbackOwnerId
      ? [...ownerOptions].sort((a, b) => {
          if (a.id === fallbackOwnerId) return -1;
          if (b.id === fallbackOwnerId) return 1;
          return 0;
        })
      : ownerOptions;
    return sorted.map((owner) => ({
      value: owner.id,
      label: owner.name,
      searchText: `${owner.name} ${owner.initials || ""}`,
      trigger: <OwnerRow owner={owner} compact />,
      option: <OwnerRow owner={owner} />,
    }));
  }, [ownerOptions, fallbackOwnerId]);

  const fullName = `${form.firstName} ${form.lastName}`.trim();
  const score = Math.min(100, Math.max(0, Number(form.score) || 0));
  const suggestedCompany = companyFromEmail(form.email);
  const companyFromEmailHint =
    Boolean(form.company) &&
    suggestedCompany &&
    form.company.trim().toLowerCase() === suggestedCompany.toLowerCase();

  function applySuggestedCompany(prev, email) {
    if (prev.company.trim()) return prev;
    const suggested = companyFromEmail(email);
    if (!suggested) return prev;
    return { ...prev, company: suggested };
  }

  function update(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "email") return applySuggestedCompany(next, value);
      return next;
    });
    setErrors((prev) => {
      if (!prev[field]) return prev;
      return {
        ...prev,
        [field]: errorFor(field, { ...form, [field]: value }),
      };
    });
  }

  function handleBlur(field, value) {
    const resolved = value ?? form[field];
    const snapshot = { ...form, [field]: resolved };
    if (field === "email") {
      setForm((prev) => applySuggestedCompany({ ...prev, email: resolved }, resolved));
    }
    setErrors((prev) => ({
      ...prev,
      [field]: errorFor(field, snapshot),
    }));
  }

  function validate() {
    const next = {};
    for (const field of ["firstName", "lastName", "email", "score"]) {
      const message = errorFor(field, form);
      if (message) next[field] = message;
    }
    setErrors(next);
    if (Object.keys(next).length) {
      const first = Object.keys(next)[0];
      requestAnimationFrame(() => {
        document.getElementById(`lead-${first}`)?.focus();
      });
    }
    return Object.keys(next).length === 0;
  }

  function buildLead() {
    return {
      id: initialLead?.id || `l${Date.now()}`,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      company: form.company.trim(),
      title: form.title.trim(),
      source: form.source,
      industry: form.industry,
      status: form.status,
      ownerId: form.ownerId,
      score,
      notes: form.notes.trim(),
      lastContacted: initialLead?.lastContacted || null,
      createdAt:
        initialLead?.createdAt || new Date().toISOString().slice(0, 10),
    };
  }

  async function handleSave(event) {
    event?.preventDefault?.();
    if (saving) return;
    if (!validate()) {
      toast.error("Add a name and valid email to save");
      return;
    }
    const lead = buildLead();
    setSaving(true);
    try {
      await onSave?.(lead, { isEdit });
      onOpenChange?.(false);
      toast.success(isEdit ? "Lead updated" : "Lead added");
    } catch {
      // Parent shows the error toast.
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title={isEdit ? "Edit lead" : "Add lead"}
        hideHeader
        maxWidth={480}
        onClose={() => onOpenChange?.(false)}
        className="overflow-hidden rounded-none"
      >
        <div className="flex items-start justify-between gap-3 border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-[13px] font-bold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
              {initialsFrom(form.firstName, form.lastName)}
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-[18px] font-semibold tracking-[-0.02em] text-neutral-900 dark:text-neutral-50">
                {fullName || (isEdit ? "Edit lead" : "New lead")}
              </h2>
              <p className="mt-0.5 truncate text-[13px] text-neutral-500">
                {form.title && form.company
                  ? `${form.title} at ${form.company}`
                  : form.company ||
                    form.email ||
                    (isEdit
                      ? "Update this prospect"
                      : "Name and email are enough to start")}
              </p>
            </div>
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
          onSubmit={handleSave}
          noValidate
        >
          <SheetBody className="space-y-6 px-6 py-5">
            <section className="space-y-3">
              <h3 className="text-[11px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
                Person
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel htmlFor="lead-firstName" required>
                    First name
                  </FieldLabel>
                  <ValidatedInput
                    field="firstName"
                    onValidate={handleBlur}
                    id="lead-firstName"
                    value={form.firstName}
                    onChange={(e) => update("firstName", e.target.value)}
                    placeholder="Maya"
                    className="mt-1.5 h-10"
                    required
                    aria-required="true"
                    aria-invalid={Boolean(errors.firstName)}
                  />
                  <FieldError message={errors.firstName} />
                </div>
                <div>
                  <FieldLabel htmlFor="lead-lastName" required>
                    Last name
                  </FieldLabel>
                  <ValidatedInput
                    field="lastName"
                    onValidate={handleBlur}
                    id="lead-lastName"
                    value={form.lastName}
                    onChange={(e) => update("lastName", e.target.value)}
                    placeholder="Chen"
                    className="mt-1.5 h-10"
                    required
                    aria-required="true"
                    aria-invalid={Boolean(errors.lastName)}
                  />
                  <FieldError message={errors.lastName} />
                </div>
              </div>
              <div>
                <FieldLabel htmlFor="lead-email" required>
                  Email
                </FieldLabel>
                <ValidatedInput
                  field="email"
                  onValidate={handleBlur}
                  id="lead-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="maya.chen@company.com"
                  className="mt-1.5 h-10"
                  required
                  aria-required="true"
                  aria-invalid={Boolean(errors.email)}
                />
                <FieldError message={errors.email} />
              </div>
              <div>
                <Label htmlFor="lead-phone">Phone</Label>
                <PhoneInput
                  id="lead-phone"
                  value={form.phone}
                  onChange={(next) => update("phone", next)}
                  className="mt-1.5"
                />
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-[11px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
                Company
              </h3>
              <div>
                <Label>Company</Label>
                <CompanyCombobox
                  value={form.company}
                  onChange={(value) => update("company", value)}
                  options={companyOptions}
                />
                {companyFromEmailHint ? (
                  <p className="mt-1 text-[11px] text-neutral-400">
                    Suggested from email
                  </p>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="lead-title">Job title</Label>
                  <Input
                    id="lead-title"
                    value={form.title}
                    onChange={(e) => update("title", e.target.value)}
                    placeholder="VP of Growth"
                    className="mt-1.5 h-10"
                  />
                </div>
                <div>
                  <Label>Industry</Label>
                  <Select
                    value={form.industry || null}
                    onValueChange={(value) => update("industry", value ?? "")}
                  >
                    <SelectTrigger className="mt-1.5 h-10 w-full">
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_INDUSTRIES.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-[11px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
                Qualification
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Source</Label>
                  <SearchSelect
                    value={form.source}
                    onChange={(value) => update("source", value)}
                    options={sourceOptions}
                    placeholder="Select source"
                    searchPlaceholder="Search sources"
                    emptyLabel="No sources found"
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <SearchSelect
                    value={form.status}
                    onChange={(value) => update("status", value)}
                    options={statusOptions}
                    placeholder="Select status"
                    searchPlaceholder="Search statuses"
                    emptyLabel="No statuses found"
                  />
                </div>
              </div>
              <div>
                <Label>Owner</Label>
                <SearchSelect
                  value={form.ownerId}
                  onChange={(value) => update("ownerId", value)}
                  options={ownerSelectOptions}
                  placeholder="Select owner"
                  searchPlaceholder="Search team members"
                  emptyLabel="No owners found"
                />
              </div>
              <div>
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="lead-score">Lead score</Label>
                  <span className="text-[12px] font-semibold text-neutral-700 dark:text-neutral-200">
                    {score}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    id="lead-score"
                    type="range"
                    min={0}
                    max={100}
                    value={score}
                    onChange={(e) => update("score", e.target.value)}
                    onBlur={() => handleBlur("score")}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-neutral-200 accent-primary-600 dark:bg-neutral-800"
                  />
                  <span
                    className={cn(
                      "size-2.5 shrink-0 rounded-full",
                      scoreTone(score)
                    )}
                  />
                </div>
                <FieldError message={errors.score} />
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-[11px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
                Notes
              </h3>
              <Textarea
                id="lead-notes"
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="Context, next step, or how you found them…"
                rows={3}
              />
            </section>
          </SheetBody>

          <SheetFooter className="justify-end gap-2 px-6 [&>button]:flex-none">
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
              {saving
                ? "Saving…"
                : isEdit
                  ? "Save changes"
                  : "Save lead"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
