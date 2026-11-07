"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { format, parseISO } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDownUp,
  BadgeCheck,
  Building2,
  Columns3,
  Download,
  Eye,
  Filter,
  LayoutGrid,
  LayoutList,
  MapPin,
  Plus,
  Search,
  Sparkles,
  SquarePen,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { CompanyFormDrawer } from "@/components/companies/company-form-drawer";
import {
  fromApiCompany,
  mapMemberToOwner,
  persistCompanyMeta,
  toApiCompany,
} from "@/components/companies/company-api";
import {
  COMPANY_INDUSTRIES,
  COMPANY_KPI_DEFINITIONS,
  formatCompanyRevenue,
  locationLabel,
} from "@/components/companies/companies-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/api";
import { crmType } from "@/lib/crm-typography";
import { cn } from "@/lib/utils";

const PAGE_SIZES = [10, 20, 40, 50, 100];

const ALL_COLUMNS = [
  { id: "company", label: "Company" },
  { id: "website", label: "Website" },
  { id: "industry", label: "Industry" },
  { id: "size", label: "Company Size" },
  { id: "location", label: "Location" },
  { id: "revenue", label: "Annual Revenue" },
  { id: "owner", label: "Owner" },
  { id: "createdAt", label: "Created Date" },
];

const DEFAULT_VISIBLE_COLUMNS = [
  "company",
  "website",
  "industry",
  "size",
  "location",
  "owner",
  "createdAt",
];

const INDUSTRY_ACCENT = {
  Technology: "bg-sky-500",
  "Software / SaaS": "bg-violet-500",
  "Financial Services": "bg-emerald-500",
  Healthcare: "bg-rose-500",
  Retail: "bg-amber-500",
  Manufacturing: "bg-orange-500",
  "Professional Services": "bg-blue-500",
  Telecommunications: "bg-cyan-500",
  Other: "bg-neutral-400",
};

function formatCount(n) {
  return new Intl.NumberFormat("en-US").format(n);
}

function formatDate(value) {
  if (!value) return "—";
  try {
    return format(parseISO(String(value).slice(0, 10)), "MMM d, yyyy");
  } catch {
    return value;
  }
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
                pointerEvents: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
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

export function CompaniesSkeleton() {
  return (
    <div
      className="mx-auto flex w-full min-w-0 max-w-[1440px] flex-col gap-6"
      aria-busy="true"
      aria-label="Loading companies"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <SkeletonBlock className="h-3 w-28 rounded-md" />
          <SkeletonBlock className="h-8 w-36 rounded-lg" />
          <SkeletonBlock className="h-4 w-72 max-w-full rounded-md" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SkeletonBlock className="h-9 w-[132px] rounded-lg" />
          <SkeletonBlock className="h-9 w-9 rounded-lg" />
          <SkeletonBlock className="h-9 w-[130px] rounded-lg" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SummaryCardSkeleton key={i} />
        ))}
      </div>
      <Card className="overflow-hidden py-0">
        <div className="flex flex-col gap-3 border-b border-neutral-100 p-3 dark:border-neutral-800">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <SkeletonBlock className="h-9 min-w-[280px] max-w-xl flex-1 rounded-lg" />
              <SkeletonBlock className="h-9 w-[88px] rounded-lg" />
              <SkeletonBlock className="h-9 w-[72px] rounded-lg" />
              <SkeletonBlock className="h-9 w-[96px] rounded-lg" />
            </div>
            <SkeletonBlock className="h-9 w-[160px] rounded-lg" />
          </div>
        </div>
        <div className="h-80 animate-pulse bg-muted/30" />
      </Card>
    </div>
  );
}

function summaryIcon(name) {
  if (name === "sparkles") return Sparkles;
  if (name === "badge-check") return BadgeCheck;
  if (name === "users") return Users;
  return Building2;
}

