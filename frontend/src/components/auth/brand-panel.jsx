"use client";

import {
  BrainCircuit,
  Building2,
  Database,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";

import { NovaLogo } from "@/components/auth/nova-logo";

const FEATURES = [
  {
    icon: TrendingUp,
    title: "Smarter Sales",
    description: "Predictive lead scoring & automated capture.",
  },
  {
    icon: Database,
    title: "Unified Data",
    description: "360° timeline across email, calls, and meetings.",
  },
  {
    icon: BrainCircuit,
    title: "AI-Powered Insights",
    description: "Deal risk alerts & autonomous win-rate forecasts.",
  },
];

const COLUMNS = [
  {
    id: "qualify",
    title: "Qualify",
    count: 8,
    accent: "bg-tertiary-400",
    deals: [
      {
        name: "Acme Cloud",
        value: "$48.2k",
        score: "94%",
        tone: "text-emerald-300",
      },
      {
        name: "Northwind",
        value: "$22.0k",
        score: "81%",
        tone: "text-emerald-300",
      },
    ],
  },
  {
    id: "negotiate",
    title: "Negotiate",
    count: 5,
    accent: "bg-secondary-400",
    deals: [
      {
        name: "Orbit Labs",
        value: "$91.5k",
        score: "76%",
        tone: "text-amber-300",
      },
      {
        name: "Helio CRM",
        value: "$36.4k",
        score: "68%",
        tone: "text-amber-300",
      },
    ],
  },
  {
    id: "closed",
    title: "Closed-Won",
    count: 3,
    accent: "bg-emerald-400",
    deals: [
      {
        name: "Vertex AI",
        value: "$120k",
        score: "Won",
        tone: "text-emerald-300",
      },
    ],
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

function DealChip({ name, value, score, tone, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-lg border border-white/12 bg-white/[0.08] p-2.5 shadow-[0_8px_20px_rgba(0,0,0,0.22)] backdrop-blur-md"
    >
      <div className="flex items-center gap-2">
        <div className="flex size-5 shrink-0 items-center justify-center rounded-md bg-primary-500/30">
          <Building2 className="size-3 text-primary-200" />
        </div>
        <p className="truncate text-[11px] font-semibold text-white">{name}</p>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[12px] font-semibold tracking-tight text-white">
          {value}
        </span>
        <span className={`text-[10px] font-medium ${tone}`}>{score}</span>
      </div>
    </motion.div>
  );
}

function PipelineKanbanPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full overflow-hidden rounded-2xl border border-white/12 bg-white/[0.07] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.4)] backdrop-blur-2xl"
    >
      <div className="pointer-events-none absolute -top-14 right-0 size-40 rounded-full bg-secondary-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-6 size-40 rounded-full bg-primary-500/25 blur-3xl" />

      <div className="relative mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-medium tracking-[0.14em] text-white/45 uppercase">
            Live pipeline
          </p>
          <p className="mt-1 text-[13px] font-semibold text-white">
            Enterprise deals this week
          </p>
        </div>
        <div className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-500/15 px-2.5 py-1">
          <motion.span
            animate={{ opacity: [1, 0.35, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="size-1.5 rounded-full bg-emerald-400"
          />
          <span className="text-[11px] font-medium text-emerald-200">
            Syncing
          </span>
        </div>
      </div>

      <div className="relative grid grid-cols-3 gap-4">
        {COLUMNS.map((column, columnIndex) => (
          <div
            key={column.id}
            className="min-w-0 rounded-xl border border-white/8 bg-black/20 p-2"
          >
            <div className="mb-2 flex items-center justify-between gap-1 px-0.5">
              <div className="flex min-w-0 items-center gap-1.5">
                <span
                  className={`size-1.5 shrink-0 rounded-full ${column.accent}`}
                />
                <p className="truncate text-[11px] font-semibold text-white/85">
                  {column.title}
                </p>
              </div>
              <span className="rounded-md bg-white/8 px-1.5 py-0.5 text-[10px] font-medium text-white/55">
                {column.count}
              </span>
            </div>

            <div className="space-y-1">
              {column.deals.map((deal, dealIndex) => (
                <motion.div
                  key={deal.name}
                  animate={{ y: [0, columnIndex === 1 ? -4 : -3, 0] }}
                  transition={{
                    duration: 3.8 + columnIndex * 0.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: dealIndex * 0.35 + columnIndex * 0.2,
                  }}
                >
                  <DealChip
                    {...deal}
                    delay={0.3 + columnIndex * 0.1 + dealIndex * 0.06}
                  />
                </motion.div>
              ))}

              {column.id === "negotiate" ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.4, 0.95, 0.4] }}
                  transition={{
                    duration: 2.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1,
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-secondary-400/35 bg-secondary-500/10 px-2 py-2"
                >
                  <Sparkles className="size-3 text-secondary-300" />
                  <span className="text-[10px] font-medium text-secondary-200">
                    AI moving deal…
                  </span>
                </motion.div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export function BrandPanel() {
  return (
    <aside className="relative hidden h-dvh overflow-hidden bg-[#0b0620] text-white desktop:sticky desktop:top-0 desktop:flex desktop:flex-col">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_12%_8%,rgba(109,40,217,0.5),transparent_55%),radial-gradient(ellipse_65%_45%_at_88%_18%,rgba(67,56,202,0.38),transparent_50%),radial-gradient(ellipse_55%_40%_at_40%_95%,rgba(37,99,235,0.22),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.22] [background-image:radial-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:22px_22px]" />

      <div className="relative z-10 flex h-full min-h-0 w-full flex-col gap-6 px-8 py-7 wide:px-10">
        <div className="w-full shrink-0 space-y-5">
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="self-start"
          >
            <NovaLogo />
          </motion.div>

          <motion.div
            custom={0.1}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="w-full"
          >
            <h1 className="text-[30px] leading-[1.15] font-bold tracking-[-0.03em] text-white">
              Turn every relationship into an opportunity.
            </h1>
            <p className="mt-3 text-[14px] leading-6 text-white/60">
              Manage leads, close deals, and grow your business with an
              intelligent CRM built for modern teams.
            </p>
          </motion.div>
        </div>

        <div className="flex min-h-0 w-full flex-1 flex-col justify-center overflow-hidden py-1">
          <PipelineKanbanPreview />
        </div>

        <motion.div
          custom={0.3}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="grid w-full shrink-0 grid-cols-3 gap-5 border-t border-white/10 pt-5"
        >
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="min-w-0">
              <div className="mb-2.5 flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                <Icon className="size-3.5 text-primary-300" strokeWidth={2} />
              </div>
              <p className="text-[13px] font-semibold text-white">{title}</p>
              <p className="mt-1 text-[12px] leading-5 text-white/50">
                {description}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </aside>
  );
}
