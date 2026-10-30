"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowLeftRight,
  ArrowUpRight,
  Banknote,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Download,
  Filter,
  Mail,
  MapPin,
  Megaphone,
  Percent,
  Search,
  Shield,
  Sparkles,
  Trophy,
  UserCheck,
  UserPlus,
  UserRound,
  Video,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DateRangePicker,
  formatDateRangeLabel,
  resolveDateRange,
} from "@/components/ui/date-range-picker";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  KPI_CARDS,
  LEAD_SOURCES,
  MY_TASKS,
  NOVA_COPILOT,
  PIPELINE_STAGES,
  RECENT_ACTIVITY,
  REVENUE_METRICS,
  SALES_OWNERS,
  buildRevenueView,
  TEAM_PERFORMANCE,
  TOTAL_LEADS_COUNT,
  UPCOMING_MEETINGS,
} from "@/components/dashboard/dashboard-data";

function greetingForNow() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatCurrencyShort(value) {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  return `$${value}`;
}

function formatCurrencyLegend(value) {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${value.toLocaleString("en-US")}`;
}

function Panel({ className, children }) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-[0_1px_0_rgba(15,23,42,0.02)] dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-none sm:p-5",
        className
      )}
    >
      {children}
    </section>
  );
}

function PanelHeader({ title, subtitle, action }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-50">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-0.5 text-[12px] text-neutral-400">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

function Sparkline({ id, data, positive }) {
  const chartData = data.map((value, index) => ({ index, value }));
  const color = positive ? "#10b981" : "#dc2626";
  const gradientId = `spark-${id}`;
  return (
    <div className="h-8 w-[72px] shrink-0">
      <ResponsiveContainer width={72} height={32}>
        <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            fill={`url(#${gradientId})`}
            strokeWidth={1.75}
            isAnimationActive={false}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function kpiIcon(name) {
  switch (name) {
    case "user-plus":
      return UserPlus;
    case "user-check":
      return UserCheck;
    case "circle-dollar":
      return CircleDollarSign;
    case "wallet":
      return Wallet;
    case "banknote":
      return Banknote;
    case "percent":
      return Percent;
    case "search-chart":
      return Search;
    default:
      return BarChart3;
  }
}

function KpiCard({ card }) {
  const Icon = kpiIcon(card.icon);
  const TrendIcon = card.deltaPositive ? ArrowUpRight : ArrowDownRight;
  const showSpark = !card.hideSpark && card.spark?.length;
  return (
    <div className="flex min-w-0 flex-col rounded-[20px] border border-neutral-200/70 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-medium text-neutral-500 sm:text-[13px] dark:text-neutral-400">
            {card.label}
          </p>
          <p
            title={card.fullValue || card.value}
            className="mt-3 whitespace-nowrap text-[22px] leading-none font-bold tracking-[-0.03em] text-neutral-900 sm:text-[24px] xl:text-[22px] 2xl:text-[26px] dark:text-neutral-50"
          >
            {card.value}
          </p>
        </div>
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full sm:size-8",
            card.iconClass
          )}
        >
          <Icon className="size-3.5 sm:size-4" aria-hidden="true" />
        </span>
      </div>
      <div
        className={cn(
          "mt-auto flex min-w-0 items-end pt-4",
          showSpark ? "justify-between gap-2" : "justify-start"
        )}
      >
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold",
            card.deltaPositive
              ? "bg-[#ECFDF5] text-[#047857] dark:bg-emerald-950 dark:text-emerald-300"
              : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
          )}
        >
          <TrendIcon className="size-3.5 shrink-0" />
          {card.delta}
        </span>
        {showSpark ? (
          <Sparkline
            id={card.id}
            data={card.spark}
            positive={card.deltaPositive}
          />
        ) : null}
      </div>
    </div>
  );
}

function RevenueTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;
  return (
    <div className="rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
      <p className="text-[12px] font-medium text-neutral-500">{point.label}</p>
      <p className="mt-1 text-[18px] font-bold tracking-[-0.02em] text-neutral-900 dark:text-neutral-50">
        ${Number(point.current).toLocaleString("en-US")}
      </p>
      {point.ahead ? (
        <p className="mt-1 text-[12px] font-medium text-emerald-600">
          {point.ahead}
        </p>
      ) : null}
    </div>
  );
}

function activityStyle(type) {
  switch (type) {
    case "lead":
      return {
        Icon: UserPlus,
        className: "bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300",
      };
    case "deal":
      return {
        Icon: ArrowLeftRight,
        className: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
      };
    case "task":
      return {
        Icon: CheckCircle2,
        className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
      };
    case "meeting":
      return {
        Icon: CalendarDays,
        className: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
      };
    case "won":
      return {
        Icon: Trophy,
        className: "bg-teal-500 text-white dark:bg-teal-600",
      };
    default:
      return {
        Icon: BarChart3,
        className: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
      };
  }
}

