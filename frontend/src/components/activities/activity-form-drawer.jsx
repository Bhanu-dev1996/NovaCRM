"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  fromApiActivity,
  fromApiTask,
  persistActivityMeta,
  toApiActivity,
  toApiTask,
} from "@/components/activities/activity-api";
import { ACTIVITY_TYPES } from "@/components/activities/activities-data";
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
import {
  combineDateAndTime,
  DatePicker,
  TimePicker,
} from "@/components/ui/date-time-picker";
import { crmControl } from "@/lib/crm-typography";
import { apiFetch } from "@/lib/api";
import { fullName } from "@/components/contacts/contacts-data";
import { cn } from "@/lib/utils";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TITLE_MAX = 200;
const BODY_MAX = 8000;
const SUMMARY_MAX = 4000;

const inputInvalidClass =
  "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40";

function validationContext(isTask, activityType, form) {
  return {
    isTask,
    activityType,
    callMode: form.callMode || "scheduled",
  };
}

function subjectRequired(ctx) {
  if (ctx.isTask) return false;
  if (ctx.activityType === "call" && ctx.callMode === "log") return false;
  return ["meeting", "call", "email", "note"].includes(ctx.activityType);
}

function dueRequired(ctx) {
  if (ctx.isTask) return { date: false, time: false };
  if (ctx.activityType === "meeting") return { date: true, time: true };
  if (ctx.activityType === "call" && ctx.callMode === "scheduled") {
    return { date: true, time: true };
  }
  if (ctx.activityType === "call" && ctx.callMode === "log") {
    return { date: true, time: false };
  }
  return { date: false, time: false };
}

function errorFor(field, values, ctx) {
  const text = String(values[field] ?? "").trim();

  if (field === "title") {
    if (!ctx.isTask) return undefined;
    if (!text) return "Title is required";
    if (text.length < 2) return "Enter at least 2 characters";
    if (text.length > TITLE_MAX) {
      return `Title must be ${TITLE_MAX} characters or less`;
    }
    return undefined;
  }

  if (field === "subject") {
    if (!subjectRequired(ctx)) return undefined;
    if (!text) return "Subject is required";
    if (text.length < 2) return "Enter at least 2 characters";
    if (text.length > TITLE_MAX) {
      return `Subject must be ${TITLE_MAX} characters or less`;
    }
    return undefined;
  }

  if (field === "body") {
    if (ctx.activityType !== "note") return undefined;
    if (!text) return "Content is required";
    if (text.length < 3) return "Enter at least 3 characters";
    if (text.length > BODY_MAX) {
      return `Content must be ${BODY_MAX} characters or less`;
    }
    return undefined;
  }

  if (field === "summary") {
    if (ctx.activityType !== "email" || !text) return undefined;
    if (text.length > SUMMARY_MAX) {
      return `Summary must be ${SUMMARY_MAX} characters or less`;
    }
    return undefined;
  }

  if (field === "emailTo") {
    if (ctx.activityType !== "email") return undefined;
    if (!text) return "Recipient email is required";
    if (!EMAIL_PATTERN.test(text)) return "Enter a valid email address";
    return undefined;
  }

  if (field === "dueDate") {
    const { date: required } = dueRequired(ctx);
    if (!required) return undefined;
    if (!values.dueDate) return "Date is required";
    return undefined;
  }

  if (field === "dueTime") {
    const { time: required } = dueRequired(ctx);
    if (!required) return undefined;
    if (!String(values.dueTime || "").trim()) return "Time is required";
    return undefined;
  }

  if (field === "contactId") {
    if (ctx.activityType === "call" && ctx.callMode === "log" && !values.contactId) {
      return "Select a contact for this call";
    }
    return undefined;
  }

  return undefined;
}

function fieldsForValidation(ctx) {
  if (ctx.isTask) return ["title"];
  if (ctx.activityType === "note") return ["subject", "body"];
  if (ctx.activityType === "email") return ["subject", "emailTo", "summary"];
  if (ctx.activityType === "call" && ctx.callMode === "log") {
    return ["contactId", "dueDate"];
  }
  if (ctx.activityType === "call" && ctx.callMode === "scheduled") {
    return ["subject", "dueDate", "dueTime"];
  }
  if (ctx.activityType === "meeting") return ["subject", "dueDate", "dueTime"];
  return [];
}

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

