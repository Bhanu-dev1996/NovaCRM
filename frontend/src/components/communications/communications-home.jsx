"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Archive,
  Briefcase,
  Building2,
  Clock,
  FileText,
  Inbox,
  ListTodo,
  Mail,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Send,
  Settings,
  Star,
  StarOff,
  Trash2,
  TriangleAlert,
  UserRound,
  X,
} from "lucide-react";

import { CommunicationsComposeDrawer } from "@/components/communications/communications-compose-drawer";
import { CommunicationsDropdown } from "@/components/communications/communications-dropdown-field";
import { CommunicationsMessageEditor } from "@/components/communications/communications-message-editor";
import {
  COMM_CHANNELS,
  COMM_KPI_DEFINITIONS,
  INBOX_NAV_ITEMS,
  activitiesCreateUrlFromConversation,
  applyTemplateVariables,
  broadcastCommunicationsUnread,
  channelLabel,
  commPermissionAllows,
  computeCommKpis,
  filterConversations,
  formatCommTime,
  ownerById,
} from "@/components/communications/communications-data";
import {
  appendMessageToConversation,
  createConversation,
  deleteConversationApi,
  fetchCommunicationsState,
  mergeConversation,
  postConversationMessage,
  updateConversationApi,
} from "@/components/communications/communications-api";
import { CONTACT_OWNERS } from "@/components/contacts/contacts-data";
import { mapMemberToOwner } from "@/components/contacts/contact-api";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { crmType } from "@/lib/crm-typography";
import { cn } from "@/lib/utils";

const CHANNEL_ICON = {
  email: Mail,
  call: Phone,
};

const NAV_ICONS = {
  all: Inbox,
  mine: UserRound,
  unread: Mail,
  starred: Star,
  archived: Archive,
};

function ThreadDetailRow({ icon: Icon, label, value, href }) {
  const content = (
    <p className="truncate text-[12px] font-medium text-foreground">{value || "—"}</p>
  );
  return (
    <div className="flex gap-2.5 rounded-lg py-1">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-muted-foreground dark:bg-neutral-900">
        <Icon className="size-3.5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {href && value ? (
          href.startsWith("mailto:") ? (
            <a
              href={href}
              className="mt-0.5 block truncate text-[12px] font-medium text-primary-700 hover:underline dark:text-primary-300"
            >
              {value}
            </a>
          ) : (
            <Link
              href={href}
              className="mt-0.5 block truncate text-[12px] font-medium text-primary-700 hover:underline dark:text-primary-300"
            >
              {value}
            </Link>
          )
        ) : (
          <div className="mt-0.5">{content}</div>
        )}
      </div>
    </div>
  );
}

function ContactAvatar({ name, className }) {
  const parts = String(name || "?").trim().split(/\s+/);
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : (parts[0]?.slice(0, 2) || "?").toUpperCase();
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-primary-200/80 text-[11px] font-bold text-primary-900 ring-2 ring-white dark:from-primary-900 dark:to-primary-950 dark:text-primary-100 dark:ring-neutral-950",
        className
      )}
    >
      {initials}
    </span>
  );
}

function CommSkeletonBlock({ className }) {
  return (
    <div
      className={cn(
        "animate-pulse bg-neutral-200/70 dark:bg-neutral-800",
        className
      )}
    />
  );
}

function ConversationRowSkeleton({ unread = false }) {
  return (
    <div
      className={cn(
        "flex gap-2.5 rounded-xl px-2.5 py-2.5",
        unread && "bg-neutral-50/80 dark:bg-neutral-900/30"
      )}
    >
      <CommSkeletonBlock className="size-10 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <CommSkeletonBlock className="h-3.5 w-32 max-w-full rounded-md" />
        <CommSkeletonBlock className="h-3 w-40 max-w-full rounded-md" />
        <CommSkeletonBlock className="h-3 w-full max-w-[200px] rounded-md" />
        <CommSkeletonBlock className="h-2.5 w-28 rounded-md" />
      </div>
      {unread ? (
        <CommSkeletonBlock className="size-5 shrink-0 rounded-full" />
      ) : null}
    </div>
  );
}

function CommKpiCardSkeleton() {
  return (
    <div className="rounded-xl border border-neutral-200/80 bg-white px-4 py-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
      <CommSkeletonBlock className="h-3 w-28 rounded-md" />
      <CommSkeletonBlock className="mt-2 h-7 w-10 rounded-lg" />
      <CommSkeletonBlock className="mt-2 h-2.5 w-32 rounded-md" />
    </div>
  );
}

function MessageLineSkeleton({ outbound = false }) {
  return (
    <li
      className={cn(
        "flex w-full max-w-[min(100%,42rem)] gap-2.5",
        outbound ? "ml-auto flex-row-reverse" : "mr-auto"
      )}
    >
      <CommSkeletonBlock className="size-8 shrink-0 self-end rounded-full" />
      <CommSkeletonBlock
        className={cn(
          "rounded-2xl",
          outbound ? "h-14 w-[68%] rounded-br-md" : "h-20 w-full min-w-[12rem] rounded-bl-md"
        )}
      />
    </li>
  );
}

