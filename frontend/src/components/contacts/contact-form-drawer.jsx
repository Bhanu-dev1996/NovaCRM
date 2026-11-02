"use client";

import { useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { toast } from "sonner";

import {
  CONTACT_TYPES,
  CONTACT_TYPE_STYLES,
  CONTACT_OWNERS,
  LIFECYCLE_STATUSES,
  LIFECYCLE_STYLES,
  tagStyleAt,
} from "@/components/contacts/contacts-data";
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
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  title: "",
  companyId: "",
  contactType: "Prospect",
  lifecycle: "Lead",
  ownerId: "",
  tags: [],
  linkedIn: "",
  notes: "",
  department: "",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function FieldError({ message }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1 text-[11px] text-error-text">
      {message}
    </p>
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

  function handleOpenChange(next) {
    setOpen(next);
    if (!next) setQuery("");
  }

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
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="mt-1.5 h-10 w-full justify-between rounded-lg border-input bg-transparent px-2.5 text-sm font-normal shadow-none dark:bg-input/30"
          />
        }
      >
        <span
          className={cn(
            "flex min-w-0 items-center gap-2",
            !selected && "text-muted-foreground"
          )}
        >
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

function CompanyIdCombobox({ value, onChange, companies, onCreateCompany }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);

  function handleOpenChange(next) {
    setOpen(next);
    if (!next) setQuery("");
  }

  const selected = companies.find((c) => c.id === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((c) => c.name.toLowerCase().includes(q));
  }, [companies, query]);

  const exactMatch = companies.some(
    (c) => c.name.toLowerCase() === query.trim().toLowerCase()
  );
  const canCreate = query.trim().length > 0 && !exactMatch;

  async function selectCompany(id) {
    onChange(id);
    setOpen(false);
    setQuery("");
  }

  async function handleCreate() {
    const name = query.trim();
    if (!name || creating) return;
    setCreating(true);
    try {
      const created = await onCreateCompany(name);
      if (created?.id) {
        onChange(created.id);
        setOpen(false);
        setQuery("");
        toast.success(`Added ${name}`);
      }
    } catch (error) {
      toast.error(error.message || "Could not create company");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="mt-1.5 h-10 w-full justify-between rounded-lg border-input bg-transparent px-2.5 text-sm font-normal shadow-none dark:bg-input/30"
          />
        }
      >
        <span className={cn("truncate", !selected && "text-muted-foreground")}>
          {selected?.name || "Search or create a company"}
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
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a company name"
            className="h-9"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (canCreate) handleCreate();
                else if (filtered[0]) selectCompany(filtered[0].id);
              }
            }}
          />
        </div>
        <div className="max-h-48 overflow-y-auto p-1">
          {filtered.map((company) => (
            <button
              key={company.id}
              type="button"
              onClick={() => selectCompany(company.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted",
                value === company.id && "bg-muted"
              )}
            >
              <Check
                className={cn(
                  "size-3.5",
                  value === company.id ? "opacity-100" : "opacity-0"
                )}
              />
              <span className="truncate">{company.name}</span>
            </button>
          ))}
          {canCreate ? (
            <button
              type="button"
              disabled={creating}
              onClick={handleCreate}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-primary-700 hover:bg-muted dark:text-primary-300"
            >
              <Plus className="size-3.5 shrink-0" />
              <span className="truncate">Create “{query.trim()}”</span>
            </button>
          ) : null}
          {!filtered.length && !canCreate ? (
            <p className="px-2 py-3 text-center text-[12px] text-muted-foreground">
              No companies found
            </p>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function TagsInput({ tags, onChange }) {
  const [draft, setDraft] = useState("");

  function addTag(raw) {
    const next = raw.trim();
    if (!next) return;
    if (tags.some((t) => t.toLowerCase() === next.toLowerCase())) return;
    onChange([...tags, next]);
    setDraft("");
  }

  return (
    <div className="mt-1.5 space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag, index) => (
          <span
            key={tag}
            className={cn(
              "inline-flex h-6 items-center gap-1 rounded-full px-2 text-[11px] font-medium",
              tagStyleAt(index)
            )}
          >
            {tag}
            <button
              type="button"
              className="rounded-full p-0.5 hover:bg-black/5 dark:hover:bg-white/10"
              aria-label={`Remove ${tag}`}
              onClick={() => onChange(tags.filter((t) => t !== tag))}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
      </div>
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Type a tag and press Enter"
        className="h-9"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addTag(draft);
          }
        }}
      />
    </div>
  );
}

