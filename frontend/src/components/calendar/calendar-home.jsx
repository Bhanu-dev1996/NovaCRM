"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ListTodo,
  Mail,
  Phone,
  Plus,
  Sparkles,
  StickyNote,
  Video,
} from "lucide-react";
import { toast } from "sonner";

import {
  formatActivityDueDisplay,
  mergeActivityRows,
  activityTypeLabel,
} from "@/components/activities/activities-data";
import {
  buildCalendarAiInsights,
  buildCalendarFocusQueue,
  buildMeetingPrepDraft,
  nextMeetingRow,
} from "@/components/calendar/calendar-ai-insights";
import { calendarEventsFromRows } from "@/components/calendar/calendar-data";
import { CALENDAR_TYPE_COLORS } from "@/components/calendar/calendar-event-utils";
import { CalendarSyncPanel } from "@/components/calendar/calendar-sync-panel";
import {
  CalendarGridSkeleton,
  CalendarSkeleton,
} from "@/components/calendar/calendar-skeleton";

const CalendarFullCalendar = dynamic(
  () =>
    import("@/components/calendar/calendar-fullcalendar").then(
      (mod) => mod.CalendarFullCalendar
    ),
  {
    ssr: false,
    loading: () => <CalendarGridSkeleton />,
  }
);
import {
  CrmPageHeader,
  displayName,
  emptyToNull,
  FieldError,
} from "@/components/crm/crm-shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { crmControl } from "@/lib/crm-typography";
import { cn } from "@/lib/utils";

const MEETING_TITLE_MAX = 200;
const MEETING_BODY_MAX = 8000;
const meetingInputInvalidClass =
  "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40";

const MEETING_VALIDATE_FIELDS = ["subject", "due_at"];

function meetingErrorFor(field, form) {
  const subject = String(form.subject ?? "").trim();
  const body = String(form.body ?? "").trim();

  if (field === "subject") {
    if (!subject) return "Meeting title is required";
    if (subject.length < 2) return "Enter at least 2 characters";
    if (subject.length > MEETING_TITLE_MAX) {
      return `Title must be ${MEETING_TITLE_MAX} characters or less`;
    }
    return undefined;
  }

  if (field === "due_at") {
    if (!(form.due_at instanceof Date) || Number.isNaN(form.due_at.getTime())) {
      return "Select date and time";
    }
    return undefined;
  }

  if (field === "body") {
    if (body.length > MEETING_BODY_MAX) {
      return `Notes must be ${MEETING_BODY_MAX} characters or less`;
    }
    return undefined;
  }

  return undefined;
}

function MeetingFieldLabel({ htmlFor, required, children }) {
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

const EMPTY = {
  subject: "",
  due_at: null,
  body: "",
  contact_id: "",
  company_id: "",
  deal_id: "",
  duration_minutes: "60",
  rrule: "",
};

const DURATION_OPTIONS = [
  { value: "30", label: "30 minutes" },
  { value: "60", label: "1 hour" },
  { value: "90", label: "1.5 hours" },
  { value: "120", label: "2 hours" },
];

const RECURRENCE_OPTIONS = [
  { value: "", label: "Does not repeat" },
  { value: "FREQ=DAILY", label: "Daily" },
  { value: "FREQ=WEEKLY", label: "Weekly" },
  { value: "FREQ=MONTHLY", label: "Monthly" },
];

const TYPE_LEGEND = [
  { type: "meeting", icon: Video },
  { type: "call", icon: Phone },
  { type: "task", icon: ListTodo },
  { type: "email", icon: Mail },
  { type: "note", icon: StickyNote },
];

const TYPE_ICON = Object.fromEntries(
  TYPE_LEGEND.map(({ type, icon }) => [type, icon])
);

function defaultMeetingTime() {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);
  return start;
}

