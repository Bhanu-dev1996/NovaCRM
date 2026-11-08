"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2,
  ChevronsUpDown,
  Lightbulb,
  Sparkles,
  SquarePen,
} from "lucide-react";
import { toast } from "sonner";

import {
  DEFAULT_PIPELINE_NAME,
  DEAL_PRIORITY_STYLES,
  DEAL_STAGE_STYLES,
  dealNameInitials,
  dealProbabilityLabel,
  formatDealAmount,
  partitionPipelineStages,
  stageById,
} from "@/components/deals/deals-data";
import {
  DealDetailMeetingsTab,
  dealMeetingCount,
} from "@/components/deals/deal-detail-meetings";
import {
  DealDetailTasksTab,
  dealTaskCount,
} from "@/components/deals/deal-detail-tasks";
import { DealRelatedAddDialogs } from "@/components/deals/deal-related-add-dialogs";
import {
  buildUnlinkDealPatch,
  canUnlinkDealContact,
} from "@/components/deals/deal-related-data";
import { fullName, ownerById } from "@/components/contacts/contacts-data";
import {
  parseLeadNotes,
  serializeNote,
} from "@/components/leads/lead-detail-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CompanyProfileCard,
  ContactProfileCard,
  RelatedSidebarSection,
  SidebarAddLinkMenu,
} from "@/components/shared/crm-related-sidebar";
import {
  LeadNoteComposer,
  NoteBodyWithMentions,
} from "@/components/shared/lead-note-composer";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { formatLeadCalendarDate } from "@/lib/lead-dates";
import { crmControl, crmType } from "@/lib/crm-typography";
import { cn } from "@/lib/utils";

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

function formatDealCode(id) {
  const compact = String(id || "")
    .replace(/-/g, "")
    .slice(-6)
    .toUpperCase();
  return compact ? `DL-${compact}` : "DL-000000";
}

function noteAuthorInitials(author) {
  const name = String(author || "Team").trim();
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "TM";
}

function dealRecommendations(deal, stage) {
  const items = [];
  const amount = Number(deal?.amount || 0);
  if (amount >= 100000) {
    items.push("High-value deal — confirm economic buyer and procurement timeline.");
  }
  if (deal?.expectedCloseDate) {
    items.push(
      `Expected close ${deal.expectedCloseDate}. Schedule a mutual action plan before that date.`
    );
  } else {
    items.push("Set an expected close date to improve forecast accuracy.");
  }
  if (stage?.is_won) {
    items.push("Deal is won. Hand off to customer success and log implementation milestones.");
  } else if (stage?.is_lost) {
    items.push("Capture loss reason in notes so similar deals can be coached earlier.");
  } else if (deal?.nextStep?.trim()) {
    items.push(`Next step on file: ${deal.nextStep.trim()}`);
  } else {
    items.push("Define a concrete next step while momentum is fresh.");
  }
  return items.slice(0, 3);
}

function buildDealActivity(deal, stage, ownerName) {
  const items = [];
  if (deal?.createdAt) {
    items.push({
      id: "created",
      title: "Deal created",
      detail: ownerName ? `Owned by ${ownerName}` : undefined,
      time: formatLeadCalendarDate(deal.createdAt),
    });
  }
  for (const entry of deal?.stageHistory || []) {
    items.push({
      id: `stage-${entry.at}-${entry.toStageId}`,
      title: "Stage updated",
      detail: entry.fromStageId ? "Pipeline stage changed" : "Initial stage",
      time: formatLeadCalendarDate(entry.at),
    });
  }
  if (deal?.nextStep?.trim()) {
    items.push({
      id: "next-step",
      title: "Next step",
      detail: deal.nextStep.trim(),
      time: deal.updatedAt
        ? formatLeadCalendarDate(deal.updatedAt)
        : undefined,
    });
  }
  if (stage?.is_won && deal?.actualCloseDate) {
    items.push({
      id: "won",
      title: "Deal won",
      detail: `Closed ${deal.actualCloseDate}`,
      time: formatLeadCalendarDate(deal.actualCloseDate),
    });
  }
  if (stage?.is_lost && deal?.lossReason) {
    items.push({
      id: "lost",
      title: "Deal lost",
      detail: deal.lossReason,
      time: deal.updatedAt
        ? formatLeadCalendarDate(deal.updatedAt)
        : undefined,
    });
  }
  return items;
}