function copilotActionIcon(name) {
  switch (name) {
    case "mail":
      return Mail;
    case "calendar":
      return CalendarDays;
    case "megaphone":
      return Megaphone;
    default:
      return Sparkles;
  }
}

function SkeletonBlock({ className }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-neutral-200/70 dark:bg-neutral-800",
        className
      )}
    />
  );
}

function SkeletonPanel({ className, children }) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-[0_1px_0_rgba(15,23,42,0.02)] dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-none sm:p-5",
        className
      )}
    >
      {children}
    </section>
  );
}

function KpiSkeleton() {
  return (
    <div className="flex min-w-0 flex-col rounded-[20px] border border-neutral-200/70 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-3">
          <SkeletonBlock className="h-3 w-20" />
          <SkeletonBlock className="h-7 w-24" />
        </div>
        <SkeletonBlock className="size-7 shrink-0 rounded-full sm:size-8" />
      </div>
      <div className="mt-auto flex items-end justify-between gap-2 pt-4">
        <SkeletonBlock className="h-6 w-16 rounded-full" />
        <SkeletonBlock className="h-8 w-[72px]" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[1440px] flex-col gap-5">
      {/* Header — greeting + filters */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2.5">
          <SkeletonBlock className="h-3 w-36" />
          <SkeletonBlock className="h-8 w-56 sm:w-72" />
          <SkeletonBlock className="mt-1 h-4 w-72 max-w-full sm:w-96" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SkeletonBlock className="h-9 w-[168px] rounded-lg" />
          <SkeletonBlock className="h-9 w-[168px] rounded-lg" />
          <SkeletonBlock className="h-9 w-[96px] rounded-lg" />
        </div>
      </div>

      {/* KPI row */}
      <div className="grid w-full min-w-0 grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {KPI_CARDS.map((card) => (
          <KpiSkeleton key={card.id} />
        ))}
      </div>

      {/* Revenue + Pipeline */}
      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <SkeletonPanel className="min-w-0">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <SkeletonBlock className="h-4 w-36" />
                <SkeletonBlock className="h-5 w-28 rounded-full" />
              </div>
              <SkeletonBlock className="h-3 w-56 max-w-full" />
            </div>
            <div className="flex shrink-0 gap-1 rounded-xl border border-neutral-200 bg-neutral-50 p-0.5 dark:border-neutral-700 dark:bg-neutral-900">
              {REVENUE_METRICS.map((metric) => (
                <SkeletonBlock
                  key={metric}
                  className="h-8 w-14 rounded-lg"
                />
              ))}
            </div>
          </div>
          <div className="mb-3 flex w-full flex-wrap items-center justify-between gap-y-2">
            <SkeletonBlock className="h-6 w-36 rounded-lg" />
            <SkeletonBlock className="h-6 w-36 rounded-lg" />
            <SkeletonBlock className="h-6 w-40 rounded-lg" />
          </div>
          <SkeletonBlock className="h-[280px] w-full rounded-2xl" />
        </SkeletonPanel>

        <SkeletonPanel className="min-w-0">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <SkeletonBlock className="h-4 w-44" />
              <SkeletonBlock className="h-3 w-52 max-w-full" />
            </div>
            <SkeletonBlock className="h-3 w-24" />
          </div>
          <div className="space-y-4">
            {PIPELINE_STAGES.map((stage) => (
              <div key={stage.id} className="space-y-2 p-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <SkeletonBlock className="size-2.5 shrink-0 rounded-full" />
                    <SkeletonBlock className="h-3 w-24" />
                    <SkeletonBlock className="h-3 w-14" />
                  </div>
                  <SkeletonBlock className="h-3 w-16" />
                </div>
                <SkeletonBlock className="h-2.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        </SkeletonPanel>
      </div>

      {/* Lead sources + Team performance | Nova Copilot */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]">
        <div className="grid min-w-0 gap-5">
          <SkeletonPanel>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <SkeletonBlock className="h-4 w-28" />
                <SkeletonBlock className="h-3 w-64 max-w-full" />
              </div>
              <SkeletonBlock className="h-3 w-28" />
            </div>
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
              <SkeletonBlock className="size-[200px] shrink-0 rounded-full" />
              <ul className="grid w-full grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                {LEAD_SOURCES.map((source) => (
                  <li
                    key={source.name}
                    className="flex items-center gap-2 px-1 py-1"
                  >
                    <SkeletonBlock className="size-2.5 shrink-0 rounded-full" />
                    <SkeletonBlock className="h-3 min-w-0 flex-1" />
                    <SkeletonBlock className="h-3 w-8" />
                    <SkeletonBlock className="h-3 w-10" />
                  </li>
                ))}
              </ul>
            </div>
          </SkeletonPanel>

          <SkeletonPanel className="overflow-x-auto">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <SkeletonBlock className="h-4 w-48" />
                <SkeletonBlock className="h-3 w-72 max-w-full" />
              </div>
              <SkeletonBlock className="h-3 w-24" />
            </div>
            <div className="w-full min-w-[720px] space-y-0">
              <div className="mb-2.5 flex gap-4 border-b border-neutral-100 pb-2.5 dark:border-neutral-800">
                <SkeletonBlock className="h-3 w-40" />
                <SkeletonBlock className="h-3 w-16" />
                <SkeletonBlock className="h-3 w-16" />
                <SkeletonBlock className="h-3 w-24" />
                <SkeletonBlock className="h-3 w-14" />
              </div>
              {TEAM_PERFORMANCE.map((row) => (
                <div
                  key={row.name}
                  className="flex items-center gap-4 border-b border-neutral-50 py-3.5 last:border-0 dark:border-neutral-900"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <SkeletonBlock className="size-9 shrink-0 rounded-full" />
                    <div className="min-w-0 space-y-1.5">
                      <SkeletonBlock className="h-3 w-28" />
                      <SkeletonBlock className="h-2.5 w-20" />
                    </div>
                  </div>
                  <SkeletonBlock className="h-3 w-8" />
                  <SkeletonBlock className="h-3 w-14" />
                  <div className="flex min-w-[160px] max-w-[220px] flex-1 items-center gap-3">
                    <SkeletonBlock className="h-2 min-w-0 flex-1 rounded-full" />
                    <SkeletonBlock className="h-3 w-10" />
                  </div>
                  <SkeletonBlock className="h-6 w-20 rounded-full" />
                </div>
              ))}
            </div>
          </SkeletonPanel>
        </div>

        <SkeletonPanel className="flex min-h-0 flex-col border-primary-100 dark:border-primary-900 xl:max-h-full">
          <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <SkeletonBlock className="size-4 rounded" />
              <SkeletonBlock className="h-4 w-28" />
            </div>
            <SkeletonBlock className="h-5 w-52 max-w-full rounded-full" />
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            {NOVA_COPILOT.map((item) => (
              <div
                key={item.id}
                className="space-y-2.5 rounded-xl border border-primary-100/80 bg-primary-50/50 p-3.5 dark:border-primary-900 dark:bg-primary-950/30"
              >
                <div className="flex items-center justify-between gap-2">
                  <SkeletonBlock className="h-5 w-24 rounded-md" />
                  <SkeletonBlock className="h-3 w-28" />
                </div>
                <SkeletonBlock className="h-3 w-full" />
                <SkeletonBlock className="h-3 w-[85%]" />
                <SkeletonBlock className="mt-1 h-9 w-full rounded-lg" />
              </div>
            ))}
          </div>
          <SkeletonBlock className="mt-4 h-10 w-full shrink-0 rounded-xl" />
        </SkeletonPanel>
      </div>

      {/* Recent Activity · My Tasks · Upcoming Meetings */}
      <div className="grid items-stretch gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <SkeletonPanel className="flex min-h-0 flex-col">
          <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
            <SkeletonBlock className="h-4 w-32" />
            <SkeletonBlock className="h-3 w-28" />
          </div>
          <div className="space-y-1">
            {RECENT_ACTIVITY.map((item) => (
              <div key={item.id} className="flex gap-3 px-1 py-2.5">
                <SkeletonBlock className="size-9 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <SkeletonBlock className="h-3.5 w-full" />
                  <SkeletonBlock className="h-3 w-36" />
                </div>
              </div>
            ))}
          </div>
        </SkeletonPanel>

        <SkeletonPanel className="flex min-h-0 flex-col">
          <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="h-3 w-24" />
          </div>
          <div className="space-y-2">
            {MY_TASKS.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-2.5 rounded-xl border border-neutral-100 bg-neutral-50/80 px-2.5 py-2 dark:border-neutral-800 dark:bg-neutral-900/50"
              >
                <SkeletonBlock className="size-4 shrink-0 rounded" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <SkeletonBlock className="h-3.5 w-40 max-w-full" />
                  <SkeletonBlock className="h-3 w-28" />
                </div>
                <SkeletonBlock className="h-5 w-10 shrink-0 rounded-md" />
              </div>
            ))}
          </div>
        </SkeletonPanel>

        <SkeletonPanel className="flex min-h-0 flex-col">
          <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
            <SkeletonBlock className="h-4 w-40" />
            <SkeletonBlock className="h-3 w-32" />
          </div>
          <div className="space-y-2">
            {UPCOMING_MEETINGS.map((meeting) => (
              <div
                key={meeting.id}
                className="flex items-center gap-2.5 rounded-xl border border-primary-100/80 bg-primary-50/70 px-2.5 py-2 dark:border-primary-900 dark:bg-primary-950/40"
              >
                <SkeletonBlock className="size-9 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <SkeletonBlock className="h-3.5 w-44 max-w-full" />
                  <SkeletonBlock className="h-3 w-32" />
                </div>
                <SkeletonBlock className="h-5 w-16 shrink-0 rounded-md" />
              </div>
            ))}
          </div>
        </SkeletonPanel>
      </div>
    </div>
  );
}