export function CommunicationsSkeleton() {
  return (
    <div
      className="mx-auto flex w-full min-w-0 max-w-[1680px] flex-col gap-4"
      aria-busy="true"
      aria-label="Loading communications"
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <CommSkeletonBlock className="h-3 w-44 rounded-md" />
          <CommSkeletonBlock className="h-8 w-20 rounded-lg" />
          <CommSkeletonBlock className="h-4 w-full max-w-md rounded-md" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CommSkeletonBlock className="h-9 w-[108px] rounded-lg" />
          <CommSkeletonBlock className="size-9 rounded-lg" />
          <CommSkeletonBlock className="h-9 w-[100px] rounded-lg" />
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {COMM_KPI_DEFINITIONS.map((def) => (
          <CommKpiCardSkeleton key={def.id} />
        ))}
      </div>

      <Card className="w-full overflow-hidden rounded-2xl border-neutral-200/80 py-0 shadow-sm dark:border-neutral-800">
        <CardContent className="flex h-[min(760px,calc(100vh-11.5rem))] min-h-[520px] w-full min-w-0 flex-1 flex-col overflow-hidden p-0 xl:flex-row">
          <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-neutral-100 p-2 xl:hidden dark:border-neutral-800">
            {Array.from({ length: 5 }).map((_, i) => (
              <CommSkeletonBlock
                key={i}
                className="h-8 w-[4.5rem] shrink-0 rounded-lg"
              />
            ))}
          </div>

          <aside className="hidden min-h-0 w-48 shrink-0 border-r border-neutral-100 bg-neutral-50/40 dark:border-neutral-800 dark:bg-neutral-900/20 xl:flex xl:flex-col">
            <div className="space-y-2 border-b border-neutral-100 px-3 py-3 dark:border-neutral-800">
              <CommSkeletonBlock className="h-3 w-14 rounded-md" />
              <CommSkeletonBlock className="h-3 w-16 rounded-md" />
            </div>
            <nav className="space-y-1 p-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <CommSkeletonBlock
                  key={i}
                  className="h-9 w-full rounded-xl"
                />
              ))}
            </nav>
          </aside>

          <section className="flex min-h-0 w-full min-w-0 flex-col border-r border-neutral-100 dark:border-neutral-800 xl:w-[280px] xl:max-w-[300px] xl:shrink-0">
            <div className="space-y-3 border-b border-neutral-100 px-3 py-3 dark:border-neutral-800">
              <CommSkeletonBlock className="h-9 w-full rounded-lg" />
              <CommSkeletonBlock className="h-9 w-full rounded-lg" />
              <div className="flex items-center justify-between gap-2">
                <CommSkeletonBlock className="h-8 w-24 rounded-lg" />
                <CommSkeletonBlock className="h-3 w-20 rounded-md" />
              </div>
            </div>
            <ul className="min-h-0 flex-1 space-y-1 overflow-hidden px-2 py-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <li key={i}>
                  <ConversationRowSkeleton unread={i < 2} />
                </li>
              ))}
            </ul>
          </section>

          <section className="flex min-h-0 min-w-0 flex-1 basis-0 flex-col overflow-hidden bg-neutral-50/50 dark:bg-neutral-900/30">
            <div className="space-y-3 border-b border-neutral-100 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950">
              <CommSkeletonBlock className="h-5 w-56 max-w-full rounded-md" />
              <div className="flex items-center gap-2">
                <CommSkeletonBlock className="size-7 rounded-full" />
                <CommSkeletonBlock className="h-3.5 w-40 rounded-md" />
              </div>
              <div className="flex gap-2">
                <CommSkeletonBlock className="h-8 w-20 rounded-lg" />
                <CommSkeletonBlock className="h-8 w-24 rounded-lg" />
                <CommSkeletonBlock className="ml-auto h-8 w-8 rounded-lg" />
              </div>
            </div>
            <div className="flex min-h-0 w-full min-w-0 flex-1 basis-0 flex-col overflow-hidden px-4 py-4">
              <ul className="flex w-full min-w-0 flex-col gap-3 p-0">
                <MessageLineSkeleton />
                <MessageLineSkeleton outbound />
                <MessageLineSkeleton />
              </ul>
            </div>
            <div className="shrink-0 border-t border-neutral-100 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
              <div className="w-full min-w-0 space-y-2">
                <CommSkeletonBlock className="h-9 w-full rounded-lg" />
                <CommSkeletonBlock className="h-[124px] w-full rounded-xl" />
                <div className="flex justify-end gap-2">
                  <CommSkeletonBlock className="h-9 w-20 rounded-lg" />
                  <CommSkeletonBlock className="h-9 w-16 rounded-lg" />
                </div>
              </div>
            </div>
          </section>

          <aside className="hidden min-h-0 w-[17rem] shrink-0 flex-col overflow-hidden border-l border-neutral-100 bg-white dark:border-neutral-800 dark:bg-neutral-950 xl:flex">
            <div className="shrink-0 border-b border-neutral-100 bg-gradient-to-b from-primary-50/40 to-white px-4 pb-4 pt-4 dark:border-neutral-800 dark:from-primary-950/20 dark:to-neutral-950">
              <CommSkeletonBlock className="size-14 rounded-full" />
              <CommSkeletonBlock className="mt-3 h-4 w-32 rounded-md" />
              <CommSkeletonBlock className="mt-2 h-3 w-24 rounded-md" />
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <CommSkeletonBlock className="h-6 w-14 rounded-full" />
                <CommSkeletonBlock className="h-6 w-16 rounded-full" />
              </div>
            </div>
            <div className="min-h-0 flex-1 space-y-3 overflow-hidden p-3">
              <CommSkeletonBlock className="h-9 w-full rounded-lg" />
              <CommSkeletonBlock className="h-3 w-14 rounded-md" />
              <div className="space-y-2 rounded-xl border border-neutral-200/80 p-2 dark:border-neutral-800">
                <CommSkeletonBlock className="h-10 w-full rounded-lg" />
                <CommSkeletonBlock className="h-10 w-full rounded-lg" />
              </div>
              <CommSkeletonBlock className="h-3 w-12 rounded-md" />
              <div className="space-y-2 rounded-xl border border-neutral-200/80 p-2 dark:border-neutral-800">
                <CommSkeletonBlock className="h-10 w-full rounded-lg" />
                <CommSkeletonBlock className="h-10 w-full rounded-lg" />
              </div>
              <CommSkeletonBlock className="h-3 w-20 rounded-md" />
              <div className="flex items-center gap-2 rounded-xl border border-neutral-200/80 p-2.5 dark:border-neutral-800">
                <CommSkeletonBlock className="size-9 rounded-full" />
                <div className="min-w-0 flex-1 space-y-1">
                  <CommSkeletonBlock className="h-2 w-10 rounded-md" />
                  <CommSkeletonBlock className="h-3 w-24 rounded-md" />
                </div>
                <CommSkeletonBlock className="h-8 w-16 rounded-lg" />
              </div>
            </div>
            <div className="shrink-0 space-y-2 border-t border-neutral-100 bg-neutral-50/50 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
              <CommSkeletonBlock className="h-9 w-full rounded-lg" />
              <div className="grid grid-cols-2 gap-2">
                <CommSkeletonBlock className="h-8 w-full rounded-lg" />
                <CommSkeletonBlock className="h-8 w-full rounded-lg" />
              </div>
            </div>
          </aside>
        </CardContent>
      </Card>
    </div>
  );
}

