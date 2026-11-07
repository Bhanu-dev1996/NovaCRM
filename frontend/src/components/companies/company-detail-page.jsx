"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Lightbulb, Loader2, Plus, Sparkles, SquarePen, Unlink } from "lucide-react";
import { toast } from "sonner";

import {
  COMPANY_STATUS_STYLES,
  COMPANY_TYPE_STYLES,
  companyInitials,
  formatCompanyRevenue,
  locationLabel,
} from "@/components/companies/companies-data";
import { fullName, ownerById } from "@/components/contacts/contacts-data";
import {
  LeadDetailMeetingsTab,
  resolveLeadMeetings,
} from "@/components/leads/lead-detail-meetings";
import {
  LeadDetailTasksTab,
  leadTaskCount,
} from "@/components/leads/lead-detail-tasks";
import {
  dealStageLabel,
  formatDealMoney,
  resolveLinkedDeals,
} from "@/components/leads/lead-related-data";
import {
  LEAD_STATUS_STYLES,
  fullName as leadFullName,
} from "@/components/leads/leads-data";
import {
  parseLeadNotes,
  serializeNote,
} from "@/components/leads/lead-detail-sheet";
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

function SectionLabel({ children, action }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2">
      <p className={crmType.sectionLabel}>{children}</p>
      {action}
    </div>
  );
}

function OverviewGridItem({ label, value, children }) {
  return (
    <div className="min-w-0">
      <p className={crmType.recordLabel}>{label}</p>
      <div className={cn("mt-1", crmType.recordValue)}>
        {children ?? (
          <span className="block truncate">{value?.toString?.().trim() ? value : "—"}</span>
        )}
      </div>
    </div>
  );
}

function formatCompanyCode(id) {
  const compact = String(id || "")
    .replace(/-/g, "")
    .slice(-6)
    .toUpperCase();
  return compact ? `CO-${compact}` : "CO-000000";
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

function ContactSidebarCard({ contact, onUnlink, unlinking }) {
  const name = fullName(contact);
  return (
    <div className="relative rounded-lg border border-neutral-200 bg-neutral-50/60 p-3 pr-10 dark:border-neutral-800 dark:bg-neutral-900/40">
      {onUnlink ? (
        <UnlinkRecordButton
          label={`Unlink ${name}`}
          unlinking={unlinking}
          onClick={onUnlink}
        />
      ) : null}
      <Link href={`/contacts/${contact.id}`} className={crmType.linkTitle}>
        {name}
      </Link>
      {contact.title ? (
        <p className={cn("mt-1 truncate", crmType.meta)}>{contact.title}</p>
      ) : null}
      {contact.email ? (
        <p className={cn("mt-0.5 truncate", crmType.helper)}>{contact.email}</p>
      ) : null}
    </div>
  );
}

function noteAuthorInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "TM";
}

function companyAsLeadContext(company, linkedContacts) {
  return {
    id: company.id,
    firstName: company.name,
    lastName: "",
    email: "",
    phone: company.phone,
    company: company.name,
    title: company.industry,
    notes: company.notes,
    createdAt: company.createdAt,
    companyId: company.id,
    related: {
      contactIds: linkedContacts.map((row) => row.id),
      companyIds: [company.id],
    },
  };
}

function resolveCompanyLeads(leads, company) {
  const companyId = String(company.id);
  const name = String(company.name || "")
    .trim()
    .toLowerCase();
  const seen = new Set();
  const out = [];

  function push(lead) {
    if (!lead?.id || seen.has(String(lead.id))) return;
    seen.add(String(lead.id));
    out.push(lead);
  }

  for (const id of company.relatedLeadIds || []) {
    push((leads || []).find((row) => String(row.id) === String(id)));
  }

  for (const lead of leads || []) {
    if (String(lead.companyId) === companyId) {
      push(lead);
      continue;
    }
    if (name && String(lead.company || "").trim().toLowerCase() === name) {
      push(lead);
      continue;
    }
    if ((lead.related?.companyIds || []).map(String).includes(companyId)) {
      push(lead);
    }
  }

  return out;
}

function resolveCompanyDeals(deals, company, linkedLeads, contacts) {
  const companyId = String(company.id);
  const seen = new Set();
  const out = [];

  function push(deal) {
    if (!deal?.id || seen.has(String(deal.id))) return;
    seen.add(String(deal.id));
    out.push(deal);
  }

  for (const id of company.relatedDealIds || []) {
    push((deals || []).find((row) => String(row.id) === String(id)));
  }

  for (const deal of deals || []) {
    if (String(deal.company_id) === companyId) push(deal);
  }

  for (const lead of linkedLeads || []) {
    for (const deal of resolveLinkedDeals(deals, lead, contacts)) {
      push(deal);
    }
  }

  return out;
}

