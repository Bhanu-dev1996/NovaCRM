"use client";

import { useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { CONTACT_TYPES, CONTACT_OWNERS } from "@/components/contacts/contacts-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  contactType: "",
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

function FormFieldDropdown({
  id,
  value,
  onChange,
  onBlur,
  options,
  placeholder = "Select",
  searchPlaceholder = "Search…",
  emptyLabel = "No matches",
  searchable = false,
  listClassName,
  invalid = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const closingFromSelectRef = useRef(false);

  function handleOpenChange(next) {
    setOpen(next);
    if (!next) {
      setQuery("");
      if (closingFromSelectRef.current) {
        closingFromSelectRef.current = false;
        return;
      }
      onBlur?.();
    }
  }

  const selected = options.find((item) => item.value === value);
  const filtered = useMemo(() => {
    if (!searchable) return options;
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((item) =>
      (item.searchText || item.label).toLowerCase().includes(q)
    );
  }, [options, query, searchable]);

  function selectItem(nextValue) {
    onChange(nextValue);
    setQuery("");
    closingFromSelectRef.current = true;
    setOpen(false);
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            aria-invalid={invalid}
            className="mt-1.5 h-10 w-full justify-between rounded-lg border-input bg-transparent px-2.5 text-sm font-normal shadow-none dark:bg-input/30"
          />
        }
      >
        <span
          className={cn(
            "truncate text-left",
            !selected && "text-muted-foreground"
          )}
        >
          {selected?.label || placeholder}
        </span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={6}
        className="z-[120] w-(--anchor-width) min-w-(--anchor-width) gap-0 overflow-hidden p-0"
      >
        {searchable ? (
          <div
            className="border-b border-border p-2"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-9"
              autoFocus
              onKeyDown={(event) => {
                event.stopPropagation();
                if (event.key === "Enter") {
                  event.preventDefault();
                  if (filtered[0]) selectItem(filtered[0].value);
                }
              }}
            />
          </div>
        ) : null}
        <div
          className={cn(
            "max-h-56 overflow-y-auto p-1",
            listClassName ?? "min-h-32"
          )}
        >
          {filtered.map((item) => (
            <DropdownMenuItem
              key={item.value}
              className="gap-2 py-2"
              onClick={() => selectItem(item.value)}
            >
              <Check
                className={cn(
                  "size-3.5 shrink-0",
                  value === item.value ? "opacity-100" : "opacity-0"
                )}
              />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
            </DropdownMenuItem>
          ))}
          {filtered.length === 0 ? (
            <p className="px-2 py-3 text-center text-[12px] text-muted-foreground">
              {emptyLabel}
            </p>
          ) : null}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CompanyIdCombobox({
  value,
  onChange,
  onBlur,
  companies,
  onCreateCompany,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);

  function handleOpenChange(next) {
    setOpen(next);
    if (!next) {
      setQuery("");
      onBlur?.();
    }
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

function errorFor(field, values) {
  const value = String(values[field] ?? "");
  if (field === "firstName" && !value.trim()) return "First name is required";
  if (field === "lastName" && !value.trim()) return "Last name is required";
  if (field === "email" && value.trim() && !EMAIL_PATTERN.test(value.trim())) {
    return "Enter a valid email address";
  }
  if (field === "contactType" && !value.trim()) {
    return "Contact type is required";
  }
  return undefined;
}

function normalizeEmail(email) {
  return String(email ?? "")
    .trim()
    .toLowerCase();
}

function emailIsDuplicate(email, { existingEmails, initialContact, isEdit }) {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  const own = normalizeEmail(initialContact?.email);
  if (isEdit && own && own === normalized) return false;
  return existingEmails.some((row) => normalizeEmail(row) === normalized);
}

function buildInitialForm(initialContact, defaultOwnerId) {
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
      ownerId: initialContact.ownerId || defaultOwnerId || "",
      tags: initialContact.tags || [],
      linkedIn: initialContact.linkedIn || "",
      notes: initialContact.notes || "",
      department: initialContact.department || "",
    };
  }
  return { ...EMPTY_FORM };
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
  const [form, setForm] = useState(() =>
    buildInitialForm(initialContact, defaultOwnerId)
  );
  const [errors, setErrors] = useState({});
  const [emailDuplicateWarning, setEmailDuplicateWarning] = useState("");
  const [saving, setSaving] = useState(false);
  const duplicateToastShown = useRef(false);

  const typeOptions = useMemo(
    () => CONTACT_TYPES.map((item) => ({ value: item, label: item })),
    []
  );

  const ownerDropdownOptions = useMemo(
    () =>
      ownerOptions.map((owner) => ({
        value: owner.id,
        label: owner.name,
        searchText: `${owner.name} ${owner.email || ""} ${owner.initials || ""}`,
      })),
    [ownerOptions]
  );

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    if (key === "email") {
      setEmailDuplicateWarning("");
      duplicateToastShown.current = false;
    }
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
    if (field === "email") {
      syncDuplicateEmailWarning(snapshot.email);
    }
  }

  function syncDuplicateEmailWarning(email) {
    const duplicate = emailIsDuplicate(email, {
      existingEmails,
      initialContact,
      isEdit,
    });
    const message = duplicate
      ? "A contact with this email already exists."
      : "";
    setEmailDuplicateWarning(message);
    if (duplicate && !duplicateToastShown.current) {
      duplicateToastShown.current = true;
      toast.warning("A contact with this email already exists");
    }
  }

  function validateAll() {
    const next = {};
    for (const field of ["firstName", "lastName", "email", "contactType"]) {
      const err = errorFor(field, form);
      if (err) next[field] = err;
    }
    setErrors(next);

    const duplicate = emailIsDuplicate(form.email, {
      existingEmails,
      initialContact,
      isEdit,
    });
    if (duplicate) {
      setEmailDuplicateWarning("A contact with this email already exists.");
    }

    const valid = Object.keys(next).length === 0 && !duplicate;
    if (!valid) {
      const firstField =
        next.firstName !== undefined
          ? "firstName"
          : next.lastName !== undefined
            ? "lastName"
            : next.email !== undefined
              ? "email"
              : next.contactType !== undefined
                ? "contactType"
                : duplicate
                  ? "email"
                  : null;
      if (firstField) {
        requestAnimationFrame(() => {
          document.getElementById(`contact-${firstField}`)?.focus();
        });
      }
    }
    return valid;
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
          ownerId: form.ownerId || defaultOwnerId || "",
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
                ? "Update contact details"
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
          onSubmit={submit}
          noValidate
        >
          <SheetBody className="space-y-4 px-6 py-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel htmlFor="contact-firstName" required>
                  First Name
                </FieldLabel>
                <Input
                  id="contact-firstName"
                  value={form.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                  onBlur={() => handleBlur("firstName")}
                  placeholder="Maya"
                  className="mt-1.5 h-10"
                  aria-invalid={Boolean(errors.firstName)}
                />
                <FieldError message={errors.firstName} />
              </div>
              <div>
                <FieldLabel htmlFor="contact-lastName" required>
                  Last Name
                </FieldLabel>
                <Input
                  id="contact-lastName"
                  value={form.lastName}
                  onChange={(e) => update("lastName", e.target.value)}
                  onBlur={() => handleBlur("lastName")}
                  placeholder="Chen"
                  className="mt-1.5 h-10"
                  aria-invalid={Boolean(errors.lastName)}
                />
                <FieldError message={errors.lastName} />
              </div>
            </div>

            <div>
              <FieldLabel htmlFor="contact-email">Email</FieldLabel>
              <Input
                id="contact-email"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                onBlur={() => handleBlur("email")}
                placeholder="name@company.com"
                className="mt-1.5 h-10"
                aria-invalid={Boolean(errors.email || emailDuplicateWarning)}
                aria-describedby={
                  emailDuplicateWarning ? "contact-email-duplicate" : undefined
                }
              />
              <FieldError message={errors.email} />
              {emailDuplicateWarning && !errors.email ? (
                <p
                  id="contact-email-duplicate"
                  role="alert"
                  className="mt-1 text-[11px] text-amber-700 dark:text-amber-400"
                >
                  {emailDuplicateWarning}
                </p>
              ) : null}
            </div>

            <div>
              <Label htmlFor="contact-phone">Phone Number</Label>
              <PhoneInput
                id="contact-phone"
                value={form.phone}
                onChange={(next) => update("phone", next)}
                onBlur={() => handleBlur("phone")}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="contact-title">Job Title</Label>
              <Input
                id="contact-title"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                onBlur={() => handleBlur("title")}
                placeholder="Director of Sales"
                className="mt-1.5 h-10"
              />
            </div>

            <div>
              <Label>Company</Label>
              <CompanyIdCombobox
                value={form.companyId}
                onChange={(id) => update("companyId", id)}
                onBlur={() => handleBlur("companyId")}
                companies={companies}
                onCreateCompany={createCompany}
              />
            </div>

            <div>
              <FieldLabel htmlFor="contact-contactType" required>
                Contact Type
              </FieldLabel>
              <FormFieldDropdown
                id="contact-contactType"
                value={form.contactType}
                onChange={(value) => update("contactType", value)}
                onBlur={() => handleBlur("contactType")}
                options={typeOptions}
                placeholder="Select contact type"
                listClassName="min-h-40"
                invalid={Boolean(errors.contactType)}
              />
              <FieldError message={errors.contactType} />
            </div>

            <div>
              <FieldLabel htmlFor="contact-owner">Contact Owner</FieldLabel>
              <FormFieldDropdown
                id="contact-owner"
                value={form.ownerId}
                onChange={(value) => update("ownerId", value)}
                onBlur={() => handleBlur("ownerId")}
                options={ownerDropdownOptions}
                placeholder="Select owner"
                searchable
                searchPlaceholder="Search team…"
                listClassName="min-h-48"
              />
            </div>

            <div>
              <Label htmlFor="contact-notes">Notes</Label>
              <Textarea
                id="contact-notes"
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                onBlur={() => handleBlur("notes")}
                placeholder="Relationship context, preferences, next steps…"
                rows={3}
                className="mt-1.5"
              />
            </div>
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
              {saving ? "Saving…" : "Save Contact"}
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
