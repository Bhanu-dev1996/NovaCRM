"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Copy, Plus, Search, SquarePen, Trash2, TriangleAlert, X } from "lucide-react";
import { toast } from "sonner";

import {
  TEMPLATE_CATEGORIES,
  TEMPLATE_VARIABLES,
  applyTemplateVariables,
} from "@/components/communications/communications-data";
import {
  createTemplateApi,
  deleteTemplateApi,
  fetchCommunicationsState,
  updateTemplateApi,
} from "@/components/communications/communications-api";
import { apiFetch } from "@/lib/api";
import { CommSkeletonBlock } from "@/components/communications/communications-skeleton-shared";
import { CommunicationsDropdown } from "@/components/communications/communications-dropdown-field";
import { CommunicationsMessageEditor } from "@/components/communications/communications-message-editor";
import { CrmEmptyState } from "@/components/crm/crm-shared";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { crmType } from "@/lib/crm-typography";
import { cn } from "@/lib/utils";

const EMPTY = {
  id: "",
  name: "",
  category: "Follow-up",
  subject: "",
  body: "",
  visibility: "workspace",
};

const PREVIEW_CTX = {
  firstName: "Alex",
  lastName: "Morgan",
  companyName: "Vertex.io",
  dealName: "Platform expansion",
  dealValue: "$48,000",
  ownerName: "Jordan Lee",
};

function TemplateListRowSkeleton({ active = false }) {
  return (
    <div
      className={cn(
        "flex w-full flex-col gap-1 rounded-xl border border-transparent px-3 py-2.5",
        active && "border-primary-200/80 bg-primary-50/50 dark:border-primary-900 dark:bg-primary-950/40"
      )}
    >
      <CommSkeletonBlock className="h-3.5 w-36 max-w-full rounded-md" />
      <CommSkeletonBlock className="h-3 w-24 rounded-md" />
      <CommSkeletonBlock className="h-3 w-full max-w-[180px] rounded-md" />
    </div>
  );
}

export function CommunicationsTemplatesSkeleton() {
  return (
    <div
      className="mx-auto flex w-full min-w-0 max-w-[1680px] flex-col gap-4"
      aria-busy="true"
      aria-label="Loading templates"
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <CommSkeletonBlock className="h-3 w-52 rounded-md" />
          <CommSkeletonBlock className="h-8 w-44 rounded-lg" />
          <CommSkeletonBlock className="h-4 w-full max-w-md rounded-md" />
        </div>
        <CommSkeletonBlock className="h-9 w-32 rounded-lg" />
      </header>

      <Card className="overflow-hidden rounded-2xl border-neutral-200/80 py-0 shadow-sm dark:border-neutral-800">
        <CardContent className="grid h-[min(720px,calc(100vh-12rem))] min-h-[480px] grid-cols-1 gap-0 p-0 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
          <section className="flex min-h-0 flex-col border-b border-neutral-100 dark:border-neutral-800 lg:border-r lg:border-b-0">
            <div className="space-y-3 border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
              <CommSkeletonBlock className="h-9 w-full rounded-lg" />
              <CommSkeletonBlock className="h-9 w-full rounded-lg" />
            </div>
            <ul className="min-h-0 flex-1 space-y-1 overflow-hidden px-2 py-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <li key={i}>
                  <TemplateListRowSkeleton active={i === 0} />
                </li>
              ))}
            </ul>
          </section>
          <section className="flex min-h-0 flex-col bg-white dark:bg-neutral-950">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
              <div className="min-w-0 space-y-1.5">
                <CommSkeletonBlock className="h-4 w-40 rounded-md" />
                <CommSkeletonBlock className="h-3 w-28 rounded-md" />
              </div>
              <CommSkeletonBlock className="h-8 w-24 rounded-lg" />
            </div>
            <div className="min-h-0 flex-1 space-y-3 overflow-hidden px-4 py-4">
              <CommSkeletonBlock className="h-16 w-full rounded-xl" />
              <CommSkeletonBlock className="h-48 w-full rounded-xl" />
            </div>
            <div className="border-t border-neutral-100 px-4 py-3 dark:border-neutral-800">
              <CommSkeletonBlock className="mb-2 h-3 w-24 rounded-md" />
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <CommSkeletonBlock key={i} className="h-6 w-28 rounded-md" />
                ))}
              </div>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