function duePartsFromIso(iso) {
  if (!iso) return { dueDate: null, dueTime: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { dueDate: null, dueTime: "" };
  const pad = (n) => String(n).padStart(2, "0");
  return {
    dueDate: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
    dueTime: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function relatedPayload(form) {
  return {
    contactId: form.contactId || null,
    companyId: form.companyId || null,
    dealId: form.dealId || null,
    leadId: form.leadId || null,
  };
}

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const CALL_DIRECTIONS = [
  { value: "inbound", label: "Inbound" },
  { value: "outbound", label: "Outbound" },
];

const CALL_OUTCOMES = [
  { value: "connected", label: "Connected" },
  { value: "voicemail", label: "Voicemail" },
  { value: "no_answer", label: "No answer" },
  { value: "busy", label: "Busy" },
];

const NOTE_VISIBILITY = [
  { value: "team", label: "Team" },
  { value: "private", label: "Private" },
];

export function ActivityFormDrawer({
  open,
  onOpenChange,
  type = "task",
  mode = "create",
  initialRecord,
  owners = [],
  contacts = [],
  companies = [],
  deals = [],
  leads = [],
  currentUserId = "",
  onSaved,
}) {
  const isEdit = mode === "edit" && Boolean(initialRecord?.id);
  const activityType = initialRecord?.type || type;
  const isTask = activityType === "task" || initialRecord?.recordKind === "task";

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    title: "",
    subject: "",
    body: "",
    priority: "medium",
    assigneeId: "",
    dueDate: null,
    dueTime: "",
    status: "todo",
    contactId: "",
    companyId: "",
    dealId: "",
    leadId: "",
    callMode: "scheduled",
    direction: "outbound",
    outcome: "connected",
    emailTo: "",
    summary: "",
    visibility: "team",
  });

  useEffect(() => {
    if (!open) return;
    const record = initialRecord || {};
    const due = duePartsFromIso(record.dueAt);
    queueMicrotask(() => {
      if (isTask) {
        setForm({
          title: record.subject || record.title || "",
          subject: "",
          body: record.raw?.description || "",
          priority: record.priority || "medium",
          assigneeId: record.assigneeId ? String(record.assigneeId) : "",
          dueDate: due.dueDate,
          dueTime: due.dueTime,
          status: record.status || "todo",
          contactId: record.relatedContactId ? String(record.relatedContactId) : "",
          companyId: record.relatedCompanyId ? String(record.relatedCompanyId) : "",
          dealId: record.relatedDealId ? String(record.relatedDealId) : "",
          leadId: record.relatedLeadId ? String(record.relatedLeadId) : "",
          callMode: "scheduled",
          direction: "outbound",
          outcome: "connected",
          emailTo: "",
          summary: "",
          visibility: "team",
        });
      } else {
        const parsed = fromApiActivity(record.raw || record, { meta: record.meta });
        setForm({
          title: "",
          subject: parsed.subject || "",
          body: parsed.body || "",
          priority: parsed.priority || "medium",
          assigneeId: parsed.assigneeId ? String(parsed.assigneeId) : "",
          dueDate: due.dueDate,
          dueTime: due.dueTime,
          status: parsed.status || "Scheduled",
          contactId: parsed.contactId ? String(parsed.contactId) : "",
          companyId: parsed.companyId ? String(parsed.companyId) : "",
          dealId: parsed.dealId ? String(parsed.dealId) : "",
          leadId: parsed.leadId ? String(parsed.leadId) : "",
          callMode: parsed.callMode || (parsed.status === "Logged" ? "log" : "scheduled"),
          direction: parsed.direction || "outbound",
          outcome: parsed.outcome || "connected",
          emailTo: parsed.emailTo || "",
          summary: parsed.summary || "",
          visibility: parsed.visibility || "team",
        });
      }
      setErrors({});
    });
  }, [open, initialRecord, isTask, activityType]);

  const ownerOptions = useMemo(
    () =>
      owners.map((o) => ({
        value: String(o.id),
        label: o.name,
        searchText: o.name,
      })),
    [owners]
  );

  const contactItems = useMemo(
    () =>
      contacts.map((c) => ({
        id: c.id,
        label: fullName(c) || c.email || "Contact",
        searchText: `${fullName(c)} ${c.email || ""}`,
      })),
    [contacts]
  );

  const companyItems = useMemo(
    () =>
      companies.map((c) => ({
        id: c.id,
        label: c.name,
        searchText: c.name,
      })),
    [companies]
  );

  const dealItems = useMemo(
    () =>
      deals.map((d) => ({
        id: d.id,
        label: d.name,
        searchText: d.name,
      })),
    [deals]
  );

  const leadItems = useMemo(
    () =>
      leads.map((l) => ({
        id: l.id,
        label: `${l.firstName || ""} ${l.lastName || ""}`.trim() || l.email,
        searchText: `${l.firstName} ${l.lastName} ${l.email || ""}`,
      })),
    [leads]
  );

  function setField(key, value) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      return next;
    });
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const snapshot = { ...form, [key]: value };
      const ctx = validationContext(isTask, activityType, snapshot);
      return {
        ...prev,
        [key]: errorFor(key, snapshot, ctx),
      };
    });
  }

  function handleBlur(field, value) {
    const resolved = value !== undefined ? value : form[field];
    const snapshot = { ...form, [field]: resolved };
    const ctx = validationContext(isTask, activityType, snapshot);
    setErrors((prev) => ({
      ...prev,
      [field]: errorFor(field, snapshot, ctx),
    }));
  }

  function validate(values = form) {
    const ctx = validationContext(isTask, activityType, values);
    const next = {};
    for (const field of fieldsForValidation(ctx)) {
      const message = errorFor(field, values, ctx);
      if (message) next[field] = message;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSave() {
    if (!validate(form)) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    setSaving(true);
    try {
      const f = form;
      const dueAt = (() => {
        const combined = combineDateAndTime(f.dueDate, f.dueTime);
        return combined && !Number.isNaN(combined.getTime())
          ? combined.toISOString()
          : null;
      })();

      if (isTask) {
        const payload = toApiTask({
          title: f.title,
          description: f.body,
          priority: f.priority,
          status: f.status || "todo",
          dueAt,
          assigneeId: f.assigneeId || currentUserId || null,
          ...relatedPayload(f),
        });
        const response = isEdit
          ? await apiFetch(`/api/tasks/${initialRecord.id}`, {
              method: "PATCH",
              body: JSON.stringify(payload),
            })
          : await apiFetch("/api/tasks", {
              method: "POST",
              body: JSON.stringify(payload),
            });
        const saved = fromApiTask(response.data);
        toast.success(isEdit ? "Task updated" : "Task created");
        onSaved?.({ recordKind: "task", ...saved, subject: saved.title });
        onOpenChange(false);
        return;
      }

      let status = f.status || "Scheduled";
      let completedAt = null;
      if (activityType === "call" && f.callMode === "log") {
        status = "Logged";
        completedAt = dueAt || new Date().toISOString();
      } else if (activityType === "email" || activityType === "note") {
        status = "Logged";
        completedAt = dueAt || new Date().toISOString();
      } else if (activityType === "meeting" || activityType === "call") {
        status = "Scheduled";
      }

      const record = {
        type: activityType,
        subject: f.subject.trim(),
        body:
          activityType === "email"
            ? f.summary.trim() || f.body.trim()
            : f.body.trim(),
        summary: f.summary.trim(),
        status,
        priority: f.priority,
        dueAt: activityType === "call" && f.callMode === "log" ? completedAt : dueAt,
        completedAt,
        assigneeId: f.assigneeId || currentUserId || null,
        userId: currentUserId || null,
        direction: f.direction,
        outcome: f.outcome,
        emailTo: f.emailTo,
        visibility: f.visibility,
        callMode: f.callMode,
        ...relatedPayload(f),
      };

      const payload = toApiActivity(record);
      const response = isEdit
        ? await apiFetch(`/api/activities/${initialRecord.id}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
          })
        : await apiFetch("/api/activities", {
            method: "POST",
            body: JSON.stringify(payload),
          });
      const saved = fromApiActivity(response.data);
      persistActivityMeta(saved);
      toast.success(isEdit ? "Activity updated" : "Activity created");
      onSaved?.({
        recordKind: "activity",
        id: saved.id,
        type: saved.type,
        subject: saved.subject,
        status: saved.status,
        priority: saved.priority,
        assigneeId: saved.assigneeId,
        dueAt: saved.dueAt,
        completedAt: saved.completedAt,
        raw: response.data,
      });
      onOpenChange(false);
    } catch (error) {
      toast.error(error.message || "Could not save activity");
    } finally {
      setSaving(false);
    }
  }

  const title = isEdit
    ? `Edit ${ACTIVITY_TYPES[activityType]?.label || "activity"}`
    : `Create ${ACTIVITY_TYPES[activityType]?.label || "activity"}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title={title} onClose={() => onOpenChange(false)} maxWidth={480}>
        <SheetBody className="space-y-4">
          {isTask ? (
            <>
              <div>
                <FieldLabel htmlFor="act-task-title" required>
                  Title
                </FieldLabel>
                <Input
                  id="act-task-title"
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  onBlur={(e) => handleBlur("title", e.target.value)}
                  placeholder="e.g. Send proposal follow-up"
                  aria-invalid={Boolean(errors.title)}
                  className={cn(crmControl.inputMt, inputInvalidClass)}
                />
                <FieldError message={errors.title} />
              </div>
              <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="act-task-date" required>
                    Due date
                  </FieldLabel>
                  <DatePicker
                    id="act-task-date"
                    className={crmControl.pickerMt}
                    value={form.dueDate}
                    placeholder="Optional due date"
                    onChange={(date) => setField("dueDate", date)}
                    onBlur={() => handleBlur("dueDate")}
                    aria-invalid={Boolean(errors.dueDate)}
                  />
                  <FieldError message={errors.dueDate} />
                </div>
                <div>
                  <FieldLabel htmlFor="act-task-time">Time</FieldLabel>
                  <TimePicker
                    id="act-task-time"
                    className={crmControl.pickerMt}
                    value={form.dueTime}
                    placeholder="Optional time"
                    onChange={(time) => setField("dueTime", time)}
                    onBlur={() => handleBlur("dueTime")}
                    aria-invalid={Boolean(errors.dueTime)}
                  />
                  <FieldError message={errors.dueTime} />
                </div>
              </div>
              <div>
                <FieldLabel>Priority</FieldLabel>
                <FormFieldDropdown
                  value={form.priority}
                  onChange={(v) => setField("priority", v)}
                  options={PRIORITY_OPTIONS}
                  placeholder="Select priority"
                  triggerClassName="mt-1.5 text-[13px]"
                />
              </div>
              <div>
                <FieldLabel>Assignee</FieldLabel>
                <FormFieldDropdown
                  value={form.assigneeId || ""}
                  onChange={(v) => setField("assigneeId", v || "")}
                  options={ownerOptions}
                  placeholder="Who should own this task?"
                  triggerClassName="mt-1.5 text-[13px]"
                />
              </div>
              <div>
                <FieldLabel htmlFor="act-task-notes">Notes</FieldLabel>
                <Textarea
                  id="act-task-notes"
                  value={form.body}
                  onChange={(e) => setField("body", e.target.value)}
                  onBlur={(e) => handleBlur("body", e.target.value)}
                  placeholder="Optional details or checklist…"
                  rows={3}
                  className={crmControl.inputMt}
                />
              </div>
            </>
          ) : null}

          {activityType === "meeting" ? (
            <>
              <div>
                <FieldLabel htmlFor="act-meeting-subject" required>
                  Subject
                </FieldLabel>
                <Input
                  id="act-meeting-subject"
                  value={form.subject}
                  onChange={(e) => setField("subject", e.target.value)}
                  onBlur={(e) => handleBlur("subject", e.target.value)}
                  placeholder="e.g. Discovery call with Acme Corp"
                  aria-invalid={Boolean(errors.subject)}
                  className={cn(crmControl.inputMt, inputInvalidClass)}
                />
                <FieldError message={errors.subject} />
              </div>
              <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="act-meeting-date" required>
                    Start date
                  </FieldLabel>
                  <DatePicker
                    id="act-meeting-date"
                    className={crmControl.pickerMt}
                    value={form.dueDate}
                    placeholder="Select meeting date"
                    onChange={(date) => setField("dueDate", date)}
                    onBlur={() => handleBlur("dueDate")}
                    aria-invalid={Boolean(errors.dueDate)}
                  />
                  <FieldError message={errors.dueDate} />
                </div>
                <div>
                  <FieldLabel htmlFor="act-meeting-time" required>
                    Time
                  </FieldLabel>
                  <TimePicker
                    id="act-meeting-time"
                    className={crmControl.pickerMt}
                    value={form.dueTime}
                    placeholder="Select start time"
                    onChange={(time) => setField("dueTime", time)}
                    onBlur={() => handleBlur("dueTime")}
                    aria-invalid={Boolean(errors.dueTime)}
                  />
                  <FieldError message={errors.dueTime} />
                </div>
              </div>
              <div>
                <FieldLabel>Assignee</FieldLabel>
                <FormFieldDropdown
                  value={form.assigneeId || ""}
                  onChange={(v) => setField("assigneeId", v || "")}
                  options={ownerOptions}
                  placeholder="Who owns this meeting?"
                  triggerClassName="mt-1.5 text-[13px]"
                />
              </div>
              <RelatedFields
                form={form}
                setField={setField}
                contactItems={contactItems}
                companyItems={companyItems}
                dealItems={dealItems}
                leadItems={leadItems}
              />
            </>
          ) : null}

          {activityType === "call" ? (
            <>
              <div>
                <FieldLabel>Call type</FieldLabel>
                <FormFieldDropdown
                  value={form.callMode}
                  onChange={(v) => {
                    setField("callMode", v);
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.subject;
                      delete next.contactId;
                      delete next.dueDate;
                      delete next.dueTime;
                      return next;
                    });
                  }}
                  options={[
                    { value: "scheduled", label: "Scheduled call" },
                    { value: "log", label: "Log completed call" },
                  ]}
                  triggerClassName="mt-1.5 text-[13px]"
                />
              </div>
              {form.callMode === "scheduled" ? (
                <>
                  <div>
                    <FieldLabel htmlFor="act-call-subject" required>
                      Subject
                    </FieldLabel>
                    <Input
                      id="act-call-subject"
                      value={form.subject}
                      onChange={(e) => setField("subject", e.target.value)}
                      onBlur={(e) => handleBlur("subject", e.target.value)}
                      placeholder="e.g. Quarterly check-in"
                      aria-invalid={Boolean(errors.subject)}
                      className={cn(crmControl.inputMt, inputInvalidClass)}
                    />
                    <FieldError message={errors.subject} />
                  </div>
                  <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
                    <div>
                      <FieldLabel htmlFor="act-call-date" required>
                        Date
                      </FieldLabel>
                      <DatePicker
                        id="act-call-date"
                        className={crmControl.pickerMt}
                        value={form.dueDate}
                        placeholder="Select call date"
                        onChange={(date) => setField("dueDate", date)}
                        onBlur={() => handleBlur("dueDate")}
                        aria-invalid={Boolean(errors.dueDate)}
                      />
                      <FieldError message={errors.dueDate} />
                    </div>
                    <div>
                      <FieldLabel htmlFor="act-call-time" required>
                        Time
                      </FieldLabel>
                      <TimePicker
                        id="act-call-time"
                        className={crmControl.pickerMt}
                        value={form.dueTime}
                        placeholder="Select call time"
                        onChange={(time) => setField("dueTime", time)}
                        onBlur={() => handleBlur("dueTime")}
                        aria-invalid={Boolean(errors.dueTime)}
                      />
                      <FieldError message={errors.dueTime} />
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Assignee</FieldLabel>
                    <FormFieldDropdown
                      value={form.assigneeId || ""}
                      onChange={(v) => setField("assigneeId", v || "")}
                      options={ownerOptions}
                      placeholder="Who will make the call?"
                      triggerClassName="mt-1.5 text-[13px]"
                    />
                  </div>
                  <RelatedFields
                    form={form}
                    setField={setField}
                    contactItems={contactItems}
                    companyItems={companyItems}
                    dealItems={dealItems}
                    leadItems={leadItems}
                  />
                </>
              ) : (
                <>
                  <div>
                    <FieldLabel>Direction</FieldLabel>
                    <FormFieldDropdown
                      value={form.direction}
                      onChange={(v) => setField("direction", v)}
                      options={CALL_DIRECTIONS}
                      triggerClassName="mt-1.5 text-[13px]"
                    />
                  </div>
                  <div>
                    <FieldLabel>Outcome</FieldLabel>
                    <FormFieldDropdown
                      value={form.outcome}
                      onChange={(v) => setField("outcome", v)}
                      options={CALL_OUTCOMES}
                      triggerClassName="mt-1.5 text-[13px]"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
                    <div>
                      <FieldLabel htmlFor="act-call-log-date" required>
                        Date
                      </FieldLabel>
                      <DatePicker
                        id="act-call-log-date"
                        className={crmControl.pickerMt}
                        value={form.dueDate}
                        placeholder="When did the call happen?"
                        onChange={(date) => setField("dueDate", date)}
                        onBlur={() => handleBlur("dueDate")}
                        aria-invalid={Boolean(errors.dueDate)}
                      />
                      <FieldError message={errors.dueDate} />
                    </div>
                    <div>
                      <FieldLabel htmlFor="act-call-log-time">Time</FieldLabel>
                      <TimePicker
                        id="act-call-log-time"
                        className={crmControl.pickerMt}
                        value={form.dueTime}
                        placeholder="Optional time"
                        onChange={(time) => setField("dueTime", time)}
                        onBlur={() => handleBlur("dueTime")}
                      />
                    </div>
                  </div>
                  <div>
                    <FieldLabel required>Contact</FieldLabel>
                    <SearchEntityCombobox
                      value={form.contactId}
                      onChange={(id) => setField("contactId", id || "")}
                      onBlur={() => handleBlur("contactId")}
                      items={contactItems}
                      placeholder="Who did you speak with?"
                      searchPlaceholder="Search contacts by name or email"
                    />
                    <FieldError message={errors.contactId} />
                  </div>
                </>
              )}
            </>
          ) : null}

          {activityType === "email" ? (
            <>
              <div>
                <FieldLabel htmlFor="act-email-subject" required>
                  Subject
                </FieldLabel>
                <Input
                  id="act-email-subject"
                  value={form.subject}
                  onChange={(e) => setField("subject", e.target.value)}
                  onBlur={(e) => handleBlur("subject", e.target.value)}
                  placeholder="e.g. Proposal and next steps"
                  aria-invalid={Boolean(errors.subject)}
                  className={cn(crmControl.inputMt, inputInvalidClass)}
                />
                <FieldError message={errors.subject} />
              </div>
              <div>
                <FieldLabel htmlFor="act-email-to" required>
                  To
                </FieldLabel>
                <Input
                  id="act-email-to"
                  type="email"
                  value={form.emailTo}
                  onChange={(e) => setField("emailTo", e.target.value)}
                  onBlur={(e) => handleBlur("emailTo", e.target.value)}
                  className={cn(crmControl.inputMt, inputInvalidClass)}
                  placeholder="name@company.com"
                  aria-invalid={Boolean(errors.emailTo)}
                  autoComplete="email"
                />
                <FieldError message={errors.emailTo} />
              </div>
              <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="act-email-date">Date</FieldLabel>
                  <DatePicker
                    id="act-email-date"
                    className={crmControl.pickerMt}
                    value={form.dueDate}
                    placeholder="Logged date (optional)"
                    onChange={(date) => setField("dueDate", date)}
                    onBlur={() => handleBlur("dueDate")}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="act-email-time">Time</FieldLabel>
                  <TimePicker
                    id="act-email-time"
                    className={crmControl.pickerMt}
                    value={form.dueTime}
                    placeholder="Logged time (optional)"
                    onChange={(time) => setField("dueTime", time)}
                    onBlur={() => handleBlur("dueTime")}
                  />
                </div>
              </div>
              <div>
                <FieldLabel htmlFor="act-email-summary">Summary</FieldLabel>
                <Textarea
                  id="act-email-summary"
                  value={form.summary}
                  onChange={(e) => setField("summary", e.target.value)}
                  onBlur={(e) => handleBlur("summary", e.target.value)}
                  placeholder="Key points from the email or draft body…"
                  aria-invalid={Boolean(errors.summary)}
                  className={cn(crmControl.inputMt, inputInvalidClass)}
                  rows={4}
                />
                <FieldError message={errors.summary} />
              </div>
              <RelatedFields
                form={form}
                setField={setField}
                contactItems={contactItems}
                companyItems={companyItems}
                dealItems={dealItems}
                leadItems={leadItems}
                compact
              />
            </>
          ) : null}

          {activityType === "note" ? (
            <>
              <div>
                <FieldLabel htmlFor="act-note-title" required>
                  Title
                </FieldLabel>
                <Input
                  id="act-note-title"
                  value={form.subject}
                  onChange={(e) => setField("subject", e.target.value)}
                  onBlur={(e) => handleBlur("subject", e.target.value)}
                  placeholder="Short title for this note"
                  aria-invalid={Boolean(errors.subject)}
                  className={cn(crmControl.inputMt, inputInvalidClass)}
                />
                <FieldError message={errors.subject} />
              </div>
              <div>
                <FieldLabel htmlFor="act-note-body" required>
                  Content
                </FieldLabel>
                <Textarea
                  id="act-note-body"
                  value={form.body}
                  onChange={(e) => setField("body", e.target.value)}
                  onBlur={(e) => handleBlur("body", e.target.value)}
                  placeholder="Capture context, decisions, and follow-ups…"
                  aria-invalid={Boolean(errors.body)}
                  className={cn(crmControl.inputMt, inputInvalidClass)}
                  rows={5}
                />
                <FieldError message={errors.body} />
              </div>
              <div>
                <FieldLabel>Visibility</FieldLabel>
                <FormFieldDropdown
                  value={form.visibility}
                  onChange={(v) => setField("visibility", v)}
                  options={NOTE_VISIBILITY}
                  triggerClassName="mt-1.5 text-[13px]"
                />
              </div>
              <RelatedFields
                form={form}
                setField={setField}
                contactItems={contactItems}
                companyItems={companyItems}
                dealItems={dealItems}
                leadItems={leadItems}
                compact
              />
            </>
          ) : null}
        </SheetBody>
        <SheetFooter className="gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function RelatedFields({
  form,
  setField,
  contactItems,
  companyItems,
  dealItems,
  leadItems,
  compact = false,
}) {
  if (compact) {
    return (
      <div>
        <FieldLabel>Related deal (optional)</FieldLabel>
        <SearchEntityCombobox
          value={form.dealId}
          onChange={(id) => setField("dealId", id || "")}
          items={dealItems}
          placeholder="Link a deal (optional)"
          searchPlaceholder="Search deals by name"
        />
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div>
        <FieldLabel>Related contact</FieldLabel>
        <SearchEntityCombobox
          value={form.contactId}
          onChange={(id) => setField("contactId", id || "")}
          items={contactItems}
          placeholder="Link a contact (optional)"
          searchPlaceholder="Search contacts"
        />
      </div>
      <div>
        <FieldLabel>Related company</FieldLabel>
        <SearchEntityCombobox
          value={form.companyId}
          onChange={(id) => setField("companyId", id || "")}
          items={companyItems}
          placeholder="Link a company (optional)"
          searchPlaceholder="Search companies"
        />
      </div>
      <div>
        <FieldLabel>Related deal</FieldLabel>
        <SearchEntityCombobox
          value={form.dealId}
          onChange={(id) => setField("dealId", id || "")}
          items={dealItems}
          placeholder="Link a deal (optional)"
          searchPlaceholder="Search deals"
        />
      </div>
      <div>
        <FieldLabel>Related lead</FieldLabel>
        <SearchEntityCombobox
          value={form.leadId}
          onChange={(id) => setField("leadId", id || "")}
          items={leadItems}
          placeholder="Link a lead (optional)"
          searchPlaceholder="Search leads"
        />
      </div>
    </div>
  );
}
