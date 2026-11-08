"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowDownUp,
  BadgeCheck,
  Building2,
  Clock,
  Columns3,
  Copy,
  Download,
  Filter,
  GripVertical,
  Kanban,
  LayoutList,
  Loader2,
  Plus,
  SquarePen,
  Search,
  Sparkles,
  Trash2,
  TrendingUp,
  Upload,
  Users,
  Eye,
  X,
} from "lucide-react";

import { LeadFormDrawer } from "@/components/leads/lead-form-drawer";
import {
  fromApiLead,
  mapMemberToOwner,
  toApiLead,
} from "@/components/leads/lead-api";
import { parseLeadCsvFile } from "@/components/leads/lead-import";
import { CsvImportDialog } from "@/components/shared/csv-import-dialog";
import {
  LEAD_OWNERS,
  LEAD_SOURCES,
  LEAD_SOURCE_STYLES,
  LEAD_STATUS_STYLES,
  LEAD_STATUSES,
  fullName,
  ownerById,
} from "@/components/leads/leads-data";
import { apiFetch } from "@/lib/api";
import { formatLeadCalendarDate } from "@/lib/lead-dates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { LeadsSkeleton } from "@/components/leads/lead-skeletons";
import { crmType } from "@/lib/crm-typography";
import { cn } from "@/lib/utils";

export { LeadsSkeleton } from "@/components/leads/lead-skeletons";

const ALL_COLUMNS = [
  { id: "name", label: "Lead Name" },
  { id: "company", label: "Company" },
  { id: "title", label: "Job Title" },
  { id: "source", label: "Lead Source" },
  { id: "score", label: "Lead Score" },
  { id: "status", label: "Status" },
  { id: "owner", label: "Lead Owner" },
  { id: "lastContacted", label: "Last Contacted" },
  { id: "createdAt", label: "Created Date" },
];

const DEFAULT_VISIBLE_COLUMNS = [
  "name",
  "company",
  "source",
  "score",
  "status",
  "owner",
];

const PAGE_SIZES = [10, 20, 40, 50, 100];

const STAGE_COLORS = {
  New: "bg-sky-500",
  Contacted: "bg-orange-500",
  Qualified: "bg-cyan-500",
  Nurturing: "bg-violet-500",
  Converted: "bg-emerald-500",
  Lost: "bg-red-500",
};

const OPEN_LEAD_STATUSES = ["New", "Contacted", "Qualified", "Nurturing"];
const HIGH_SCORE = 70;
const STALE_DAYS = 7;

function formatCount(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function daysSinceContact(value) {
  if (!value) return Number.POSITIVE_INFINITY;
  const iso = String(value).slice(0, 10);
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return Number.POSITIVE_INFINITY;
  const then = Date.UTC(year, month - 1, day);
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor((today - then) / 86_400_000);
}

function followUpTargets(leads) {
  const stale = leads.filter(
    (lead) =>
      OPEN_LEAD_STATUSES.includes(lead.status) &&
      Number(lead.score) >= HIGH_SCORE &&
      daysSinceContact(lead.lastContacted) >= STALE_DAYS
  );
  if (stale.length) return stale;
  return leads
    .filter((lead) => OPEN_LEAD_STATUSES.includes(lead.status))
    .sort((a, b) => Number(b.score) - Number(a.score))
    .slice(0, 3);
}

function topOpenLeads(leads, limit = 3) {
  return leads
    .filter((lead) => OPEN_LEAD_STATUSES.includes(lead.status))
    .sort((a, b) => Number(b.score) - Number(a.score))
    .slice(0, limit);
}

function sourcePerformance(leads) {
  const groups = new Map();
  for (const lead of leads) {
    const source = lead.source || "Unknown";
    if (!groups.has(source)) {
      groups.set(source, { source, total: 0, qualified: 0 });
    }
    const row = groups.get(source);
    row.total += 1;
    if (lead.status === "Qualified" || lead.status === "Converted") {
      row.qualified += 1;
    }
  }
  return [...groups.values()]
    .map((row) => ({
      ...row,
      rate: row.total ? Math.round((row.qualified / row.total) * 100) : 0,
    }))
    .sort((a, b) => b.rate - a.rate || b.total - a.total);
}

function buildFollowUpDraft(targets) {
  if (targets.length === 1) {
    const lead = targets[0];
    const first = lead.firstName || fullName(lead);
    const company = lead.company || "your team";
    return `Hi ${first},\n\nI wanted to follow up on NovaCRM for ${company}. Based on where things left off, a 20-minute architecture review would help us map the right rollout and next steps.\n\nWould tomorrow or Thursday work?\n\nBest,\nNovaCRM`;
  }
  return `Hi,\n\nI wanted to follow up on NovaCRM. A few high-fit accounts have gone quiet, and a short architecture review would help us pick up where we left off.\n\nWould tomorrow or Thursday work for 20 minutes?\n\nBest,\nNovaCRM`;
}

function serializeAiNote(body) {
  const iso = new Date().toISOString().slice(0, 10);
  return `[Nova AI | ${iso}]\n${body}`;
}

function tomorrowAt(hours, minutes) {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function isSameMonth(value, reference = new Date()) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth()
  );
}

function summaryIcon(name) {
  switch (name) {
    case "users":
      return Users;
    case "sparkles":
      return Sparkles;
    case "badge-check":
      return BadgeCheck;
    case "trending-up":
      return TrendingUp;
    default:
      return Users;
  }
}

function formatDate(value) {
  return formatLeadCalendarDate(value);
}

function scoreRingColor(score) {
  if (score >= 80) {
    return {
      stroke: "#10b981",
      text: "text-emerald-700 dark:text-emerald-300",
    };
  }
  if (score >= 60) {
    return {
      stroke: "#f59e0b",
      text: "text-amber-700 dark:text-amber-300",
    };
  }
  return {
    stroke: "#94a3b8",
    text: "text-neutral-600 dark:text-neutral-300",
  };
}

function ScoreRing({ score, size = 36, strokeWidth = 3 }) {
  const value = Math.max(0, Math.min(100, Number(score) || 0));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const tone = scoreRingColor(value);

  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      title={`Score ${value}`}
      aria-label={`Lead score ${value}`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-neutral-200 dark:text-neutral-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tone.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span
        className={cn(
          "absolute text-xs font-semibold tabular-nums",
          tone.text
        )}
      >
        {value}
      </span>
    </span>
  );
}

