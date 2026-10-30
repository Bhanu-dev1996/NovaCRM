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
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  title: "",
  company_id: "",
};

function ContactFormDrawer({
  open,
  onOpenChange,
  onSaved,
  ownerId,
  companies,
}) {
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
    const next = {};
    if (!form.first_name.trim()) next.first_name = "First name is required";
    if (!form.last_name.trim()) next.last_name = "Last name is required";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = "Enter a valid email";
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: emptyToNull(form.email),
        phone: emptyToNull(form.phone),
        title: emptyToNull(form.title),
        company_id: emptyToNull(form.company_id),
        owner_id: ownerId || null,
      };
      const result = await apiFetch("/api/contacts", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast.success("Contact created");
      onSaved?.(result.data);
      onOpenChange?.(false);
    } catch (error) {
      toast.error(error.message || "Could not create contact");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title="Add Contact"
        description="Create a person linked to your workspace."
        onClose={() => onOpenChange?.(false)}
      >
        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <SheetBody className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="contact-first">First name</Label>
                <Input
                  id="contact-first"
                  className="mt-1.5"
                  value={form.first_name}
                  onChange={(e) => update("first_name", e.target.value)}
                />
                <FieldError message={errors.first_name} />
              </div>
              <div>
                <Label htmlFor="contact-last">Last name</Label>
                <Input
                  id="contact-last"
                  className="mt-1.5"
                  value={form.last_name}
                  onChange={(e) => update("last_name", e.target.value)}
                />
                <FieldError message={errors.last_name} />
              </div>
            </div>
            <div>
              <Label htmlFor="contact-email">Email</Label>
              <Input
                id="contact-email"
                type="email"
                className="mt-1.5"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="name@company.com"
              />
              <FieldError message={errors.email} />
            </div>
            <div>
              <Label htmlFor="contact-phone">Phone</Label>
              <Input
                id="contact-phone"
                className="mt-1.5"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="contact-title">Job title</Label>
              <Input
                id="contact-title"
                className="mt-1.5"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
              />
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
              {saving ? "Saving…" : "Create contact"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export function ContactsHome() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [rows, setRows] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [ownerId, setOwnerId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  const companyMap = Object.fromEntries(
    companies.map((company) => [company.id, company.name])
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setStatus("loading");
      try {
        const [ws, list, companyList] = await Promise.all([
          apiFetch("/api/workspace"),
          apiFetch("/api/contacts?order_by=created_at&limit=200"),
          apiFetch("/api/companies?order_by=name&limit=200"),
        ]);
        if (cancelled) return;
        setOwnerId(ws.user?.id || null);
        setRows(list.data || []);
        setCompanies(companyList.data || []);
        setStatus("ready");
      } catch (error) {
        if (!cancelled) {
          toast.error(error.message || "Could not load contacts");
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
    router.replace("/contacts?action=create", { scroll: false });
  }

  function closeCreate(open) {
    setFormOpen(open);
    if (!open) router.replace("/contacts", { scroll: false });
  }

  if (status === "loading") return <CrmSkeleton />;

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5">
      <CrmPageHeader
        crumb="Contacts"
        title="Contacts"
        description="People linked to companies and deals in your CRM."
        actionLabel={
          <>
            <Plus className="size-3.5" />
            Add Contact
          </>
        }
        onAction={openCreate}
      />

      {rows.length === 0 ? (
        <CrmEmptyState
          title="No contacts yet"
          description="Add a contact to start tracking people across companies and deals."
          actionLabel="Add Contact"
          onAction={openCreate}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-950">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="px-4">Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="hidden md:table-cell">Title</TableHead>
                <TableHead className="hidden lg:table-cell">Company</TableHead>
                <TableHead className="hidden sm:table-cell">Phone</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="px-4 py-3 font-semibold">
                    {displayName(row)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.email || "—"}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {row.title || "—"}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {companyMap[row.company_id] || "—"}
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

      <ContactFormDrawer
        open={formOpen}
        onOpenChange={closeCreate}
        ownerId={ownerId}
        companies={companies}
        onSaved={(row) => setRows((prev) => [row, ...prev])}
      />
    </div>
  );
}
