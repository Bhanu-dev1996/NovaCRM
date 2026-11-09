"use client";

import { useEffect, useState } from "react";
import { Bell, Cable, Mail, Phone, Shield } from "lucide-react";
import { toast } from "sonner";

import { COMM_CHANNELS } from "@/components/communications/communications-data";
import { CommSkeletonBlock } from "@/components/communications/communications-skeleton-shared";
import { CommunicationsDropdown } from "@/components/communications/communications-dropdown-field";
import {
  fetchCommunicationsState,
  patchCommunicationsSettings,
} from "@/components/communications/communications-api";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { crmType } from "@/lib/crm-typography";
import { cn } from "@/lib/utils";

const CHANNEL_ICON = {
  email: Mail,
  call: Phone,
};

const STATUS_STYLES = {
  connected:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  not_connected: "bg-muted text-muted-foreground",
  error: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
};

const NOTIFICATION_COPY = {
  newMessage: {
    title: "New messages",
    hint: "When a customer replies in any thread you can access.",
  },
  unreadAlerts: {
    title: "Unread backlog",
    hint: "Daily digest when conversations stay unread.",
  },
  assignedAlerts: {
    title: "Assignments",
    hint: "When a thread is assigned or reassigned to you.",
  },
};

function statusLabel(status) {
  if (status === "connected") return "Connected";
  if (status === "error") return "Connection error";
  return "Not connected";
}

