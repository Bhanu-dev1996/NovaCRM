"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { LeadDetailPage } from "@/components/leads/lead-detail-page";
import { LeadDetailSkeleton } from "@/components/leads/lead-skeletons";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { LeadFormDrawer } from "@/components/leads/lead-form-drawer";
import { demoDealNamesForLeadEmail } from "@/components/contacts/contacts-data";
import { fromApiLead, mapMemberToOwner, toApiLead } from "@/components/leads/lead-api";
import { buildNextRelated } from "@/components/leads/lead-related-data";
import { LEAD_OWNERS, fullName } from "@/components/leads/leads-data";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api";
import { crmType } from "@/lib/crm-typography";
import { cn } from "@/lib/utils";

export { LeadDetailSkeleton } from "@/components/leads/lead-skeletons";

export function LeadDetailView({ leadId }) {
  const [loadStatus, setLoadStatus] = useState("loading");
  const [lead, setLead] = useState(null);
  const [owners, setOwners] = useState(LEAD_OWNERS);
  const [currentUserId, setCurrentUserId] = useState("");
  const [companies, setCompanies] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const demoDealsAppliedRef = useRef(false);

  useEffect(() => {
    demoDealsAppliedRef.current = false;
  }, [leadId]);

  useEffect(() => {
    if (loadStatus !== "ready" || !lead || demoDealsAppliedRef.current) return;
    const dealNames = demoDealNamesForLeadEmail(lead.email).map((n) =>
      String(n).trim().toLowerCase()
    );
    if (!dealNames.length) return;

    const dealIds = dealNames
      .map((name) =>
        deals.find((row) => String(row.name || "").trim().toLowerCase() === name)
          ?.id
      )
      .filter(Boolean)
      .map(String);
    if (!dealIds.length) return;

    const existing = new Set((lead.related?.dealIds || []).map(String));
    const missing = dealIds.filter((id) => !existing.has(id));
    if (!missing.length) {
      demoDealsAppliedRef.current = true;
      return;
    }

    demoDealsAppliedRef.current = true;
    let related = lead.related;
    for (const dealId of missing) {
      related = buildNextRelated({ ...lead, related }, "deal", dealId);
    }
    (async () => {
      try {
        const response = await apiFetch(`/api/leads/${lead.id}`, {
          method: "PATCH",
          body: JSON.stringify({ related }),
        });
        setLead(fromApiLead(response.data));
      } catch {
        demoDealsAppliedRef.current = false;
      }
    })();
  }, [loadStatus, lead, deals, leadId]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadStatus("loading");
      try {
        const [
          detail,
          companyList,
          contactList,
          dealList,
          taskList,
          activityList,
          members,
          workspace,
        ] = await Promise.all([
          apiFetch(`/api/leads/${leadId}`),
          apiFetch("/api/companies?order_by=name&limit=200"),
          apiFetch("/api/contacts?order_by=created_at&limit=200"),
          apiFetch("/api/deals?order_by=created_at&limit=200"),
          apiFetch("/api/tasks?order_by=due_at&limit=200"),
          apiFetch("/api/activities?type=meeting&order_by=due_at&limit=200"),
          apiFetch("/api/workspace/members"),
          apiFetch("/api/workspace"),
        ]);
        if (cancelled) return;
        const mappedOwners = (members.data || []).map(mapMemberToOwner);
        setOwners(mappedOwners.length ? mappedOwners : LEAD_OWNERS);
        setCompanies(companyList.data || []);
        setContacts(contactList.data || []);
        setDeals(dealList.data || []);
        setTasks(taskList.data || []);
        setActivities(activityList.data || []);
        setLead(fromApiLead(detail.data));
        setCurrentUserId(workspace?.user?.id || "");
        setLoadStatus("ready");
      } catch (error) {
        if (!cancelled) {
          toast.error(error.message || "Could not load lead");
          setLoadStatus("error");
        }
      }
    }
    if (leadId) load();
    return () => {
      cancelled = true;
    };
  }, [leadId]);

  async function updateStatus(id, status) {
    const response = await apiFetch(`/api/leads/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    const saved = fromApiLead(response.data);
    setLead((prev) => (prev?.id === saved.id ? saved : prev));
    return saved;
  }

  async function handleSaveLead(updated, { isEdit }) {
    const payload = toApiLead(updated);
    const response = isEdit
      ? await apiFetch(`/api/leads/${updated.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        })
      : await apiFetch("/api/leads", {
          method: "POST",
          body: JSON.stringify(payload),
        });
    const saved = fromApiLead(response.data);
    setLead(saved);
    toast.success(isEdit ? "Lead updated" : "Lead saved");
  }

  async function handleCreateTask(payload) {
    const response = await apiFetch("/api/tasks", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const created = response.data;
    setTasks((prev) => [created, ...prev.filter((row) => row.id !== created.id)]);
    toast.success("Task created");
    return created;
  }

  async function handleUpdateTask(taskId, payload) {
    const response = await apiFetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    const updated = response.data;
    setTasks((prev) =>
      prev.map((row) => (row.id === updated.id ? updated : row))
    );
    toast.success("Task updated");
    return updated;
  }

  async function handleDeleteTask(taskId) {
    await apiFetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    setTasks((prev) => prev.filter((row) => row.id !== taskId));
    toast.success("Task deleted");
  }

  async function handleCreateMeeting(payload) {
    const response = await apiFetch("/api/activities", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const created = response.data;
    setActivities((prev) => [
      created,
      ...prev.filter((row) => row.id !== created.id),
    ]);
    toast.success("Meeting scheduled");
    return created;
  }

  async function handleUpdateMeeting(meetingId, payload) {
    const response = await apiFetch(`/api/activities/${meetingId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    const updated = response.data;
    setActivities((prev) =>
      prev.map((row) => (row.id === updated.id ? updated : row))
    );
    toast.success("Meeting updated");
    return updated;
  }

  async function handleDeleteMeeting(meetingId) {
    await apiFetch(`/api/activities/${meetingId}`, { method: "DELETE" });
    setActivities((prev) => prev.filter((row) => row.id !== meetingId));
    toast.success("Meeting deleted");
  }

  async function handleAddNote(noteBlock) {
    if (!lead) return;
    const notes = lead.notes ? `${lead.notes}\n\n${noteBlock}` : noteBlock;
    const response = await apiFetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      body: JSON.stringify({ notes }),
    });
    const saved = fromApiLead(response.data);
    setLead(saved);
  }

  async function handlePatchLead(leadId, patch) {
    const response = await apiFetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    const saved = fromApiLead(response.data);
    setLead(saved);
    return saved;
  }

  if (loadStatus === "loading") {
    return (
      <div className="mx-auto flex w-full min-w-0 max-w-[1440px] flex-col gap-4 pb-10">
        <PageBreadcrumb
          items={[{ href: "/leads", label: "Leads" }, { label: "Loading…" }]}
        />
        <LeadDetailSkeleton />
      </div>
    );
  }

  if (loadStatus === "error" || !lead) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-[1440px] pb-10">
        <PageBreadcrumb
          items={[{ href: "/leads", label: "Leads" }, { label: "Not found" }]}
        />
        <p className="py-16 text-center text-muted-foreground">Lead not found.</p>
      </div>
    );
  }

  const leadName = fullName(lead);

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[1440px] flex-col gap-4 pb-10">
      <PageBreadcrumb
        items={[{ href: "/leads", label: "Leads" }, { label: leadName }]}
      />

      <LeadDetailPage
        lead={lead}
        owners={owners}
        companies={companies}
        contacts={contacts}
        deals={deals}
        tasks={tasks}
        activities={activities}
        currentUserId={currentUserId}
        onCreateTask={handleCreateTask}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
        onCreateMeeting={handleCreateMeeting}
        onUpdateMeeting={handleUpdateMeeting}
        onDeleteMeeting={handleDeleteMeeting}
        onEdit={() => setEditOpen(true)}
        onConvert={() => setConvertOpen(true)}
        onAddNote={handleAddNote}
        onPatchLead={handlePatchLead}
        onCompanyCreated={(row) =>
          setCompanies((prev) => [row, ...prev.filter((item) => item.id !== row.id)])
        }
        onContactCreated={(row) =>
          setContacts((prev) => [row, ...prev.filter((item) => item.id !== row.id)])
        }
      />

      <LeadFormDrawer
        open={editOpen}
        onOpenChange={setEditOpen}
        initialLead={lead}
        onSave={handleSaveLead}
        owners={owners}
        defaultOwnerId={currentUserId}
      />

      <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
        <DialogContent
          title="Convert lead"
          description="Create a contact and company from this lead."
          onClose={() => setConvertOpen(false)}
        >
          <DialogBody className={cn("space-y-3", crmType.noteBody)}>
            <p>
              Convert{" "}
              <span className={crmType.bodySemibold}>{fullName(lead)}</span> at{" "}
              {lead.company || "this account"}?
            </p>
            <p
              className={cn(
                "rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-900",
                crmType.meta
              )}
            >
              This marks the lead as Converted. Deal creation stays in a later
              phase.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConvertOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-primary-600 text-white hover:bg-primary-700"
              onClick={async () => {
                try {
                  await updateStatus(lead.id, "Converted");
                  setConvertOpen(false);
                  toast.success("Lead converted");
                } catch (error) {
                  toast.error(error.message || "Could not convert lead");
                }
              }}
            >
              Confirm convert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