export function CommunicationsHome() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState("loading");
  const [commState, setCommState] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [deals, setDeals] = useState([]);
  const [owners, setOwners] = useState(CONTACT_OWNERS);
  const [currentUser, setCurrentUser] = useState({ id: "alex", name: "Alex Morgan" });
  const [workspaceRole, setWorkspaceRole] = useState("member");
  const [replySending, setReplySending] = useState(false);
  const [composeForward, setComposeForward] = useState(null);

  const [navId, setNavId] = useState("all");
  const [channelNav, setChannelNav] = useState("all");
  const [search, setSearch] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [unreadFilter, setUnreadFilter] = useState(false);

  const [selectedId, setSelectedId] = useState(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyBody, setReplyBody] = useState("");
  const [deletePrompt, setDeletePrompt] = useState(null);
  const [deletingConversation, setDeletingConversation] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  const applyConversation = useCallback((conversation) => {
    if (!conversation?.id) return;
    setCommState((prev) => mergeConversation(prev || { conversations: [] }, conversation));
  }, []);

  const refreshInbox = useCallback(async () => {
    const data = await fetchCommunicationsState();
    setCommState(data);
    return data;
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setStatus("loading");
      try {
        const [ws, contactList, companyList, dealList, members, comm] = await Promise.all([
          apiFetch("/api/workspace"),
          apiFetch("/api/contacts?order_by=created_at&limit=200"),
          apiFetch("/api/companies?order_by=name&limit=200"),
          apiFetch("/api/deals?order_by=created_at&limit=200"),
          apiFetch("/api/workspace/members").catch(() => ({ data: [] })),
          fetchCommunicationsState(),
        ]);
        if (cancelled) return;
        const user = ws.user;
        setWorkspaceRole(ws.role || "member");
        setCurrentUser({
          id: user?.id || "",
          name: user?.full_name || user?.email || "You",
        });
        if (members?.data?.length) {
          setOwners(members.data.map(mapMemberToOwner));
        }
        setContacts((contactList.data || []).map((r) => ({ ...r, id: r.id })));
        setCompanies(companyList.data || []);
        setDeals(dealList.data || []);
        setCommState(comm);
        setStatus("ready");
      } catch (error) {
        if (!cancelled) {
          toast.error(error.message || "Could not load communications");
          setStatus("ready");
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (searchParams.get("action") === "compose") {
      setComposeOpen(true);
      setReplyTarget(null);
    }
    const conv = searchParams.get("conversation");
    if (conv) setSelectedId(conv);
  }, [searchParams]);

  useEffect(() => {
    if (!commState?.conversations) return;
    broadcastCommunicationsUnread(computeCommKpis(commState.conversations).unread);
  }, [commState?.conversations]);

  const filtered = useMemo(() => {
    if (!commState) return [];
    const channel = channelNav !== "all" ? channelNav : "all";
    return filterConversations(commState.conversations, {
      navId,
      tabId: "all",
      channel,
      search,
      ownerFilter,
      unreadOnly: unreadFilter,
      currentUserId: currentUser.id,
    });
  }, [
    commState,
    navId,
    channelNav,
    search,
    ownerFilter,
    unreadFilter,
    currentUser.id,
  ]);

  const selected = useMemo(
    () => commState?.conversations?.find((c) => c.id === selectedId) || filtered[0],
    [commState, selectedId, filtered]
  );

  useEffect(() => {
    if (filtered.length && !selectedId) setSelectedId(filtered[0].id);
  }, [filtered, selectedId]);

  useEffect(() => {
    if (!selectedId || !commState) return;
    const conv = commState.conversations.find((c) => c.id === selectedId);
    if (conv && (conv.unreadCount || 0) > 0) {
      updateConversationApi(selectedId, { unreadCount: 0 })
        .then(applyConversation)
        .catch(() => {});
    }
  }, [selectedId, commState, applyConversation]);

  const commPermissions = commState?.settings?.permissions || {};
  const canSendEmail = useMemo(
    () => commPermissionAllows(commPermissions.sendEmail || "all_members", workspaceRole),
    [commPermissions.sendEmail, workspaceRole]
  );
  const canAccessInbox = useMemo(
    () =>
      commPermissionAllows(commPermissions.accessConversations || "all_members", workspaceRole),
    [commPermissions.accessConversations, workspaceRole]
  );

  const kpis = useMemo(
    () => computeCommKpis(commState?.conversations, commState?.sentTodayCount ?? 0),
    [commState]
  );

  const navCounts = useMemo(() => {
    const list = commState?.conversations || [];
    const active = list.filter((c) => !c.archived);
    return {
      unread: active.reduce((n, c) => n + (c.unreadCount || 0), 0),
      starred: active.filter((c) => c.starred).length,
    };
  }, [commState]);

  async function patchSelected(patch) {
    if (!selected?.id) return;
    try {
      const conv = await updateConversationApi(selected.id, patch);
      applyConversation(conv);
    } catch (error) {
      toast.error(error.message || "Could not update conversation");
    }
  }

  function insertReplyTemplate(templateId) {
    const tpl = commState?.templates?.find((t) => t.id === templateId);
    if (!tpl || !selected) return;
    const contact = contacts.find((c) => String(c.id) === String(selected.contactId));
    const company = companies.find((c) => String(c.id) === String(selected.companyId));
    const deal = deals.find((d) => String(d.id) === String(selected.dealId));
    const owner = owners.find((o) => String(o.id) === String(selected.assigneeId));
    const ctx = {
      firstName: contact?.first_name || contact?.firstName,
      lastName: contact?.last_name || contact?.lastName,
      companyName: company?.name || selected.companyName,
      dealName: deal?.name || selected.dealName,
      dealValue: deal?.amount,
      ownerName: owner?.name || currentUser.name,
    };
    setReplyBody(applyTemplateVariables(tpl.body, ctx));
    toast.success(`Inserted “${tpl.name}”`);
  }

  async function sendReply() {
    if (!canSendEmail) {
      toast.error("You do not have permission to send messages");
      return;
    }
    if (!selected?.id || !replyBody.trim()) {
      toast.error("Enter a message");
      return;
    }
    setReplySending(true);
    try {
      const result = await postConversationMessage(selected.id, {
        body: replyBody.trim(),
        channel: selected.channel,
        sender_name: currentUser.name,
        sender_email: commState?.settings?.email?.email,
        subject: selected.subject,
        to_email: selected.contactEmail,
        send_email: selected.channel === "email",
      });
      if (result.conversation) {
        applyConversation(result.conversation);
      } else if (result.message) {
        setCommState((prev) =>
          appendMessageToConversation(prev, selected.id, result.message)
        );
      }
      setReplyBody("");
      const status = result.message?.status || result.status;
      toast.success(
        status === "delivered"
          ? "Reply sent"
          : "Reply saved — configure SMTP/Resend to deliver email"
      );
    } catch (error) {
      toast.error(error.message || "Could not send reply");
    } finally {
      setReplySending(false);
    }
  }

  const deleteConversationTarget = useMemo(
    () => commState?.conversations?.find((c) => c.id === deletePrompt) || null,
    [commState, deletePrompt]
  );

  async function handleDelete() {
    if (!deletePrompt) return;
    setDeletingConversation(true);
    try {
      await deleteConversationApi(deletePrompt);
      setCommState((prev) => ({
        ...prev,
        conversations: (prev.conversations || []).filter((c) => c.id !== deletePrompt),
      }));
      if (selectedId === deletePrompt) setSelectedId(null);
      setDeletePrompt(null);
      toast.success("Conversation deleted");
    } catch (error) {
      toast.error(error.message || "Could not delete conversation");
    } finally {
      setDeletingConversation(false);
    }
  }

  if (status === "loading" || !commState) return <CommunicationsSkeleton />;

  if (!canAccessInbox) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <CrmEmptyState
          title="Communications restricted"
          description="Your workspace role cannot access the inbox. Ask an admin to update permissions in Communications settings."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[1680px] flex-col gap-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <PageBreadcrumb
            items={[
              { href: "/", label: "Workspace" },
              { label: "Communications" },
            ]}
            className="mb-2"
          />
          <h1 className="text-[26px] font-bold tracking-[-0.03em] text-neutral-900 dark:text-neutral-50">
            Inbox
          </h1>
          <p
            className={cn(
              "mt-1 truncate whitespace-nowrap",
              crmType.pageDescription
            )}
            title="Email and call threads with your contacts — filter, assign, and reply in one place."
          >
            Email and call threads with your contacts — filter, assign, and reply in one place.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-lg"
            render={<Link href="/communications/templates" />}
          >
            <FileText className="size-3.5" />
            Templates
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-9 rounded-lg"
            aria-label="Communication settings"
            render={<Link href="/communications/settings" />}
          >
            <Settings className="size-4" />
          </Button>
          <Button
            type="button"
            className="h-9 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
            disabled={!canSendEmail}
            onClick={() => {
              setReplyTarget(null);
              setComposeForward(null);
              setComposeOpen(true);
            }}
          >
            <Plus className="size-3.5" />
            Compose
          </Button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {COMM_KPI_DEFINITIONS.map((def) => (
          <div
            key={def.id}
            className={cn(
              "rounded-xl border border-neutral-200/80 bg-white px-4 py-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-950",
              "flex items-start justify-between gap-2"
            )}
          >
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">{def.label}</p>
              <p className="mt-0.5 text-xl font-semibold tabular-nums text-foreground">
                {kpis[def.id] ?? 0}
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{def.hint}</p>
            </div>
          </div>
        ))}
      </div>

      <Card className="w-full overflow-hidden rounded-2xl border-neutral-200/80 py-0 shadow-sm dark:border-neutral-800">
        <CardContent className="flex h-[min(760px,calc(100vh-11.5rem))] min-h-[520px] w-full min-w-0 flex-1 flex-col overflow-hidden p-0 xl:flex-row">
          {/* Mobile / tablet nav strip */}
          <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-neutral-100 p-2 xl:hidden dark:border-neutral-800">
            {INBOX_NAV_ITEMS.map((item) => {
              const Icon = NAV_ICONS[item.id] || Inbox;
              const count =
                item.id === "unread"
                  ? navCounts.unread
                  : item.id === "starred"
                    ? navCounts.starred
                    : 0;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setNavId(item.id)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium",
                    navId === item.id
                      ? "bg-primary-50 text-primary-800 dark:bg-primary-950 dark:text-primary-200"
                      : "bg-neutral-100/80 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                  )}
                >
                  <Icon className="size-3.5" />
                  {item.label.split(" ")[0]}
                  {count > 0 ? (
                    <span className="rounded-full bg-primary-600 px-1.5 text-[9px] text-white">
                      {count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Left — inbox nav */}
          <aside className="hidden min-h-0 w-48 shrink-0 border-r border-neutral-100 bg-neutral-50/40 dark:border-neutral-800 dark:bg-neutral-900/20 xl:flex xl:flex-col">
            <div className="border-b border-neutral-100 px-3 py-3 dark:border-neutral-800">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Folders
              </p>
              {navCounts.unread > 0 ? (
                <p className="mt-1 text-[11px] text-primary-700 dark:text-primary-300">
                  {navCounts.unread} unread
                </p>
              ) : null}
            </div>
            <nav className="flex-1 space-y-1 p-2">
              {INBOX_NAV_ITEMS.map((item) => {
                const Icon = NAV_ICONS[item.id] || Inbox;
                const count =
                  item.id === "unread"
                    ? navCounts.unread
                    : item.id === "starred"
                      ? navCounts.starred
                      : 0;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setNavId(item.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[12px] font-medium transition-colors",
                      navId === item.id
                        ? "bg-white text-primary-800 shadow-sm ring-1 ring-neutral-200/80 dark:bg-neutral-950 dark:text-primary-200 dark:ring-neutral-800"
                        : "text-neutral-600 hover:bg-white/70 dark:text-neutral-400 dark:hover:bg-neutral-900/60"
                    )}
                  >
                    <Icon className="size-3.5 shrink-0 opacity-80" />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {count > 0 ? (
                      <Badge
                        variant="secondary"
                        className="h-5 min-w-5 justify-center rounded-full px-1.5 text-[10px] tabular-nums"
                      >
                        {count}
                      </Badge>
                    ) : null}
                  </button>
                );
              })}
              <div className="my-2 border-t border-neutral-200/80 dark:border-neutral-800" />
              {COMM_CHANNELS.map((ch) => {
                const Icon = CHANNEL_ICON[ch.id] || Mail;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() =>
                      setChannelNav(channelNav === ch.id ? "all" : ch.id)
                    }
                    className={cn(
                      "flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[12px] font-medium transition-colors",
                      channelNav === ch.id
                        ? "bg-white text-primary-800 shadow-sm ring-1 ring-neutral-200/80 dark:bg-neutral-950 dark:text-primary-200 dark:ring-neutral-800"
                        : "text-neutral-600 hover:bg-white/70 dark:text-neutral-400"
                    )}
                  >
                    <Icon className="size-3.5 shrink-0 opacity-80" />
                    {ch.label}
                    {!ch.active ? (
                      <span className="ml-auto text-[10px] text-muted-foreground">Soon</span>
                    ) : null}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Middle — list */}
          <section className="flex min-h-0 w-full min-w-0 flex-col border-r border-neutral-100 bg-white dark:border-neutral-800 dark:bg-neutral-950 xl:w-[280px] xl:max-w-[300px] xl:shrink-0">
            <div className="space-y-3 border-b border-neutral-100 px-3 py-3 dark:border-neutral-800">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search conversations…"
                  className="h-9 rounded-lg pl-8 text-[13px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 xl:grid-cols-1">
                <CommunicationsDropdown
                  value={ownerFilter}
                  onChange={setOwnerFilter}
                  placeholder="Owner"
                  triggerClassName="h-9 rounded-lg text-[12px]"
                  options={[
                    { value: "all", label: "All owners" },
                    ...owners.map((o) => ({
                      value: String(o.id),
                      label: o.name,
                    })),
                  ]}
                />
                <CommunicationsDropdown
                  value={channelNav}
                  onChange={setChannelNav}
                  triggerClassName="h-9 rounded-lg text-[12px] xl:hidden"
                  options={[
                    { value: "all", label: "All channels" },
                    ...COMM_CHANNELS.map((ch) => ({
                      value: ch.id,
                      label: ch.label,
                    })),
                  ]}
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant={unreadFilter ? "default" : "outline"}
                  size="sm"
                  className="h-8 rounded-lg text-[11px]"
                  onClick={() => setUnreadFilter((v) => !v)}
                >
                  Unread only
                </Button>
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  {filtered.length} threads
                </span>
              </div>
            </div>
            <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 py-2">
              {filtered.length === 0 ? (
                <li className="px-2 py-6">
                  <CrmEmptyState
                    title="No conversations"
                    description="Try another folder or filter, or compose a new message."
                    actionLabel="Compose"
                    onAction={() => {
                      setReplyTarget(null);
                      setComposeOpen(true);
                    }}
                  />
                </li>
              ) : (
                filtered.map((conv) => {
                  const Icon = CHANNEL_ICON[conv.channel] || Mail;
                  const owner =
                    owners.find((o) => String(o.id) === String(conv.assigneeId)) ||
                    ownerById(conv.assigneeId);
                  const active = selected?.id === conv.id;
                  return (
                    <li key={conv.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(conv.id)}
                        className={cn(
                          "flex w-full gap-2.5 rounded-xl border border-transparent px-2.5 py-2.5 text-left transition-colors",
                          active
                            ? "border-primary-200/80 bg-primary-50 shadow-sm dark:border-primary-900 dark:bg-primary-950/50"
                            : "hover:bg-neutral-50 dark:hover:bg-neutral-900/50",
                          (conv.unreadCount || 0) > 0 &&
                            !active &&
                            "bg-neutral-50/80 dark:bg-neutral-900/30"
                        )}
                      >
                        <ContactAvatar name={conv.contactName} className="size-10" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <p
                              className={cn(
                                "truncate text-[13px]",
                                (conv.unreadCount || 0) > 0
                                  ? "font-bold"
                                  : "font-semibold"
                              )}
                            >
                              {conv.contactName || conv.contactEmail || "Unknown"}
                            </p>
                            {conv.starred ? (
                              <Star className="size-3 shrink-0 fill-amber-400 text-amber-400" />
                            ) : null}
                          </div>
                          {conv.subject ? (
                            <p className="truncate text-[11px] font-medium text-foreground/80">
                              {conv.subject}
                            </p>
                          ) : null}
                          <p className="line-clamp-1 text-[11px] text-muted-foreground">
                            {conv.lastMessagePreview}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                            <Icon className="size-3" />
                            <span>{formatCommTime(conv.lastMessageAt)}</span>
                            <span>·</span>
                            <span className="truncate">{owner.name}</span>
                          </div>
                        </div>
                        {(conv.unreadCount || 0) > 0 ? (
                          <Badge className="h-5 min-w-5 justify-center rounded-full px-1.5 text-[10px]">
                            {conv.unreadCount}
                          </Badge>
                        ) : null}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </section>

          {/* Thread */}
          <section className="flex min-h-0 min-w-0 flex-1 basis-0 flex-col overflow-hidden bg-neutral-50/50 dark:bg-neutral-900/30">
            {selected ? (
              <>
                <header className="flex w-full shrink-0 flex-wrap items-start justify-between gap-3 border-b border-neutral-100 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-[15px] font-semibold leading-snug">
                        {selected.subject || channelLabel(selected.channel)}
                      </h2>
                      <Badge variant="outline" className="h-5 text-[10px] font-medium">
                        {channelLabel(selected.channel)}
                      </Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-muted-foreground">
                      <ContactAvatar name={selected.contactName} className="size-7 text-[9px]" />
                      <span className="font-medium text-foreground">
                        {selected.contactName}
                      </span>
                      {selected.contactEmail ? (
                        <>
                          <span aria-hidden>·</span>
                          <span>{selected.contactEmail}</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 text-[11px]"
                      onClick={() => setAssignOpen(true)}
                    >
                      Assign
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="size-8"
                      onClick={() => patchSelected({ starred: !selected.starred })}
                    >
                      {selected.starred ? (
                        <StarOff className="size-3.5" />
                      ) : (
                        <Star className="size-3.5" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="size-8"
                      onClick={() => patchSelected({ unreadCount: 1 })}
                    >
                      <Mail className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="size-8"
                      onClick={() => patchSelected({ archived: !selected.archived })}
                    >
                      <Archive className="size-3.5" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="size-8"
                          />
                        }
                      >
                        <MoreHorizontal className="size-3.5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setDeletePrompt(selected.id)}>
                          <Trash2 className="size-3.5" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </header>
                <div className="flex min-h-0 w-full min-w-0 flex-1 basis-0 flex-col overflow-x-hidden overflow-y-auto px-4 py-4">
                  <ul className="flex w-full min-w-0 flex-col gap-3 p-0">
                    {(selected.messages || []).map((msg) => {
                      const outbound = msg.direction === "outbound";
                      const senderLabel =
                        msg.senderName ||
                        (outbound ? currentUser.name || "You" : selected.contactName);
                      return (
                        <li
                          key={msg.id}
                          className={cn(
                            "flex w-full max-w-[min(100%,42rem)] shrink-0 gap-2.5",
                            outbound ? "ml-auto flex-row-reverse" : "mr-auto flex-row"
                          )}
                        >
                          <ContactAvatar
                            name={senderLabel}
                            className="mb-0.5 size-8 shrink-0 self-end text-[10px]"
                          />
                          <div
                            className={cn(
                              "min-w-0 rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm",
                              outbound
                                ? "w-fit max-w-full rounded-br-md bg-primary-600 text-white"
                                : "w-full min-w-[12rem] rounded-bl-md border border-neutral-200/80 bg-white text-foreground dark:border-neutral-800 dark:bg-neutral-900"
                            )}
                          >
                            <p
                              className={cn(
                                "text-[10px] font-medium",
                                outbound ? "text-white/85" : "opacity-80"
                              )}
                            >
                              {senderLabel} ·{" "}
                              {format(new Date(msg.createdAt), "MMM d, h:mm a")}
                              {msg.status ? ` · ${msg.status}` : ""}
                            </p>
                            <p className="mt-1 break-words whitespace-pre-wrap">{msg.body}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div className="mt-auto shrink-0 border-t border-neutral-100 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
                  <div className="w-full min-w-0">
                  {selected.channel === "call" ? (
                    <p className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/80 px-3 py-2.5 text-[12px] text-muted-foreground dark:border-neutral-800 dark:bg-neutral-900/40">
                      Call threads are read-only here. Log follow-ups from Activities or compose email.
                    </p>
                  ) : (
                  <>
                  {(commState.templates || []).length > 0 ? (
                    <div className="mb-2">
                      <CommunicationsDropdown
                        value=""
                        onChange={insertReplyTemplate}
                        placeholder="Insert template…"
                        triggerClassName="h-9 w-full rounded-lg"
                        options={(commState.templates || []).map((t) => ({
                          value: t.id,
                          label: t.name,
                        }))}
                      />
                    </div>
                  ) : null}
                  <CommunicationsMessageEditor
                    key={selected.id}
                    className="w-full max-w-none"
                    value={replyBody}
                    onChange={setReplyBody}
                    minHeight={120}
                    placeholder="Write a reply…"
                    onAttach={() => toast.message("File attachments coming soon")}
                  />
                  </>
                  )}
                  {selected.channel !== "call" ? (
                  <div className="mt-2 flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!canSendEmail}
                      onClick={() => {
                        setReplyTarget(null);
                        setComposeForward(selected);
                        setComposeOpen(true);
                      }}
                    >
                      Forward
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="bg-primary-600 text-white hover:bg-primary-700"
                      disabled={!canSendEmail || replySending}
                      onClick={sendReply}
                    >
                      <Send className="size-3.5" />
                      {replySending ? "Sending…" : "Send"}
                    </Button>
                  </div>
                  ) : null}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center p-8">
                <CrmEmptyState
                  title="No thread selected"
                  description="Choose a conversation from the list to read and reply."
                />
              </div>
            )}
          </section>

          {/* Thread details */}
          <aside className="hidden min-h-0 w-[17rem] shrink-0 flex-col overflow-hidden border-l border-neutral-100 bg-white dark:border-neutral-800 dark:bg-neutral-950 xl:flex">
            {selected ? (
              <>
                <div className="shrink-0 border-b border-neutral-100 bg-gradient-to-b from-primary-50/50 to-white px-4 pb-4 pt-4 dark:border-neutral-800 dark:from-primary-950/25 dark:to-neutral-950">
                  <ContactAvatar
                    name={selected.contactName}
                    className="size-14 text-sm shadow-sm"
                  />
                  <h3 className="mt-3 text-[15px] font-semibold leading-snug text-foreground">
                    {selected.contactName || "Unknown contact"}
                  </h3>
                  {selected.jobTitle ? (
                    <p className="mt-0.5 text-[12px] text-muted-foreground">{selected.jobTitle}</p>
                  ) : null}
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="h-6 gap-1 text-[10px] font-medium">
                      {(() => {
                        const Icon = CHANNEL_ICON[selected.channel] || Mail;
                        return <Icon className="size-3" />;
                      })()}
                      {channelLabel(selected.channel)}
                    </Badge>
                    {selected.starred ? (
                      <Badge className="h-6 gap-1 bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                        <Star className="size-3 fill-current" />
                        Starred
                      </Badge>
                    ) : null}
                    {selected.awaitingResponse ? (
                      <Badge
                        variant="secondary"
                        className="h-6 text-[10px]"
                      >
                        Awaiting reply
                      </Badge>
                    ) : null}
                    {(selected.unreadCount || 0) > 0 ? (
                      <Badge className="h-6 text-[10px]">
                        {selected.unreadCount} unread
                      </Badge>
                    ) : null}
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
                  <div className="mb-3 flex items-center gap-2 rounded-lg bg-neutral-50 px-2.5 py-2 text-[11px] text-muted-foreground dark:bg-neutral-900/60">
                    <Clock className="size-3.5 shrink-0" aria-hidden />
                    <span>
                      Last activity{" "}
                      <span className="font-medium text-foreground">
                        {formatCommTime(selected.lastMessageAt)}
                      </span>
                    </span>
                  </div>

                  <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Contact
                  </p>
                  <div className="space-y-1 rounded-xl border border-neutral-200/80 bg-neutral-50/40 p-2 dark:border-neutral-800 dark:bg-neutral-900/30">
                    <ThreadDetailRow
                      icon={Mail}
                      label="Email"
                      value={selected.contactEmail}
                      href={
                        selected.contactEmail
                          ? `mailto:${selected.contactEmail}`
                          : undefined
                      }
                    />
                    <ThreadDetailRow icon={Phone} label="Phone" value={selected.phone} />
                  </div>

                  <p className="mb-2 mt-4 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Related
                  </p>
                  <div className="space-y-1 rounded-xl border border-neutral-200/80 bg-neutral-50/40 p-2 dark:border-neutral-800 dark:bg-neutral-900/30">
                    <ThreadDetailRow
                      icon={Building2}
                      label="Company"
                      value={selected.companyName}
                      href={
                        selected.companyId
                          ? `/companies/${selected.companyId}`
                          : selected.companyName
                            ? "/companies"
                            : undefined
                      }
                    />
                    <ThreadDetailRow
                      icon={Briefcase}
                      label="Deal"
                      value={selected.dealName}
                      href={
                        selected.dealId ? `/deals/${selected.dealId}` : undefined
                      }
                    />
                  </div>

                  <p className="mb-2 mt-4 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Assignment
                  </p>
                  <div className="flex items-center gap-2.5 rounded-xl border border-neutral-200/80 bg-neutral-50/40 px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-900/30">
                    <ContactAvatar
                      name={
                        owners.find((o) => String(o.id) === String(selected.assigneeId))
                          ?.name || ownerById(selected.assigneeId).name
                      }
                      className="size-9 text-[10px]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Owner
                      </p>
                      <p className="truncate text-[12px] font-medium">
                        {owners.find((o) => String(o.id) === String(selected.assigneeId))?.name ||
                          ownerById(selected.assigneeId).name}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 shrink-0 text-[11px]"
                      onClick={() => setAssignOpen(true)}
                    >
                      Change
                    </Button>
                  </div>
                </div>

                <div className="shrink-0 space-y-2 border-t border-neutral-100 bg-neutral-50/50 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
                  <Button
                    type="button"
                    className="h-9 w-full rounded-lg bg-primary-600 text-white hover:bg-primary-700"
                    onClick={() =>
                      router.push(
                        selected.contactId ? `/contacts/${selected.contactId}` : "/contacts"
                      )
                    }
                  >
                    <UserRound className="size-3.5" />
                    View contact
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-lg text-[11px]"
                      onClick={() =>
                        router.push(
                          selected.companyId
                            ? `/companies/${selected.companyId}`
                            : "/companies"
                        )
                      }
                    >
                      <Building2 className="size-3.5" />
                      Company
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-lg text-[11px]"
                      onClick={() =>
                        router.push(activitiesCreateUrlFromConversation(selected, "email"))
                      }
                    >
                      <ListTodo className="size-3.5" />
                      Task
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
                <UserRound className="size-8 text-muted-foreground/50" aria-hidden />
                <p className="text-[12px] text-muted-foreground">
                  Select a conversation to see contact and deal context.
                </p>
              </div>
            )}
          </aside>
        </CardContent>
      </Card>

      <CommunicationsComposeDrawer
        open={composeOpen}
        onOpenChange={(open) => {
          setComposeOpen(open);
          if (!open) {
            setComposeForward(null);
            setReplyTarget(null);
          }
        }}
        contacts={contacts}
        companies={companies}
        deals={deals}
        templates={commState.templates}
        settings={commState.settings}
        currentUser={currentUser}
        replyToConversation={replyTarget}
        forwardFrom={composeForward}
        canSend={canSendEmail}
        onConversationCreated={async (conv) => {
          if (conv?.id) {
            applyConversation(conv);
            setSelectedId(conv.id);
          } else {
            const data = await refreshInbox();
            if (replyTarget?.id && data?.conversations) {
              const updated = data.conversations.find((c) => c.id === replyTarget.id);
              if (updated) applyConversation(updated);
            }
          }
        }}
      />

      <Dialog
        open={assignOpen && Boolean(selected)}
        onOpenChange={(open) => setAssignOpen(open)}
      >
        <DialogContent title="Assign owner" onClose={() => setAssignOpen(false)}>
          <DialogBody>
            <CommunicationsDropdown
              value={selected?.assigneeId || "none"}
              onChange={(v) => {
                patchSelected({ assigneeId: v === "none" ? null : v });
                setAssignOpen(false);
                toast.success("Owner updated");
              }}
              placeholder="Select owner"
              options={[
                { value: "none", label: "Unassigned" },
                ...owners.map((o) => ({
                  value: String(o.id),
                  label: o.name,
                })),
              ]}
            />
          </DialogBody>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deletePrompt)}
        onOpenChange={(open) => {
          if (!open && !deletingConversation) setDeletePrompt(null);
        }}
      >
        <DialogContent maxWidth={440}>
          <DialogBody className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive ring-1 ring-destructive/15">
                <TriangleAlert className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <h2 className={crmType.dialogTitle}>Delete conversation?</h2>
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
                disabled={deletingConversation}
                onClick={() => setDeletePrompt(null)}
              >
                <X className="size-4" />
              </Button>
            </div>
            <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/80 px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-900/40">
              <p className="text-[13px] font-semibold text-foreground">
                {deleteConversationTarget?.subject ||
                  channelLabel(deleteConversationTarget?.channel) ||
                  "Conversation"}
              </p>
              {deleteConversationTarget?.contactName ? (
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  {deleteConversationTarget.contactName}
                  {deleteConversationTarget.contactEmail
                    ? ` · ${deleteConversationTarget.contactEmail}`
                    : ""}
                </p>
              ) : null}
              <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
                The full message history for this thread will be removed from your workspace
                inbox.
              </p>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={deletingConversation}
              onClick={() => setDeletePrompt(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deletingConversation}
              onClick={handleDelete}
            >
              {deletingConversation ? "Deleting…" : "Delete conversation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