function TruncateText({ value, className }) {
  const text = value || "—";
  const ref = useRef(null);
  const [tooltip, setTooltip] = useState(null);

  function showTooltip() {
    const node = ref.current;
    if (!node || !text || text === "—") return;
    const rect = node.getBoundingClientRect();
    setTooltip({
      text,
      top: Math.max(8, rect.top - 8),
      left: Math.min(
        window.innerWidth - 16,
        Math.max(16, rect.left + rect.width / 2)
      ),
    });
  }

  return (
    <>
      <span
        ref={ref}
        className={cn("block w-full min-w-0 truncate", className)}
        onMouseEnter={showTooltip}
        onMouseLeave={() => setTooltip(null)}
      >
        {text}
      </span>
      {tooltip
        ? createPortal(
            <div
              role="tooltip"
              style={{
                position: "fixed",
                top: tooltip.top,
                left: tooltip.left,
                transform: "translate(-50%, -100%)",
                zIndex: 9999,
                width: "max-content",
                maxWidth: "min(20rem, calc(100vw - 24px))",
                padding: "6px 10px",
                borderRadius: "6px",
                backgroundColor: "#0f172a",
                color: "#fff",
                fontSize: "12px",
                lineHeight: "1.35",
                whiteSpace: "nowrap",
                pointerEvents: "none",
                boxShadow: "0 8px 24px rgba(15, 23, 42, 0.18)",
              }}
            >
              {tooltip.text}
            </div>,
            document.body
          )
        : null}
    </>
  );
}

