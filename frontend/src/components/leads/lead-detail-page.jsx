"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  Building2,
  CalendarDays,
  Lightbulb,
  Loader2,
  Plus,
  Sparkles,
  SquarePen,
  Unlink,
} from "lucide-react";
import { toast } from "sonner";

import { LeadRelatedAddDialogs } from "@/components/leads/lead-related-add-dialogs";
import {
  buildUnlinkLeadPatch,
  resolveLinkedCompanies,
  dealStageLabel,
  formatDealMoney,
  resolveLinkedContacts,
  resolveLinkedDeals,
} from "@/components/leads/lead-related-data";
import {
  buildTouchpointHistory,
  parseLeadNotes,
  serializeNote,
} from "@/components/leads/lead-detail-sheet";
import {
  LEAD_STATUS_STYLES,
  fullName,
  ownerById,
} from "@/components/leads/leads-data";
import {
  CompanyProfileCard,
  ContactProfileCard,
  RelatedSidebarSection,
  SidebarAddLinkMenu,
} from "@/components/shared/crm-related-sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  LeadNoteComposer,
  NoteBodyWithMentions,
} from "@/components/shared/lead-note-composer";
import {
  LeadDetailMeetingsTab,
  leadMeetingCount,
} from "@/components/leads/lead-detail-meetings";
import {
  LeadDetailTasksTab,
  leadTaskCount,
} from "@/components/leads/lead-detail-tasks";
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