function CompanyGridCard({
  company,
  owner,
  contactCount,
  dealCount,
  onOpen,
  onEdit,
  onDelete,
}) {
  const website = company.website?.trim();
  const siteLabel = website
    ? website.replace(/^https?:\/\//, "").replace(/\/$/, "")
    : company.domain || "";

  function handleCardClick(event) {
    if (event.target.closest("[data-card-action]")) return;
    onOpen();
  }

  function handleCardKeyDown(event) {
    if (event.key !== "Enter" && event.key !== " ") return;
    if (event.target.closest("[data-card-action]")) return;
    event.preventDefault();
    onOpen();
  }

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      className={cn(
        "group relative flex min-h-[188px] flex-col rounded-xl bg-white p-3 text-left shadow-[0_1px_2px_rgba(15,23,42,0.05)] ring-1 ring-neutral-200/80 transition-all",
        "hover:-translate-y-0.5 hover:shadow-[0_10px_22px_-8px_rgba(15,23,42,0.18)] hover:ring-neutral-300",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40",
        "dark:bg-neutral-900 dark:ring-neutral-800 dark:hover:ring-neutral-700"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-3 left-0 w-[3px] rounded-full",
          INDUSTRY_ACCENT[company.industry] || INDUSTRY_ACCENT.Other
        )}
      />

      <div className="flex items-center gap-2.5 pl-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-[13px] font-semibold tracking-[-0.01em] text-neutral-900 dark:text-neutral-50">
              {company.name}
            </p>
            <div
              className="flex shrink-0 items-center gap-0.5 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
              data-card-action
              onClick={(event) => event.stopPropagation()}
            >
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                aria-label="Delete company"
                onClick={onDelete}
              >
                <Trash2 className="size-3.5 text-destructive" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-7"
                aria-label="Edit company"
                onClick={onEdit}
              >
                <SquarePen className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2.5 space-y-1.5 pl-4">
        {siteLabel ? (
          <p className="flex min-w-0 items-center gap-1.5 text-[12px] text-neutral-600 dark:text-neutral-300">
            <Building2 className="size-3 shrink-0 text-neutral-400" />
            <span className="truncate">{siteLabel}</span>
          </p>
        ) : null}
        {locationLabel(company) !== "—" ? (
          <p className="flex min-w-0 items-center gap-1.5 text-[12px] text-neutral-600 dark:text-neutral-300">
            <MapPin className="size-3 shrink-0 text-neutral-400" />
            <span className="truncate">{locationLabel(company)}</span>
          </p>
        ) : null}
      </div>

      <div className="mt-3 mb-2 flex flex-wrap items-center gap-1.5 pl-4">
        {company.industry ? (
          <Badge
            variant="outline"
            className="h-5 max-w-full overflow-hidden border-transparent bg-muted/60 text-[10px]"
          >
            <span className="truncate">{company.industry}</span>
          </Badge>
        ) : null}
        {company.size ? (
          <Badge variant="outline" className="h-5 text-[10px]">
            {company.size}
          </Badge>
        ) : null}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-neutral-100 pt-2.5 pl-4 dark:border-neutral-800">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-semibold">
            {owner.initials}
          </span>
          <span className="truncate text-[11px] text-neutral-500">{owner.name}</span>
        </div>
        <span className="shrink-0 text-[11px] text-neutral-400 tabular-nums">
          {contactCount} contacts · {dealCount} deals
        </span>
      </div>
    </article>
  );
}