function DealStageBadgeMenu({ deal, stages, stage, stageBadgeClass, onChangeStage }) {
  const [open, setOpen] = useState(false);

  function pick(stageId) {
    if (String(deal?.stageId) === String(stageId)) {
      setOpen(false);
      return;
    }
    onChangeStage?.(stageId);
    setOpen(false);
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 rounded-full border-transparent px-2.5 shadow-none"
          />
        }
      >
        {stage ? (
          <Badge
            variant="outline"
            className={cn(
              "h-6 gap-1 border-transparent px-2",
              crmType.badgeSemibold,
              stageBadgeClass
            )}
          >
            {stage.name}
            <ChevronsUpDown className="size-3 opacity-60" aria-hidden="true" />
          </Badge>
        ) : (
          <>
            Stage
            <ChevronsUpDown className="size-3.5 opacity-60" aria-hidden="true" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-72 min-w-48 overflow-y-auto">
        {(stages || []).map((row) => (
          <DropdownMenuItem key={row.id} onClick={() => pick(row.id)}>
            {row.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DealDetailPage({
  deal,
  company,
  primaryContact,
  additionalContacts = [],
  companies = [],
  contacts = [],
  owners = [],
  stages = [],
  tasks = [],
  activities = [],
  currentUserId,
  onEdit,
  onChangeStage,
  onPatchDeal,
  onCompanyCreated,
  onContactCreated,
  onAddNote,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onCreateMeeting,
  onUpdateMeeting,
  onDeleteMeeting,
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
    if (!onPatchDeal || unlinkingKey) return;
    const patch = buildUnlinkDealPatch(deal, "company", row);
    if (!patch) return;
    const key = `company:${row.id}`;
    setUnlinkingKey(key);
    try {
      await onPatchDeal(patch);
      toast.success("Company unlinked");
    } catch (error) {
      toast.error(error.message || "Could not unlink company");
    } finally {
      setUnlinkingKey(null);
    }
  }

  async function handleUnlinkContact(row) {
    if (!onPatchDeal || unlinkingKey) return;
    const patch = buildUnlinkDealPatch(deal, "contact", row);
    if (!patch) {
      toast.error("This contact cannot be unlinked");
      return;
    }
    const key = `contact:${row.id}`;
    setUnlinkingKey(key);
    try {
      await onPatchDeal(patch);
      toast.success("Contact unlinked");
    } catch (error) {
      toast.error(error.message || "Could not unlink contact");
    } finally {
      setUnlinkingKey(null);
    }
  }

  const stage = stageById(stages, deal?.stageId);
  const owner = ownerById(deal?.ownerId, owners);
  const probabilityLabel = dealProbabilityLabel(deal, stage);
  const priority = deal?.priority?.trim();
  const companyName = company?.name || "";
  const { active, won } = partitionPipelineStages(stages);
  const progressStages = [...active, ...won];
  const stageIndex = progressStages.findIndex((s) => s.id === deal?.stageId);

  const linkedCompanies = useMemo(() => {
    return company ? [company] : [];
  }, [company]);

  const relatedContacts = useMemo(() => {
    const rows = [];
    if (primaryContact) rows.push(primaryContact);
    for (const row of additionalContacts) {
      if (!rows.some((item) => item.id === row.id)) rows.push(row);
    }
    return rows;
  }, [primaryContact, additionalContacts]);

  const parsedNotes = useMemo(
    () =>
      parseLeadNotes(deal?.notes, {
        author: owner.name,
        date: deal?.updatedAt || deal?.createdAt,
      }),
    [deal, owner.name]
  );

  const recommendations = dealRecommendations(deal, stage);
  const relatedTaskCount = useMemo(
    () => dealTaskCount(tasks, deal, companyName),
    [tasks, deal, companyName]
  );
  const relatedMeetingCount = useMemo(
    () => dealMeetingCount(activities, deal, relatedContacts, companyName),
    [activities, deal, relatedContacts, companyName]
  );
  const activity = useMemo(
    () => buildDealActivity(deal, stage, owner.name),
    [deal, stage, owner.name]
  );

  const authorName =
    owners.find((row) => row.id === currentUserId)?.name || owner.name || "You";

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

  const stageBadgeClass =
    DEAL_STAGE_STYLES[stage?.name] ||
    (stage?.is_won
      ? DEAL_STAGE_STYLES["Closed Won"]
      : stage?.is_lost
        ? DEAL_STAGE_STYLES["Closed Lost"]
        : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300");

  return (
    <div className="flex flex-col gap-4">
      <SectionPanel padding="p-0" className="overflow-hidden">
        <div className="border-b border-neutral-100 bg-gradient-to-r from-primary-50/60 to-white px-6 py-5 dark:border-neutral-800 dark:from-primary-950/40 dark:to-neutral-950">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-1 gap-3">
              <span
                className={cn(
                  "flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-950",
                  crmType.avatarLg
                )}
              >
                {dealNameInitials(deal?.name)}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className={cn("truncate", crmType.pageTitle)}>{deal?.name}</h1>
                  <Badge
                    className={cn(
                      "h-5 gap-1 border-transparent bg-primary-50 px-1.5 text-primary-700 dark:bg-primary-950 dark:text-primary-300",
                      crmType.badgeSemibold
                    )}
                  >
                    <Sparkles className="size-3" />
                    {probabilityLabel} win
                  </Badge>
                  {priority ? (
                    <Badge
                      variant="outline"
                      className={cn(
                        "h-5 px-1.5 ring-1",
                        crmType.badgeSemibold,
                        DEAL_PRIORITY_STYLES[priority]
                      )}
                    >
                      {priority}
                    </Badge>
                  ) : null}
                </div>
                <p className={cn("mt-1.5", crmType.meta)}>
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">
                    {owner.name}
                  </span>
                  <span className="text-neutral-300"> · </span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {probabilityLabel}
                  </span>{" "}
                  win likelihood
                  {deal?.expectedCloseDate ? (
                    <>
                      <span className="text-neutral-300"> · </span>
                      Close {formatLeadCalendarDate(deal.expectedCloseDate)}
                    </>
                  ) : null}
                </p>
              </div>
            </div>

            <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
              <DealStageBadgeMenu
                deal={deal}
                stages={stages}
                stage={stage}
                stageBadgeClass={stageBadgeClass}
                onChangeStage={onChangeStage}
              />
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
                Edit deal
              </Button>
            </div>
          </header>
        </div>

        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 px-6 py-4 sm:grid-cols-2 lg:grid-cols-3">
          <OverviewGridItem label="Deal value">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {formatDealAmount(deal?.amount, deal?.currency)}
            </span>
          </OverviewGridItem>
          <OverviewGridItem label="Lead source" value={deal?.leadSource} />
          <OverviewGridItem
            label="Pipeline"
            value={deal?.pipelineName || DEFAULT_PIPELINE_NAME}
          />
          <OverviewGridItem label="Priority" value={priority} />
          <OverviewGridItem
            label="Created"
            value={formatLeadCalendarDate(deal?.createdAt)}
          />
          <OverviewGridItem label="Deal ID" value={formatDealCode(deal?.id)} />
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
              <TabsTrigger value="activity" className={crmType.tabLine}>
                Activity
              </TabsTrigger>
            </TabsList>

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
                          <span className={crmType.bodySemibold}>{item.author}</span>
                          {item.date ? (
                            <span className={crmType.helper}>{item.date}</span>
                          ) : null}
                        </div>
                        {item.body ? (
                          <p className={cn("mt-1.5 whitespace-pre-wrap", crmType.noteBody)}>
                            <NoteBodyWithMentions body={item.body} members={owners} />
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
              <DealDetailTasksTab
                deal={deal}
                companyName={companyName}
                tasks={tasks}
                owners={owners}
                currentUserId={currentUserId}
                onCreateTask={onCreateTask}
                onUpdateTask={onUpdateTask}
                onDeleteTask={onDeleteTask}
              />
            </TabsContent>

            <TabsContent value="meeting" className="mt-3 w-full min-w-0">
              <DealDetailMeetingsTab
                deal={deal}
                companyName={companyName}
                activities={activities}
                contacts={relatedContacts}
                currentUserId={currentUserId}
                onCreateMeeting={onCreateMeeting}
                onUpdateMeeting={onUpdateMeeting}
                onDeleteMeeting={onDeleteMeeting}
              />
            </TabsContent>

            <TabsContent value="activity" className="mt-3 space-y-3">
              <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
                <SectionLabel>Pipeline progress</SectionLabel>
                <div className="mb-4 flex flex-wrap gap-2">
                  {progressStages.map((s, index) => {
                    const done = stageIndex >= 0 && index <= stageIndex;
                    const current = s.id === deal?.stageId;
                    return (
                      <div
                        key={s.id}
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[11px] font-medium ring-1",
                          done
                            ? "bg-primary-50 text-primary-800 ring-primary-200 dark:bg-primary-950 dark:text-primary-200"
                            : "bg-neutral-50 text-neutral-500 ring-neutral-200 dark:bg-neutral-900",
                          current && "ring-2 ring-primary-500"
                        )}
                      >
                        {s.name}
                      </div>
                    );
                  })}
                </div>
                <SectionLabel>Activity</SectionLabel>
                {activity.length ? (
                  <ol>
                    {activity.map((item, index) => (
                      <li key={item.id} className="relative flex gap-3 pb-6 last:pb-0">
                        {index < activity.length - 1 ? (
                          <span
                            aria-hidden="true"
                            className="absolute top-3 left-[5px] h-[calc(100%-6px)] w-px bg-neutral-200 dark:bg-neutral-800"
                          />
                        ) : null}
                        <span
                          aria-hidden="true"
                          className="relative z-10 mt-1.5 size-2.5 shrink-0 rounded-full bg-primary-500 ring-4 ring-white dark:ring-neutral-950"
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
                        {item.time ? (
                          <p
                            className={cn(
                              "shrink-0 pt-0.5 text-right whitespace-nowrap",
                              crmType.helper
                            )}
                          >
                            {item.time}
                          </p>
                        ) : null}
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
          </Tabs>
        </SectionPanel>

        <aside className="flex flex-col gap-4">
          <SectionPanel padding="p-4">
            <RelatedSidebarSection
              title="Companies"
              count={linkedCompanies.length}
              addAction={
                onPatchDeal ? (
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
                        onUnlink={onPatchDeal ? handleUnlinkCompany : undefined}
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
                onPatchDeal ? (
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
                          onPatchDeal && canUnlinkDealContact(row, deal)
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

          {deal?.description?.trim() ? (
            <SectionPanel padding="p-4">
              <SectionLabel>About this deal</SectionLabel>
              <p className={cn("whitespace-pre-wrap", crmType.metaLeading)}>
                {deal.description.trim()}
              </p>
            </SectionPanel>
          ) : (
            <SectionPanel padding="p-4" className="border-dashed">
              <p className="flex items-center gap-1.5 text-[13px] font-semibold text-neutral-800 dark:text-neutral-100">
                <Building2 className="size-4 text-primary-600" />
                Deal description
              </p>
              <p className={cn("mt-2", crmType.metaLeading)}>
                Add context about scope, competitors, or blockers from Edit deal.
              </p>
              <Button
                type="button"
                className="mt-3 w-full rounded-lg bg-primary-600 text-white hover:bg-primary-700"
                onClick={onEdit}
              >
                Edit deal
              </Button>
            </SectionPanel>
          )}
        </aside>
      </div>

      {onPatchDeal ? (
        <DealRelatedAddDialogs
          addType={addType}
          addMode={addMode}
          onAddTypeChange={(type) => {
            if (!type) closeRelatedAdd();
            else setAddType(type);
          }}
          deal={deal}
          companies={companies}
          contacts={contacts}
          currentUserId={currentUserId}
          onPatchDeal={onPatchDeal}
          onCompanyCreated={onCompanyCreated}
          onContactCreated={onContactCreated}
        />
      ) : null}
    </div>
  );
}
