"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  appendStageHistory,
  fromApiDeal,
  persistDealMeta,
  toApiDeal,
} from "@/components/deals/deal-api";
import { DealDetailPage } from "@/components/deals/deal-detail-page";
import { DealDetailSkeleton } from "@/components/deals/deal-detail-skeletons";
import { DealFormDrawer } from "@/components/deals/deal-form-drawer";
import { DealStageDialog } from "@/components/deals/deal-stage-dialog";
import {
  mergeDemoDealMeta,
  stageById,
  stageIsLost,
  stageIsWon,
  dealStatusFromStage,
} from "@/components/deals/deals-data";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { fromApiCompany } from "@/components/companies/company-api";
import {
  fromApiContact,
  mapMemberToOwner,
} from "@/components/contacts/contact-api";
import { CONTACT_OWNERS } from "@/components/contacts/contacts-data";
import { apiFetch } from "@/lib/api";

export { DealDetailSkeleton } from "@/components/deals/deal-detail-skeletons";

export function DealDetailView({ dealId }) {
  const [loadStatus, setLoadStatus] = useState("loading");
  const [deal, setDeal] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [stages, setStages] = useState([]);
  const [owners, setOwners] = useState(CONTACT_OWNERS);
  const [currentUserId, setCurrentUserId] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [stageDialog, setStageDialog] = useState({
    open: false,
    mode: "normal",
    stageId: "",
    confirming: false,
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadStatus("loading");
      try {
        const [
          ws,
          dealRes,
          companyList,
          contactList,
          stageList,
          members,
          taskList,
          activityList,
        ] = await Promise.all([
          apiFetch("/api/workspace"),
          apiFetch(`/api/deals/${dealId}`),
          apiFetch("/api/companies?order_by=name&limit=300"),
          apiFetch("/api/contacts?order_by=created_at&limit=300"),
          apiFetch("/api/pipeline-stages?order_by=position&limit=50"),
          apiFetch("/api/workspace/members"),
          apiFetch("/api/tasks?order_by=due_at&limit=200"),
          apiFetch("/api/activities?type=meeting&order_by=due_at&limit=200"),
        ]);
        if (cancelled) return;
        const mappedOwners = (members.data || []).map(mapMemberToOwner);
        setOwners(mappedOwners.length ? mappedOwners : CONTACT_OWNERS);
        setCurrentUserId(ws.user?.id || "");
        setCompanies((companyList.data || []).map((r) => fromApiCompany(r)));
        setContacts((contactList.data || []).map((r) => fromApiContact(r)));
        setStages(stageList.data || []);
        setTasks(taskList.data || []);
        setActivities(activityList.data || []);
        setDeal(mergeDemoDealMeta(fromApiDeal(dealRes.data)));
        setLoadStatus("ready");
      } catch (error) {
        if (!cancelled) {
          toast.error(error.message || "Deal not found");
          setLoadStatus("error");
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [dealId]);

  const company = useMemo(
    () => companies.find((c) => c.id === deal?.companyId),
    [companies, deal]
  );

  const primaryContact = useMemo(
    () => contacts.find((c) => c.id === deal?.contactId),
    [contacts, deal]
  );

  const additionalContacts = useMemo(() => {
    const ids = new Set((deal?.additionalContactIds || []).map(String));
    return contacts.filter((c) => ids.has(String(c.id)));
  }, [contacts, deal]);

  const applyStageChange = useCallback(
    async (stageId, extras = {}) => {
      if (!deal) return;
      const stage = stageById(stages, stageId);
      if (!stage) return;
      const status = dealStatusFromStage(stage, deal.status);
      const body = {
        ...toApiDeal({ ...deal, stageId, status }),
      };
      if (status === "won" && extras.actualCloseDate) {
        body.expected_close_date = extras.actualCloseDate;
      }
      try {
        const response = await apiFetch(`/api/deals/${deal.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        const saved = fromApiDeal(response.data);
        const merged = {
          ...saved,
          description: deal.description,
          priority: deal.priority,
          leadSource: deal.leadSource,
          nextStep: deal.nextStep,
          notes: deal.notes,
          tags: deal.tags,
          additionalContactIds: deal.additionalContactIds,
          pipelineName: deal.pipelineName,
          probability: deal.probability ?? "",
          lossReason: extras.lossReason || deal.lossReason,
          actualCloseDate: extras.actualCloseDate || deal.actualCloseDate,
          stageHistory: appendStageHistory(deal, deal.stageId, stageId, {
            lossReason: extras.lossReason,
          }),
        };
        persistDealMeta(merged);
        setDeal(merged);
        toast.success("Stage updated");
      } catch (error) {
        toast.error(error.message || "Could not update stage");
      }
    },
    [deal, stages]
  );

  function requestStageChange(stageId) {
    if (!deal || String(deal.stageId) === String(stageId)) return;
    const stage = stageById(stages, stageId);
    if (!stage) return;
    if (stageIsLost(stage)) {
      setStageDialog({ open: true, mode: "lost", stageId, confirming: false });
      return;
    }
    if (stageIsWon(stage)) {
      setStageDialog({ open: true, mode: "won", stageId, confirming: false });
      return;
    }
    applyStageChange(stageId);
  }

  async function confirmStageDialog(extras) {
    setStageDialog((prev) => ({ ...prev, confirming: true }));
    await applyStageChange(stageDialog.stageId, extras);
    setStageDialog({ open: false, mode: "normal", stageId: "", confirming: false });
  }

  async function handlePatchDeal(patch) {
    if (!deal) return;
    const merged = {
      ...deal,
      ...(patch.companyId !== undefined ? { companyId: patch.companyId || "" } : {}),
      ...(patch.contactId !== undefined ? { contactId: patch.contactId || "" } : {}),
      ...(patch.additionalContactIds !== undefined
        ? { additionalContactIds: patch.additionalContactIds }
        : {}),
    };
    const response = await apiFetch(`/api/deals/${deal.id}`, {
      method: "PATCH",
      body: JSON.stringify(toApiDeal(merged)),
    });
    const saved = fromApiDeal(response.data);
    persistDealMeta(saved);
    setDeal(saved);
    return saved;
  }

  async function handleAddNote(noteBlock) {
    if (!deal) return;
    const notes = deal.notes ? `${deal.notes}\n\n${noteBlock}` : noteBlock;
    const merged = { ...deal, notes };
    persistDealMeta(merged);
    setDeal(merged);
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

  if (loadStatus === "loading") {
    return (
      <div className="mx-auto flex w-full min-w-0 max-w-[1440px] flex-col gap-4 pb-10">
        <PageBreadcrumb
          items={[{ href: "/deals", label: "Deals" }, { label: "Loading…" }]}
        />
        <DealDetailSkeleton />
      </div>
    );
  }

  if (loadStatus === "error" || !deal) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-[1440px] pb-10">
        <PageBreadcrumb
          items={[{ href: "/deals", label: "Deals" }, { label: "Not found" }]}
        />
        <p className="py-16 text-center text-muted-foreground">Deal not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[1440px] flex-col gap-4 pb-10">
      <PageBreadcrumb
        items={[{ href: "/deals", label: "Deals" }, { label: deal.name }]}
      />

      <DealDetailPage
        deal={deal}
        company={company}
        primaryContact={primaryContact}
        additionalContacts={additionalContacts}
        companies={companies}
        contacts={contacts}
        owners={owners}
        stages={stages}
        tasks={tasks}
        activities={activities}
        currentUserId={currentUserId}
        onEdit={() => setEditOpen(true)}
        onChangeStage={requestStageChange}
        onPatchDeal={handlePatchDeal}
        onCompanyCreated={(row) =>
          setCompanies((prev) => {
            if (prev.some((item) => item.id === row.id)) return prev;
            return [...prev, row];
          })
        }
        onContactCreated={(row) =>
          setContacts((prev) => {
            if (prev.some((item) => item.id === row.id)) return prev;
            return [...prev, row];
          })
        }
        onAddNote={handleAddNote}
        onCreateTask={handleCreateTask}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
        onCreateMeeting={handleCreateMeeting}
        onUpdateMeeting={handleUpdateMeeting}
        onDeleteMeeting={handleDeleteMeeting}
      />

      <DealFormDrawer
        open={editOpen}
        onOpenChange={setEditOpen}
        initialDeal={deal}
        stages={stages}
        companies={companies}
        contacts={contacts}
        owners={owners}
        onSaved={(saved) => setDeal(saved)}
        onCompanyCreated={(company) =>
          setCompanies((prev) => {
            if (prev.some((row) => row.id === company.id)) return prev;
            return [...prev, company];
          })
        }
        onContactCreated={(contact) =>
          setContacts((prev) => {
            if (prev.some((row) => row.id === contact.id)) return prev;
            return [...prev, contact];
          })
        }
      />

      <DealStageDialog
        open={stageDialog.open}
        onOpenChange={(open) => setStageDialog((prev) => ({ ...prev, open }))}
        mode={stageDialog.mode}
        dealName={deal.name}
        confirming={stageDialog.confirming}
        onConfirm={confirmStageDialog}
      />

    </div>
  );
}