function MeetingFormDrawer({
  open,
  onOpenChange,
  onSaved,
  userId,
  contacts,
  companies,
  deals,
  initialDue,
}) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      ...EMPTY,
      due_at: initialDue instanceof Date ? initialDue : defaultMeetingTime(),
    });
    setErrors({});
  }, [open, initialDue]);

  function setField(key, value) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      return next;
    });
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const snapshot = { ...form, [key]: value };
      return {
        ...prev,
        [key]: meetingErrorFor(key, snapshot),
      };
    });
  }

  function handleBlur(field, value) {
    const resolved = value !== undefined ? value : form[field];
    const snapshot = { ...form, [field]: resolved };
    setErrors((prev) => ({
      ...prev,
      [field]: meetingErrorFor(field, snapshot),
    }));
  }

  function validateMeeting(values = form) {
    const next = {};
    for (const field of MEETING_VALIDATE_FIELDS) {
      const message = meetingErrorFor(field, values);
      if (message) next[field] = message;
    }
    const bodyMessage = meetingErrorFor("body", values);
    if (bodyMessage) next.body = bodyMessage;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validateMeeting(form)) {
      toast.error("Please fix the highlighted fields");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        type: "meeting",
        subject: form.subject.trim(),
        body: emptyToNull(form.body),
        due_at: form.due_at.toISOString(),
        contact_id: emptyToNull(form.contact_id),
        company_id: emptyToNull(form.company_id),
        deal_id: emptyToNull(form.deal_id),
        user_id: userId || null,
        status: "Scheduled",
        priority: "medium",
        meta: {
          durationMinutes: Number(form.duration_minutes) || 60,
          ...(form.rrule ? { rrule: form.rrule } : {}),
        },
      };
      const result = await apiFetch("/api/activities", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast.success("Meeting scheduled");
      onSaved?.(result.data);
      onOpenChange?.(false);
    } catch (error) {
      toast.error(error.message || "Could not schedule meeting");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title="Schedule Meeting"
        description="Add a meeting to your workspace calendar."
        onClose={() => onOpenChange?.(false)}
      >
        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <SheetBody className="space-y-4">
            <div>
              <MeetingFieldLabel htmlFor="meeting-title" required>
                Title
              </MeetingFieldLabel>
              <Input
                id="meeting-title"
                className={cn(crmControl.inputMt, meetingInputInvalidClass)}
                value={form.subject}
                onChange={(e) => setField("subject", e.target.value)}
                onBlur={(e) => handleBlur("subject", e.target.value)}
                placeholder="e.g. Discovery call with Acme Corp"
                aria-invalid={Boolean(errors.subject)}
                autoComplete="off"
              />
              <FieldError message={errors.subject} />
            </div>
            <div>
              <MeetingFieldLabel htmlFor="meeting-when" required>
                Date & time
              </MeetingFieldLabel>
              <DateTimePicker
                id="meeting-when"
                className={crmControl.pickerMt}
                value={form.due_at}
                onChange={(value) => setField("due_at", value)}
                onBlur={() => handleBlur("due_at")}
                placeholder="Select meeting date and time"
                aria-invalid={Boolean(errors.due_at)}
              />
              <FieldError message={errors.due_at} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label>Duration</Label>
                <Select
                  value={form.duration_minutes}
                  onValueChange={(value) => setField("duration_minutes", value)}
                >
                  <SelectTrigger className="mt-1.5 w-full">
                    <SelectValue placeholder="How long is the meeting?" />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Repeat</Label>
                <Select
                  value={form.rrule || "none"}
                  onValueChange={(value) =>
                    setField("rrule", value === "none" ? "" : value)
                  }
                >
                  <SelectTrigger className="mt-1.5 w-full">
                    <SelectValue placeholder="Repeats how often?" />
                  </SelectTrigger>
                  <SelectContent>
                    {RECURRENCE_OPTIONS.map((opt) => (
                      <SelectItem
                        key={opt.value || "none"}
                        value={opt.value || "none"}
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Contact</Label>
              <Select
                value={form.contact_id || undefined}
                onValueChange={(value) => setField("contact_id", value)}
              >
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue placeholder="Link a contact (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {displayName(contact)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Company</Label>
              <Select
                value={form.company_id || undefined}
                onValueChange={(value) => setField("company_id", value)}
              >
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue placeholder="Link a company (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Related deal</Label>
              <Select
                value={form.deal_id || undefined}
                onValueChange={(value) => setField("deal_id", value)}
              >
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue placeholder="Link a deal (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {deals.map((deal) => (
                    <SelectItem key={deal.id} value={deal.id}>
                      {deal.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <MeetingFieldLabel htmlFor="meeting-notes">Notes</MeetingFieldLabel>
              <Textarea
                id="meeting-notes"
                className={cn(
                  "mt-1.5 min-h-24",
                  meetingInputInvalidClass
                )}
                value={form.body}
                onChange={(e) => setField("body", e.target.value)}
                onBlur={(e) => handleBlur("body", e.target.value)}
                placeholder="Agenda, dial-in, location, or prep notes (optional)…"
                aria-invalid={Boolean(errors.body)}
              />
              <FieldError message={errors.body} />
            </div>
          </SheetBody>
          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange?.(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Schedule meeting"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

const SIDEBAR_CARD =
  "rounded-2xl border-neutral-200/80 py-0 shadow-sm dark:border-neutral-800";

const SIDEBAR_INNER_PANEL =
  "rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-2 dark:border-neutral-800 dark:bg-neutral-900/30";

function TypeLegend() {
  return (
    <Card className={SIDEBAR_CARD}>
      <CardContent className="px-4 py-3.5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
          Event types
        </p>
        <div className={cn("mt-3", SIDEBAR_INNER_PANEL)}>
          <ul
            className="grid grid-cols-2 gap-1"
            aria-label="Event type colors"
          >
            {TYPE_LEGEND.map(({ type, icon: Icon }) => {
              const colors = CALENDAR_TYPE_COLORS[type] ?? {
                bg: "#64748b",
                border: "#475569",
              };
              return (
                <li key={type} className="min-w-0">
                  <span
                    className="flex w-full min-w-0 items-center gap-1 rounded-[5px] border px-1.5 py-1 text-[10px] font-semibold leading-tight text-white shadow-sm"
                    style={{
                      backgroundColor: colors.bg,
                      borderColor: colors.border,
                    }}
                  >
                    <Icon className="size-3 shrink-0 opacity-95" aria-hidden />
                    <span className="truncate">
                      {activityTypeLabel(type)}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

const CALENDAR_TIPS = [
  "Drag to reschedule",
  "Resize for duration",
  "Repeats use RRULE",
];

function GlanceStat({ value, label }) {
  return (
    <div className="rounded-lg border border-neutral-200/70 bg-white/80 px-2 py-2.5 text-center dark:border-neutral-800 dark:bg-neutral-950/50">
      <p className="text-xl font-semibold tabular-nums leading-none text-foreground">
        {value}
      </p>
      <p className="mt-1 text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function CalendarSidebarGuide({ rows }) {
  const { scheduled, open } = useMemo(() => {
    const events = calendarEventsFromRows(rows);
    return {
      scheduled: events.length,
      open: events.filter((e) => !e.completed).length,
    };
  }, [rows]);

  return (
    <Card className={SIDEBAR_CARD}>
      <CardContent className="px-4 py-3.5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
          At a glance
        </p>
        <div className={cn("mt-3", SIDEBAR_INNER_PANEL)}>
          <div className="grid grid-cols-2 gap-1.5">
            <GlanceStat value={scheduled} label="Scheduled" />
            <GlanceStat value={open} label="Open" />
          </div>
          <div className="mt-2 border-t border-neutral-200/80 pt-2 dark:border-neutral-800">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
              Tips
            </p>
            <ul className="mt-1.5 grid grid-cols-2 gap-1">
              {CALENDAR_TIPS.map((tip, index) => (
                <li
                  key={tip}
                  className={cn(
                    "rounded-md bg-white/60 px-1.5 py-1 text-[9px] leading-snug text-muted-foreground",
                    "dark:bg-neutral-950/40",
                    index === CALENDAR_TIPS.length - 1 &&
                      CALENDAR_TIPS.length % 2 === 1 &&
                      "col-span-2"
                  )}
                >
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CalendarHome() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [mergedRows, setMergedRows] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [deals, setDeals] = useState([]);
  const [userId, setUserId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [scheduleSeed, setScheduleSeed] = useState(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPanel, setAiPanel] = useState("insights");
  const [aiExplain, setAiExplain] = useState(null);
  const [prepOpen, setPrepOpen] = useState(false);

  const focusQueue = useMemo(
    () => buildCalendarFocusQueue(mergedRows, userId, 15),
    [mergedRows, userId]
  );

  const aiInsights = useMemo(
    () => buildCalendarAiInsights(mergedRows, userId),
    [mergedRows, userId]
  );

  const prepMeeting = useMemo(
    () => nextMeetingRow(mergedRows),
    [mergedRows]
  );

  const prepDraft = useMemo(
    () => buildMeetingPrepDraft(prepMeeting),
    [prepMeeting]
  );

  const reloadCalendar = useCallback(async () => {
    const [ws, taskList, activityList, contactList, companyList, dealList] =
      await Promise.all([
        apiFetch("/api/workspace"),
        apiFetch("/api/tasks?limit=400&order_by=due_at"),
        apiFetch("/api/activities?limit=400&order_by=due_at"),
        apiFetch("/api/contacts?order_by=created_at&limit=200"),
        apiFetch("/api/companies?order_by=name&limit=200"),
        apiFetch("/api/deals?order_by=created_at&limit=200"),
      ]);
    setUserId(ws.user?.id || null);
    setMergedRows(mergeActivityRows(taskList.data || [], activityList.data || []));
    setContacts(contactList.data || []);
    setCompanies(companyList.data || []);
    setDeals(dealList.data || []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setStatus("loading");
      try {
        await reloadCalendar();
        if (!cancelled) setStatus("ready");
      } catch (error) {
        if (!cancelled) {
          toast.error(error.message || "Could not load calendar");
          setStatus("error");
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [reloadCalendar]);

  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "schedule" || action === "create") {
      setFormOpen(true);
      setScheduleSeed((prev) => prev || new Date());
    }
    if (searchParams.get("connected") === "1") {
      toast.success("Calendar account linked — sync will run after token storage is enabled.");
      router.replace("/calendar", { scroll: false });
    }
    const syncError = searchParams.get("sync_error");
    if (syncError) {
      toast.error(`Calendar connection failed: ${syncError}`);
      router.replace("/calendar", { scroll: false });
    }
  }, [searchParams, router]);

  function openCreate(seedDate) {
    const seed =
      seedDate instanceof Date && !Number.isNaN(seedDate.getTime())
        ? new Date(seedDate)
        : defaultMeetingTime();
    setScheduleSeed(seed);
    setFormOpen(true);
    router.replace("/calendar?action=schedule", { scroll: false });
  }

  function closeCreate(open) {
    setFormOpen(open);
    if (!open) router.replace("/calendar", { scroll: false });
  }

  function openEvent(ev) {
    router.push(`/activities/${ev.id}?kind=${ev.recordKind}`);
  }

  function openActivityRow(row) {
    if (!row?.id) return;
    router.push(`/activities/${row.id}?kind=${row.recordKind || "activity"}`);
  }

  function openAiAction(insightId) {
    const insight = aiInsights.find((item) => item.id === insightId);
    if (insightId === "focus") {
      setAiPanel("queue");
      return;
    }
    if (insightId === "capacity" && insight) {
      setAiExplain(insight.body);
      return;
    }
    if (insightId === "prep") {
      if (prepMeeting) {
        setPrepOpen(true);
      } else {
        openCreate();
        toast.message("Schedule your next meeting, then generate prep notes.");
      }
    }
  }

  async function copyPrepDraft() {
    try {
      await navigator.clipboard.writeText(prepDraft);
      toast.success("Prep notes copied to clipboard");
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }

  if (status === "loading") return <CalendarSkeleton />;

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[1680px] flex-col gap-5">
      <CrmPageHeader
        crumb="Calendar"
        title="Calendar"
        description="Month, week & day views · 8am–6pm · drag-and-drop · Google/Outlook sync"
        descriptionClassName="max-w-none whitespace-nowrap max-lg:whitespace-normal"
        extraActions={
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-lg border-primary-200 bg-gradient-to-br from-primary-50 via-secondary-50 to-primary-100 text-primary-700 hover:from-primary-100 hover:via-secondary-100 hover:to-primary-200 hover:text-primary-800 dark:border-primary-800 dark:from-primary-950 dark:via-secondary-900/50 dark:to-primary-900 dark:text-primary-300 dark:hover:from-primary-900 dark:hover:via-secondary-900/70 dark:hover:to-primary-800"
            aria-label="AI Calendar Assistant"
            onClick={() => {
              setAiPanel("insights");
              setAiOpen(true);
            }}
          >
            <Sparkles className="size-3.5" />
            AI Assistant
            {focusQueue.length > 0 ? (
              <Badge
                variant="secondary"
                className="ml-0.5 h-5 min-w-5 justify-center rounded-full bg-white/80 px-1.5 text-[10px] text-primary-800 dark:bg-primary-950/80 dark:text-primary-200"
              >
                {Math.min(focusQueue.length, 99)}
              </Badge>
            ) : null}
          </Button>
        }
        actionLabel={
          <>
            <Plus className="size-3.5" />
            Schedule Meeting
          </>
        }
        onAction={() => openCreate()}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_252px] 2xl:grid-cols-[minmax(0,1fr)_280px]">
        <CalendarFullCalendar
          rows={mergedRows}
          onOpenEvent={openEvent}
          onReload={reloadCalendar}
          onSelectSlot={(info) => openCreate(info.start)}
        />

        <aside className="flex flex-col gap-4">
          <CalendarSyncPanel />
          <TypeLegend />
          <CalendarSidebarGuide rows={mergedRows} />
        </aside>
      </div>

      <MeetingFormDrawer
        open={formOpen}
        onOpenChange={closeCreate}
        userId={userId}
        contacts={contacts}
        companies={companies}
        deals={deals}
        initialDue={scheduleSeed}
        onSaved={async () => {
          try {
            await reloadCalendar();
          } catch {
            /* toast handled in drawer */
          }
        }}
      />

      <Sheet
        open={aiOpen}
        onOpenChange={(open) => {
          setAiOpen(open);
          if (!open) setAiPanel("insights");
        }}
      >
        <SheetContent
          title={
            aiPanel === "queue"
              ? "Calendar focus queue"
              : "AI Calendar Assistant"
          }
          description={
            aiPanel === "queue"
              ? "Open work ranked by overdue risk, due date, and meeting priority."
              : "Scheduling insights from your calendar and activities."
          }
          maxWidth={440}
          onClose={() => {
            setAiOpen(false);
            setAiPanel("insights");
          }}
        >
          <SheetBody className="space-y-3">
            {aiPanel === "queue" ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="-ml-1 h-8 rounded-lg text-[12px] text-muted-foreground"
                  onClick={() => setAiPanel("insights")}
                >
                  <ChevronLeft className="size-3.5" />
                  Back to insights
                </Button>
                {focusQueue.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/80 px-4 py-8 text-center text-[13px] text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/40">
                    No open scheduled work. You&apos;re caught up on the calendar.
                  </p>
                ) : (
                  focusQueue.map((item, index) => {
                    const { row, reason } = item;
                    const Icon = TYPE_ICON[row.type] || ListTodo;
                    const due = formatActivityDueDisplay(row.dueAt);
                    const dueText = due.timeLabel
                      ? `${due.dateLabel} · ${due.timeLabel}`
                      : due.dateLabel;
                    return (
                      <Card key={`${row.recordKind}:${row.id}`} size="sm" className="py-0">
                        <CardContent className="flex gap-3 px-3 py-3">
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-[11px] font-bold text-primary-800 tabular-nums dark:bg-primary-950 dark:text-primary-200">
                            {index + 1}
                          </span>
                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex items-start gap-2">
                              <span
                                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white"
                                style={{
                                  backgroundColor:
                                    CALENDAR_TYPE_COLORS[row.type]?.bg ?? "#64748b",
                                }}
                              >
                                <Icon className="size-3.5" aria-hidden />
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-[13px] font-semibold text-foreground">
                                  {row.subject || "Untitled"}
                                </p>
                                <p className="mt-0.5 text-[11px] text-neutral-500">
                                  {activityTypeLabel(row.type)} · {dueText}
                                </p>
                              </div>
                            </div>
                            <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                              <span className="font-medium text-primary-700 dark:text-primary-300">
                                {reason}
                              </span>
                            </p>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-7 rounded-md text-[11px]"
                              onClick={() => {
                                setAiOpen(false);
                                openActivityRow(row);
                              }}
                            >
                              Open activity
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </>
            ) : (
              aiInsights.map((insight) => (
                <Card key={insight.id} size="sm" className="py-3">
                  <CardContent className="px-3">
                    <p className="text-[13px] font-semibold">{insight.title}</p>
                    <p className="mt-1 text-[12px] leading-5 text-muted-foreground">
                      {insight.body}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      className="mt-2 h-9 w-full justify-start rounded-lg bg-muted px-2.5 text-[12px] font-medium text-muted-foreground hover:bg-neutral-200 hover:text-foreground"
                      onClick={() => openAiAction(insight.id)}
                    >
                      {insight.action}
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </SheetBody>
        </SheetContent>
      </Sheet>

      <Dialog open={Boolean(aiExplain)} onOpenChange={(open) => !open && setAiExplain(null)}>
        <DialogContent
          title="Capacity insight"
          description="How Nova reads your schedule for the next week."
          onClose={() => setAiExplain(null)}
        >
          <DialogBody>
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              {aiExplain}
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAiExplain(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={prepOpen} onOpenChange={setPrepOpen}>
        <DialogContent
          title="Meeting prep draft"
          description="Copy this agenda into the meeting notes or your calendar description."
          onClose={() => setPrepOpen(false)}
        >
          <DialogBody className="space-y-3">
            <Textarea
              readOnly
              value={prepDraft}
              className="min-h-[220px] text-[12px] leading-relaxed"
            />
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPrepOpen(false)}>
              Close
            </Button>
            <Button
              className="bg-primary-600 text-white hover:bg-primary-700"
              onClick={copyPrepDraft}
            >
              Copy to clipboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
