"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ActivityDetailPage } from "@/components/activities/activity-detail-page";
import { ActivityFormDrawer } from "@/components/activities/activity-form-drawer";
import {
  fromActivityRow,
  fromTaskRow,
} from "@/components/activities/activities-data";
import {
  fromApiActivity,
  persistActivityMeta,
  toApiActivity,
  toApiTask,
} from "@/components/activities/activity-api";
import { fromApiCompany } from "@/components/companies/company-api";
import {
  fromApiContact,
  mapMemberToOwner,
} from "@/components/contacts/contact-api";
import {
  CONTACT_OWNERS,
  fullName,
} from "@/components/contacts/contacts-data";
import { fromApiDeal } from "@/components/deals/deal-api";
import { fromApiLead } from "@/components/leads/lead-api";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { ActivityDetailSkeleton } from "@/components/activities/activity-skeletons";
import { apiFetch } from "@/lib/api";

export { ActivityDetailSkeleton } from "@/components/activities/activity-skeletons";

export function ActivityDetailView({ activityId, kind = "activity" }) {
  const router = useRouter();
  const [loadStatus, setLoadStatus] = useState("loading");
  const [record, setRecord] = useState(null);
  const [owners, setOwners] = useState(CONTACT_OWNERS);
  const [currentUserId, setCurrentUserId] = useState("");
  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [deals, setDeals] = useState([]);
  const [leads, setLeads] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const isTask = kind === "task";

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [
          ws,
          entityRes,
          contactList,
          companyList,
          dealList,
          leadList,
          members,
        ] = await Promise.all([
          apiFetch("/api/workspace"),
          apiFetch(
            isTask ? `/api/tasks/${activityId}` : `/api/activities/${activityId}`
          ),
          apiFetch("/api/contacts?order_by=created_at&limit=300"),
          apiFetch("/api/companies?order_by=name&limit=300"),
          apiFetch("/api/deals?order_by=created_at&limit=300"),
          apiFetch("/api/leads?order_by=created_at&limit=300"),
          apiFetch("/api/workspace/members"),
        ]);
        if (cancelled) return;
        const mappedOwners = (members.data || []).map(mapMemberToOwner);
        setOwners(mappedOwners.length ? mappedOwners : CONTACT_OWNERS);
        setCurrentUserId(ws.user?.id || "");
        setContacts((contactList.data || []).map((r) => fromApiContact(r)));
        setCompanies((companyList.data || []).map((r) => fromApiCompany(r)));
        setDeals((dealList.data || []).map((r) => fromApiDeal(r)));
        setLeads((leadList.data || []).map((r) => fromApiLead(r)));

        const row = entityRes.data;
        if (isTask) {
          setRecord(fromTaskRow(row));
        } else {
          const parsed = fromApiActivity(row);
          setRecord({
            ...fromActivityRow(row),
            body: parsed.body,
            meta: {
              emailTo: parsed.emailTo,
              direction: parsed.direction,
              outcome: parsed.outcome,
              visibility: parsed.visibility,
            },
          });
        }
        setLoadStatus("ready");
      } catch (error) {
        if (!cancelled) {
          toast.error(error.message || "Activity not found");
          setLoadStatus("error");
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [activityId, isTask, refreshKey]);

  const lookups = useMemo(
    () => ({ contacts, companies, deals, leads, fullName }),
    [contacts, companies, deals, leads]
  );

  async function handleMarkComplete() {
    if (!record) return;
    try {
      if (record.recordKind === "task") {
        await apiFetch(`/api/tasks/${record.id}`, {
          method: "PATCH",
          body: JSON.stringify(
            toApiTask({
              title: record.subject,
              status: "done",
              priority: record.priority,
              dueAt: record.dueAt,
              assigneeId: record.assigneeId,
              contactId: record.relatedContactId,
              companyId: record.relatedCompanyId,
              dealId: record.relatedDealId,
              leadId: record.relatedLeadId,
            })
          ),
        });
      } else {
        const payload = toApiActivity({
          ...fromApiActivity(record.raw || record),
          status: "Completed",
          completedAt: new Date().toISOString(),
        });
        const response = await apiFetch(`/api/activities/${record.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        persistActivityMeta(fromApiActivity(response.data));
      }
      toast.success("Marked complete");
      setRefreshKey((key) => key + 1);
    } catch (error) {
      toast.error(error.message || "Could not update");
    }
  }

  async function handleCancel() {
    if (!record || record.recordKind === "task") return;
    try {
      const payload = toApiActivity({
        ...fromApiActivity(record.raw || record),
        status: "Cancelled",
      });
      await apiFetch(`/api/activities/${record.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      toast.success("Activity cancelled");
      setRefreshKey((key) => key + 1);
    } catch (error) {
      toast.error(error.message || "Could not cancel");
    }
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      const path = isTask
        ? `/api/tasks/${activityId}`
        : `/api/activities/${activityId}`;
      await apiFetch(path, { method: "DELETE" });
      toast.success("Activity deleted");
      router.push("/activities");
    } catch (error) {
      toast.error(error.message || "Could not delete");
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  }

  if (loadStatus === "loading") {
    return (
      <div className="mx-auto flex w-full min-w-0 max-w-[1440px] flex-col gap-4 pb-10">
        <PageBreadcrumb
          items={[{ href: "/activities", label: "Activities" }, { label: "Loading…" }]}
        />
        <ActivityDetailSkeleton />
      </div>
    );
  }

  if (loadStatus === "error" || !record) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-[1440px] pb-10">
        <PageBreadcrumb
          items={[{ href: "/activities", label: "Activities" }, { label: "Not found" }]}
        />
        <p className="py-16 text-center text-muted-foreground">Activity not found.</p>
        <div className="text-center">
          <Button type="button" variant="outline" onClick={() => router.push("/activities")}>
            Back to activities
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[1440px] flex-col gap-4 pb-10">
      <PageBreadcrumb
        items={[
          { href: "/activities", label: "Activities" },
          { label: record.subject || "Activity" },
        ]}
      />

      <ActivityDetailPage
        record={record}
        owners={owners}
        lookups={lookups}
        onEdit={() => setEditOpen(true)}
        onMarkComplete={handleMarkComplete}
        onCancel={handleCancel}
        onDelete={() => setDeleteOpen(true)}
      />

      <ActivityFormDrawer
        open={editOpen}
        onOpenChange={setEditOpen}
        type={record.type}
        mode="edit"
        initialRecord={record}
        owners={owners}
        contacts={contacts}
        companies={companies}
        deals={deals}
        leads={leads}
        currentUserId={currentUserId}
        onSaved={() => setRefreshKey((key) => key + 1)}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent
          title="Delete activity?"
          description="This cannot be undone."
          onClose={() => setDeleteOpen(false)}
        >
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
