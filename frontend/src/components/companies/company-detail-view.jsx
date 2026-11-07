"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { CompanyDetailPage } from "@/components/companies/company-detail-page";
import { CompanyFormDrawer } from "@/components/companies/company-form-drawer";
import {
  fromApiCompany,
  mapMemberToOwner,
  persistCompanyMeta,
  toApiCompany,
} from "@/components/companies/company-api";
import {
  buildCompanyBootstrapSpec,
  demoLinkedDealSpecsForCompany,
} from "@/components/companies/companies-data";
import { fromApiContact } from "@/components/contacts/contact-api";
import { fullName } from "@/components/contacts/contacts-data";
import { fromApiLead } from "@/components/leads/lead-api";
import { resolveLeadMeetings } from "@/components/leads/lead-detail-meetings";
import { resolveLeadTasks } from "@/components/leads/lead-detail-tasks";
import {
  buildNextRelated,
  buildUnlinkLeadPatch,
} from "@/components/leads/lead-related-data";
import { LeadDetailSkeleton } from "@/components/leads/lead-skeletons";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { apiFetch } from "@/lib/api";

export { CompanyDetailSkeleton } from "@/components/companies/company-detail-view-skeleton";

function companyLeadContext(company, linkedContacts) {
  return {
    id: company.id,
    firstName: company.name,
    lastName: "",
    email: "",
    phone: company.phone,
    company: company.name,
    title: company.industry,
    notes: company.notes,
    createdAt: company.createdAt,
    companyId: company.id,
    related: {
      contactIds: (linkedContacts || []).map((row) => row.id),
      companyIds: [company.id],
    },
  };
}

function isoDaysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + Number(days || 0));
  d.setHours(10, 0, 0, 0);
  return d.toISOString();
}

function withCompanyMeta(saved, company) {
  return {
    ...saved,
    companyType: company.companyType,
    status: company.status,
    annualRevenue: company.annualRevenue,
    foundedYear: company.foundedYear,
    country: company.country,
    state: company.state,
    city: company.city,
    address: company.address,
    notes: company.notes,
    description: company.description,
    logoUrl: company.logoUrl,
    relatedLeadIds: company.relatedLeadIds || [],
    relatedDealIds: company.relatedDealIds || [],
  };
}

