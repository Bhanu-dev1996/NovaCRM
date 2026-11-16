"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, TriangleAlert, X } from "lucide-react";
import { toast } from "sonner";

import {
  createCampaignApi,
  fetchCampaign,
  fetchMarketingState,
  previewSegmentApi,
  updateCampaignApi,
} from "@/components/marketing/marketing-api";
import { CAMPAIGN_TYPES, MKT_VARIABLES } from "@/components/marketing/marketing-data";
import { FieldError } from "@/components/crm/crm-shared";
import { FormFieldDropdown } from "@/components/shared/form-field-dropdown";
import { CommunicationsMessageEditor } from "@/components/communications/communications-message-editor";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { fromApiContact, mapMemberToOwner } from "@/components/contacts/contact-api";
import { fullName } from "@/components/contacts/contacts-data";
import { crmType } from "@/lib/crm-typography";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Details" },
  { id: 2, label: "Audience" },
  { id: 3, label: "Content" },
  { id: 4, label: "Schedule & review" },
];

const EMPTY = {
  name: "",
  objective: "",
  campaignType: "email",
  description: "",
  ownerId: "",
  segmentId: "",
  audience: {
    manualContactIds: [],
    excludeSuppressed: true,
  },
  content: {
    subject: "",
    previewText: "",
    senderName: "NovaCRM Marketing",
    senderEmail: "marketing@novacrm.app",
    body: "",
    templateId: "",
  },
  schedule: {
    sendDate: "",
    sendTime: "10:00",
    timezone: "America/New_York",
  },
  estimatedRecipients: 0,
};

function wizardStep1ErrorFor(field, values) {
  if (field === "name") {
    if (!String(values.name || "").trim()) return "Campaign name is required";
  }
  if (field === "objective") {
    if (!String(values.objective || "").trim()) return "Campaign objective is required";
  }
  if (field === "campaignType") {
    const type = values.campaignType;
    if (!type || !CAMPAIGN_TYPES.some((t) => t.id === type)) {
      return "Select a campaign type";
    }
  }
  return undefined;
}

function collectStep1Errors(values) {
  const errors = {};
  for (const field of ["name", "objective", "campaignType"]) {
    const message = wizardStep1ErrorFor(field, values);
    if (message) errors[field] = message;
  }
  return errors;
}

function isStep1Valid(values) {
  return Object.keys(collectStep1Errors(values)).length === 0;
}

