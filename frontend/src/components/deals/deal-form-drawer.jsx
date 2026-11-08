"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

import {
  fromApiDeal,
  persistDealMeta,
  toApiDeal,
} from "@/components/deals/deal-api";
import {
  DEAL_CURRENCIES,
  DEAL_LEAD_SOURCES,
  DEAL_PRIORITIES,
  probabilityOptionsFromApi,
  DEFAULT_PIPELINE_NAME,
} from "@/components/deals/deals-data";
import { fromApiCompany } from "@/components/companies/company-api";
import { fromApiContact } from "@/components/contacts/contact-api";
import { fullName } from "@/components/contacts/contacts-data";
import { FormFieldDropdown } from "@/components/shared/form-field-dropdown";
import { SearchEntityCombobox } from "@/components/shared/search-entity-combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-time-picker";
import { crmControl } from "@/lib/crm-typography";
import { apiFetch } from "@/lib/api";

const EMPTY = {
  name: "",
  description: "",
  amount: "",
  currency: "",
  pipelineName: DEFAULT_PIPELINE_NAME,
  stageId: "",
  probability: "",
  priority: "",
  companyId: "",
  contactId: "",
  additionalContactIds: [],
  ownerId: "",
  leadSource: "",
  expectedCloseDate: "",
  nextStep: "",
  notes: "",
  tags: "",
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
    <Label htmlFor={htmlFor} className="gap-1 text-[13px]">
      {required ? (
        <span className="text-error-text" aria-hidden="true">
          *
        </span>
      ) : null}
      {children}
    </Label>
  );
}

function SectionTitle({ children }) {
  return (
    <p className="text-[11px] font-semibold tracking-[0.08em] text-neutral-500 uppercase">
      {children}
    </p>
  );
}

function errorFor(field, values) {
  if (field === "name" && !String(values.name || "").trim()) {
    return "Deal name is required";
  }
  if (field === "amount") {
    if (values.amount === "" || Number.isNaN(Number(values.amount))) {
      return "Deal value is required";
    }
    if (Number(values.amount) < 0) {
      return "Deal value cannot be negative";
    }
  }
  if (field === "currency" && !values.currency) {
    return "Currency is required";
  }
  if (field === "pipelineName" && !String(values.pipelineName || "").trim()) {
    return "Pipeline is required";
  }
  if (field === "stageId" && !values.stageId) {
    return "Stage is required";
  }
  if (field === "ownerId" && !values.ownerId) {
    return "Deal owner is required";
  }
  if (field === "probability" && values.probability !== "") {
    const value = Number(values.probability);
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      return "Probability must be between 0 and 100";
    }
  }
  return undefined;
}

