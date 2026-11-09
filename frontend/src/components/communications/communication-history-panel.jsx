"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mail, Phone } from "lucide-react";

import {
  channelLabel,
  formatCommTime,
  conversationsForContact,
} from "@/components/communications/communications-data";
import { fetchCommunicationsState } from "@/components/communications/communications-api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CHANNEL_ICON = {
  email: Mail,
  call: Phone,
};

export function CommunicationHistoryPanel({ contact }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchCommunicationsState()
      .then((data) => {
        if (!cancelled) {
          setConversations(data.conversations || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [contact?.id]);

  const rows = conversationsForContact(conversations, contact);

  if (loading) {
    return (
      <p className="py-8 text-center text-[13px] text-muted-foreground" aria-busy="true">
        Loading conversations…
      </p>
    );
  }

  if (!rows.length) {
    return (
      <p className="py-8 text-center text-[13px] text-muted-foreground">
        No linked conversations yet. Messages sent from Communications will appear here.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {rows.map((conv) => {
        const Icon = CHANNEL_ICON[conv.channel] || Mail;
        return (
          <li
            key={conv.id}
            className="rounded-xl border border-neutral-200/80 px-3 py-2.5 dark:border-neutral-800"
          >
            <div className="flex items-start gap-2">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                <Icon className="size-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold">
                  {conv.subject || channelLabel(conv.channel)}
                </p>
                <p className="mt-0.5 line-clamp-2 text-[12px] text-muted-foreground">
                  {conv.lastMessagePreview}
                </p>
                <p className={cn("mt-1 text-[11px] text-muted-foreground")}>
                  {channelLabel(conv.channel)} · {formatCommTime(conv.lastMessageAt)}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-2 h-7 rounded-md text-[11px]"
              render={<Link href={`/communications?conversation=${conv.id}`} />}
            >
              Open in Communications
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
