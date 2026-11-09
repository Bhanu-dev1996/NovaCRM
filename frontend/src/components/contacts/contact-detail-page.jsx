"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Lightbulb,
  Loader2,
  Plus,
  Sparkles,
  SquarePen,
  Unlink,
} from "lucide-react";
import { toast } from "sonner";

import {
  CONTACT_TYPE_STYLES,
  LIFECYCLE_STYLES,
  fullName,
  initials,
  ownerById,
} from "@/components/contacts/contacts-data";
import {
  LeadDetailMeetingsTab,
  resolveLeadMeetings,
} from "@/components/leads/lead-detail-meetings";
import {
  LeadDetailTasksTab,
  leadTaskCount,
} from "@/components/leads/lead-detail-tasks";
import {
  parseLeadNotes,
  serializeNote,
} from "@/components/leads/lead-detail-sheet";
import {
  dealStageLabel,
  formatDealMoney,
  resolveLinkedDeals,
} from "@/components/leads/lead-related-data";
import {
  LEAD_STATUS_STYLES,
  fullName as leadFullName,
} from "@/components/leads/leads-data";
import { CommunicationHistoryPanel } from "@/components/communications/communication-history-panel";
import { CompanyProfileCard } from "@/components/shared/crm-related-sidebar";
import {
  LeadNoteComposer,
  NoteBodyWithMentions,
} from "@/components/shared/lead-note-composer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { formatLeadCalendarDate } from "@/lib/lead-dates";
import { crmControl, crmType } from "@/lib/crm-typography";
import { cn } from "@/lib/utils";

const TOUCHPOINT_DOT = {
  email: "bg-primary-600",
  form: "bg-violet-500",
  call: "bg-sky-500",
  note: "bg-violet-500",
  status: "bg-violet-500",
  created: "bg-neutral-400",
};

const sectionShell =
  "overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950";

function SectionPanel({ children, className, padding = "p-0" }) {
  return (
    <section className={cn(sectionShell, padding, className)}>{children}</section>
  );
}

