"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import {
  ArrowDownUp,
  BadgeCheck,
  Building2,
  Columns3,
  Copy,
  Download,
  Eye,
  Filter,
  LayoutGrid,
  LayoutList,
  Mail,
  Phone,
  Plus,
  Sparkles,
  SquarePen,
  Search,
  Trash2,
  Upload,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import {
  buildContactAiInsights,
  buildOutreachDraft,
  championContacts,
  qbrTargets,
  reEngagementTargets,
  serializeContactAiNote,
} from "@/components/contacts/contact-ai-insights";
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
  CONTACT_KPI_DEFINITIONS,
  CONTACT_OWNERS,
  LIFECYCLE_STATUSES,
  LIFECYCLE_STYLES,
  fullName,
  initials,
  ownerById,
} from "@/components/contacts/contacts-data";
import { parseContactCsvFile } from "@/components/contacts/contact-import";
import { CsvImportDialog } from "@/components/shared/csv-import-dialog";
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
import { Textarea } from "@/components/ui/textarea";
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

const ALL_COLUMNS = [
  { id: "name", label: "Contact" },
  { id: "title", label: "Job Title" },
  { id: "company", label: "Company" },
  { id: "phone", label: "Phone" },
  { id: "type", label: "Contact Type" },
  { id: "owner", label: "Owner" },
  { id: "createdAt", label: "Created Date" },
];

const DEFAULT_VISIBLE_COLUMNS = [
  "name",
  "title",
  "company",
  "phone",
  "type",
  "owner",
  "createdAt",
];

const PAGE_SIZES = [10, 20, 40, 50, 100];

const CONTACT_TYPE_ACCENT = {
  Customer: "bg-emerald-500",
  Prospect: "bg-sky-500",
  Partner: "bg-violet-500",
  Vendor: "bg-amber-500",
  Investor: "bg-blue-500",
  Other: "bg-neutral-400",
};

function ContactGridCard({
  contact,
  owner,
  companyName,
  onOpen,
  onEdit,
  onDelete,
}) {
  const name = fullName(contact);
  const company = companyName || "No company linked";

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
          CONTACT_TYPE_ACCENT[contact.contactType] || CONTACT_TYPE_ACCENT.Other
        )}
      />

      <div className="flex items-center gap-2.5 pl-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-[11px] font-semibold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
          {initials(contact)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold tracking-[-0.01em] text-neutral-900 dark:text-neutral-50">
                {name}
              </p>
            </div>
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
                aria-label="Delete contact"
                onClick={onDelete}
              >
                <Trash2 className="size-3.5 text-destructive" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-7"
                aria-label="Edit contact"
                onClick={onEdit}
              >
                <SquarePen className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2.5 space-y-1.5 pl-4">
        <p className="flex min-w-0 items-center gap-1.5 text-[12px] text-neutral-600 dark:text-neutral-300">
          <Building2 className="size-3 shrink-0 text-neutral-400" />
          <span className="truncate">{company}</span>
        </p>
        {contact.email ? (
          <p className="flex min-w-0 items-center gap-1.5 text-[12px] text-neutral-600 dark:text-neutral-300">
            <Mail className="size-3 shrink-0 text-neutral-400" />
            <span className="truncate">{contact.email}</span>
          </p>
        ) : null}
        {contact.phone ? (
          <p className="flex min-w-0 items-center gap-1.5 text-[12px] text-neutral-600 dark:text-neutral-300">
            <Phone className="size-3 shrink-0 text-neutral-400" />
            <span className="truncate">{contact.phone}</span>
          </p>
        ) : null}
      </div>

      <div className="mt-3 mb-2 flex flex-wrap items-center gap-1.5 pl-4">
        <Badge
          variant="outline"
          title={contact.contactType}
          className={cn(
            "h-5 max-w-full overflow-hidden border-transparent text-[10px]",
            CONTACT_TYPE_STYLES[contact.contactType] || CONTACT_TYPE_STYLES.Other
          )}
        >
          <span className="truncate">{contact.contactType || "Other"}</span>
        </Badge>
        {contact.lifecycle ? (
          <Badge
            variant="outline"
            title={contact.lifecycle}
            className={cn(
              "h-5 max-w-full overflow-hidden border-transparent text-[10px]",
              LIFECYCLE_STYLES[contact.lifecycle] || LIFECYCLE_STYLES.Inactive
            )}
          >
            <span className="truncate">{contact.lifecycle}</span>
          </Badge>
        ) : null}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-neutral-100 pt-2.5 pl-4 dark:border-neutral-800">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-semibold">
            {owner.initials}
          </span>
          <span className="truncate text-[11px] text-neutral-500">
            {owner.name}
          </span>
        </div>
        <span className="shrink-0 text-[11px] text-neutral-400 tabular-nums">
          {formatDate(contact.createdAt)}
        </span>
      </div>
    </article>
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
    case "building":
      return Building2;
    default:
      return Users;
  }
}