function buildCompanyActivity(company) {
  const items = [];
  if (company.updatedAt) {
    items.push({
      id: `${company.id}-updated`,
      type: "note",
      title: "Company updated",
      detail: company.status
        ? `Status: ${company.status}`
        : "Profile or activity fields changed",
      time: formatLeadCalendarDate(company.updatedAt),
    });
  }
  items.push({
    id: `${company.id}-created`,
    type: "created",
    title: "Company created",
    detail: company.industry ? `Industry: ${company.industry}` : "New organization record",
    time: formatLeadCalendarDate(company.createdAt),
  });
  return items;
}

function canUnlinkCompanyLead(company, lead) {
  if ((company.relatedLeadIds || []).map(String).includes(String(lead.id))) {
    return true;
  }
  if (String(lead.companyId) === String(company.id)) return true;
  return (lead.related?.companyIds || [])
    .map(String)
    .includes(String(company.id));
}

function canUnlinkCompanyDeal(company, deal) {
  if ((company.relatedDealIds || []).map(String).includes(String(deal.id))) {
    return true;
  }
  return String(deal.company_id) === String(company.id);
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

function AssociateContactDialog({
  open,
  onOpenChange,
  options,
  onPick,
  linkingId,
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((row) => row.label.toLowerCase().includes(q));
  }, [options, query]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Add contact" description="Link existing contacts to this company.">
        <DialogBody className="space-y-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contacts…"
            autoFocus
          />
          <ul className="max-h-64 overflow-y-auto rounded-lg border divide-y dark:divide-neutral-800">
            {filtered.length ? (
              filtered.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-muted/50 disabled:opacity-60"
                    disabled={Boolean(linkingId)}
                    onClick={() => onPick(row.id)}
                  >
                    <span className="font-medium">{row.label}</span>
                    {linkingId === String(row.id) ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : null}
                  </button>
                </li>
              ))
            ) : (
              <li className="px-3 py-8 text-center text-sm text-muted-foreground">
                No contacts available.
              </li>
            )}
          </ul>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CompanyDetailPage({
  company,
  owners,
  contacts = [],
  leads = [],
  deals = [],
  tasks = [],
  activities = [],
  currentUserId,
  linkedContacts,
  linkableContacts,
  onEdit,
  onAddNote,
  onLinkContact,
  onUnlinkContact,
  onLinkLead,
  onUnlinkLead,
  onLinkDeal,
  onUnlinkDeal,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onCreateMeeting,
  onUpdateMeeting,
  onDeleteMeeting,
  linkingContactId,
  unlinkingContactId,
}) {
  const [tab, setTab] = useState("notes");
  const [associateOpen, setAssociateOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [postingNote, setPostingNote] = useState(false);
  const [unlinkingLeadId, setUnlinkingLeadId] = useState(null);
  const [unlinkingDealId, setUnlinkingDealId] = useState(null);

  const owner = ownerById(company.ownerId, owners);
  const authorName = ownerById(currentUserId, owners).name || "You";

  const leadContext = useMemo(
    () => companyAsLeadContext(company, linkedContacts),
    [company, linkedContacts]
  );

  const parsedNotes = useMemo(() => parseLeadNotes(company.notes), [company.notes]);

  const linkedLeads = useMemo(
    () => resolveCompanyLeads(leads, company),
    [leads, company]
  );

  const linkedDeals = useMemo(
    () => resolveCompanyDeals(deals, company, linkedLeads, contacts),
    [deals, company, linkedLeads, contacts]
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

  const activity = useMemo(() => buildCompanyActivity(company), [company]);

  const relatedTaskCount = useMemo(
    () => leadTaskCount(tasks, leadContext),
    [tasks, leadContext]
  );
  const relatedMeetingCount = useMemo(
    () =>
      resolveLeadMeetings(activities, leadContext, contacts, [company]).length,
    [activities, leadContext, contacts, company]
  );

  const website = company.website?.trim();
  const websiteHref = website
    ? website.startsWith("http")
      ? website
      : `https://${website}`
    : company.domain
      ? `https://${company.domain.replace(/^https?:\/\//, "")}`
      : null;
  const websiteLabel = website
    ? website.replace(/^https?:\/\//, "").replace(/\/$/, "")
    : company.domain || "";

  const recommendations = useMemo(() => {
    const items = [];
    if (!linkedContacts.length) {
      items.push("Link stakeholders in the Contacts panel so outreach stays organized.");
    }
    if (!linkedDeals.length) {
      items.push("Attach an open deal to track pipeline value for this account.");
    }
    if (!company.description?.trim()) {
      items.push("Add a short account description in Edit company for your team.");
    }
    if (items.length < 3) {
      items.push("Log calls and emails on Activity to build a complete account history.");
    }
    return items.slice(0, 3);
  }, [linkedContacts.length, linkedDeals.length, company.description]);

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

  const metaSubtitle = [company.industry, locationLabel(company)]
    .filter((part) => part && part !== "—")
    .join(" · ");

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
              {company.logoUrl ? (
                <img
                  src={company.logoUrl}
                  alt=""
                  className="size-11 rounded-xl object-cover"
                />
              ) : (
                companyInitials(company.name)
              )}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className={cn("truncate", crmType.pageTitle)}>{company.name}</h1>
                {company.companyType ? (
                  <Badge
                    variant="outline"
                    className={cn(
                      "h-5 border-transparent px-1.5",
                      crmType.badgeSemibold,
                      COMPANY_TYPE_STYLES[company.companyType] ||
                        COMPANY_TYPE_STYLES.Other
                    )}
                  >
                    {company.companyType}
                  </Badge>
                ) : null}
                {company.status ? (
                  <Badge
                    variant="outline"
                    className={cn(
                      "h-5 border-transparent px-1.5",
                      crmType.badgeSemibold,
                      COMPANY_STATUS_STYLES[company.status] ||
                        COMPANY_STATUS_STYLES.Active
                    )}
                  >
                    {company.status}
                  </Badge>
                ) : null}
              </div>
              <p className={cn("mt-1.5", crmType.meta)}>
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  {owner.name}
                </span>
                {metaSubtitle ? (
                  <>
                    <span className="text-neutral-300"> · </span>
                    <span className="text-neutral-600 dark:text-neutral-400">
                      {metaSubtitle}
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
              Edit company
            </Button>
          </div>
        </header>

        <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 border-t border-neutral-100 pt-4 sm:grid-cols-2 lg:grid-cols-3 dark:border-neutral-800">
          <OverviewGridItem label="Website">
            {websiteHref && websiteLabel ? (
              <a
                href={websiteHref}
                target="_blank"
                rel="noreferrer"
                className={cn("block truncate", crmType.linkMeta)}
              >
                {websiteLabel}
              </a>
            ) : (
              <span className="block truncate">—</span>
            )}
          </OverviewGridItem>
          <OverviewGridItem label="Phone" value={company.phone} />
          <OverviewGridItem label="Industry" value={company.industry} />
          <OverviewGridItem label="Company size" value={company.size} />
          <OverviewGridItem label="Location" value={locationLabel(company)} />
          <OverviewGridItem
            label="Annual revenue"
            value={formatCompanyRevenue(company.annualRevenue)}
          />
          <OverviewGridItem label="Founded" value={company.foundedYear} />
          <OverviewGridItem label="Domain" value={company.domain} />
          <OverviewGridItem
            label="Created"
            value={formatLeadCalendarDate(company.createdAt)}
          />
          <OverviewGridItem label="Company ID" value={formatCompanyCode(company.id)} />
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
                companies={[company]}
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
                      description="Search and select a lead to associate with this company."
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
                            {canUnlinkCompanyLead(company, lead) && onUnlinkLead ? (
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
                      description="Search and select a deal to associate with this company."
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
                            {canUnlinkCompanyDeal(company, deal) && onUnlinkDeal ? (
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
            <SectionLabel
              action={
                <Button
                  type="button"
                  variant="link"
                  className={cn("h-auto gap-1 px-0", crmType.linkGhost)}
                  onClick={() => setAssociateOpen(true)}
                >
                  <Plus className="size-3.5" />
                  Add contact
                </Button>
              }
            >
              Contacts
            </SectionLabel>
            {linkedContacts.length ? (
              <ul className="max-h-[min(320px,50vh)] space-y-2 overflow-y-auto pr-0.5">
                {linkedContacts.map((contact) => (
                  <li key={contact.id}>
                    <ContactSidebarCard
                      contact={contact}
                      unlinking={unlinkingContactId === contact.id}
                      onUnlink={() => onUnlinkContact?.(contact.id)}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p
                className={cn(
                  "rounded-lg border border-dashed border-neutral-200 px-3 py-6 text-center dark:border-neutral-800",
                  crmType.dashedEmpty
                )}
              >
                No contacts linked. Use Add contact to associate people with this company.
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
              Account insights
            </p>
            <p className={cn("mt-2", crmType.metaLeading)}>
              {company.description?.trim()
                ? "Account narrative is on file — keep notes and activity updated for the team."
                : "Add a description and notes to build a shared picture of this account."}
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-3 w-full rounded-lg"
              onClick={onEdit}
            >
              Update company
            </Button>
          </SectionPanel>
        </aside>
      </div>

      <AssociateContactDialog
        open={associateOpen}
        onOpenChange={setAssociateOpen}
        options={linkableContacts}
        linkingId={linkingContactId}
        onPick={async (id) => {
          await onLinkContact?.(id);
          setAssociateOpen(false);
        }}
      />
    </div>
  );
}
