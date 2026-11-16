"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, Megaphone, Plus, Search, SquarePen, Trash2, Users } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import {
  createSegmentApi,
  fetchMarketingState,
  previewSegmentApi,
  updateSegmentApi,
} from "@/components/marketing/marketing-api";
import {
  FILTER_OPERATORS,
  SEGMENT_FILTER_FIELDS,
} from "@/components/marketing/marketing-data";
import { useCampaignWizard } from "@/components/marketing/marketing-campaign-wizard-provider";
import { CommunicationsDropdown } from "@/components/communications/communications-dropdown-field";
import { FieldError } from "@/components/crm/crm-shared";
import { FormFieldDropdown } from "@/components/shared/form-field-dropdown";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { mapMemberToOwner } from "@/components/contacts/contact-api";
import { ownerById } from "@/components/contacts/contacts-data";
import { crmType } from "@/lib/crm-typography";
import { cn } from "@/lib/utils";

const EMPTY_SEGMENT = {
  name: "",
  description: "",
  segmentType: "dynamic",
  filters: { logic: "and", conditions: [] },
  ownerId: "",
};

const TYPE_FILTER_OPTIONS = [
  { value: "all", label: "All types" },
  { value: "dynamic", label: "Dynamic" },
  { value: "static", label: "Static" },
];

const VALUELESS_OPERATORS = new Set(["is_true"]);

function segmentErrorFor(field, values, { segments = [], editId = null } = {}) {
  if (field === "name") {
    const name = String(values.name || "").trim();
    if (!name) return "Segment name is required";
    if (name.length > 120) return "Segment name must be 120 characters or fewer";
    const duplicate = segments.some(
      (s) =>
        s.id !== editId && String(s.name || "").trim().toLowerCase() === name.toLowerCase()
    );
    if (duplicate) return "A segment with this name already exists";
  }
  if (field === "segmentType") {
    const type = values.segmentType;
    if (!type || !["dynamic", "static"].includes(type)) {
      return "Select a segment type";
    }
  }
  if (field === "description") {
    const description = String(values.description || "");
    if (description.length > 500) {
      return "Description must be 500 characters or fewer";
    }
  }
  if (field === "filters") {
    if (values.segmentType === "dynamic") {
      const conditions = values.filters?.conditions || [];
      if (!conditions.length) {
        return "Add at least one condition for a dynamic segment";
      }
    }
  }
  return undefined;
}

function conditionValueError(condition) {
  if (!condition) return undefined;
  if (VALUELESS_OPERATORS.has(condition.operator)) return undefined;
  if (!String(condition.value || "").trim()) return "Value is required";
  return undefined;
}

function conditionValuePlaceholder(condition) {
  if (!condition || VALUELESS_OPERATORS.has(condition.operator)) {
    return "Not required";
  }
  switch (condition.field) {
    case "company":
      return "e.g. Acme Corp";
    case "industry":
      return "e.g. Software";
    case "owner":
      return "Owner ID or name";
    case "created_date":
      return "YYYY-MM-DD";
    case "has_email":
      return "true or false";
    default:
      return "Enter value";
  }
}

function AudienceTableRowSkeleton() {
  return (
    <tr className="border-b border-neutral-100 dark:border-neutral-800/80">
      <td className="px-4 py-3">
        <Skeleton className="mb-1.5 h-4 w-40 max-w-full rounded-md" />
        <Skeleton className="h-3 w-56 max-w-full rounded-md" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-5 w-16 rounded-full" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-10 rounded-md" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-24 rounded-md" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-20 rounded-md" />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-center gap-1">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="size-8 rounded-lg" />
        </div>
      </td>
    </tr>
  );
}

