"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Copy, Info, Plus, Search, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import {
  createTemplateApi,
  deleteTemplateApi,
  fetchMarketingState,
  updateTemplateApi,
} from "@/components/marketing/marketing-api";
import {
  applyMktTemplateVariables,
  draftFieldsForCompare,
  MKT_FILTER_CHIP,
  MKT_FILTER_CHIP_ACTIVE,
  MKT_VARIABLES,
  TEMPLATE_CATEGORIES,
} from "@/components/marketing/marketing-data";
import { useCampaignWizard } from "@/components/marketing/marketing-campaign-wizard-provider";
import { CommunicationsDropdown } from "@/components/communications/communications-dropdown-field";
import { CommunicationsMessageEditor } from "@/components/communications/communications-message-editor";
import { CrmEmptyState } from "@/components/crm/crm-shared";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { crmType } from "@/lib/crm-typography";
import { cn } from "@/lib/utils";

const EMPTY = {
  name: "",
  category: "General",
  subject: "",
  body: "",
  visibility: "workspace",
};

function TemplateListItemSkeleton({ active = false }) {
  return (
    <div
      className={cn(
        "w-full rounded-xl border px-3 py-2.5",
        active
          ? "border-primary-200/80 bg-primary-50/50 dark:border-primary-900 dark:bg-primary-950/40"
          : "border-transparent"
      )}
    >
      <Skeleton className="h-4 w-36 max-w-full rounded-md" />
      <Skeleton className="mt-1.5 h-3 w-28 max-w-full rounded-md" />
      <div className="mt-2 flex items-center gap-2">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-3 w-10 rounded-md" />
      </div>
    </div>
  );
}

