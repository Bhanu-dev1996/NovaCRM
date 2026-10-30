"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import {
  ArrowDownUp,
  BadgeCheck,
  Columns3,
  Download,
  FileSpreadsheet,
  Filter,
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

import { LeadDetailSheet } from "@/components/leads/lead-detail-sheet";
import { LeadFormDrawer } from "@/components/leads/lead-form-drawer";
import {
  fromApiLead,
  mapMemberToOwner,
  toApiLead,
} from "@/components/leads/lead-api";
import {
  mapCsvRowsToLeads,
  parseCsv,
} from "@/components/leads/lead-import";
import {
  LEAD_AI_INSIGHTS,
  LEAD_OWNERS,
  LEAD_SOURCES,
  LEAD_SOURCE_STYLES,
  LEAD_STATUS_STYLES,
  LEAD_STATUSES,
  fullName,
  ownerById,
  scoreTone,
} from "@/components/leads/leads-data";
import { apiFetch } from "@/lib/api";
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
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

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
  Contacted: "bg-amber-500",
  Qualified: "bg-emerald-500",
  Nurturing: "bg-violet-500",
  Converted: "bg-primary-600",
  Lost: "bg-neutral-400",
};

function formatCount(value) {
  return new Intl.NumberFormat("en-US").format(value);
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
  if (!value) return "—";
  try {
    return format(parseISO(value), "MMM d, yyyy");
  } catch {
    return value;
  }
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
          "absolute text-[10px] font-semibold tabular-nums",
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

export function LeadsHome() {
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
  const [detailLeadId, setDetailLeadId] = useState(null);
  const [convertLead, setConvertLead] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importFileName, setImportFileName] = useState("");
  const [importPreview, setImportPreview] = useState([]);
  const [importErrors, setImportErrors] = useState([]);
  const [importBusy, setImportBusy] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importDragOver, setImportDragOver] = useState(false);
  const importInputRef = useRef(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [dragId, setDragId] = useState(null);

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
  const detailLead = leads.find((lead) => lead.id === detailLeadId) || null;

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

  function resetImportState() {
    setImportFileName("");
    setImportPreview([]);
    setImportErrors([]);
    setImportBusy(false);
    setImporting(false);
    setImportProgress({ current: 0, total: 0 });
    setImportDragOver(false);
    if (importInputRef.current) importInputRef.current.value = "";
  }

  function handleImportOpenChange(nextOpen) {
    if (!nextOpen && importing) return;
    setImportOpen(nextOpen);
    if (!nextOpen) resetImportState();
  }

  async function processImportFile(file) {
    if (!file) return;
    if (!/\.csv$/i.test(file.name) && file.type !== "text/csv") {
      toast.error("Please upload a .csv file");
      return;
    }

    setImportBusy(true);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      const { valid, errors } = mapCsvRowsToLeads(rows, {
        existingEmails: leads.map((lead) => lead.email),
        owners,
        fallbackOwnerId: currentUserId || owners[0]?.id || "",
      });
      setImportFileName(file.name);
      setImportPreview(valid);
      setImportErrors(errors);
      if (!valid.length && errors.length) {
        toast.error("No valid leads found in this CSV");
      } else if (errors.length) {
        toast.message(
          `${valid.length} ready to import · ${errors.length} row${errors.length === 1 ? "" : "s"} skipped`
        );
      } else {
        toast.success(`${valid.length} lead${valid.length === 1 ? "" : "s"} ready to import`);
      }
    } catch (error) {
      setImportFileName("");
      setImportPreview([]);
      setImportErrors([]);
      toast.error(error.message || "Could not read CSV file");
    } finally {
      setImportBusy(false);
    }
  }

  async function handleImportLeads() {
    if (!importPreview.length || importing) {
      if (!importPreview.length) {
        toast.error("Choose a CSV with at least one valid lead");
      }
      return;
    }
    setImporting(true);
    setImportProgress({ current: 0, total: importPreview.length });
    try {
      const fallbackOwnerId = currentUserId || owners[0]?.id || null;
      const created = [];
      for (let index = 0; index < importPreview.length; index += 1) {
        const lead = importPreview[index];
        const ownerId =
          owners.some((owner) => owner.id === lead.ownerId) &&
          /^[0-9a-f-]{36}$/i.test(lead.ownerId)
            ? lead.ownerId
            : fallbackOwnerId;
        const payload = toApiLead({
          ...lead,
          ownerId,
        });
        const response = await apiFetch("/api/leads", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        created.push(fromApiLead(response.data));
        setImportProgress({
          current: index + 1,
          total: importPreview.length,
        });
      }
      setLeads((prev) => [...created, ...prev]);
      toast.success(
        `Imported ${created.length} lead${created.length === 1 ? "" : "s"}`
      );
      handleImportOpenChange(false);
    } catch (error) {
      toast.error(error.message || "Import failed");
    } finally {
      setImporting(false);
      setImportProgress({ current: 0, total: 0 });
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

  function handleDrop(status) {
    if (!dragId) return;
    updateStatus(dragId, status);
    setDragId(null);
    toast.success(`Moved to ${status}`);
  }

  if (loadStatus === "loading") return <LeadsSkeleton />;

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[1440px] flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <nav className="mb-2 flex items-center gap-1.5 text-[12px] text-primary-500/80">
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
            onClick={() => handleImportOpenChange(true)}
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

      <Card className="py-0">
        <CardContent className="flex flex-wrap gap-1 p-1.5">
          {leadStages.map((stage) => {
            const active = statusFilter === stage.id;
            return (
              <Button
                key={stage.id}
                type="button"
                variant={active ? "secondary" : "ghost"}
                onClick={() =>
                  setStatusFilter((prev) =>
                    prev === stage.id ? "all" : stage.id
                  )
                }
                className={cn(
                  "h-auto min-w-0 flex-1 flex-col items-start gap-1 rounded-lg px-2.5 py-2",
                  active &&
                    "bg-primary-50 text-foreground ring-1 ring-primary-200 dark:bg-primary-950/40 dark:ring-primary-800"
                )}
              >
                <span className="flex items-center gap-1.5">
                  <span className={cn("size-1.5 shrink-0 rounded-full", stage.color)} />
                  <span className="truncate text-[11px] font-semibold text-muted-foreground">
                    {stage.label}
                  </span>
                </span>
                <span className="text-[16px] font-bold">{stage.count}</span>
              </Button>
            );
          })}
        </CardContent>
      </Card>

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
                    onClick={async () => {
                      const ids = [...selected];
                      try {
                        await Promise.all(
                          ids.map((id) =>
                            apiFetch(`/api/leads/${id}`, { method: "DELETE" })
                          )
                        );
                        setLeads((prev) =>
                          prev.filter((lead) => !ids.includes(lead.id))
                        );
                        setSelected([]);
                        toast.success("Selected leads removed");
                      } catch (error) {
                        toast.error(error.message || "Could not delete leads");
                      }
                    }}
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
            <Table className="min-w-[1100px] table-fixed">
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
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
                      className="px-3 py-10 text-center text-muted-foreground"
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
                              onClick={() => setDetailLeadId(lead.id)}
                              className="flex w-full min-w-0 items-center gap-2.5 text-left"
                            >
                              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-[11px] font-semibold text-primary-700">
                                {initials(fullName(lead))}
                              </span>
                              <span className="min-w-0 flex-1 overflow-hidden">
                                <TruncateText
                                  value={fullName(lead)}
                                  className="font-semibold"
                                />
                                <TruncateText
                                  value={lead.email}
                                  className="text-[12px] text-muted-foreground"
                                />
                              </span>
                            </button>
                          </TableCell>
                        ) : null}
                        {visibleColumns.includes("company") ? (
                          <TableCell className="overflow-hidden px-3 py-2.5">
                            <TruncateText
                              value={lead.company}
                              className="font-medium"
                            />
                          </TableCell>
                        ) : null}
                        {visibleColumns.includes("title") ? (
                          <TableCell className="overflow-hidden px-3 py-2.5">
                            <TruncateText
                              value={lead.title}
                              className="text-muted-foreground"
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
                                  "h-auto max-w-full overflow-hidden border-transparent",
                                  LEAD_SOURCE_STYLES[lead.source] ||
                                    LEAD_SOURCE_STYLES.Manual
                                )}
                              >
                                <span className="truncate">{lead.source}</span>
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
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
                                "h-auto max-w-full overflow-hidden border-transparent",
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
                              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
                                {owner.initials}
                              </span>
                              <div className="min-w-0 flex-1 overflow-hidden">
                                <TruncateText value={owner.name} />
                              </div>
                            </div>
                          </TableCell>
                        ) : null}
                        {visibleColumns.includes("lastContacted") ? (
                          <TableCell className="px-3 py-2.5 text-muted-foreground">
                            {formatDate(lead.lastContacted)}
                          </TableCell>
                        ) : null}
                        {visibleColumns.includes("createdAt") ? (
                          <TableCell className="px-3 py-2.5 text-muted-foreground">
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
                              onClick={() => setDetailLeadId(lead.id)}
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
            <div className="flex min-w-max gap-3">
              {LEAD_STATUSES.map((status) => {
                const cards = filteredLeads.filter(
                  (lead) => lead.status === status
                );
                return (
                  <Card
                    key={status}
                    size="sm"
                    className="w-[260px] shrink-0 gap-2 bg-muted/50 py-2 ring-0"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handleDrop(status)}
                  >
                    <div className="flex items-center justify-between px-2.5 py-1">
                      <Badge
                        variant="outline"
                        className={cn(
                          "h-auto rounded-md border-transparent",
                          LEAD_STATUS_STYLES[status]
                        )}
                      >
                        {status}
                      </Badge>
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        {cards.length}
                      </span>
                    </div>
                    <CardContent className="space-y-2 px-2">
                      {cards.map((lead) => {
                        const owner = ownerById(lead.ownerId, owners);
                        return (
                          <Card
                            key={lead.id}
                            size="sm"
                            draggable
                            onDragStart={() => setDragId(lead.id)}
                            onDragEnd={() => setDragId(null)}
                            onClick={() => setDetailLeadId(lead.id)}
                            className="cursor-pointer gap-2 py-3 transition-shadow hover:shadow-md"
                            role="button"
                            tabIndex={0}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                setDetailLeadId(lead.id);
                              }
                            }}
                          >
                            <CardContent className="px-3">
                              <p className="truncate text-[13px] font-semibold">
                                {fullName(lead)}
                              </p>
                              <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                                {lead.company}
                              </p>
                              <div className="mt-3 flex items-center justify-between gap-2">
                                <Badge variant="secondary" className="h-auto gap-1">
                                  <span
                                    className={cn(
                                      "size-1.5 rounded-full",
                                      scoreTone(lead.score)
                                    )}
                                  />
                                  {lead.score}
                                </Badge>
                                <span className="text-[11px] text-muted-foreground">
                                  {lead.source}
                                </span>
                              </div>
                              <div className="mt-2 flex items-center justify-between">
                                <span className="flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
                                  {owner.initials}
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                  {lead.lastContacted
                                    ? formatDate(lead.lastContacted)
                                    : "No contact"}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                      {cards.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-[12px] text-muted-foreground">
                          Drop leads here
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
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

      <LeadDetailSheet
        open={Boolean(detailLead)}
        onOpenChange={(open) => {
          if (!open) setDetailLeadId(null);
        }}
        lead={detailLead}
        owners={owners}
        onEdit={() => {
          if (!detailLead) return;
          setDetailLeadId(null);
          openEdit(detailLead);
        }}
        onConvert={() => {
          if (!detailLead) return;
          setConvertLead(detailLead);
        }}
        onMarkLost={async () => {
          if (!detailLead) return;
          await updateStatus(detailLead.id, "Lost");
          setDetailLeadId(null);
          toast.message("Lead marked as Lost");
        }}
        onUpdateNotes={async (id, note) => {
          const current = leads.find((lead) => lead.id === id);
          if (!current) return;
          const notes = current.notes ? `${current.notes}\n\n${note}` : note;
          try {
            const response = await apiFetch(`/api/leads/${id}`, {
              method: "PATCH",
              body: JSON.stringify({ notes }),
            });
            const saved = fromApiLead(response.data);
            setLeads((prev) =>
              prev.map((lead) => (lead.id === saved.id ? saved : lead))
            );
          } catch (error) {
            toast.error(error.message || "Could not save note");
          }
        }}
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

      <Dialog open={importOpen} onOpenChange={handleImportOpenChange}>
        <DialogContent
          title="Import Leads"
          description="Upload a CSV with first_name, last_name, and email columns."
          onClose={
            importing ? undefined : () => handleImportOpenChange(false)
          }
        >
          <DialogBody className="space-y-4">
            <input
              ref={importInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) processImportFile(file);
              }}
            />
            <div
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  importInputRef.current?.click();
                }
              }}
              onClick={() => importInputRef.current?.click()}
              onDragEnter={(event) => {
                event.preventDefault();
                setImportDragOver(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setImportDragOver(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setImportDragOver(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setImportDragOver(false);
                const file = event.dataTransfer.files?.[0];
                if (file) processImportFile(file);
              }}
              className={cn(
                "rounded-xl border border-dashed px-4 py-8 text-center transition-colors",
                importDragOver
                  ? "border-primary-400 bg-primary-50/70 dark:border-primary-500 dark:bg-primary-950/40"
                  : "border-neutral-200 dark:border-neutral-700"
              )}
            >
              <FileSpreadsheet className="mx-auto size-8 text-neutral-400" />
              <p className="mt-3 text-[13px] font-medium text-neutral-800 dark:text-neutral-100">
                {importBusy
                  ? "Reading CSV…"
                  : importFileName || "Drop a CSV file here, or choose a file"}
              </p>
              <p className="mt-1 text-[12px] text-neutral-500">
                Required: first_name, last_name, email
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={importBusy || importing}
                  onClick={(event) => {
                    event.stopPropagation();
                    importInputRef.current?.click();
                  }}
                >
                  Choose file
                </Button>
              </div>
            </div>

            {importFileName ? (
              <div className="flex items-center justify-between gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-[12px] dark:border-neutral-700">
                <div className="min-w-0">
                  <p className="truncate font-medium text-neutral-800 dark:text-neutral-100">
                    {importFileName}
                  </p>
                  <p className="text-neutral-500">
                    {importPreview.length} valid · {importErrors.length} skipped
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Clear file"
                  onClick={resetImportState}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ) : null}

            {importPreview.length > 0 ? (
              <div className="max-h-40 overflow-y-auto rounded-lg border border-neutral-200 dark:border-neutral-700">
                <table className="w-full text-left text-[12px]">
                  <thead className="sticky top-0 bg-neutral-50 text-neutral-500 dark:bg-neutral-900">
                    <tr>
                      <th className="px-3 py-2 font-medium">Name</th>
                      <th className="px-3 py-2 font-medium">Email</th>
                      <th className="px-3 py-2 font-medium">Company</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.slice(0, 8).map((lead) => (
                      <tr
                        key={lead.id}
                        className="border-t border-neutral-100 dark:border-neutral-800"
                      >
                        <td className="px-3 py-2">
                          {lead.firstName} {lead.lastName}
                        </td>
                        <td className="px-3 py-2 text-neutral-600 dark:text-neutral-300">
                          {lead.email}
                        </td>
                        <td className="px-3 py-2 text-neutral-600 dark:text-neutral-300">
                          {lead.company}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {importPreview.length > 8 ? (
                  <p className="border-t border-neutral-100 px-3 py-2 text-[11px] text-neutral-500 dark:border-neutral-800">
                    +{importPreview.length - 8} more
                  </p>
                ) : null}
              </div>
            ) : null}

            {importErrors.length > 0 ? (
              <div className="max-h-28 overflow-y-auto rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
                {importErrors.slice(0, 6).map((error) => (
                  <p key={`${error.rowNumber}-${error.email}`}>
                    Row {error.rowNumber}: {error.message}
                  </p>
                ))}
                {importErrors.length > 6 ? (
                  <p>+{importErrors.length - 6} more issues</p>
                ) : null}
              </div>
            ) : null}

            {importing ? (
              <div className="rounded-lg border border-primary-100 bg-primary-50/70 px-3 py-3 dark:border-primary-900 dark:bg-primary-950/40">
                <div className="flex items-center gap-2 text-[13px] font-medium text-primary-800 dark:text-primary-200">
                  <Loader2 className="size-4 animate-spin" />
                  Importing {importProgress.current} of {importProgress.total}…
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-primary-100 dark:bg-primary-900">
                  <div
                    className="h-full rounded-full bg-primary-600 transition-all duration-200"
                    style={{
                      width: `${
                        importProgress.total
                          ? Math.round(
                              (importProgress.current / importProgress.total) *
                                100
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            ) : null}
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={importing || importBusy}
              onClick={() => handleImportOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-primary-600 text-white hover:bg-primary-700"
              disabled={!importPreview.length || importBusy || importing}
              onClick={handleImportLeads}
            >
              {importing ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Importing {importProgress.current}/{importProgress.total}
                </>
              ) : importPreview.length ? (
                `Import ${importPreview.length} lead${importPreview.length === 1 ? "" : "s"}`
              ) : (
                "Import leads"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      <Sheet open={aiOpen} onOpenChange={setAiOpen}>
        <SheetContent
          title="AI Lead Insights"
          description="Recommendations only — not completed actions."
          onClose={() => setAiOpen(false)}
        >
          <SheetBody className="space-y-3">
            {LEAD_AI_INSIGHTS.map((insight) => (
              <Card key={insight.id} size="sm" className="py-3">
                <CardContent className="px-3">
                  <p className="text-[13px] font-semibold">{insight.title}</p>
                  <p className="mt-1 text-[12px] leading-5 text-muted-foreground">
                    {insight.body}
                  </p>
                  <p className="mt-2 rounded-lg bg-muted px-2.5 py-2 text-[12px] text-muted-foreground">
                    {insight.action}
                  </p>
                </CardContent>
              </Card>
            ))}
          </SheetBody>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function SkeletonBlock({ className }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-neutral-200/70 dark:bg-neutral-800",
        className
      )}
    />
  );
}

function SummaryCardSkeleton() {
  return (
    <Card className="py-4">
      <CardContent className="px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-3">
            <SkeletonBlock className="h-3 w-24 rounded-md" />
            <SkeletonBlock className="h-7 w-20 rounded-lg" />
          </div>
          <SkeletonBlock className="size-8 shrink-0 rounded-full" />
        </div>
        <SkeletonBlock className="mt-3 h-3 w-36 rounded-md" />
      </CardContent>
    </Card>
  );
}

export function LeadsSkeleton() {
  return (
    <div
      className="mx-auto flex w-full min-w-0 max-w-[1440px] flex-col gap-6"
      aria-busy="true"
      aria-label="Loading leads"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <SkeletonBlock className="h-3 w-28 rounded-md" />
          <SkeletonBlock className="h-8 w-36 rounded-lg" />
          <SkeletonBlock className="h-4 w-72 max-w-full rounded-md" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SkeletonBlock className="h-9 w-[118px] rounded-lg" />
          <SkeletonBlock className="h-9 w-9 rounded-lg" />
          <SkeletonBlock className="h-9 w-9 rounded-lg" />
          <SkeletonBlock className="h-9 w-[104px] rounded-lg" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SummaryCardSkeleton key={index} />
        ))}
      </div>

      <Card className="py-0">
        <CardContent className="flex flex-wrap gap-1 p-1.5">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="flex min-w-0 flex-1 flex-col gap-2 rounded-lg px-2.5 py-2"
            >
              <div className="flex items-center gap-1.5">
                <SkeletonBlock className="size-1.5 rounded-full" />
                <SkeletonBlock className="h-3 w-14 rounded-md" />
              </div>
              <SkeletonBlock className="h-5 w-8 rounded-md" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="overflow-hidden py-0">
        <div className="flex flex-col gap-3 border-b border-neutral-100 p-3 dark:border-neutral-800">
          <div className="flex flex-wrap items-center gap-2">
            <SkeletonBlock className="h-9 min-w-[200px] flex-1 rounded-lg" />
            <SkeletonBlock className="h-9 w-[88px] rounded-lg" />
            <SkeletonBlock className="h-9 w-[72px] rounded-lg" />
            <SkeletonBlock className="h-9 w-[96px] rounded-lg" />
            <SkeletonBlock className="ml-auto h-9 w-[160px] rounded-lg" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SkeletonBlock className="h-8 w-[72px] rounded-lg" />
            <SkeletonBlock className="h-8 w-[72px] rounded-lg" />
            <SkeletonBlock className="ml-auto h-8 w-28 rounded-lg" />
          </div>
        </div>

        <div className="hidden border-b border-neutral-100 px-3 py-2.5 md:flex dark:border-neutral-800">
          <div className="flex w-full items-center gap-4">
            <SkeletonBlock className="size-4 rounded" />
            <SkeletonBlock className="h-3 w-24 rounded-md" />
            <SkeletonBlock className="h-3 w-20 rounded-md" />
            <SkeletonBlock className="h-3 w-16 rounded-md" />
            <SkeletonBlock className="h-3 w-16 rounded-md" />
            <SkeletonBlock className="h-3 w-14 rounded-md" />
            <SkeletonBlock className="h-3 w-16 rounded-md" />
            <SkeletonBlock className="ml-auto h-3 w-8 rounded-md" />
          </div>
        </div>

        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-3 px-3 py-3.5 md:gap-4"
            >
              <SkeletonBlock className="hidden size-4 rounded md:block" />
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <SkeletonBlock className="size-8 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <SkeletonBlock className="h-3.5 w-36 max-w-full rounded-md" />
                  <SkeletonBlock className="h-3 w-44 max-w-full rounded-md md:hidden" />
                </div>
              </div>
              <SkeletonBlock className="hidden h-3 w-24 rounded-md md:block" />
              <SkeletonBlock className="hidden h-3 w-20 rounded-md lg:block" />
              <SkeletonBlock className="hidden h-6 w-16 rounded-full sm:block" />
              <SkeletonBlock className="hidden h-3 w-10 rounded-md xl:block" />
              <SkeletonBlock className="hidden h-6 w-20 rounded-full md:block" />
              <SkeletonBlock className="size-8 shrink-0 rounded-lg" />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-neutral-100 px-3 py-3 dark:border-neutral-800">
          <SkeletonBlock className="h-3 w-28 rounded-md" />
          <div className="flex items-center gap-2">
            <SkeletonBlock className="h-8 w-8 rounded-lg" />
            <SkeletonBlock className="h-8 w-16 rounded-lg" />
            <SkeletonBlock className="h-8 w-8 rounded-lg" />
          </div>
        </div>
      </Card>
    </div>
  );
}
