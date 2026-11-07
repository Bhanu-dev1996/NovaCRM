"use client";

import { useMemo, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  CalendarDays,
  Loader2,
  Plus,
  SquarePen,
  Trash2,
  Video,
} from "lucide-react";

import { FieldError } from "@/components/crm/crm-shared";
import { resolveLinkedContacts } from "@/components/leads/lead-related-data";
import { fullName } from "@/components/leads/leads-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  combineDateAndTime,
  DatePicker,
  TimePicker,
} from "@/components/ui/date-time-picker";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { crmControl, crmType } from "@/lib/crm-typography";
import { cn } from "@/lib/utils";

const TITLE_MAX = 200;

function meetingMentionsLead(text, lead) {
  const hay = String(text || "").toLowerCase();
  const needles = [fullName(lead), lead.company, lead.email].filter(Boolean);
  return needles.some((needle) => {
    const value = String(needle).trim().toLowerCase();
    return value.length >= 3 && hay.includes(value);
  });
}

export function resolveLeadMeetings(activities, lead, contacts = [], companies = []) {
  if (!lead) return [];
  const linked = resolveLinkedContacts(lead, contacts, companies);
  const contactIds = new Set(
    [
      lead.convertedContactId,
      ...linked
        .map((row) => row.id)
        .filter((id) => id && !String(id).startsWith("contact-")),
    ].filter(Boolean)
  );

  return (activities || []).filter((row) => {
    if (row.type !== "meeting") return false;
    if (row.contact_id && contactIds.has(String(row.contact_id))) return true;
    return meetingMentionsLead(
      `${row.subject || ""} ${row.body || ""}`,
      lead
    );
  });
}

export function leadMeetingCount(activities, lead, contacts, companies) {
  return resolveLeadMeetings(activities, lead, contacts, companies).length;
}

function primaryContactId(lead, contacts, companies) {
  if (lead.convertedContactId) return lead.convertedContactId;
  const linked = resolveLinkedContacts(lead, contacts, companies);
  const row = linked.find(
    (c) => c.id && !String(c.id).startsWith("contact-")
  );
  return row?.id || null;
}

function duePartsFromIso(iso) {
  if (!iso) return { dueDate: null, dueTime: "" };
  try {
    const d = parseISO(iso);
    if (Number.isNaN(d.getTime())) return { dueDate: null, dueTime: "" };
    const pad = (n) => String(n).padStart(2, "0");
    return {
      dueDate: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
      dueTime: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    };
  } catch {
    return { dueDate: null, dueTime: "" };
  }
}

function formatMeetingWhen(iso) {
  if (!iso) return "Not scheduled";
  try {
    return format(parseISO(iso), "MMM d, yyyy · h:mm a");
  } catch {
    return "Not scheduled";
  }
}

function MeetingLabeledMeta({ label, children }) {
  return (
    <div className="min-w-0">
      <p className={crmType.recordLabel}>{label}</p>
      <div
        className={cn(
          "mt-1 min-w-0 text-neutral-700 dark:text-neutral-300",
          crmType.meta
        )}
      >
        {children}
      </div>
    </div>
  );
}