export function CommunicationsTemplatesHome() {
  const [status, setStatus] = useState("loading");
  const [templates, setTemplates] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [previewSample, setPreviewSample] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [workspaceRole, setWorkspaceRole] = useState("member");
  const [commPermissions, setCommPermissions] = useState(null);
  const [insertTarget, setInsertTarget] = useState("body");

  const canManageTemplates = useMemo(() => {
    const level = commPermissions?.manageTemplates || "admins";
    if (level === "admins") return ["owner", "admin"].includes(workspaceRole);
    if (level === "sales_team") {
      return ["owner", "admin", "member"].includes(workspaceRole);
    }
    return true;
  }, [commPermissions, workspaceRole]);

  const reload = useCallback(() => {
    setStatus("loading");
    return Promise.all([
      fetchCommunicationsState(),
      apiFetch("/api/workspace").catch(() => ({ role: "member" })),
    ])
      .then(([data, ws]) => {
        setTemplates(data.templates || []);
        setCommPermissions(data.settings?.permissions || {});
        setWorkspaceRole(ws.role || "member");
        setStatus("ready");
      })
      .catch((error) => {
        toast.error(error.message || "Could not load templates");
        setStatus("ready");
      });
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return templates.filter((t) => {
      if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        t.name?.toLowerCase().includes(q) ||
        t.subject?.toLowerCase().includes(q) ||
        t.body?.toLowerCase().includes(q)
      );
    });
  }, [templates, search, categoryFilter]);

  const selected = useMemo(
    () => filtered.find((t) => t.id === selectedId) || filtered[0] || null,
    [filtered, selectedId]
  );

  useEffect(() => {
    if (filtered.length && !filtered.some((t) => t.id === selectedId)) {
      setSelectedId(filtered[0].id);
    }
    if (!filtered.length) setSelectedId(null);
  }, [filtered, selectedId]);

  function insertVariable(token) {
    setEditing((p) => ({
      ...p,
      [insertTarget]: `${p[insertTarget] || ""}${p[insertTarget] ? " " : ""}${token}`,
    }));
  }

  function openCreate() {
    if (!canManageTemplates) {
      toast.error("You do not have permission to create templates");
      return;
    }
    setEditing({ ...EMPTY });
    setFormOpen(true);
  }

  function openEdit(tpl) {
    setEditing({ ...tpl });
    setFormOpen(true);
  }

  async function saveTemplate() {
    if (!editing.name.trim() || !editing.subject.trim() || !editing.body.trim()) {
      toast.error("Name, subject, and body are required");
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: editing.name.trim(),
        category: editing.category,
        subject: editing.subject.trim(),
        body: editing.body.trim(),
        visibility: editing.visibility,
      };
      if (editing.id) {
        await updateTemplateApi(editing.id, body);
      } else {
        const created = await createTemplateApi(body);
        setSelectedId(created.id);
      }
      setFormOpen(false);
      toast.success("Template saved");
      await reload();
    } catch (error) {
      toast.error(error.message || "Could not save template");
    } finally {
      setSaving(false);
    }
  }

  async function duplicate(tpl) {
    try {
      const created = await createTemplateApi({
        name: `${tpl.name} (copy)`,
        category: tpl.category,
        subject: tpl.subject,
        body: tpl.body,
        visibility: tpl.visibility,
      });
      setSelectedId(created.id);
      toast.success("Template duplicated");
      await reload();
    } catch (error) {
      toast.error(error.message || "Could not duplicate template");
    }
  }

  const deleteTarget = useMemo(
    () => templates.find((t) => t.id === deleteId) || null,
    [deleteId, templates]
  );

  async function removeTemplate() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteTemplateApi(deleteId);
      setDeleteId(null);
      toast.success("Template deleted");
      await reload();
    } catch (error) {
      toast.error(error.message || "Could not delete template");
    } finally {
      setDeleting(false);
    }
  }

  const isEditingExisting =
    editing.id && templates.some((t) => t.id === editing.id);

  const displaySubject = selected
    ? previewSample
      ? applyTemplateVariables(selected.subject, PREVIEW_CTX)
      : selected.subject
    : "";
  const displayBody = selected
    ? previewSample
      ? applyTemplateVariables(selected.body, PREVIEW_CTX)
      : selected.body
    : "";

  if (status === "loading" && !templates.length) {
    return <CommunicationsTemplatesSkeleton />;
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[1680px] flex-col gap-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <PageBreadcrumb
            items={[
              { href: "/", label: "Workspace" },
              { href: "/communications", label: "Communications" },
              { label: "Templates" },
            ]}
            className="mb-2"
          />
          <h1 className="text-[26px] font-bold tracking-[-0.03em] text-neutral-900 dark:text-neutral-50">
            Message templates
          </h1>
          <p
            className={cn(
              "mt-1 truncate whitespace-nowrap",
              crmType.pageDescription
            )}
            title="Select a template, preview it here, and use it when composing in the inbox."
          >
            Select a template, preview it here, and use it when composing in the inbox.
          </p>
        </div>
        {canManageTemplates ? (
          <Button
            type="button"
            className="h-9 shrink-0 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
            onClick={openCreate}
          >
            <Plus className="size-3.5" />
            New template
          </Button>
        ) : null}
      </header>

      <Card className="overflow-hidden rounded-2xl border-neutral-200/80 py-0 shadow-sm dark:border-neutral-800">
        <CardContent className="grid h-[min(720px,calc(100vh-12rem))] min-h-[480px] grid-cols-1 gap-0 p-0 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
          {/* List */}
          <section className="flex min-h-0 flex-col border-b border-neutral-100 dark:border-neutral-800 lg:border-r lg:border-b-0">
            <div className="space-y-3 border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-9 rounded-lg pl-8 text-[13px]"
                  placeholder="Search…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <CommunicationsDropdown
                value={categoryFilter}
                onChange={setCategoryFilter}
                triggerClassName="h-9 w-full rounded-lg"
                options={[
                  { value: "all", label: "All categories" },
                  ...TEMPLATE_CATEGORIES.map((c) => ({ value: c, label: c })),
                ]}
              />
            </div>
            <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 py-2">
              {filtered.length === 0 ? (
                <li className="p-4">
                  <CrmEmptyState
                    title={templates.length ? "No matches" : "No templates"}
                    description={
                      templates.length
                        ? "Change search or category."
                        : "Create a template to get started."
                    }
                    actionLabel={templates.length ? undefined : "New template"}
                    onAction={templates.length ? undefined : openCreate}
                  />
                </li>
              ) : (
                filtered.map((tpl) => {
                  const active = selected?.id === tpl.id;
                  return (
                    <li key={tpl.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(tpl.id)}
                        className={cn(
                          "flex w-full flex-col gap-1 rounded-xl border border-transparent px-3 py-2.5 text-left transition-colors",
                          active
                            ? "border-primary-200/80 bg-primary-50 shadow-sm dark:border-primary-900 dark:bg-primary-950/50"
                            : "hover:bg-neutral-50 dark:hover:bg-neutral-900/50"
                        )}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-[13px] font-semibold">{tpl.name}</span>
                          <Badge
                            variant="outline"
                            className="h-5 shrink-0 rounded-md px-1.5 text-[9px] font-medium"
                          >
                            {tpl.visibility}
                          </Badge>
                        </span>
                        <span className="truncate text-[12px] text-muted-foreground">
                          {tpl.subject}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {tpl.category}
                          {tpl.updatedAt
                            ? ` · ${format(new Date(tpl.updatedAt), "MMM d")}`
                            : ""}
                        </span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </section>

          {/* Detail */}
          <section className="flex min-h-0 flex-col bg-white dark:bg-neutral-950">
            {selected ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
                  <div className="min-w-0">
                    <h2 className="truncate text-[15px] font-semibold">{selected.name}</h2>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                      {selected.category} · {selected.visibility}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <label className="mr-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Switch
                        checked={previewSample}
                        onCheckedChange={setPreviewSample}
                        aria-label="Preview with sample merge data"
                      />
                      Sample data
                    </label>
                    {canManageTemplates ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => openEdit(selected)}
                        >
                          <SquarePen className="size-3.5" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => duplicate(selected)}
                        >
                          <Copy className="size-3.5" />
                          Duplicate
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-destructive"
                          onClick={() => setDeleteId(selected.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                  <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/50 px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-900/30">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Subject
                    </p>
                    <p className="mt-1 text-[13px] font-medium text-foreground">{displaySubject}</p>
                  </div>
                  <div className="mt-3 rounded-xl border border-neutral-200/80 px-3 py-3 dark:border-neutral-800">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Body
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">
                      {displayBody}
                    </p>
                  </div>
                </div>
                <div className="border-t border-neutral-100 px-4 py-2.5 dark:border-neutral-800">
                  <p className="mb-1.5 text-[10px] font-medium text-muted-foreground">
                    Merge variables
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {TEMPLATE_VARIABLES.map((v) => (
                      <button
                        key={v}
                        type="button"
                        className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground hover:bg-primary-50 dark:hover:bg-primary-950/40"
                        onClick={() => {
                          navigator.clipboard?.writeText(v);
                          toast.message(`Copied ${v}`);
                        }}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center p-8 text-center text-[13px] text-muted-foreground">
                Select a template from the list, or create a new one.
              </div>
            )}
          </section>
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent
          title={isEditingExisting ? "Edit template" : "New template"}
          onClose={() => setFormOpen(false)}
          maxWidth={560}
        >
          <DialogBody className="max-h-[65vh] space-y-3 overflow-y-auto">
            <FormField label="Name" required>
              <Input
                className="h-9 rounded-lg"
                value={editing.name}
                onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))}
              />
            </FormField>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Category" required>
                <CommunicationsDropdown
                  value={editing.category}
                  onChange={(v) => setEditing((p) => ({ ...p, category: v }))}
                  triggerClassName="rounded-lg"
                  options={TEMPLATE_CATEGORIES.map((c) => ({ value: c, label: c }))}
                />
              </FormField>
              <FormField label="Visibility" required>
                <CommunicationsDropdown
                  value={editing.visibility}
                  onChange={(v) => setEditing((p) => ({ ...p, visibility: v }))}
                  triggerClassName="rounded-lg"
                  options={[
                    { value: "workspace", label: "Workspace" },
                    { value: "private", label: "Private" },
                  ]}
                />
              </FormField>
            </div>
            <FormField label="Subject" required>
              <Input
                className="h-9 rounded-lg"
                value={editing.subject}
                onFocus={() => setInsertTarget("subject")}
                onChange={(e) => setEditing((p) => ({ ...p, subject: e.target.value }))}
              />
            </FormField>
            <FormField label="Body" required>
              <div onFocus={() => setInsertTarget("body")}>
                <CommunicationsMessageEditor
                  value={editing.body}
                  onChange={(v) => setEditing((p) => ({ ...p, body: v }))}
                  minHeight={200}
                  placeholder="Template body — supports bold, lists, and links"
                />
              </div>
            </FormField>
            <div>
              <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">
                Insert variable into {insertTarget === "subject" ? "subject" : "body"}
              </p>
              <div className="flex flex-wrap gap-1">
                {TEMPLATE_VARIABLES.map((v) => (
                  <button
                    key={v}
                    type="button"
                    className="rounded-md border border-neutral-200/80 bg-neutral-50 px-1.5 py-0.5 font-mono text-[10px] hover:border-primary-200 hover:bg-primary-50 dark:border-neutral-800 dark:bg-neutral-900"
                    onClick={() => insertVariable(v)}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-primary-600 text-white hover:bg-primary-700"
              disabled={saving}
              onClick={saveTemplate}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteId(null);
        }}
      >
        <DialogContent maxWidth={440}>
          <DialogBody className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive ring-1 ring-destructive/15">
                <TriangleAlert className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <h2 className={crmType.dialogTitle}>Delete template?</h2>
                <p className={cn("mt-1", crmType.dialogDescription)}>
                  This action cannot be undone.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="-mr-1 -mt-1 size-8 shrink-0"
                aria-label="Close"
                disabled={deleting}
                onClick={() => setDeleteId(null)}
              >
                <X className="size-4" />
              </Button>
            </div>
            <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/80 px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-900/40">
              <p className="text-[13px] font-semibold text-foreground">
                {deleteTarget?.name || "Template"}
              </p>
              {deleteTarget?.subject ? (
                <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                  {deleteTarget.subject}
                </p>
              ) : null}
              <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
                The template will be removed for your entire workspace. Messages already sent are
                not affected.
              </p>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={deleting}
              onClick={() => setDeleteId(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={removeTemplate}
            >
              {deleting ? "Deleting…" : "Delete template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FormField({ label, required, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="gap-1 text-[13px]">
        {required ? (
          <span className="text-error-text" aria-hidden>
            *
          </span>
        ) : null}
        {label}
      </Label>
      {children}
    </div>
  );
}