function exportCompanies(rows) {
  const header = [
    "name",
    "website",
    "industry",
    "size",
    "city",
    "country",
    "owner_id",
    "created_at",
  ];
  const lines = rows.map((row) =>
    header
      .map((key) => `"${String(row[key] ?? "").replaceAll('"', '""')}"`)
      .join(",")
  );
  const csv = [header.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "novacrm-companies.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function CompaniesHome() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loadStatus, setLoadStatus] = useState("loading");
  const [companies, setCompanies] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [owners, setOwners] = useState([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [query, setQuery] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [draftIndustry, setDraftIndustry] = useState("all");
  const [draftOwner, setDraftOwner] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [view, setView] = useState("table");
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_VISIBLE_COLUMNS);
  const [selected, setSelected] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadStatus("loading");
      try {
        const [ws, companyList, contactList, dealList, members] =
          await Promise.all([
            apiFetch("/api/workspace"),
            apiFetch("/api/companies?order_by=name&limit=500"),
            apiFetch("/api/contacts?order_by=created_at&limit=500"),
            apiFetch("/api/deals?order_by=created_at&limit=500"),
            apiFetch("/api/workspace/members"),
          ]);
        if (cancelled) return;
        setCurrentUserId(ws.user?.id || "");
        setOwners((members.data || []).map(mapMemberToOwner));
        setCompanies((companyList.data || []).map((row) => fromApiCompany(row)));
        setContacts(contactList.data || []);
        setDeals(dealList.data || []);
        setLoadStatus("ready");
      } catch (error) {
        if (!cancelled) {
          toast.error(error.message || "Could not load companies");
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
    if (searchParams.get("action") !== "create") return;
    queueMicrotask(() => {
      setEditingCompany(null);
      setFormOpen(true);
    });
  }, [searchParams]);

  const contactCountByCompany = useMemo(() => {
    const map = {};
    for (const row of contacts) {
      const cid = row.company_id;
      if (!cid) continue;
      map[cid] = (map[cid] || 0) + 1;
    }
    return map;
  }, [contacts]);

  const dealCountByCompany = useMemo(() => {
    const map = {};
    for (const row of deals) {
      const cid = row.company_id;
      if (!cid) continue;
      map[cid] = (map[cid] || 0) + 1;
    }
    return map;
  }, [deals]);

  const companyStats = useMemo(() => {
    const now = new Date();
    const total = companies.length;
    const newThisMonth = companies.filter((row) => {
      if (!row.createdAt) return false;
      const d = new Date(row.createdAt);
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    }).length;
    const active = companies.filter((row) => row.status === "Active").length;
    const withoutContacts = companies.filter(
      (row) => !(contactCountByCompany[row.id] > 0)
    ).length;
    return { total, newThisMonth, active, withoutContacts };
  }, [companies, contactCountByCompany]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = companies.filter((row) => {
      if (industryFilter !== "all" && row.industry !== industryFilter) {
        return false;
      }
      if (ownerFilter !== "all" && row.ownerId !== ownerFilter) return false;
      if (!q) return true;
      const hay = `${row.name} ${row.website} ${row.domain} ${row.industry} ${locationLabel(row)}`.toLowerCase();
      return hay.includes(q);
    });
    const dir = sortDir === "asc" ? 1 : -1;
    rows = [...rows].sort((a, b) => {
      if (sortKey === "name") {
        return a.name.localeCompare(b.name) * dir;
      }
      if (sortKey === "revenue") {
        return (
          (Number(a.annualRevenue || 0) - Number(b.annualRevenue || 0)) * dir
        );
      }
      return (
        String(a.createdAt || "").localeCompare(String(b.createdAt || "")) * dir
      );
    });
    return rows;
  }, [companies, query, industryFilter, ownerFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const ownerName = (id) =>
    owners.find((row) => row.id === id)?.name || "Unassigned";

  const ownerById = (id) =>
    owners.find((row) => row.id === id) || {
      id: "",
      name: "Unassigned",
      initials: "?",
    };

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
    const pageIds = pageRows.map((row) => row.id);
    const allSelected =
      pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
    if (allSelected) {
      setSelected((prev) => prev.filter((id) => !pageIds.includes(id)));
      return;
    }
    setSelected((prev) => [...new Set([...prev, ...pageIds])]);
  }

  function openCompany(row) {
    router.push(`/companies/${row.id}`);
  }

  function openEditCompany(row) {
    setEditingCompany(row);
    setFormOpen(true);
  }

  const activeFilterCount =
    (industryFilter !== "all" ? 1 : 0) + (ownerFilter !== "all" ? 1 : 0);

  function resetPage() {
    setPage(1);
  }

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
    resetPage();
  }

  function clearFilters() {
    setIndustryFilter("all");
    setOwnerFilter("all");
    setDraftIndustry("all");
    setDraftOwner("all");
    resetPage();
  }

  function openCreate() {
    setEditingCompany(null);
    setFormOpen(true);
    router.replace("/companies?action=create", { scroll: false });
  }

  function closeForm(open) {
    setFormOpen(open);
    if (!open) {
      setEditingCompany(null);
      router.replace("/companies", { scroll: false });
    }
  }

  async function handleSave(data, { isEdit }) {
    const payload = toApiCompany(data);
    const response = isEdit
      ? await apiFetch(`/api/companies/${data.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        })
      : await apiFetch("/api/companies", {
          method: "POST",
          body: JSON.stringify(payload),
        });
    const saved = fromApiCompany(response.data);
    const merged = {
      ...saved,
      companyType: data.companyType,
      status: data.status || "Active",
      annualRevenue: data.annualRevenue,
      foundedYear: data.foundedYear,
      country: data.country,
      state: data.state,
      city: data.city,
      address: data.address,
      description: data.description,
      logoUrl: data.logoUrl,
    };
    persistCompanyMeta(merged);
    setCompanies((prev) => {
      if (isEdit) {
        return prev.map((row) => (row.id === merged.id ? merged : row));
      }
      return [merged, ...prev];
    });
    toast.success(isEdit ? "Company updated" : "Company created");
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/companies/${deleteTarget.id}`, { method: "DELETE" });
      setCompanies((prev) => prev.filter((row) => row.id !== deleteTarget.id));
      toast.success("Company deleted");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error.message || "Could not delete company");
    } finally {
      setDeleting(false);
    }
  }

  const kpiCards = COMPANY_KPI_DEFINITIONS.map((card) => {
    const valueById = {
      total: companyStats.total,
      new: companyStats.newThisMonth,
      active: companyStats.active,
      withoutContacts: companyStats.withoutContacts,
    };
    return { ...card, value: formatCount(valueById[card.id] ?? 0) };
  });

  if (loadStatus === "loading") return <CompaniesSkeleton />;

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[1440px] flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <nav className={cn("mb-2 flex items-center gap-1.5", crmType.breadcrumb)}>
            <span>Workspace</span>
            <span className="text-primary-300">/</span>
            <span className="font-medium text-primary-700 dark:text-primary-300">
              Companies
            </span>
          </nav>
          <h1 className="text-[26px] leading-8 font-bold tracking-[-0.03em] text-neutral-900 sm:text-[28px] dark:text-neutral-50">
            Companies
          </h1>
          <p className="mt-1 max-w-[56ch] text-[14px] text-neutral-500">
            Manage organizations, business relationships, and company accounts.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-lg"
            onClick={() => toast.message("CSV import coming soon")}
          >
            <Upload className="size-3.5" />
            Import Companies
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-lg"
            aria-label="Export companies"
            onClick={() => setExportOpen(true)}
          >
            <Download className="size-4" />
          </Button>
          <Button
            type="button"
            className="h-9 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
            onClick={openCreate}
          >
            <Plus className="size-3.5" />
            Add Company
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => {
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

      {(industryFilter !== "all" || ownerFilter !== "all") && (
        <div className="flex flex-wrap items-center gap-2">
          {industryFilter !== "all" ? (
            <Badge variant="secondary" className="gap-1 rounded-full pl-2">
              Industry: {industryFilter}
              <button
                type="button"
                aria-label="Clear industry"
                onClick={() => {
                  setIndustryFilter("all");
                  resetPage();
                }}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ) : null}
          {ownerFilter !== "all" ? (
            <Badge variant="secondary" className="gap-1 rounded-full pl-2">
              Owner: {ownerName(ownerFilter)}
              <button
                type="button"
                aria-label="Clear owner"
                onClick={() => {
                  setOwnerFilter("all");
                  resetPage();
                }}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ) : null}
        </div>
      )}

      <Card className="overflow-hidden py-0">
        <div className="flex flex-col gap-3 border-b border-neutral-100 p-3 dark:border-neutral-800">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <div className="relative min-w-[280px] max-w-xl flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-neutral-400" />
                <Input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    resetPage();
                  }}
                  placeholder="Search companies by name, website, or industry…"
                  className="h-9 pl-8"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-lg"
                onClick={() => {
                  setDraftIndustry(industryFilter);
                  setDraftOwner(ownerFilter);
                  setFiltersOpen(true);
                }}
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
                    ["name", "Company name"],
                    ["createdAt", "Created date"],
                    ["revenue", "Revenue"],
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
                <TabsTrigger value="grid" className="gap-1.5 px-2.5">
                  <LayoutGrid className="size-3.5" />
                  Grid
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {activeFilterCount > 0 || selected.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              {activeFilterCount > 0 ? (
                <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
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
                            apiFetch(`/api/companies/${id}`, { method: "DELETE" })
                          )
                        );
                        setCompanies((prev) =>
                          prev.filter((row) => !ids.includes(row.id))
                        );
                        setSelected([]);
                        toast.success("Selected companies removed");
                      } catch (error) {
                        toast.error(error.message || "Could not delete companies");
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
              {visibleColumns.includes("company") ? (
                <TableHead className="w-[200px] px-3">
                  <button type="button" onClick={() => toggleSort("name")}>
                    Company
                  </button>
                </TableHead>
              ) : null}
              {visibleColumns.includes("website") ? (
                <TableHead className="w-[160px] px-3">Website</TableHead>
              ) : null}
              {visibleColumns.includes("industry") ? (
                <TableHead className="w-[140px] px-3">Industry</TableHead>
              ) : null}
              {visibleColumns.includes("size") ? (
                <TableHead className="w-[110px] px-3">Size</TableHead>
              ) : null}
              {visibleColumns.includes("location") ? (
                <TableHead className="w-[140px] px-3">Location</TableHead>
              ) : null}
              {visibleColumns.includes("revenue") ? (
                <TableHead className="w-[100px] px-3">
                  <button type="button" onClick={() => toggleSort("revenue")}>
                    Revenue
                  </button>
                </TableHead>
              ) : null}
              {visibleColumns.includes("owner") ? (
                <TableHead className="w-[120px] px-3">Owner</TableHead>
              ) : null}
              {visibleColumns.includes("createdAt") ? (
                <TableHead className="w-[120px] px-3">
                  <button type="button" onClick={() => toggleSort("createdAt")}>
                    Created Date
                  </button>
                </TableHead>
              ) : null}
              <TableHead className="w-[88px] px-3 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length + 2}
                  className="px-3 py-10 text-center text-xs text-muted-foreground"
                >
                  No companies match your filters.
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row) => {
                const website = row.website?.trim();
                const href = website
                  ? website.startsWith("http")
                    ? website
                    : `https://${website}`
                  : row.domain
                    ? `https://${row.domain.replace(/^https?:\/\//, "")}`
                    : null;
                const siteLabel = website
                  ? website.replace(/^https?:\/\//, "").replace(/\/$/, "")
                  : row.domain || "";
                return (
                  <TableRow
                    key={row.id}
                    data-state={selected.includes(row.id) ? "selected" : undefined}
                  >
                    <TableCell className="px-3 py-2.5">
                      <Checkbox
                        checked={selected.includes(row.id)}
                        onCheckedChange={() => toggleSelect(row.id)}
                        aria-label={`Select ${row.name}`}
                      />
                    </TableCell>
                    {visibleColumns.includes("company") ? (
                      <TableCell className="overflow-hidden px-3 py-2.5">
                        <button
                          type="button"
                          onClick={() => openCompany(row)}
                          className="block w-full min-w-0 text-left"
                        >
                          <TruncateText
                            value={row.name}
                            className="text-xs font-semibold"
                          />
                        </button>
                      </TableCell>
                    ) : null}
                    {visibleColumns.includes("website") ? (
                      <TableCell className="overflow-hidden px-3 py-2.5">
                        {href && siteLabel ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            className="block min-w-0 text-xs text-primary-700 hover:underline dark:text-primary-300"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <TruncateText value={siteLabel} className="text-xs" />
                          </a>
                        ) : (
                          <TruncateText
                            value=""
                            className="text-xs text-muted-foreground"
                          />
                        )}
                      </TableCell>
                    ) : null}
                    {visibleColumns.includes("industry") ? (
                      <TableCell className="overflow-hidden px-3 py-2.5">
                        <TruncateText
                          value={row.industry}
                          className="text-xs text-muted-foreground"
                        />
                      </TableCell>
                    ) : null}
                    {visibleColumns.includes("size") ? (
                      <TableCell className="overflow-hidden px-3 py-2.5">
                        <TruncateText
                          value={row.size}
                          className="text-xs text-muted-foreground"
                        />
                      </TableCell>
                    ) : null}
                    {visibleColumns.includes("location") ? (
                      <TableCell className="overflow-hidden px-3 py-2.5">
                        <TruncateText
                          value={locationLabel(row)}
                          className="text-xs text-muted-foreground"
                        />
                      </TableCell>
                    ) : null}
                    {visibleColumns.includes("revenue") ? (
                      <TableCell className="overflow-hidden px-3 py-2.5">
                        <TruncateText
                          value={formatCompanyRevenue(row.annualRevenue)}
                          className="text-xs"
                        />
                      </TableCell>
                    ) : null}
                    {visibleColumns.includes("owner") ? (
                      <TableCell className="overflow-hidden px-3 py-2.5">
                        <TruncateText
                          value={ownerName(row.ownerId)}
                          className="text-xs"
                        />
                      </TableCell>
                    ) : null}
                    {visibleColumns.includes("createdAt") ? (
                      <TableCell className="px-3 py-2.5 text-xs text-muted-foreground">
                        {formatDate(row.createdAt)}
                      </TableCell>
                    ) : null}
                    <TableCell className="px-3 py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label="View company"
                          onClick={() => openCompany(row)}
                        >
                          <Eye className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Edit company"
                          onClick={() => openEditCompany(row)}
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
            {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                setPageSize(Number(value));
                resetPage();
              }}
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
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
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
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Next
            </Button>
          </div>
        </div>
          </>
        ) : (
          <>
            <div className="p-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {pageRows.length === 0 ? (
                  <p className="col-span-full py-12 text-center text-sm text-muted-foreground">
                    No companies match your filters.
                  </p>
                ) : (
                  pageRows.map((row) => (
                    <CompanyGridCard
                      key={row.id}
                      company={row}
                      owner={ownerById(row.ownerId)}
                      contactCount={contactCountByCompany[row.id] ?? 0}
                      dealCount={dealCountByCompany[row.id] ?? 0}
                      onOpen={() => router.push(`/companies/${row.id}`)}
                      onEdit={() => {
                        setEditingCompany(row);
                        setFormOpen(true);
                      }}
                      onDelete={() => setDeleteTarget(row)}
                    />
                  ))
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 px-3 py-2.5 dark:border-neutral-800">
              <p className="text-[12px] text-neutral-500">
                Showing{" "}
                {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1}–
                {Math.min(page * pageSize, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <Select
                  value={String(pageSize)}
                  onValueChange={(value) => {
                    setPageSize(Number(value));
                    resetPage();
                  }}
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
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
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
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <CompanyFormDrawer
        open={formOpen}
        onOpenChange={closeForm}
        initialCompany={editingCompany}
        onSave={handleSave}
        owners={owners}
        defaultOwnerId={currentUserId}
        existingCompanies={companies}
      />

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent title="Filter companies" onClose={() => setFiltersOpen(false)}>
          <SheetBody className="space-y-4">
            <div>
              <Label>Industry</Label>
              <Select value={draftIndustry} onValueChange={setDraftIndustry}>
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All industries</SelectItem>
                  {COMPANY_INDUSTRIES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Owner</Label>
              <Select value={draftOwner} onValueChange={setDraftOwner}>
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All owners</SelectItem>
                  {owners.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </SheetBody>
          <SheetFooter>
            <Button variant="outline" onClick={() => setFiltersOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-primary-600 text-white hover:bg-primary-700"
              onClick={() => {
                setIndustryFilter(draftIndustry);
                setOwnerFilter(draftOwner);
                setPage(1);
                setFiltersOpen(false);
              }}
            >
              Apply
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent title="Export companies">
          <DialogBody>
            <p className="text-[13px] text-muted-foreground">
              Export {filtered.length} company record(s) to CSV (core fields from the API).
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-primary-600 text-white hover:bg-primary-700"
              onClick={() => {
                exportCompanies(
                  filtered.map((row) => ({
                    name: row.name,
                    website: row.website,
                    industry: row.industry,
                    size: row.size,
                    city: row.city,
                    country: row.country,
                    owner_id: row.ownerId,
                    created_at: row.createdAt,
                  }))
                );
                setExportOpen(false);
                toast.success("Export started");
              }}
            >
              <Download className="size-3.5" />
              Download CSV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent
          title="Delete company?"
          description="Associated contacts, leads, deals, and activities are not deleted. Links may be cleared or require reassignment."
          onClose={() => setDeleteTarget(null)}
        >
          <DialogBody>
            <p className="text-[13px] text-muted-foreground">
              Remove <strong>{deleteTarget?.name}</strong> from your workspace? This cannot be
              undone.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={confirmDelete}
            >
              {deleting ? "Deleting…" : "Delete company"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