function EmptyDashboard() {
  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col items-center py-16 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-300">
        <Sparkles className="size-6" />
      </div>
      <h1 className="text-[24px] font-bold tracking-[-0.03em] text-neutral-900 dark:text-neutral-50">
        Your workspace is ready
      </h1>
      <p className="mt-2 text-[14px] leading-6 text-neutral-500">
        Add your first lead or deal to populate pipeline analytics, team
        performance, and AI recommendations.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link
          href="/leads?action=create"
          className="inline-flex h-10 items-center rounded-lg bg-primary-600 px-4 text-[13px] font-semibold text-white hover:bg-primary-700"
        >
          Add Lead
        </Link>
        <Link
          href="/deals?action=create"
          className="inline-flex h-10 items-center rounded-lg border border-neutral-200 bg-white px-4 text-[13px] font-semibold text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
        >
          Create Deal
        </Link>
      </div>
    </div>
  );
}

function ErrorDashboard({ onRetry }) {
  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col items-center py-16 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-error-surface text-error-text">
        <AlertTriangle className="size-6" />
      </div>
      <h1 className="text-[24px] font-bold tracking-[-0.03em] text-neutral-900 dark:text-neutral-50">
        Analytics unavailable
      </h1>
      <p className="mt-2 text-[14px] leading-6 text-neutral-500">
        We couldn&apos;t load your sales overview right now. Check your
        connection and try again.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 inline-flex h-10 items-center rounded-lg bg-primary-600 px-4 text-[13px] font-semibold text-white hover:bg-primary-700"
      >
        Retry
      </button>
    </div>
  );
}