export function CommunicationsSettingsSkeleton() {
  return (
    <div
      className="mx-auto flex w-full min-w-0 max-w-[1680px] flex-col gap-4"
      aria-busy="true"
      aria-label="Loading communication settings"
    >
      <header className="space-y-2">
        <CommSkeletonBlock className="h-3 w-56 rounded-md" />
        <CommSkeletonBlock className="h-8 w-64 rounded-lg" />
        <CommSkeletonBlock className="h-4 w-full max-w-lg rounded-md" />
      </header>
      <div className="flex flex-wrap gap-6 border-b border-neutral-200 pb-3 dark:border-neutral-800">
        {["Channels", "Email", "Notifications", "Access"].map((label) => (
          <CommSkeletonBlock key={label} className="h-4 w-20 rounded-md" />
        ))}
      </div>
      <Card className="overflow-hidden rounded-2xl border-neutral-200/80 py-0 shadow-sm dark:border-neutral-800">
        <CardContent className="p-0">
          <div className="border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
            <CommSkeletonBlock className="h-4 w-40 rounded-md" />
            <CommSkeletonBlock className="mt-2 h-3 w-72 max-w-full rounded-md" />
          </div>
          <div className="grid gap-3 px-5 pb-5 pt-5 sm:grid-cols-2">
            {COMM_CHANNELS.map((ch) => (
              <CommSkeletonBlock key={ch.id} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function CommunicationsSettingsHome() {
  const [settings, setSettings] = useState(null);
  const [emailDraft, setEmailDraft] = useState(null);
  const [tab, setTab] = useState("channels");

  useEffect(() => {
    let cancelled = false;
    fetchCommunicationsState()
      .then((data) => {
        if (!cancelled) {
          setSettings(data.settings);
          setEmailDraft(data.settings?.email || {});
        }
      })
      .catch((error) => {
        if (!cancelled) toast.error(error.message || "Could not load settings");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function saveEmailIdentity() {
    if (!emailDraft) return;
    await save({ email: emailDraft });
  }

  async function save(patch) {
    try {
      const next = await patchCommunicationsSettings(patch);
      setSettings(next);
      if (patch.email) setEmailDraft(next.email || patch.email);
      toast.success("Settings saved");
    } catch (error) {
      toast.error(error.message || "Could not save settings");
    }
  }

  if (!settings || !emailDraft) return <CommunicationsSettingsSkeleton />;

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[1680px] flex-col gap-4">
      <header>
        <PageBreadcrumb
          items={[
            { href: "/", label: "Workspace" },
            { href: "/communications", label: "Communications" },
            { label: "Settings" },
          ]}
          className="mb-2"
        />
        <h1 className="text-[26px] font-bold tracking-[-0.03em] text-neutral-900 dark:text-neutral-50">
          Communication settings
        </h1>
        <p className={cn("mt-1", crmType.pageDescription)}>
          Configure channels, outbound identity, alerts, and who can use the inbox.
          Email delivery uses your workspace SMTP or Resend configuration.
        </p>
      </header>

      <Tabs value={tab} onValueChange={setTab} className="gap-4">
        <TabsList
          variant="line"
          className="h-auto w-full flex-wrap justify-start gap-x-6 gap-y-0 border-b border-neutral-200 bg-transparent p-0 dark:border-neutral-800"
        >
          <TabsTrigger value="channels" className={cn("gap-1.5 pb-3", crmType.tabLine)}>
            <Cable className="size-3.5" />
            Channels
          </TabsTrigger>
          <TabsTrigger value="email" className={cn("gap-1.5 pb-3", crmType.tabLine)}>
            <Mail className="size-3.5" />
            Email
          </TabsTrigger>
          <TabsTrigger value="notifications" className={cn("gap-1.5 pb-3", crmType.tabLine)}>
            <Bell className="size-3.5" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="access" className={cn("gap-1.5 pb-3", crmType.tabLine)}>
            <Shield className="size-3.5" />
            Access
          </TabsTrigger>
        </TabsList>

        <Card className="overflow-hidden rounded-2xl border-neutral-200/80 py-0 shadow-sm ring-0 dark:border-neutral-800">
          <CardContent className="p-0">
            <TabsContent value="channels" className="mt-0 outline-none">
              <SectionIntro
                title="Connected channels"
                description="Email status reflects backend delivery config; call history links to Activities."
              />
              <div className="grid gap-3 px-5 pb-5 pt-5 sm:grid-cols-2">
                {COMM_CHANNELS.map((ch) => {
                  const Icon = CHANNEL_ICON[ch.id] || Mail;
                  const st = settings.channels?.[ch.id]?.status || "not_connected";
                  const connected = st === "connected";
                  return (
                    <div
                      key={ch.id}
                      className="flex flex-col gap-3 rounded-xl border border-neutral-200/80 bg-neutral-50/40 p-4 dark:border-neutral-800 dark:bg-neutral-900/25"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-primary-700 shadow-sm ring-1 ring-neutral-200/80 dark:bg-neutral-950 dark:text-primary-300 dark:ring-neutral-800">
                          <Icon className="size-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] font-semibold">{ch.label}</p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {settings.channels?.[ch.id]?.label || ch.label}
                          </p>
                          <Badge
                            className={cn("mt-2 border-0", STATUS_STYLES[st])}
                          >
                            {statusLabel(st)}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 w-full rounded-lg text-[12px]"
                        disabled={connected}
                        onClick={() =>
                          toast.message(
                            connected
                              ? "Email delivery is configured on the server (SMTP or Resend)."
                              : "Set RESEND_API_KEY or SMTP credentials in backend/.env."
                          )
                        }
                      >
                        {connected ? "Delivery configured" : "Configure server email"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="email" className="mt-0 outline-none">
              <SectionIntro
                title="Email identity"
                description="Defaults applied when you compose or reply from the inbox."
              />
              <div className="grid gap-6 px-5 pb-5 pt-5 lg:grid-cols-[minmax(0,1fr)_minmax(240px,320px)]">
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Sender name">
                      <Input
                        className="h-9 rounded-lg"
                        value={emailDraft?.name || ""}
                        onChange={(e) =>
                          setEmailDraft((p) => ({ ...p, name: e.target.value }))
                        }
                      />
                    </FormField>
                    <FormField label="Sender email">
                      <Input
                        className="h-9 rounded-lg"
                        type="email"
                        value={emailDraft?.email || ""}
                        onChange={(e) =>
                          setEmailDraft((p) => ({ ...p, email: e.target.value }))
                        }
                      />
                    </FormField>
                  </div>
                  <FormField label="Reply-to address">
                    <Input
                      className="h-9 rounded-lg"
                      type="email"
                      value={emailDraft?.replyTo || ""}
                      onChange={(e) =>
                        setEmailDraft((p) => ({ ...p, replyTo: e.target.value }))
                      }
                    />
                  </FormField>
                  <FormField label="Default signature">
                    <Textarea
                      className="min-h-[140px] rounded-lg text-[12px] leading-relaxed"
                      value={emailDraft?.signature || ""}
                      onChange={(e) =>
                        setEmailDraft((p) => ({ ...p, signature: e.target.value }))
                      }
                    />
                  </FormField>
                  <Button
                    type="button"
                    className="h-9 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
                    onClick={saveEmailIdentity}
                  >
                    Save email identity
                  </Button>
                </div>
                <aside className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-800 dark:bg-neutral-900/30">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Preview
                  </p>
                  <div className="mt-3 space-y-2 text-[12px] leading-relaxed text-foreground">
                    <p className="font-medium">
                      {emailDraft?.name || "Sender name"}
                    </p>
                    <p className="text-muted-foreground">
                      {emailDraft?.email || "sender@example.com"}
                    </p>
                    <p className="whitespace-pre-wrap border-t border-neutral-200/80 pt-3 text-[11px] text-muted-foreground dark:border-neutral-700">
                      {emailDraft?.signature || "Your signature appears here."}
                    </p>
                  </div>
                </aside>
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="mt-0 outline-none">
              <SectionIntro
                title="Notification preferences"
                description="Control which inbox events surface as alerts."
              />
              <ul className="divide-y divide-neutral-100 px-5 pb-5 pt-1 dark:divide-neutral-800">
                {Object.entries(NOTIFICATION_COPY).map(([key, copy]) => (
                  <li key={key}>
                    <label className="flex cursor-pointer items-start justify-between gap-4 py-4">
                      <span>
                        <span className="block text-[13px] font-medium">{copy.title}</span>
                        <span className="mt-0.5 block text-[12px] text-muted-foreground">
                          {copy.hint}
                        </span>
                      </span>
                      <Switch
                        className="mt-0.5"
                        checked={Boolean(settings.notifications?.[key])}
                        onCheckedChange={(v) =>
                          save({
                            notifications: {
                              ...settings.notifications,
                              [key]: v,
                            },
                          })
                        }
                        aria-label={copy.title}
                      />
                    </label>
                  </li>
                ))}
              </ul>
            </TabsContent>

            <TabsContent value="access" className="mt-0 outline-none">
              <SectionIntro
                title="Team permissions"
                description="Scope who can send, read threads, and edit templates."
              />
              <div className="grid gap-4 px-5 pb-5 pt-5 md:grid-cols-3">
                {[
                  ["sendEmail", "Send emails", "Compose and reply from the inbox."],
                  [
                    "accessConversations",
                    "View conversations",
                    "Open threads and customer history.",
                  ],
                  [
                    "manageTemplates",
                    "Manage templates",
                    "Create and edit shared message templates.",
                  ],
                ].map(([key, title, hint]) => (
                  <div
                    key={key}
                    className="rounded-xl border border-neutral-200/80 bg-neutral-50/40 p-4 dark:border-neutral-800 dark:bg-neutral-900/25"
                  >
                    <p className="text-[13px] font-semibold">{title}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
                    <div className="mt-3">
                      <CommunicationsDropdown
                        triggerClassName="w-full rounded-lg"
                        value={settings.permissions?.[key] || "all_members"}
                        onChange={(v) =>
                          save({ permissions: { ...settings.permissions, [key]: v } })
                        }
                        options={[
                          { value: "all_members", label: "All members" },
                          { value: "sales_team", label: "Sales team" },
                          { value: "admins", label: "Admins only" },
                        ]}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}

function SectionIntro({ title, description }) {
  return (
    <div className="border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
      <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
      <p className="mt-1 text-[12px] text-muted-foreground">{description}</p>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[12px] font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
