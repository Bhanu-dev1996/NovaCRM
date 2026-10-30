"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, Plus } from "lucide-react";
import { toast } from "sonner";

import {
  CrmEmptyState,
  CrmPageHeader,
  CrmSkeleton,
  emptyToNull,
  FieldError,
} from "@/components/crm/crm-shared";
import { Button } from "@/components/ui/button";
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

const INDUSTRIES = [
  "Software / SaaS",
  "Financial Services",
  "Healthcare",
  "Retail",
  "Manufacturing",
  "Other",
];

const SIZES = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1001+"];

const EMPTY = {
  name: "",
  domain: "",
  website: "",
  industry: "",
  size: "",
  phone: "",
};

function CompanyFormDrawer({ open, onOpenChange, onSaved, ownerId }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(EMPTY);
    setErrors({});
  }, [open]);

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.name.trim()) {
      setErrors({ name: "Company name is required" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        domain: emptyToNull(form.domain),
        website: emptyToNull(form.website),
        industry: emptyToNull(form.industry),
        size: emptyToNull(form.size),
        phone: emptyToNull(form.phone),
        owner_id: ownerId || null,
      };
      const result = await apiFetch("/api/companies", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast.success("Company created");
      onSaved?.(result.data);
      onOpenChange?.(false);
    } catch (error) {
      toast.error(error.message || "Could not create company");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title="Add Company"
        description="Create a company account in this workspace."
        onClose={() => onOpenChange?.(false)}
      >
        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <SheetBody className="space-y-4">
            <div>
              <Label htmlFor="company-name">Company name</Label>
              <Input
                id="company-name"
                className="mt-1.5"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Acme Corp"
              />
              <FieldError message={errors.name} />
            </div>
            <div>
              <Label htmlFor="company-domain">Domain</Label>
              <Input
                id="company-domain"
                className="mt-1.5"
                value={form.domain}
                onChange={(e) => update("domain", e.target.value)}
                placeholder="acme.com"
              />
            </div>
            <div>
              <Label htmlFor="company-website">Website</Label>
              <Input
                id="company-website"
                type="url"
                className="mt-1.5"
                value={form.website}
                onChange={(e) => update("website", e.target.value)}
                placeholder="https://acme.com"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Industry</Label>
                <Select
                  value={form.industry || undefined}
                  onValueChange={(value) => update("industry", value)}
                >
                  <SelectTrigger className="mt-1.5 w-full">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Company size</Label>
                <Select
                  value={form.size || undefined}
                  onValueChange={(value) => update("size", value)}
                >
                  <SelectTrigger className="mt-1.5 w-full">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {SIZES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="company-phone">Phone</Label>
              <Input
                id="company-phone"
                className="mt-1.5"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="+1 555 0100"
              />
            </div>
          </SheetBody>
          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange?.(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Create company"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export function CompaniesHome() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [rows, setRows] = useState([]);
  const [ownerId, setOwnerId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setStatus("loading");
      try {
        const [ws, list] = await Promise.all([
          apiFetch("/api/workspace"),
          apiFetch("/api/companies?order_by=created_at&limit=200"),
        ]);
        if (cancelled) return;
        setOwnerId(ws.user?.id || null);
        setRows(list.data || []);
        setStatus("ready");
      } catch (error) {
        if (!cancelled) {
          toast.error(error.message || "Could not load companies");
          setStatus("error");
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (searchParams.get("action") === "create") setFormOpen(true);
  }, [searchParams]);

  function openCreate() {
    setFormOpen(true);
    router.replace("/companies?action=create", { scroll: false });
  }

  function closeCreate(open) {
    setFormOpen(open);
    if (!open) router.replace("/companies", { scroll: false });
  }

  if (status === "loading") return <CrmSkeleton />;

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5">
      <CrmPageHeader
        crumb="Companies"
        title="Companies"
        description="Manage accounts and organizations linked to your pipeline."
        actionLabel={
          <>
            <Plus className="size-3.5" />
            Add Company
          </>
        }
        onAction={openCreate}
      />

      {rows.length === 0 ? (
        <CrmEmptyState
          title="No companies yet"
          description="Add your first company to start linking contacts and deals."
          actionLabel="Add Company"
          onAction={openCreate}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-950">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="px-4">Company</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead className="hidden md:table-cell">Size</TableHead>
                <TableHead className="hidden lg:table-cell">Website</TableHead>
                <TableHead className="hidden sm:table-cell">Phone</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Building2 className="size-3.5" />
                      </span>
                      <span>
                        <span className="block font-semibold">{row.name}</span>
                        <span className="block text-[12px] text-muted-foreground">
                          {row.domain || "—"}
                        </span>
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.industry || "—"}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {row.size || "—"}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {row.website || "—"}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {row.phone || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CompanyFormDrawer
        open={formOpen}
        onOpenChange={closeCreate}
        ownerId={ownerId}
        onSaved={(row) => setRows((prev) => [row, ...prev])}
      />
    </div>
  );
}