function closeDateToPicker(value) {
  if (!value) return null;
  const iso = String(value).slice(0, 10);
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

function pickerToCloseDate(date) {
  if (!date) return "";
  return format(date, "yyyy-MM-dd");
}

function listOptions(items, mapLabel) {
  return (items || []).map((item) => {
    if (typeof item === "object" && item !== null) {
      return {
        value: String(item.value ?? item.id),
        label: item.label ?? mapLabel?.(item) ?? String(item.value),
        searchText: item.searchText,
      };
    }
    return { value: String(item), label: String(item) };
  });
}

export function DealFormDrawer({
  open,
  onOpenChange,
  initialDeal,
  onSaved,
  stages = [],
  companies = [],
  contacts = [],
  owners = [],
  formInstanceKey = 0,
  onCompanyCreated,
  onContactCreated,
}) {
  const isEdit = Boolean(initialDeal?.id);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [probabilityRows, setProbabilityRows] = useState([]);
  const [loadingProbability, setLoadingProbability] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function loadProbabilityOptions() {
      setLoadingProbability(true);
      try {
        const response = await apiFetch(
          "/api/deal-probability-options?order_by=position&limit=100"
        );
        if (!cancelled) {
          setProbabilityRows(response.data || []);
        }
      } catch {
        if (!cancelled) setProbabilityRows([]);
      } finally {
        if (!cancelled) setLoadingProbability(false);
      }
    }
    loadProbabilityOptions();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const stageOptions = useMemo(
    () =>
      (stages || []).map((s) => ({
        value: String(s.id),
        label: s.name,
        searchText: s.name,
      })),
    [stages]
  );

  const probabilityOptions = useMemo(
    () => probabilityOptionsFromApi(probabilityRows),
    [probabilityRows]
  );

  const companyItems = useMemo(
    () =>
      (companies || []).map((c) => ({
        id: c.id,
        label: c.name,
        searchText: `${c.name} ${c.domain || ""} ${c.website || ""}`.trim(),
      })),
    [companies]
  );

  const contactItems = useMemo(() => {
    const companyId = form.companyId;
    const rows = companyId
      ? contacts.filter(
          (c) => String(c.companyId || c.company_id) === String(companyId)
        )
      : contacts;
    return rows.map((c) => ({
      id: c.id,
      label: fullName(c),
      searchText: `${fullName(c)} ${c.email || ""}`.trim(),
    }));
  }, [contacts, form.companyId]);

  const ownerOptions = useMemo(
    () =>
      owners.map((o) => ({
        value: String(o.id),
        label: o.name || o.label || o.email || "Member",
      })),
    [owners]
  );

  useEffect(() => {
    if (!open) return;
    if (initialDeal?.id) {
      setForm({
        name: initialDeal.name || "",
        description: initialDeal.description || "",
        amount: initialDeal.amount != null ? String(initialDeal.amount) : "",
        currency: initialDeal.currency || "INR",
        pipelineName: initialDeal.pipelineName || DEFAULT_PIPELINE_NAME,
        stageId: initialDeal.stageId || "",
        probability:
          initialDeal.probability !== "" && initialDeal.probability != null
            ? String(initialDeal.probability)
            : "",
        priority: initialDeal.priority || "",
        companyId: initialDeal.companyId || "",
        contactId: initialDeal.contactId || "",
        additionalContactIds: initialDeal.additionalContactIds || [],
        ownerId: initialDeal.ownerId || "",
        leadSource: initialDeal.leadSource || "",
        expectedCloseDate: initialDeal.expectedCloseDate || "",
        nextStep: initialDeal.nextStep || "",
        notes: initialDeal.notes || "",
        tags: (initialDeal.tags || []).join(", "),
      });
    } else {
      setForm({ ...EMPTY });
    }
    setErrors({});
  }, [open, initialDeal?.id, formInstanceKey]);

  function update(key, value) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "companyId" && prev.contactId) {
        const stillLinked = contacts.some(
          (c) =>
            String(c.id) === String(prev.contactId) &&
            (!value ||
              String(c.companyId || c.company_id) === String(value))
        );
        if (!stillLinked) next.contactId = "";
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function createCompanyByName(name) {
    const response = await apiFetch("/api/companies", {
      method: "POST",
      body: JSON.stringify({
        name,
        owner_id: form.ownerId || null,
      }),
    });
    const saved = fromApiCompany(response.data);
    onCompanyCreated?.(saved);
    toast.success(`Added ${name}`);
    return { id: saved.id, label: saved.name };
  }

  function parseContactName(name) {
    const parts = String(name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!parts.length) return null;
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: "—" };
    }
    return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
  }

  async function createContactByName(name) {
    const parsed = parseContactName(name);
    if (!parsed) return null;
    const response = await apiFetch("/api/contacts", {
      method: "POST",
      body: JSON.stringify({
        first_name: parsed.firstName,
        last_name: parsed.lastName,
        company_id: form.companyId || null,
        owner_id: form.ownerId || null,
      }),
    });
    const saved = fromApiContact(response.data);
    onContactCreated?.(saved);
    const label = fullName(saved);
    toast.success(`Added ${label}`);
    return { id: saved.id, label };
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
      "amount",
      "currency",
      "pipelineName",
      "stageId",
      "ownerId",
    ];
    const next = {};
    for (const field of fields) {
      const message = errorFor(field, form);
      if (message) next[field] = message;
    }
    const probabilityError = errorFor("probability", form);
    if (probabilityError) next.probability = probabilityError;
    setErrors(next);
    if (Object.keys(next).length) {
      const first = Object.keys(next)[0];
      requestAnimationFrame(() => {
        const node = document.getElementById(
          first === "name"
            ? "deal-name"
            : first === "amount"
              ? "deal-amount"
              : first === "probability"
                ? "deal-probability"
                : null
        );
        node?.focus();
      });
    }
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validateAll()) return;

    setSaving(true);
    try {
      const tags = String(form.tags || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const body = toApiDeal({
        name: form.name,
        amount: form.amount,
        currency: form.currency,
        stageId: form.stageId,
        companyId: form.companyId,
        contactId: form.contactId,
        ownerId: form.ownerId,
        expectedCloseDate: form.expectedCloseDate,
        status: "open",
      });

      const response = isEdit
        ? await apiFetch(`/api/deals/${initialDeal.id}`, {
            method: "PATCH",
            body: JSON.stringify(body),
          })
        : await apiFetch("/api/deals", {
            method: "POST",
            body: JSON.stringify(body),
          });

      const saved = fromApiDeal(response.data);
      const merged = {
        ...saved,
        description: form.description.trim(),
        priority: form.priority,
        leadSource: form.leadSource,
        nextStep: form.nextStep.trim(),
        notes: form.notes.trim(),
        tags,
        additionalContactIds: form.additionalContactIds,
        pipelineName: form.pipelineName.trim(),
        probability: form.probability,
      };
      persistDealMeta(merged);
      toast.success(isEdit ? "Deal updated" : "Deal created");
      onSaved?.(merged);
      onOpenChange?.(false);
    } catch (error) {
      toast.error(error.message || "Could not save deal");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title={isEdit ? "Edit Deal" : "Create Deal"}
        description="Add an opportunity and associate it with your pipeline."
        onClose={() => onOpenChange?.(false)}
        maxWidth={480}
      >
        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={handleSubmit}
          noValidate
        >
          <SheetBody className="space-y-6 text-[13px]">
            <div className="space-y-3">
              <SectionTitle>Deal information</SectionTitle>
              <div>
                <FieldLabel htmlFor="deal-name" required>
                  Deal name
                </FieldLabel>
                <Input
                  id="deal-name"
                  className="mt-1.5 text-[13px]"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  onBlur={() => handleBlur("name")}
                  placeholder="Enterprise expansion — Acme"
                  aria-invalid={Boolean(errors.name)}
                />
                <FieldError message={errors.name} />
              </div>
              <div>
                <FieldLabel htmlFor="deal-description">Deal description</FieldLabel>
                <Textarea
                  id="deal-description"
                  className="mt-1.5 min-h-[72px] text-[13px]"
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="Context, scope, or opportunity notes"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="deal-amount" required>
                    Deal value
                  </FieldLabel>
                  <Input
                    id="deal-amount"
                    type="number"
                    min="0"
                    step="1"
                    className="mt-1.5 text-[13px]"
                    value={form.amount}
                    onChange={(e) => update("amount", e.target.value)}
                    onBlur={() => handleBlur("amount")}
                    placeholder="250000"
                    aria-invalid={Boolean(errors.amount)}
                  />
                  <FieldError message={errors.amount} />
                </div>
                <div>
                  <FieldLabel required>Currency</FieldLabel>
                  <FormFieldDropdown
                    value={form.currency}
                    onChange={(v) => update("currency", v)}
                    onBlur={() => handleBlur("currency")}
                    options={listOptions(DEAL_CURRENCIES)}
                    placeholder="Select currency"
                    triggerClassName="mt-1.5 text-[13px]"
                    invalid={Boolean(errors.currency)}
                  />
                  <FieldError message={errors.currency} />
                </div>
              </div>
              <div>
                <FieldLabel required>Pipeline</FieldLabel>
                <FormFieldDropdown
                  value={form.pipelineName}
                  onChange={(v) => update("pipelineName", v)}
                  onBlur={() => handleBlur("pipelineName")}
                  options={[{ value: DEFAULT_PIPELINE_NAME, label: DEFAULT_PIPELINE_NAME }]}
                  placeholder="Select pipeline"
                  triggerClassName="mt-1.5 text-[13px]"
                  invalid={Boolean(errors.pipelineName)}
                />
                <FieldError message={errors.pipelineName} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <FieldLabel required>Deal stage</FieldLabel>
                  <FormFieldDropdown
                    value={form.stageId}
                    onChange={(v) => update("stageId", v)}
                    onBlur={() => handleBlur("stageId")}
                    options={stageOptions}
                    searchable
                    searchPlaceholder="Search stages…"
                    placeholder="Select stage"
                    triggerClassName="mt-1.5 text-[13px]"
                    invalid={Boolean(errors.stageId)}
                  />
                  <FieldError message={errors.stageId} />
                </div>
                <div>
                  <FieldLabel htmlFor="deal-probability">Probability</FieldLabel>
                  <FormFieldDropdown
                    id="deal-probability"
                    value={form.probability || ""}
                    onChange={(v) => update("probability", v ?? "")}
                    onBlur={() => handleBlur("probability")}
                    options={probabilityOptions}
                    placeholder={
                      loadingProbability
                        ? "Loading…"
                        : probabilityOptions.length
                          ? "Select probability"
                          : "No options in database"
                    }
                    disabled={loadingProbability || !probabilityOptions.length}
                    triggerClassName="mt-1.5 text-[13px]"
                    invalid={Boolean(errors.probability)}
                  />
                  <FieldError message={errors.probability} />
                </div>
              </div>
              <div>
                <FieldLabel>Priority</FieldLabel>
                <FormFieldDropdown
                  value={form.priority}
                  onChange={(v) => update("priority", v)}
                  options={listOptions(DEAL_PRIORITIES)}
                  placeholder="Select priority"
                  triggerClassName="mt-1.5 text-[13px]"
                />
              </div>
            </div>

            <div className="space-y-3">
              <SectionTitle>Company &amp; contact</SectionTitle>
              <div>
                <Label className="text-[13px]">Company</Label>
                <SearchEntityCombobox
                  value={form.companyId}
                  onChange={(id) => update("companyId", id)}
                  items={companyItems}
                  placeholder="Search or add a company"
                  searchPlaceholder="Type a company name"
                  onCreate={createCompanyByName}
                />
              </div>
              <div>
                <Label className="text-[13px]">Primary contact</Label>
                <SearchEntityCombobox
                  value={form.contactId}
                  onChange={(id) => update("contactId", id)}
                  items={contactItems}
                  placeholder="Search or add a contact"
                  searchPlaceholder="Type a contact name"
                  emptyLabel="No contacts found"
                  onCreate={createContactByName}
                />
              </div>
            </div>

            <div className="space-y-3">
              <SectionTitle>Sales information</SectionTitle>
              <div>
                <FieldLabel required>Deal owner</FieldLabel>
                <FormFieldDropdown
                  value={form.ownerId || ""}
                  onChange={(v) => update("ownerId", v ?? "")}
                  onBlur={() => handleBlur("ownerId")}
                  options={ownerOptions}
                  searchable
                  searchPlaceholder="Search team…"
                  placeholder="Select owner"
                  triggerClassName="mt-1.5 text-[13px]"
                  invalid={Boolean(errors.ownerId)}
                />
                <FieldError message={errors.ownerId} />
              </div>
              <div>
                <FieldLabel>Lead source</FieldLabel>
                <FormFieldDropdown
                  value={form.leadSource}
                  onChange={(v) => update("leadSource", v)}
                  options={listOptions(DEAL_LEAD_SOURCES)}
                  placeholder="Select lead source"
                  triggerClassName="mt-1.5 text-[13px]"
                />
              </div>
              <div>
                <FieldLabel htmlFor="deal-close">Expected close date</FieldLabel>
                <DatePicker
                  id="deal-close"
                  value={closeDateToPicker(form.expectedCloseDate)}
                  onChange={(date) =>
                    update("expectedCloseDate", pickerToCloseDate(date))
                  }
                  placeholder="Select expected close date"
                  className={crmControl.pickerMt}
                />
              </div>
              <div>
                <FieldLabel htmlFor="deal-next">Next step</FieldLabel>
                <Input
                  id="deal-next"
                  className="mt-1.5 text-[13px]"
                  value={form.nextStep}
                  onChange={(e) => update("nextStep", e.target.value)}
                  placeholder="Schedule pricing review"
                />
              </div>
            </div>

            <div className="space-y-3">
              <SectionTitle>Additional information</SectionTitle>
              <div>
                <FieldLabel htmlFor="deal-notes">Notes</FieldLabel>
                <Textarea
                  id="deal-notes"
                  className="mt-1.5 min-h-[80px] text-[13px]"
                  value={form.notes}
                  onChange={(e) => update("notes", e.target.value)}
                  placeholder="Meeting notes, blockers, competitive intel…"
                />
              </div>
              <div>
                <FieldLabel htmlFor="deal-tags">Tags</FieldLabel>
                <Input
                  id="deal-tags"
                  className="mt-1.5 text-[13px]"
                  value={form.tags}
                  onChange={(e) => update("tags", e.target.value)}
                  placeholder="enterprise, q4"
                />
              </div>
            </div>
          </SheetBody>
          <SheetFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : isEdit ? "Save deal" : "Create deal"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