function OverviewGridItem({ label, value, children }) {
  return (
    <div className="min-w-0">
      <p className={crmType.recordLabel}>{label}</p>
      <div className={cn("mt-1", crmType.recordValue)}>
        {children ?? (
          <span className="block truncate">{value?.trim() ? value : "—"}</span>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ children, action }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2">
      <p className={crmType.sectionLabel}>{children}</p>
      {action}
    </div>
  );
}

function noteAuthorInitials(author) {
  const name = String(author || "Team").trim();
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "TM";
}

function formatContactCode(id) {
  const compact = String(id || "")
    .replace(/-/g, "")
    .slice(-6)
    .toUpperCase();
  return compact ? `CT-${compact}` : "CT-000000";
}

function contactAsLeadContext(contact, company) {
  return {
    id: contact.id,
    firstName: contact.firstName,
    lastName: contact.lastName,
    email: contact.email,
    phone: contact.phone,
    company: company?.name || "",
    title: contact.title,
    notes: contact.notes,
    createdAt: contact.createdAt,
    lastContacted: contact.lastActivityAt,
    convertedContactId: contact.id,
    related: {
      contactIds: [contact.id],
      companyIds: contact.companyId ? [contact.companyId] : [],
    },
  };
}

function buildContactActivity(contact) {
  const items = [];
  if (contact.lastActivityAt || contact.updatedAt) {
    items.push({
      id: `${contact.id}-updated`,
      type: "note",
      title: "Contact updated",
      detail: contact.lifecycle
        ? `Lifecycle status: ${contact.lifecycle}`
        : "Profile or activity fields changed",
      time: formatLeadCalendarDate(
        contact.lastActivityAt || contact.updatedAt
      ),
    });
  }
  items.push({
    id: `${contact.id}-created`,
    type: "created",
    title: "Contact created",
    detail: contact.contactType
      ? `Added as ${contact.contactType}`
      : "New person record",
    time: formatLeadCalendarDate(contact.createdAt),
  });
  return items;
}

function resolveContactLeads(leads, contact) {
  if (!contact?.id) return [];
  const contactId = String(contact.id);
  const email = String(contact.email || "")
    .trim()
    .toLowerCase();
  const seen = new Set();
  const out = [];

  function push(lead) {
    if (!lead?.id || seen.has(String(lead.id))) return;
    seen.add(String(lead.id));
    out.push(lead);
  }

  for (const id of contact.relatedLeadIds || []) {
    push((leads || []).find((row) => String(row.id) === String(id)));
  }

  for (const lead of leads || []) {
    if (String(lead.convertedContactId) === contactId) {
      push(lead);
      continue;
    }
    if (email && String(lead.email || "").trim().toLowerCase() === email) {
      push(lead);
      continue;
    }
    const relatedIds = lead.related?.contactIds || [];
    if (relatedIds.map(String).includes(contactId)) {
      push(lead);
    }
  }

  return out;
}

function resolveContactDeals(deals, contact, linkedLeads, contacts) {
  const contactId = String(contact.id);
  const seen = new Set();
  const out = [];

  function push(deal) {
    if (!deal?.id || seen.has(String(deal.id))) return;
    seen.add(String(deal.id));
    out.push(deal);
  }

  for (const id of contact.relatedDealIds || []) {
    push((deals || []).find((row) => String(row.id) === String(id)));
  }

  for (const deal of deals || []) {
    if (String(deal.contact_id) === contactId) push(deal);
  }

  for (const lead of linkedLeads || []) {
    for (const deal of resolveLinkedDeals(deals, lead, contacts)) {
      push(deal);
    }
  }

  return out;
}

function isManualLeadLink(contact, leadId) {
  return (contact.relatedLeadIds || [])
    .map(String)
    .includes(String(leadId));
}

function isManualDealLink(contact, dealId) {
  return (contact.relatedDealIds || [])
    .map(String)
    .includes(String(dealId));
}

function canUnlinkLead(contact, lead) {
  if (String(lead.convertedContactId) === String(contact.id)) return false;
  if (isManualLeadLink(contact, lead.id)) return true;
  return (lead.related?.contactIds || [])
    .map(String)
    .includes(String(contact.id));
}

function canUnlinkDeal(contact, deal) {
  if (isManualDealLink(contact, deal.id)) return true;
  return String(deal.contact_id) === String(contact.id);
}

function contactRecommendations(contact, companyName) {
  const first = contact.firstName || fullName(contact).split(" ")[0];
  const items = [];
  if (!contact.email && !contact.phone) {
    items.push(
      "Add email or phone so your team can log calls and send follow-ups."
    );
  } else {
    items.push(
      `Schedule a check-in with ${first} while the relationship is active.`
    );
  }
  if (!contact.companyId) {
    items.push("Link this contact to a company for account-level context.");
  } else if (companyName) {
    items.push(
      `Review other stakeholders at ${companyName} before your next meeting.`
    );
  }
  if (contact.lifecycle === "Churned" || contact.lifecycle === "Inactive") {
    items.push(
      "Lifecycle is inactive — confirm whether to re-engage or archive."
    );
  } else {
    items.push(
      "Log notes after every touchpoint to keep the team aligned on next steps."
    );
  }
  return items.slice(0, 3);
}

function UnlinkRecordButton({ label, onClick, unlinking }) {
  return (
    <Button
      type="button"
      variant="ghost"
      className="absolute top-1.5 right-1 size-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
      disabled={unlinking}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {unlinking ? (
        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
      ) : (
        <Unlink className="size-3.5" aria-hidden="true" />
      )}
    </Button>
  );
}

function LinkRecordDialog({
  label,
  title,
  description,
  emptyLabel,
  searchPlaceholder = "Search by name…",
  options,
  onPick,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [linkingId, setLinkingId] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) =>
      String(option.label || "")
        .toLowerCase()
        .includes(q)
    );
  }, [options, query]);

  function close() {
    setOpen(false);
    setQuery("");
    setLinkingId("");
  }

  async function handlePick(id) {
    if (!onPick) return;
    setLinkingId(String(id));
    try {
      await Promise.resolve(onPick(id));
      close();
    } catch {
      setLinkingId("");
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="link"
        className={cn("h-auto gap-1 px-0", crmType.linkGhost)}
        onClick={() => setOpen(true)}
      >
        <Plus className="size-3.5" />
        {label}
      </Button>
      <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
        <DialogContent
          title={title || label}
          description={description}
          onClose={close}
          maxWidth={480}
        >
          <DialogBody className="space-y-3">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              autoFocus
              disabled={Boolean(linkingId) || !options.length}
            />
            <div className="max-h-72 overflow-y-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
              {filtered.length ? (
                <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {filtered.map((option) => {
                    const busy = linkingId === String(option.id);
                    return (
                      <li key={option.id}>
                        <button
                          type="button"
                          className={cn(
                            "flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition-colors",
                            "hover:bg-neutral-50 dark:hover:bg-neutral-900/60",
                            busy && "opacity-70"
                          )}
                          disabled={Boolean(linkingId)}
                          onClick={() => handlePick(option.id)}
                        >
                          <span className="font-medium text-neutral-900 dark:text-neutral-100">
                            {option.label}
                          </span>
                          {busy ? (
                            <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                  {options.length ? "No matches for your search." : emptyLabel}
                </p>
              )}
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={close}
              disabled={Boolean(linkingId)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


export function ContactDetailPage({
  contact,
  company,
  owners,
  contacts = [],
  leads = [],
  deals = [],
  tasks = [],
  activities = [],
  currentUserId,
  onEdit,
  onAddNote,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onCreateMeeting,
  onUpdateMeeting,
  onDeleteMeeting,
  onUnlinkCompany,
  onLinkLead,
  onUnlinkLead,
  onLinkDeal,
  onUnlinkDeal,
}) {
  const [tab, setTab] = useState("notes");
  const [noteDraft, setNoteDraft] = useState("");
  const [postingNote, setPostingNote] = useState(false);
  const [unlinkingCompany, setUnlinkingCompany] = useState(false);
  const [unlinkingLeadId, setUnlinkingLeadId] = useState(null);
  const [unlinkingDealId, setUnlinkingDealId] = useState(null);

  const owner = ownerById(contact.ownerId, owners);
  const name = fullName(contact);
  const authorName =
    owners.find((row) => row.id === currentUserId)?.name || owner.name || "You";

  const leadContext = useMemo(
    () => contactAsLeadContext(contact, company),
    [contact, company]
  );

  const parsedNotes = useMemo(
    () =>
      parseLeadNotes(contact.notes, {
        author: owner.name,
        date: contact.updatedAt || contact.createdAt,
      }),
    [contact, owner.name]
  );

  const linkedLeads = useMemo(
    () => resolveContactLeads(leads, contact),
    [leads, contact]
  );

  const linkedDeals = useMemo(
    () => resolveContactDeals(deals, contact, linkedLeads, contacts),
    [deals, contact, linkedLeads, contacts]
  );

  const linkableLeads = useMemo(() => {
    const linkedIds = new Set(linkedLeads.map((row) => String(row.id)));
    return (leads || [])
      .filter((row) => !linkedIds.has(String(row.id)))
      .map((row) => ({ id: row.id, label: leadFullName(row) }));
  }, [leads, linkedLeads]);

  const linkableDeals = useMemo(() => {
    const linkedIds = new Set(linkedDeals.map((row) => String(row.id)));
    return (deals || [])
      .filter((row) => !linkedIds.has(String(row.id)))
      .map((row) => ({ id: row.id, label: row.name || "Deal" }));
  }, [deals, linkedDeals]);

  const activity = useMemo(() => buildContactActivity(contact), [contact]);
  const recommendations = contactRecommendations(contact, company?.name);

  const relatedTaskCount = useMemo(
    () => leadTaskCount(tasks, leadContext),
    [tasks, leadContext]
  );
  const relatedMeetingCount = useMemo(
    () =>
      resolveLeadMeetings(activities, leadContext, contacts, company ? [company] : [])
        .length,
    [activities, leadContext, contacts, company]
  );

  async function handleUnlinkCompany() {
    if (!company || !onUnlinkCompany || unlinkingCompany) return;
    setUnlinkingCompany(true);
    try {
      await onUnlinkCompany();
      toast.success("Company unlinked");
    } catch (error) {
      toast.error(error.message || "Could not unlink company");
    } finally {
      setUnlinkingCompany(false);
    }
  }

  async function handleUnlinkLeadRow(leadId) {
    if (!onUnlinkLead || unlinkingLeadId) return;
    setUnlinkingLeadId(leadId);
    try {
      await onUnlinkLead(leadId);
      toast.success("Lead unlinked");
    } catch (error) {
      toast.error(error.message || "Could not unlink lead");
    } finally {
      setUnlinkingLeadId(null);
    }
  }

  async function handleUnlinkDealRow(dealId) {
    if (!onUnlinkDeal || unlinkingDealId) return;
    setUnlinkingDealId(dealId);
    try {
      await onUnlinkDeal(dealId);
      toast.success("Deal unlinked");
    } catch (error) {
      toast.error(error.message || "Could not unlink deal");
    } finally {
      setUnlinkingDealId(null);
    }
  }

  async function submitNote() {
    if (!noteDraft.trim() || postingNote) return;
    setPostingNote(true);
    try {
      await onAddNote?.(serializeNote(authorName, noteDraft.trim()));
      setNoteDraft("");
      toast.success("Note added");
    } catch {
      /* parent may toast */
    } finally {
      setPostingNote(false);
    }
  }

  const subtitleParts = [contact.title, company?.name].filter(Boolean);

  return (
    <div className="flex flex-col gap-4">
      <SectionPanel padding="px-6 py-4">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <span
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-950",
                crmType.avatarLg
              )}
            >
              {initials(contact)}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className={cn("truncate", crmType.pageTitle)}>{name}</h1>
                {contact.contactType ? (
                  <Badge
                    variant="outline"
                    className={cn(
                      "h-5 border-transparent px-1.5",
                      crmType.badgeSemibold,
                      CONTACT_TYPE_STYLES[contact.contactType] ||
                        CONTACT_TYPE_STYLES.Other
                    )}
                  >
                    {contact.contactType}
                  </Badge>
                ) : null}
                {contact.lifecycle ? (
                  <Badge
                    variant="outline"
                    className={cn(
                      "h-5 border-transparent px-1.5",
                      crmType.badgeSemibold,
                      LIFECYCLE_STYLES[contact.lifecycle] ||
                        LIFECYCLE_STYLES.Inactive
                    )}
                  >
                    {contact.lifecycle}
                  </Badge>
                ) : null}
              </div>
              <p className={cn("mt-1.5", crmType.meta)}>
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  {owner.name}
                </span>
                {subtitleParts.length ? (
                  <>
                    <span className="text-neutral-300"> · </span>
                    <span className="text-neutral-600 dark:text-neutral-400">
                      {subtitleParts.join(" at ")}
                    </span>
                  </>
                ) : null}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
            <Button
              type="button"
              size="sm"
              className={cn(
                "rounded-lg bg-primary-600 px-3 text-white hover:bg-primary-700",
                crmControl.btnOutlineSm
              )}
              onClick={onEdit}
            >
              <SquarePen className="size-3.5" />
              Edit contact
            </Button>
          </div>
        </header>

        <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 border-t border-neutral-100 pt-4 sm:grid-cols-2 lg:grid-cols-3 dark:border-neutral-800">
          <OverviewGridItem label="Email" value={contact.email} />
          <OverviewGridItem label="Phone" value={contact.phone} />
          <OverviewGridItem label="Job title" value={contact.title} />
          <OverviewGridItem
            label="Department"
            value={contact.department}
          />
          <OverviewGridItem
            label="Created"
            value={formatLeadCalendarDate(contact.createdAt)}
          />
          <OverviewGridItem
            label="Last activity"
            value={formatLeadCalendarDate(
              contact.lastActivityAt || contact.updatedAt
            )}
          />
          <OverviewGridItem label="Contact ID" value={formatContactCode(contact.id)} />
        </dl>
      </SectionPanel>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <SectionPanel padding="px-6 py-4" className="min-w-0">
          <Tabs value={tab} onValueChange={setTab} className="gap-4">
            <TabsList
              variant="line"
              className="h-auto w-full flex-wrap items-end justify-start gap-x-8 gap-y-0 rounded-none border-b border-neutral-100 p-0 dark:border-neutral-800"
            >
              <TabsTrigger value="notes" className={crmType.tabLine}>
                Notes
                {parsedNotes.length ? ` (${parsedNotes.length})` : ""}
              </TabsTrigger>
              <TabsTrigger value="tasks" className={crmType.tabLine}>
                Tasks
                {relatedTaskCount ? ` (${relatedTaskCount})` : ""}
              </TabsTrigger>
              <TabsTrigger value="meeting" className={crmType.tabLine}>
                Schedule meeting
                {relatedMeetingCount ? ` (${relatedMeetingCount})` : ""}
              </TabsTrigger>
              <TabsTrigger value="leads" className={crmType.tabLine}>
                Leads
                {linkedLeads.length ? ` (${linkedLeads.length})` : ""}
              </TabsTrigger>
              <TabsTrigger value="deals" className={crmType.tabLine}>
                Deals
                {linkedDeals.length ? ` (${linkedDeals.length})` : ""}
              </TabsTrigger>
              <TabsTrigger value="activity" className={crmType.tabLine}>
                Activity
              </TabsTrigger>
              <TabsTrigger value="communications" className={crmType.tabLine}>
                Communications
              </TabsTrigger>
            </TabsList>

            <TabsContent value="communications" className="mt-3">
              <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
                <SectionLabel>Communication history</SectionLabel>
                <CommunicationHistoryPanel contact={contact} />
              </div>
            </TabsContent>

            <TabsContent value="activity" className="mt-3 space-y-3">
              <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
                <SectionLabel>Touchpoint history</SectionLabel>
                {activity.length ? (
                  <ol>
                    {activity.map((item, index) => (
                      <li
                        key={item.id}
                        className="relative flex gap-3 pb-6 last:pb-0"
                      >
                        {index < activity.length - 1 ? (
                          <span
                            aria-hidden="true"
                            className="absolute top-3 left-[5px] h-[calc(100%-6px)] w-px bg-neutral-200 dark:bg-neutral-800"
                          />
                        ) : null}
                        <span
                          aria-hidden="true"
                          className={cn(
                            "relative z-10 mt-1.5 size-2.5 shrink-0 rounded-full ring-4 ring-white dark:ring-neutral-950",
                            TOUCHPOINT_DOT[item.type] || "bg-neutral-400"
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <p className={cn("leading-5", crmType.bodySemibold)}>
                            {item.title}
                          </p>
                          {item.detail ? (
                            <p className={cn("mt-0.5 leading-5", crmType.meta)}>
                              {item.detail}
                            </p>
                          ) : null}
                        </div>
                        <p
                          className={cn(
                            "shrink-0 pt-0.5 text-right whitespace-nowrap",
                            crmType.helper
                          )}
                        >
                          {item.time}
                        </p>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className={cn("py-8 text-center", crmType.placeholder)}>
                    No activity logged yet.
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="notes" className="mt-3">
              <form
                className="border-b border-neutral-100 pb-4 dark:border-neutral-800"
                onSubmit={(event) => {
                  event.preventDefault();
                  submitNote();
                }}
              >
                <LeadNoteComposer
                  members={owners}
                  value={noteDraft}
                  onChange={setNoteDraft}
                  posting={postingNote}
                />
              </form>

              {parsedNotes.length ? (
                <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {parsedNotes.map((item) => (
                    <li key={item.id} className="flex gap-3 py-4">
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800",
                          crmType.avatarSm
                        )}
                        aria-hidden="true"
                      >
                        {noteAuthorInitials(item.author)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <span className={crmType.bodySemibold}>
                            {item.author}
                          </span>
                          {item.date ? (
                            <span className={crmType.helper}>{item.date}</span>
                          ) : null}
                        </div>
                        {item.body ? (
                          <p
                            className={cn(
                              "mt-1.5 whitespace-pre-wrap",
                              crmType.noteBody
                            )}
                          >
                            <NoteBodyWithMentions
                              body={item.body}
                              members={owners}
                            />
                          </p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={cn("py-10 text-center", crmType.placeholder)}>
                  No notes yet. Add the first one above.
                </p>
              )}
            </TabsContent>

            <TabsContent value="tasks" className="mt-3 w-full min-w-0">
              <LeadDetailTasksTab
                lead={leadContext}
                tasks={tasks}
                owners={owners}
                currentUserId={currentUserId}
                onCreateTask={onCreateTask}
                onUpdateTask={onUpdateTask}
                onDeleteTask={onDeleteTask}
              />
            </TabsContent>

            <TabsContent value="meeting" className="mt-3 w-full min-w-0">
              <LeadDetailMeetingsTab
                lead={leadContext}
                activities={activities}
                contacts={contacts}
                companies={company ? [company] : []}
                currentUserId={currentUserId}
                onCreateMeeting={onCreateMeeting}
                onUpdateMeeting={onUpdateMeeting}
                onDeleteMeeting={onDeleteMeeting}
              />
            </TabsContent>

            <TabsContent value="leads" className="mt-3 space-y-3">
              <SectionLabel
                action={
                  onLinkLead ? (
                    <LinkRecordDialog
                      label="Link lead"
                      title="Link a lead"
                      description="Search and select a lead to associate with this contact."
                      emptyLabel="No leads available to link."
                      searchPlaceholder="Search leads…"
                      options={linkableLeads}
                      onPick={onLinkLead}
                    />
                  ) : null
                }
              >
                Linked leads
              </SectionLabel>
              <div className={cn(sectionShell, "overflow-hidden")}>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="text-xs">Lead</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Score</TableHead>
                      <TableHead className="text-xs">Source</TableHead>
                      <TableHead className="w-12 text-xs text-right" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {linkedLeads.length ? (
                      linkedLeads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell className="text-xs font-medium">
                            <Link
                              href={`/leads/${lead.id}`}
                              className="text-primary-700 hover:underline dark:text-primary-300"
                            >
                              {leadFullName(lead)}
                            </Link>
                          </TableCell>
                          <TableCell className="text-xs">
                            <Badge
                              variant="outline"
                              className={cn(
                                "h-auto border-transparent text-xs",
                                LEAD_STATUS_STYLES[lead.status] ||
                                  LEAD_STATUS_STYLES.New
                              )}
                            >
                              {lead.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground tabular-nums">
                            {lead.score ?? "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {lead.source || "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            {canUnlinkLead(contact, lead) && onUnlinkLead ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="size-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                disabled={unlinkingLeadId === lead.id}
                                aria-label={`Unlink ${leadFullName(lead)}`}
                                onClick={() => handleUnlinkLeadRow(lead.id)}
                              >
                                {unlinkingLeadId === lead.id ? (
                                  <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                  <Unlink className="size-3.5" />
                                )}
                              </Button>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="py-8 text-center text-xs text-muted-foreground"
                        >
                          No leads linked. Use Link lead to attach a record.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="deals" className="mt-3 space-y-3">
              <SectionLabel
                action={
                  onLinkDeal ? (
                    <LinkRecordDialog
                      label="Link deal"
                      title="Link a deal"
                      description="Search and select a deal to associate with this contact."
                      emptyLabel="No deals available to link."
                      searchPlaceholder="Search deals…"
                      options={linkableDeals}
                      onPick={onLinkDeal}
                    />
                  ) : null
                }
              >
                Linked deals
              </SectionLabel>
              <div className={cn(sectionShell, "overflow-hidden")}>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="text-xs">Deal</TableHead>
                      <TableHead className="text-xs">Stage</TableHead>
                      <TableHead className="text-xs">Value</TableHead>
                      <TableHead className="w-12 text-xs text-right" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {linkedDeals.length ? (
                      linkedDeals.map((deal) => (
                        <TableRow key={deal.id}>
                          <TableCell className="text-xs font-medium">
                            <Link
                              href={`/deals?deal=${deal.id}`}
                              className="text-primary-700 hover:underline dark:text-primary-300"
                            >
                              {deal.name || "Deal"}
                            </Link>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {dealStageLabel(deal)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDealMoney(deal.amount, deal.currency)}
                          </TableCell>
                          <TableCell className="text-right">
                            {canUnlinkDeal(contact, deal) && onUnlinkDeal ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="size-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                disabled={unlinkingDealId === deal.id}
                                aria-label={`Unlink ${deal.name || "deal"}`}
                                onClick={() => handleUnlinkDealRow(deal.id)}
                              >
                                {unlinkingDealId === deal.id ? (
                                  <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                  <Unlink className="size-3.5" />
                                )}
                              </Button>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="py-8 text-center text-xs text-muted-foreground"
                        >
                          No deals linked. Use Link deal to attach a record.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </SectionPanel>

        <aside className="flex flex-col gap-4">
          <SectionPanel padding="p-4">
            <SectionLabel>Company</SectionLabel>
            {company ? (
              <CompanyProfileCard
                row={company}
                onUnlink={onUnlinkCompany ? () => handleUnlinkCompany() : undefined}
                unlinking={unlinkingCompany}
              />
            ) : (
              <p
                className={cn(
                  "rounded-lg border border-dashed border-neutral-200 px-3 py-6 text-center dark:border-neutral-800",
                  crmType.dashedEmpty
                )}
              >
                No company linked. Edit the contact to associate an account.
              </p>
            )}
          </SectionPanel>

          <SectionPanel padding="p-4">
            <SectionLabel>
              <span className="inline-flex items-center gap-1.5">
                <Lightbulb className="size-3.5 text-primary-600" />
                Recommendations
              </span>
            </SectionLabel>
            <ul className="space-y-2">
              {recommendations.map((text) => (
                <li
                  key={text}
                  className="rounded-lg border border-primary-100 bg-primary-50/80 px-3.5 py-3 text-[12px] font-normal leading-5 text-primary-900 dark:border-primary-900 dark:bg-primary-950/50 dark:text-primary-100"
                >
                  {text}
                </li>
              ))}
            </ul>
          </SectionPanel>

          <SectionPanel padding="p-4" className="border-dashed">
            <p className="flex items-center gap-1.5 text-[13px] font-semibold text-neutral-800 dark:text-neutral-100">
              <Sparkles className="size-4 text-primary-600" />
              Relationship summary
            </p>
            <p className={cn("mt-2", crmType.metaLeading)}>
              {contact.linkedIn
                ? "LinkedIn profile on file — use it to personalize outreach."
                : "Add LinkedIn or tags in edit to enrich this profile."}
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-3 w-full rounded-lg"
              onClick={onEdit}
            >
              Update contact
            </Button>
          </SectionPanel>
        </aside>
      </div>
    </div>
  );
}