function MeetingFieldLabel({ htmlFor, required, children }) {
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

function meetingFieldError(field, values) {
  const { title, dueDate, dueTime } = values;
  if (field === "title") {
    const trimmed = String(title || "").trim();
    if (!trimmed) return "Title is required.";
    if (trimmed.length < 2) return "Title must be at least 2 characters.";
    if (trimmed.length > TITLE_MAX) {
      return `Title must be ${TITLE_MAX} characters or fewer.`;
    }
    return undefined;
  }
  if (field === "dueDate") {
    if (
      !dueDate ||
      !(dueDate instanceof Date) ||
      Number.isNaN(dueDate.getTime())
    ) {
      return "Select a date.";
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const picked = new Date(dueDate);
    picked.setHours(0, 0, 0, 0);
    if (picked.getTime() < today.getTime()) {
      return "Date cannot be in the past.";
    }
    return undefined;
  }
  if (field === "dueTime") {
    if (!dueTime) return "Select a time.";
    const dateErr = meetingFieldError("dueDate", values);
    if (dateErr) return undefined;
    const combined = combineDateAndTime(dueDate, dueTime);
    if (combined && combined.getTime() < Date.now() - 60_000) {
      return "Time must be in the future.";
    }
    return undefined;
  }
  return undefined;
}

export function LeadDetailMeetingsTab({
  lead,
  activities = [],
  contacts = [],
  companies = [],
  currentUserId,
  onCreateMeeting,
  onUpdateMeeting,
  onDeleteMeeting,
}) {
  const name = fullName(lead);
  const leadMeetings = useMemo(
    () => resolveLeadMeetings(activities, lead, contacts, companies),
    [activities, lead, contacts, companies]
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(null);
  const [dueTime, setDueTime] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState({});

  const formRef = useRef({ title, dueDate, dueTime });
  formRef.current = { title, dueDate, dueTime };

  const editingMeeting = useMemo(
    () => leadMeetings.find((row) => row.id === editingId) ?? null,
    [leadMeetings, editingId]
  );
  const deleteMeeting = useMemo(
    () => leadMeetings.find((row) => row.id === deleteId) ?? null,
    [leadMeetings, deleteId]
  );

  function applyErrors(patch) {
    setErrors((prev) => ({ ...prev, ...patch }));
  }

  function validateSnapshot(snapshot, field) {
    if (field === "dueDate") {
      return {
        dueDate: meetingFieldError("dueDate", snapshot),
        dueTime: meetingFieldError("dueTime", snapshot),
      };
    }
    return { [field]: meetingFieldError(field, snapshot) };
  }

  function validateAll() {
    const snapshot = formRef.current;
    const next = {};
    for (const field of ["title", "dueDate", "dueTime"]) {
      const message = meetingFieldError(field, snapshot);
      if (message) next[field] = message;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function resetForm() {
    setTitle("");
    setDueDate(null);
    setDueTime("");
    setNotes("");
    setErrors({});
  }

  function openSchedule() {
    setEditingId(null);
    resetForm();
    setDialogOpen(true);
  }

  function openEdit(row) {
    const { dueDate: d, dueTime: t } = duePartsFromIso(row.due_at);
    setEditingId(row.id);
    setTitle(row.subject || "");
    setDueDate(d);
    setDueTime(t);
    setNotes(row.body || "");
    setErrors({});
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingId(null);
    setErrors({});
  }

  async function submitMeeting() {
    if (!validateAll()) return;
    setSaving(true);
    try {
      const combined = combineDateAndTime(dueDate, dueTime);
      const dueAt =
        combined && !Number.isNaN(combined.getTime())
          ? combined.toISOString()
          : null;
      const contactId = primaryContactId(lead, contacts, companies);
      const leadNote = `Meeting with ${name}${
        lead.company ? ` at ${lead.company}` : ""
      }.`;
      const base = {
        type: "meeting",
        subject: title.trim(),
        body: notes.trim() || leadNote,
        due_at: dueAt,
        contact_id: contactId,
        company_id: lead.companyId || null,
        user_id: currentUserId || null,
      };

      if (editingId && onUpdateMeeting) {
        await onUpdateMeeting(editingId, {
          subject: base.subject,
          body: base.body,
          due_at: base.due_at,
        });
      } else if (onCreateMeeting) {
        await onCreateMeeting(base);
      }
      closeDialog();
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteId || !onDeleteMeeting) return;
    setDeleting(true);
    try {
      await onDeleteMeeting(deleteId);
      setDeleteId(null);
    } finally {
      setDeleting(false);
    }
  }

  const primaryBtn = cn(
    "rounded-lg bg-primary-600 text-white hover:bg-primary-700",
    crmControl.btnPrimarySm
  );

  return (
    <div className="w-full min-w-0">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className={crmType.sectionLabel}>Meetings</p>
        <Button type="button" size="sm" className={primaryBtn} onClick={openSchedule}>
          <Plus className="size-3.5" />
          Schedule meeting
        </Button>
      </div>

      {leadMeetings.length ? (
        <ul className="overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50/40 dark:border-neutral-800 dark:bg-neutral-950/30">
          {leadMeetings.map((row, index) => (
            <li
              key={row.id}
              className={cn(
                "group relative bg-white transition-colors hover:bg-neutral-50/80 dark:bg-neutral-950 dark:hover:bg-neutral-900/80",
                index > 0 && "border-t border-neutral-100 dark:border-neutral-800"
              )}
            >
              <span
                aria-hidden
                className="absolute top-3 bottom-3 left-0 w-1 rounded-r-full bg-primary-500"
              />
              <div className="flex items-start gap-2 py-3 pr-2 pl-3.5 sm:pr-3">
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-950/50 dark:text-primary-400">
                  <Video className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <h3 className={cn("min-w-0 max-w-full", crmType.bodySemibold)}>
                      {row.subject || "Untitled meeting"}
                    </h3>
                    <Badge
                      variant="outline"
                      className={cn(
                        "h-5 shrink-0 border-primary-200 bg-primary-50 px-2 text-primary-700 dark:border-primary-800 dark:bg-primary-950/60 dark:text-primary-300",
                        crmType.badge
                      )}
                    >
                      Meeting
                    </Badge>
                  </div>
                  <div className="mt-2.5 grid grid-cols-1 gap-3 min-[420px]:grid-cols-3 min-[420px]:gap-4">
                    <MeetingLabeledMeta label="When">
                      <span className="inline-flex min-w-0 items-center gap-1.5">
                        <CalendarDays
                          className="size-3.5 shrink-0 text-neutral-400"
                          aria-hidden
                        />
                        <span className="truncate">
                          {formatMeetingWhen(row.due_at)}
                        </span>
                      </span>
                    </MeetingLabeledMeta>
                    <MeetingLabeledMeta label="With">
                      <span className="truncate">{name}</span>
                    </MeetingLabeledMeta>
                    <MeetingLabeledMeta label="Notes">
                      <span className="line-clamp-2">
                        {row.body?.trim() || "—"}
                      </span>
                    </MeetingLabeledMeta>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-0.5 pt-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-800 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                    aria-label={`Edit ${row.subject || "meeting"}`}
                    onClick={() => openEdit(row)}
                  >
                    <SquarePen className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-lg text-neutral-400 hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Delete ${row.subject || "meeting"}`}
                    onClick={() => setDeleteId(row.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed border-neutral-200 px-6 py-12 text-center dark:border-neutral-800">
          <span className="mx-auto flex size-11 items-center justify-center rounded-xl bg-neutral-100 text-neutral-400 dark:bg-neutral-900">
            <Video className="size-5" aria-hidden />
          </span>
          <p className={cn("mt-3", crmType.emptyTitle)}>No meetings scheduled</p>
          <p className={cn("mx-auto mt-1", crmType.emptyDescription)}>
            Book a call or demo with {name}.
          </p>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent
          title={editingId ? "Edit meeting" : "Schedule meeting"}
          description={
            editingId
              ? `Update the meeting with ${name}.`
              : `Plan time with ${name}.`
          }
          onClose={closeDialog}
        >
          <DialogBody className="space-y-3">
            <div>
              <MeetingFieldLabel htmlFor="lead-meeting-title" required>
                Title
              </MeetingFieldLabel>
              <Input
                id="lead-meeting-title"
                value={title}
                onChange={(e) => {
                  const next = e.target.value;
                  setTitle(next);
                  applyErrors(
                    validateSnapshot({ ...formRef.current, title: next }, "title")
                  );
                }}
                onBlur={() => {
                  applyErrors(
                    validateSnapshot(formRef.current, "title")
                  );
                }}
                aria-invalid={Boolean(errors.title)}
                className={crmControl.inputMt}
                placeholder={`e.g. Discovery call with ${name}`}
                maxLength={TITLE_MAX + 1}
              />
              <FieldError message={errors.title} />
            </div>
            <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
              <div>
                <MeetingFieldLabel htmlFor="lead-meeting-date" required>
                  Date
                </MeetingFieldLabel>
                <DatePicker
                  id="lead-meeting-date"
                  className={crmControl.pickerMt}
                  value={dueDate}
                  onChange={(date) => {
                    setDueDate(date);
                    applyErrors(
                      validateSnapshot(
                        { ...formRef.current, dueDate: date },
                        "dueDate"
                      )
                    );
                  }}
                  aria-invalid={Boolean(errors.dueDate)}
                  placeholder="Select date"
                  align="start"
                />
                <FieldError message={errors.dueDate} />
              </div>
              <div>
                <MeetingFieldLabel htmlFor="lead-meeting-time" required>
                  Time
                </MeetingFieldLabel>
                <TimePicker
                  id="lead-meeting-time"
                  className={crmControl.pickerMt}
                  value={dueTime}
                  onChange={(time) => {
                    setDueTime(time);
                    applyErrors(
                      validateSnapshot(
                        { ...formRef.current, dueTime: time },
                        "dueTime"
                      )
                    );
                  }}
                  aria-invalid={Boolean(errors.dueTime)}
                  placeholder="Select time"
                  align="end"
                />
                <FieldError message={errors.dueTime} />
              </div>
            </div>
            <div>
              <MeetingFieldLabel htmlFor="lead-meeting-notes">
                Notes
              </MeetingFieldLabel>
              <Textarea
                id="lead-meeting-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={cn("mt-1.5 min-h-[72px]", crmControl.textarea)}
                placeholder="Agenda, dial-in link, or prep notes…"
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={crmControl.btnDialog}
              onClick={closeDialog}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={saving}
              className={cn(
                "gap-1.5 bg-primary-600 text-white hover:bg-primary-700",
                crmControl.btnDialogPrimary
              )}
              onClick={submitMeeting}
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving…
                </>
              ) : editingId ? (
                "Save changes"
              ) : (
                "Schedule meeting"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <DialogContent
          title="Delete meeting"
          description="This cannot be undone."
          onClose={() => setDeleteId(null)}
        >
          <DialogBody>
            <p className={crmType.body}>
              Delete{" "}
              <span className={crmType.bodySemibold}>
                {deleteMeeting?.subject || "this meeting"}
              </span>
              ?
            </p>
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteId(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={deleting}
              className="gap-1.5 bg-destructive text-white hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              {deleting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete meeting"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
