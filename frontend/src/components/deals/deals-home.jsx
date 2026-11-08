"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDownUp,
  BadgeCheck,
  Columns3,
  Download,
  Filter,
  Kanban,
  Layers,
  LayoutList,
  Plus,
  Search,
  Sparkles,
  Trash2,
  TrendingUp,
  Upload,
  XCircle,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

import {
  appendStageHistory,
  fromApiDeal,
  persistDealMeta,
  toApiDeal,
} from "@/components/deals/deal-api";
import { DealFormDrawer } from "@/components/deals/deal-form-drawer";
import { DealStageDialog } from "@/components/deals/deal-stage-dialog";
import { DealsKanban } from "@/components/deals/deals-kanban";
import { DealsListTable } from "@/components/deals/deals-list-table";
import {
  DEAL_ALL_COLUMNS,
  DEAL_DEFAULT_VISIBLE_COLUMNS,
  DEAL_KPI_DEFINITIONS,
  DEAL_LEAD_SOURCES,
  DEAL_PAGE_SIZES,
  buildDealFollowUpDraft,
  computeDealKpis,
  dealStatusFromStage,
  formatDealAmount,
  overdueOpenDeals,
  pipelineValueByStage,
  topOpenDealsByAmount,
  demoMetaForDealName,
  mergeDemoDealMeta,
  ownerLabel,
  partitionPipelineStages,
  pipelineStagesForUi,
  probabilityForStage,
  stageById,
  stageIsLost,
  stageIsWon,
} from "@/components/deals/deals-data";
import { CompanyFormDrawer } from "@/components/companies/company-form-drawer";
import {
  fromApiCompany,
  persistCompanyMeta,
  toApiCompany,
} from "@/components/companies/company-api";
import {
  fromApiContact,
  mapMemberToOwner,
} from "@/components/contacts/contact-api";
import { CONTACT_OWNERS, ownerById } from "@/components/contacts/contacts-data";
import { exportDealsToCsv } from "@/components/deals/deal-export";
import { parseDealCsvFile } from "@/components/deals/deal-import";
import { CrmEmptyState } from "@/components/crm/crm-shared";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { crmType } from "@/lib/crm-typography";
import { cn } from "@/lib/utils";

const VIEW_STORAGE_KEY = "novacrm:deals-view";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

function summaryIcon(name) {
  if (name === "trending") return TrendingUp;
  if (name === "layers") return Layers;
  if (name === "badge-check") return BadgeCheck;
  return XCircle;
}

function DealsSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6" aria-busy="true">
      <div className="h-24 animate-pulse rounded-2xl bg-muted/40" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-muted/30" />
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-2xl bg-muted/20" />
    </div>
  );
}

