"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import {
  Activity,
  ArrowLeft,
  Building2,
  Briefcase,
  Clock,
  Mail,
  Phone,
  Sparkles,
  SquarePen,
  StickyNote,
  Upload,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { ContactFormDrawer } from "@/components/contacts/contact-form-drawer";
import {
  fromApiContact,
  mapMemberToOwner,
  persistContactMeta,
  toApiContact,
} from "@/components/contacts/contact-api";
import {
  CONTACT_AI_INSIGHTS,
  CONTACT_TYPE_STYLES,
  CONTACT_OWNERS,
  LIFECYCLE_STYLES,
  fullName,
  initials,
  ownerById,
  tagStyleAt,
} from "@/components/contacts/contacts-data";
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
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

function formatDate(value) {
  if (!value) return "—";
  try {
    return format(parseISO(String(value).slice(0, 10)), "MMM d, yyyy");
  } catch {
    return value;
  }
}

const DEMO_ACTIVITIES = [
  {
    id: "a1",
    type: "email",
    title: "Follow-up on implementation timeline",
    time: "Oct 28 · 2:15 PM",
    actor: "You",
  },
  {
    id: "a2",
    type: "call",
    title: "Discovery call — 32 min",
    time: "Oct 22 · 11:00 AM",
    actor: "Alex Morgan",
  },
  {
    id: "a3",
    type: "note",
    title: "Added to Q4 account plan",
    time: "Oct 18 · 4:40 PM",
    actor: "System",
  },
];