export function MarketingTemplatesSkeleton() {
  return (
    <div
      className="mx-auto flex w-full min-w-0 max-w-[1680px] flex-col gap-4 pb-6"
      aria-busy="true"
      aria-label="Loading templates"
    >
      <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-3 w-52 rounded-md" />
          <Skeleton className="h-8 w-36 rounded-lg" />
          <Skeleton className="h-4 w-full max-w-md rounded-md" />
          <Skeleton className="h-4 w-full max-w-sm rounded-md" />
        </div>
        <Skeleton className="h-9 w-32 shrink-0 rounded-lg" />
      </header>

      <section className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-[0_1px_0_rgba(15,23,42,0.02)] dark:border-neutral-800 dark:bg-neutral-950">
        <div className="border-b border-neutral-100 px-4 py-3 dark:border-neutral-800 sm:px-5">
          <div className="flex min-w-0 items-center justify-between gap-4">
            <div className="flex min-w-0 flex-1 flex-wrap gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-16 rounded-full" />
              ))}
            </div>
            <Skeleton className="h-9 w-full max-w-[13rem] rounded-lg sm:w-52" />
          </div>
        </div>

        <div className="grid min-h-[560px] grid-cols-1 xl:grid-cols-[minmax(260px,320px)_minmax(0,1fr)]">
          <aside className="border-b border-neutral-100 p-3 dark:border-neutral-800 xl:border-b-0 xl:border-r xl:p-4">
            <ul className="space-y-1 pr-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <li key={i}>
                  <TemplateListItemSkeleton active={i === 0} />
                </li>
              ))}
            </ul>
          </aside>

          <div className="flex min-h-0 flex-col">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 px-4 py-3 dark:border-neutral-800 sm:px-5">
              <div className="min-w-0 space-y-1.5">
                <Skeleton className="h-4 w-40 rounded-md" />
                <Skeleton className="h-3 w-28 rounded-md" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-8 w-28 rounded-lg" />
                <Skeleton className="h-8 w-24 rounded-lg" />
                <Skeleton className="h-8 w-16 rounded-lg" />
                <Skeleton className="h-8 w-28 rounded-lg" />
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4 sm:p-5">
              <Skeleton className="h-14 w-full rounded-xl" />
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-24 rounded-md" />
                  <Skeleton className="h-9 w-full rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-16 rounded-md" />
                  <Skeleton className="h-9 w-full rounded-lg" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-20 rounded-md" />
                <Skeleton className="h-9 w-full rounded-lg" />
                <div className="flex flex-wrap gap-1">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-6 w-32 rounded-md" />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-10 rounded-md" />
                <div className="flex flex-wrap gap-1">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-6 w-28 rounded-md" />
                  ))}
                </div>
                <Skeleton className="h-[220px] w-full rounded-xl" />
              </div>
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function MarketingTemplatesHome() {
  const { openCampaignWizard } = useCampaignWizard();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [baseline, setBaseline] = useState(null);

  const isDirty = useMemo(() => {
    if (baseline === null) return false;
    return JSON.stringify(draftFieldsForCompare(draft)) !== baseline;
  }, [draft, baseline]);

  function captureBaseline(nextDraft) {
    setBaseline(JSON.stringify(draftFieldsForCompare(nextDraft)));
  }

  function confirmDiscardIfDirty() {
    if (!isDirty) return true;
    return window.confirm("Discard unsaved changes to this template?");
  }

  async function refresh() {
    const data = await fetchMarketingState();
    setTemplates(data.templates || []);
    return data.templates || [];
  }

  useEffect(() => {
    refresh()
      .then((list) => {
        if (list[0]) {
          const row = { ...EMPTY, ...list[0] };
          setSelectedId(list[0].id);
          setDraft(row);
          captureBaseline(row);
        } else {
          captureBaseline(EMPTY);
        }
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = [...templates];
    if (categoryFilter !== "all") list = list.filter((t) => t.category === categoryFilter);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (t) =>
          t.name?.toLowerCase().includes(q) ||
          t.subject?.toLowerCase().includes(q) ||
          t.category?.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [templates, categoryFilter, query]);

  const selectedHiddenByFilter = useMemo(
    () => Boolean(selectedId && !filtered.some((t) => t.id === selectedId)),
    [selectedId, filtered]
  );

  const isNew = !selectedId;

  function selectTemplate(t) {
    if (!confirmDiscardIfDirty()) return;
    const row = { ...EMPTY, ...t };
    setSelectedId(t.id);
    setDraft(row);
    captureBaseline(row);
  }

  function newTemplate() {
    if (!confirmDiscardIfDirty()) return;
    const row = { ...EMPTY, name: "Untitled template" };
    setSelectedId("");
    setDraft(row);
    captureBaseline(row);
  }

  async function saveTemplate() {
    if (!draft.name?.trim()) {
      toast.error("Template name is required");
      return;
    }
    setSaving(true);
    try {
      const row = selectedId
        ? await updateTemplateApi(selectedId, draft)
        : await createTemplateApi(draft);
      toast.success("Template saved");
      const list = await refresh();
      const match = { ...EMPTY, ...(list.find((t) => t.id === row.id) || row) };
      setSelectedId(match.id);
      setDraft(match);
      captureBaseline(match);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function duplicateTemplate() {
    if (!selectedId && !draft.name) return;
    try {
      const row = await createTemplateApi({
        ...draft,
        name: `${draft.name || "Template"} (copy)`,
      });
      const list = await refresh();
      const match = list.find((t) => t.id === row.id) || row;
      selectTemplate(match);
      toast.success("Template duplicated");
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function confirmDelete() {
    if (!selectedId) return;
    try {
      await deleteTemplateApi(selectedId);
      toast.success("Template deleted");
      setDeleteOpen(false);
      const list = await refresh();
      if (list[0]) {
        selectTemplate(list[0]);
      } else {
        setSelectedId("");
        setDraft(EMPTY);
        captureBaseline(EMPTY);
      }
    } catch (e) {
      toast.error(e.message);
    }
  }

  function insertVariable(token, field = "body") {
    setDraft((d) => {
      const current = d[field] || "";
      const spacer = current && !current.endsWith(" ") ? " " : "";
      return { ...d, [field]: `${current}${spacer}${token}` };
    });
  }

  if (loading) return <MarketingTemplatesSkeleton />;

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[1680px] flex-col gap-4 pb-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <PageBreadcrumb
            items={[
              { href: "/", label: "Workspace" },
              { href: "/marketing", label: "Marketing" },
              { label: "Templates" },
            ]}
            className="mb-2"
          />
          <h1 className="text-[26px] font-bold tracking-[-0.03em] text-neutral-900 dark:text-neutral-50">
            Templates
          </h1>
          <p className={cn("mt-1 max-w-[58ch] text-pretty", crmType.pageDescription)}>
            Reusable subject lines and bodies for campaign drafts. Attach saved templates when you
            build a campaign — bulk send stays off in Phase 1.
          </p>
        </div>
        <Button
          type="button"
          className="h-9 shrink-0 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
          onClick={newTemplate}
        >
          <Plus className="size-3.5" />
          New template
        </Button>
      </header>

      <section className="rounded-2xl border border-neutral-200/80 bg-white shadow-[0_1px_0_rgba(15,23,42,0.02)] dark:border-neutral-800 dark:bg-neutral-950">
        <h2 className="sr-only">Template library and editor</h2>

        <div className="border-b border-neutral-100 px-4 py-3 dark:border-neutral-800 sm:px-5">
          <div className="flex min-w-0 items-center justify-between gap-4">
            <TemplateCategoryChips value={categoryFilter} onChange={setCategoryFilter} />
            <div className="relative w-full min-w-0 sm:w-52 sm:shrink-0">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-9 w-full rounded-lg pl-8 text-[13px]"
                placeholder="Name or subject…"
                aria-label="Search templates"
              />
            </div>
          </div>
        </div>

        <div className="grid min-h-[560px] grid-cols-1 xl:grid-cols-[minmax(260px,320px)_minmax(0,1fr)]">
          <aside className="border-b border-neutral-100 p-3 dark:border-neutral-800 xl:border-b-0 xl:border-r xl:p-4">
            {filtered.length === 0 ? (
              <div className="py-8">
                <CrmEmptyState
                  title={templates.length ? "No matches" : "No templates yet"}
                  description={
                    templates.length
                      ? "Try another category or search term."
                      : "Create a template to reuse copy in campaign drafts."
                  }
                  actionLabel={templates.length ? undefined : "New template"}
                  onAction={templates.length ? undefined : newTemplate}
                />
              </div>
            ) : (
              <ul className="max-h-[min(520px,60vh)] space-y-1 overflow-y-auto pr-1">
                {filtered.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => selectTemplate(t)}
                      className={cn(
                        "w-full rounded-xl border px-3 py-2.5 text-left transition-colors",
                        selectedId === t.id
                          ? "border-primary-200 bg-primary-50/80 dark:border-primary-900 dark:bg-primary-950/40"
                          : "border-transparent hover:border-neutral-200/80 hover:bg-neutral-50 dark:hover:border-neutral-800 dark:hover:bg-neutral-900/50"
                      )}
                    >
                      <p className="truncate text-[13px] font-semibold text-foreground">
                        {t.name}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                        {t.subject || "No subject"}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="h-5 border-0 px-1.5 text-[10px] font-medium"
                        >
                          {t.category}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {t.updatedAt ? format(new Date(t.updatedAt), "MMM d") : "—"}
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          <div className="flex min-h-0 flex-col">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 px-4 py-3 dark:border-neutral-800 sm:px-5">
              <div className="min-w-0">
                <p className="truncate text-[14px] font-semibold text-foreground">
                  {isNew ? "New template" : draft.name || "Untitled"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {isNew
                    ? "Not saved yet"
                    : isDirty
                      ? "Unsaved changes"
                      : `Updated ${draft.updatedAt ? format(new Date(draft.updatedAt), "MMM d, yyyy") : "—"}`}
                </p>
                {selectedHiddenByFilter ? (
                  <p className="mt-0.5 text-[11px] text-amber-700 dark:text-amber-300">
                    Hidden by category or search filters — still editable.
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedId ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg"
                    disabled={isDirty}
                    title={isDirty ? "Save template before starting a campaign" : undefined}
                    onClick={() =>
                      openCampaignWizard({ templateId: selectedId })
                    }
                  >
                    Use in campaign
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg"
                  onClick={duplicateTemplate}
                  disabled={isNew && !draft.body && !draft.subject}
                >
                  <Copy className="size-3.5" />
                  Duplicate
                </Button>
                {selectedId ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </Button>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  className="h-8 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
                  disabled={saving}
                  onClick={saveTemplate}
                >
                  {saving ? "Saving…" : "Save template"}
                </Button>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-5">
              <div className="flex gap-2 rounded-xl border border-neutral-200/80 bg-neutral-50/80 px-3 py-2.5 text-[12px] text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-300">
                <Info className="mt-0.5 size-4 shrink-0 text-primary-600" aria-hidden />
                <p>
                  Variables such as{" "}
                  <code className="rounded bg-white px-1 text-[11px] dark:bg-neutral-950">
                    {"{{contact.first_name}}"}
                  </code>{" "}
                  are replaced when you preview or send from a campaign.
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Field label="Template name">
                  <Input
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    className="h-9 rounded-lg"
                    placeholder="Q1 product digest"
                  />
                </Field>
                <TemplateCategorySelect
                  value={draft.category}
                  onValueChange={(v) => setDraft({ ...draft, category: v })}
                />
              </div>

              <Field label="Email subject">
                <Input
                  value={draft.subject}
                  onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                  className="h-9 rounded-lg"
                  placeholder="Subject line"
                />
                <MktVariableChips onInsert={(token) => insertVariable(token, "subject")} />
              </Field>

              <div className="space-y-2">
                <Label className={crmType.fieldLabel}>Body</Label>
                <MktVariableChips onInsert={(token) => insertVariable(token, "body")} />
                <CommunicationsMessageEditor
                  value={draft.body}
                  onChange={(body) => setDraft({ ...draft, body })}
                  minHeight={220}
                  className="w-full max-w-none rounded-xl"
                />
              </div>

              <TemplatePreviewCard draft={draft} />
            </div>
          </div>
        </div>
      </section>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent
          title="Delete template?"
          description="This cannot be undone."
          onClose={() => setDeleteOpen(false)}
          maxWidth={440}
        >
          <DialogBody>
            <p className="text-[13px] text-muted-foreground">
              <span className="font-medium text-foreground">{draft.name}</span> will be removed from
              the library. Campaigns already using this content are not changed.
            </p>
          </DialogBody>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete}>
              Delete template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TemplatePreviewCard({ draft }) {
  const subject = applyMktTemplateVariables(draft.subject, draft);
  const body = applyMktTemplateVariables(draft.body, draft);
  return (
    <div className="rounded-2xl border border-dashed border-neutral-200/90 bg-neutral-50/50 p-4 sm:p-5 dark:border-neutral-800 dark:bg-neutral-900/30">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Inbox preview
        <span className="ml-2 font-normal normal-case text-muted-foreground">
          (sample merge data)
        </span>
      </p>
      <div className="rounded-xl border border-neutral-200/80 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-950">
        <p className="text-[11px] text-muted-foreground">From · NovaCRM Marketing</p>
        <p className="mt-2 text-[15px] font-semibold text-foreground">
          {subject?.trim() || "Subject line"}
        </p>
        <p className="mt-3 whitespace-pre-wrap text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-300">
          {body?.trim() || "Email body will appear here as you type."}
        </p>
      </div>
    </div>
  );
}

function MktVariableChips({ onInsert }) {
  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {MKT_VARIABLES.map((v) => (
        <button
          key={v.token}
          type="button"
          onClick={() => onInsert(v.token)}
          className="rounded-md border border-neutral-200/80 bg-white px-2 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:border-primary-200 hover:text-primary-700 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-primary-800"
          title={v.label}
        >
          {v.token}
        </button>
      ))}
    </div>
  );
}

function Field({ label, className, children }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className={crmType.fieldLabel}>{label}</Label>
      {children}
    </div>
  );
}

const FILTER_CATEGORIES = [
  { id: "all", label: "All" },
  ...TEMPLATE_CATEGORIES.map((c) => ({ id: c, label: c })),
];

function TemplateCategoryChips({ value, onChange }) {
  return (
    <div
      className="flex min-w-0 flex-1 flex-wrap gap-2"
      role="tablist"
      aria-label="Filter by category"
    >
      {FILTER_CATEGORIES.map((cat) => {
        const active = value === cat.id;
        return (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(cat.id)}
            className={cn(MKT_FILTER_CHIP, active && MKT_FILTER_CHIP_ACTIVE)}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}

function TemplateCategorySelect({
  value,
  onValueChange,
  includeAll = false,
  className,
}) {
  const options = useMemo(() => {
    const items = TEMPLATE_CATEGORIES.map((c) => ({ value: c, label: c }));
    return includeAll ? [{ value: "all", label: "All categories" }, ...items] : items;
  }, [includeAll]);

  return (
    <Field label="Category" className={className}>
      <CommunicationsDropdown
        value={value}
        onChange={onValueChange}
        options={options}
        placeholder="Category"
        triggerClassName="rounded-lg"
      />
    </Field>
  );
}
