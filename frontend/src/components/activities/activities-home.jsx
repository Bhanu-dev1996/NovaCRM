"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowDownUp,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Columns3,
  Filter,
  Layers,
  ListTodo,
  Mail,
  Phone,
  Plus,
  Search,
  Sparkles,
  SquarePen,
  StickyNote,
  Trash2,
  User,
  Video,
} from "lucide-react";
import { toast } from "sonner";

import { ActivitiesSkeleton } from "@/components/activities/activity-skeletons";
import {
  fromApiActivity,
  persistActivityMeta,
  toApiActivity,
  toApiTask,
} from "@/components/activities/activity-api";
import { ActivityFormDrawer } from "@/components/activities/activity-form-drawer";
import {
  ACTIVITY_KPI_DEFINITIONS,
  ACTIVITY_PAGE_SIZES,
  ACTIVITY_PRIORITY_STYLES,
  ACTIVITY_STATUS_FILTER_OPTIONS,
  ACTIVITY_SUBJECT_ICON_STYLES,
  ACTIVITY_TABLE_COLUMNS,
  ACTIVITY_TABS,
  ACTIVITY_TYPE_LIST,
  ACTIVITY_TYPE_STYLES,
  activityStatusClass,
  activityStatusDotClass,
  countLinkedAccounts,
  countUpcomingInDays,
  DEFAULT_VISIBLE_ACTIVITY_COLUMNS,
  activityTypeLabel,
  buildPrioritizedQueue,
  computeActivityKpis,
  displayActivityStatus,
  filterActivityTab,
  formatActivityDueDisplay,
  fromActivityRow,
  fromTaskRow,
  isCompleted,
  isOverdue,
  mergeActivityRows,
  resolveRelatedDisplay,
  resolveRelatedLabel,
} from "@/components/activities/activities-data";
import { fromApiCompany } from "@/components/companies/company-api";
import {
  fromApiContact,
  mapMemberToOwner,
} from "@/components/contacts/contact-api";
import {
  CONTACT_OWNERS,
  fullName,
  ownerById,
} from "@/components/contacts/contacts-data";
import { fromApiDeal } from "@/components/deals/deal-api";
import { fromApiLead } from "@/components/leads/lead-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  DateRangePicker,
  resolveDateRange,
} from "@/components/ui/date-range-picker";
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
import { apiFetch } from "@/lib/api";
import { crmType } from "@/lib/crm-typography";
import { cn } from "@/lib/utils";

function formatCount(n) {
  return new Intl.NumberFormat("en-US").format(n);
}

function summaryIcon(name) {
  if (name === "user") return User;
  if (name === "calendar") return CalendarDays;
  if (name === "alert") return AlertCircle;
  if (name === "check") return CheckCircle2;
  return Layers;
}

function ActivityTypeIcon({ type, className }) {
  const iconClass = cn("size-3.5 shrink-0", className);
  if (type === "call") return <Phone className={iconClass} aria-hidden />;
  if (type === "meeting") return <Video className={iconClass} aria-hidden />;
  if (type === "email") return <Mail className={iconClass} aria-hidden />;
  if (type === "note") return <StickyNote className={iconClass} aria-hidden />;
  if (type === "task") return <ListTodo className={iconClass} aria-hidden />;
  return <Layers className={iconClass} aria-hidden />;
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
      {tooltip ? (
        <span
          role="tooltip"
          className="pointer-events-none fixed z-50 max-w-xs -translate-x-1/2 -translate-y-full rounded-md bg-neutral-900 px-2 py-1 text-[11px] text-white shadow-lg"
          style={{ top: tooltip.top, left: tooltip.left }}
        >
          {tooltip.text}
        </span>
      ) : null}
    </>
  );
}