function leadInitials(lead) {
  const name = fullName(lead);
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function noteAuthorInitials(author) {
  const name = String(author || "Team").trim();
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "TM";
}

function winLikelihood(score) {
  return Math.min(99, Math.max(12, Math.round(58 + Number(score || 0) * 0.48)));
}

function recommendationCopy(lead) {
  const first = lead.firstName || fullName(lead).split(" ")[0];
  const items = [];
  if (Number(lead.score) >= 70) {
    items.push(
      `${first} has a strong fit score (${lead.score}). Follow up while interest is high.`
    );
  }
  if (!lead.lastContacted) {
    items.push(
      "No recent touchpoint logged. Schedule a discovery call this week."
    );
  }
  if (lead.notes?.toLowerCase().includes("competitor")) {
    items.push(
      "Notes mention a competitor quote. Prepare a value comparison before the next call."
    );
  } else {
    items.push(
      "Review related contacts on the account and invite decision-makers to the next demo."
    );
  }
  return items.slice(0, 3);
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

function SidebarDetailRow({ label, children }) {
  return (
    <div className={crmType.sidebarRow}>
      <span className="shrink-0 text-neutral-400">{label}</span>
      <span className="min-w-0 text-right font-medium text-neutral-800 dark:text-neutral-200">
        {children}
      </span>
    </div>
  );
}

const sectionShell =
  "overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950";

function SectionPanel({ children, className, padding = "p-0" }) {
  return (
    <section className={cn(sectionShell, padding, className)}>{children}</section>
  );
}

function contactDisplayName(row) {
  return [row.first_name, row.last_name].filter(Boolean).join(" ") || row.email;
}

function isPersistedContactId(id) {
  return id && !String(id).startsWith("contact-");
}

function canUnlinkContact(row, lead) {
  if (!isPersistedContactId(row?.id)) return false;
  if (
    lead.convertedContactId &&
    String(lead.convertedContactId) === String(row.id)
  ) {
    return false;
  }
  return true;
}

function formatLeadCode(id) {
  const compact = String(id || "")
    .replace(/-/g, "")
    .slice(-6)
    .toUpperCase();
  return compact ? `LD-${compact}` : "LD-000000";
}

export function LeadDetailPage({
  lead,
  owners,
  companies = [],
  contacts = [],
  deals = [],
  tasks = [],
  activities = [],
  currentUserId,
  onEdit,
  onConvert,
  onAddNote,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onCreateMeeting,
  onUpdateMeeting,
  onDeleteMeeting,
  onPatchLead,
  onCompanyCreated,
  onContactCreated,
}) {
  const [tab, setTab] = useState("notes");
  const [noteDraft, setNoteDraft] = useState("");
  const [postingNote, setPostingNote] = useState(false);
  const [addType, setAddType] = useState(null);
  const [addMode, setAddMode] = useState("create");
  const [unlinkingKey, setUnlinkingKey] = useState(null);

  function openRelatedAdd(type, mode) {
    setAddMode(mode);
    setAddType(type);
  }

  function closeRelatedAdd() {
    setAddType(null);
    setAddMode("create");
  }

  async function handleUnlinkCompany(row) {
    if (!onPatchLead || unlinkingKey) return;
    const patch = buildUnlinkLeadPatch(lead, "company", row);
    if (!patch) return;
    const key = `company:${row.id}`;
    setUnlinkingKey(key);
    try {
      await onPatchLead(lead.id, patch);
      toast.success("Company unlinked");
    } catch (error) {
      toast.error(error.message || "Could not unlink company");
    } finally {
      setUnlinkingKey(null);
    }
  }

  async function handleUnlinkContact(row) {
    if (!onPatchLead || unlinkingKey) return;
    const patch = buildUnlinkLeadPatch(lead, "contact", row);
    if (!patch) {
      toast.error("This contact cannot be unlinked");
      return;
    }
    const key = `contact:${row.id}`;
    setUnlinkingKey(key);
    try {
      await onPatchLead(lead.id, patch);
      toast.success("Contact unlinked");
    } catch (error) {
      toast.error(error.message || "Could not unlink contact");
    } finally {
      setUnlinkingKey(null);
    }
  }

  const owner = ownerById(lead.ownerId, owners);
  const name = fullName(lead);
  const authorName =
    owners.find((row) => row.id === currentUserId)?.name || owner.name || "You";
  const likelihood = winLikelihood(lead.score);

  const linkedCompanies = useMemo(
    () => resolveLinkedCompanies(lead, companies),
    [lead, companies]
  );

  const relatedContacts = useMemo(
    () => resolveLinkedContacts(lead, contacts, companies),
    [lead, contacts, companies]
  );

  const linkedDeals = useMemo(
    () => resolveLinkedDeals(deals, lead, contacts),
    [deals, lead, contacts]
  );

  const activity = useMemo(() => buildTouchpointHistory(lead), [lead]);
  const parsedNotes = useMemo(
    () =>
      parseLeadNotes(lead.notes, {
        author: owner.name,
        date: lead.lastContacted || lead.createdAt,
      }),
    [lead, owner.name]
  );

  const recommendations = recommendationCopy(lead);
  const relatedTaskCount = useMemo(
    () => leadTaskCount(tasks, lead),
    [tasks, lead]
  );
  const relatedMeetingCount = useMemo(
    () => leadMeetingCount(activities, lead, contacts, companies),
    [activities, lead, contacts, companies]
  );
  const scoreValue = Math.min(100, Math.max(0, Number(lead.score) || 0));
  const isConverted = lead.status === "Converted";
  const convertedDealHref = useMemo(() => {
    if (!isConverted) return null;
    const dealId =
      lead.convertedDealId ||
      linkedDeals.find(
        (row) => row.id && !String(row.id).startsWith("deal-")
      )?.id ||
      (lead.related?.dealIds || []).find(
        (id) => id && !String(id).startsWith("deal-")
      );
    return dealId ? `/deals?deal=${dealId}` : "/deals";
  }, [isConverted, lead, linkedDeals]);

  async function submitNote() {
    if (!noteDraft.trim() || postingNote) return;
    setPostingNote(true);
    try {
      await onAddNote?.(serializeNote(authorName, noteDraft.trim()));
      setNoteDraft("");
      toast.success("Note added");
    } catch {
      /* parent toasts */
    } finally {
      setPostingNote(false);
    }
  }

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
              {leadInitials(lead)}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className={cn("truncate", crmType.pageTitle)}>
                  {name}
                </h1>
                <Badge
                  variant="outline"
                  className={cn(
                    "h-5 border-transparent px-1.5",
                    crmType.badgeSemibold,
                    LEAD_STATUS_STYLES[lead.status] || LEAD_STATUS_STYLES.New
                  )}
                >
                  {lead.status}
                </Badge>
                <Badge
                  className={cn(
                    "h-5 gap-1 border-transparent bg-primary-50 px-1.5 text-primary-700 dark:bg-primary-950 dark:text-primary-300",
                    crmType.badgeSemibold
                  )}
                >
                  <Sparkles className="size-3" />
                  Score {scoreValue}
                </Badge>
              </div>
              <p className={cn("mt-1.5", crmType.meta)}>
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  {owner.name}
                </span>
                <span className="text-neutral-300"> · </span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {likelihood}%
                </span>{" "}
                win likelihood
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
              Edit lead
            </Button>
            {isConverted ? (
              <Link
                href={convertedDealHref || "/deals"}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 hover:bg-muted dark:border-input dark:bg-input/30",
                  crmControl.btnOutlineSm
                )}
              >
                View deal
                <ArrowUpRight className="size-3.5" />
              </Link>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-lg"
                onClick={onConvert}
              >
                Convert lead
              </Button>
            )}
          </div>
        </header>

        <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 border-t border-neutral-100 pt-4 sm:grid-cols-2 lg:grid-cols-3 dark:border-neutral-800">
          <OverviewGridItem label="Email" value={lead.email} />
          <OverviewGridItem label="Phone" value={lead.phone} />
          <OverviewGridItem label="Source" value={lead.source} />
          <OverviewGridItem
            label="Created"
            value={formatLeadCalendarDate(lead.createdAt)}
          />
          <OverviewGridItem
            label="Last contacted"
            value={formatLeadCalendarDate(lead.lastContacted)}
          />
          <OverviewGridItem label="Lead ID" value={formatLeadCode(lead.id)} />
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
              <TabsTrigger value="deals" className={crmType.tabLine}>
                Deals
                {linkedDeals.length ? ` (${linkedDeals.length})` : ""}
              </TabsTrigger>
              <TabsTrigger value="activity" className={crmType.tabLine}>
                Activity
              </TabsTrigger>
            </TabsList>

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
                          <p className={cn("mt-1.5 whitespace-pre-wrap", crmType.noteBody)}>
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
                lead={lead}
                tasks={tasks}
                owners={owners}
                currentUserId={currentUserId}
                onCreateTask={onCreateTask}
                onUpdateTask={onUpdateTask}
                onDeleteTask={onDeleteTask}
              />
            </TabsContent>

            <TabsContent value="deals" className="mt-3">
              <div className={cn(sectionShell, "overflow-hidden")}>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="text-xs">Deal</TableHead>
                      <TableHead className="text-xs">Stage</TableHead>
                      <TableHead className="text-xs">Value</TableHead>
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
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="py-8 text-center text-xs text-muted-foreground"
                        >
                          No deals yet. Deals are created when the lead is
                          converted.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="meeting" className="mt-3 w-full min-w-0">
              <LeadDetailMeetingsTab
                lead={lead}
                activities={activities}
                contacts={contacts}
                companies={companies}
                currentUserId={currentUserId}
                onCreateMeeting={onCreateMeeting}
                onUpdateMeeting={onUpdateMeeting}
                onDeleteMeeting={onDeleteMeeting}
              />
            </TabsContent>
          </Tabs>
        </SectionPanel>

        <aside className="flex flex-col gap-4">
          <SectionPanel padding="p-4">
            <RelatedSidebarSection
              title="Companies"
              count={linkedCompanies.length}
              addAction={
                onPatchLead ? (
                  <SidebarAddLinkMenu
                    label="Add company"
                    onPick={(mode) => openRelatedAdd("company", mode)}
                  />
                ) : null
              }
              emptyMessage="No companies linked. Use Add company to link or create one."
            >
              {linkedCompanies.length ? (
                <ul className="space-y-2">
                  {linkedCompanies.map((row) => (
                    <li key={row.id}>
                      <CompanyProfileCard
                        row={row}
                        onUnlink={onPatchLead ? handleUnlinkCompany : undefined}
                        unlinking={unlinkingKey === `company:${row.id}`}
                      />
                    </li>
                  ))}
                </ul>
              ) : null}
            </RelatedSidebarSection>
          </SectionPanel>

          <SectionPanel padding="p-4">
            <RelatedSidebarSection
              title="Contacts"
              count={relatedContacts.length}
              addAction={
                onPatchLead ? (
                  <SidebarAddLinkMenu
                    label="Add contact"
                    onPick={(mode) => openRelatedAdd("contact", mode)}
                  />
                ) : null
              }
              emptyMessage="No contacts linked. Use Add contact to link or create one."
            >
              {relatedContacts.length ? (
                <ul className="space-y-2">
                  {relatedContacts.map((row) => (
                    <li key={row.id}>
                      <ContactProfileCard
                        row={row}
                        onUnlink={
                          onPatchLead && canUnlinkContact(row, lead)
                            ? handleUnlinkContact
                            : undefined
                        }
                        unlinking={unlinkingKey === `contact:${row.id}`}
                      />
                    </li>
                  ))}
                </ul>
              ) : null}
            </RelatedSidebarSection>
          </SectionPanel>

          <SectionPanel padding="p-4">
            <div className="mb-2 flex items-center gap-1.5">
              <Lightbulb className="size-3.5 text-primary-600" />
              <p className={crmType.sectionLabel}>Recommendations</p>
            </div>
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

          {isConverted ? (
            <SectionPanel
              padding="p-4"
              className="border-emerald-200/80 bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-950/20"
            >
              <p className="flex items-center gap-1.5 text-[13px] font-semibold text-emerald-800 dark:text-emerald-200">
                <BadgeCheck className="size-4" />
                Lead converted
              </p>
              <p className="mt-2 text-[12px] font-normal leading-5 text-emerald-900/80 dark:text-emerald-100/80">
                This lead is converted. Continue on the linked deal in your
                pipeline.
              </p>
              <Link
                href={convertedDealHref || "/deals"}
                className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-700"
              >
                View deal
                <ArrowUpRight className="size-3.5" />
              </Link>
            </SectionPanel>
          ) : (
            <SectionPanel padding="p-4" className="border-dashed">
              <p className="flex items-center gap-1.5 text-[13px] font-semibold text-neutral-800 dark:text-neutral-100">
                <Building2 className="size-4 text-primary-600" />
                Convert lead
              </p>
              <p className={cn("mt-2", crmType.metaLeading)}>
                Creates a contact and company from this lead and marks it
                converted. A lead can only be converted once.
              </p>
              <Button
                type="button"
                className="mt-3 w-full rounded-lg bg-primary-600 text-white hover:bg-primary-700"
                onClick={onConvert}
              >
                Convert lead
              </Button>
            </SectionPanel>
          )}
        </aside>
      </div>

      {onPatchLead ? (
        <LeadRelatedAddDialogs
          addType={addType}
          addMode={addMode}
          onAddTypeChange={(type) => {
            if (!type) closeRelatedAdd();
            else setAddType(type);
          }}
          lead={lead}
          companies={companies}
          contacts={contacts}
          currentUserId={currentUserId}
          onPatchLead={onPatchLead}
          onCompanyCreated={onCompanyCreated}
          onContactCreated={onContactCreated}
        />
      ) : null}
    </div>
  );
}