function errorFor(field, values) {
  const value = String(values[field] ?? "");
  if (field === "firstName" && !value.trim()) return "First name is required";
  if (field === "lastName" && !value.trim()) return "Last name is required";
  if (field === "email" && value.trim() && !EMAIL_PATTERN.test(value.trim())) {
    return "Enter a valid work email";
  }
  return undefined;
}

function buildInitialForm(initialContact, fallbackOwnerId) {
  if (initialContact) {
    return {
      firstName: initialContact.firstName || "",
      lastName: initialContact.lastName || "",
      email: initialContact.email || "",
      phone: initialContact.phone || "",
      title: initialContact.title || "",
      companyId: initialContact.companyId || "",
      contactType: initialContact.contactType || "Prospect",
      lifecycle: initialContact.lifecycle || "Lead",
      ownerId: initialContact.ownerId || fallbackOwnerId,
      tags: initialContact.tags || [],
      linkedIn: initialContact.linkedIn || "",
      notes: initialContact.notes || "",
      department: initialContact.department || "",
    };
  }
  return { ...EMPTY_FORM, ownerId: fallbackOwnerId };
}

function ContactFormDrawerBody({
  onOpenChange,
  initialContact = null,
  onSave,
  owners = CONTACT_OWNERS,
  defaultOwnerId = "",
  companies = [],
  onCompaniesChange,
  existingEmails = [],
}) {
  const isEdit = Boolean(initialContact);
  const ownerOptions = owners?.length ? owners : CONTACT_OWNERS;
  const fallbackOwnerId = defaultOwnerId || ownerOptions[0]?.id || "";
  const [form, setForm] = useState(() =>
    buildInitialForm(initialContact, fallbackOwnerId)
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const duplicateWarned = useRef(false);

  const typeOptions = useMemo(
    () =>
      CONTACT_TYPES.map((item) => ({
        value: item,
        label: item,
        trigger: (
          <StatusChip
            label={item}
            className={CONTACT_TYPE_STYLES[item] || CONTACT_TYPE_STYLES.Other}
          />
        ),
        option: (
          <StatusChip
            label={item}
            className={CONTACT_TYPE_STYLES[item] || CONTACT_TYPE_STYLES.Other}
          />
        ),
      })),
    []
  );

  const lifecycleOptions = useMemo(
    () =>
      LIFECYCLE_STATUSES.map((item) => ({
        value: item,
        label: item,
        trigger: (
          <StatusChip
            label={item}
            className={LIFECYCLE_STYLES[item] || LIFECYCLE_STYLES.Inactive}
          />
        ),
        option: (
          <StatusChip
            label={item}
            className={LIFECYCLE_STYLES[item] || LIFECYCLE_STYLES.Inactive}
          />
        ),
      })),
    []
  );

  const ownerSelectOptions = useMemo(
    () =>
      ownerOptions.map((owner) => ({
        value: owner.id,
        label: owner.name,
        searchText: `${owner.name} ${owner.email || ""}`,
        trigger: (
          <span className="flex min-w-0 items-center gap-2">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[9px] font-bold dark:bg-neutral-800">
              {owner.initials}
            </span>
            <span className="truncate">{owner.name}</span>
          </span>
        ),
        option: (
          <span className="flex min-w-0 items-center gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-bold dark:bg-neutral-800">
              {owner.initials}
            </span>
            <span className="truncate">{owner.name}</span>
          </span>
        ),
      })),
    [ownerOptions]
  );

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validateAll() {
    const next = {};
    for (const field of ["firstName", "lastName", "email"]) {
      const err = errorFor(field, form);
      if (err) next[field] = err;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function checkDuplicateEmail(email) {
    const normalized = email.trim().toLowerCase();
    if (!normalized || duplicateWarned.current) return;
    const selfId = initialContact?.id;
    const clash =
      existingEmails.some((row) => row.toLowerCase() === normalized) &&
      (!selfId || initialContact?.email?.toLowerCase() !== normalized);
    if (clash) {
      duplicateWarned.current = true;
      toast.warning("A contact with this email already exists");
    }
  }

  async function createCompany(name) {
    const result = await apiFetch("/api/companies", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    const company = result.data;
    onCompaniesChange?.((prev) => {
      if (prev.some((c) => c.id === company.id)) return prev;
      return [...prev, company].sort((a, b) => a.name.localeCompare(b.name));
    });
    return company;
  }

  async function submit(event) {
    event.preventDefault();
    if (!validateAll()) return;
    setSaving(true);
    try {
      await onSave?.(
        {
          ...initialContact,
          ...form,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
        },
        { isEdit }
      );
      onOpenChange?.(false);
    } catch {
      /* parent toasts */
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.02em]">
              {isEdit ? "Edit Contact" : "Add Contact"}
            </h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              {isEdit
                ? "Update profile and relationship fields"
                : "First and last name are required"}
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
          onSubmit={submit}
          noValidate
        >
          <SheetBody className="space-y-6 px-6 py-5">
            <section className="space-y-3">
              <h3 className="text-[11px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
                Personal
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel htmlFor="contact-first" required>
                    First name
                  </FieldLabel>
                  <Input
                    id="contact-first"
                    value={form.firstName}
                    onChange={(e) => update("firstName", e.target.value)}
                    className="mt-1.5 h-10"
                    aria-invalid={Boolean(errors.firstName)}
                  />
                  <FieldError message={errors.firstName} />
                </div>
                <div>
                  <FieldLabel htmlFor="contact-last" required>
                    Last name
                  </FieldLabel>
                  <Input
                    id="contact-last"
                    value={form.lastName}
                    onChange={(e) => update("lastName", e.target.value)}
                    className="mt-1.5 h-10"
                    aria-invalid={Boolean(errors.lastName)}
                  />
                  <FieldError message={errors.lastName} />
                </div>
              </div>
              <div>
                <FieldLabel htmlFor="contact-email">Work email</FieldLabel>
                <Input
                  id="contact-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  onBlur={(e) => checkDuplicateEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="mt-1.5 h-10"
                  aria-invalid={Boolean(errors.email)}
                />
                <FieldError message={errors.email} />
              </div>
              <div>
                <Label htmlFor="contact-phone">Phone</Label>
                <PhoneInput
                  id="contact-phone"
                  value={form.phone}
                  onChange={(next) => update("phone", next)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="contact-title">Job title</Label>
                <Input
                  id="contact-title"
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                  placeholder="Director of Sales"
                  className="mt-1.5 h-10"
                />
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-[11px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
                Company
              </h3>
              <div>
                <Label>Company</Label>
                <CompanyIdCombobox
                  value={form.companyId}
                  onChange={(id) => update("companyId", id)}
                  companies={companies}
                  onCreateCompany={createCompany}
                />
              </div>
              <div>
                <Label htmlFor="contact-dept">Department</Label>
                <Input
                  id="contact-dept"
                  value={form.department}
                  onChange={(e) => update("department", e.target.value)}
                  placeholder="Optional"
                  className="mt-1.5 h-10"
                />
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-[11px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
                Contact details
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Type</Label>
                  <SearchSelect
                    value={form.contactType}
                    onChange={(v) => update("contactType", v)}
                    options={typeOptions}
                    placeholder="Contact type"
                    searchPlaceholder="Search types"
                  />
                </div>
                <div>
                  <Label>Lifecycle</Label>
                  <SearchSelect
                    value={form.lifecycle}
                    onChange={(v) => update("lifecycle", v)}
                    options={lifecycleOptions}
                    placeholder="Lifecycle"
                    searchPlaceholder="Search statuses"
                  />
                </div>
              </div>
              <div>
                <Label>Owner</Label>
                <SearchSelect
                  value={form.ownerId}
                  onChange={(v) => update("ownerId", v)}
                  options={ownerSelectOptions}
                  placeholder="Select owner"
                  searchPlaceholder="Search team"
                />
              </div>
              <div>
                <Label>Tags</Label>
                <TagsInput
                  tags={form.tags}
                  onChange={(tags) => update("tags", tags)}
                />
              </div>
              <div>
                <Label htmlFor="contact-linkedin">LinkedIn</Label>
                <Input
                  id="contact-linkedin"
                  value={form.linkedIn}
                  onChange={(e) => update("linkedIn", e.target.value)}
                  placeholder="linkedin.com/in/username"
                  className="mt-1.5 h-10"
                />
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-[11px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
                Notes
              </h3>
              <Textarea
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="Relationship context, preferences, next steps…"
                rows={3}
              />
            </section>
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
              {saving ? "Saving…" : isEdit ? "Save changes" : "Save Contact"}
            </Button>
          </SheetFooter>
        </form>
    </div>
  );
}

export function ContactFormDrawer({
  open,
  onOpenChange,
  initialContact = null,
  ...rest
}) {
  const isEdit = Boolean(initialContact);
  const formKey = initialContact?.id ?? "new";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        hideHeader
        maxWidth={480}
        onClose={() => onOpenChange?.(false)}
        className="overflow-hidden rounded-none"
      >
        <ContactFormDrawerBody
          key={formKey}
          initialContact={initialContact}
          onOpenChange={onOpenChange}
          {...rest}
        />
      </SheetContent>
    </Sheet>
  );
}
