"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import {
  Activity,
  ArrowDownUp,
  BadgeCheck,
  Columns3,
  Download,
  Filter,
  LayoutGrid,
  LayoutList,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  Trash2,
  Upload,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import { ContactFormDrawer } from "@/components/contacts/contact-form-drawer";
import {
  fromApiContact,
  mapMemberToOwner,
  persistContactMeta,
  toApiContact,
} from "@/components/contacts/contact-api";
import {
  CONTACT_TYPES,
  CONTACT_TYPE_STYLES,
  CONTACT_OWNERS,
  KPI_CARD_VALUES,
  LIFECYCLE_STATUSES,
  LIFECYCLE_STYLES,
  fullName,
  initials,
  ownerById,
  tagStyleAt,
} from "@/components/contacts/contacts-data";
import { parseContactCsvFile } from "@/components/contacts/contact-import";
import { CsvImportDialog } from "@/components/shared/csv-import-dialog";
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
import { cn } from "@/lib/utils";

const ALL_COLUMNS = [
  { id: "name", label: "Name" },
  { id: "company", label: "Company" },
  { id: "title", label: "Job title" },
  { id: "type", label: "Type" },
  { id: "lifecycle", label: "Lifecycle" },
  { id: "owner", label: "Owner" },
  { id: "tags", label: "Tags" },
  { id: "lastActivity", label: "Last activity" },
  { id: "createdAt", label: "Created" },
];

const DEFAULT_VISIBLE_COLUMNS = [
  "name",
  "company",
  "title",
  "type",
  "lifecycle",
  "owner",
  "lastActivity",
];

const PAGE_SIZES = [10, 20, 40, 50];

function formatCount(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatDate(value) {
  if (!value) return "—";
  try {
    return format(parseISO(String(value).slice(0, 10)), "MMM d, yyyy");
  } catch {
    return value;
  }
}

function summaryIcon(name) {
  switch (name) {
    case "users":
      return Users;
    case "user-plus":
      return UserPlus;
    case "badge-check":
      return BadgeCheck;
    case "activity":
      return Activity;
    default:
      return Users;
  }
}

function SkeletonBlock({ className }) {
  return <div className={cn("animate-pulse bg-muted", className)} />;
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

export function ContactsSkeleton() {
  return (
    <div
      className="mx-auto flex w-full min-w-0 max-w-[1440px] flex-col gap-6"
      aria-busy="true"
      aria-label="Loading contacts"
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
          <SkeletonBlock className="h-9 w-[120px] rounded-lg" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SummaryCardSkeleton key={i} />
        ))}
      </div>
      <Card className="overflow-hidden py-0">
        <div className="border-b p-3">
          <SkeletonBlock className="h-9 w-full max-w-md rounded-lg" />
        </div>
        <SkeletonBlock className="h-64 w-full rounded-none" />
      </Card>
    </div>
  );
}

