"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Suspense, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  BarChart3,
  Bell,
  Bot,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  CircleDollarSign,
  FolderKanban,
  Headphones,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  Megaphone,
  Menu,
  Moon,
  Plus,
  Search,
  Settings,
  Sparkles,
  Sun,
  UserPlus,
  UserRound,
  Users,
  X,
} from "lucide-react";

import { NovaLogo } from "@/components/auth/nova-logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

const SEARCH_ITEMS = [
  { href: "/", label: "Overview", group: "Workspace", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", group: "Workspace", icon: UserRound },
  { href: "/leads?action=create", label: "Add Lead", group: "Actions", icon: UserPlus },
  { href: "/contacts", label: "Contacts", group: "Workspace", icon: Users },
  { href: "/companies", label: "Companies", group: "Workspace", icon: Building2 },
  { href: "/deals", label: "Deals", group: "Workspace", icon: Briefcase },
  { href: "/deals?action=create", label: "Create Deal", group: "Actions", icon: CircleDollarSign },
  { href: "/activities", label: "Activities", group: "Workspace", icon: Activity },
  { href: "/calendar", label: "Calendar", group: "Workspace", icon: CalendarDays },
  { href: "/calendar?action=schedule", label: "Schedule Meeting", group: "Actions", icon: CalendarDays },
  { href: "/communications", label: "Communications", group: "Engagement", icon: Mail },
  { href: "/marketing", label: "Marketing", group: "Engagement", icon: Megaphone },
  { href: "/support", label: "Support", group: "Engagement", icon: Headphones },
  { href: "/projects", label: "Projects", group: "Engagement", icon: FolderKanban },
  { href: "/ai-center", label: "AI Center", group: "Intelligence", icon: Bot },
  { href: "/reports", label: "Analytics", group: "Intelligence", icon: BarChart3 },
  { href: "/settings", label: "Settings", group: "Account", icon: Settings },
];

const CREATE_ITEMS = [
  { href: "/leads?action=create", label: "Add Lead", icon: UserPlus },
  { href: "/contacts?action=create", label: "Add Contact", icon: Users },
  { href: "/companies?action=create", label: "Add Company", icon: Building2 },
  { href: "/deals?action=create", label: "Create Deal", icon: CircleDollarSign },
  { href: "/calendar?action=schedule", label: "Schedule Meeting", icon: CalendarDays },
];

const NOTIFICATIONS = [
  {
    id: "n1",
    title: "New lead assigned",
    body: "Brightline Media was assigned to you.",
    time: "12m ago",
    href: "/leads?id=brightline-media",
    unread: true,
  },
  {
    id: "n2",
    title: "Deal moved to Proposal",
    body: "Northstar Ltd needs a follow-up.",
    time: "38m ago",
    href: "/deals?id=northstar-ltd",
    unread: true,
  },
  {
    id: "n3",
    title: "Meeting in 1 hour",
    body: "Discovery call with Acme Corp.",
    time: "1h ago",
    href: "/calendar",
    unread: false,
  },
];

const NAV_GROUPS = [
  {
    label: "Workspace",
    items: [
      { href: "/", label: "Overview", icon: LayoutDashboard },
      { href: "/leads", label: "Leads", icon: UserRound },
      { href: "/contacts", label: "Contacts", icon: Users },
      { href: "/companies", label: "Companies", icon: Building2 },
      { href: "/deals", label: "Deals", icon: Briefcase },
      { href: "/activities", label: "Activities", icon: Activity },
      { href: "/calendar", label: "Calendar", icon: CalendarDays },
    ],
  },
  {
    label: "Engagement",
    items: [
      { href: "/communications", label: "Communications", icon: Mail, badge: "3" },
      { href: "/marketing", label: "Marketing", icon: Megaphone },
      { href: "/support", label: "Support", icon: Headphones },
      { href: "/projects", label: "Projects", icon: FolderKanban },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { href: "/ai-center", label: "AI Center", icon: Bot, badge: "NEW", badgeTone: "new" },
      { href: "/reports", label: "Analytics", icon: BarChart3 },
    ],
  },
];

function isActivePath(pathname, href) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

function navGroupsWithLeadsCount(groups, leadsCount) {
  if (leadsCount == null) return groups;
  return groups.map((group) => ({
    ...group,
    items: group.items.map((item) =>
      item.href === "/leads"
        ? { ...item, badge: String(leadsCount) }
        : item
    ),
  }));
}

function NavLink({ item, active, collapsed, onNavigate }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      onClick={onNavigate}
      className={cn(
        "flex h-9 items-center rounded-lg text-[13px] font-medium transition-colors",
        collapsed ? "justify-center px-0" : "gap-3 px-3",
        active
          ? "bg-primary-50 text-primary-700"
          : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
      )}
    >
      <Icon
        className={cn(
          "size-4 shrink-0",
          active ? "text-primary-600" : "text-neutral-400"
        )}
        aria-hidden="true"
      />
      {!collapsed ? (
        <>
          <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
          {item.badge ? (
            <span
              className={cn(
                "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                item.badgeTone === "new"
                  ? "bg-primary-100 text-primary-700"
                  : "bg-neutral-100 text-neutral-600"
              )}
            >
              {item.badge}
            </span>
          ) : null}
        </>
      ) : null}
    </Link>
  );
}