function initials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function KanbanLeadCard({
  lead,
  owner,
  isDragging,
  onDragStart,
  onDragEnd,
  onOpen,
}) {
  const name = fullName(lead);
  const contacted = lead.lastContacted
    ? formatDate(lead.lastContacted)
    : "No contact";

  return (
    <article
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      className={cn(
        "group relative cursor-grab rounded-xl bg-white p-3 text-left shadow-[0_1px_2px_rgba(15,23,42,0.05)] ring-1 ring-neutral-200/80 transition-all",
        "hover:-translate-y-0.5 hover:shadow-[0_10px_22px_-8px_rgba(15,23,42,0.18)] hover:ring-neutral-300",
        "active:cursor-grabbing",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40",
        "dark:bg-neutral-900 dark:ring-neutral-800 dark:hover:ring-neutral-700",
        isDragging &&
          "scale-[0.98] opacity-50 shadow-none ring-primary-300 dark:ring-primary-700"
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-y-3 left-0 w-[3px] rounded-full",
          STAGE_COLORS[lead.status] || "bg-neutral-400"
        )}
      />

      <div className="flex items-start gap-2.5 pl-1.5">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-[11px] font-semibold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
          {initials(name)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold tracking-[-0.01em] text-neutral-900 dark:text-neutral-50">
                {name}
              </p>
              {lead.title ? (
                <p className="mt-0.5 truncate text-[11px] text-neutral-500">
                  {lead.title}
                </p>
              ) : null}
            </div>
            <ScoreRing score={lead.score} size={32} strokeWidth={3} />
          </div>
          {lead.company ? (
            <p className="mt-1.5 flex min-w-0 items-center gap-1.5 text-[12px] text-neutral-600 dark:text-neutral-300">
              <Building2 className="size-3 shrink-0 text-neutral-400" />
              <span className="truncate">{lead.company}</span>
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 pl-1.5">
        {lead.source ? (
          <Badge
            variant="outline"
            className={cn(
              "h-5 max-w-[70%] overflow-hidden border-transparent text-[10px]",
              LEAD_SOURCE_STYLES[lead.source] || LEAD_SOURCE_STYLES.Manual
            )}
          >
            <span className="truncate">{lead.source}</span>
          </Badge>
        ) : (
          <span />
        )}
        <GripVertical className="size-3.5 text-neutral-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-neutral-600" />
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-neutral-100 pt-2.5 pl-1.5 dark:border-neutral-800">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-semibold">
            {owner.initials}
          </span>
          <span className="truncate text-[11px] text-neutral-500">
            {owner.name}
          </span>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 text-[11px]",
            lead.lastContacted
              ? "text-neutral-400"
              : "text-amber-600 dark:text-amber-400"
          )}
        >
          <Clock className="size-3" />
          {contacted}
        </span>
      </div>
    </article>
  );
}

export function LeadsHome() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loadStatus, setLoadStatus] = useState("loading");
  const [leads, setLeads] = useState([]);
  const [owners, setOwners] = useState(LEAD_OWNERS);
  const [currentUserId, setCurrentUserId] = useState("");
  const [view, setView] = useState("table");
  const [query, setQuery] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [draftOwnerFilter, setDraftOwnerFilter] = useState("all");
  const [draftStatusFilter, setDraftStatusFilter] = useState("all");
  const [draftSourceFilter, setDraftSourceFilter] = useState("all");
  const [sortKey, setSortKey] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_VISIBLE_COLUMNS);
  const [formOpen, setFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [convertLead, setConvertLead] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiAction, setAiAction] = useState(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [followUpDraft, setFollowUpDraft] = useState("");
  const [dragId, setDragId] = useState(null);
  const [dragOverStatus, setDragOverStatus] = useState(null);
  const [deletePrompt, setDeletePrompt] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadStatus("loading");
      try {
        const [ws, list, members] = await Promise.all([
          apiFetch("/api/workspace"),
          apiFetch("/api/leads?order_by=created_at&limit=500"),
          apiFetch("/api/workspace/members"),
        ]);
        if (cancelled) return;
        const mappedOwners = (members.data || []).map(mapMemberToOwner);
        setOwners(mappedOwners.length ? mappedOwners : LEAD_OWNERS);
        setCurrentUserId(ws.user?.id || "");
        setLeads((list.data || []).map(fromApiLead));
        setLoadStatus("ready");
      } catch (error) {
        if (!cancelled) {
          toast.error(error.message || "Could not load leads");
          setLoadStatus("error");
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loadStatus !== "ready") return;
    window.dispatchEvent(
      new CustomEvent("novacrm:leads-count-changed", {
        detail: { count: leads.length },
      })
    );
  }, [leads.length, loadStatus]);

  useEffect(() => {
    const action = searchParams.get("action");
    const status = searchParams.get("status");
    const source = searchParams.get("source");
    if (action === "create") setFormOpen(true);
    if (status) setStatusFilter(status);
    if (source) {
      const match = LEAD_SOURCES.find(
        (item) => item.toLowerCase() === source.toLowerCase()
      );
      if (match) setSourceFilter(match);
    }
  }, [searchParams]);

  const activeFilterCount = [
    ownerFilter !== "all",
    statusFilter !== "all",
    sourceFilter !== "all",
    query.trim().length > 0,
  ].filter(Boolean).length;

  const filteredLeads = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = leads.filter((lead) => {
      if (ownerFilter !== "all" && lead.ownerId !== ownerFilter) return false;
      if (statusFilter !== "all" && lead.status !== statusFilter) return false;
      if (sourceFilter !== "all" && lead.source !== sourceFilter) return false;
      if (!q) return true;
      const haystack = `${fullName(lead)} ${lead.email} ${lead.company}`.toLowerCase();
      return haystack.includes(q);
    });

    rows = [...rows].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "name") {
        return fullName(a).localeCompare(fullName(b)) * dir;
      }
      if (sortKey === "score") return (a.score - b.score) * dir;
      if (sortKey === "owner") {
        return (
          ownerById(a.ownerId, owners).name.localeCompare(
            ownerById(b.ownerId, owners).name
          ) * dir
        );
      }
      const av = a[sortKey] || "";
      const bv = b[sortKey] || "";
      return String(av).localeCompare(String(bv)) * dir;
    });

    return rows;
  }, [
    leads,
    owners,
    query,
    ownerFilter,
    statusFilter,
    sourceFilter,
    sortKey,
    sortDir,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / pageSize));
  const pageRows = filteredLeads.slice((page - 1) * pageSize, page * pageSize);
  const draftTargets = useMemo(() => followUpTargets(leads), [leads]);
  const nextActionLeads = useMemo(() => topOpenLeads(leads, 3), [leads]);
  const sourceStats = useMemo(() => sourcePerformance(leads), [leads]);
  const aiInsights = useMemo(() => {
    const staleCount = leads.filter(
      (lead) =>
        OPEN_LEAD_STATUSES.includes(lead.status) &&
        Number(lead.score) >= HIGH_SCORE &&
        daysSinceContact(lead.lastContacted) >= STALE_DAYS
    ).length;
    const referral = sourceStats.find((row) => row.source === "Referral");
    const topSource = sourceStats[0];
    const topLead = nextActionLeads[0];
    return [
      {
        id: "draft",
        title: "Follow-up gap",
        body: staleCount
          ? `${staleCount} high-scoring lead${staleCount === 1 ? " has" : "s have"} not been contacted in ${STALE_DAYS} days.`
          : "No high-scoring leads are overdue. Draft a follow-up for the top open accounts instead.",
        action: "Draft Follow-up",
      },
      {
        id: "explain",
        title: "Source advantage",
        body: referral
          ? `Referral leads have a ${referral.rate}% qualification rate this month (${referral.qualified} of ${referral.total}).`
          : topSource
            ? `${topSource.source} is the strongest source this month at ${topSource.rate}%.`
            : "Add more sourced leads to compare qualification rates.",
        action: "Explain Insight",
      },
      {
        id: "next",
        title: "Next best action",
        body: topLead
          ? `Recommended next action: Schedule a follow-up with ${fullName(topLead)} and other top-scoring open leads.`
          : "No open leads need a follow-up right now.",
        action: "Recommend Next Action",
      },
    ];
  }, [leads, nextActionLeads, sourceStats]);

  const leadStages = useMemo(
    () =>
      LEAD_STATUSES.map((status) => ({
        id: status,
        label: status,
        color: STAGE_COLORS[status] || "bg-neutral-400",
        count: leads.filter((lead) => lead.status === status).length,
      })),
    [leads]
  );

  const leadSummary = useMemo(() => {
    const total = leads.length;
    const newThisMonth = leads.filter((lead) =>
      isSameMonth(lead.createdAt)
    ).length;
    const qualified = leads.filter((lead) => lead.status === "Qualified").length;
    const converted = leads.filter((lead) => lead.status === "Converted").length;
    const conversionRate = total
      ? `${((converted / total) * 100).toFixed(1)}%`
      : "0%";

    return [
      {
        id: "total",
        label: "Total Leads",
        value: formatCount(total),
        hint: `${formatCount(filteredLeads.length)} visible with filters`,
        icon: "users",
        iconClass:
          "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300",
      },
      {
        id: "new",
        label: "New This Month",
        value: formatCount(newThisMonth),
        hint: "Created in the current month",
        icon: "sparkles",
        iconClass:
          "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
      },
      {
        id: "qualified",
        label: "Qualified Leads",
        value: formatCount(qualified),
        hint: "Currently in Qualified status",
        icon: "badge-check",
        iconClass:
          "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
      },
      {
        id: "conversion",
        label: "Conversion Rate",
        value: conversionRate,
        hint: `${formatCount(converted)} converted of ${formatCount(total)}`,
        icon: "trending-up",
        iconClass:
          "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
      },
    ];
  }, [leads, filteredLeads.length]);

  useEffect(() => {
    setPage(1);
  }, [query, ownerFilter, statusFilter, sourceFilter, pageSize, view]);

  function clearFilters() {
    setQuery("");
    setOwnerFilter("all");
    setStatusFilter("all");
    setSourceFilter("all");
    setDraftOwnerFilter("all");
    setDraftStatusFilter("all");
    setDraftSourceFilter("all");
  }

  function openFiltersSheet() {
    setDraftOwnerFilter(ownerFilter);
    setDraftStatusFilter(statusFilter);
    setDraftSourceFilter(sourceFilter);
    setFiltersOpen(true);
  }

  function handleFiltersOpenChange(open) {
    if (open) {
      setDraftOwnerFilter(ownerFilter);
      setDraftStatusFilter(statusFilter);
      setDraftSourceFilter(sourceFilter);
    }
    setFiltersOpen(open);
  }

  function clearDraftFilters() {
    setDraftOwnerFilter("all");
    setDraftStatusFilter("all");
    setDraftSourceFilter("all");
  }

  function applyDraftFilters() {
    setOwnerFilter(draftOwnerFilter);
    setStatusFilter(draftStatusFilter);
    setSourceFilter(draftSourceFilter);
    setFiltersOpen(false);
  }

  const draftFilterCount = [
    draftOwnerFilter !== "all",
    draftStatusFilter !== "all",
    draftSourceFilter !== "all",
  ].filter(Boolean).length;

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  }

  function toggleColumn(id) {
    setVisibleColumns((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev;
        return prev.filter((col) => col !== id);
      }
      return [...prev, id];
    });
  }

  function toggleSelect(id) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function toggleSelectAll() {
    if (pageRows.every((row) => selected.includes(row.id))) {
      setSelected((prev) =>
        prev.filter((id) => !pageRows.some((row) => row.id === id))
      );
      return;
    }
    setSelected((prev) => [
      ...new Set([...prev, ...pageRows.map((row) => row.id)]),
    ]);
  }

  function requestBulkDeleteLeads() {
    if (!selected.length) return;
    setDeletePrompt({ mode: "bulk" });
  }

  async function confirmDeleteLeads() {
    if (!deletePrompt) return;
    setDeleting(true);
    try {
      const ids = [...selected];
      await Promise.all(
        ids.map((id) => apiFetch(`/api/leads/${id}`, { method: "DELETE" }))
      );
      setLeads((prev) => prev.filter((lead) => !ids.includes(lead.id)));
      setSelected([]);
      toast.success(ids.length === 1 ? "Lead removed" : "Selected leads removed");
      setDeletePrompt(null);
    } catch (error) {
      toast.error(error.message || "Could not delete leads");
    } finally {
      setDeleting(false);
    }
  }

  async function handleSaveLead(lead, { isEdit }) {
    try {
      const payload = toApiLead(lead);
      const response = isEdit
        ? await apiFetch(`/api/leads/${lead.id}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
          })
        : await apiFetch("/api/leads", {
            method: "POST",
            body: JSON.stringify(payload),
          });
      const saved = fromApiLead(response.data);
      setLeads((prev) => {
        if (isEdit) return prev.map((row) => (row.id === saved.id ? saved : row));
        return [saved, ...prev];
      });
      setEditingLead(null);
    } catch (error) {
      toast.error(error.message || "Could not save lead");
      throw error;
    }
  }

  function openCreate() {
    setEditingLead(null);
    setFormOpen(true);
  }

  function openEdit(lead) {
    setEditingLead(lead);
    setFormOpen(true);
  }

  function openLead(lead) {
    router.push(`/leads/${lead.id}`);
  }

  async function updateStatus(id, status) {
    const previous = leads;
    setLeads((prev) =>
      prev.map((lead) => (lead.id === id ? { ...lead, status } : lead))
    );
    try {
      const response = await apiFetch(`/api/leads/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      const saved = fromApiLead(response.data);
      setLeads((prev) =>
        prev.map((lead) => (lead.id === saved.id ? saved : lead))
      );
    } catch (error) {
      setLeads(previous);
      toast.error(error.message || "Could not update status");
    }
  }

  async function appendLeadNote(id, note) {
    const current = leads.find((row) => row.id === id);
    if (!current) return;
    const notes = current.notes ? `${current.notes}\n\n${note}` : note;
    const response = await apiFetch(`/api/leads/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ notes }),
    });
    const saved = fromApiLead(response.data);
    setLeads((prev) =>
      prev.map((row) => (row.id === saved.id ? saved : row))
    );
    return saved;
  }

  function openAiAction(id) {
    if (id === "draft") {
      setFollowUpDraft(buildFollowUpDraft(draftTargets));
    }
    setAiAction(id);
  }

  function showLeads(targets) {
    setSelected(targets.map((lead) => lead.id));
    setStatusFilter("all");
    setSourceFilter("all");
    setQuery("");
    setAiAction(null);
    setAiOpen(false);
  }

  async function saveFollowUpDrafts() {
    if (!draftTargets.length) {
      toast.error("No open leads to follow up with");
      return;
    }
    setAiBusy(true);
    try {
      const note = serializeAiNote(`Draft follow-up\n${followUpDraft.trim()}`);
      await Promise.all(
        draftTargets.map(async (lead) => {
          await appendLeadNote(lead.id, note);
          await apiFetch("/api/activities", {
            method: "POST",
            body: JSON.stringify({
              type: "email",
              subject: `Follow-up: ${fullName(lead)}`,
              body: followUpDraft.trim(),
              user_id: currentUserId || null,
            }),
          });
        })
      );
      toast.success(
        `Drafted follow-up for ${draftTargets.length} lead${draftTargets.length === 1 ? "" : "s"}`
      );
      showLeads(draftTargets);
    } catch (error) {
      toast.error(error.message || "Could not save follow-up drafts");
    } finally {
      setAiBusy(false);
    }
  }

  async function copyFollowUpDraft() {
    try {
      await navigator.clipboard.writeText(followUpDraft);
      toast.success("Draft copied");
    } catch {
      toast.error("Could not copy draft");
    }
  }

  function viewReferralLeads() {
    setSourceFilter("Referral");
    setStatusFilter("all");
    setQuery("");
    setSelected([]);
    setAiAction(null);
    setAiOpen(false);
    toast.success("Showing referral leads");
  }

  async function scheduleRecommendedFollowUps() {
    if (!nextActionLeads.length) {
      toast.error("No open leads to schedule");
      return;
    }
    setAiBusy(true);
    try {
      const due = tomorrowAt(10, 30);
      await Promise.all(
        nextActionLeads.map((lead) =>
          apiFetch("/api/tasks", {
            method: "POST",
            body: JSON.stringify({
              title: `Follow-up: ${fullName(lead)}`,
              description: `Schedule a 20-min architecture review with ${fullName(lead)}${lead.company ? ` at ${lead.company}` : ""}.`,
              status: "todo",
              priority: Number(lead.score) >= 80 ? "high" : "medium",
              due_at: due.toISOString(),
              assignee_id: currentUserId || null,
            }),
          })
        )
      );
      toast.success(
        `Scheduled ${nextActionLeads.length} follow-up task${nextActionLeads.length === 1 ? "" : "s"} for tomorrow, 10:30 AM`
      );
      setAiAction(null);
      setAiOpen(false);
    } catch (error) {
      toast.error(error.message || "Could not schedule follow-ups");
    } finally {
      setAiBusy(false);
    }
  }

  function openTopRecommendedLead() {
    const lead = nextActionLeads[0];
    if (!lead) {
      toast.error("No open lead to open");
      return;
    }
    setAiAction(null);
    setAiOpen(false);
    router.push(`/leads/${lead.id}`);
  }

  function handleDrop(status) {
    if (!dragId) return;
    updateStatus(dragId, status);
    setDragId(null);
    setDragOverStatus(null);
    toast.success(`Moved to ${status}`);
  }

  if (loadStatus === "loading") return <LeadsSkeleton />;

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[1440px] flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <nav
            className={cn(
              "mb-2 flex items-center gap-1.5",
              crmType.breadcrumb
            )}
          >
            <span>Workspace</span>
            <span className="text-primary-300">/</span>
            <span className="font-medium text-primary-700 dark:text-primary-300">
              Leads
            </span>
          </nav>
          <h1 className="text-[26px] leading-8 font-bold tracking-[-0.03em] text-neutral-900 sm:text-[28px] dark:text-neutral-50">
            Leads
          </h1>
          <p className="mt-1 max-w-[56ch] text-[14px] text-neutral-500">
            Capture, organize, and convert prospects into customers.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-lg"
            onClick={() => setImportOpen(true)}
          >
            <Upload className="size-3.5" />
            Import Leads
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-lg"
            aria-label="Export leads"
            onClick={() => setExportOpen(true)}
          >
            <Download className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-lg border-primary-200 bg-gradient-to-br from-primary-50 via-secondary-50 to-primary-100 text-primary-700 hover:from-primary-100 hover:via-secondary-100 hover:to-primary-200 hover:text-primary-800 dark:border-primary-800 dark:from-primary-950 dark:via-secondary-900/50 dark:to-primary-900 dark:text-primary-300 dark:hover:from-primary-900 dark:hover:via-secondary-900/70 dark:hover:to-primary-800"
            aria-label="AI Lead Insights"
            onClick={() => setAiOpen(true)}
          >
            <Sparkles className="size-4" />
          </Button>
          <Button
            type="button"
            className="h-9 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
            onClick={openCreate}
          >
            <Plus className="size-3.5" />
            Add Lead
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {leadSummary.map((card) => {
          const Icon = summaryIcon(card.icon);
          return (
            <Card key={card.id} className="py-4">
              <CardContent className="px-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[12px] font-medium text-muted-foreground">
                      {card.label}
                    </p>
                    <p className="mt-2 text-[22px] font-bold tracking-[-0.03em]">
                      {card.value}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full",
                      card.iconClass
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                </div>
                <p className="mt-3 text-[11px] font-medium text-muted-foreground">
                  {card.hint}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="min-w-0 w-full overflow-x-auto">
      <div className="flex  flex-nowrap items-center gap-4 rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 dark:border-neutral-800 dark:bg-neutral-950">
        <span className="px-1.5 text-[11px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
          Pipeline:
        </span>
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={cn(
            "inline-flex h-7 items-center rounded-md px-3 text-[13px] font-semibold transition-colors",
            statusFilter === "all"
              ? "bg-primary-600 text-white"
              : "border border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
          )}
        >
          All {formatCount(leads.length)}
        </button>
        {leadStages.map((stage) => {
          const active = statusFilter === stage.id;
          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => setStatusFilter(stage.id)}
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-md border px-3 text-[13px] font-medium transition-colors",
                active
                  ? "border-transparent bg-primary-600 text-white"
                  : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:bg-neutral-900"
              )}
            >
              <span
                className={cn("size-1.5 shrink-0 rounded-full", stage.color)}
              />
              {stage.label} {formatCount(stage.count)}
            </button>
          );
        })}
      </div>
      </div>

      <Card className="overflow-hidden py-0">
        <div className="flex flex-col gap-3 border-b border-neutral-100 p-3 dark:border-neutral-800">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <div className="relative min-w-[280px] max-w-xl flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-neutral-400" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search leads by name, company, or email…"
                  className="h-9 pl-8"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-lg"
                onClick={openFiltersSheet}
              >
                <Filter className="size-3.5" />
                Filters
                {activeFilterCount > 0 ? (
                  <Badge
                    variant="secondary"
                    className="ml-1 h-5 min-w-5 justify-center rounded-full bg-primary-50 px-1.5 text-[10px] text-primary-700"
                  >
                    {activeFilterCount}
                  </Badge>
                ) : null}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 rounded-lg"
                    />
                  }
                >
                  <ArrowDownUp className="size-3.5" />
                  Sort
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-48">
                  {[
                    ["createdAt", "Created date"],
                    ["name", "Lead name"],
                    ["score", "Lead score"],
                    ["status", "Status"],
                    ["owner", "Owner"],
                  ].map(([key, label]) => (
                    <DropdownMenuItem key={key} onClick={() => toggleSort(key)}>
                      {label}
                      {sortKey === key ? ` (${sortDir})` : ""}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 rounded-lg"
                    />
                  }
                >
                  <Columns3 className="size-3.5" />
                  Columns
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  {ALL_COLUMNS.map((col) => {
                    const checked = visibleColumns.includes(col.id);
                    return (
                      <label
                        key={col.id}
                        className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleColumn(col.id)}
                          aria-label={`Toggle ${col.label} column`}
                          className="size-4 rounded-[4px] border-neutral-300 shadow-none data-checked:border-primary-600 data-checked:bg-primary-600 data-checked:text-white dark:border-neutral-600 dark:data-checked:border-primary-600 dark:data-checked:bg-primary-600"
                        />
                        <span>{col.label}</span>
                      </label>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Tabs value={view} onValueChange={setView} className="shrink-0 gap-0">
              <TabsList className="h-9">
                <TabsTrigger value="table" className="gap-1.5 px-2.5">
                  <LayoutList className="size-3.5" />
                  Table
                </TabsTrigger>
                <TabsTrigger value="kanban" className="gap-1.5 px-2.5">
                  <Kanban className="size-3.5" />
                  Kanban
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {activeFilterCount > 0 || selected.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              {activeFilterCount > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                >
                  Clear all filters
                </Button>
              ) : null}
              {selected.length > 0 ? (
                <>
                  <span className="text-[12px] font-medium text-neutral-500">
                    {selected.length} selected
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={requestBulkDeleteLeads}
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const ids = [...selected];
                      try {
                        await Promise.all(
                          ids.map((id) =>
                            apiFetch(`/api/leads/${id}`, {
                              method: "PATCH",
                              body: JSON.stringify({ status: "Qualified" }),
                            })
                          )
                        );
                        setLeads((prev) =>
                          prev.map((lead) =>
                            ids.includes(lead.id)
                              ? { ...lead, status: "Qualified" }
                              : lead
                          )
                        );
                        toast.success("Marked as Qualified");
                      } catch (error) {
                        toast.error(error.message || "Could not update leads");
                      }
                    }}
                  >
                    Mark Qualified
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setExportOpen(true)}
                  >
                    <Download className="size-3.5" />
                    Export
                  </Button>
                </>
              ) : null}
            </div>
          ) : null}
        </div>

        {view === "table" ? (
          <>
            <Table className="min-w-[1100px] table-fixed text-xs">
              <TableHeader>
                <TableRow className="bg-muted/50 text-xs hover:bg-muted/50">
                  <TableHead className="w-10 px-3">
                    <Checkbox
                      checked={
                        pageRows.length > 0 &&
                        pageRows.every((row) => selected.includes(row.id))
                      }
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all on page"
                    />
                  </TableHead>
                  {visibleColumns.includes("name") ? (
                    <TableHead className="w-[240px] px-3">
                      <button type="button" onClick={() => toggleSort("name")}>
                        Lead Name
                      </button>
                    </TableHead>
                  ) : null}
                  {visibleColumns.includes("company") ? (
                    <TableHead className="w-[160px] px-3">Company</TableHead>
                  ) : null}
                  {visibleColumns.includes("title") ? (
                    <TableHead className="w-[160px] px-3">Job Title</TableHead>
                  ) : null}
                  {visibleColumns.includes("source") ? (
                    <TableHead className="px-3">Lead Source</TableHead>
                  ) : null}
                  {visibleColumns.includes("score") ? (
                    <TableHead className="px-3">
                      <button type="button" onClick={() => toggleSort("score")}>
                        Lead Score
                      </button>
                    </TableHead>
                  ) : null}
                  {visibleColumns.includes("status") ? (
                    <TableHead className="w-[120px] px-3">Status</TableHead>
                  ) : null}
                  {visibleColumns.includes("owner") ? (
                    <TableHead className="w-[150px] px-3">Lead Owner</TableHead>
                  ) : null}
                  {visibleColumns.includes("lastContacted") ? (
                    <TableHead className="px-3">Last Contacted</TableHead>
                  ) : null}
                  {visibleColumns.includes("createdAt") ? (
                    <TableHead className="px-3">Created Date</TableHead>
                  ) : null}
                  <TableHead className="px-3 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={visibleColumns.length + 2}
                      className="px-3 py-10 text-center text-xs text-muted-foreground"
                    >
                      No leads match your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  pageRows.map((lead) => {
                    const owner = ownerById(lead.ownerId, owners);
                    return (
                      <TableRow
                        key={lead.id}
                        data-state={
                          selected.includes(lead.id) ? "selected" : undefined
                        }
                      >
                        <TableCell className="px-3 py-2.5">
                          <Checkbox
                            checked={selected.includes(lead.id)}
                            onCheckedChange={() => toggleSelect(lead.id)}
                            aria-label={`Select ${fullName(lead)}`}
                          />
                        </TableCell>
                        {visibleColumns.includes("name") ? (
                          <TableCell className="overflow-hidden px-3 py-2.5">
                            <button
                              type="button"
                              onClick={() => openLead(lead)}
                              className="flex w-full min-w-0 items-center gap-2.5 text-left"
                            >
                              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-semibold text-primary-700">
                                {initials(fullName(lead))}
                              </span>
                              <span className="min-w-0 flex-1 overflow-hidden">
                                <TruncateText
                                  value={fullName(lead)}
                                  className="text-xs font-semibold"
                                />
                                <TruncateText
                                  value={lead.email}
                                  className="text-xs text-muted-foreground"
                                />
                              </span>
                            </button>
                          </TableCell>
                        ) : null}
                        {visibleColumns.includes("company") ? (
                          <TableCell className="overflow-hidden px-3 py-2.5">
                            <TruncateText
                              value={lead.company}
                              className="text-xs font-medium"
                            />
                          </TableCell>
                        ) : null}
                        {visibleColumns.includes("title") ? (
                          <TableCell className="overflow-hidden px-3 py-2.5">
                            <TruncateText
                              value={lead.title}
                              className="text-xs text-muted-foreground"
                            />
                          </TableCell>
                        ) : null}
                        {visibleColumns.includes("source") ? (
                          <TableCell className="overflow-hidden px-3 py-2.5">
                            {lead.source ? (
                              <Badge
                                variant="outline"
                                title={lead.source}
                                className={cn(
                                  "h-auto max-w-full overflow-hidden border-transparent text-xs",
                                  LEAD_SOURCE_STYLES[lead.source] ||
                                    LEAD_SOURCE_STYLES.Manual
                                )}
                              >
                                <span className="truncate">{lead.source}</span>
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        ) : null}
                        {visibleColumns.includes("score") ? (
                          <TableCell className="px-3 py-2.5">
                            <ScoreRing score={lead.score} />
                          </TableCell>
                        ) : null}
                        {visibleColumns.includes("status") ? (
                          <TableCell className="overflow-hidden px-3 py-2.5">
                            <Badge
                              variant="outline"
                              title={lead.status}
                              className={cn(
                                "h-auto max-w-full overflow-hidden border-transparent text-xs",
                                LEAD_STATUS_STYLES[lead.status]
                              )}
                            >
                              <span className="truncate">{lead.status}</span>
                            </Badge>
                          </TableCell>
                        ) : null}
                        {visibleColumns.includes("owner") ? (
                          <TableCell className="overflow-hidden px-3 py-2.5">
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                                {owner.initials}
                              </span>
                              <div className="min-w-0 flex-1 overflow-hidden">
                                <TruncateText value={owner.name} className="text-xs" />
                              </div>
                            </div>
                          </TableCell>
                        ) : null}
                        {visibleColumns.includes("lastContacted") ? (
                          <TableCell className="px-3 py-2.5 text-xs text-muted-foreground">
                            {formatDate(lead.lastContacted)}
                          </TableCell>
                        ) : null}
                        {visibleColumns.includes("createdAt") ? (
                          <TableCell className="px-3 py-2.5 text-xs text-muted-foreground">
                            {formatDate(lead.createdAt)}
                          </TableCell>
                        ) : null}
                        <TableCell className="px-3 py-2.5">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label="View lead"
                              onClick={() => openLead(lead)}
                            >
                              <Eye className="size-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Edit lead"
                              onClick={() => openEdit(lead)}
                            >
                              <SquarePen className="size-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 px-3 py-2.5 dark:border-neutral-800">
              <p className="text-[12px] text-neutral-500">
                Showing{" "}
                {filteredLeads.length === 0
                  ? 0
                  : (page - 1) * pageSize + 1}
                –
                {Math.min(page * pageSize, filteredLeads.length)} of{" "}
                {filteredLeads.length}
              </p>
              <div className="flex items-center gap-2">
                <Select
                  value={String(pageSize)}
                  onValueChange={(value) => setPageSize(Number(value))}
                >
                  <SelectTrigger className="h-8 w-[108px] rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZES.map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size} / page
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => prev - 1)}
                >
                  Previous
                </Button>
                <span className="text-[12px] font-medium text-neutral-500">
                  {page} / {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((prev) => prev + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="overflow-x-auto p-3">
            <div className="flex min-h-[28rem] min-w-max items-stretch gap-3">
              {LEAD_STATUSES.map((status) => {
                const cards = filteredLeads.filter(
                  (lead) => lead.status === status
                );
                const isDropTarget = dragOverStatus === status;
                return (
                  <section
                    key={status}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDragOverStatus(status);
                    }}
                    onDragLeave={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget)) {
                        setDragOverStatus((prev) =>
                          prev === status ? null : prev
                        );
                      }
                    }}
                    onDrop={() => handleDrop(status)}
                    className={cn(
                      "flex w-[300px] shrink-0 flex-col rounded-xl bg-neutral-50/90 ring-1 ring-neutral-200/80 transition-colors dark:bg-neutral-950/50 dark:ring-neutral-800",
                      isDropTarget &&
                        "bg-primary-50/70 ring-primary-200 dark:bg-primary-950/30 dark:ring-primary-800"
                    )}
                  >
                    <header className="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className={cn(
                            "size-2 shrink-0 rounded-full",
                            STAGE_COLORS[status] || "bg-neutral-400"
                          )}
                        />
                        <h3 className="truncate text-[13px] font-semibold text-neutral-800 dark:text-neutral-100">
                          {status}
                        </h3>
                      </div>
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-white px-1.5 text-[11px] font-semibold text-neutral-500 ring-1 ring-neutral-200/80 dark:bg-neutral-900 dark:ring-neutral-700">
                        {cards.length}
                      </span>
                    </header>
                    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
                      {cards.map((lead) => (
                        <KanbanLeadCard
                          key={lead.id}
                          lead={lead}
                          owner={ownerById(lead.ownerId, owners)}
                          isDragging={dragId === lead.id}
                          onDragStart={() => setDragId(lead.id)}
                          onDragEnd={() => {
                            setDragId(null);
                            setDragOverStatus(null);
                          }}
                          onOpen={() => openLead(lead)}
                        />
                      ))}
                      {cards.length === 0 ? (
                        <div
                          className={cn(
                            "flex flex-1 items-center justify-center rounded-xl border border-dashed px-3 py-8 text-center text-[12px] text-muted-foreground",
                            isDropTarget
                              ? "border-primary-300 bg-primary-50/50 text-primary-600 dark:border-primary-700 dark:bg-primary-950/20 dark:text-primary-300"
                              : "border-neutral-200 dark:border-neutral-800"
                          )}
                        >
                          Drop leads here
                        </div>
                      ) : null}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      <LeadFormDrawer
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingLead(null);
        }}
        initialLead={editingLead}
        onSave={handleSaveLead}
        owners={owners}
        defaultOwnerId={currentUserId}
      />

      <Dialog
        open={Boolean(convertLead)}
        onOpenChange={(open) => {
          if (!open) setConvertLead(null);
        }}
      >
        <DialogContent
          title="Convert Lead"
          description="Create a contact and opportunity from this lead."
          onClose={() => setConvertLead(null)}
        >
          <DialogBody className="space-y-3 text-[13px] text-neutral-600">
            <p>
              Convert{" "}
              <span className="font-semibold text-neutral-900 dark:text-neutral-50">
                {convertLead ? fullName(convertLead) : ""}
              </span>{" "}
              at {convertLead?.company}?
            </p>
            <div className="rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2.5 text-[12px] dark:border-neutral-800 dark:bg-neutral-900">
              Sample conversion will mark the lead as Converted and keep a
              related opportunity placeholder in this prototype.
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConvertLead(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-primary-600 text-white hover:bg-primary-700"
              onClick={() => {
                if (!convertLead) return;
                updateStatus(convertLead.id, "Converted");
                setConvertLead(null);
                toast.success("Lead converted");
              }}
            >
              Confirm Convert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CsvImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Import Leads"
        description="Upload a CSV with first_name, last_name, and email columns."
        requiredHint="Required: first_name, last_name, email"
        entityName="lead"
        previewColumns={[
          {
            header: "Name",
            cell: (row) => `${row.firstName} ${row.lastName}`,
          },
          { header: "Email", cell: (row) => row.email },
          { header: "Company", cell: (row) => row.company },
        ]}
        onParseFile={(file) =>
          parseLeadCsvFile(file, {
            existingEmails: leads.map((lead) => lead.email),
            owners,
            fallbackOwnerId: currentUserId || owners[0]?.id || "",
          })
        }
        onImport={async (rows, { reportProgress }) => {
          const fallbackOwnerId = currentUserId || owners[0]?.id || null;
          const created = [];
          for (let index = 0; index < rows.length; index += 1) {
            const lead = rows[index];
            const ownerId =
              owners.some((owner) => owner.id === lead.ownerId) &&
              /^[0-9a-f-]{36}$/i.test(lead.ownerId)
                ? lead.ownerId
                : fallbackOwnerId;
            const payload = toApiLead({ ...lead, ownerId });
            const response = await apiFetch("/api/leads", {
              method: "POST",
              body: JSON.stringify(payload),
            });
            created.push(fromApiLead(response.data));
            reportProgress(index + 1, rows.length);
          }
          setLeads((prev) => [...created, ...prev]);
          toast.success(
            `Imported ${created.length} lead${created.length === 1 ? "" : "s"}`
          );
        }}
      />

      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent
          title="Export Leads"
          description="Download the current filtered lead list."
          onClose={() => setExportOpen(false)}
        >
          <DialogBody className="text-[13px] text-neutral-600">
            Export {selected.length > 0 ? selected.length : filteredLeads.length}{" "}
            lead
            {(selected.length > 0 ? selected.length : filteredLeads.length) === 1
              ? ""
              : "s"}{" "}
            as CSV with visible columns.
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setExportOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-primary-600 text-white hover:bg-primary-700"
              onClick={() => {
                setExportOpen(false);
                toast.success("Leads exported (sample)");
              }}
            >
              Download CSV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={filtersOpen} onOpenChange={handleFiltersOpenChange}>
        <SheetContent
          title="Filters"
          description="Narrow leads by owner, status, and source."
          onClose={() => handleFiltersOpenChange(false)}
        >
          <SheetBody className="space-y-5">
            <div>
              <Label htmlFor="filter-owner">Owner</Label>
              <Select
                value={draftOwnerFilter}
                onValueChange={setDraftOwnerFilter}
              >
                <SelectTrigger
                  id="filter-owner"
                  className="mt-1.5 h-9 w-full rounded-lg"
                >
                  <SelectValue placeholder="Owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All owners</SelectItem>
                  {owners.map((owner) => (
                    <SelectItem key={owner.id} value={owner.id}>
                      {owner.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filter-status">Status</Label>
              <Select
                value={draftStatusFilter}
                onValueChange={setDraftStatusFilter}
              >
                <SelectTrigger
                  id="filter-status"
                  className="mt-1.5 h-9 w-full rounded-lg"
                >
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {LEAD_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filter-source">Source</Label>
              <Select
                value={draftSourceFilter}
                onValueChange={setDraftSourceFilter}
              >
                <SelectTrigger
                  id="filter-source"
                  className="mt-1.5 h-9 w-full rounded-lg"
                >
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sources</SelectItem>
                  {LEAD_SOURCES.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </SheetBody>
          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={clearDraftFilters}
              disabled={draftFilterCount === 0}
            >
              Clear
            </Button>
            <Button
              type="button"
              className="bg-primary-600 text-white hover:bg-primary-700"
              onClick={applyDraftFilters}
            >
              Apply
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet
        open={aiOpen}
        onOpenChange={(open) => {
          setAiOpen(open);
          if (!open) setAiAction(null);
        }}
      >
        <SheetContent
          title="AI Lead Insights"
          description="Recommendations you can act on from this pipeline."
          onClose={() => {
            setAiOpen(false);
            setAiAction(null);
          }}
        >
          <SheetBody className="space-y-3">
            {aiInsights.map((insight) => (
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
            ))}
          </SheetBody>
        </SheetContent>
      </Sheet>

      <Dialog
        open={aiAction === "draft"}
        onOpenChange={(open) => {
          if (!open) setAiAction(null);
        }}
      >
        <DialogContent
          title="Draft Follow-up"
          description="Save this note to overdue high-fit leads, or copy it to send yourself."
          onClose={() => setAiAction(null)}
        >
          <DialogBody className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {draftTargets.map((lead) => (
                <span
                  key={lead.id}
                  className="rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary-700 dark:bg-primary-950 dark:text-primary-300"
                >
                  {fullName(lead)}
                </span>
              ))}
            </div>
            <Textarea
              value={followUpDraft}
              onChange={(event) => setFollowUpDraft(event.target.value)}
              rows={8}
            />
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={copyFollowUpDraft}
            >
              <Copy className="size-3.5" />
              Copy
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => showLeads(draftTargets)}
              disabled={!draftTargets.length}
            >
              View leads
            </Button>
            <Button
              type="button"
              className="bg-primary-600 text-white hover:bg-primary-700"
              disabled={aiBusy || !followUpDraft.trim() || !draftTargets.length}
              onClick={saveFollowUpDrafts}
            >
              {aiBusy ? "Saving…" : "Save drafts"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={aiAction === "explain"}
        onOpenChange={(open) => {
          if (!open) setAiAction(null);
        }}
      >
        <DialogContent
          title="Source advantage"
          description="Qualification rate by lead source in this workspace."
          onClose={() => setAiAction(null)}
        >
          <DialogBody className="space-y-3">
            {sourceStats.length ? (
              <ul className="space-y-2">
                {sourceStats.map((row) => (
                  <li
                    key={row.source}
                    className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 px-3 py-2.5 dark:border-neutral-800"
                  >
                    <div>
                      <p className="text-[13px] font-semibold">{row.source}</p>
                      <p className="text-[12px] text-muted-foreground">
                        {row.qualified} qualified of {row.total}
                      </p>
                    </div>
                    <p className="text-[16px] font-bold">{row.rate}%</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] text-muted-foreground">
                No source data yet.
              </p>
            )}
            <p className="text-[12px] leading-5 text-muted-foreground">
              Referral and inbound sources with a higher qualified/converted
              share should get more of this week’s outreach.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAiAction(null)}
            >
              Close
            </Button>
            <Button
              type="button"
              className="bg-primary-600 text-white hover:bg-primary-700"
              onClick={viewReferralLeads}
            >
              View referral leads
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={aiAction === "next"}
        onOpenChange={(open) => {
          if (!open) setAiAction(null);
        }}
      >
        <DialogContent
          title="Recommend Next Action"
          description="Create follow-up tasks for the highest-scoring open leads."
          onClose={() => setAiAction(null)}
        >
          <DialogBody className="space-y-3">
            {nextActionLeads.length ? (
              <ul className="space-y-2">
                {nextActionLeads.map((lead) => (
                  <li
                    key={lead.id}
                    className="rounded-xl border border-neutral-200 px-3 py-2.5 dark:border-neutral-800"
                  >
                    <p className="text-[13px] font-semibold">
                      {fullName(lead)}
                    </p>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                      Score {lead.score} · {lead.status}
                      {lead.company ? ` · ${lead.company}` : ""}
                    </p>
                    <p className="mt-1 text-[12px] text-neutral-600 dark:text-neutral-300">
                      Schedule a 20-min architecture review tomorrow at 10:30 AM.
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] text-muted-foreground">
                No open leads to recommend.
              </p>
            )}
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={openTopRecommendedLead}
              disabled={!nextActionLeads.length}
            >
              Open top lead
            </Button>
            <Button
              type="button"
              className="bg-primary-600 text-white hover:bg-primary-700"
              disabled={aiBusy || !nextActionLeads.length}
              onClick={scheduleRecommendedFollowUps}
            >
              {aiBusy ? "Scheduling…" : "Schedule follow-ups"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deletePrompt)}
        onOpenChange={(open) => {
          if (!open) setDeletePrompt(null);
        }}
      >
        <DialogContent
          title="Delete leads?"
          description="Associated contacts and companies are not deleted."
          onClose={() => setDeletePrompt(null)}
        >
          <DialogBody>
            <p className="text-[13px] text-muted-foreground">
              Remove <strong>{selected.length}</strong> selected lead
              {selected.length === 1 ? "" : "s"} from your pipeline? This cannot be undone.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeletePrompt(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={confirmDeleteLeads}
            >
              {deleting ? "Deleting…" : "Delete lead"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