export function ContactsHome() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loadStatus, setLoadStatus] = useState("loading");
  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [owners, setOwners] = useState(CONTACT_OWNERS);
  const [currentUserId, setCurrentUserId] = useState("");
  const [view, setView] = useState("table");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [lifecycleFilter, setLifecycleFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [draftType, setDraftType] = useState("all");
  const [draftLifecycle, setDraftLifecycle] = useState("all");
  const [draftOwner, setDraftOwner] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortKey, setSortKey] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_VISIBLE_COLUMNS);
  const [formOpen, setFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const companyMap = useMemo(
    () => Object.fromEntries(companies.map((c) => [c.id, c.name])),
    [companies]
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadStatus("loading");
      try {
        const [ws, list, companyList, members] = await Promise.all([
          apiFetch("/api/workspace"),
          apiFetch("/api/contacts?order_by=created_at&limit=500"),
          apiFetch("/api/companies?order_by=name&limit=200"),
          apiFetch("/api/workspace/members"),
        ]);
        if (cancelled) return;
        const mappedOwners = (members.data || []).map(mapMemberToOwner);
        setOwners(mappedOwners.length ? mappedOwners : CONTACT_OWNERS);
        setCurrentUserId(ws.user?.id || "");
        setCompanies(companyList.data || []);
        setContacts((list.data || []).map((row) => fromApiContact(row)));
        setLoadStatus("ready");
      } catch (error) {
        if (!cancelled) {
          toast.error(error.message || "Could not load contacts");
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
      setEditingContact(null);
      setFormOpen(true);
    });
  }, [searchParams]);

  const activeFilterCount = [
    typeFilter !== "all",
    lifecycleFilter !== "all",
    ownerFilter !== "all",
    query.trim().length > 0,
  ].filter(Boolean).length;

  const filteredContacts = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = contacts.filter((contact) => {
      if (typeFilter !== "all" && contact.contactType !== typeFilter) return false;
      if (lifecycleFilter !== "all" && contact.lifecycle !== lifecycleFilter)
        return false;
      if (ownerFilter !== "all" && contact.ownerId !== ownerFilter) return false;
      if (!q) return true;
      const company = companyMap[contact.companyId] || "";
      const hay = `${fullName(contact)} ${contact.email} ${company} ${(contact.tags || []).join(" ")}`.toLowerCase();
      return hay.includes(q);
    });

    rows = [...rows].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "name") {
        return fullName(a).localeCompare(fullName(b)) * dir;
      }
      if (sortKey === "owner") {
        return (
          ownerById(a.ownerId, owners).name.localeCompare(
            ownerById(b.ownerId, owners).name
          ) * dir
        );
      }
      if (sortKey === "company") {
        return (
          (companyMap[a.companyId] || "").localeCompare(
            companyMap[b.companyId] || ""
          ) * dir
        );
      }
      const av = a[sortKey] || contactSortValue(a, sortKey);
      const bv = b[sortKey] || contactSortValue(b, sortKey);
      return String(av).localeCompare(String(bv)) * dir;
    });

    return rows;

    function contactSortValue(c, key) {
      if (key === "lastActivity") return c.lastActivityAt || "";
      return c[key] || "";
    }
  }, [
    contacts,
    query,
    typeFilter,
    lifecycleFilter,
    ownerFilter,
    sortKey,
    sortDir,
    owners,
    companyMap,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredContacts.length / pageSize));
  const pageRows = filteredContacts.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  function resetPage() {
    setPage(1);
  }

  function openCreate() {
    setEditingContact(null);
    setFormOpen(true);
    router.replace("/contacts?action=create", { scroll: false });
  }

  function closeForm(open) {
    setFormOpen(open);
    if (!open) {
      setEditingContact(null);
      router.replace("/contacts", { scroll: false });
    }
  }

  function openContact(contact) {
    router.push(`/contacts/${contact.id}`);
  }

  async function handleSaveContact(data, { isEdit }) {
    const payload = toApiContact(data);
    const response = isEdit
      ? await apiFetch(`/api/contacts/${data.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        })
      : await apiFetch("/api/contacts", {
          method: "POST",
          body: JSON.stringify({
            ...payload,
            owner_id: data.ownerId || currentUserId || null,
          }),
        });
    const saved = fromApiContact(response.data);
    const merged = {
      ...saved,
      contactType: data.contactType,
      lifecycle: data.lifecycle,
      tags: data.tags,
      linkedIn: data.linkedIn,
      notes: data.notes,
      department: data.department,
      lastActivityAt: data.lastActivityAt || saved.lastActivityAt,
      ownerId: data.ownerId || saved.ownerId,
    };
    persistContactMeta(merged);
    setContacts((prev) => {
      if (isEdit) return prev.map((row) => (row.id === merged.id ? merged : row));
      return [merged, ...prev];
    });
    toast.success(isEdit ? "Contact updated" : "Contact created");
    closeForm(false);
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
    setSelected((prev) => [...new Set([...prev, ...pageRows.map((r) => r.id)])]);
  }

  function clearFilters() {
    setQuery("");
    setTypeFilter("all");
    setLifecycleFilter("all");
    setOwnerFilter("all");
    setDraftType("all");
    setDraftLifecycle("all");
    setDraftOwner("all");
    resetPage();
  }

  function applyDraftFilters() {
    setTypeFilter(draftType);
    setLifecycleFilter(draftLifecycle);
    setOwnerFilter(draftOwner);
    setFiltersOpen(false);
    resetPage();
  }

  function exportContacts(rows) {
    const header = "first_name,last_name,email,phone,title,company,type,lifecycle";
    const lines = rows.map((c) => {
      const company = companyMap[c.companyId] || "";
      return [
        c.firstName,
        c.lastName,
        c.email,
        c.phone,
        c.title,
        company,
        c.contactType,
        c.lifecycle,
      ]
        .map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`)
        .join(",");
    });
    const blob = new Blob([[header, ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `contacts-export-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} contact(s)`);
    setExportOpen(false);
  }

  const existingEmails = contacts.map((c) => c.email).filter(Boolean);

  if (loadStatus === "loading") return <ContactsSkeleton />;

  const kpiCards = KPI_CARD_VALUES.map((card) => ({
    ...card,
    value: formatCount(card.value),
    hint:
      card.id === "total"
        ? `${formatCount(filteredContacts.length)} visible with filters`
        : card.hint,
  }));

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[1440px] flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <nav className="mb-2 flex items-center gap-1.5 text-[12px] text-primary-500/80">
            <span>Workspace</span>
            <span className="text-primary-300">/</span>
            <span className="font-medium text-primary-700 dark:text-primary-300">
              Contacts
            </span>
          </nav>
          <h1 className="text-[26px] leading-8 font-bold tracking-[-0.03em] text-neutral-900 sm:text-[28px] dark:text-neutral-50">
            Contacts
          </h1>
          <p className="mt-1 max-w-[56ch] text-[14px] text-neutral-500">
            Manage relationships across companies, deals, and activities.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            className="h-9 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
            onClick={openCreate}
          >
            <Plus className="size-3.5" />
            Add Contact
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-lg"
            onClick={() => setImportOpen(true)}
          >
            <Upload className="size-3.5" />
            Import
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-lg"
                  aria-label="More actions"
                />
              }
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setExportOpen(true)}>
                <Download className="size-3.5" />
                Export
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPropertiesOpen(true)}>
                <Settings2 className="size-3.5" />
                Manage Properties
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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

      {(typeFilter !== "all" ||
        lifecycleFilter !== "all" ||
        ownerFilter !== "all") && (
        <div className="flex flex-wrap items-center gap-2">
          {typeFilter !== "all" ? (
            <Badge variant="secondary" className="gap-1 rounded-full pl-2">
              Type: {typeFilter}
              <button
                type="button"
                aria-label="Clear type"
                onClick={() => {
                  setTypeFilter("all");
                  resetPage();
                }}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ) : null}
          {lifecycleFilter !== "all" ? (
            <Badge variant="secondary" className="gap-1 rounded-full pl-2">
              Lifecycle: {lifecycleFilter}
              <button
                type="button"
                aria-label="Clear lifecycle"
                onClick={() => {
                  setLifecycleFilter("all");
                  resetPage();
                }}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ) : null}
          {ownerFilter !== "all" ? (
            <Badge variant="secondary" className="gap-1 rounded-full pl-2">
              Owner: {ownerById(ownerFilter, owners).name}
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
              <div className="relative min-w-[260px] max-w-xl flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-neutral-400" />
                <Input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    resetPage();
                  }}
                  placeholder="Search by name, email, company, or tag…"
                  className="h-9 pl-8"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-lg"
                onClick={() => {
                  setDraftType(typeFilter);
                  setDraftLifecycle(lifecycleFilter);
                  setDraftOwner(ownerFilter);
                  setFiltersOpen(true);
                }}
              >
                <Filter className="size-3.5" />
                Filters
                {activeFilterCount > 0 ? (
                  <Badge className="ml-1 h-5 min-w-5 justify-center rounded-full bg-primary-50 px-1.5 text-[10px] text-primary-700">
                    {activeFilterCount}
                  </Badge>
                ) : null}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button type="button" variant="outline" className="h-9 rounded-lg" />
                  }
                >
                  <ArrowDownUp className="size-3.5" />
                  Sort
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-48">
                  {[
                    ["createdAt", "Created date"],
                    ["name", "Name"],
                    ["lastActivity", "Last activity"],
                    ["company", "Company"],
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
                    <Button type="button" variant="outline" className="h-9 rounded-lg" />
                  }
                >
                  <Columns3 className="size-3.5" />
                  Columns
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  {ALL_COLUMNS.map((col) => (
                    <label
                      key={col.id}
                      className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                    >
                      <Checkbox
                        checked={visibleColumns.includes(col.id)}
                        onCheckedChange={() => toggleColumn(col.id)}
                      />
                      {col.label}
                    </label>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Tabs
              value={view}
              onValueChange={(next) => {
                setView(next);
                resetPage();
              }}
            >
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

          {(activeFilterCount > 0 || selected.length > 0) && (
            <div className="flex flex-wrap items-center gap-2">
              {activeFilterCount > 0 ? (
                <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : null}
              {selected.length > 0 ? (
                <>
                  <span className="text-[12px] text-muted-foreground">
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
                            apiFetch(`/api/contacts/${id}`, { method: "DELETE" })
                          )
                        );
                        setContacts((prev) => prev.filter((c) => !ids.includes(c.id)));
                        setSelected([]);
                        toast.success("Deleted selected contacts");
                      } catch (error) {
                        toast.error(error.message || "Delete failed");
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
                    onClick={() =>
                      exportContacts(contacts.filter((c) => selected.includes(c.id)))
                    }
                  >
                    <Download className="size-3.5" />
                    Export
                  </Button>
                </>
              ) : null}
            </div>
          )}
        </div>

        {view === "table" ? (
          <>
            <Table className="min-w-[1000px]">
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-10 px-3">
                    <Checkbox
                      checked={
                        pageRows.length > 0 &&
                        pageRows.every((row) => selected.includes(row.id))
                      }
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  {visibleColumns.includes("name") ? (
                    <TableHead className="px-3">
                      <button type="button" onClick={() => toggleSort("name")}>
                        Name
                      </button>
                    </TableHead>
                  ) : null}
                  {visibleColumns.includes("company") ? (
                    <TableHead className="px-3">Company</TableHead>
                  ) : null}
                  {visibleColumns.includes("title") ? (
                    <TableHead className="px-3">Job title</TableHead>
                  ) : null}
                  {visibleColumns.includes("type") ? (
                    <TableHead className="px-3">Type</TableHead>
                  ) : null}
                  {visibleColumns.includes("lifecycle") ? (
                    <TableHead className="px-3">Lifecycle</TableHead>
                  ) : null}
                  {visibleColumns.includes("owner") ? (
                    <TableHead className="px-3">Owner</TableHead>
                  ) : null}
                  {visibleColumns.includes("tags") ? (
                    <TableHead className="px-3">Tags</TableHead>
                  ) : null}
                  {visibleColumns.includes("lastActivity") ? (
                    <TableHead className="px-3">Last activity</TableHead>
                  ) : null}
                  {visibleColumns.includes("createdAt") ? (
                    <TableHead className="px-3">Created</TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={visibleColumns.length + 1}
                      className="py-12 text-center text-muted-foreground"
                    >
                      No contacts match your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  pageRows.map((contact) => {
                    const owner = ownerById(contact.ownerId, owners);
                    return (
                      <TableRow key={contact.id}>
                        <TableCell className="px-3">
                          <Checkbox
                            checked={selected.includes(contact.id)}
                            onCheckedChange={() => toggleSelect(contact.id)}
                          />
                        </TableCell>
                        {visibleColumns.includes("name") ? (
                          <TableCell className="px-3 py-2.5">
                            <button
                              type="button"
                              onClick={() => openContact(contact)}
                              className="flex w-full min-w-0 items-center gap-2.5 text-left"
                            >
                              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-[11px] font-semibold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                                {initials(contact)}
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate font-semibold">
                                  {fullName(contact)}
                                </span>
                                <span className="block truncate text-[12px] text-muted-foreground">
                                  {contact.email || "—"}
                                </span>
                              </span>
                            </button>
                          </TableCell>
                        ) : null}
                        {visibleColumns.includes("company") ? (
                          <TableCell className="px-3 text-muted-foreground">
                            {companyMap[contact.companyId] || "—"}
                          </TableCell>
                        ) : null}
                        {visibleColumns.includes("title") ? (
                          <TableCell className="px-3 text-muted-foreground">
                            {contact.title || "—"}
                          </TableCell>
                        ) : null}
                        {visibleColumns.includes("type") ? (
                          <TableCell className="px-3">
                            <Badge
                              variant="outline"
                              className={cn(
                                "border-transparent",
                                CONTACT_TYPE_STYLES[contact.contactType] ||
                                  CONTACT_TYPE_STYLES.Other
                              )}
                            >
                              {contact.contactType}
                            </Badge>
                          </TableCell>
                        ) : null}
                        {visibleColumns.includes("lifecycle") ? (
                          <TableCell className="px-3">
                            <Badge
                              variant="outline"
                              className={cn(
                                "border-transparent",
                                LIFECYCLE_STYLES[contact.lifecycle] ||
                                  LIFECYCLE_STYLES.Inactive
                              )}
                            >
                              {contact.lifecycle}
                            </Badge>
                          </TableCell>
                        ) : null}
                        {visibleColumns.includes("owner") ? (
                          <TableCell className="px-3">
                            <span className="flex items-center gap-2 text-[13px]">
                              <span className="flex size-5 items-center justify-center rounded-full bg-muted text-[9px] font-bold">
                                {owner.initials}
                              </span>
                              {owner.name}
                            </span>
                          </TableCell>
                        ) : null}
                        {visibleColumns.includes("tags") ? (
                          <TableCell className="px-3">
                            <div className="flex flex-wrap gap-1">
                              {(contact.tags || []).slice(0, 2).map((tag, i) => (
                                <span
                                  key={tag}
                                  className={cn(
                                    "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                                    tagStyleAt(i)
                                  )}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </TableCell>
                        ) : null}
                        {visibleColumns.includes("lastActivity") ? (
                          <TableCell className="px-3 text-muted-foreground">
                            {formatDate(contact.lastActivityAt)}
                          </TableCell>
                        ) : null}
                        {visibleColumns.includes("createdAt") ? (
                          <TableCell className="px-3 text-muted-foreground">
                            {formatDate(contact.createdAt)}
                          </TableCell>
                        ) : null}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </>
        ) : (
          <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pageRows.length === 0 ? (
              <p className="col-span-full py-12 text-center text-muted-foreground">
                No contacts match your filters.
              </p>
            ) : (
              pageRows.map((contact) => {
                const owner = ownerById(contact.ownerId, owners);
                return (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => openContact(contact)}
                    className="rounded-2xl border border-neutral-200/80 bg-white p-4 text-left transition hover:shadow-md dark:border-neutral-800 dark:bg-neutral-950"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex size-10 items-center justify-center rounded-full bg-primary-50 text-[12px] font-bold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                        {initials(contact)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{fullName(contact)}</p>
                        <p className="truncate text-[12px] text-muted-foreground">
                          {contact.title || contact.email || "—"}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 truncate text-[12px] text-muted-foreground">
                      {companyMap[contact.companyId] || "No company"}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "border-transparent text-[10px]",
                          LIFECYCLE_STYLES[contact.lifecycle]
                        )}
                      >
                        {contact.lifecycle}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        {owner.initials}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 px-4 py-3 dark:border-neutral-800">
          <p className="text-[12px] text-muted-foreground">
            Showing {(page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, filteredContacts.length)} of{" "}
            {formatCount(filteredContacts.length)}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v));
                resetPage();
              }}
            >
              <SelectTrigger className="h-8 w-[110px]">
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
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-[12px] tabular-nums">
              {page} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      <ContactFormDrawer
        open={formOpen}
        onOpenChange={closeForm}
        initialContact={editingContact}
        onSave={handleSaveContact}
        owners={owners}
        defaultOwnerId={currentUserId}
        companies={companies}
        onCompaniesChange={setCompanies}
        existingEmails={existingEmails}
      />

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent
          title="Filters"
          maxWidth={380}
          onClose={() => setFiltersOpen(false)}
          className="flex flex-col overflow-hidden"
        >
          <SheetBody className="space-y-4">
            <div>
              <Label>Type</Label>
              <Select value={draftType} onValueChange={setDraftType}>
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {CONTACT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Lifecycle</Label>
              <Select value={draftLifecycle} onValueChange={setDraftLifecycle}>
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {LIFECYCLE_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Owner</Label>
              <Select value={draftOwner} onValueChange={setDraftOwner}>
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue placeholder="All owners" />
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
              onClick={applyDraftFilters}
            >
              Apply filters
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <CsvImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Import Contacts"
        description="Upload a CSV with first_name, last_name, email, phone, and title columns."
        requiredHint="Required: first_name, last_name, email"
        entityName="contact"
        previewColumns={[
          {
            header: "Name",
            cell: (row) => `${row.firstName} ${row.lastName}`,
          },
          { header: "Email", cell: (row) => row.email || "—" },
          { header: "Title", cell: (row) => row.title || "—" },
        ]}
        onParseFile={parseContactCsvFile}
        onImport={async (rows, { reportProgress }) => {
          const created = [];
          for (let index = 0; index < rows.length; index += 1) {
            const row = rows[index];
            const response = await apiFetch("/api/contacts", {
              method: "POST",
              body: JSON.stringify({
                first_name: row.firstName,
                last_name: row.lastName,
                email: row.email || null,
                phone: row.phone || null,
                title: row.title || null,
                owner_id: currentUserId || null,
              }),
            });
            created.push(fromApiContact(response.data));
            reportProgress(index + 1, rows.length);
          }
          setContacts((prev) => [...created, ...prev]);
          toast.success(
            `Imported ${created.length} contact${created.length === 1 ? "" : "s"}`
          );
        }}
      />

      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent title="Export contacts">
          <DialogBody>
            <p className="text-[13px] text-muted-foreground">
              Export {selected.length ? selected.length : filteredContacts.length}{" "}
              contact(s) to CSV (includes prototype type/lifecycle columns).
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-primary-600 text-white hover:bg-primary-700"
              onClick={() =>
                exportContacts(
                  selected.length
                    ? contacts.filter((c) => selected.includes(c.id))
                    : filteredContacts
                )
              }
            >
              <Download className="size-3.5" />
              Download CSV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={propertiesOpen} onOpenChange={setPropertiesOpen}>
        <DialogContent title="Manage properties">
          <DialogBody>
            <p className="text-[13px] text-muted-foreground">
              Custom contact fields (type, lifecycle, tags, LinkedIn, department) are
              stored locally for this prototype in{" "}
              <code className="rounded bg-muted px-1">novacrm:contact-meta</code> until
              backend metadata is available.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button onClick={() => setPropertiesOpen(false)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