function CampaignWizardStepper({ steps, currentStep, step1Complete, onStepChange }) {
  return (
    <nav aria-label="Campaign wizard progress" className="w-full">
      <p className="mb-3 text-[12px] text-muted-foreground sm:hidden">
        Step {currentStep} of {steps.length}:{" "}
        <span className="font-medium text-foreground">
          {steps.find((s) => s.id === currentStep)?.label}
        </span>
      </p>
      <ol className="flex w-full min-w-0 items-center">
        {steps.map((s, index) => {
          const completed = currentStep > s.id;
          const current = currentStep === s.id;
          const forwardBlocked =
            s.id > currentStep && currentStep === 1 && !step1Complete;
          return (
            <Fragment key={s.id}>
              <li className="min-w-0 shrink-0">
                <button
                  type="button"
                  onClick={() => !forwardBlocked && onStepChange(s.id)}
                  disabled={forwardBlocked}
                  className={cn(
                    "flex max-w-[9.5rem] items-center gap-2 rounded-lg px-1 py-0.5 text-left outline-none transition-colors",
                    !forwardBlocked && "hover:bg-neutral-50 dark:hover:bg-neutral-900/50",
                    "focus-visible:ring-2 focus-visible:ring-primary-500/40",
                    forwardBlocked && "cursor-not-allowed opacity-50"
                  )}
                  aria-current={current ? "step" : undefined}
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold transition-colors",
                      (completed || current) && "bg-primary-600 text-white",
                      current &&
                        "ring-4 ring-primary-100 dark:ring-primary-950/80",
                      !completed &&
                        !current &&
                        "border border-neutral-200 bg-white text-muted-foreground dark:border-neutral-700 dark:bg-neutral-950"
                    )}
                  >
                    {completed ? (
                      <Check className="size-4" aria-hidden />
                    ) : (
                      s.id
                    )}
                  </span>
                  <span
                    className={cn(
                      "hidden truncate text-[12px] font-medium sm:inline",
                      current ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {s.label}
                  </span>
                </button>
              </li>
              {index < steps.length - 1 ? (
                <li
                  aria-hidden
                  className={cn(
                    "mx-1 h-0.5 min-w-4 flex-1 rounded-full",
                    currentStep > s.id
                      ? "bg-primary-600"
                      : "bg-neutral-200 dark:bg-neutral-800"
                  )}
                />
              ) : null}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

function WizardField({ label, children, required = false, htmlFor, error }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className={cn("gap-1", crmType.fieldLabel)}>
        {required ? (
          <span className="text-error-text" aria-hidden="true">
            *
          </span>
        ) : null}
        {label}
        {required ? <span className="sr-only">(required)</span> : null}
      </Label>
      {children}
      <FieldError message={error} />
    </div>
  );
}

export function MarketingCampaignWizardBody({
  editId = null,
  templateIdParam = null,
  segmentIdParam = null,
  layout = "page",
  onClose,
  onSaved,
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(EMPTY);
  const [segments, setSegments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [owners, setOwners] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [manualContactPickerKey, setManualContactPickerKey] = useState(0);
  const [stepErrors, setStepErrors] = useState({});

  const step1Complete = useMemo(() => isStep1Valid(form), [form]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [mkt, members, contactRes] = await Promise.all([
          fetchMarketingState(),
          apiFetch("/api/workspace/members"),
          apiFetch("/api/contacts?limit=200"),
        ]);
        if (cancelled) return;
        setSegments(mkt.segments || []);
        setTemplates(mkt.templates || []);
        setOwners((members.data || []).map(mapMemberToOwner));
        setContacts((contactRes.data || []).map((row) => fromApiContact(row)));
        if (editId) {
          const camp = await fetchCampaign(editId);
          if (!cancelled) {
            const audience = { ...EMPTY.audience, ...(camp.audience || {}) };
            audience.manualContactIds = (audience.manualContactIds || []).map(String);
            setForm({
              ...EMPTY,
              ...camp,
              segmentId: camp.segmentId ? String(camp.segmentId) : "",
              ownerId: camp.ownerId ? String(camp.ownerId) : "",
              audience,
              content: {
                ...EMPTY.content,
                ...(camp.content || {}),
                templateId: camp.content?.templateId
                  ? String(camp.content.templateId)
                  : "",
              },
              schedule: { ...EMPTY.schedule, ...(camp.schedule || {}) },
            });
          }
        }
      } catch (e) {
        toast.error(e.message || "Could not load wizard");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [editId]);

  useEffect(() => {
    if (editId || !templateIdParam || !templates.length) return;
    const tpl = templates.find((t) => String(t.id) === String(templateIdParam));
    if (!tpl) return;
    setForm((f) => ({
      ...f,
      content: {
        ...f.content,
        templateId: tpl.id,
        subject: tpl.subject || "",
        body: tpl.body || "",
      },
    }));
    setStep(3);
  }, [editId, templateIdParam, templates]);

  useEffect(() => {
    if (editId || !segmentIdParam || !segments.length) return;
  /* only pre-select audience; skip if template flow already moved to step 3 */
    const segmentId = String(segmentIdParam);
    const exists = segments.some((s) => String(s.id) === segmentId);
    if (!exists) return;
    setForm((f) => ({
      ...f,
      segmentId,
    }));
    if (!templateIdParam) setStep(2);
  }, [editId, segmentIdParam, segments, templateIdParam]);

  const selectedSegment = useMemo(
    () =>
      segments.find((s) => String(s.id) === String(form.segmentId || "")),
    [segments, form.segmentId]
  );

  const segmentOptions = useMemo(
    () => [
      { value: "", label: "No segment", searchText: "none unassigned" },
      ...segments.map((s) => ({
        value: String(s.id),
        label: `${s.name} (${(s.contactCount || 0).toLocaleString()})`,
        searchText: `${s.name} ${s.description || ""}`.trim(),
      })),
    ],
    [segments]
  );

  const manualContactIds = useMemo(
    () => (form.audience?.manualContactIds || []).map(String),
    [form.audience?.manualContactIds]
  );

  const contactById = useMemo(() => {
    const map = new Map();
    contacts.forEach((c) => map.set(String(c.id), c));
    return map;
  }, [contacts]);

  const addableContactOptions = useMemo(() => {
    const selected = new Set(manualContactIds);
    return contacts
      .filter((c) => !selected.has(String(c.id)))
      .map((c) => ({
        value: String(c.id),
        label: fullName(c) || c.email || "Contact",
        searchText: `${fullName(c)} ${c.email || ""} ${c.phone || ""}`.trim(),
      }));
  }, [contacts, manualContactIds]);

  function addManualContact(contactId) {
    const id = String(contactId || "");
    if (!id) return;
    setForm((f) => {
      const current = (f.audience?.manualContactIds || []).map(String);
      if (current.includes(id)) return f;
      return {
        ...f,
        audience: {
          ...f.audience,
          manualContactIds: [...current, id],
        },
      };
    });
    setManualContactPickerKey((k) => k + 1);
  }

  function removeManualContact(contactId) {
    const id = String(contactId);
    setForm((f) => ({
      ...f,
      audience: {
        ...f.audience,
        manualContactIds: (f.audience?.manualContactIds || [])
          .map(String)
          .filter((x) => x !== id),
      },
    }));
  }

  const ownerOptions = useMemo(
    () => [
      { value: "", label: "Unassigned", searchText: "unassigned none" },
      ...owners.map((o) => ({
        value: String(o.id),
        label: o.name || "Member",
        searchText: `${o.name || ""} ${o.email || ""}`.trim(),
      })),
    ],
    [owners]
  );

  function handleStep1Blur(field, snapshot = form) {
    const message = wizardStep1ErrorFor(field, snapshot);
    setStepErrors((prev) => {
      if (!message) {
        if (prev[field] === undefined) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      }
      return { ...prev, [field]: message };
    });
  }

  function validateStep(stepNum, snapshot = form) {
    if (stepNum === 1) return isStep1Valid(snapshot);
    return true;
  }

  function applyStep1Validation(snapshot = form) {
    const nextErrors = collectStep1Errors(snapshot);
    setStepErrors(nextErrors);
    const valid = Object.keys(nextErrors).length === 0;
    if (!valid) {
      toast.error("Complete required fields on Details before continuing.");
      requestAnimationFrame(() => {
        const firstKey = Object.keys(nextErrors)[0];
        if (firstKey === "name") document.getElementById("campaign-name")?.focus();
      });
    }
    return valid;
  }

  function trySetStep(target) {
    if (target < 1 || target > 4) return;
    if (target > step) {
      for (let s = step; s < target; s++) {
        if (!validateStep(s)) {
          if (s === 1) applyStep1Validation();
          return;
        }
      }
    }
    setStep(target);
  }

  async function runPreview() {
    try {
      const manualIds = manualContactIds;
      const useManualOnly = manualIds.length > 0 && !form.segmentId;
      const data = await previewSegmentApi({
        segmentType: useManualOnly
          ? "static"
          : selectedSegment?.segmentType || "dynamic",
        filters: useManualOnly ? { logic: "and", conditions: [] } : selectedSegment?.filters,
        contactIds: manualIds.length > 0 ? manualIds : selectedSegment?.contactIds,
      });
      setPreview(data);
      setForm((f) => ({ ...f, estimatedRecipients: data.count }));
    } catch (e) {
      toast.error(e.message || "Preview failed");
    }
  }

  useEffect(() => {
    if (step === 2 && form.segmentId) runPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, form.segmentId]);

  function patch(patch) {
    setForm((f) => ({ ...f, ...patch }));
  }

  function applyTemplate(tplId) {
    const tpl = templates.find((t) => String(t.id) === String(tplId));
    if (!tpl) return;
    patch({
      content: {
        ...form.content,
        templateId: tplId,
        subject: tpl.subject || form.content.subject,
        body: tpl.body || form.content.body,
      },
    });
  }

  async function save(status) {
    if (!isStep1Valid(form)) {
      applyStep1Validation();
      setStep(1);
      return;
    }

    setSaving(true);
    const body = {
      name: form.name,
      objective: form.objective,
      campaignType: form.campaignType,
      description: form.description,
      ownerId: form.ownerId || null,
      segmentId: form.segmentId || null,
      audience: form.audience,
      content: form.content,
      schedule: form.schedule,
      estimatedRecipients: form.estimatedRecipients,
      status,
      scheduledAt:
        form.schedule.sendDate && form.schedule.sendTime
          ? new Date(`${form.schedule.sendDate}T${form.schedule.sendTime}:00`).toISOString()
          : null,
    };
    try {
      const row = editId
        ? await updateCampaignApi(editId, body)
        : await createCampaignApi(body);
      toast.success(
        status === "ready_for_review" ? "Marked ready for review" : "Campaign saved"
      );
      if (layout === "sheet") {
        onSaved?.(row.id);
        onClose?.();
      } else {
        router.push(`/marketing/campaigns/${row.id}`);
      }
    } catch (e) {
      toast.error(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const shellClass =
    layout === "sheet"
      ? "flex min-h-0 flex-1 flex-col"
      : "mx-auto flex w-full min-w-0 max-w-[1680px] flex-col gap-4 pb-6";

  return (
    <div className={shellClass}>
      {layout === "page" ? (
        <header>
          <PageBreadcrumb
            items={[
              { href: "/", label: "Workspace" },
              { href: "/marketing", label: "Marketing" },
              { href: "/marketing/campaigns", label: "Campaigns" },
              { label: editId ? "Edit" : "Create" },
            ]}
            className="mb-2"
          />
          <h1 className="text-[26px] font-bold tracking-[-0.03em] text-neutral-900 dark:text-neutral-50">
            {editId ? "Edit campaign" : "Create campaign"}
          </h1>
          <p className={cn("mt-1 max-w-[62ch] text-pretty", crmType.pageDescription)}>
            Phase 1: save drafts or mark ready for review. Sending is disabled until a provider is
            connected.
          </p>
        </header>
      ) : null}

      <Card
        className={cn(
          "gap-0 overflow-hidden rounded-2xl border-neutral-200/80 py-0 shadow-sm ring-0 dark:border-neutral-800",
          layout === "sheet" && "flex min-h-0 flex-1 flex-col border-0 shadow-none ring-0"
        )}
      >
        <div className="border-b border-neutral-100 px-4 py-4 dark:border-neutral-800 sm:px-5">
          <CampaignWizardStepper
            steps={STEPS}
            currentStep={step}
            step1Complete={step1Complete}
            onStepChange={trySetStep}
          />
        </div>

        <CardContent
          className={cn(
            "space-y-4 p-4 sm:p-5 lg:p-6",
            layout === "sheet" && "min-h-0 flex-1 overflow-y-auto px-0 sm:px-1"
          )}
        >
          {step === 1 ? (
            <div className="mx-auto w-full max-w-none space-y-4">
              <WizardField
                label="Campaign name"
                htmlFor="campaign-name"
                required
                error={stepErrors.name}
              >
                <Input
                  id="campaign-name"
                  value={form.name}
                  onChange={(e) => patch({ name: e.target.value })}
                  onBlur={() => handleStep1Blur("name")}
                  aria-invalid={Boolean(stepErrors.name)}
                  placeholder="e.g. Spring product launch"
                  className="h-9 w-full rounded-lg"
                />
              </WizardField>
              <WizardField
                label="Campaign objective"
                required
                error={stepErrors.objective}
              >
                <Textarea
                  value={form.objective}
                  onChange={(e) => patch({ objective: e.target.value })}
                  onBlur={() => handleStep1Blur("objective")}
                  aria-invalid={Boolean(stepErrors.objective)}
                  placeholder="What should this campaign achieve?"
                  className="min-h-[88px] w-full rounded-lg"
                />
              </WizardField>
              <div className="grid gap-4 lg:grid-cols-2">
                <WizardField label="Campaign type" required error={stepErrors.campaignType}>
                  <Select
                    value={form.campaignType}
                    onValueChange={(v) => {
                      const next = { ...form, campaignType: v };
                      patch({ campaignType: v });
                      handleStep1Blur("campaignType", next);
                    }}
                  >
                    <SelectTrigger
                      className="h-9 w-full rounded-lg"
                      aria-invalid={Boolean(stepErrors.campaignType)}
                    >
                      <SelectValue placeholder="Select campaign type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CAMPAIGN_TYPES.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </WizardField>
                <WizardField label="Owner">
                  <FormFieldDropdown
                    value={form.ownerId || ""}
                    onChange={(v) => patch({ ownerId: v || "" })}
                    options={ownerOptions}
                    searchable
                    searchPlaceholder="Search team…"
                    placeholder="Optional — select owner"
                    emptyLabel="No team members found"
                    triggerClassName="mt-0 h-9 rounded-lg text-[13px]"
                  />
                </WizardField>
              </div>
              <WizardField label="Description">
                <Textarea
                  value={form.description}
                  onChange={(e) => patch({ description: e.target.value })}
                  placeholder="Optional context for collaborators…"
                  className="min-h-[72px] w-full rounded-lg"
                />
              </WizardField>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="mx-auto w-full max-w-none space-y-4">
              <WizardField label="Saved segment">
                <FormFieldDropdown
                  value={form.segmentId ? String(form.segmentId) : ""}
                  onChange={(v) => patch({ segmentId: v ? String(v) : "" })}
                  options={segmentOptions}
                  searchable
                  searchPlaceholder="Search segments…"
                  placeholder="Select segment"
                  emptyLabel="No segments found"
                  triggerClassName="mt-0 h-9 w-full rounded-lg text-[13px]"
                />
              </WizardField>
              <WizardField label="Manual contacts (optional)">
                {manualContactIds.length > 0 ? (
                  <ul className="mb-2 flex flex-wrap gap-1.5">
                    {manualContactIds.map((id) => {
                      const contact = contactById.get(id);
                      const label = contact
                        ? fullName(contact) || contact.email
                        : "Contact";
                      return (
                        <li key={id}>
                          <Badge
                            variant="secondary"
                            className="h-7 gap-1 border-0 pr-1 pl-2 text-[11px] font-medium"
                          >
                            <span className="max-w-[12rem] truncate">{label}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="size-6 shrink-0 rounded-md"
                              aria-label={`Remove ${label}`}
                              onClick={() => removeManualContact(id)}
                            >
                              <X className="size-3" />
                            </Button>
                          </Badge>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
                <FormFieldDropdown
                  key={manualContactPickerKey}
                  value=""
                  onChange={addManualContact}
                  options={addableContactOptions}
                  searchable
                  searchPlaceholder="Search contacts…"
                  placeholder={
                    addableContactOptions.length
                      ? "Add contact…"
                      : contacts.length
                        ? "All listed contacts added"
                        : "No contacts in workspace"
                  }
                  disabled={!addableContactOptions.length}
                  emptyLabel="No contacts match your search"
                  triggerClassName="mt-0 h-9 w-full rounded-lg text-[13px]"
                />
              </WizardField>
              <Button type="button" variant="outline" size="sm" className="h-8 rounded-lg" onClick={runPreview}>
                Preview audience count
              </Button>
              {preview ? (
                <div className="space-y-2 rounded-xl border border-neutral-200/80 p-3 text-[12px] dark:border-neutral-800">
                  <p className="font-semibold">
                    Estimated recipients: {preview.count.toLocaleString()}
                  </p>
                  {preview.consentMissingWarning ? (
                    <p className="flex gap-2 text-amber-800 dark:text-amber-200">
                      <TriangleAlert className="size-4 shrink-0" />
                      Consent and marketing eligibility are not fully tracked in Phase 1. Review
                      the audience before sending once delivery is enabled.
                    </p>
                  ) : null}
                  {preview.preview?.length ? (
                    <ul className="mt-2 space-y-1 text-muted-foreground">
                      {preview.preview.slice(0, 5).map((r) => (
                        <li key={r.id}>
                          {r.name} · {r.email || "no email"}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {step === 3 ? (
            <div className="mx-auto w-full max-w-none space-y-4">
              <WizardField label="Template">
                <FormFieldDropdown
                  value={form.content.templateId ? String(form.content.templateId) : ""}
                  onChange={(v) => {
                    if (!v) {
                      patch({
                        content: { ...form.content, templateId: "" },
                      });
                      return;
                    }
                    applyTemplate(String(v));
                  }}
                  options={[
                    { value: "", label: "None", searchText: "none" },
                    ...templates.map((t) => ({
                      value: String(t.id),
                      label: t.name,
                      searchText: `${t.name} ${t.subject || ""}`.trim(),
                    })),
                  ]}
                  searchable
                  searchPlaceholder="Search templates…"
                  placeholder="Optional template"
                  emptyLabel="No templates found"
                  triggerClassName="mt-0 h-9 w-full rounded-lg text-[13px]"
                />
              </WizardField>
              <div className="grid gap-4 lg:grid-cols-2">
                <WizardField label="Email subject">
                  <Input
                    value={form.content.subject}
                    onChange={(e) =>
                      patch({ content: { ...form.content, subject: e.target.value } })
                    }
                    placeholder="Subject line recipients will see"
                    className="h-9 w-full rounded-lg"
                  />
                </WizardField>
                <WizardField label="Preview text">
                  <Input
                    value={form.content.previewText}
                    onChange={(e) =>
                      patch({ content: { ...form.content, previewText: e.target.value } })
                    }
                    placeholder="Inbox preview snippet"
                    className="h-9 w-full rounded-lg"
                  />
                </WizardField>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <WizardField label="Sender name">
                  <Input
                    value={form.content.senderName}
                    onChange={(e) =>
                      patch({ content: { ...form.content, senderName: e.target.value } })
                    }
                    className="h-9 w-full rounded-lg"
                  />
                </WizardField>
                <WizardField label="Sender email">
                  <Input
                    value={form.content.senderEmail}
                    onChange={(e) =>
                      patch({ content: { ...form.content, senderEmail: e.target.value } })
                    }
                    className="h-9 w-full rounded-lg"
                  />
                </WizardField>
              </div>
              <div className="flex flex-wrap gap-1">
                {MKT_VARIABLES.map((v) => (
                  <Badge key={v.token} variant="outline" className="text-[10px]">
                    {v.token}
                  </Badge>
                ))}
              </div>
              <CommunicationsMessageEditor
                value={form.content.body}
                onChange={(body) => patch({ content: { ...form.content, body } })}
                minHeight={160}
                className="w-full max-w-none"
              />
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-neutral-200/80 p-4 text-[12px] dark:border-neutral-800">
                  <p className="mb-2 font-semibold">Desktop preview</p>
                  <p className="font-medium">{form.content.subject || "Subject line"}</p>
                  <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                    {form.content.body || "Message body…"}
                  </p>
                </div>
                <div className="rounded-xl border border-neutral-200/80 p-4 text-[11px] dark:border-neutral-800">
                  <p className="mb-2 font-semibold">Mobile</p>
                  <p className="truncate font-medium">{form.content.subject}</p>
                  <p className="mt-1 line-clamp-6 text-muted-foreground">{form.content.body}</p>
                </div>
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="mx-auto w-full max-w-none space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <WizardField label="Send date">
                  <Input
                    type="date"
                    value={form.schedule.sendDate}
                    onChange={(e) =>
                      patch({ schedule: { ...form.schedule, sendDate: e.target.value } })
                    }
                    className="h-9 w-full rounded-lg"
                  />
                </WizardField>
                <WizardField label="Send time">
                  <Input
                    type="time"
                    value={form.schedule.sendTime}
                    onChange={(e) =>
                      patch({ schedule: { ...form.schedule, sendTime: e.target.value } })
                    }
                    className="h-9 w-full rounded-lg"
                  />
                </WizardField>
                <WizardField label="Timezone">
                  <Input
                    value={form.schedule.timezone}
                    onChange={(e) =>
                      patch({ schedule: { ...form.schedule, timezone: e.target.value } })
                    }
                    className="h-9 w-full rounded-lg sm:col-span-2 lg:col-span-1"
                  />
                </WizardField>
              </div>
              <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-4 text-[12px] dark:border-neutral-800 dark:bg-neutral-900/40">
                <p className="font-semibold">Review</p>
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  <li>Name: {form.name || "—"}</li>
                  <li>Type: {form.campaignType}</li>
                  <li>Audience: ~{form.estimatedRecipients} contacts</li>
                  <li>Subject: {form.content.subject || "—"}</li>
                </ul>
              </div>
            </div>
          ) : null}
        </CardContent>

        <CardFooter className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 bg-transparent px-4 py-4 dark:border-neutral-800 sm:px-5">
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-lg"
            disabled={step <= 1}
            onClick={() => trySetStep(step - 1)}
          >
            <ChevronLeft className="size-4" />
            Back
          </Button>
          <div className="flex flex-wrap gap-2">
            {layout === "sheet" ? (
              <Button type="button" variant="outline" className="h-9 rounded-lg" onClick={onClose}>
                Cancel
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-lg"
                render={<Link href="/marketing/campaigns" />}
              >
                Cancel
              </Button>
            )}
            {step < 4 ? (
              <Button
                type="button"
                className="h-9 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
                disabled={step === 1 && !step1Complete}
                onClick={() => trySetStep(step + 1)}
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-lg"
                  disabled={saving}
                  onClick={() => save("draft")}
                >
                  Save draft
                </Button>
                <Button
                  type="button"
                  className="h-9 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
                  disabled={saving}
                  onClick={() => save("ready_for_review")}
                >
                  Mark ready for review
                </Button>
              </>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export function MarketingCampaignWizard() {
  const searchParams = useSearchParams();
  return (
    <MarketingCampaignWizardBody
      editId={searchParams.get("edit")}
      templateIdParam={searchParams.get("templateId")}
      segmentIdParam={searchParams.get("segmentId")}
      layout="page"
    />
  );
}