function computeContactStats(rows) {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  let newThisMonth = 0;
  let active = 0;
  let withoutCompany = 0;

  for (const contact of rows) {
    if (contact.createdAt) {
      const created = new Date(contact.createdAt);
      if (
        !Number.isNaN(created.getTime()) &&
        created.getMonth() === month &&
        created.getFullYear() === year
      ) {
        newThisMonth += 1;
      }
    }
    if (contact.lifecycle === "Active" || contact.lifecycle === "Customer") {
      active += 1;
    }
    if (!contact.companyId) {
      withoutCompany += 1;
    }
  }

  return {
    total: rows.length,
    newThisMonth,
    active,
    withoutCompany,
  };
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

        <div className="hidden border-b border-neutral-100 px-3 py-2.5 md:flex dark:border-neutral-800">
          <div className="flex w-full items-center gap-4">
            <SkeletonBlock className="size-4 rounded" />
            <SkeletonBlock className="h-3 w-24 rounded-md" />
            <SkeletonBlock className="h-3 w-20 rounded-md" />
            <SkeletonBlock className="h-3 w-16 rounded-md" />
            <SkeletonBlock className="h-3 w-14 rounded-md" />
            <SkeletonBlock className="h-3 w-16 rounded-md" />
            <SkeletonBlock className="h-3 w-20 rounded-md" />
            <SkeletonBlock className="h-3 w-16 rounded-md" />
            <SkeletonBlock className="ml-auto h-3 w-12 rounded-md" />
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
                  <SkeletonBlock className="h-3 w-44 max-w-full rounded-md" />
                </div>
              </div>
              <SkeletonBlock className="hidden h-3 w-24 rounded-md lg:block" />
              <SkeletonBlock className="hidden h-3 w-20 rounded-md md:block" />
              <SkeletonBlock className="hidden h-3 w-28 rounded-md xl:block" />
              <SkeletonBlock className="hidden h-6 w-16 rounded-full sm:block" />
              <SkeletonBlock className="hidden h-3 w-20 rounded-md md:block" />
              <SkeletonBlock className="hidden h-3 w-16 rounded-md lg:block" />
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
  const [deals, setDeals] = useState([]);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiAction, setAiAction] = useState(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [outreachDraft, setOutreachDraft] = useState("");
  const companyMap = useMemo(
    () => Object.fromEntries(companies.map((c) => [c.id, c.name])),
    [companies]
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadStatus("loading");
      try {
        const [ws, list, companyList, dealList, members] = await Promise.all([
          apiFetch("/api/workspace"),
          apiFetch("/api/contacts?order_by=created_at&limit=500"),
          apiFetch("/api/companies?order_by=name&limit=200"),
          apiFetch("/api/deals?order_by=created_at&limit=200"),
          apiFetch("/api/workspace/members"),
        ]);
        if (cancelled) return;
        const mappedOwners = (members.data || []).map(mapMemberToOwner);
        setOwners(mappedOwners.length ? mappedOwners : CONTACT_OWNERS);
        setCurrentUserId(ws.user?.id || "");
        setCompanies(companyList.data || []);
        setDeals(dealList.data || []);
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

  const outreachTargets = useMemo(
    () => reEngagementTargets(contacts, deals),
    [contacts, deals]
  );
  const championRows = useMemo(() => championContacts(contacts), [contacts]);
  const qbrContacts = useMemo(() => qbrTargets(contacts), [contacts]);
  const aiInsights = useMemo(
    () => buildContactAiInsights(contacts, deals),
    [contacts, deals]
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

  function openEdit(contact) {
    setEditingContact(contact);
    setFormOpen(true);
  }

  async function deleteContact(contact) {
    try {
      await apiFetch(`/api/contacts/${contact.id}`, { method: "DELETE" });
      setContacts((prev) => prev.filter((row) => row.id !== contact.id));
      setSelected((prev) => prev.filter((id) => id !== contact.id));
      toast.success("Contact removed");
    } catch (error) {
      toast.error(error.message || "Could not delete contact");
    }
  }

  async function appendContactNote(id, note) {
    const current = contacts.find((row) => row.id === id);
    if (!current) return;
    const notes = current.notes ? `${current.notes}\n\n${note}` : note;
    const response = await apiFetch(`/api/contacts/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ notes }),
    });
    const saved = fromApiContact(response.data);
    const merged = {
      ...current,
      ...saved,
      notes,
      contactType: current.contactType,
      lifecycle: current.lifecycle,
      tags: current.tags,
    };
    persistContactMeta(merged);
    setContacts((prev) =>
      prev.map((row) => (row.id === saved.id ? merged : row))
    );
    return merged;
  }

  function openAiAction(id) {
    if (id === "followup") {
      setOutreachDraft(buildOutreachDraft(outreachTargets));
    }
    setAiAction(id);
  }

  function showContacts(targets) {
    setSelected(targets.map((contact) => contact.id));
    setTypeFilter("all");
    setLifecycleFilter("all");
    setOwnerFilter("all");
    setQuery("");
    resetPage();
    setAiAction(null);
    setAiOpen(false);
  }

  function viewChampionContacts() {
    showContacts(championRows.length ? championRows : contacts.slice(0, 5));
  }

  function viewQbrContacts() {
    if (qbrContacts.length) {
      showContacts(qbrContacts);
      return;
    }
    setTypeFilter("Customer");
    setLifecycleFilter("all");
    setAiAction(null);
    setAiOpen(false);
    resetPage();
  }

  async function saveOutreachDrafts() {
    if (!outreachTargets.length) {
      toast.error("No contacts need outreach right now");
      return;
    }
    setAiBusy(true);
    try {
      const note = serializeContactAiNote(
        `Draft outreach\n${outreachDraft.trim()}`
      );
      await Promise.all(
        outreachTargets.map((contact) => appendContactNote(contact.id, note))
      );
      toast.success(
        `Saved outreach note for ${outreachTargets.length} contact${outreachTargets.length === 1 ? "" : "s"}`
      );
      showContacts(outreachTargets);
    } catch (error) {
      toast.error(error.message || "Could not save outreach drafts");
    } finally {
      setAiBusy(false);
    }
  }

  async function copyOutreachDraft() {
    try {
      await navigator.clipboard.writeText(outreachDraft);
      toast.success("Draft copied");
    } catch {
      toast.error("Could not copy to clipboard");
    }
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

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
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

  const contactStats = useMemo(
    () => computeContactStats(contacts),
    [contacts]
  );

  if (loadStatus === "loading") return <ContactsSkeleton />;

  const kpiCards = CONTACT_KPI_DEFINITIONS.map((card) => {
    const valueById = {
      total: contactStats.total,
      new: contactStats.newThisMonth,
      active: contactStats.active,
      withoutCompany: contactStats.withoutCompany,
    };
    return {
      ...card,
      value: formatCount(valueById[card.id] ?? 0),
    };
  });

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[1440px] flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <nav
            className={cn("mb-2 flex items-center gap-1.5", crmType.breadcrumb)}
          >
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
            Manage your customer and business relationships.
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
            Import Contacts
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-lg"
            aria-label="Export contacts"
            onClick={() => setExportOpen(true)}
          >
            <Download className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-lg border-primary-200 bg-gradient-to-br from-primary-50 via-secondary-50 to-primary-100 text-primary-700 hover:from-primary-100 hover:via-secondary-100 hover:to-primary-200 hover:text-primary-800 dark:border-primary-800 dark:from-primary-950 dark:via-secondary-900/50 dark:to-primary-900 dark:text-primary-300 dark:hover:from-primary-900 dark:hover:via-secondary-900/70 dark:hover:to-primary-800"
            aria-label="AI Contact Insights"
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
            Add Contact
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
              <div className="relative min-w-[280px] max-w-xl flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-neutral-400" />
                <Input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    resetPage();
                  }}
                  placeholder="Search contacts by name, company, or email…"
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
                    ["name", "Contact name"],
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
                            apiFetch(`/api/contacts/${id}`, { method: "DELETE" })
                          )
                        );
                        setContacts((prev) =>
                          prev.filter((contact) => !ids.includes(contact.id))
                        );
                        setSelected([]);
                        toast.success("Selected contacts removed");
                      } catch (error) {
                        toast.error(error.message || "Could not delete contacts");
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
                  {visibleColumns.includes("name") ? (
                    <TableHead className="w-[240px] px-3">
                      <button type="button" onClick={() => toggleSort("name")}>
                        Contact
                      </button>
                    </TableHead>
                  ) : null}
                  {visibleColumns.includes("title") ? (
                    <TableHead className="w-[160px] px-3">Job Title</TableHead>
                  ) : null}
                  {visibleColumns.includes("company") ? (
                    <TableHead className="w-[120px] px-3">Company</TableHead>
                  ) : null}
                  {visibleColumns.includes("phone") ? (
                    <TableHead className="px-3">Phone</TableHead>
                  ) : null}
                  {visibleColumns.includes("type") ? (
                    <TableHead className="w-[120px] px-3">Contact Type</TableHead>
                  ) : null}
                  {visibleColumns.includes("owner") ? (
                    <TableHead className="w-[120px] px-3">Owner</TableHead>
                  ) : null}
                  {visibleColumns.includes("createdAt") ? (
                    <TableHead className="w-[120px] px-3">Created Date</TableHead>
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
                      No contacts match your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  pageRows.map((contact) => {
                    const owner = ownerById(contact.ownerId, owners);
                    return (
                      <TableRow
                        key={contact.id}
                        data-state={
                          selected.includes(contact.id) ? "selected" : undefined
                        }
                      >
                        <TableCell className="px-3 py-2.5">
                          <Checkbox
                            checked={selected.includes(contact.id)}
                            onCheckedChange={() => toggleSelect(contact.id)}
                            aria-label={`Select ${fullName(contact)}`}
                          />
                        </TableCell>
                        {visibleColumns.includes("name") ? (
                          <TableCell className="overflow-hidden px-3 py-2.5">
                            <button
                              type="button"
                              onClick={() => openContact(contact)}
                              className="flex w-full min-w-0 items-center gap-2.5 text-left"
                            >
                              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-semibold text-primary-700">
                                {initials(contact)}
                              </span>
                              <span className="min-w-0 flex-1 overflow-hidden">
                                <TruncateText
                                  value={fullName(contact)}
                                  className="text-xs font-semibold"
                                />
                                <TruncateText
                                  value={contact.email}
                                  className="text-xs text-muted-foreground"
                                />
                              </span>
                            </button>
                          </TableCell>
                        ) : null}
                        {visibleColumns.includes("title") ? (
                          <TableCell className="overflow-hidden px-3 py-2.5">
                            <TruncateText
                              value={contact.title}
                              className="text-xs text-muted-foreground"
                            />
                          </TableCell>
                        ) : null}
                        {visibleColumns.includes("company") ? (
                          <TableCell className="overflow-hidden px-3 py-2.5">
                            <TruncateText
                              value={companyMap[contact.companyId]}
                              className="text-xs font-medium"
                            />
                          </TableCell>
                        ) : null}
                        {visibleColumns.includes("phone") ? (
                          <TableCell className="overflow-hidden px-3 py-2.5">
                            <TruncateText
                              value={contact.phone}
                              className="text-xs text-muted-foreground"
                            />
                          </TableCell>
                        ) : null}
                        {visibleColumns.includes("type") ? (
                          <TableCell className="overflow-hidden px-3 py-2.5">
                            <Badge
                              variant="outline"
                              title={contact.contactType}
                              className={cn(
                                "h-auto max-w-full overflow-hidden border-transparent text-xs",
                                CONTACT_TYPE_STYLES[contact.contactType] ||
                                  CONTACT_TYPE_STYLES.Other
                              )}
                            >
                              <span className="truncate">{contact.contactType}</span>
                            </Badge>
                          </TableCell>
                        ) : null}
                        {visibleColumns.includes("owner") ? (
                          <TableCell className="overflow-hidden px-3 py-2.5">
                            <TruncateText value={owner.name} className="text-xs" />
                          </TableCell>
                        ) : null}
                        {visibleColumns.includes("createdAt") ? (
                          <TableCell className="px-3 py-2.5 text-xs text-muted-foreground">
                            {formatDate(contact.createdAt)}
                          </TableCell>
                        ) : null}
                        <TableCell className="px-3 py-2.5">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label="View contact"
                              onClick={() => openContact(contact)}
                            >
                              <Eye className="size-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Edit contact"
                              onClick={() => openEdit(contact)}
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
                {filteredContacts.length === 0
                  ? 0
                  : (page - 1) * pageSize + 1}
                –
                {Math.min(page * pageSize, filteredContacts.length)} of{" "}
                {filteredContacts.length}
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
          <>
            <div className="p-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {pageRows.length === 0 ? (
                  <p className="col-span-full py-12 text-center text-sm text-muted-foreground">
                    No contacts match your filters.
                  </p>
                ) : (
                  pageRows.map((contact) => {
                    const owner = ownerById(contact.ownerId, owners);
                    return (
                      <ContactGridCard
                        key={contact.id}
                        contact={contact}
                        owner={owner}
                        companyName={companyMap[contact.companyId]}
                        onOpen={() => openContact(contact)}
                        onEdit={() => openEdit(contact)}
                        onDelete={() => deleteContact(contact)}
                      />
                    );
                  })
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 px-3 py-2.5 dark:border-neutral-800">
              <p className="text-[12px] text-neutral-500">
                Showing{" "}
                {filteredContacts.length === 0
                  ? 0
                  : (page - 1) * pageSize + 1}
                –
                {Math.min(page * pageSize, filteredContacts.length)} of{" "}
                {filteredContacts.length}
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
        )}
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
              Export {filteredContacts.length} contact(s) to CSV (includes type/lifecycle
              columns where stored locally).
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-primary-600 text-white hover:bg-primary-700"
              onClick={() => exportContacts(filteredContacts)}
            >
              <Download className="size-3.5" />
              Download CSV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet
        open={aiOpen}
        onOpenChange={(open) => {
          setAiOpen(open);
          if (!open) setAiAction(null);
        }}
      >
        <SheetContent
          title="AI Contact Insights"
          description="Recommendations you can act on from your contact list."
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
        open={aiAction === "followup"}
        onOpenChange={(open) => {
          if (!open) setAiAction(null);
        }}
      >
        <DialogContent
          title="Draft outreach"
          description="Save this note to contacts with stale deal engagement, or copy it to send yourself."
          onClose={() => setAiAction(null)}
        >
          <DialogBody className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {outreachTargets.map((contact) => (
                <span
                  key={contact.id}
                  className="rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary-700 dark:bg-primary-950 dark:text-primary-300"
                >
                  {fullName(contact)}
                </span>
              ))}
            </div>
            <Textarea
              value={outreachDraft}
              onChange={(event) => setOutreachDraft(event.target.value)}
              rows={8}
            />
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={copyOutreachDraft}>
              <Copy className="size-3.5" />
              Copy
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => showContacts(outreachTargets)}
              disabled={!outreachTargets.length}
            >
              View contacts
            </Button>
            <Button
              type="button"
              className="bg-primary-600 text-white hover:bg-primary-700"
              disabled={
                aiBusy || !outreachDraft.trim() || !outreachTargets.length
              }
              onClick={saveOutreachDrafts}
            >
              {aiBusy ? "Saving…" : "Save drafts"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={aiAction === "champion"}
        onOpenChange={(open) => {
          if (!open) setAiAction(null);
        }}
      >
        <DialogContent
          title="Champion signal"
          description="Contacts tagged as champions or Customers with recent activity."
          onClose={() => setAiAction(null)}
        >
          <DialogBody className="space-y-3">
            {championRows.length ? (
              <ul className="space-y-2">
                {championRows.map((contact) => (
                  <li
                    key={contact.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 px-3 py-2.5 dark:border-neutral-800"
                  >
                    <div>
                      <p className="text-[13px] font-semibold">
                        {fullName(contact)}
                      </p>
                      <p className="text-[12px] text-muted-foreground">
                        {contact.contactType || "Contact"}
                        {contact.lifecycle ? ` · ${contact.lifecycle}` : ""}
                      </p>
                    </div>
                    <p className="text-[12px] text-muted-foreground">
                      {(contact.tags || []).slice(0, 2).join(", ") || "Active"}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] text-muted-foreground">
                No champion signals yet. Add a Champion tag or mark engaged
                customers.
              </p>
            )}
            <p className="text-[12px] leading-5 text-muted-foreground">
              Prioritize these contacts for referrals, case studies, and
              executive briefings.
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
              onClick={viewChampionContacts}
              disabled={!championRows.length}
            >
              View champions
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
          title="Recommend next action"
          description="Quarterly business reviews for high-value customer relationships."
          onClose={() => setAiAction(null)}
        >
          <DialogBody className="space-y-3">
            {qbrContacts.length ? (
              <ul className="space-y-2">
                {qbrContacts.map((contact) => (
                  <li
                    key={contact.id}
                    className="rounded-xl border border-neutral-200 px-3 py-2.5 dark:border-neutral-800"
                  >
                    <p className="text-[13px] font-semibold">
                      {fullName(contact)}
                    </p>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                      {contact.contactType || "Contact"} ·{" "}
                      {contact.lifecycle || "—"}
                    </p>
                    <p className="mt-1 text-[12px] text-neutral-600 dark:text-neutral-300">
                      Book a 45-minute QBR to review adoption, ROI, and renewals.
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] text-muted-foreground">
                No customer contacts yet. Convert leads or set contact type to
                Customer.
              </p>
            )}
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
              onClick={viewQbrContacts}
            >
              View accounts
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