export function CompanyDetailView({ companyId }) {
  const [loadStatus, setLoadStatus] = useState("loading");
  const [company, setCompany] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [leads, setLeads] = useState([]);
  const [deals, setDeals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [owners, setOwners] = useState([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [linkingContactId, setLinkingContactId] = useState("");
  const [unlinkingContactId, setUnlinkingContactId] = useState("");
  const demoBootstrapRef = useRef(false);

  useEffect(() => {
    demoBootstrapRef.current = false;
  }, [companyId]);

  useEffect(() => {
    if (loadStatus !== "ready" || !company || demoBootstrapRef.current) return;

    const linkedNow = contacts.filter(
      (row) => String(row.companyId) === String(companyId)
    );
    const spec = buildCompanyBootstrapSpec(company, contacts);
    const dealSpecs = demoLinkedDealSpecsForCompany(company.name);
    const leadContext = companyLeadContext(company, linkedNow);
    const hasTasks = resolveLeadTasks(tasks, leadContext).length > 0;
    const hasMeetings =
      resolveLeadMeetings(activities, leadContext, contacts, [company]).length >
      0;
    const needsNotes = spec?.notes && !String(company.notes || "").trim();

    const needsContacts =
      spec?.contactEmails?.some((email) => {
        const row = contacts.find(
          (c) => String(c.email || "").toLowerCase() === email
        );
        return row && String(row.companyId) !== String(companyId);
      }) ?? false;

    if (
      !spec &&
      !dealSpecs.length &&
      hasTasks &&
      hasMeetings &&
      !needsNotes &&
      !needsContacts
    ) {
      demoBootstrapRef.current = true;
      return;
    }

    demoBootstrapRef.current = true;
    let cancelled = false;

    (async () => {
      let dealRows = [...deals];
      let contactRows = [...contacts];
      let taskRows = [...tasks];
      let activityRows = [...activities];
      let leadRows = [...leads];
      let contactsDirty = false;
      let dealsDirty = false;
      let leadsDirty = false;
      let tasksDirty = false;
      let activitiesDirty = false;

      for (const email of spec?.contactEmails || []) {
        const row = contactRows.find(
          (c) => String(c.email || "").toLowerCase() === email
        );
        if (!row || String(row.companyId) === String(companyId)) continue;
        try {
          const response = await apiFetch(`/api/contacts/${row.id}`, {
            method: "PATCH",
            body: JSON.stringify({ company_id: companyId }),
          });
          const saved = fromApiContact(response.data);
          contactRows = contactRows.map((item) =>
            item.id === saved.id ? saved : item
          );
          contactsDirty = true;
        } catch {
          /* optional */
        }
      }

      if (cancelled) return;

      for (const dealSpec of dealSpecs) {
        const key = dealSpec.name.trim().toLowerCase();
        const exists = dealRows.some(
          (row) => String(row.name || "").trim().toLowerCase() === key
        );
        if (exists) continue;
        const primaryContact = contactRows.find((c) =>
          (spec?.contactEmails || []).includes(
            String(c.email || "").toLowerCase()
          )
        );
        try {
          const created = await apiFetch("/api/deals", {
            method: "POST",
            body: JSON.stringify({
              name: dealSpec.name,
              amount: dealSpec.amount,
              currency: dealSpec.currency || "USD",
              contact_id: primaryContact?.id || null,
              company_id: companyId,
              owner_id: currentUserId || null,
              status: "open",
            }),
          });
          dealRows = [created.data, ...dealRows];
          dealsDirty = true;
        } catch {
          /* optional */
        }
      }

      const leadEmails = (spec?.linkedLeadEmails || []).map((e) =>
        String(e).trim().toLowerCase()
      );
      const leadIdsFromEmail = leadEmails
        .map(
          (email) =>
            leadRows.find(
              (row) => String(row.email || "").toLowerCase() === email
            )?.id
        )
        .filter(Boolean)
        .map(String);

      const leadIdsFromCompany = leadRows
        .filter((row) => {
          if (String(row.companyId) === String(companyId)) return true;
          const cname = String(row.company || "")
            .trim()
            .toLowerCase();
          const name = String(company.name || "")
            .trim()
            .toLowerCase();
          return name && cname === name;
        })
        .map((row) => String(row.id));

      const leadIds = [
        ...new Set([...leadIdsFromEmail, ...leadIdsFromCompany]),
      ];

      for (const leadId of leadIds) {
        const lead = leadRows.find((row) => String(row.id) === String(leadId));
        if (!lead) continue;
        const related = buildNextRelated(lead, "company", companyId);
        if (
          String(lead.companyId) === String(companyId) &&
          JSON.stringify(lead.related || {}) === JSON.stringify(related)
        ) {
          continue;
        }
        try {
          const response = await apiFetch(`/api/leads/${leadId}`, {
            method: "PATCH",
            body: JSON.stringify({
              related,
              company_id: companyId,
              company_name: company.name,
            }),
          });
          const savedLead = fromApiLead(response.data);
          leadRows = leadRows.map((item) =>
            item.id === savedLead.id ? savedLead : item
          );
          leadsDirty = true;
        } catch {
          /* optional */
        }
      }

      if (cancelled) return;

      const dealNameKeys = [
        ...new Set([
          ...dealSpecs.map((d) => d.name.trim().toLowerCase()),
          ...(spec?.linkedDealNames || []).map((n) =>
            String(n).trim().toLowerCase()
          ),
        ]),
      ];
      const dealIds = dealNameKeys
        .map((name) =>
          dealRows.find(
            (row) => String(row.name || "").trim().toLowerCase() === name
          )?.id
        )
        .filter(Boolean)
        .map(String);

      dealRows
        .filter((row) => String(row.company_id) === String(companyId))
        .forEach((row) => {
          if (!dealIds.includes(String(row.id))) dealIds.push(String(row.id));
        });

      const relatedLeadIds = [
        ...new Set([...(company.relatedLeadIds || []), ...leadIds]),
      ];
      const relatedDealIds = [
        ...new Set([...(company.relatedDealIds || []), ...dealIds]),
      ];

      let mergedCompany = { ...company, relatedLeadIds, relatedDealIds };
      if (needsNotes && spec?.notes) {
        mergedCompany = { ...mergedCompany, notes: spec.notes };
      }

      if (
        relatedLeadIds.length !== (company.relatedLeadIds || []).length ||
        relatedDealIds.length !== (company.relatedDealIds || []).length ||
        (needsNotes && spec?.notes)
      ) {
        persistCompanyMeta(mergedCompany);
        if (!cancelled) setCompany(mergedCompany);
      }

      const refreshedContacts = contactRows.filter(
        (row) => String(row.companyId) === String(companyId)
      );
      const ctx = companyLeadContext(mergedCompany, refreshedContacts);

      if (!resolveLeadTasks(taskRows, ctx).length && spec?.tasks?.length) {
        for (const task of spec.tasks) {
          try {
            const created = await apiFetch("/api/tasks", {
              method: "POST",
              body: JSON.stringify({
                title: task.title,
                description: task.description,
                status: task.status || "todo",
                priority: task.priority || "medium",
                due_at: isoDaysFromNow(task.dueInDays),
                assignee_id: currentUserId || null,
              }),
            });
            taskRows = [created.data, ...taskRows];
            tasksDirty = true;
          } catch {
            /* optional */
          }
        }
      }

      const primaryContact =
        refreshedContacts[0] ||
        contactRows.find((c) =>
          (spec?.contactEmails || []).includes(
            String(c.email || "").toLowerCase()
          )
        );

      if (
        !resolveLeadMeetings(activityRows, ctx, contactRows, [mergedCompany])
          .length &&
        spec?.meetings?.length
      ) {
        for (const meeting of spec.meetings) {
          try {
            const created = await apiFetch("/api/activities", {
              method: "POST",
              body: JSON.stringify({
                type: "meeting",
                subject: meeting.subject,
                body: meeting.body,
                due_at: isoDaysFromNow(meeting.dueInDays),
                contact_id: primaryContact?.id || null,
                company_id: companyId,
                user_id: currentUserId || null,
              }),
            });
            activityRows = [created.data, ...activityRows];
            activitiesDirty = true;
          } catch {
            /* optional */
          }
        }
      }

      if (cancelled) return;
      if (contactsDirty) setContacts(contactRows);
      if (dealsDirty) setDeals(dealRows);
      if (leadsDirty) setLeads(leadRows);
      if (tasksDirty) setTasks(taskRows);
      if (activitiesDirty) setActivities(activityRows);
    })();

    return () => {
      cancelled = true;
    };
  }, [
    loadStatus,
    company,
    companyId,
    contacts,
    leads,
    deals,
    tasks,
    activities,
    currentUserId,
  ]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadStatus("loading");
      try {
        const [
          detail,
          contactList,
          leadList,
          dealList,
          taskList,
          activityList,
          members,
          workspace,
        ] = await Promise.all([
          apiFetch(`/api/companies/${companyId}`),
          apiFetch("/api/contacts?order_by=created_at&limit=500"),
          apiFetch("/api/leads?order_by=created_at&limit=500"),
          apiFetch("/api/deals?order_by=created_at&limit=500"),
          apiFetch("/api/tasks?order_by=due_at&limit=200"),
          apiFetch("/api/activities?type=meeting&order_by=due_at&limit=200"),
          apiFetch("/api/workspace/members"),
          apiFetch("/api/workspace"),
        ]);
        if (cancelled) return;
        setOwners((members.data || []).map(mapMemberToOwner));
        setContacts((contactList.data || []).map((row) => fromApiContact(row)));
        setLeads((leadList.data || []).map(fromApiLead));
        setDeals(dealList.data || []);
        setTasks(taskList.data || []);
        setActivities(activityList.data || []);
        setCompany(fromApiCompany(detail.data));
        setCurrentUserId(workspace?.user?.id || "");
        setLoadStatus("ready");
      } catch (error) {
        if (!cancelled) {
          toast.error(error.message || "Could not load company");
          setLoadStatus("error");
        }
      }
    }
    if (companyId) load();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  const linkedContacts = useMemo(
    () => contacts.filter((row) => String(row.companyId) === String(companyId)),
    [contacts, companyId]
  );

  const linkableContacts = useMemo(() => {
    const linkedIds = new Set(linkedContacts.map((row) => row.id));
    return contacts
      .filter((row) => !linkedIds.has(row.id))
      .map((row) => ({ id: row.id, label: fullName(row) }));
  }, [contacts, linkedContacts]);

  async function handleSave(updated, { isEdit }) {
    const payload = toApiCompany(updated);
    const response = await apiFetch(`/api/companies/${updated.id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    const saved = fromApiCompany(response.data);
    const merged = withCompanyMeta(saved, { ...company, ...updated });
    persistCompanyMeta(merged);
    setCompany(merged);
    toast.success(isEdit ? "Company updated" : "Company saved");
    setEditOpen(false);
  }

  async function handleAddNote(noteBlock) {
    if (!company) return;
    const notes = company.notes ? `${company.notes}\n\n${noteBlock}` : noteBlock;
    const merged = { ...company, notes };
    persistCompanyMeta(merged);
    setCompany(merged);
  }

  async function handleLinkContact(contactId) {
    setLinkingContactId(String(contactId));
    try {
      const response = await apiFetch(`/api/contacts/${contactId}`, {
        method: "PATCH",
        body: JSON.stringify({ company_id: companyId }),
      });
      const saved = fromApiContact(response.data);
      setContacts((prev) =>
        prev.map((row) => (row.id === saved.id ? saved : row))
      );
      toast.success("Contact linked");
    } catch (error) {
      toast.error(error.message || "Could not link contact");
    } finally {
      setLinkingContactId("");
    }
  }

  async function handleUnlinkContact(contactId) {
    setUnlinkingContactId(String(contactId));
    try {
      const response = await apiFetch(`/api/contacts/${contactId}`, {
        method: "PATCH",
        body: JSON.stringify({ company_id: null }),
      });
      const saved = fromApiContact(response.data);
      setContacts((prev) =>
        prev.map((row) => (row.id === saved.id ? saved : row))
      );
      toast.success("Contact unlinked");
    } catch (error) {
      toast.error(error.message || "Could not unlink contact");
    } finally {
      setUnlinkingContactId("");
    }
  }

  async function handleLinkLead(leadId) {
    if (!company) return;
    const relatedLeadIds = [
      ...new Set([...(company.relatedLeadIds || []), String(leadId)]),
    ];
    const lead = leads.find((row) => String(row.id) === String(leadId));
    if (lead) {
      const related = buildNextRelated(lead, "company", companyId);
      const response = await apiFetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        body: JSON.stringify({
          related,
          company_id: companyId,
          company_name: company.name,
        }),
      });
      const savedLead = fromApiLead(response.data);
      setLeads((prev) =>
        prev.map((row) => (row.id === savedLead.id ? savedLead : row))
      );
    }
    const merged = { ...company, relatedLeadIds };
    persistCompanyMeta(merged);
    setCompany(merged);
    toast.success("Lead linked");
  }

  async function handleUnlinkLead(leadId) {
    if (!company) return;
    const lead = leads.find((row) => String(row.id) === String(leadId));
    const relatedLeadIds = (company.relatedLeadIds || []).filter(
      (id) => String(id) !== String(leadId)
    );
    if (lead) {
      const patch = buildUnlinkLeadPatch(lead, "company", {
        id: companyId,
        name: company.name,
      });
      if (patch) {
        const response = await apiFetch(`/api/leads/${leadId}`, {
          method: "PATCH",
          body: JSON.stringify(patch),
        });
        const savedLead = fromApiLead(response.data);
        setLeads((prev) =>
          prev.map((row) => (row.id === savedLead.id ? savedLead : row))
        );
      }
    }
    const merged = { ...company, relatedLeadIds };
    persistCompanyMeta(merged);
    setCompany(merged);
  }

  async function handleLinkDeal(dealId) {
    if (!company) return;
    const relatedDealIds = [
      ...new Set([...(company.relatedDealIds || []), String(dealId)]),
    ];
    const response = await apiFetch(`/api/deals/${dealId}`, {
      method: "PATCH",
      body: JSON.stringify({ company_id: companyId }),
    });
    const updated = response.data;
    setDeals((prev) =>
      prev.map((row) => (row.id === updated.id ? updated : row))
    );
    const merged = { ...company, relatedDealIds };
    persistCompanyMeta(merged);
    setCompany(merged);
    toast.success("Deal linked");
  }

  async function handleUnlinkDeal(dealId) {
    if (!company) return;
    const deal = deals.find((row) => String(row.id) === String(dealId));
    const relatedDealIds = (company.relatedDealIds || []).filter(
      (id) => String(id) !== String(dealId)
    );
    if (deal && String(deal.company_id) === String(companyId)) {
      const response = await apiFetch(`/api/deals/${dealId}`, {
        method: "PATCH",
        body: JSON.stringify({ company_id: null }),
      });
      const updated = response.data;
      setDeals((prev) =>
        prev.map((row) => (row.id === updated.id ? updated : row))
      );
    }
    const merged = { ...company, relatedDealIds };
    persistCompanyMeta(merged);
    setCompany(merged);
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
      body: JSON.stringify({ ...payload, company_id: companyId }),
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
          items={[{ href: "/companies", label: "Companies" }, { label: "Loading…" }]}
        />
        <LeadDetailSkeleton />
      </div>
    );
  }

  if (loadStatus === "error" || !company) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-[1440px] pb-10">
        <PageBreadcrumb
          items={[
            { href: "/companies", label: "Companies" },
            { label: "Not found" },
          ]}
        />
        <p className="py-16 text-center text-muted-foreground">Company not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[1440px] flex-col gap-4 pb-10">
      <PageBreadcrumb
        items={[
          { href: "/companies", label: "Companies" },
          { label: company.name },
        ]}
      />

      <CompanyDetailPage
        company={company}
        owners={owners}
        contacts={contacts}
        leads={leads}
        deals={deals}
        tasks={tasks}
        activities={activities}
        currentUserId={currentUserId}
        linkedContacts={linkedContacts}
        linkableContacts={linkableContacts}
        onEdit={() => setEditOpen(true)}
        onAddNote={handleAddNote}
        onLinkContact={handleLinkContact}
        onUnlinkContact={handleUnlinkContact}
        onLinkLead={handleLinkLead}
        onUnlinkLead={handleUnlinkLead}
        onLinkDeal={handleLinkDeal}
        onUnlinkDeal={handleUnlinkDeal}
        onCreateTask={handleCreateTask}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
        onCreateMeeting={handleCreateMeeting}
        onUpdateMeeting={handleUpdateMeeting}
        onDeleteMeeting={handleDeleteMeeting}
        linkingContactId={linkingContactId}
        unlinkingContactId={unlinkingContactId}
      />

      <CompanyFormDrawer
        open={editOpen}
        onOpenChange={setEditOpen}
        initialCompany={company}
        onSave={handleSave}
        owners={owners}
        defaultOwnerId={currentUserId}
        existingCompanies={[company]}
      />
    </div>
  );
}