export function ActivitiesHome() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loadStatus, setLoadStatus] = useState("loading");
  const [rows, setRows] = useState([]);
  const [owners, setOwners] = useState(CONTACT_OWNERS);
  const [currentUserId, setCurrentUserId] = useState("");
  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [deals, setDeals] = useState([]);
  const [leads, setLeads] = useState([]);

  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [sortKey, setSortKey] = useState("dueAt");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState(
    DEFAULT_VISIBLE_ACTIVITY_COLUMNS
  );
  const [datePreset, setDatePreset] = useState("Last 30 Days");
  const [dateRangeValue, setDateRangeValue] = useState(() =>
    resolveDateRange("Last 30 Days")
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftTypeFilter, setDraftTypeFilter] = useState("all");
  const [draftStatusFilter, setDraftStatusFilter] = useState("all");
  const [draftOwnerFilter, setDraftOwnerFilter] = useState("all");

  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState("task");
  const [editingRecord, setEditingRecord] = useState(null);
  const [deletePrompt, setDeletePrompt] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [prioritizeOpen, setPrioritizeOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadStatus("loading");
      try {
        const [
          ws,
          taskList,
          activityList,
          contactList,
          companyList,
          dealList,
          leadList,
          members,
        ] = await Promise.all([
          apiFetch("/api/workspace"),
          apiFetch("/api/tasks?limit=300&order_by=due_at"),
          apiFetch("/api/activities?limit=300&order_by=due_at"),
          apiFetch("/api/contacts?order_by=created_at&limit=300"),
          apiFetch("/api/companies?order_by=name&limit=300"),
          apiFetch("/api/deals?order_by=created_at&limit=300"),
          apiFetch("/api/leads?order_by=created_at&limit=300"),
          apiFetch("/api/workspace/members"),
        ]);
        if (cancelled) return;
        const mappedOwners = (members.data || []).map(mapMemberToOwner);
        setOwners(mappedOwners.length ? mappedOwners : CONTACT_OWNERS);
        setCurrentUserId(ws.user?.id || "");
        setContacts((contactList.data || []).map((r) => fromApiContact(r)));
        setCompanies((companyList.data || []).map((r) => fromApiCompany(r)));
        setDeals((dealList.data || []).map((r) => fromApiDeal(r)));
        setLeads((leadList.data || []).map((r) => fromApiLead(r)));
        const merged = mergeActivityRows(taskList.data || [], activityList.data || []);
        setRows(merged);
        setLoadStatus("ready");
      } catch (error) {
        if (!cancelled) {
          toast.error(error.message || "Could not load activities");
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
    if (searchParams.get("action") !== "create") return;
    const type = searchParams.get("type") || "task";
    const allowed = ACTIVITY_TYPE_LIST.map((t) => t.value);
    const activityType = allowed.includes(type) ? type : "task";
    const subject = searchParams.get("subject") || "";
    setFormType(activityType);
    setEditingRecord({
      relatedContactId: searchParams.get("contact_id") || "",
      relatedCompanyId: searchParams.get("company_id") || "",
      relatedDealId: searchParams.get("deal_id") || "",
      ...(activityType === "task"
        ? { title: subject, subject: subject }
        : { subject: subject }),
    });
    setFormOpen(true);
    router.replace("/activities");
  }, [loadStatus, searchParams, router]);

  const lookups = useMemo(
    () => ({ contacts, companies, deals, leads, fullName }),
    [contacts, companies, deals, leads]
  );

  const filtered = useMemo(() => {
    let list = filterActivityTab(rows, tab, currentUserId);
    const q = query.trim().toLowerCase();

    list = list.filter((row) => {
      if (typeFilter !== "all" && row.type !== typeFilter) return false;
      if (ownerFilter !== "all" && String(row.assigneeId) !== ownerFilter) {
        return false;
      }
      if (statusFilter !== "all") {
        const statusKey =
          row.recordKind === "task" ? row.status : row.status || displayActivityStatus(row);
        if (String(statusKey) !== statusFilter) return false;
      }
      const anchor = row.dueAt || row.createdAt;
      if (anchor && dateRangeValue?.from && dateRangeValue?.to) {
        const when = new Date(anchor).getTime();
        if (!Number.isNaN(when)) {
          const from = dateRangeValue.from.getTime();
          const to = dateRangeValue.to.getTime();
          if (when < from || when > to) return false;
        }
      }
      if (q) {
        const related = resolveRelatedLabel(row, lookups).toLowerCase();
        const hay = `${row.subject} ${row.type} ${displayActivityStatus(row)} ${related}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    list = [...list].sort((a, b) => {
      if (sortKey === "subject") {
        return (
          String(a.subject || "").localeCompare(String(b.subject || "")) * dir
        );
      }
      if (sortKey === "type") {
        return String(a.type || "").localeCompare(String(b.type || "")) * dir;
      }
      if (sortKey === "status") {
        const sa = displayActivityStatus(a);
        const sb = displayActivityStatus(b);
        return sa.localeCompare(sb) * dir;
      }
      if (sortKey === "priority") {
        return (
          String(a.priority || "").localeCompare(String(b.priority || "")) * dir
        );
      }
      if (sortKey === "owner") {
        const oa = ownerById(a.assigneeId, owners).name;
        const ob = ownerById(b.assigneeId, owners).name;
        return oa.localeCompare(ob) * dir;
      }
      const aDue = a.dueAt
        ? new Date(a.dueAt).getTime()
        : dir > 0
          ? Infinity
          : -Infinity;
      const bDue = b.dueAt
        ? new Date(b.dueAt).getTime()
        : dir > 0
          ? Infinity
          : -Infinity;
      if (aDue === bDue) {
        return (
          String(a.subject || "").localeCompare(String(b.subject || "")) * dir
        );
      }
      return (aDue - bDue) * dir;
    });
    return list;
  }, [
    rows,
    tab,
    currentUserId,
    query,
    typeFilter,
    statusFilter,
    ownerFilter,
    dateRangeValue,
    sortKey,
    sortDir,
    lookups,
    owners,
  ]);

  const kpiCards = useMemo(() => {
    const stats = computeActivityKpis(rows, currentUserId);
    const accounts = countLinkedAccounts(rows);
    const upcoming7 = countUpcomingInDays(rows, 7);
    const resolution = stats.total
      ? ((stats.completed / stats.total) * 100).toFixed(1)
      : "0.0";

    return ACTIVITY_KPI_DEFINITIONS.map((card) => {
      if (card.id === "total") {
        return {
          ...card,
          value: formatCount(stats.total),
          hint:
            accounts > 0
              ? `Across ${formatCount(accounts)} accounts`
              : "Tasks and logged interactions",
        };
      }
      if (card.id === "upcoming") {
        return {
          ...card,
          value: formatCount(upcoming7),
          hint: "Scheduled next 7 days",
        };
      }
      if (card.id === "completed") {
        return {
          ...card,
          value: formatCount(stats.completed),
          hint: `${resolution}% resolution rate`,
          hintClass: "text-emerald-600 dark:text-emerald-400",
        };
      }
      if (card.id === "overdue") {
        return {
          ...card,
          value: formatCount(stats.overdue),
          hint: "Requires immediate attention",
          hintClass:
            stats.overdue > 0 ? "text-rose-600 dark:text-rose-400" : undefined,
        };
      }
      return { ...card, value: formatCount(stats[card.id] ?? 0) };
    });
  }, [rows, currentUserId]);

  const prioritizeQueue = useMemo(
    () => buildPrioritizedQueue(rows, currentUserId, 25),
    [rows, currentUserId]
  );

  const openWorkCount = useMemo(
    () => (rows || []).filter((row) => !isCompleted(row)).length,
    [rows]
  );

  const tabCounts = useMemo(() => {
    const stats = computeActivityKpis(rows, currentUserId);
    return {
      all: stats.total,
      mine: stats.mine,
      upcoming: stats.upcoming,
      overdue: stats.overdue,
      completed: stats.completed,
    };
  }, [rows, currentUserId]);

  const activeFilterCount = [
    typeFilter !== "all",
    statusFilter !== "all",
    ownerFilter !== "all",
    query.trim().length > 0,
  ].filter(Boolean).length;

  const draftFilterCount = [
    draftTypeFilter !== "all",
    draftStatusFilter !== "all",
    draftOwnerFilter !== "all",
  ].filter(Boolean).length;

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [
    query,
    tab,
    typeFilter,
    statusFilter,
    ownerFilter,
    dateRangeValue,
    pageSize,
    sortKey,
    sortDir,
  ]);

  function resetPage() {
    setPage(1);
  }

  async function quickMarkComplete(row) {
    try {
      if (row.recordKind === "task") {
        await apiFetch(`/api/tasks/${row.id}`, {
          method: "PATCH",
          body: JSON.stringify(
            toApiTask({
              title: row.subject,
              status: "done",
              priority: row.priority,
              dueAt: row.dueAt,
              assigneeId: row.assigneeId,
              contactId: row.relatedContactId,
              companyId: row.relatedCompanyId,
              dealId: row.relatedDealId,
              leadId: row.relatedLeadId,
            })
          ),
        });
      } else {
        const payload = toApiActivity({
          ...fromApiActivity(row.raw || row),
          status: "Completed",
          completedAt: new Date().toISOString(),
        });
        const response = await apiFetch(`/api/activities/${row.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        persistActivityMeta(fromApiActivity(response.data));
      }
      setRows((prev) =>
        prev.map((r) =>
          rowKey(r) === rowKey(row)
            ? {
                ...r,
                status: r.recordKind === "task" ? "done" : "Completed",
                completedAt: new Date().toISOString(),
              }
            : r
        )
      );
      toast.success("Marked complete");
    } catch (error) {
      toast.error(error.message || "Could not update");
    }
  }

  function applyDateRange({ preset, range }) {
    setDatePreset(preset);
    setDateRangeValue(range);
    resetPage();
  }

  function clearFilters() {
    setQuery("");
    setTypeFilter("all");
    setStatusFilter("all");
    setOwnerFilter("all");
    setDatePreset("Last 30 Days");
    setDateRangeValue(resolveDateRange("Last 30 Days"));
    setDraftTypeFilter("all");
    setDraftStatusFilter("all");
    setDraftOwnerFilter("all");
  }

  function openFiltersSheet() {
    setDraftTypeFilter(typeFilter);
    setDraftStatusFilter(statusFilter);
    setDraftOwnerFilter(ownerFilter);
    setFiltersOpen(true);
  }

  function handleFiltersOpenChange(open) {
    if (open) {
      setDraftTypeFilter(typeFilter);
      setDraftStatusFilter(statusFilter);
      setDraftOwnerFilter(ownerFilter);
    }
    setFiltersOpen(open);
  }

  function clearDraftFilters() {
    setDraftTypeFilter("all");
    setDraftStatusFilter("all");
    setDraftOwnerFilter("all");
  }

  function applyDraftFilters() {
    setTypeFilter(draftTypeFilter);
    setStatusFilter(draftStatusFilter);
    setOwnerFilter(draftOwnerFilter);
    setFiltersOpen(false);
    resetPage();
  }

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

  function requestBulkDelete() {
    if (!selected.length) return;
    setDeletePrompt({ mode: "bulk" });
  }

  function toggleSelect(id) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function toggleSelectAll() {
    const pageIds = pageRows.map((row) => `${row.recordKind}:${row.id}`);
    const allSelected =
      pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
    if (allSelected) {
      setSelected((prev) => prev.filter((id) => !pageIds.includes(id)));
      return;
    }
    setSelected((prev) => [...new Set([...prev, ...pageIds])]);
  }

  function rowKey(row) {
    return `${row.recordKind}:${row.id}`;
  }

  function openCreatePicker() {
    setEditingRecord(null);
    setTypePickerOpen(true);
  }

  function pickType(type) {
    setFormType(type);
    setTypePickerOpen(false);
    setFormOpen(true);
  }

  function openEdit(row) {
    setEditingRecord(row);
    setFormType(row.type);
    setFormOpen(true);
  }

  function openView(row) {
    router.push(`/activities/${row.id}?kind=${row.recordKind}`);
  }

  async function confirmDelete() {
    if (!deletePrompt) return;
    setDeleting(true);
    try {
      if (deletePrompt.mode === "bulk") {
        const keys = [...selected];
        await Promise.all(
          keys.map((key) => {
            const [recordKind, id] = key.split(":");
            const path =
              recordKind === "task"
                ? `/api/tasks/${id}`
                : `/api/activities/${id}`;
            return apiFetch(path, { method: "DELETE" });
          })
        );
        setRows((prev) =>
          prev.filter((r) => !keys.includes(`${r.recordKind}:${r.id}`))
        );
        setSelected([]);
        toast.success(
          keys.length === 1
            ? "Activity deleted"
            : `${keys.length} activities deleted`
        );
      } else {
        const { recordKind, id } = deletePrompt;
        const path =
          recordKind === "task" ? `/api/tasks/${id}` : `/api/activities/${id}`;
        await apiFetch(path, { method: "DELETE" });
        setRows((prev) =>
          prev.filter((r) => !(r.id === id && r.recordKind === recordKind))
        );
        setSelected((prev) =>
          prev.filter((key) => key !== `${recordKind}:${id}`)
        );
        toast.success("Activity deleted");
      }
      setDeletePrompt(null);
    } catch (error) {
      toast.error(error.message || "Could not delete");
    } finally {
      setDeleting(false);
    }
  }

  function handleSaved() {
    async function reload() {
      try {
        const [taskList, activityList] = await Promise.all([
          apiFetch("/api/tasks?limit=300&order_by=due_at"),
          apiFetch("/api/activities?limit=300&order_by=due_at"),
        ]);
        setRows(mergeActivityRows(taskList.data || [], activityList.data || []));
      } catch {
        /* list will refresh on next visit */
      }
    }
    reload();
  }

  if (loadStatus === "loading") return <ActivitiesSkeleton />;

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[1440px] flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <nav className={cn("mb-2 flex items-center gap-1.5", crmType.breadcrumb)}>
            <span>Workspace</span>
            <span className="text-primary-300">/</span>
            <span className="font-medium text-primary-700 dark:text-primary-300">
              Activities
            </span>
          </nav>
          <h1 className="text-[26px] leading-8 font-bold tracking-[-0.03em] text-neutral-900 sm:text-[28px] dark:text-neutral-50">
            Activities
          </h1>
          <p className="mt-1 max-w-[56ch] text-[14px] text-neutral-500">
            Plan follow-ups, log calls, and keep every interaction in one place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            className="h-9 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
            onClick={openCreatePicker}
          >
            <Plus className="size-3.5" />
            Create Activity
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = summaryIcon(card.icon);
          return (
            <Card
              key={card.id}
              className="rounded-2xl border-neutral-200/80 py-4 shadow-sm dark:border-neutral-800"
            >
              <CardContent className="px-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[12px] font-medium text-muted-foreground">
                      {card.label}
                    </p>
                    <p
                      className={cn(
                        "mt-1 text-[28px] font-bold leading-none tracking-tight",
                        card.valueClass ||
                          "text-neutral-900 dark:text-neutral-50"
                      )}
                    >
                      {card.value}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center rounded-full",
                      card.iconClass ||
                        "bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-300"
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                </div>
                <p
                  className={cn(
                    "mt-2 text-[11px] text-neutral-500",
                    card.hintClass
                  )}
                >
                  {card.hint}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="overflow-hidden rounded-2xl border-neutral-200/80 py-0 shadow-sm dark:border-neutral-800">
        <div className="flex flex-col gap-0 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 pt-1">
            <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
              {ACTIVITY_TABS.map((item) => {
                const active = tab === item.id;
                const count = tabCounts[item.id] ?? 0;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setTab(item.id);
                      resetPage();
                    }}
                    className={cn(
                      "relative shrink-0 px-3 py-3 text-[13px] font-medium transition-colors",
                      active
                        ? "text-primary-700 dark:text-primary-300"
                        : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                    )}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {item.label}
                      <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-600 tabular-nums dark:bg-neutral-800 dark:text-neutral-300">
                        {formatCount(count)}
                      </span>
                    </span>
                    {active ? (
                      <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary-600" />
                    ) : null}
                  </button>
                );
              })}
            </div>
            <Button
              type="button"
              variant="outline"
              className="mb-1 h-8 shrink-0 rounded-lg border-primary-200 bg-gradient-to-r from-primary-50 to-violet-50 text-[12px] text-primary-700 hover:from-primary-100 hover:to-violet-100 dark:border-primary-800 dark:from-primary-950/80 dark:to-violet-950/50 dark:text-primary-300"
              onClick={() => setPrioritizeOpen(true)}
            >
              <Sparkles className="size-3.5" />
              AI Prioritize Queue
              {openWorkCount > 0 ? (
                <Badge
                  variant="secondary"
                  className="ml-1 h-5 min-w-5 justify-center rounded-full bg-white/80 px-1.5 text-[10px] text-primary-800 dark:bg-primary-950/80 dark:text-primary-200"
                >
                  {Math.min(openWorkCount, 99)}
                </Badge>
              ) : null}
            </Button>
          </div>

          <div className="flex flex-col gap-3 border-t border-neutral-100 p-3 dark:border-neutral-800">
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                <div className="relative min-w-[280px] max-w-xl flex-1">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-neutral-400" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search activities by subject, type, or related record…"
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
                      ["dueAt", "Due date"],
                      ["subject", "Subject"],
                      ["type", "Type"],
                      ["status", "Status"],
                      ["priority", "Priority"],
                      ["owner", "Assignee"],
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
                    {ACTIVITY_TABLE_COLUMNS.map((col) => {
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
              <DateRangePicker
                preset={datePreset}
                range={dateRangeValue}
                onChange={applyDateRange}
                align="end"
                className="shrink-0"
              />
            </div>

          {activeFilterCount > 0 ||
          selected.length > 0 ||
          datePreset !== "Last 30 Days" ? (
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
                    onClick={requestBulkDelete}
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </Button>
                </>
              ) : null}
            </div>
          ) : null}
          </div>
        </div>

        <Table className="min-w-[1180px] table-fixed text-xs">
          <TableHeader>
            <TableRow className="border-b border-neutral-100 bg-neutral-50/80 text-[11px] uppercase tracking-wide text-neutral-500 hover:bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-900/40">
              <TableHead className="w-10 px-3">
                <Checkbox
                  checked={
                    pageRows.length > 0 &&
                    pageRows.every((row) => selected.includes(rowKey(row)))
                  }
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all on page"
                />
              </TableHead>
              {visibleColumns.includes("subject") ? (
                <TableHead className="w-[260px] px-3">
                  <button type="button" onClick={() => toggleSort("subject")}>
                    Subject
                  </button>
                </TableHead>
              ) : null}
              {visibleColumns.includes("type") ? (
                <TableHead className="w-[110px] px-3">
                  <button type="button" onClick={() => toggleSort("type")}>
                    Type
                  </button>
                </TableHead>
              ) : null}
              {visibleColumns.includes("related") ? (
                <TableHead className="w-[180px] px-3">Related To</TableHead>
              ) : null}
              {visibleColumns.includes("owner") ? (
                <TableHead className="w-[150px] px-3">
                  <button type="button" onClick={() => toggleSort("owner")}>
                    Assigned To
                  </button>
                </TableHead>
              ) : null}
              {visibleColumns.includes("dueAt") ? (
                <TableHead className="w-[120px] px-3">
                  <button type="button" onClick={() => toggleSort("dueAt")}>
                    Due Date / Time
                  </button>
                </TableHead>
              ) : null}
              {visibleColumns.includes("priority") ? (
                <TableHead className="w-[100px] px-3">
                  <button type="button" onClick={() => toggleSort("priority")}>
                    Priority
                  </button>
                </TableHead>
              ) : null}
              {visibleColumns.includes("status") ? (
                <TableHead className="w-[120px] px-3">
                  <button type="button" onClick={() => toggleSort("status")}>
                    Status
                  </button>
                </TableHead>
              ) : null}
              <TableHead className="w-[7.5rem] px-3 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length + 2}
                  className="px-3 py-10 text-center text-xs text-muted-foreground"
                >
                  {rows.length === 0
                    ? "No activities yet. Create a task or log a call to get started."
                    : "No activities match your filters."}
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row) => {
                const owner = ownerById(row.assigneeId, owners);
                const statusLabel = displayActivityStatus(row);
                const statusStyle = activityStatusClass(row);
                const priorityStyle =
                  ACTIVITY_PRIORITY_STYLES[row.priority] ||
                  ACTIVITY_PRIORITY_STYLES.medium;
                const related = resolveRelatedDisplay(row, lookups);
                const due = formatActivityDueDisplay(row.dueAt);
                const statusDot = activityStatusDotClass(row);
                const title = row.subject || "Untitled";
                const canQuickComplete = !isCompleted(row);
                return (
                  <TableRow
                    key={rowKey(row)}
                    data-state={
                      selected.includes(rowKey(row)) ? "selected" : undefined
                    }
                    className={cn(
                      isOverdue(row) && "bg-rose-50/30 dark:bg-rose-950/15"
                    )}
                  >
                    <TableCell className="px-3 py-2.5">
                      <Checkbox
                        checked={selected.includes(rowKey(row))}
                        onCheckedChange={() => toggleSelect(rowKey(row))}
                        aria-label={`Select ${title}`}
                      />
                    </TableCell>
                    {visibleColumns.includes("subject") ? (
                      <TableCell className="overflow-hidden px-3 py-2.5">
                        <button
                          type="button"
                          onClick={() => openView(row)}
                          className="flex w-full min-w-0 items-center gap-2.5 text-left"
                        >
                          <span
                            className={cn(
                              "flex size-8 shrink-0 items-center justify-center rounded-lg",
                              ACTIVITY_SUBJECT_ICON_STYLES[row.type] ||
                                ACTIVITY_SUBJECT_ICON_STYLES.task
                            )}
                          >
                            <ActivityTypeIcon type={row.type} />
                          </span>
                          <TruncateText
                            value={title}
                            className="text-xs font-semibold text-foreground hover:text-primary-700 dark:hover:text-primary-300"
                          />
                        </button>
                      </TableCell>
                    ) : null}
                    {visibleColumns.includes("type") ? (
                      <TableCell className="overflow-hidden px-3 py-2.5">
                        <Badge
                          variant="outline"
                          title={activityTypeLabel(row.type)}
                          className={cn(
                            "h-auto max-w-full overflow-hidden border-transparent text-xs capitalize",
                            ACTIVITY_TYPE_STYLES[row.type] ||
                              ACTIVITY_TYPE_STYLES.task
                          )}
                        >
                          <span className="truncate">
                            {activityTypeLabel(row.type)}
                          </span>
                        </Badge>
                      </TableCell>
                    ) : null}
                    {visibleColumns.includes("related") ? (
                      <TableCell className="overflow-hidden px-3 py-2.5">
                        <TruncateText
                          value={related.primary}
                          className="text-xs font-semibold"
                        />
                        {related.secondary ? (
                          <TruncateText
                            value={related.secondary}
                            className="text-[11px] text-primary-600 dark:text-primary-400"
                          />
                        ) : null}
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
                    {visibleColumns.includes("dueAt") ? (
                      <TableCell className="px-3 py-2.5">
                        <p
                          className={cn(
                            "text-xs font-medium",
                            isOverdue(row)
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-neutral-800 dark:text-neutral-200"
                          )}
                        >
                          {due.dateLabel}
                        </p>
                        {due.timeLabel ? (
                          <p className="text-[11px] text-muted-foreground">
                            {due.timeLabel}
                          </p>
                        ) : null}
                      </TableCell>
                    ) : null}
                    {visibleColumns.includes("priority") ? (
                      <TableCell className="overflow-hidden px-3 py-2.5">
                        <Badge
                          variant="outline"
                          title={row.priority || "medium"}
                          className={cn(
                            "h-auto max-w-full overflow-hidden border-transparent text-xs capitalize",
                            priorityStyle
                          )}
                        >
                          <span className="truncate">
                            {row.priority || "medium"}
                          </span>
                        </Badge>
                      </TableCell>
                    ) : null}
                    {visibleColumns.includes("status") ? (
                      <TableCell className="overflow-hidden px-3 py-2.5">
                        <Badge
                          variant="outline"
                          title={statusLabel}
                          className={cn(
                            "h-auto max-w-full gap-1.5 overflow-hidden border-transparent text-xs",
                            statusStyle
                          )}
                        >
                          <span
                            className={cn(
                              "size-1.5 shrink-0 rounded-full",
                              statusDot
                            )}
                            aria-hidden
                          />
                          <span className="truncate">{statusLabel}</span>
                        </Badge>
                      </TableCell>
                    ) : null}
                    <TableCell className="px-3 py-2.5">
                      <div className="flex justify-center">
                        <div className="inline-flex w-[7.5rem] items-center justify-center gap-0.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Mark complete"
                            disabled={!canQuickComplete}
                            className={cn(
                              "shrink-0",
                              !canQuickComplete && "invisible pointer-events-none"
                            )}
                            onClick={() => quickMarkComplete(row)}
                          >
                            <CheckCircle2 className="size-3.5 text-emerald-600" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Edit activity"
                            className="shrink-0"
                            onClick={() => openEdit(row)}
                          >
                            <SquarePen className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Open activity"
                            className="shrink-0"
                            onClick={() => openView(row)}
                          >
                            <CalendarClock className="size-3.5" />
                          </Button>
                        </div>
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
            {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, filtered.length)} of {filtered.length}
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
                {ACTIVITY_PAGE_SIZES.map((size) => (
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
      </Card>

      <Sheet open={filtersOpen} onOpenChange={handleFiltersOpenChange}>
        <SheetContent
          title="Filters"
          description="Narrow activities by type, status, and assignee."
          onClose={() => handleFiltersOpenChange(false)}
        >
          <SheetBody className="space-y-5">
            <div>
              <Label htmlFor="filter-activity-type">Type</Label>
              <Select
                value={draftTypeFilter}
                onValueChange={setDraftTypeFilter}
              >
                <SelectTrigger
                  id="filter-activity-type"
                  className="mt-1.5 h-9 w-full rounded-lg"
                >
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {ACTIVITY_TYPE_LIST.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filter-activity-status">Status</Label>
              <Select
                value={draftStatusFilter}
                onValueChange={setDraftStatusFilter}
              >
                <SelectTrigger
                  id="filter-activity-status"
                  className="mt-1.5 h-9 w-full rounded-lg"
                >
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_STATUS_FILTER_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filter-activity-owner">Assignee</Label>
              <Select
                value={draftOwnerFilter}
                onValueChange={setDraftOwnerFilter}
              >
                <SelectTrigger
                  id="filter-activity-owner"
                  className="mt-1.5 h-9 w-full rounded-lg"
                >
                  <SelectValue placeholder="Assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All owners</SelectItem>
                  {owners.map((owner) => (
                    <SelectItem key={owner.id} value={String(owner.id)}>
                      {owner.name}
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

      <Sheet open={prioritizeOpen} onOpenChange={setPrioritizeOpen}>
        <SheetContent
          title="AI Prioritize Queue"
          description="Smart ranking of open work by urgency, due date, priority, and assignment."
          maxWidth={440}
          onClose={() => setPrioritizeOpen(false)}
        >
          <SheetBody className="space-y-2">
            {prioritizeQueue.length === 0 ? (
              <p className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/80 px-4 py-8 text-center text-[13px] text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/40">
                No open activities to rank. You&apos;re caught up.
              </p>
            ) : (
              prioritizeQueue.map((item, index) => {
                const { row, reason } = item;
                const owner = ownerById(row.assigneeId, owners);
                const related = resolveRelatedDisplay(row, lookups);
                const due = formatActivityDueDisplay(row.dueAt);
                const dueText = due.timeLabel
                  ? `${due.dateLabel} · ${due.timeLabel}`
                  : due.dateLabel;
                return (
                  <Card
                    key={`${row.recordKind}:${row.id}`}
                    size="sm"
                    className="py-0"
                  >
                    <CardContent className="flex gap-3 px-3 py-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-[11px] font-bold text-primary-800 tabular-nums dark:bg-primary-950 dark:text-primary-200">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex items-start gap-2">
                          <span
                            className={cn(
                              "flex size-8 shrink-0 items-center justify-center rounded-lg",
                              ACTIVITY_SUBJECT_ICON_STYLES[row.type] ||
                                ACTIVITY_SUBJECT_ICON_STYLES.task
                            )}
                          >
                            <ActivityTypeIcon type={row.type} />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold text-foreground">
                              {row.subject || "Untitled"}
                            </p>
                            <p className="mt-0.5 text-[11px] text-neutral-500">
                              {activityTypeLabel(row.type)} · {owner.name} ·{" "}
                              {dueText}
                            </p>
                          </div>
                        </div>
                        <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                          <span className="font-medium text-primary-700 dark:text-primary-300">
                            {reason}
                          </span>
                          {related.primary !== "—" ? (
                            <> · {related.primary}</>
                          ) : null}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 rounded-md text-[11px]"
                            onClick={() => {
                              setPrioritizeOpen(false);
                              openView(row);
                            }}
                          >
                            Open
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 rounded-md text-[11px]"
                            onClick={() => {
                              setPrioritizeOpen(false);
                              openEdit(row);
                            }}
                          >
                            Edit
                          </Button>
                          {!isCompleted(row) ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-7 rounded-md text-[11px] text-emerald-700 hover:text-emerald-800"
                              onClick={() => quickMarkComplete(row)}
                            >
                              <CheckCircle2 className="size-3" />
                              Complete
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </SheetBody>
          <SheetFooter className="flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => {
                setTab("overdue");
                resetPage();
                setPrioritizeOpen(false);
              }}
            >
              View overdue tab
            </Button>
            <Button
              type="button"
              className="w-full bg-primary-600 text-white hover:bg-primary-700 sm:w-auto"
              onClick={() => {
                setTab("mine");
                resetPage();
                setPrioritizeOpen(false);
              }}
            >
              Show my activities
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={typePickerOpen} onOpenChange={setTypePickerOpen}>
        <DialogContent
          title="Create activity"
          description="Choose what you want to add."
          onClose={() => setTypePickerOpen(false)}
        >
          <DialogBody className="grid gap-2 sm:grid-cols-2">
            {ACTIVITY_TYPE_LIST.map((item) => (
              <Button
                key={item.value}
                type="button"
                variant="outline"
                className="h-auto justify-start py-3"
                onClick={() => pickType(item.value)}
              >
                {item.label}
              </Button>
            ))}
          </DialogBody>
        </DialogContent>
      </Dialog>

      <ActivityFormDrawer
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingRecord(null);
        }}
        type={formType}
        mode={editingRecord ? "edit" : "create"}
        initialRecord={editingRecord}
        owners={owners}
        contacts={contacts}
        companies={companies}
        deals={deals}
        leads={leads}
        currentUserId={currentUserId}
        onSaved={handleSaved}
      />

      <Dialog
        open={Boolean(deletePrompt)}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeletePrompt(null);
        }}
      >
        <DialogContent
          title={
            deletePrompt?.mode === "bulk"
              ? "Delete activities?"
              : "Delete activity?"
          }
          description="This cannot be undone."
          onClose={() => !deleting && setDeletePrompt(null)}
        >
          <DialogBody>
            {deletePrompt?.mode === "bulk" ? (
              <p className="text-[13px] text-muted-foreground">
                Remove <strong>{selected.length}</strong> selected{" "}
                {selected.length === 1 ? "activity" : "activities"} from your
                workspace?
              </p>
            ) : (
              <p className="text-[13px] text-muted-foreground">
                Remove{" "}
                <strong>{deletePrompt?.subject || "this activity"}</strong>{" "}
                from your workspace?
              </p>
            )}
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletePrompt(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting
                ? "Deleting…"
                : deletePrompt?.mode === "bulk"
                  ? "Delete selected"
                  : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