function NoResultsState({ onClear }) {
  return (
    <Panel className="flex flex-col items-center py-14 text-center">
      <Filter className="mb-3 size-8 text-neutral-300" />
      <h2 className="text-[16px] font-semibold text-neutral-900 dark:text-neutral-50">
        No results for these filters
      </h2>
      <p className="mt-1 max-w-[42ch] text-[13px] text-neutral-500">
        Try a wider date range or clear the sales owner filter to see dashboard
        metrics again.
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-5 inline-flex h-9 items-center rounded-lg border border-neutral-200 bg-white px-3 text-[13px] font-semibold text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
      >
        Clear filters
      </button>
    </Panel>
  );
}

function PopulatedDashboard({ firstName, greeting }) {
  const [datePreset, setDatePreset] = useState("Last 30 Days");
  const [dateRangeValue, setDateRangeValue] = useState(() =>
    resolveDateRange("Last 30 Days")
  );
  const [owner, setOwner] = useState(SALES_OWNERS[0]);
  const [revenueMetric, setRevenueMetric] = useState("ARR");
  const [seriesVisible, setSeriesVisible] = useState({
    current: true,
    previous: true,
    nova: true,
  });
  const [completedTasks, setCompletedTasks] = useState({});
  const [noResults, setNoResults] = useState(false);

  const revenueView = useMemo(
    () =>
      buildRevenueView(revenueMetric, datePreset, owner, dateRangeValue),
    [revenueMetric, datePreset, owner, dateRangeValue]
  );

  function toggleTask(id) {
    setCompletedTasks((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleSeries(key) {
    setSeriesVisible((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      // Keep at least one series visible
      if (!next.current && !next.previous && !next.nova) {
        return prev;
      }
      return next;
    });
  }

  function applyDateRange({ preset, range }) {
    setDatePreset(preset);
    setDateRangeValue(range);
    setNoResults(owner === "Riley Chen" && preset === "Last 7 Days");
  }

  function applyOwner(nextOwner) {
    setOwner(nextOwner);
    setNoResults(nextOwner === "Riley Chen" && datePreset === "Last 7 Days");
  }

  function clearFilters() {
    setDatePreset("Last 30 Days");
    setDateRangeValue(resolveDateRange("Last 30 Days"));
    setOwner(SALES_OWNERS[0]);
    setNoResults(false);
  }

  function handleExport() {
    const rangeLabel = formatDateRangeLabel(datePreset, dateRangeValue);
    const rows = [
      ["Metric", "Value", "Change", "Date range", "Sales owner"],
      ...KPI_CARDS.map((card) => [
        card.label,
        card.fullValue || card.value,
        card.delta,
        rangeLabel,
        owner,
      ]),
      [
        `Revenue Overview (${revenueMetric})`,
        formatCurrencyLegend(revenueView.currentTotal),
        `${revenueView.delta} vs prev`,
        rangeLabel,
        owner,
      ],
      ...revenueView.series.map((point) => [
        `${revenueMetric} · ${point.month}`,
        formatCurrencyLegend(point.current),
        point.ahead || "",
        rangeLabel,
        owner,
      ]),
    ];
    const csv = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const fileSlug =
      datePreset === "Custom Range" && dateRangeValue?.from && dateRangeValue?.to
        ? `custom-${format(dateRangeValue.from, "yyyyMMdd")}-${format(dateRangeValue.to, "yyyyMMdd")}`
        : datePreset.toLowerCase().replaceAll(" ", "-");
    link.download = `novacrm-overview-${fileSlug}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Overview report exported");
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[1440px] flex-col gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <nav className="mb-2 flex items-center gap-1.5 text-[12px] text-primary-500/80">
            <span>Workspace</span>
            <span className="text-primary-300">/</span>
            <span className="font-medium text-primary-700 dark:text-primary-300">
              Overview
            </span>
          </nav>
          <h1 className="text-[26px] leading-8 font-bold tracking-[-0.03em] text-neutral-900 sm:text-[28px] dark:text-neutral-50">
            {greeting}, {firstName}
          </h1>
          <p className="mt-1 max-w-[52ch] text-[14px] text-neutral-500">
            Here&apos;s what&apos;s happening with your sales pipeline today.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DateRangePicker
            preset={datePreset}
            range={dateRangeValue}
            onChange={applyDateRange}
          />

          <Select
            value={owner}
            onValueChange={applyOwner}
          >
            <SelectTrigger
              className="h-9 min-w-[10.5rem] max-w-[12rem] rounded-lg border-neutral-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900"
              aria-label="Filter by sales owner"
            >
              <UserRound className="size-3.5 text-neutral-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              align="end"
              alignItemWithTrigger={false}
              sideOffset={8}
              className="min-w-[12rem] p-1.5"
            >
              {SALES_OWNERS.map((name) => (
                <SelectItem key={name} value={name} className="px-2.5 py-1.5">
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleExport}
            className="h-9 rounded-lg border-neutral-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900"
          >
            <Download data-icon="inline-start" className="size-3.5 text-neutral-400" />
            Export
          </Button>
        </div>
      </div>

      {noResults ? (
        <NoResultsState
          onClear={clearFilters}
        />
      ) : (
        <>
          <div className="grid w-full min-w-0 grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {KPI_CARDS.map((card) => (
              <KpiCard key={card.id} card={card} />
            ))}
          </div>

          <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <Panel className="min-w-0">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-50">
                      Revenue Overview
                    </h2>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        revenueView.deltaPositive
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                      )}
                    >
                      {revenueView.delta} vs prev period
                    </span>
                  </div>
                  <p className="mt-0.5 text-[12px] text-neutral-400">
                    {revenueView.subtitle}
                  </p>
                </div>
                <div
                  className="flex shrink-0 rounded-xl border border-neutral-200 bg-neutral-50 p-0.5 dark:border-neutral-700 dark:bg-neutral-900"
                  role="tablist"
                  aria-label="Revenue metric"
                >
                  {REVENUE_METRICS.map((metric) => (
                    <button
                      key={metric}
                      type="button"
                      role="tab"
                      aria-selected={revenueMetric === metric}
                      onClick={() => setRevenueMetric(metric)}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors",
                        revenueMetric === metric
                          ? "bg-primary-600 text-white shadow-sm"
                          : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                      )}
                    >
                      {metric}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-3 flex w-full flex-wrap items-center justify-between gap-y-2 text-[12px] text-neutral-500">
                <button
                  type="button"
                  onClick={() => toggleSeries("current")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-2 py-1 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900",
                    !seriesVisible.current && "opacity-40"
                  )}
                  aria-pressed={seriesVisible.current}
                >
                  <span className="size-2 rounded-full bg-[#6366F1]" />
                  Current ({formatCurrencyLegend(revenueView.currentTotal)})
                </button>
                <button
                  type="button"
                  onClick={() => toggleSeries("previous")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-2 py-1 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900",
                    !seriesVisible.previous && "opacity-40"
                  )}
                  aria-pressed={seriesVisible.previous}
                >
                  <span className="size-2 rounded-full bg-neutral-300 dark:bg-neutral-500" />
                  Previous ({formatCurrencyLegend(revenueView.previousTotal)})
                </button>
                <button
                  type="button"
                  onClick={() => toggleSeries("nova")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-primary-600 transition-colors hover:bg-primary-50 dark:hover:bg-primary-950",
                    !seriesVisible.nova && "opacity-40"
                  )}
                  aria-pressed={seriesVisible.nova}
                >
                  <Sparkles className="size-3.5" />
                  Nova 95% Confidence
                </button>
              </div>

              <div className="h-[280px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={revenueView.series}>
                    <defs>
                      <linearGradient id="revCurrent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366F1" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#6366F1" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      stroke="currentColor"
                      className="text-neutral-200 dark:text-neutral-800"
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "#94a3b8", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#94a3b8", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={formatCurrencyShort}
                      width={42}
                    />
                    <Tooltip
                      content={<RevenueTooltip />}
                      cursor={{
                        stroke: "#6366F1",
                        strokeWidth: 1,
                        strokeDasharray: "4 4",
                      }}
                    />
                    {seriesVisible.current ? (
                      <Area
                        type="monotone"
                        dataKey="current"
                        name={`Current ${revenueMetric}`}
                        stroke="#6366F1"
                        fill="url(#revCurrent)"
                        strokeWidth={2.5}
                        activeDot={{
                          r: 5,
                          fill: "#6366F1",
                          strokeWidth: 2,
                          stroke: "#fff",
                        }}
                      />
                    ) : null}
                    {seriesVisible.previous ? (
                      <Line
                        type="monotone"
                        dataKey="previous"
                        name={`Previous ${revenueMetric}`}
                        stroke="#cbd5e1"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        activeDot={false}
                      />
                    ) : null}
                    {seriesVisible.nova ? (
                      <Line
                        type="monotone"
                        dataKey="nova"
                        name="Nova Confidence"
                        stroke="#818cf8"
                        strokeWidth={1.75}
                        strokeDasharray="2 4"
                        dot={false}
                        activeDot={false}
                      />
                    ) : null}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel className="min-w-0">
              <PanelHeader
                title="Sales Pipeline Funnel"
                subtitle="Stages & conversion volume distribution"
                action={
                  <Link
                    href="/deals"
                    className="text-[12px] font-semibold text-primary-600 hover:text-primary-700"
                  >
                    View Pipeline →
                  </Link>
                }
              />
              <div className="space-y-4">
                {PIPELINE_STAGES.map((stage) => (
                  <Link
                    key={stage.id}
                    href={stage.href}
                    className="block space-y-2 rounded-lg p-1 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900"
                  >
                    <div className="flex items-center justify-between gap-3 text-[13px]">
                      <span className="inline-flex min-w-0 items-center gap-2 font-medium text-neutral-700 dark:text-neutral-200">
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: stage.color }}
                        />
                        {stage.name}
                        <span className="font-normal text-neutral-400">
                          {stage.deals} deals
                        </span>
                      </span>
                      <span className="shrink-0 font-semibold text-neutral-800 dark:text-neutral-100">
                        {stage.value}
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                      <div
                        className="h-full rounded-full transition-[width]"
                        style={{
                          width: `${stage.pct}%`,
                          backgroundColor: stage.color,
                        }}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            </Panel>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]">
            <div className="grid min-w-0 gap-5">
              <Panel>
                <PanelHeader
                  title="Lead Sources"
                  subtitle="Attribution share across all qualified pipeline entries"
                  action={
                    <Link
                      href="/reports?view=lead-sources"
                      className="text-[12px] font-semibold text-primary-600 hover:text-primary-700"
                    >
                      View Full Analytics →
                    </Link>
                  }
                />
                <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
                  <div className="relative h-[200px] w-full max-w-[200px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={LEAD_SOURCES}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={62}
                          outerRadius={88}
                          paddingAngle={2}
                          strokeWidth={0}
                        >
                          {LEAD_SOURCES.map((source) => (
                            <Cell key={source.name} fill={source.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name) => [`${value}%`, name]}
                          contentStyle={{
                            borderRadius: 12,
                            border: "1px solid #e2e8f0",
                            fontSize: 12,
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-[22px] font-bold tracking-[-0.02em] text-neutral-900 dark:text-neutral-50">
                        {TOTAL_LEADS_COUNT.toLocaleString("en-US")}
                      </p>
                      <p className="text-[11px] text-neutral-400">Total Leads</p>
                    </div>
                  </div>
                  <ul className="grid w-full grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                    {LEAD_SOURCES.map((source) => (
                      <li key={source.name}>
                        <Link
                          href={source.href}
                          className="flex items-baseline gap-2 rounded-lg px-1 py-1 text-[13px] hover:bg-neutral-50 dark:hover:bg-neutral-900"
                        >
                          <span
                            className="mt-1.5 size-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: source.color }}
                          />
                          <span className="min-w-0 flex-1 truncate text-neutral-500">
                            {source.name}
                          </span>
                          <span className="shrink-0 font-semibold text-neutral-900 dark:text-neutral-50">
                            {source.value}%
                          </span>
                          <span className="shrink-0 text-neutral-400">
                            ({source.count.toLocaleString("en-US")})
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </Panel>

              <Panel className="overflow-x-auto">
                <PanelHeader
                  title="Sales Team Performance"
                  subtitle="Quota achievement and deal closures by representative."
                  action={
                    <Link
                      href="/reports?view=leaderboard"
                      className="text-[12px] font-semibold text-primary-600 hover:text-primary-700"
                    >
                      Leaderboard →
                    </Link>
                  }
                />
                <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-neutral-100 text-[11px] tracking-wide text-neutral-400 uppercase dark:border-neutral-800">
                      <th className="pb-2.5 pr-6 font-semibold">
                        Sales Representative
                      </th>
                      <th className="pb-2.5 px-4 font-semibold">Deals Won</th>
                      <th className="pb-2.5 px-4 font-semibold">Revenue</th>
                      <th className="pb-2.5 px-6 font-semibold">Quota Target</th>
                      <th className="pb-2.5 pl-6 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TEAM_PERFORMANCE.map((row) => (
                      <tr
                        key={row.name}
                        className="border-b border-neutral-50 last:border-0 dark:border-neutral-900"
                      >
                        <td className="py-3.5 pr-6">
                          <div className="flex items-center gap-3">
                            <span
                              className={cn(
                                "flex size-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                                row.avatarClass
                              )}
                            >
                              {row.initials}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-neutral-900 dark:text-neutral-50">
                                {row.name}
                                {row.you ? (
                                  <span className="font-medium text-neutral-400">
                                    {" "}
                                    (You)
                                  </span>
                                ) : null}
                              </p>
                              <p className="truncate text-[12px] text-neutral-400">
                                {row.role}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-neutral-700 dark:text-neutral-200">
                          {row.dealsWon}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-neutral-700 dark:text-neutral-200">
                          {row.revenue}
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex min-w-[160px] max-w-[220px] items-center gap-3">
                            <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                              <div
                                className={cn("h-full rounded-full", row.barClass)}
                                style={{
                                  width: `${Math.min(row.target, 100)}%`,
                                }}
                              />
                            </div>
                            <span
                              className={cn(
                                "w-10 shrink-0 text-right font-semibold",
                                row.valueClass
                              )}
                            >
                              {row.target}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 pl-6">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap",
                              row.statusClass
                            )}
                          >
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Panel>
            </div>

            <Panel className="flex min-h-0 flex-col border-primary-100 bg-white dark:border-primary-900 dark:bg-neutral-950 xl:max-h-full">
              <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <Sparkles className="size-4 shrink-0 text-primary-600" />
                  <h2 className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-50">
                    Nova Copilot
                  </h2>
                </div>
                <span className="inline-flex rounded-full bg-primary-50 px-2.5 py-1 text-[10px] font-semibold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                  Recommendations Only (Not Automated Actions)
                </span>
              </div>
              <div className="min-h-0 flex-1">
                <ScrollArea className="h-[420px] xl:h-[520px]">
                  <div className="flex flex-col gap-3 pr-3.5 pb-1">
                    {NOVA_COPILOT.map((item) => {
                      const ActionIcon = copilotActionIcon(item.actionIcon);
                      return (
                        <div
                          key={item.id}
                          className="rounded-xl border border-primary-100/80 bg-primary-50/50 p-3.5 dark:border-primary-900 dark:bg-primary-950/30"
                        >
                          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                            <span
                              className={cn(
                                "inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold",
                                item.priorityClass
                              )}
                            >
                              {item.priority}
                            </span>
                            <Link
                              href={item.recordHref}
                              className="inline-flex items-center gap-0.5 text-[12px] font-semibold text-primary-600 hover:text-primary-700"
                            >
                              {item.recordLink}
                              <span aria-hidden="true">→</span>
                            </Link>
                          </div>
                          <p className="text-[13px] leading-5 text-neutral-700 dark:text-neutral-200">
                            {item.body}
                          </p>
                          <Link
                            href={item.href}
                            className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-primary-200 bg-white text-[12px] font-semibold text-primary-700 hover:bg-primary-50 dark:border-primary-800 dark:bg-neutral-950 dark:text-primary-300 dark:hover:bg-primary-950"
                          >
                            <ActionIcon className="size-3.5" />
                            {item.action}
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
              <Link
                href="/ai-center"
                className="mt-4 inline-flex h-10 w-full shrink-0 items-center justify-center rounded-xl bg-primary-600 text-[13px] font-semibold text-white hover:bg-primary-700"
              >
                View All AI Insights →
              </Link>
            </Panel>
          </div>

          <div className="grid items-stretch gap-5 lg:grid-cols-2 xl:grid-cols-3">
            <Panel className="flex min-h-0 flex-col">
              <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
                <h2 className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-50">
                  Recent Activity
                </h2>
                <Link
                  href="/activities"
                  className="text-[12px] font-semibold text-primary-600 hover:text-primary-700"
                >
                  View All Activity →
                </Link>
              </div>
              <ScrollArea className="h-[220px]">
                <ul className="space-y-1 pr-3.5 pb-1">
                  {RECENT_ACTIVITY.map((item) => {
                    const { Icon, className: iconClass } = activityStyle(
                      item.type
                    );
                    return (
                      <li
                        key={item.id}
                        className="flex gap-3 rounded-xl px-1 py-2.5"
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full",
                            iconClass
                          )}
                        >
                          <Icon className="size-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] leading-5 font-medium text-neutral-800 dark:text-neutral-100">
                            {item.title}
                          </p>
                          <p className="mt-0.5 text-[12px] text-neutral-400">
                            {item.meta
                              ? `${item.meta} • ${item.time}`
                              : item.time}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </ScrollArea>
            </Panel>

            <Panel className="flex min-h-0 flex-col">
              <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
                <h2 className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-50">
                  My Tasks
                </h2>
                <Link
                  href="/tasks"
                  className="text-[12px] font-semibold text-primary-600 hover:text-primary-700"
                >
                  View All Tasks →
                </Link>
              </div>
              <ScrollArea className="h-[220px]">
                <ul className="space-y-2 pr-3.5 pb-1">
                  {MY_TASKS.map((task) => {
                    const done = Boolean(completedTasks[task.id]);
                    const priorityClass =
                      task.priority === "HIGH"
                        ? "bg-error-surface text-error-text"
                        : task.priority === "MED"
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                          : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400";
                    const accentClass =
                      task.priority === "HIGH"
                        ? "bg-error-text"
                        : task.priority === "MED"
                          ? "bg-amber-500"
                          : "bg-neutral-300 dark:bg-neutral-600";
                    return (
                      <li
                        key={task.id}
                        className={cn(
                          "relative flex items-center gap-2.5 overflow-hidden rounded-xl border border-neutral-100 bg-neutral-50/80 px-2.5 py-2 dark:border-neutral-800 dark:bg-neutral-900/50",
                          done && "opacity-60"
                        )}
                      >
                        <span
                          className={cn(
                            "absolute inset-y-0 left-0 w-0.5",
                            accentClass
                          )}
                          aria-hidden="true"
                        />
                        <Checkbox
                          checked={done}
                          onCheckedChange={() => toggleTask(task.id)}
                          aria-label={`Mark ${task.title} complete`}
                          className="ml-1 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "truncate text-[13px] font-semibold text-neutral-900 dark:text-neutral-50",
                              done && "text-neutral-400 line-through"
                            )}
                          >
                            {task.title}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-neutral-500 dark:text-neutral-400">
                            <CalendarDays className="size-3 shrink-0" />
                            <span>
                              Due {task.due}
                              {task.company ? ` • ${task.company}` : ""}
                            </span>
                          </p>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                            priorityClass
                          )}
                        >
                          {task.priority}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </ScrollArea>
            </Panel>

            <Panel className="flex min-h-0 flex-col">
              <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
                <h2 className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-50">
                  Upcoming Meetings
                </h2>
                <Link
                  href="/calendar?action=schedule"
                  className="text-[12px] font-semibold text-primary-600 hover:text-primary-700"
                >
                  + Schedule Meeting
                </Link>
              </div>
              <ScrollArea className="h-[220px]">
                <ul className="space-y-2 pr-3.5 pb-1">
                  {UPCOMING_MEETINGS.map((meeting) => {
                    const MeetingIcon =
                      meeting.icon === "shield"
                        ? Shield
                        : meeting.icon === "pin"
                          ? MapPin
                          : Video;
                    return (
                      <li
                        key={meeting.id}
                        className="flex items-center gap-2.5 rounded-xl border border-primary-100/80 bg-primary-50/70 px-2.5 py-2 dark:border-primary-900 dark:bg-primary-950/40"
                      >
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/60">
                          <MeetingIcon className="size-4 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold text-neutral-900 dark:text-neutral-50">
                            {meeting.title}
                          </p>
                          <p className="truncate text-[11px] text-neutral-500 dark:text-neutral-400">
                            {meeting.with} • {meeting.when}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                            meeting.type === "In Person"
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300"
                          )}
                        >
                          {meeting.type}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </ScrollArea>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}

export function DashboardHome() {
  const searchParams = useSearchParams();
  const forcedState = searchParams.get("state");

  const [user, setUser] = useState(null);
  const [greeting, setGreeting] = useState("Welcome");
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    setGreeting(greetingForNow());

    if (forcedState === "loading") {
      setStatus("loading");
      return;
    }
    if (forcedState === "empty") {
      setStatus("empty");
      return;
    }
    if (forcedState === "error") {
      setStatus("error");
      return;
    }

    let cancelled = false;
    async function load() {
      setStatus("loading");
      try {
        const me = await apiFetch("/api/auth/me");
        if (cancelled) return;
        setUser(me.user);
        setStatus("ready");
      } catch {
        if (!cancelled) {
          setUser({ name: "Alex" });
          setStatus(forcedState === "error" ? "error" : "ready");
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [forcedState]);

  if (status === "loading") return <DashboardSkeleton />;
  if (status === "empty") return <EmptyDashboard />;
  if (status === "error") {
    return (
      <ErrorDashboard
        onRetry={() => {
          window.location.href = "/";
        }}
      />
    );
  }

  const firstName = (user?.name || "Alex").split(" ")[0];

  return (
    <PopulatedDashboard firstName={firstName} greeting={greeting} />
  );
}
