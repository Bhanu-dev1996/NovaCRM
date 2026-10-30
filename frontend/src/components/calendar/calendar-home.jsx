"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, Plus, Video } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

import {
  CrmEmptyState,
  CrmPageHeader,
  CrmSkeleton,
  displayName,
  emptyToNull,
  FieldError,
} from "@/components/crm/crm-shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

const EMPTY = {
  subject: "",
  due_at: null,
  body: "",
  contact_id: "",
  company_id: "",
  deal_id: "",
};

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
}) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      ...EMPTY,
      due_at: defaultMeetingTime(),
    });
    setErrors({});
  }, [open]);

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const next = {};
    if (!form.subject.trim()) next.subject = "Meeting title is required";
    if (!(form.due_at instanceof Date) || Number.isNaN(form.due_at.getTime())) {
      next.due_at = "Schedule date and time";
    }
    setErrors(next);
    if (Object.keys(next).length) return;

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
              <Label htmlFor="meeting-title">Title</Label>
              <Input
                id="meeting-title"
                className="mt-1.5"
                value={form.subject}
                onChange={(e) => update("subject", e.target.value)}
                placeholder="Discovery call with Acme"
              />
              <FieldError message={errors.subject} />
            </div>
            <div>
              <Label htmlFor="meeting-when">Date & time</Label>
              <DateTimePicker
                id="meeting-when"
                className="mt-1.5"
                value={form.due_at}
                onChange={(value) => update("due_at", value)}
                placeholder="Pick date and time"
              />
              <FieldError message={errors.due_at} />
            </div>
            <div>
              <Label>Contact</Label>
              <Select
                value={form.contact_id || undefined}
                onValueChange={(value) => update("contact_id", value)}
              >
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue placeholder="Select contact (optional)" />
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
                onValueChange={(value) => update("company_id", value)}
              >
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue placeholder="Select company (optional)" />
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
                onValueChange={(value) => update("deal_id", value)}
              >
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue placeholder="Select deal (optional)" />
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
              <Label htmlFor="meeting-notes">Notes</Label>
              <Textarea
                id="meeting-notes"
                className="mt-1.5 min-h-24"
                value={form.body}
                onChange={(e) => update("body", e.target.value)}
                placeholder="Agenda, dial-in details, or prep notes…"
              />
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

export function CalendarHome() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [rows, setRows] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [deals, setDeals] = useState([]);
  const [userId, setUserId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  const contactMap = useMemo(
    () =>
      Object.fromEntries(
        contacts.map((contact) => [contact.id, displayName(contact)])
      ),
    [contacts]
  );
  const companyMap = useMemo(
    () =>
      Object.fromEntries(companies.map((company) => [company.id, company.name])),
    [companies]
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setStatus("loading");
      try {
        const [ws, list, contactList, companyList, dealList] = await Promise.all(
          [
            apiFetch("/api/workspace"),
            apiFetch("/api/activities?type=meeting&order_by=due_at&limit=200"),
            apiFetch("/api/contacts?order_by=created_at&limit=200"),
            apiFetch("/api/companies?order_by=name&limit=200"),
            apiFetch("/api/deals?order_by=created_at&limit=200"),
          ]
        );
        if (cancelled) return;
        setUserId(ws.user?.id || null);
        setRows(list.data || []);
        setContacts(contactList.data || []);
        setCompanies(companyList.data || []);
        setDeals(dealList.data || []);
        setStatus("ready");
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
  }, []);

  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "schedule" || action === "create") setFormOpen(true);
  }, [searchParams]);

  function openCreate() {
    setFormOpen(true);
    router.replace("/calendar?action=schedule", { scroll: false });
  }

  function closeCreate(open) {
    setFormOpen(open);
    if (!open) router.replace("/calendar", { scroll: false });
  }

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const left = a.due_at ? new Date(a.due_at).getTime() : 0;
      const right = b.due_at ? new Date(b.due_at).getTime() : 0;
      return left - right;
    });
  }, [rows]);

  if (status === "loading") return <CrmSkeleton />;

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5">
      <CrmPageHeader
        crumb="Calendar"
        title="Calendar"
        description="Plan meetings, follow-ups, and team schedules in one place."
        actionLabel={
          <>
            <Plus className="size-3.5" />
            Schedule Meeting
          </>
        }
        onAction={openCreate}
      />

      {sorted.length === 0 ? (
        <CrmEmptyState
          title="No meetings scheduled"
          description="Schedule a meeting to keep discovery calls and reviews on the calendar."
          actionLabel="Schedule Meeting"
          onAction={openCreate}
        />
      ) : (
        <div className="space-y-3">
          {sorted.map((row) => {
            let when = "Unscheduled";
            if (row.due_at) {
              try {
                when = format(parseISO(row.due_at), "EEE, MMM d · h:mm a");
              } catch {
                when = row.due_at;
              }
            }
            return (
              <div
                key={row.id}
                className="flex items-start gap-3 rounded-2xl border border-neutral-200/80 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                  <Video className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-[14px] font-semibold">
                      {row.subject || "Untitled meeting"}
                    </h2>
                    <Badge variant="secondary" className="h-auto">
                      Meeting
                    </Badge>
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 text-[12px] text-muted-foreground">
                    <CalendarDays className="size-3.5" />
                    {when}
                  </p>
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    {[
                      contactMap[row.contact_id],
                      companyMap[row.company_id],
                    ]
                      .filter(Boolean)
                      .join(" · ") || "No related records"}
                  </p>
                  {row.body ? (
                    <p className="mt-2 line-clamp-2 text-[13px] text-neutral-600 dark:text-neutral-300">
                      {row.body}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <MeetingFormDrawer
        open={formOpen}
        onOpenChange={closeCreate}
        userId={userId}
        contacts={contacts}
        companies={companies}
        deals={deals}
        onSaved={(row) => setRows((prev) => [row, ...prev])}
      />
    </div>
  );
}
