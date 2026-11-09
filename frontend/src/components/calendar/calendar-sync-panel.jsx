"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { GoogleIcon } from "@/components/auth/google-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

function MicrosoftIcon({ className }) {
  return (
    <svg viewBox="0 0 23 23" className={className} aria-hidden="true">
      <path fill="#f35325" d="M1 1h10v10H1z" />
      <path fill="#81bc06" d="M12 1h10v10H12z" />
      <path fill="#05a6f0" d="M1 12h10v10H1z" />
      <path fill="#ffba08" d="M12 12h10v10H12z" />
    </svg>
  );
}

const PROVIDER_META = {
  google: {
    shortLabel: "Google",
    Icon: GoogleIcon,
    iconClassName: "size-[18px]",
    tileClassName: "dark:bg-neutral-950",
  },
  outlook: {
    shortLabel: "Outlook",
    Icon: MicrosoftIcon,
    iconClassName: "size-4",
    tileClassName: "dark:bg-neutral-950",
  },
};

function providerMeta(id) {
  return (
    PROVIDER_META[id] || {
      shortLabel: id,
      Icon: MicrosoftIcon,
      iconClassName: "size-4",
      tileClassName: "",
    }
  );
}

function ProviderSyncRow({ provider, connecting, onConnect }) {
  const meta = providerMeta(provider.id);
  const { Icon } = meta;
  const isConnecting = connecting === provider.id;
  const ready = Boolean(provider.configured);

  return (
    <li
      className={cn(
        "rounded-xl border border-neutral-200/80 bg-neutral-50/60 p-3 dark:border-neutral-800",
        "dark:bg-neutral-900/35"
      )}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-neutral-200/80",
            meta.tileClassName
          )}
        >
          <Icon className={meta.iconClassName} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold text-foreground">
            {provider.label}
          </p>
          <Badge
            variant="outline"
            className={cn(
              "mt-1 h-4 border-0 px-1.5 text-[10px] font-medium",
              ready
                ? "bg-success-surface text-success-text"
                : "bg-muted text-muted-foreground"
            )}
          >
            {ready ? "Ready to connect" : "Not configured"}
          </Badge>
        </div>
      </div>
      {!ready ? (
        <p className="mt-2 text-[10px] leading-snug text-muted-foreground">
          Add client ID and secret in the backend environment.
        </p>
      ) : null}
      <Button
        type="button"
        size="sm"
        variant={ready ? "default" : "outline"}
        className="mt-2.5 h-8 w-full rounded-lg text-[11px]"
        disabled={!ready || isConnecting}
        onClick={() => onConnect(provider.id)}
      >
        {isConnecting ? (
          <>
            <Loader2 className="size-3.5 animate-spin" />
            Redirecting…
          </>
        ) : ready ? (
          `Connect ${meta.shortLabel}`
        ) : (
          "Unavailable"
        )}
      </Button>
    </li>
  );
}

export function CalendarSyncPanel() {
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState([]);
  const [connecting, setConnecting] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await apiFetch("/api/calendar/connections");
        if (!cancelled) setProviders(res.providers || []);
      } catch (error) {
        if (!cancelled) {
          toast.error(error.message || "Could not load calendar sync status");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function connect(providerId) {
    setConnecting(providerId);
    try {
      const res = await apiFetch(`/api/calendar/oauth/${providerId}/start`);
      const url = res.data?.authorize_url;
      if (!url) {
        toast.error("OAuth URL missing");
        return;
      }
      window.location.href = url;
    } catch (error) {
      toast.error(error.message || "Could not start calendar connection");
    } finally {
      setConnecting("");
    }
  }

  return (
    <Card className="rounded-2xl border-neutral-200/80 py-0 shadow-sm dark:border-neutral-800">
      <CardContent className="px-4 py-3.5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
          Calendar sync
        </p>
        <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
          Link Google or Outlook for two-way OAuth sync with CRM meetings.
        </p>

        {loading ? (
          <div
            className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-200/90 py-6 text-[11px] text-muted-foreground dark:border-neutral-800"
            aria-busy="true"
          >
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
            Checking providers…
          </div>
        ) : (
          <ul className="mt-3 space-y-2" aria-label="Calendar providers">
            {providers.map((provider) => (
              <ProviderSyncRow
                key={provider.id}
                provider={provider}
                connecting={connecting}
                onConnect={connect}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