function PreviewResultsSkeleton() {
  return (
    <div
      className="rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-3 dark:border-neutral-800 dark:bg-neutral-900/40"
      aria-busy="true"
      aria-label="Loading preview"
    >
      <div className="flex items-center gap-2">
        <Skeleton className="size-4 rounded-md" />
        <Skeleton className="h-4 w-44 rounded-md" />
      </div>
      <ul className="mt-3 space-y-2 border-t border-neutral-200/80 pt-3 dark:border-neutral-700">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i}>
            <Skeleton className="h-3.5 w-full max-w-[240px] rounded-md" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MarketingAudiencesSkeleton() {
  return (
    <div
      className="mx-auto flex w-full min-w-0 max-w-[1680px] flex-col gap-4 pb-6"
      aria-busy="true"
      aria-label="Loading audiences"
    >
      <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-3 w-52 rounded-md" />
          <Skeleton className="h-8 w-40 rounded-lg" />
          <Skeleton className="h-4 w-full max-w-md rounded-md" />
          <Skeleton className="h-4 w-full max-w-sm rounded-md" />
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Skeleton className="h-4 w-28 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </header>

      <Card className="overflow-hidden rounded-2xl border-neutral-200/80 py-0 shadow-sm dark:border-neutral-800">
        <CardContent className="p-0">
          <div className="border-b border-neutral-100 px-4 py-3 dark:border-neutral-800 sm:px-5">
            <div className="flex min-w-0 items-center justify-between gap-4">
              <Skeleton className="h-9 w-44 shrink-0 rounded-lg" />
              <Skeleton className="h-9 w-full max-w-[13rem] rounded-lg sm:w-52" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-[13px]">
              <thead className="border-b border-neutral-100 bg-neutral-50/50 dark:border-neutral-800 dark:bg-neutral-900/40">
                <tr>
                  {["Segment", "Type", "Contacts", "Owner", "Updated", "Actions"].map((col) => (
                    <th key={col} className="px-4 py-2.5">
                      <Skeleton className="h-3 w-14 rounded-md" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 7 }).map((_, i) => (
                  <AudienceTableRowSkeleton key={i} />
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function MarketingAudiencesHome() {
  const { openCampaignWizard } = useCampaignWizard();
  const searchParams = useSearchParams();
  const [segments, setSegments] = useState([]);
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [builderOpen, setBuilderOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_SEGMENT);
  const [preview, setPreview] = useState(null);
  const [rowPreview, setRowPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewTitle, setPreviewTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});
  const [conditionErrors, setConditionErrors] = useState({});

  const refresh = useCallback(async () => {
    const data = await fetchMarketingState();
    setSegments(data.segments || []);
    return data.segments || [];
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [data, members] = await Promise.all([
          fetchMarketingState(),
          apiFetch("/api/workspace/members"),
        ]);
        if (cancelled) return;
        setSegments(data.segments || []);
        setOwners((members.data || []).map(mapMemberToOwner));
        if (searchParams.get("action") === "create") {
          setEditId(null);
          setForm(EMPTY_SEGMENT);
          setPreview(null);
          setBuilderOpen(true);
        }
      } catch (e) {
        toast.error(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const filtered = useMemo(() => {
    let list = [...segments];
    if (typeFilter !== "all") {
      list = list.filter((s) => s.segmentType === typeFilter);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (s) =>
          s.name?.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [segments, typeFilter, query]);

  const totalReach = useMemo(
    () => segments.reduce((n, s) => n + (s.contactCount || 0), 0),
    [segments]
  );

  function resetBuilderValidation() {
    setErrors({});
    setConditionErrors({});
  }

  function openCreate() {
    setEditId(null);
    setForm(EMPTY_SEGMENT);
    setPreview(null);
    resetBuilderValidation();
    setBuilderOpen(true);
  }

  function openEdit(seg) {
    setEditId(seg.id);
    setForm({
      name: seg.name,
      description: seg.description || "",
      segmentType: seg.segmentType,
      filters: seg.filters?.conditions
        ? seg.filters
        : { ...EMPTY_SEGMENT.filters, ...(seg.filters || {}) },
      ownerId: seg.ownerId || "",
    });
    setPreview(null);
    resetBuilderValidation();
    setBuilderOpen(true);
  }

  function handleBlur(field, snapshot = form) {
    const message = segmentErrorFor(field, snapshot, { segments, editId });
    setErrors((prev) => {
      if (!message) {
        if (prev[field] === undefined) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      }
      return { ...prev, [field]: message };
    });
  }

  function handleConditionBlur(index, snapshot = form) {
    const cond = snapshot.filters?.conditions?.[index];
    const message = conditionValueError(cond);
    setConditionErrors((prev) => {
      if (!message) {
        if (prev[index] === undefined) return prev;
        const next = { ...prev };
        delete next[index];
        return next;
      }
      return { ...prev, [index]: message };
    });
  }

  function validateSegmentForm(snapshot = form) {
    const nextErrors = {};
    for (const field of ["name", "segmentType", "description", "filters"]) {
      const message = segmentErrorFor(field, snapshot, { segments, editId });
      if (message) nextErrors[field] = message;
    }
    const nextConditionErrors = {};
    (snapshot.filters?.conditions || []).forEach((cond, idx) => {
      const message = conditionValueError(cond);
      if (message) nextConditionErrors[idx] = message;
    });
    setErrors(nextErrors);
    setConditionErrors(nextConditionErrors);
    const valid =
      Object.keys(nextErrors).length === 0 &&
      Object.keys(nextConditionErrors).length === 0;
    if (!valid) {
      toast.error("Fix the highlighted fields before continuing.");
      requestAnimationFrame(() => {
        if (nextErrors.name) {
          document.getElementById("segment-name")?.focus();
        }
      });
    }
    return valid;
  }

  function addCondition() {
    setForm((f) => {
      const next = {
        ...f,
        filters: {
          ...f.filters,
          conditions: [
            ...(f.filters.conditions || []),
            { field: "has_email", operator: "is_true", value: "" },
          ],
        },
      };
      queueMicrotask(() => handleBlur("filters", next));
      return next;
    });
  }

  function updateCondition(index, patch) {
    setForm((f) => {
      const conditions = [...(f.filters.conditions || [])];
      conditions[index] = { ...conditions[index], ...patch };
      const next = { ...f, filters: { ...f.filters, conditions } };
      if (patch.value !== undefined || patch.operator !== undefined) {
        const merged = conditions[index];
        const message = conditionValueError(merged);
        setConditionErrors((prev) => {
          if (!message) {
            if (prev[index] === undefined) return prev;
            const cleared = { ...prev };
            delete cleared[index];
            return cleared;
          }
          return { ...prev, [index]: message };
        });
      }
      if (patch.operator === "is_true") {
        setConditionErrors((prev) => {
          if (prev[index] === undefined) return prev;
          const cleared = { ...prev };
          delete cleared[index];
          return cleared;
        });
      }
      if (patch.value !== undefined || patch.operator !== undefined) {
        queueMicrotask(() => handleBlur("filters", next));
      }
      return next;
    });
  }

  function removeCondition(index) {
    setForm((f) => {
      const next = {
        ...f,
        filters: {
          ...f.filters,
          conditions: (f.filters.conditions || []).filter((_, i) => i !== index),
        },
      };
      queueMicrotask(() => handleBlur("filters", next));
      return next;
    });
    setConditionErrors((prev) => {
      const next = {};
      Object.entries(prev).forEach(([key, message]) => {
        const i = Number(key);
        if (i < index) next[i] = message;
        else if (i > index) next[i - 1] = message;
      });
      return next;
    });
  }

  async function runFormPreview() {
    if (!validateSegmentForm()) return;
    setPreviewLoading(true);
    try {
      const data = await previewSegmentApi({
        segmentType: form.segmentType,
        filters: form.filters,
        contactIds: form.segmentType === "static" ? form.contactIds : undefined,
      });
      setPreview(data);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setPreviewLoading(false);
    }
  }

  async function runRowPreview(seg) {
    setPreviewTitle(seg.name);
    setPreviewOpen(true);
    setRowPreview(null);
    setPreviewLoading(true);
    try {
      const data = await previewSegmentApi({
        segmentType: seg.segmentType,
        filters: seg.filters,
        contactIds: seg.segmentType === "static" ? seg.contactIds : undefined,
      });
      setRowPreview(data);
    } catch (e) {
      toast.error(e.message);
      setPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  }

  async function saveSegment() {
    if (!validateSegmentForm()) return;
    setSaving(true);
    try {
      if (editId) {
        await updateSegmentApi(editId, form);
      } else {
        await createSegmentApi(form);
      }
      toast.success("Segment saved");
      setBuilderOpen(false);
      await refresh();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <MarketingAudiencesSkeleton />;

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[1680px] flex-col gap-4 pb-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <PageBreadcrumb
            items={[
              { href: "/", label: "Workspace" },
              { href: "/marketing", label: "Marketing" },
              { label: "Audiences" },
            ]}
            className="mb-2"
          />
          <h1 className="text-[26px] font-bold tracking-[-0.03em] text-neutral-900 dark:text-neutral-50">
            Audiences
          </h1>
          <p className={cn("mt-1 max-w-[58ch] text-pretty", crmType.pageDescription)}>
            Build segments from CRM filters for campaign drafts. Counts are estimates; bulk send and
            full consent tracking are not enabled in Phase 1.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <p className="text-[12px] text-muted-foreground">
            <span className="font-semibold tabular-nums text-foreground">
              {totalReach.toLocaleString()}
            </span>{" "}
            est. contacts
          </p>
          <Button
            type="button"
            className="h-9 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
            onClick={openCreate}
          >
            <Plus className="size-3.5" />
            New segment
          </Button>
        </div>
      </header>

      <Card className="overflow-hidden rounded-2xl border-neutral-200/80 py-0 shadow-sm dark:border-neutral-800">
        <CardContent className="p-0">
          <div className="border-b border-neutral-100 px-4 py-3 dark:border-neutral-800 sm:px-5">
            <div className="flex min-w-0 items-center justify-between gap-4">
              <div className="w-full min-w-[10.5rem] max-w-[11rem] shrink-0 sm:w-44">
                <CommunicationsDropdown
                  value={typeFilter}
                  onChange={setTypeFilter}
                  options={TYPE_FILTER_OPTIONS}
                  placeholder="Segment type"
                  triggerClassName="rounded-lg"
                />
              </div>
              <div className="relative w-full min-w-0 sm:w-52 sm:shrink-0">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-9 w-full rounded-lg pl-8 text-[13px]"
                  placeholder="Search segments…"
                  aria-label="Search segments"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-[13px]">
              <thead className="border-b border-neutral-100 bg-neutral-50/50 text-[11px] font-semibold text-muted-foreground dark:border-neutral-800 dark:bg-neutral-900/40">
                <tr>
                  <th className="px-4 py-2.5">Segment</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Contacts</th>
                  <th className="px-4 py-2.5">Owner</th>
                  <th className="px-4 py-2.5">Updated</th>
                  <th className="w-[7.5rem] px-4 py-2.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      {segments.length
                        ? "No segments match your filters."
                        : "No segments yet. Create one to target campaigns."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => {
                    const owner = ownerById(s.ownerId, owners);
                    return (
                      <tr
                        key={s.id}
                        className="border-b border-neutral-100 dark:border-neutral-800/80"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{s.name}</p>
                          <p className="line-clamp-1 text-[11px] text-muted-foreground">
                            {s.description || "—"}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="secondary"
                            className="h-5 border-0 px-1.5 text-[10px] font-medium capitalize"
                          >
                            {s.segmentType}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {(s.contactCount || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{owner?.name || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {s.updatedAt ? format(new Date(s.updatedAt), "MMM d, yyyy") : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="size-8 rounded-lg"
                              aria-label={`Preview ${s.name}`}
                              onClick={() => runRowPreview(s)}
                            >
                              <Eye className="size-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="size-8 rounded-lg"
                              aria-label={`Edit ${s.name}`}
                              onClick={() => openEdit(s)}
                            >
                              <SquarePen className="size-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="size-8 rounded-lg"
                              aria-label={`Use ${s.name} in campaign`}
                              onClick={() =>
                                openCampaignWizard({ segmentId: s.id })
                              }
                            >
                              <Megaphone className="size-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Sheet
        open={builderOpen}
        onOpenChange={(open) => {
          setBuilderOpen(open);
          if (!open) resetBuilderValidation();
        }}
      >
        <SheetContent
          title={editId ? "Edit segment" : "New segment"}
          description="Define filters and save a reusable audience for campaigns."
          onClose={() => setBuilderOpen(false)}
          maxWidth={420}
          className="overflow-hidden"
        >
          <SheetBody className="space-y-4">
            <SegmentBuilderFields
              form={form}
              setForm={setForm}
              owners={owners}
              errors={errors}
              conditionErrors={conditionErrors}
              onBlurField={handleBlur}
              onConditionBlur={handleConditionBlur}
              onAddCondition={addCondition}
              onUpdateCondition={updateCondition}
              onRemoveCondition={removeCondition}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-lg"
              disabled={previewLoading}
              onClick={runFormPreview}
            >
              {previewLoading ? "Loading…" : "Preview matching contacts"}
            </Button>
            {previewLoading && !preview ? <PreviewResultsSkeleton /> : null}
            {preview ? <PreviewResultsCard preview={preview} /> : null}
          </SheetBody>
          <SheetFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setBuilderOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-primary-600 text-white hover:bg-primary-700"
              disabled={saving}
              onClick={saveSegment}
            >
              {saving ? "Saving…" : "Save segment"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent
          title={previewTitle || "Audience preview"}
          description="Estimated matching contacts for this segment."
          onClose={() => setPreviewOpen(false)}
          maxWidth={440}
          className="flex min-h-0 max-h-[min(90vh,640px)] flex-col"
        >
          <DialogBody className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {previewLoading ? (
              <PreviewResultsSkeleton />
            ) : rowPreview ? (
              <PreviewResultsCard preview={rowPreview} />
            ) : null}
          </DialogBody>
          <DialogFooter className="shrink-0">
            <Button type="button" variant="outline" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SegmentConditionCard({
  index,
  condition,
  fieldOptions,
  operatorOptions,
  error,
  onUpdate,
  onRemove,
  onValueBlur,
}) {
  const valueDisabled = VALUELESS_OPERATORS.has(condition.operator);

  return (
    <article
      className={cn(
        "space-y-3 rounded-xl border p-3",
        error
          ? "border-destructive/50 bg-destructive/[0.04] dark:border-destructive/40"
          : "border-neutral-200/80 bg-neutral-50/50 dark:border-neutral-800 dark:bg-neutral-900/30"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          Condition {index + 1}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
          aria-label={`Remove condition ${index + 1}`}
          onClick={onRemove}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
      <Field label="Field">
        <FormFieldDropdown
          value={condition.field || ""}
          onChange={(v) => onUpdate({ field: v })}
          options={fieldOptions}
          placeholder="Choose field"
          triggerClassName="mt-0 h-9 rounded-lg text-[13px]"
        />
      </Field>
      <Field label="Operator">
        <FormFieldDropdown
          value={condition.operator || ""}
          onChange={(v) => onUpdate({ operator: v })}
          options={operatorOptions}
          placeholder="Choose operator"
          triggerClassName="mt-0 h-9 rounded-lg text-[13px]"
        />
      </Field>
      {valueDisabled ? (
        <p className="text-[12px] text-muted-foreground">No value needed for this operator.</p>
      ) : (
        <Field label="Value" error={error}>
          <Input
            className="h-9 w-full rounded-lg"
            value={condition.value || ""}
            required
            aria-required
            onChange={(e) => onUpdate({ value: e.target.value })}
            onBlur={onValueBlur}
            aria-invalid={Boolean(error)}
            placeholder={conditionValuePlaceholder(condition)}
          />
        </Field>
      )}
    </article>
  );
}

function SegmentBuilderFields({
  form,
  setForm,
  owners,
  errors = {},
  conditionErrors = {},
  onBlurField,
  onConditionBlur,
  onAddCondition,
  onUpdateCondition,
  onRemoveCondition,
}) {
  const segmentFieldOptions = useMemo(
    () => SEGMENT_FILTER_FIELDS.map((f) => ({ value: f.id, label: f.label })),
    []
  );

  const operatorOptions = useMemo(
    () => FILTER_OPERATORS.map((o) => ({ value: o.id, label: o.label })),
    []
  );

  const ownerOptions = useMemo(
    () => [
      { value: "", label: "Unassigned", searchText: "unassigned none" },
      ...owners.map((o) => ({
        value: String(o.id),
        label: o.name || "Member",
        searchText: `${o.name || ""} ${o.email || ""}`.trim(),
      })),
    ],
    [owners]
  );

  return (
    <div className="space-y-4">
      <Field label="Segment name" htmlFor="segment-name" required error={errors.name}>
        <Input
          id="segment-name"
          required
          aria-required="true"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          onBlur={() => onBlurField?.("name")}
          aria-invalid={Boolean(errors.name)}
          placeholder="e.g. Newsletter subscribers"
          className="h-9 w-full rounded-lg"
        />
      </Field>
      <Field label="Type" required error={errors.segmentType}>
        <Select
          value={form.segmentType}
          onValueChange={(v) => {
            const next = { ...form, segmentType: v };
            setForm(next);
            onBlurField?.("segmentType", next);
            onBlurField?.("filters", next);
          }}
        >
          <SelectTrigger
            className="h-9 w-full rounded-lg"
            aria-invalid={Boolean(errors.segmentType)}
          >
            <SelectValue placeholder="Select segment type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dynamic">Dynamic</SelectItem>
            <SelectItem value="static">Static</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field label="Description" error={errors.description}>
        <Textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          onBlur={() => onBlurField?.("description")}
          aria-invalid={Boolean(errors.description)}
          placeholder="Optional notes for your team…"
          className="min-h-[72px] rounded-lg"
        />
      </Field>
      <Field label="Owner">
        <FormFieldDropdown
          value={form.ownerId || ""}
          onChange={(v) => setForm({ ...form, ownerId: v || "" })}
          options={ownerOptions}
          searchable
          searchPlaceholder="Search team…"
          placeholder="Optional — select owner"
          emptyLabel="No team members found"
          triggerClassName="mt-0 h-9 rounded-lg text-[13px]"
        />
      </Field>
      {form.segmentType === "dynamic" ? (
        <div className="space-y-3 rounded-xl border border-neutral-200/80 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950/40">
          <div className="flex flex-col gap-1">
            <Label className={cn("gap-1", crmType.fieldLabel)}>
              <span className="text-error-text" aria-hidden="true">
                *
              </span>
              Filter conditions
              <span className="sr-only">(required)</span>
            </Label>
            <p className="text-[12px] leading-relaxed text-muted-foreground">
              Contacts must match these rules. Use match logic to require all conditions or any one.
            </p>
          </div>
          <Field label="Match logic">
            <Select
              value={form.filters.logic || "and"}
              onValueChange={(v) =>
                setForm({ ...form, filters: { ...form.filters, logic: v } })
              }
            >
              <SelectTrigger className="h-9 w-full rounded-lg">
                <SelectValue placeholder="How conditions combine" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="and">Match all (AND)</SelectItem>
                <SelectItem value="or">Match any (OR)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          {errors.filters ? <FieldError message={errors.filters} /> : null}
          {(form.filters.conditions || []).length === 0 ? (
            <p className="rounded-lg border border-dashed border-neutral-200/80 px-3 py-4 text-center text-[12px] text-muted-foreground dark:border-neutral-800">
              No conditions yet. Add at least one rule to define this audience.
            </p>
          ) : (
            <ul className="space-y-2">
              {(form.filters.conditions || []).map((cond, idx) => (
                <li key={idx}>
                  <SegmentConditionCard
                    index={idx}
                    condition={cond}
                    fieldOptions={segmentFieldOptions}
                    operatorOptions={operatorOptions}
                    error={conditionErrors[idx]}
                    onUpdate={(patch) => onUpdateCondition(idx, patch)}
                    onRemove={() => onRemoveCondition(idx)}
                    onValueBlur={() => onConditionBlur?.(idx)}
                  />
                </li>
              ))}
            </ul>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 w-full rounded-lg"
            onClick={onAddCondition}
          >
            <Plus className="size-3.5" />
            Add condition
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function PreviewResultsCard({ preview }) {
  return (
    <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
      <div className="flex items-center gap-2">
        <Users className="size-4 text-primary-600" aria-hidden />
        <p className="text-[13px] font-semibold">
          ~{preview.count?.toLocaleString() ?? 0} matching contacts
        </p>
      </div>
      {preview.consentMissingWarning ? (
        <p className="mt-2 text-[12px] text-amber-800 dark:text-amber-200">
          Review marketing consent before future sends.
        </p>
      ) : null}
      {preview.preview?.length ? (
        <ul className="mt-2 space-y-1 border-t border-neutral-200/80 pt-2 pr-1 dark:border-neutral-700">
          {preview.preview.map((r) => (
            <li key={r.id} className="text-[12px] text-muted-foreground">
              <span className="font-medium text-foreground">{r.name}</span>
              {r.email ? ` · ${r.email}` : ""}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function Field({ label, children, error, required = false, htmlFor }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className={cn("gap-1", crmType.fieldLabel)}>
        {required ? (
          <span className="text-error-text" aria-hidden="true">
            *
          </span>
        ) : null}
        {label}
        {required ? <span className="sr-only">(required)</span> : null}
      </Label>
      {children}
      <FieldError message={error} />
    </div>
  );
}