export function DealsHome() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loadStatus, setLoadStatus] = useState("loading");
  const [deals, setDeals] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [stages, setStages] = useState([]);
  const [owners, setOwners] = useState(CONTACT_OWNERS);
  const [currentUserId, setCurrentUserId] = useState("");

  const [view, setView] = useState("table");
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [draftStageFilter, setDraftStageFilter] = useState("all");
  const [draftOwnerFilter, setDraftOwnerFilter] = useState("all");
  const [draftSourceFilter, setDraftSourceFilter] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortKey, setSortKey] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [visibleColumns, setVisibleColumns] = useState(DEAL_DEFAULT_VISIBLE_COLUMNS);

  const [formOpen, setFormOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [dealFormInstance, setDealFormInstance] = useState(0);
  const [deletePrompt, setDeletePrompt] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [companyFormOpen, setCompanyFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiAction, setAiAction] = useState(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [followUpDraft, setFollowUpDraft] = useState("");

  const [stageDialog, setStageDialog] = useState({
    open: false,
    mode: "normal",
    dealId: "",
    stageId: "",
    confirming: false,
  });

  const pipelineStageCatalog = useMemo(
    () => pipelineStagesForUi(stages),
    [stages]
  );

  const partitionedStages = useMemo(
    () => partitionPipelineStages(pipelineStageCatalog.visible),
    [pipelineStageCatalog.visible]
  );

  const companyMap = useMemo(
    () => Object.fromEntries(companies.map((c) => [c.id, c.name])),
    [companies]
  );

  const contactById = useMemo(
    () => Object.fromEntries(contacts.map((c) => [c.id, c])),
    [contacts]
  );

  const stageMap = useMemo(
    () => Object.fromEntries(stages.map((s) => [s.id, s])),
    [stages]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(VIEW_STORAGE_KEY);
    if (stored === "kanban") setView("kanban");
    else if (stored === "table" || stored === "list") setView("table");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(VIEW_STORAGE_KEY, view);
  }, [view]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadStatus("loading");
      try {
        const [
          ws,
          dealList,
          companyList,
          contactList,
          stageList,
          members,
        ] = await Promise.all([
          apiFetch("/api/workspace"),
          apiFetch("/api/deals?order_by=created_at&limit=300"),
          apiFetch("/api/companies?order_by=name&limit=300"),
          apiFetch("/api/contacts?order_by=created_at&limit=300"),
          apiFetch("/api/pipeline-stages?order_by=position&limit=50"),
          apiFetch("/api/workspace/members"),
        ]);
        if (cancelled) return;
        const mappedOwners = (members.data || []).map(mapMemberToOwner);
        setOwners(mappedOwners.length ? mappedOwners : CONTACT_OWNERS);
        setCurrentUserId(ws.user?.id || "");
        setCompanies((companyList.data || []).map((r) => fromApiCompany(r)));
        setContacts((contactList.data || []).map((r) => fromApiContact(r)));
        setStages(stageList.data || []);
        setDeals(
          (dealList.data || []).map((r) => {
            const deal = mergeDemoDealMeta(fromApiDeal(r));
            const demo = demoMetaForDealName(deal.name);
            if (demo) persistDealMeta(deal);
            return deal;
          })
        );
        setLoadStatus("ready");
      } catch (error) {
        if (!cancelled) {
          toast.error(error.message || "Could not load deals");
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
    if (searchParams.get("action") === "create") {
      setEditingDeal(null);
      setDealFormInstance((n) => n + 1);
      setFormOpen(true);
    }
  }, [searchParams]);

  const filteredDeals = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = [...deals];
    if (stageFilter !== "all") {
      rows = rows.filter((d) => String(d.stageId) === String(stageFilter));
    }
    if (ownerFilter !== "all") {
      rows = rows.filter((d) => String(d.ownerId) === String(ownerFilter));
    }
    if (sourceFilter !== "all") {
      rows = rows.filter((d) => (d.leadSource || "") === sourceFilter);
    }
    if (q) {
      rows = rows.filter((d) => {
        const company = companyMap[d.companyId] || "";
        return `${d.name} ${company}`.toLowerCase().includes(q);
      });
    }
    const dir = sortDir === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      if (sortKey === "name") {
        return String(a.name || "").localeCompare(String(b.name || "")) * dir;
      }
      if (sortKey === "amount") {
        return (Number(a.amount) - Number(b.amount)) * dir;
      }
      if (sortKey === "closeDate") {
        return (
          String(a.expectedCloseDate || "").localeCompare(
            String(b.expectedCloseDate || "")
          ) * dir
        );
      }
      if (sortKey === "owner") {
        return (
          ownerById(a.ownerId, owners).name.localeCompare(
            ownerById(b.ownerId, owners).name
          ) * dir
        );
      }
      if (sortKey === "stage") {
        const an = stageMap[a.stageId]?.name || "";
        const bn = stageMap[b.stageId]?.name || "";
        return an.localeCompare(bn) * dir;
      }
      return String(a.createdAt || "").localeCompare(String(b.createdAt || "")) * dir;
    });
    return rows;
  }, [
    deals,
    query,
    stageFilter,
    ownerFilter,
    sourceFilter,
    sortKey,
    sortDir,
    companyMap,
    owners,
    stageMap,
  ]);

  const overdueTargets = useMemo(
    () => overdueOpenDeals(deals, stageMap),
    [deals, stageMap]
  );
  const nextActionDeals = useMemo(
    () => topOpenDealsByAmount(deals, stageMap, 3),
    [deals, stageMap]
  );
  const stageStats = useMemo(
    () => pipelineValueByStage(deals, stages, stageMap),
    [deals, stages, stageMap]
  );
  const aiInsights = useMemo(() => {
    const overdueCount = overdueTargets.length;
    const topStage = stageStats[0];
    const topDeal = nextActionDeals[0];
    return [
      {
        id: "draft",
        title: "Close date risk",
        body: overdueCount
          ? `${overdueCount} open deal${overdueCount === 1 ? "" : "s"} ${overdueCount === 1 ? "is" : "are"} past the expected close date.`
          : "No overdue close dates. Draft a check-in for your largest open deals instead.",
        action: "Draft Follow-up",
      },
      {
        id: "explain",
        title: "Stage concentration",
        body: topStage
          ? `${topStage.stageName} holds the most open pipeline value (${formatDealAmount(topStage.value, deals[0]?.currency || "INR")}, ${topStage.count} deal${topStage.count === 1 ? "" : "s"}).`
          : "Add open deals to see where value is stacking up by stage.",
        action: "Explain Insight",
      },
      {
        id: "next",
        title: "Next best action",
        body: topDeal
          ? `Recommended next action: Confirm next steps on ${topDeal.name} and other high-value open deals.`
          : "No open deals need attention right now.",
        action: "Recommend Next Action",
      },
    ];
  }, [deals, overdueTargets.length, nextActionDeals, stageStats]);

  const activeFilterCount = [
    ownerFilter !== "all",
    stageFilter !== "all",
    sourceFilter !== "all",
    query.trim().length > 0,
  ].filter(Boolean).length;

  const totalPages = Math.max(1, Math.ceil(filteredDeals.length / pageSize));
  const pageRows = filteredDeals.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [query, stageFilter, ownerFilter, sourceFilter, pageSize, view]);

  const kpi = useMemo(() => computeDealKpis(deals, stages), [deals, stages]);

  const kpiCards = DEAL_KPI_DEFINITIONS.map((card) => {
    const valueById = {
      pipelineValue: formatDealAmount(kpi.pipelineValue, "INR"),
      openDeals: String(kpi.open),
      wonDeals: String(kpi.won),
      lostDeals: String(kpi.lost),
    };
    return { ...card, value: valueById[card.id] ?? "0" };
  });

  function openCreate() {
    setEditingDeal(null);
    setDealFormInstance((n) => n + 1);
    setFormOpen(true);
    router.replace("/deals?action=create", { scroll: false });
  }

  function closeForm(open) {
    setFormOpen(open);
    if (!open) {
      setEditingDeal(null);
      router.replace("/deals", { scroll: false });
    }
  }

  function openEdit(deal) {
    setEditingDeal(deal);
    setFormOpen(true);
  }

  const applyStageChange = useCallback(
    async (dealId, stageId, extras = {}) => {
      const deal = deals.find((d) => d.id === dealId);
      const stage = stageById(stages, stageId);
      if (!deal || !stage) return;

      const status = dealStatusFromStage(stage, deal.status);
      const body = {
        ...toApiDeal({ ...deal, stageId, status }),
        stage_id: stageId,
        status,
      };
      if (status === "won" && extras.actualCloseDate) {
        body.expected_close_date = extras.actualCloseDate;
      }

      try {
        const response = await apiFetch(`/api/deals/${dealId}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        const saved = fromApiDeal(response.data);
        const merged = {
          ...saved,
          description: deal.description,
          priority: deal.priority,
          leadSource: deal.leadSource,
          nextStep: deal.nextStep,
          notes: deal.notes,
          tags: deal.tags,
          pipelineName: deal.pipelineName,
          probability: String(probabilityForStage(stage)),
          lossReason: extras.lossReason || deal.lossReason,
          actualCloseDate: extras.actualCloseDate || deal.actualCloseDate,
          stageHistory: appendStageHistory(deal, deal.stageId, stageId, {
            lossReason: extras.lossReason,
          }),
        };
        persistDealMeta(merged);
        setDeals((prev) => prev.map((row) => (row.id === dealId ? merged : row)));
        toast.success("Stage updated");
      } catch (error) {
        toast.error(error.message || "Could not update stage");
      }
    },
    [deals, stages]
  );

  function requestStageMove(dealId, stageId) {
    const stage = stageById(stages, stageId);
    const deal = deals.find((d) => d.id === dealId);
    if (!stage || !deal) return;
    if (String(deal.stageId) === String(stageId)) return;

    if (stageIsLost(stage)) {
      setStageDialog({
        open: true,
        mode: "lost",
        dealId,
        stageId,
        confirming: false,
      });
      return;
    }
    if (stageIsWon(stage)) {
      setStageDialog({
        open: true,
        mode: "won",
        dealId,
        stageId,
        confirming: false,
      });
      return;
    }
    applyStageChange(dealId, stageId);
  }

  async function confirmStageDialog(extras) {
    setStageDialog((prev) => ({ ...prev, confirming: true }));
    await applyStageChange(stageDialog.dealId, stageDialog.stageId, extras);
    setStageDialog({
      open: false,
      mode: "normal",
      dealId: "",
      stageId: "",
      confirming: false,
    });
  }

  function requestDeleteDeal(deal) {
    setDeletePrompt({ mode: "single", deal });
  }

  function requestBulkDeleteDeals() {
    if (!selected.length) return;
    setDeletePrompt({ mode: "bulk" });
  }

  async function confirmDeleteDeal() {
    if (!deletePrompt) return;
    setDeleting(true);
    try {
      if (deletePrompt.mode === "bulk") {
        const ids = [...selected];
        await Promise.all(
          ids.map((id) => apiFetch(`/api/deals/${id}`, { method: "DELETE" }))
        );
        setDeals((prev) => prev.filter((d) => !ids.includes(d.id)));
        setSelected([]);
        toast.success(ids.length === 1 ? "Deal deleted" : "Selected deals removed");
      } else {
        const { deal } = deletePrompt;
        await apiFetch(`/api/deals/${deal.id}`, { method: "DELETE" });
        setDeals((prev) => prev.filter((d) => d.id !== deal.id));
        setSelected((prev) => prev.filter((id) => id !== deal.id));
        toast.success("Deal deleted");
      }
      setDeletePrompt(null);
    } catch (error) {
      toast.error(error.message || "Could not delete deal");
    } finally {
      setDeleting(false);
    }
  }

  async function handleSaveDeal(deal) {
    setDeals((prev) => {
      const exists = prev.some((r) => r.id === deal.id);
      if (exists) return prev.map((r) => (r.id === deal.id ? deal : r));
      return [deal, ...prev];
    });
  }

  async function handleCompanySave(data) {
    const payload = toApiCompany(data);
    const response = await apiFetch("/api/companies", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const saved = fromApiCompany(response.data);
    persistCompanyMeta({ ...saved, ...data });
    setCompanies((prev) => [saved, ...prev]);
    setCompanyFormOpen(false);
    toast.success("Company created");
  }

  function clearFilters() {
    setQuery("");
    setStageFilter("all");
    setOwnerFilter("all");
    setSourceFilter("all");
    setDraftStageFilter("all");
    setDraftOwnerFilter("all");
    setDraftSourceFilter("all");
  }

  function openFiltersSheet() {
    setDraftOwnerFilter(ownerFilter);
    setDraftStageFilter(stageFilter);
    setDraftSourceFilter(sourceFilter);
    setFiltersOpen(true);
  }

  function handleFiltersOpenChange(open) {
    if (open) {
      setDraftOwnerFilter(ownerFilter);
      setDraftStageFilter(stageFilter);
      setDraftSourceFilter(sourceFilter);
    }
    setFiltersOpen(open);
  }

  function clearDraftFilters() {
    setDraftOwnerFilter("all");
    setDraftStageFilter("all");
    setDraftSourceFilter("all");
  }

  function applyDraftFilters() {
    setOwnerFilter(draftOwnerFilter);
    setStageFilter(draftStageFilter);
    setSourceFilter(draftSourceFilter);
    setFiltersOpen(false);
  }

  const draftFilterCount = [
    draftOwnerFilter !== "all",
    draftStageFilter !== "all",
    draftSourceFilter !== "all",
  ].filter(Boolean).length;

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
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

  function openDeal(deal) {
    router.push(`/deals/${deal.id}`);
  }

  function downloadDealsExport() {
    const rows =
      selected.length > 0
        ? deals.filter((deal) => selected.includes(deal.id))
        : filteredDeals;
    exportDealsToCsv(rows, {
      companyMap,
      contactById,
      stageMap,
      ownerLabel: (ownerId) => ownerLabel(owners, ownerId),
    });
    setExportOpen(false);
    toast.success(`Exported ${rows.length} deal${rows.length === 1 ? "" : "s"}`);
  }

  function appendDealNote(id, note) {
    const deal = deals.find((row) => row.id === id);
    if (!deal) return;
    const notes = deal.notes ? `${deal.notes}\n\n${note}` : note;
    const merged = { ...deal, notes };
    persistDealMeta(merged);
    setDeals((prev) => prev.map((row) => (row.id === id ? merged : row)));
  }

  function openAiAction(id) {
    if (id === "draft") {
      const targets = overdueTargets.length ? overdueTargets : nextActionDeals;
      setFollowUpDraft(buildDealFollowUpDraft(targets, companyMap));
    }
    setAiAction(id);
  }

  function showDeals(targets) {
    setSelected(targets.map((deal) => deal.id));
    setStageFilter("all");
    setOwnerFilter("all");
    setSourceFilter("all");
    setQuery("");
    setView("table");
    setAiAction(null);
    setAiOpen(false);
  }

  async function saveFollowUpDrafts() {
    const targets = overdueTargets.length ? overdueTargets : nextActionDeals;
    if (!targets.length) {
      toast.error("No open deals to follow up on");
      return;
    }
    setAiBusy(true);
    try {
      const note = serializeAiNote(`Draft follow-up\n${followUpDraft.trim()}`);
      await Promise.all(targets.map((deal) => appendDealNote(deal.id, note)));
      toast.success(
        `Drafted follow-up for ${targets.length} deal${targets.length === 1 ? "" : "s"}`
      );
      showDeals(targets);
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

  function viewTopStageDeals() {
    const topStage = stageStats[0];
    if (!topStage) {
      toast.error("No stage data yet");
      return;
    }
    setStageFilter(String(topStage.stageId));
    setOwnerFilter("all");
    setSourceFilter("all");
    setQuery("");
    setSelected([]);
    setView("table");
    setAiAction(null);
    setAiOpen(false);
    toast.success(`Showing ${topStage.stageName} deals`);
  }

  function openTopRecommendedDeal() {
    const deal = nextActionDeals[0];
    if (!deal) return;
    setAiAction(null);
    setAiOpen(false);
    openDeal(deal);
  }

  async function scheduleRecommendedFollowUps() {
    if (!nextActionDeals.length) {
      toast.error("No open deals to schedule");
      return;
    }
    setAiBusy(true);
    try {
      const due = tomorrowAt(10, 30);
      await Promise.all(
        nextActionDeals.map((deal) => {
          const company = companyMap[deal.companyId] || "";
          return apiFetch("/api/tasks", {
            method: "POST",
            body: JSON.stringify({
              title: `Deal follow-up: ${deal.name}`,
              description: `Review next steps for ${deal.name}${company ? ` (${company})` : ""} before expected close.`,
              status: "todo",
              priority:
                deal.priority === "Urgent" || deal.priority === "High"
                  ? "high"
                  : "medium",
              due_at: due.toISOString(),
              assignee_id: currentUserId || null,
            }),
          });
        })
      );
      toast.success(
        `Scheduled ${nextActionDeals.length} follow-up task${nextActionDeals.length === 1 ? "" : "s"} for tomorrow, 10:30 AM`
      );
      setAiAction(null);
      setAiOpen(false);
    } catch (error) {
      toast.error(error.message || "Could not schedule tasks");
    } finally {
      setAiBusy(false);
    }
  }

  if (loadStatus === "loading") return <DealsSkeleton />;

  const dialogDeal = deals.find((d) => d.id === stageDialog.dealId);

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[1440px] flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <nav className={cn("mb-2 flex items-center gap-1.5", crmType.breadcrumb)}>
            <span>Workspace</span>
            <span className="text-primary-300">/</span>
            <span className="font-medium text-primary-700 dark:text-primary-300">
              Deals
            </span>
          </nav>
          <h1 className="text-[26px] leading-8 font-bold tracking-[-0.03em] text-neutral-900 sm:text-[28px] dark:text-neutral-50">
            Deals
          </h1>
          <p className="mt-1 max-w-[56ch] text-[14px] text-neutral-500">
            Track opportunities and manage your sales pipeline.
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
            Import Deals
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-lg"
            aria-label="Export deals"
            onClick={() => setExportOpen(true)}
          >
            <Download className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-lg border-primary-200 bg-gradient-to-br from-primary-50 via-secondary-50 to-primary-100 text-primary-700 hover:from-primary-100 hover:via-secondary-100 hover:to-primary-200 hover:text-primary-800 dark:border-primary-800 dark:from-primary-950 dark:via-secondary-900/50 dark:to-primary-900 dark:text-primary-300 dark:hover:from-primary-900 dark:hover:via-secondary-900/70 dark:hover:to-primary-800"
            aria-label="AI Deal Insights"
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
            Create Deal
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
                    <p className="mt-1 text-[22px] font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                      {card.value}
                    </p>
                  </div>
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-300">
                    <Icon className="size-4" />
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-neutral-500">{card.hint}</p>
              </CardContent>
            </Card>
          );
        })}
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
                  placeholder="Search deals by name or company…"
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
                    <Button type="button" variant="outline" className="h-9 rounded-lg" />
                  }
                >
                  <ArrowDownUp className="size-3.5" />
                  Sort
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-48">
                  {[
                    ["createdAt", "Created date"],
                    ["name", "Deal name"],
                    ["amount", "Deal value"],
                    ["closeDate", "Close date"],
                    ["stage", "Stage"],
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
                  {DEAL_ALL_COLUMNS.map((col) => {
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
                    onClick={requestBulkDeleteDeals}
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

        {deals.length === 0 ? (
          <div className="p-6">
            <CrmEmptyState
              title="No deals yet"
              description="Create your first opportunity to start tracking pipeline value."
              actionLabel="Create Deal"
              onAction={openCreate}
            />
          </div>
        ) : view === "kanban" ? (
          <div className="p-3 pt-2">
            <DealsKanban
              stages={partitionedStages}
              allStages={pipelineStageCatalog.all}
              deals={filteredDeals}
              companies={companies}
              contacts={contacts}
              owners={owners}
              onOpenDeal={(id) => router.push(`/deals/${id}`)}
              onMoveDeal={requestStageMove}
            />
          </div>
        ) : (
          <DealsListTable
            pageRows={pageRows}
            filteredCount={filteredDeals.length}
            visibleColumns={visibleColumns}
            selected={selected}
            toggleSelect={toggleSelect}
            toggleSelectAll={toggleSelectAll}
            toggleSort={toggleSort}
            companyMap={companyMap}
            contacts={contacts}
            stageMap={stageMap}
            owners={owners}
            page={page}
            pageSize={pageSize}
            totalPages={totalPages}
            setPage={setPage}
            setPageSize={setPageSize}
            pageSizes={DEAL_PAGE_SIZES}
            onView={openDeal}
            onEdit={openEdit}
          />
        )}
      </Card>

      <DealFormDrawer
        open={formOpen}
        onOpenChange={closeForm}
        initialDeal={editingDeal}
        stages={stages}
        companies={companies}
        contacts={contacts}
        owners={owners}
        formInstanceKey={dealFormInstance}
        onSaved={handleSaveDeal}
        onCompanyCreated={(company) => setCompanies((prev) => [...prev, company])}
        onContactCreated={(contact) => setContacts((prev) => [...prev, contact])}
      />

      <CompanyFormDrawer
        open={companyFormOpen}
        onOpenChange={setCompanyFormOpen}
        onSave={handleCompanySave}
        owners={owners}
        defaultOwnerId={currentUserId}
        existingCompanies={companies}
      />

      <DealStageDialog
        open={stageDialog.open}
        onOpenChange={(open) =>
          setStageDialog((prev) => ({
            ...prev,
            open,
            confirming: false,
          }))
        }
        mode={stageDialog.mode}
        dealName={dialogDeal?.name}
        confirming={stageDialog.confirming}
        onConfirm={confirmStageDialog}
      />

      <Sheet open={filtersOpen} onOpenChange={handleFiltersOpenChange}>
        <SheetContent
          title="Filters"
          description="Narrow deals by owner, stage, and lead source."
          onClose={() => handleFiltersOpenChange(false)}
        >
          <SheetBody className="space-y-5">
            <div>
              <Label htmlFor="deal-filter-owner">Owner</Label>
              <Select value={draftOwnerFilter} onValueChange={setDraftOwnerFilter}>
                <SelectTrigger
                  id="deal-filter-owner"
                  className="mt-1.5 h-9 w-full rounded-lg"
                >
                  <SelectValue placeholder="Owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All owners</SelectItem>
                  {owners.map((owner) => (
                    <SelectItem key={owner.id} value={owner.id}>
                      {owner.name || owner.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="deal-filter-stage">Stage</Label>
              <Select value={draftStageFilter} onValueChange={setDraftStageFilter}>
                <SelectTrigger
                  id="deal-filter-stage"
                  className="mt-1.5 h-9 w-full rounded-lg"
                >
                  <SelectValue placeholder="Stage" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="all">All stages</SelectItem>
                  {stages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="deal-filter-source">Lead source</Label>
              <Select value={draftSourceFilter} onValueChange={setDraftSourceFilter}>
                <SelectTrigger
                  id="deal-filter-source"
                  className="mt-1.5 h-9 w-full rounded-lg"
                >
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sources</SelectItem>
                  {DEAL_LEAD_SOURCES.map((source) => (
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

      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent
          title="Export Deals"
          description="Download the current filtered deal list."
          onClose={() => setExportOpen(false)}
        >
          <DialogBody className="text-[13px] text-neutral-600">
            Export {selected.length > 0 ? selected.length : filteredDeals.length}{" "}
            deal
            {(selected.length > 0 ? selected.length : filteredDeals.length) === 1
              ? ""
              : "s"}{" "}
            as CSV (re-importable format with stage, company, and source fields).
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setExportOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-primary-600 text-white hover:bg-primary-700"
              onClick={downloadDealsExport}
            >
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
          title="AI Deal Insights"
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
          description="Save this note to at-risk deals, or copy it to send yourself."
          onClose={() => setAiAction(null)}
        >
          <DialogBody className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {(overdueTargets.length ? overdueTargets : nextActionDeals).map(
                (deal) => (
                  <span
                    key={deal.id}
                    className="rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary-700 dark:bg-primary-950 dark:text-primary-300"
                  >
                    {deal.name}
                  </span>
                )
              )}
            </div>
            <Textarea
              value={followUpDraft}
              onChange={(event) => setFollowUpDraft(event.target.value)}
              rows={8}
            />
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={copyFollowUpDraft}>
              <Copy className="size-3.5" />
              Copy
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                showDeals(overdueTargets.length ? overdueTargets : nextActionDeals)
              }
              disabled={
                !(overdueTargets.length ? overdueTargets : nextActionDeals).length
              }
            >
              View deals
            </Button>
            <Button
              type="button"
              className="bg-primary-600 text-white hover:bg-primary-700"
              disabled={
                aiBusy ||
                !followUpDraft.trim() ||
                !(overdueTargets.length ? overdueTargets : nextActionDeals).length
              }
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
          title="Stage concentration"
          description="Open pipeline value by stage in this workspace."
          onClose={() => setAiAction(null)}
        >
          <DialogBody className="space-y-3">
            {stageStats.length ? (
              <ul className="space-y-2">
                {stageStats.map((row) => (
                  <li
                    key={row.stageId}
                    className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 px-3 py-2.5 dark:border-neutral-800"
                  >
                    <div>
                      <p className="text-[13px] font-semibold">{row.stageName}</p>
                      <p className="text-[12px] text-muted-foreground">
                        {row.count} open deal{row.count === 1 ? "" : "s"}
                      </p>
                    </div>
                    <p className="text-[14px] font-bold tabular-nums">
                      {formatDealAmount(row.value, deals[0]?.currency || "INR")}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] text-muted-foreground">No open pipeline data yet.</p>
            )}
            <p className="text-[12px] leading-5 text-muted-foreground">
              Stages holding the most value are good candidates for manager reviews and
              unblocker calls this week.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAiAction(null)}>
              Close
            </Button>
            <Button
              type="button"
              className="bg-primary-600 text-white hover:bg-primary-700"
              onClick={viewTopStageDeals}
              disabled={!stageStats.length}
            >
              View top stage
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
          description="Create follow-up tasks for the highest-value open deals."
          onClose={() => setAiAction(null)}
        >
          <DialogBody className="space-y-3">
            {nextActionDeals.length ? (
              <ul className="space-y-2">
                {nextActionDeals.map((deal) => (
                  <li
                    key={deal.id}
                    className="rounded-xl border border-neutral-200 px-3 py-2.5 dark:border-neutral-800"
                  >
                    <p className="text-[13px] font-semibold">{deal.name}</p>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                      {formatDealAmount(deal.amount, deal.currency)} ·{" "}
                      {stageMap[deal.stageId]?.name || "Open"}
                      {companyMap[deal.companyId]
                        ? ` · ${companyMap[deal.companyId]}`
                        : ""}
                    </p>
                    <p className="mt-1 text-[12px] text-neutral-600 dark:text-neutral-300">
                      Schedule a 20-min deal review tomorrow at 10:30 AM.
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] text-muted-foreground">No open deals to recommend.</p>
            )}
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={openTopRecommendedDeal}
              disabled={!nextActionDeals.length}
            >
              Open top deal
            </Button>
            <Button
              type="button"
              className="bg-primary-600 text-white hover:bg-primary-700"
              disabled={aiBusy || !nextActionDeals.length}
              onClick={scheduleRecommendedFollowUps}
            >
              {aiBusy ? "Scheduling…" : "Schedule follow-ups"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CsvImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Import Deals"
        description="Upload a CSV with deal name and amount. Match companies and contacts by name or email."
        requiredHint="Required: name, amount · optional: stage, company, contact_email, owner"
        entityName="deal"
        maxWidth={560}
        previewColumns={[
          { header: "Deal", cell: (row) => row.name },
          {
            header: "Value",
            cell: (row) => formatDealAmount(row.amount, row.currency),
          },
          {
            header: "Stage",
            cell: (row) =>
              stageMap[row.stageId]?.name || row.stageId || "—",
          },
          { header: "Company", cell: (row) => row.companyLabel || "—" },
        ]}
        onParseFile={(file) => {
          const companyNameById = Object.fromEntries(
            companies.map((company) => [company.id, company.name])
          );
          return parseDealCsvFile(file, {
            existingNames: deals.map((deal) => deal.name),
            stages,
            companies,
            contacts,
            owners,
            fallbackOwnerId: currentUserId || owners[0]?.id || "",
          }).then((result) => ({
            valid: (result.valid || []).map((row) => ({
              ...row,
              companyLabel: row.companyId
                ? companyNameById[row.companyId] || ""
                : "",
            })),
            errors: result.errors,
          }));
        }}
        onImport={async (rows, { reportProgress }) => {
          const fallbackOwnerId = currentUserId || owners[0]?.id || null;
          const created = [];
          for (let index = 0; index < rows.length; index += 1) {
            const row = rows[index];
            const ownerId =
              owners.some((owner) => owner.id === row.ownerId) &&
              UUID_RE.test(row.ownerId)
                ? row.ownerId
                : fallbackOwnerId;
            const stage = stageById(stages, row.stageId);
            const body = toApiDeal({
              ...row,
              ownerId,
              status: row.status || dealStatusFromStage(stage, "open"),
            });
            const response = await apiFetch("/api/deals", {
              method: "POST",
              body: JSON.stringify(body),
            });
            const saved = mergeDemoDealMeta(fromApiDeal(response.data));
            const merged = {
              ...saved,
              priority: row.priority || "",
              leadSource: row.leadSource || "",
              pipelineName: row.pipelineName || "",
              probability: row.probability ?? "",
              notes: row.notes || "",
            };
            persistDealMeta(merged);
            created.push(merged);
            reportProgress(index + 1, rows.length);
          }
          setDeals((prev) => [...created, ...prev]);
          toast.success(
            `Imported ${created.length} deal${created.length === 1 ? "" : "s"}`
          );
        }}
      />

      <Dialog
        open={Boolean(deletePrompt)}
        onOpenChange={(open) => {
          if (!open) setDeletePrompt(null);
        }}
      >
        <DialogContent
          title={deletePrompt?.mode === "bulk" ? "Delete deals?" : "Delete deal?"}
          description="This removes the deal from your pipeline. Associated contacts and companies are not deleted."
          onClose={() => setDeletePrompt(null)}
        >
          <DialogBody>
            <p className="text-[13px] text-neutral-600 dark:text-neutral-300">
              {deletePrompt?.mode === "bulk" ? (
                <>
                  Delete <strong>{selected.length}</strong> selected deal
                  {selected.length === 1 ? "" : "s"}? This action cannot be undone.
                </>
              ) : (
                <>
                  Delete <strong>{deletePrompt?.deal?.name}</strong>? This action cannot be
                  undone.
                </>
              )}
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
              onClick={confirmDeleteDeal}
            >
              {deleting ? "Deleting…" : "Delete deal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
