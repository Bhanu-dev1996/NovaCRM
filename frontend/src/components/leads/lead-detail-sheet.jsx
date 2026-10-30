"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  Mail,
  Phone,
  Sparkles,
  StickyNote,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetBody,
  SheetContent,
} from "@/components/ui/sheet";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  LEAD_ACTIVITY,
  LEAD_AI_INSIGHTS,
  LEAD_STATUS_STYLES,
  fullName,
  ownerById,
  scoreTone,
} from "@/components/leads/leads-data";
import { cn } from "@/lib/utils";

export function LeadDetailSheet({
  open,
  onOpenChange,
  lead,
  onEdit,
  onConvert,
  onMarkLost,
  onUpdateNotes,
  owners,
}) {
  const [tab, setTab] = useState("overview");
  const [noteDraft, setNoteDraft] = useState("");

  const owner = useMemo(
    () => (lead ? ownerById(lead.ownerId, owners) : null),
    [lead, owners]
  );
  const activity = useMemo(() => {
    if (!lead) return [];
    return LEAD_ACTIVITY[lead.id] || LEAD_ACTIVITY.default;
  }, [lead]);

  if (!lead) return null;

  function handleAddNote() {
    if (!noteDraft.trim()) return;
    onUpdateNotes?.(lead.id, noteDraft.trim());
    setNoteDraft("");
    toast.success("Note added");
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title={fullName(lead)}
        description={`${lead.title} · ${lead.company}`}
        onClose={() => onOpenChange?.(false)}
        className="max-w-[760px]"
      >
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3">
          <Badge
            variant="outline"
            className={cn("h-auto border-transparent", LEAD_STATUS_STYLES[lead.status])}
          >
            {lead.status}
          </Badge>
          <Badge variant="secondary" className="h-auto gap-1.5">
            <span className={cn("size-1.5 rounded-full", scoreTone(lead.score))} />
            Score {lead.score}
          </Badge>
          <span className="text-[12px] text-muted-foreground">
            Owner · {owner?.name}
          </span>
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onMarkLost}
              disabled={lead.status === "Lost"}
            >
              Mark as Lost
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onEdit}>
              Edit Lead
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={onConvert}
              disabled={lead.status === "Converted"}
            >
              Convert Lead
            </Button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden xl:flex-row">
          <SheetBody className="min-h-0 flex-1 space-y-4">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList variant="line" className="w-full justify-start">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="related">Related Records</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <InfoCard title="Contact details">
                    <InfoRow icon={Mail} label="Email" value={lead.email} />
                    <InfoRow
                      icon={Phone}
                      label="Phone"
                      value={lead.phone || "—"}
                    />
                    <InfoRow
                      icon={CalendarDays}
                      label="Created"
                      value={lead.createdAt}
                    />
                  </InfoCard>
                  <InfoCard title="Company information">
                    <InfoRow label="Company" value={lead.company} />
                    <InfoRow label="Job title" value={lead.title} />
                    <InfoRow label="Industry" value={lead.industry} />
                  </InfoCard>
                  <InfoCard title="Qualification">
                    <InfoRow label="Source" value={lead.source} />
                    <InfoRow label="Status" value={lead.status} />
                    <InfoRow label="Lead score" value={String(lead.score)} />
                    <InfoRow
                      label="Last contacted"
                      value={lead.lastContacted || "Never"}
                    />
                  </InfoCard>
                  <InfoCard title="Notes">
                    <p className="text-[13px] leading-5 text-muted-foreground">
                      {lead.notes || "No notes yet."}
                    </p>
                  </InfoCard>
                </div>
              </TabsContent>

              <TabsContent value="activity" className="mt-4">
                <ul className="space-y-3">
                  {activity.map((item) => (
                    <li key={item.id}>
                      <Card size="sm" className="py-3">
                        <CardContent className="px-3.5">
                          <p className="text-[13px] font-semibold">
                            {item.title}
                          </p>
                          <p className="mt-1 text-[12px] text-muted-foreground">
                            {item.actor} · {item.time}
                          </p>
                        </CardContent>
                      </Card>
                    </li>
                  ))}
                </ul>
              </TabsContent>

              <TabsContent value="notes" className="mt-4 space-y-3">
                <Card size="sm">
                  <CardHeader className="px-3.5 pb-0">
                    <CardTitle className="flex items-center gap-2 text-[12px] text-muted-foreground">
                      <StickyNote className="size-3.5" />
                      Existing notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3.5">
                    <p className="text-[13px] leading-5">
                      {lead.notes || "No notes yet."}
                    </p>
                  </CardContent>
                </Card>
                <Textarea
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  rows={4}
                  placeholder="Add a new note…"
                />
                <Button type="button" onClick={handleAddNote}>
                  Add Note
                </Button>
              </TabsContent>

              <TabsContent value="related" className="mt-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <RelatedCard title="Company" value={lead.company} />
                  <RelatedCard title="Owner" value={owner?.name || "—"} />
                  <RelatedCard
                    title="Deals"
                    value={
                      lead.status === "Converted"
                        ? "1 open opportunity"
                        : "None yet"
                    }
                  />
                  <RelatedCard
                    title="Tasks"
                    value={
                      lead.lastContacted
                        ? "1 follow-up scheduled"
                        : "No open tasks"
                    }
                  />
                </div>
              </TabsContent>
            </Tabs>
          </SheetBody>

          <Separator orientation="vertical" className="hidden xl:block" />
          <aside className="w-full shrink-0 space-y-4 border-t border-border p-4 xl:w-[260px] xl:border-t-0">
            <Card size="sm">
              <CardHeader className="px-3 pb-0">
                <CardTitle className="text-[12px]">Upcoming tasks</CardTitle>
              </CardHeader>
              <CardContent className="px-3">
                <p className="text-[12px] leading-5 text-muted-foreground">
                  {lead.lastContacted
                    ? "Follow up on pricing discussion within 48 hours."
                    : "Schedule first outreach call."}
                </p>
              </CardContent>
            </Card>
            <Card
              size="sm"
              className="border-primary-100 bg-primary-50/40 ring-primary-100 dark:border-primary-900 dark:bg-primary-950/30 dark:ring-primary-900"
            >
              <CardHeader className="px-3 pb-0">
                <CardTitle className="flex items-center gap-1.5 text-[12px] text-primary-700 dark:text-primary-300">
                  <Sparkles className="size-3.5" />
                  AI recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 px-3">
                {LEAD_AI_INSIGHTS.slice(0, 2).map((insight) => (
                  <div key={insight.id}>
                    <p className="text-[12px] leading-5 text-muted-foreground">
                      {insight.body}
                    </p>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="mt-1 h-auto px-0"
                      onClick={() =>
                        toast.message(insight.action, {
                          description: insight.body,
                        })
                      }
                    >
                      {insight.action}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </aside>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function InfoCard({ title, children }) {
  return (
    <Card size="sm">
      <CardHeader className="px-3.5 pb-0">
        <CardTitle className="text-[12px]">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5 px-3.5">{children}</CardContent>
    </Card>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      {Icon ? <Icon className="mt-0.5 size-3.5 text-muted-foreground" /> : null}
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="truncate text-[13px] font-medium">{value}</p>
      </div>
    </div>
  );
}

function RelatedCard({ title, value }) {
  return (
    <Card size="sm" className="py-3">
      <CardContent className="px-3.5">
        <p className="text-[11px] text-muted-foreground">{title}</p>
        <p className="mt-1 text-[13px] font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