function WorkspaceSwitcher({
  workspace,
  workspaces = [],
  collapsed,
  onSwitch,
  switchingId,
}) {
  const name = workspace?.name || "Workspace";
  const subtitle =
    workspace?.industry ||
    (workspace?.setup_completed ? "Active workspace" : "Setup incomplete");
  const items =
    workspaces.length > 0
      ? workspaces
      : workspace
        ? [{ ...workspace, role: "member" }]
        : [];

  if (collapsed) {
    return (
      <div className="flex justify-center px-3">
        <div className="flex size-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-[11px] font-semibold text-primary-700">
          {name.slice(0, 1).toUpperCase()}
        </div>
      </div>
    );
  }

  return (
    <div className="px-3">
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex h-11 w-full items-center gap-2.5 rounded-xl border border-neutral-200 bg-white px-2.5 text-left shadow-sm transition-colors outline-none hover:bg-neutral-50 focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-[12px] font-bold text-primary-700">
            {name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold text-neutral-900">
              {name}
            </p>
            <p className="truncate text-[10px] text-neutral-400">{subtitle}</p>
          </div>
          <ChevronDown className="size-3.5 shrink-0 text-neutral-400" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          sideOffset={6}
          className="max-h-80 w-(--anchor-width) min-w-0 overflow-y-auto rounded-xl"
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel className="px-2 py-1.5 text-[11px] text-neutral-400">
              Workspaces
            </DropdownMenuLabel>
            {items.map((org) => {
              const active = org.id === workspace?.id;
              const busy = switchingId === org.id;
              return (
                <DropdownMenuItem
                  key={org.id}
                  disabled={active || Boolean(switchingId)}
                  onClick={() => {
                    if (!active) onSwitch?.(org.id);
                  }}
                  className="justify-between gap-2 px-2 py-2 text-[12px]"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-neutral-800">
                      {org.name}
                    </span>
                    {org.industry ? (
                      <span className="block truncate text-[10px] text-neutral-400">
                        {org.industry}
                      </span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-[10px] font-semibold text-primary-600">
                    {busy ? "Switching…" : active ? "Active" : org.role}
                  </span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            render={<Link href="/settings" />}
            className="px-2 py-2 text-[12px]"
          >
            Manage workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function SearchOverlay({ open, onClose, query, setQuery }) {
  const router = useRouter();
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SEARCH_ITEMS;
    return SEARCH_ITEMS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q)
    );
  }, [query]);

  useEffect(() => {
    if (!open) return;
    function onKey(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        type="button"
        className="absolute inset-0 bg-neutral-900/40"
        aria-label="Close search"
        onClick={onClose}
      />
      <div className="relative mx-auto mt-[12vh] w-[min(560px,calc(100%-2rem))] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-950">
        <div className="flex items-center gap-2 border-b border-neutral-100 px-3 dark:border-neutral-800">
          <Search className="size-4 text-neutral-400" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search modules, actions, and records…"
            className="h-12 w-full bg-transparent text-[14px] outline-none placeholder:text-neutral-400"
          />
          <kbd className="rounded-md border border-neutral-200 px-1.5 py-0.5 text-[10px] text-neutral-400 dark:border-neutral-700">
            Esc
          </kbd>
        </div>
        <div className="max-h-[360px] overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="px-3 py-8 text-center text-[13px] text-neutral-400">
              No matches for “{query}”
            </p>
          ) : (
            results.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={`${item.href}-${item.label}`}
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push(item.href);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-neutral-50 dark:hover:bg-neutral-900"
                >
                  <span className="flex size-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium text-neutral-900 dark:text-neutral-50">
                      {item.label}
                    </span>
                    <span className="block text-[11px] text-neutral-400">
                      {item.group}
                    </span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function CreateMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            className="hidden h-9 gap-1.5 rounded-lg bg-primary-600 px-3 text-[13px] font-semibold text-white hover:bg-primary-700 sm:inline-flex"
          />
        }
      >
        <Plus className="size-3.5" />
        Create
        <ChevronDown className="size-3.5 opacity-80" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-56 rounded-xl">
        {CREATE_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <DropdownMenuItem
              key={item.href}
              render={<Link href={item.href} />}
              className="gap-2.5 px-2.5 py-2 text-[13px]"
            >
              <Icon className="size-4 text-primary-600" />
              {item.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationsMenu() {
  const [items, setItems] = useState(NOTIFICATIONS);
  const unread = items.filter((item) => item.unread).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Notifications"
            className="relative"
          />
        }
      >
        <Bell className="size-4" />
        {unread > 0 ? (
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-error ring-2 ring-white dark:ring-neutral-950" />
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[320px] rounded-xl p-0"
      >
        <div className="flex items-center justify-between border-b border-neutral-100 px-3 py-2.5 dark:border-neutral-800">
          <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-50">
            Notifications
          </p>
          <button
            type="button"
            className="text-[11px] font-semibold text-primary-600"
            onClick={() => {
              setItems((prev) =>
                prev.map((item) => ({ ...item, unread: false }))
              );
              toast.success("All notifications marked as read");
            }}
          >
            Mark all read
          </button>
        </div>
        <div className="max-h-[320px] overflow-y-auto p-1">
          {items.map((item) => (
            <DropdownMenuItem
              key={item.id}
              render={<Link href={item.href} />}
              onClick={() => {
                setItems((prev) =>
                  prev.map((row) =>
                    row.id === item.id ? { ...row, unread: false } : row
                  )
                );
              }}
              className="items-start gap-3 px-2 py-2.5"
            >
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-300">
                <CheckCircle2 className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-2">
                  <span className="text-[13px] font-medium text-neutral-900 dark:text-neutral-50">
                    {item.title}
                  </span>
                  {item.unread ? (
                    <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary-600" />
                  ) : null}
                </span>
                <span className="mt-0.5 block text-[12px] text-neutral-500">
                  {item.body}
                </span>
                <span className="mt-1 block text-[11px] text-neutral-400">
                  {item.time}
                </span>
              </span>
            </DropdownMenuItem>
          ))}
        </div>
        <DropdownMenuSeparator className="my-0" />
        <DropdownMenuItem
          render={<Link href="/activities" />}
          className="justify-center rounded-none px-3 py-2.5 text-[12px] font-semibold text-primary-600"
        >
          View all activity
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ProfileMenu({ user, onSignOut }) {
  const initial = (user?.name || user?.email || "U").slice(0, 1).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex size-8 items-center justify-center rounded-full bg-primary-50 text-[12px] font-semibold text-primary-700 ring-1 ring-neutral-200 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-label="Open profile menu"
      >
        {initial}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-56 rounded-xl">
        <div className="px-2 py-2.5">
          <p className="truncate text-[13px] font-semibold text-neutral-900">
            {user?.name || "User"}
          </p>
          <p className="truncate text-[12px] text-neutral-500">{user?.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          render={<Link href="/settings" />}
          className="gap-2 px-2 py-2 text-[13px]"
        >
          <Settings className="size-4 text-neutral-400" />
          Account settings
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onSignOut}
          className="gap-2 px-2 py-2 text-[13px]"
        >
          <LogOut className="size-4 text-neutral-400" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ThemeSwitcher() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <Button type="button" variant="ghost" size="icon" aria-label="Toggle theme">
        <Moon className="size-4" />
      </Button>
    );
  }
  const isDark = resolvedTheme === "dark";
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}

function Sidebar({
  pathname,
  workspace,
  workspaces,
  switchingId,
  onSwitchWorkspace,
  user,
  collapsed,
  onNavigate,
  leadsCount,
}) {
  const navGroups = navGroupsWithLeadsCount(NAV_GROUPS, leadsCount);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden border-r border-neutral-200 bg-[#fbfbfd]">
      <div
        className={cn(
          "flex shrink-0 justify-center px-3",
          collapsed ? "py-3" : "pt-4 pb-1"
        )}
      >
        {collapsed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/nova-mark.svg"
            alt=""
            width={32}
            height={32}
            className="size-8 object-contain"
          />
        ) : (
          <NovaLogo
            variant="light"
            className="w-full gap-2.5 [&_span.font-bold]:text-[16px] [&_p]:mt-0 [&_p]:text-[11px]"
            markClassName="size-9"
          />
        )}
      </div>

      <div className={cn("shrink-0", collapsed ? "mt-3 mb-3" : "mt-5 mb-3")}>
        <WorkspaceSwitcher
          workspace={workspace}
          workspaces={workspaces}
          collapsed={collapsed}
          switchingId={switchingId}
          onSwitch={onSwitchWorkspace}
        />
      </div>

      <div className="min-h-0 flex-1">
        <ScrollArea className="h-full">
          <nav
            className={cn(
              "space-y-5 pb-3",
              collapsed ? "px-2.5 pr-4" : "px-3.5 pr-4"
            )}
          >
            {navGroups.map((group) => (
              <div key={group.label} className="space-y-1">
                {!collapsed ? (
                  <p className="px-3 pb-1 text-[10px] font-semibold tracking-[0.14em] text-neutral-400 uppercase">
                    {group.label}
                  </p>
                ) : null}
                {group.items.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    active={isActivePath(pathname, item.href)}
                    collapsed={collapsed}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            ))}
          </nav>
        </ScrollArea>
      </div>

      <div className="shrink-0 border-t border-neutral-200 px-3 py-2">
        <Link
          href="/settings"
          onClick={onNavigate}
          className={cn(
            "mb-1 flex h-9 items-center rounded-lg text-[13px] font-medium text-neutral-600 hover:bg-neutral-100",
            collapsed ? "justify-center" : "gap-3 px-3"
          )}
        >
          <Settings className="size-4 shrink-0 text-neutral-400" />
          {!collapsed ? "Settings" : null}
        </Link>
        {!collapsed ? (
          <div className="flex h-11 items-center gap-2.5 rounded-xl px-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-[12px] font-semibold text-primary-700">
              {(user?.name || "U").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-semibold text-neutral-900">
                {user?.name || "User"}
              </p>
              <p className="truncate text-[10px] text-neutral-400">
                {user?.job_role || "Head of Revenue"}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-1">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary-50 text-[12px] font-semibold text-primary-700">
              {(user?.name || "U").slice(0, 1).toUpperCase()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function WorkspaceLoader({ className = "min-h-dvh" }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-neutral-50 dark:bg-neutral-950",
        className
      )}
    >
      <Loader2
        className="size-8 animate-spin text-primary-600"
        aria-label="Loading workspace"
        role="status"
      />
    </div>
  );
}

export function AppShell({ children }) {
  return (
    <Suspense fallback={<WorkspaceLoader />}>
      <AppShellContent>{children}</AppShellContent>
    </Suspense>
  );
}

function AppShellContent({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [switchingId, setSwitchingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [leadsCount, setLeadsCount] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      try {
        const [me, ws] = await Promise.all([
          apiFetch("/api/auth/me"),
          apiFetch("/api/workspace"),
        ]);
        if (cancelled) return;
        setUser(me.user);
        setWorkspace(ws.organization);
        setWorkspaces(ws.organizations || []);
      } catch {
        if (!cancelled) router.replace("/login");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    boot();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (loading || !user) return;
    let cancelled = false;
    async function loadLeadsCount() {
      try {
        const response = await apiFetch("/api/leads?count_only=true");
        if (!cancelled) setLeadsCount(response.count ?? 0);
      } catch {
        if (!cancelled) setLeadsCount(null);
      }
    }
    loadLeadsCount();
    return () => {
      cancelled = true;
    };
  }, [loading, user, workspace?.id]);

  useEffect(() => {
    function onLeadsCountChanged(event) {
      const count = event.detail?.count;
      if (typeof count === "number" && Number.isFinite(count)) {
        setLeadsCount(count);
      }
    }
    window.addEventListener("novacrm:leads-count-changed", onLeadsCountChanged);
    return () => {
      window.removeEventListener(
        "novacrm:leads-count-changed",
        onLeadsCountChanged
      );
    };
  }, []);

  async function handleSwitchWorkspace(organizationId) {
    if (!organizationId || switchingId) return;
    setSwitchingId(organizationId);
    try {
      const ws = await apiFetch("/api/workspace/switch", {
        method: "POST",
        body: JSON.stringify({ organization_id: organizationId }),
      });
      setWorkspace(ws.organization);
      setWorkspaces(ws.organizations || []);
      toast.success(`Switched to ${ws.organization?.name || "workspace"}`);
      router.refresh();
    } catch (error) {
      toast.error(error.message || "Could not switch workspace");
    } finally {
      setSwitchingId(null);
    }
  }

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onKeyDown(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    function onWorkspaceUpdated(event) {
      const detail = event.detail || {};
      if (detail.organization) setWorkspace(detail.organization);
      if (detail.organizations) setWorkspaces(detail.organizations);
      if (detail.user) {
        setUser((prev) => ({ ...(prev || {}), ...detail.user }));
      }
    }
    window.addEventListener("novacrm:workspace-updated", onWorkspaceUpdated);
    return () => {
      window.removeEventListener(
        "novacrm:workspace-updated",
        onWorkspaceUpdated
      );
    };
  }, []);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // continue
    }
    window.location.assign("/login");
  }

  function openSearch() {
    setSearchQuery("");
    setSearchOpen(true);
  }

  const ready = !loading && Boolean(user);

  return (
    <div
      className={cn(
        "relative flex min-h-dvh bg-[#f4f5f8]",
        !ready && "h-dvh max-h-dvh overflow-hidden"
      )}
    >
      {!ready ? (
        <WorkspaceLoader className="fixed inset-0 z-50" />
      ) : null}

      <aside
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 transition-[width] duration-200 desktop:flex desktop:flex-col",
          collapsed ? "w-[76px]" : "w-[260px]",
          !ready && "invisible"
        )}
        aria-hidden={!ready}
      >
        <Sidebar
          pathname={pathname}
          workspace={workspace}
          workspaces={workspaces}
          switchingId={switchingId}
          onSwitchWorkspace={handleSwitchWorkspace}
          user={user}
          collapsed={collapsed}
          leadsCount={leadsCount}
        />
      </aside>

      {ready && mobileOpen ? (
        <div className="fixed inset-0 z-50 desktop:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-neutral-900/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex h-full w-[280px] flex-col bg-[#fbfbfd]">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-3 rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
            <Sidebar
              pathname={pathname}
              workspace={workspace}
              workspaces={workspaces}
              switchingId={switchingId}
              onSwitchWorkspace={handleSwitchWorkspace}
              user={user}
              collapsed={false}
              onNavigate={() => setMobileOpen(false)}
              leadsCount={leadsCount}
            />
          </aside>
        </div>
      ) : null}

      <SearchOverlay
        open={ready && searchOpen}
        onClose={() => setSearchOpen(false)}
        query={searchQuery}
        setQuery={setSearchQuery}
      />

      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          !ready && "invisible max-h-dvh overflow-hidden"
        )}
        aria-hidden={!ready}
      >
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-neutral-200/80 bg-white/95 px-4 backdrop-blur-md desktop:px-6">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="desktop:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden shrink-0 desktop:inline-flex"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronsRight className="size-4" />
            ) : (
              <ChevronsLeft className="size-4" />
            )}
          </Button>

          <button
            type="button"
            onClick={openSearch}
            className="relative flex h-9 w-full max-w-[420px] flex-1 items-center rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-left transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
          >
            <Search className="mr-2 size-4 shrink-0 text-neutral-400" />
            <span className="truncate text-[13px] text-neutral-400">
              Search anything…
            </span>
            <kbd className="ml-auto hidden items-center gap-0.5 rounded-md border border-neutral-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-neutral-400 sm:inline-flex dark:border-neutral-700 dark:bg-neutral-950">
              ⌘K
            </kbd>
          </button>

          <div className="ml-auto flex items-center gap-1.5">
            <Button
              type="button"
              className="hidden h-9 gap-1.5 rounded-lg bg-primary-600 px-3 text-[13px] font-semibold text-white hover:bg-primary-700 sm:inline-flex"
              onClick={() => router.push("/ai-center")}
            >
              <Sparkles className="size-3.5" />
              Ask AI
            </Button>
            <CreateMenu />
            <NotificationsMenu />
            <ThemeSwitcher />
            <ProfileMenu user={user} onSignOut={handleSignOut} />
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 desktop:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
