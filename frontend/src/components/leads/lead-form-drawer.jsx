"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  LEAD_STATUSES,
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
  industry: "SaaS",
  status: "New",
  ownerId: "alex",
  score: "50",
  notes: "",
};

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-[11px] text-error-text">{message}</p>;
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
            className="mt-1.5 h-9 w-full justify-between rounded-lg border-input bg-transparent px-2.5 text-sm font-normal shadow-none dark:bg-input/30"
          />
        }
      >
        <span
          className={cn(
            "truncate",
            !value && "text-muted-foreground"
          )}
        >
          {value || "Select or create company"}
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
            placeholder="Search or type a new company"
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
              <span className="truncate">Create “{query.trim()}”</span>
            </button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
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
        title: initialLead.title || "",
        source: initialLead.source || "Website",
        industry: initialLead.industry || "SaaS",
        status: initialLead.status || "New",
        ownerId: initialLead.ownerId || fallbackOwnerId,
        score: String(initialLead.score ?? 50),
        notes: initialLead.notes || "",
      });
    } else {
      setForm({ ...EMPTY_FORM, ownerId: fallbackOwnerId });
    }
    setErrors({});
  }, [open, initialLead, fallbackOwnerId]);

  const companyOptions = useMemo(() => {
    if (form.company && !LEAD_COMPANIES.includes(form.company)) {
      return [form.company, ...LEAD_COMPANIES];
    }
    return LEAD_COMPANIES;
  }, [form.company]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate() {
    const next = {};
    if (!form.firstName.trim()) next.firstName = "First name is required";
    if (!form.lastName.trim()) next.lastName = "Last name is required";
    if (!form.email.trim()) next.email = "Work email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = "Enter a valid email";
    }
    const score = Number(form.score);
    if (Number.isNaN(score) || score < 0 || score > 100) {
      next.score = "Score must be between 0 and 100";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function buildLead() {
    return {
      id: initialLead?.id || `l${Date.now()}`,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      company: form.company.trim() || "Unknown Company",
      title: form.title.trim() || "—",
      source: form.source,
      industry: form.industry,
      status: form.status,
      ownerId: form.ownerId,
      score: Math.min(100, Math.max(0, Number(form.score) || 0)),
      notes: form.notes.trim(),
      lastContacted: initialLead?.lastContacted || null,
      createdAt:
        initialLead?.createdAt || new Date().toISOString().slice(0, 10),
    };
  }

  async function handleSave() {
    if (!validate()) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    const lead = buildLead();
    try {
      await onSave?.(lead, { isEdit });
      onOpenChange?.(false);
      toast.success(isEdit ? "Lead updated" : "Lead saved");
    } catch {
      // Parent shows the error toast.
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title={isEdit ? "Edit Lead" : "Add Lead"}
        description="Capture prospect details and qualification context."
        onClose={() => onOpenChange?.(false)}
        className="max-w-[350px]"
      >
        <SheetBody className="space-y-6">
          <section className="space-y-3">
            <h3 className="text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
              Personal Information
            </h3>
            <div className="grid gap-3">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={form.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                  placeholder="Maya"
                  className="mt-1.5 h-9"
                  aria-invalid={Boolean(errors.firstName)}
                />
                <FieldError message={errors.firstName} />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={form.lastName}
                  onChange={(e) => update("lastName", e.target.value)}
                  placeholder="Chen"
                  className="mt-1.5 h-9"
                  aria-invalid={Boolean(errors.lastName)}
                />
                <FieldError message={errors.lastName} />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Work Email *</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="maya.chen@company.com"
                className="mt-1.5 h-9"
                aria-invalid={Boolean(errors.email)}
              />
              <FieldError message={errors.email} />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="+1 (415) 555-0142"
                className="mt-1.5 h-9"
              />
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
              Company Information
            </h3>
            <div>
              <Label>Company</Label>
              <CompanyCombobox
                value={form.company}
                onChange={(value) => update("company", value)}
                options={companyOptions}
              />
            </div>
            <div>
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="VP of Growth"
                className="mt-1.5 h-9"
              />
            </div>
            <div>
              <Label>Industry</Label>
              <Select
                value={form.industry}
                onValueChange={(value) => update("industry", value)}
              >
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue placeholder="Select industry" />
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
          </section>

          <section className="space-y-3">
            <h3 className="text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
              Lead Details
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Lead Source</Label>
                <Select
                  value={form.source}
                  onValueChange={(value) => update("source", value)}
                >
                  <SelectTrigger className="mt-1.5 w-full">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_SOURCES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Lead Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) => update("status", value)}
                >
                  <SelectTrigger className="mt-1.5 w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_STATUSES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Lead Owner</Label>
                <Select
                  value={form.ownerId}
                  onValueChange={(value) => update("ownerId", value)}
                >
                  <SelectTrigger className="mt-1.5 w-full">
                    <SelectValue placeholder="Select owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {ownerOptions.map((owner) => (
                      <SelectItem key={owner.id} value={owner.id}>
                        {owner.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="score">Lead Score</Label>
                <Input
                  id="score"
                  type="number"
                  min={0}
                  max={100}
                  value={form.score}
                  onChange={(e) => update("score", e.target.value)}
                  placeholder="0–100"
                  className="mt-1.5 h-9"
                  aria-invalid={Boolean(errors.score)}
                />
                <FieldError message={errors.score} />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="Context, next steps, or qualification notes…"
                rows={4}
                className="mt-1.5"
              />
            </div>
          </section>
        </SheetBody>
        <SheetFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange?.(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-primary-600 text-white hover:bg-primary-700"
            onClick={handleSave}
          >
            {isEdit ? "Save Changes" : "Save Lead"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
