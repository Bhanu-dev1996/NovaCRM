"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";

import { FieldError } from "@/components/crm/crm-shared";
import { collectDealContactIds } from "@/components/deals/deal-related-data";
import { fromApiCompany } from "@/components/companies/company-api";
import { fromApiContact } from "@/components/contacts/contact-api";
import { LEAD_INDUSTRIES } from "@/components/leads/leads-data";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1001+"];

const EMPTY_ACCOUNT_FORM = {
  mode: "create",
  name: "",
  website: "",
  industry: "",
  size: "",
  existingId: "",
};

const EMPTY_CONTACT_FORM = {
  mode: "create",
  firstName: "",
  lastName: "",
  email: "",
  title: "",
  companyId: "",
  existingId: "",
};

const nativeSelectClass =
  "mt-1.5 h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const selectTriggerClass = "mt-1.5 h-9 w-full";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function FormFieldDropdown({
  id,
  value,
  onChange,
  options,
  placeholder = "Select",
  searchPlaceholder = "Search…",
  emptyLabel = "No matches",
  searchable = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const closingFromSelectRef = useRef(false);

  function handleOpenChange(next) {
    setOpen(next);
    if (!next) {
      setQuery("");
      closingFromSelectRef.current = false;
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
            className={cn(
              selectTriggerClass,
              "justify-between rounded-lg border-input bg-transparent px-2.5 text-sm font-normal shadow-none dark:bg-input/30"
            )}
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
        <div className="max-h-56 min-h-24 overflow-y-auto p-1">
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

function companyFieldError(field, form) {
  if (field === "name" && form.mode === "create" && !form.name.trim()) {
    return "Company name is required";
  }
  if (field === "website" && form.website.trim()) {
    const value = form.website.trim();
    try {
      const url = value.includes("://") ? value : `https://${value}`;
      const parsed = new URL(url);
      if (!parsed.hostname.includes(".")) {
        return "Enter a valid website URL";
      }
    } catch {
      return "Enter a valid website URL (e.g. https://example.com)";
    }
  }
  if (field === "existingId" && form.mode === "existing" && !form.existingId) {
    return "Select a company to link";
  }
  return undefined;
}

function contactFieldError(field, form) {
  if (field === "firstName" && form.mode === "create" && !form.firstName.trim()) {
    return "First name is required";
  }
  if (field === "lastName" && form.mode === "create" && !form.lastName.trim()) {
    return "Last name is required";
  }
  if (field === "email" && form.email.trim() && !EMAIL_PATTERN.test(form.email.trim())) {
    return "Enter a valid email address";
  }
  if (field === "existingId" && form.mode === "existing" && !form.existingId) {
    return "Select a contact to link";
  }
  return undefined;
}

function ExistingCompanySearchCombobox({
  companies,
  value,
  onChange,
  onBlur,
  invalid = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const closingFromSelectRef = useRef(false);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const selected = companies.find((row) => String(row.id) === String(value));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((row) =>
      (row.name || "").toLowerCase().includes(q)
    );
  }, [companies, query]);

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

  function pickCompany(id) {
    closingFromSelectRef.current = true;
    onChange(String(id));
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
            id="related-company-existing"
            aria-invalid={invalid || undefined}
            className={cn(
              selectTriggerClass,
              "justify-between rounded-lg border-input bg-transparent px-2.5 text-sm font-normal shadow-none dark:bg-input/30",
              invalid && "border-destructive aria-invalid:border-destructive"
            )}
          />
        }
      >
        <span className={cn("truncate", !selected && "text-muted-foreground")}>
          {selected?.name || "Search or select a company"}
        </span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={6}
        positionMethod="fixed"
        collisionAvoidance={{
          side: "flip",
          align: "shift",
          fallbackAxisSide: "none",
        }}
        className="z-[120] w-(--anchor-width) min-w-(--anchor-width) gap-0 overflow-hidden rounded-xl p-0"
      >
        <div className="border-b border-border p-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by company name"
            className="h-9"
            autoFocus
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                if (filtered[0]) pickCompany(filtered[0].id);
              }
            }}
          />
        </div>
        <div className="max-h-52 overflow-y-auto p-1">
          {filtered.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => pickCompany(row.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted",
                String(value) === String(row.id) && "bg-muted"
              )}
            >
              <Check
                className={cn(
                  "size-3.5 shrink-0",
                  String(value) === String(row.id) ? "opacity-100" : "opacity-0"
                )}
              />
              <span className="truncate">{row.name}</span>
            </button>
          ))}
          {!filtered.length ? (
            <p className="px-2 py-3 text-center text-[12px] text-muted-foreground">
              No companies match your search
            </p>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function contactRowLabel(row) {
  const first = row.firstName || row.first_name || "";
  const last = row.lastName || row.last_name || "";
  const name = [first, last].filter(Boolean).join(" ");
  return name || row.email || "Contact";
}

export function DealRelatedAddDialogs({
  addType,
  addMode = "create",
  onAddTypeChange,
  deal,
  companies,
  contacts,
  currentUserId,
  onPatchDeal,
  onCompanyCreated,
  onContactCreated,
}) {
  const [accountForm, setAccountForm] = useState(EMPTY_ACCOUNT_FORM);
  const [contactForm, setContactForm] = useState(EMPTY_CONTACT_FORM);
  const [accountErrors, setAccountErrors] = useState({});
  const [contactErrors, setContactErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function patchAccount(field, value) {
    setAccountForm((prev) => ({ ...prev, [field]: value }));
    setAccountErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function patchContact(field, value) {
    setContactForm((prev) => ({ ...prev, [field]: value }));
    setContactErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function blurAccountField(field) {
    setAccountErrors((prev) => ({
      ...prev,
      [field]: companyFieldError(field, accountForm),
    }));
  }

  function blurContactField(field) {
    setContactErrors((prev) => ({
      ...prev,
      [field]: contactFieldError(field, contactForm),
    }));
  }

  function validateAllCompanyFields(form = accountForm) {
    const fields =
      form.mode === "create"
        ? ["name", "website"]
        : ["existingId"];
    const next = {};
    for (const field of fields) {
      const message = companyFieldError(field, form);
      if (message) next[field] = message;
    }
    setAccountErrors(next);
    return Object.keys(next).length === 0;
  }

  function validateAllContactFields(form = contactForm) {
    const fields =
      form.mode === "create"
        ? ["firstName", "lastName", "email"]
        : ["existingId"];
    const next = {};
    for (const field of fields) {
      const message = contactFieldError(field, form);
      if (message) next[field] = message;
    }
    setContactErrors(next);
    return Object.keys(next).length === 0;
  }

  const linkedCompanyId = deal?.companyId ? String(deal.companyId) : "";

  const linkedContactIds = useMemo(
    () => collectDealContactIds(deal),
    [deal]
  );

  const availableCompanies = useMemo(
    () =>
      companies.filter((row) => String(row.id) !== linkedCompanyId),
    [companies, linkedCompanyId]
  );

  const availableContacts = useMemo(
    () =>
      contacts.filter((row) => !linkedContactIds.has(String(row.id))),
    [contacts, linkedContactIds]
  );

  const companyChoices = useMemo(() => {
    if (deal?.companyId) {
      const match = companies.find(
        (row) => String(row.id) === String(deal.companyId)
      );
      return match ? [match] : [];
    }
    return companies;
  }, [deal, companies]);

  useEffect(() => {
    if (!addType) return;
    const mode = addMode === "existing" ? "existing" : "create";
    if (addType === "company") {
      setAccountForm({ ...EMPTY_ACCOUNT_FORM, mode });
      setAccountErrors({});
    } else {
      setContactForm({
        ...EMPTY_CONTACT_FORM,
        mode,
        companyId: deal?.companyId || companyChoices[0]?.id || "",
      });
      setContactErrors({});
    }
  }, [addType, addMode, deal?.companyId, companyChoices]);

  async function handleAddCompany() {
    if (saving) return;
    if (!validateAllCompanyFields()) return;
    const creating = accountForm.mode === "create";
    const name = accountForm.name.trim();
    const existingId = accountForm.existingId;
    setSaving(true);
    try {
      let company = creating
        ? null
        : companies.find((row) => String(row.id) === String(existingId));
      if (creating) {
        const result = await apiFetch("/api/companies", {
          method: "POST",
          body: JSON.stringify({
            name,
            website: accountForm.website.trim() || null,
            industry: accountForm.industry || null,
            size: accountForm.size || null,
            owner_id: currentUserId || null,
          }),
        });
        company = result.data;
        onCompanyCreated?.(fromApiCompany(company));
      }
      if (!company?.id) {
        toast.error("Could not link that company");
        return;
      }
      const saved = creating ? fromApiCompany(company) : company;
      await onPatchDeal({ companyId: saved.id });
      onAddTypeChange(null);
      toast.success(creating ? "Company added" : "Company linked");
    } catch (error) {
      toast.error(error.message || "Could not add company");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddContact() {
    if (saving) return;
    if (!validateAllContactFields()) return;
    const creating = contactForm.mode === "create";
    const existingId = contactForm.existingId;
    setSaving(true);
    try {
      let contact = creating
        ? null
        : contacts.find((row) => row.id === existingId);
      if (creating) {
        const result = await apiFetch("/api/contacts", {
          method: "POST",
          body: JSON.stringify({
            first_name: contactForm.firstName.trim(),
            last_name: contactForm.lastName.trim(),
            email: contactForm.email.trim() || null,
            title: contactForm.title.trim() || null,
            company_id: contactForm.companyId || null,
            owner_id: currentUserId || null,
          }),
        });
        contact = result.data;
        onContactCreated?.(fromApiContact(contact));
      }
      if (!contact?.id) {
        toast.error("Could not link that contact");
        return;
      }
      const saved = creating ? fromApiContact(contact) : contact;
      const contactId = saved.id;
      if (!deal?.contactId) {
        await onPatchDeal({ contactId });
      } else if (String(deal.contactId) === String(contactId)) {
        toast.message("Contact is already linked");
        onAddTypeChange(null);
        return;
      } else {
        const next = [...(deal.additionalContactIds || [])];
        if (!next.map(String).includes(String(contactId))) {
          next.push(contactId);
        }
        await onPatchDeal({ additionalContactIds: next });
      }
      onAddTypeChange(null);
      toast.success(creating ? "Contact added" : "Contact linked");
    } catch (error) {
      toast.error(error.message || "Could not add contact");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={Boolean(addType)}
      onOpenChange={(open) => {
        if (!open) onAddTypeChange(null);
      }}
    >
      {addType === "company" ? (
        <DialogContent
          title={
            accountForm.mode === "existing"
              ? "Add existing company"
              : "Add new company"
          }
          description={
            accountForm.mode === "existing"
              ? "Select a company from your workspace."
              : "Enter details for the new company to link to this deal."
          }
          onClose={() => onAddTypeChange(null)}
        >
          <DialogBody className="space-y-4">
            {accountForm.mode === "create" ? (
              <>
                <div>
                  <FieldLabel htmlFor="related-company-name" required>
                    Company name
                  </FieldLabel>
                  <Input
                    id="related-company-name"
                    className="mt-1.5"
                    value={accountForm.name}
                    onChange={(event) => patchAccount("name", event.target.value)}
                    onBlur={() => blurAccountField("name")}
                    placeholder="e.g. CloudScale Systems"
                    aria-invalid={accountErrors.name ? true : undefined}
                  />
                  <FieldError message={accountErrors.name} />
                </div>
                <div>
                  <FieldLabel htmlFor="related-company-website">Website</FieldLabel>
                  <Input
                    id="related-company-website"
                    type="url"
                    className="mt-1.5"
                    value={accountForm.website}
                    onChange={(event) => patchAccount("website", event.target.value)}
                    onBlur={() => blurAccountField("website")}
                    placeholder="https://www.example.com"
                    aria-invalid={accountErrors.website ? true : undefined}
                  />
                  <FieldError message={accountErrors.website} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="related-company-industry">Industry</Label>
                    <FormFieldDropdown
                      id="related-company-industry"
                      value={accountForm.industry}
                      onChange={(value) => patchAccount("industry", value)}
                      placeholder="Select industry"
                      searchPlaceholder="Search industries…"
                      searchable
                      options={LEAD_INDUSTRIES.map((industry) => ({
                        value: industry,
                        label: industry,
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="related-company-size">Size</Label>
                    <FormFieldDropdown
                      id="related-company-size"
                      value={accountForm.size}
                      onChange={(value) => patchAccount("size", value)}
                      placeholder="Select size"
                      options={COMPANY_SIZES.map((size) => ({
                        value: size,
                        label: `${size} employees`,
                      }))}
                    />
                  </div>
                </div>
              </>
            ) : null}
            {accountForm.mode === "existing" && availableCompanies.length ? (
              <div>
                <FieldLabel htmlFor="related-company-existing" required>
                  Existing company
                </FieldLabel>
                <ExistingCompanySearchCombobox
                  companies={availableCompanies}
                  value={accountForm.existingId}
                  invalid={Boolean(accountErrors.existingId)}
                  onBlur={() => blurAccountField("existingId")}
                  onChange={(existingId) => patchAccount("existingId", existingId)}
                />
                <FieldError message={accountErrors.existingId} />
              </div>
            ) : null}
            {accountForm.mode === "existing" && !availableCompanies.length ? (
              <p className="text-[13px] text-neutral-500">
                No other companies available.{" "}
                <button
                  type="button"
                  className="font-medium text-primary-600 hover:underline dark:text-primary-400"
                  onClick={() =>
                    setAccountForm({
                      ...EMPTY_ACCOUNT_FORM,
                      mode: "create",
                    })
                  }
                >
                  Add a new company instead
                </button>
                .
              </p>
            ) : null}
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onAddTypeChange(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-primary-600 text-white hover:bg-primary-700"
              disabled={
                saving ||
                (accountForm.mode === "existing" && !availableCompanies.length)
              }
              onClick={handleAddCompany}
            >
              {saving
                ? "Saving…"
                : accountForm.mode === "create"
                  ? "Create & link"
                  : "Link company"}
            </Button>
          </DialogFooter>
        </DialogContent>
      ) : addType === "contact" ? (
        <DialogContent
          title={
            contactForm.mode === "existing"
              ? "Add existing contact"
              : "Add new contact"
          }
          description={
            contactForm.mode === "existing"
              ? "Select a contact already in your workspace."
              : "Create a contact and link them to this deal."
          }
          onClose={() => onAddTypeChange(null)}
        >
          <DialogBody className="space-y-3">
            {contactForm.mode === "create" ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor="related-contact-first" required>
                      First name
                    </FieldLabel>
                    <Input
                      id="related-contact-first"
                      className="mt-1.5"
                      value={contactForm.firstName}
                      onChange={(event) =>
                        patchContact("firstName", event.target.value)
                      }
                      onBlur={() => blurContactField("firstName")}
                      placeholder="e.g. Jordan"
                      aria-invalid={contactErrors.firstName ? true : undefined}
                    />
                    <FieldError message={contactErrors.firstName} />
                  </div>
                  <div>
                    <FieldLabel htmlFor="related-contact-last" required>
                      Last name
                    </FieldLabel>
                    <Input
                      id="related-contact-last"
                      className="mt-1.5"
                      value={contactForm.lastName}
                      onChange={(event) =>
                        patchContact("lastName", event.target.value)
                      }
                      onBlur={() => blurContactField("lastName")}
                      placeholder="e.g. Lee"
                      aria-invalid={contactErrors.lastName ? true : undefined}
                    />
                    <FieldError message={contactErrors.lastName} />
                  </div>
                </div>
                <div>
                  <FieldLabel htmlFor="related-contact-email">Email</FieldLabel>
                  <Input
                    id="related-contact-email"
                    type="email"
                    className="mt-1.5"
                    value={contactForm.email}
                    onChange={(event) => patchContact("email", event.target.value)}
                    onBlur={() => blurContactField("email")}
                    placeholder="jordan.lee@company.com"
                    aria-invalid={contactErrors.email ? true : undefined}
                  />
                  <FieldError message={contactErrors.email} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor="related-contact-title">Title</FieldLabel>
                    <Input
                      id="related-contact-title"
                      className="mt-1.5"
                      value={contactForm.title}
                      onChange={(event) => patchContact("title", event.target.value)}
                      placeholder="e.g. VP of Sales"
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="related-contact-company">Company</FieldLabel>
                    <select
                      id="related-contact-company"
                      className={nativeSelectClass}
                      value={contactForm.companyId}
                      onChange={(event) =>
                        patchContact("companyId", event.target.value)
                      }
                    >
                      <option value="">Optional — link to a company</option>
                      {companyChoices.map((row) => (
                        <option key={row.id} value={row.id}>
                          {row.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            ) : null}
            {contactForm.mode === "existing" && availableContacts.length ? (
              <div>
                <FieldLabel htmlFor="related-contact-existing" required>
                  Existing contact
                </FieldLabel>
                <select
                  id="related-contact-existing"
                  className={cn(
                    nativeSelectClass,
                    contactErrors.existingId && "border-destructive"
                  )}
                  value={contactForm.existingId}
                  onChange={(event) =>
                    patchContact("existingId", event.target.value)
                  }
                  onBlur={() => blurContactField("existingId")}
                  aria-invalid={contactErrors.existingId ? true : undefined}
                >
                  <option value="">Search or select a contact</option>
                  {availableContacts.map((row) => (
                    <option key={row.id} value={row.id}>
                      {contactRowLabel(row)}
                    </option>
                  ))}
                </select>
                <FieldError message={contactErrors.existingId} />
              </div>
            ) : null}
            {contactForm.mode === "existing" && !availableContacts.length ? (
              <p className="text-[13px] text-neutral-500">
                No other contacts available to link.
              </p>
            ) : null}
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onAddTypeChange(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-primary-600 text-white hover:bg-primary-700"
              disabled={
                saving ||
                (contactForm.mode === "existing" && !availableContacts.length)
              }
              onClick={handleAddContact}
            >
              {saving
                ? "Saving…"
                : contactForm.mode === "create"
                  ? "Create & link"
                  : "Link contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
