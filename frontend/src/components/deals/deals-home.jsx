"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import {
  CrmEmptyState,
  CrmPageHeader,
  CrmSkeleton,
  displayName,
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

const EMPTY = {
  name: "",
  amount: "",
  currency: "USD",
  stage_id: "",
  company_id: "",
  contact_id: "",
  expected_close_date: "",
  status: "open",
};

function formatMoney(amount, currency = "USD") {
  const value = Number(amount || 0);
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `$${value.toLocaleString("en-US")}`;
  }
}

function DealFormDrawer({
  open,
  onOpenChange,
  onSaved,
  ownerId,
  companies,
  contacts,
  stages,
}) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      ...EMPTY,
      stage_id: stages[0]?.id || "",
    });
    setErrors({});
  }, [open, stages]);

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const next = {};
    if (!form.name.trim()) next.name = "Deal name is required";
    if (form.amount !== "" && Number.isNaN(Number(form.amount))) {
      next.amount = "Enter a valid amount";
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        amount: Number(form.amount || 0),
        currency: form.currency || "USD",
        stage_id: emptyToNull(form.stage_id),
        company_id: emptyToNull(form.company_id),
        contact_id: emptyToNull(form.contact_id),
        expected_close_date: emptyToNull(form.expected_close_date),
        status: form.status || "open",
        owner_id: ownerId || null,
      };
      const result = await apiFetch("/api/deals", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast.success("Deal created");
      onSaved?.(result.data);
      onOpenChange?.(false);
    } catch (error) {
      toast.error(error.message || "Could not create deal");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title="Create Deal"
        description="Add an opportunity to your sales pipeline."
        onClose={() => onOpenChange?.(false)}
      >
        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <SheetBody className="space-y-4">
            <div>
              <Label htmlFor="deal-name">Deal name</Label>
              <Input
                id="deal-name"
                className="mt-1.5"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Acme Enterprise Expansion"
              />
              <FieldError message={errors.name} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="deal-amount">Amount</Label>
                <Input
                  id="deal-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  className="mt-1.5"
                  value={form.amount}
                  onChange={(e) => update("amount", e.target.value)}
                  placeholder="25000"
                />
                <FieldError message={errors.amount} />
              </div>
              <div>
                <Label>Currency</Label>
                <Select
                  value={form.currency}
                  onValueChange={(value) => update("currency", value)}
                >
                  <SelectTrigger className="mt-1.5 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["USD", "EUR", "GBP", "INR"].map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Pipeline stage</Label>
              <Select
                value={form.stage_id || undefined}
                onValueChange={(value) => update("stage_id", value)}
              >
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Company</Label>
              <Select
                value={form.company_id || undefined}
                onValueChange={(value) => update("company_id", value)}
              >
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue placeholder="Select company (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Primary contact</Label>
              <Select
                value={form.contact_id || undefined}
                onValueChange={(value) => update("contact_id", value)}
              >
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue placeholder="Select contact (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {displayName(contact)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="deal-close">Expected close date</Label>
              <Input
                id="deal-close"
                type="date"
                className="mt-1.5"
                value={form.expected_close_date}
                onChange={(e) => update("expected_close_date", e.target.value)}
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
              {saving ? "Saving…" : "Create deal"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export function DealsHome() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [rows, setRows] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [stages, setStages] = useState([]);
  const [ownerId, setOwnerId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  const companyMap = Object.fromEntries(
    companies.map((company) => [company.id, company.name])
  );
  const stageMap = Object.fromEntries(
    stages.map((stage) => [stage.id, stage.name])
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setStatus("loading");
      try {
        const [ws, list, companyList, contactList, stageList] =
          await Promise.all([
            apiFetch("/api/workspace"),
            apiFetch("/api/deals?order_by=created_at&limit=200"),
            apiFetch("/api/companies?order_by=name&limit=200"),
            apiFetch("/api/contacts?order_by=created_at&limit=200"),
            apiFetch("/api/pipeline-stages?order_by=position&limit=50"),
          ]);
        if (cancelled) return;
        setOwnerId(ws.user?.id || null);
        setRows(list.data || []);
        setCompanies(companyList.data || []);
        setContacts(contactList.data || []);
        setStages(stageList.data || []);
        setStatus("ready");
      } catch (error) {
        if (!cancelled) {
          toast.error(error.message || "Could not load deals");
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

  const focusDealId = searchParams.get("deal");

  useEffect(() => {
    if (status !== "ready" || !focusDealId) return;
    const row = document.getElementById(`deal-row-${focusDealId}`);
    if (!row) return;
    row.scrollIntoView({ block: "center", behavior: "smooth" });
    row.classList.add("bg-primary-50/80", "dark:bg-primary-950/40");
    const timer = window.setTimeout(() => {
      row.classList.remove("bg-primary-50/80", "dark:bg-primary-950/40");
    }, 3200);
    return () => window.clearTimeout(timer);
  }, [status, focusDealId, rows]);

  function openCreate() {
    setFormOpen(true);
    router.replace("/deals?action=create", { scroll: false });
  }

  function closeCreate(open) {
    setFormOpen(open);
    if (!open) router.replace("/deals", { scroll: false });
  }

  if (status === "loading") return <CrmSkeleton />;

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5">
      <CrmPageHeader
        crumb="Deals"
        title="Deals"
        description="Track opportunities across pipeline stages."
        actionLabel={
          <>
            <Plus className="size-3.5" />
            Create Deal
          </>
        }
        onAction={openCreate}
      />

      {rows.length === 0 ? (
        <CrmEmptyState
          title="No deals yet"
          description="Create your first opportunity to start tracking pipeline value."
          actionLabel="Create Deal"
          onAction={openCreate}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-950">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="px-4">Deal</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead className="hidden md:table-cell">Company</TableHead>
                <TableHead className="hidden lg:table-cell">Close date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.id}
                  id={`deal-row-${row.id}`}
                  className={
                    focusDealId === row.id
                      ? "bg-primary-50/80 dark:bg-primary-950/40"
                      : undefined
                  }
                >
                  <TableCell className="px-4 py-3 font-semibold">
                    {row.name}
                  </TableCell>
                  <TableCell>
                    {formatMoney(row.amount, row.currency || "USD")}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {stageMap[row.stage_id] || "—"}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {companyMap[row.company_id] || "—"}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {row.expected_close_date || "—"}
                  </TableCell>
                  <TableCell className="capitalize text-muted-foreground">
                    {row.status || "open"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <DealFormDrawer
        open={formOpen}
        onOpenChange={closeCreate}
        ownerId={ownerId}
        companies={companies}
        contacts={contacts}
        stages={stages}
        onSaved={(row) => setRows((prev) => [row, ...prev])}
      />
    </div>
  );
}