export function ContactDetailView({ contactId }) {
  const router = useRouter();
  const [loadStatus, setLoadStatus] = useState("loading");
  const [contact, setContact] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [owners, setOwners] = useState(CONTACT_OWNERS);
  const [deals, setDeals] = useState([]);
  const [tab, setTab] = useState("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(true);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadStatus("loading");
      try {
        const [detail, companyList, members, dealList] = await Promise.all([
          apiFetch(`/api/contacts/${contactId}`),
          apiFetch("/api/companies?order_by=name&limit=200"),
          apiFetch("/api/workspace/members"),
          apiFetch("/api/deals?order_by=created_at&limit=200"),
        ]);
        if (cancelled) return;
        const mappedOwners = (members.data || []).map(mapMemberToOwner);
        setOwners(mappedOwners.length ? mappedOwners : CONTACT_OWNERS);
        setCompanies(companyList.data || []);
        setContact(fromApiContact(detail.data));
        setDeals(dealList.data || []);
        setLoadStatus("ready");
      } catch (error) {
        if (!cancelled) {
          toast.error(error.message || "Could not load contact");
          setLoadStatus("error");
        }
      }
    }
    if (contactId) load();
    return () => {
      cancelled = true;
    };
  }, [contactId]);

  const company = useMemo(
    () => companies.find((c) => c.id === contact?.companyId),
    [companies, contact?.companyId]
  );

  const owner = ownerById(contact?.ownerId, owners);
  const linkedDeals = useMemo(
    () =>
      deals.filter(
        (deal) =>
          deal.contact_id === contactId ||
          deal.primary_contact_id === contactId
      ),
    [deals, contactId]
  );

  function openEmailComposer() {
    if (!contact) return;
    setEmailSubject(`Re: ${fullName(contact)}`);
    setEmailBody(
      `Hi ${contact.firstName || fullName(contact)},\n\nThanks for connecting. I wanted to follow up on our last conversation and share next steps for ${company?.name || "your team"}.\n\nBest,\nNovaCRM`
    );
    setEmailOpen(true);
  }

  async function handleSave(updated, { isEdit }) {
    const payload = toApiContact(updated);
    const response = isEdit
      ? await apiFetch(`/api/contacts/${updated.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        })
      : await apiFetch("/api/contacts", {
          method: "POST",
          body: JSON.stringify(payload),
        });
    const saved = fromApiContact(response.data);
    const merged = {
      ...saved,
      contactType: updated.contactType,
      lifecycle: updated.lifecycle,
      tags: updated.tags,
      linkedIn: updated.linkedIn,
      notes: updated.notes,
      lastActivityAt: updated.lastActivityAt || saved.lastActivityAt,
      department: updated.department,
    };
    persistContactMeta(merged);
    setContact(merged);
    toast.success(isEdit ? "Contact updated" : "Contact created");
  }

  async function logEmailActivity() {
    if (!contact) return;
    try {
      await apiFetch("/api/activities", {
        method: "POST",
        body: JSON.stringify({
          type: "email",
          subject: emailSubject,
          body: emailBody,
          contact_id: contact.id,
        }),
      });
      const next = {
        ...contact,
        lastActivityAt: new Date().toISOString().slice(0, 10),
      };
      persistContactMeta(next);
      setContact(next);
      setEmailOpen(false);
      toast.success("Email logged to activity");
    } catch (error) {
      toast.error(error.message || "Could not log email");
    }
  }

  if (loadStatus === "loading") {
    return (
      <div className="mx-auto max-w-[1200px] animate-pulse space-y-6 p-6">
        <div className="h-8 w-48 rounded-lg bg-muted" />
        <div className="h-32 rounded-2xl bg-muted" />
        <div className="h-64 rounded-2xl bg-muted" />
      </div>
    );
  }

  if (loadStatus === "error" || !contact) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="text-muted-foreground">Contact not found.</p>
        <Button className="mt-4" variant="outline" onClick={() => router.push("/contacts")}>
          Back to contacts
        </Button>
      </div>
    );
  }

  const name = fullName(contact);

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 pb-10">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 rounded-lg"
          onClick={() => router.push("/contacts")}
        >
          <ArrowLeft className="size-3.5" />
          Contacts
        </Button>
        <nav className="text-[12px] text-muted-foreground">
          Workspace / Contacts / <span className="text-foreground">{name}</span>
        </nav>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="min-w-0 flex-1 space-y-6">
          <Card className="overflow-hidden py-0">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-4">
                  <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-lg font-bold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                    {initials(contact)}
                  </span>
                  <div className="min-w-0">
                    <h1 className="text-2xl font-bold tracking-[-0.03em]">{name}</h1>
                    <p className="mt-0.5 text-[14px] text-muted-foreground">
                      {contact.title || "—"}
                      {company ? ` · ${company.name}` : ""}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
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
                      {contact.tags?.map((tag, i) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className={cn("border-transparent", tagStyleAt(i))}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 rounded-lg"
                    onClick={openEmailComposer}
                  >
                    <Mail className="size-3.5" />
                    Email
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 rounded-lg"
                    onClick={() => setActivityOpen(true)}
                  >
                    <Activity className="size-3.5" />
                    Activity log
                  </Button>
                  <Button
                    type="button"
                    className="h-9 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
                    onClick={() => setEditOpen(true)}
                  >
                    <SquarePen className="size-3.5" />
                    Edit
                  </Button>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { icon: Mail, label: "Email", value: contact.email || "—" },
                  { icon: Phone, label: "Phone", value: contact.phone || "—" },
                  {
                    icon: User,
                    label: "Owner",
                    value: owner.name,
                  },
                  {
                    icon: Clock,
                    label: "Last activity",
                    value: formatDate(contact.lastActivityAt),
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="rounded-xl border border-neutral-200/80 p-3 dark:border-neutral-800"
                  >
                    <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                      <row.icon className="size-3.5" />
                      {row.label}
                    </div>
                    <p className="mt-1 truncate text-[13px] font-medium">{row.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="h-10 w-full justify-start rounded-xl bg-muted/50 p-1">
              {[
                ["overview", "Overview"],
                ["activity", "Activity"],
                ["deals", "Deals"],
                ["notes", "Notes"],
                ["files", "Files"],
              ].map(([value, label]) => (
                <TabsTrigger key={value} value={value} className="rounded-lg px-4">
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-4">
              <Card>
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold">About</h3>
                  <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                    {[
                      ["Department", contact.department || "—"],
                      ["LinkedIn", contact.linkedIn || "—"],
                      ["Created", formatDate(contact.createdAt)],
                      ["Updated", formatDate(contact.updatedAt)],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt className="text-[11px] font-medium text-muted-foreground">
                          {label}
                        </dt>
                        <dd className="mt-0.5 text-[13px]">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">Company</h3>
                    <Link
                      href="/companies"
                      className="text-[12px] font-medium text-primary-600 hover:underline"
                    >
                      View all companies
                    </Link>
                  </div>
                  {company ? (
                    <div className="mt-4 flex items-center gap-3 rounded-xl border border-neutral-200/80 p-4 dark:border-neutral-800">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-muted">
                        <Building2 className="size-4" />
                      </span>
                      <div>
                        <p className="font-semibold">{company.name}</p>
                        <p className="text-[12px] text-muted-foreground">
                          Associated account
                        </p>
                      </div>
                      <Link
                        href={`/companies?id=${company.id}`}
                        className="ml-auto inline-flex h-8 items-center rounded-lg border border-input bg-background px-3 text-sm font-medium hover:bg-accent"
                      >
                        Open
                      </Link>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-xl border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700">
                      <Building2 className="mx-auto size-8 text-muted-foreground" />
                      <p className="mt-2 text-sm font-medium">No company associated</p>
                      <p className="mt-1 text-[13px] text-muted-foreground">
                        Link this contact to an account from Companies or edit the
                        contact profile.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-4 rounded-lg"
                        onClick={() => setEditOpen(true)}
                      >
                        Associate company
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <Card>
                <CardContent className="divide-y divide-border p-0">
                  {DEMO_ACTIVITIES.map((item) => (
                    <div key={item.id} className="flex gap-3 px-5 py-4">
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                        <Activity className="size-3.5" />
                      </span>
                      <div>
                        <p className="text-[13px] font-medium">{item.title}</p>
                        <p className="text-[12px] text-muted-foreground">
                          {item.time} · {item.actor}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="deals" className="mt-4">
              <Card>
                <CardContent className="p-5">
                  {linkedDeals.length ? (
                    <ul className="space-y-3">
                      {linkedDeals.map((deal) => (
                        <li
                          key={deal.id}
                          className="flex items-center gap-3 rounded-xl border border-neutral-200/80 p-3 dark:border-neutral-800"
                        >
                          <Briefcase className="size-4 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{deal.name || "Deal"}</p>
                            <p className="text-[12px] text-muted-foreground">
                              {deal.stage || "Pipeline"}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[13px] text-muted-foreground">
                      No deals linked to this contact yet.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes" className="mt-4">
              <Card>
                <CardContent className="p-5">
                  {contact.notes ? (
                    <p className="whitespace-pre-wrap text-[13px] leading-relaxed">
                      {contact.notes}
                    </p>
                  ) : (
                    <p className="text-[13px] text-muted-foreground">
                      No notes yet. Edit the contact to add context.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="files" className="mt-4">
              <Card>
                <CardContent className="flex flex-col items-center py-12 text-center">
                  <Upload className="size-8 text-muted-foreground" />
                  <p className="mt-2 text-sm font-medium">No files uploaded</p>
                  <p className="mt-1 max-w-sm text-[13px] text-muted-foreground">
                    Attach proposals, contracts, or onboarding docs (prototype).
                  </p>
                  <Button type="button" variant="outline" className="mt-4 rounded-lg" disabled>
                    Upload file
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {aiOpen ? (
          <aside className="w-full shrink-0 lg:w-[320px]">
            <Card className="sticky top-4 border-primary-200/60 bg-gradient-to-b from-primary-50/80 to-white py-0 dark:border-primary-900 dark:from-primary-950/40 dark:to-neutral-950">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                      <Sparkles className="size-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">AI insights</p>
                      <p className="text-[11px] text-muted-foreground">
                        For {contact.firstName || name}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    aria-label="Hide AI panel"
                    onClick={() => setAiOpen(false)}
                  >
                    ×
                  </Button>
                </div>
                <ul className="mt-4 space-y-3">
                  {CONTACT_AI_INSIGHTS.map((insight) => (
                    <li
                      key={insight.id}
                      className="rounded-xl border border-neutral-200/80 bg-white/80 p-3 dark:border-neutral-800 dark:bg-neutral-950/60"
                    >
                      <p className="text-[12px] font-semibold">{insight.title}</p>
                      <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                        {insight.body}
                      </p>
                      <Button
                        type="button"
                        variant="link"
                        className="mt-1 h-auto p-0 text-[12px]"
                        onClick={() => toast.message(insight.action)}
                      >
                        {insight.action}
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </aside>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="fixed bottom-6 right-6 size-11 rounded-full shadow-lg lg:hidden"
            aria-label="Show AI insights"
            onClick={() => setAiOpen(true)}
          >
            <Sparkles className="size-4" />
          </Button>
        )}
      </div>

      <ContactFormDrawer
        open={editOpen}
        onOpenChange={setEditOpen}
        initialContact={contact}
        onSave={handleSave}
        owners={owners}
        companies={companies}
        onCompaniesChange={setCompanies}
        existingEmails={[]}
      />

      <Sheet open={emailOpen} onOpenChange={setEmailOpen}>
        <SheetContent
          title="Compose email"
          description={`To ${contact.email || name}`}
          onClose={() => setEmailOpen(false)}
        >
          <SheetBody className="space-y-4">
            <div>
              <Label htmlFor="email-subject">Subject</Label>
              <Input
                id="email-subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="email-body">Message</Label>
              <Textarea
                id="email-body"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={8}
                className="mt-1.5"
              />
            </div>
          </SheetBody>
          <SheetFooter>
            <Button variant="outline" onClick={() => setEmailOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-primary-600 text-white hover:bg-primary-700"
              onClick={logEmailActivity}
            >
              Send & log
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={activityOpen} onOpenChange={setActivityOpen}>
        <DialogContent title="Activity log" maxWidth={512}>
          <DialogBody className="max-h-[60vh] overflow-y-auto">
            <ul className="space-y-4">
              {DEMO_ACTIVITIES.map((item) => (
                <li key={item.id} className="flex gap-3">
                  <StickyNote className="mt-0.5 size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {item.time} · {item.actor}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivityOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
