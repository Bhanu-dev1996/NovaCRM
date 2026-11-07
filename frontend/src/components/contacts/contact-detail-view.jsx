"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { ContactDetailPage } from "@/components/contacts/contact-detail-page";
import { ContactFormDrawer } from "@/components/contacts/contact-form-drawer";
import {
  fromApiContact,
  mapMemberToOwner,
  persistContactMeta,
  toApiContact,
} from "@/components/contacts/contact-api";
import {
  CONTACT_OWNERS,
  demoEnrichmentForEmail,
  demoLinkedDealSpecsForContact,
  fullName,
} from "@/components/contacts/contacts-data";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { fromApiLead } from "@/components/leads/lead-api";
import {
  buildNextRelated,
  buildUnlinkLeadPatch,
} from "@/components/leads/lead-related-data";
import { LeadDetailSkeleton } from "@/components/leads/lead-skeletons";
import { apiFetch } from "@/lib/api";

export { LeadDetailSkeleton as ContactDetailSkeleton } from "@/components/leads/lead-skeletons";

function withContactMeta(saved, contact) {
  return {
    ...saved,
    contactType: contact.contactType,
    lifecycle: contact.lifecycle,
    tags: contact.tags,
    linkedIn: contact.linkedIn,
    notes: contact.notes ?? saved.notes,
    department: contact.department,
    lastActivityAt: contact.lastActivityAt || saved.lastActivityAt,
    ownerId: contact.ownerId || saved.ownerId,
    relatedLeadIds: contact.relatedLeadIds || saved.relatedLeadIds || [],
    relatedDealIds: contact.relatedDealIds || saved.relatedDealIds || [],
  };
}

export function ContactDetailView({ contactId }) {
  const [loadStatus, setLoadStatus] = useState("loading");
  const [contact, setContact] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [leads, setLeads] = useState([]);
  const [deals, setDeals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [owners, setOwners] = useState(CONTACT_OWNERS);
  const [currentUserId, setCurrentUserId] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const demoBootstrapRef = useRef(false);

  useEffect(() => {
    demoBootstrapRef.current = false;
  }, [contactId]);

  useEffect(() => {
    if (loadStatus !== "ready" || !contact || demoBootstrapRef.current) return;

    const demo = demoEnrichmentForEmail(contact.email);
    const dealSpecs = demoLinkedDealSpecsForContact(contact.email);
    const leadEmails = (demo?.linkedLeadEmails || []).map((e) =>
      String(e).trim().toLowerCase()
    );
    const dealNameKeys = (demo?.linkedDealNames || []).map((n) =>
      String(n).trim().toLowerCase()
    );
    if (!leadEmails.length && !dealNameKeys.length && !dealSpecs.length) {
      demoBootstrapRef.current = true;
      return;
    }

    demoBootstrapRef.current = true;
    let cancelled = false;

    (async () => {
      let dealRows = [...deals];

      for (const spec of dealSpecs) {
        const key = spec.name.trim().toLowerCase();
        const exists = dealRows.some(
          (row) => String(row.name || "").trim().toLowerCase() === key
        );
        if (exists) continue;
        try {
          const created = await apiFetch("/api/deals", {
            method: "POST",
            body: JSON.stringify({
              name: spec.name,
              amount: spec.amount,
              currency: spec.currency || "USD",
              contact_id: contact.id,
              company_id: contact.companyId || null,
              owner_id: currentUserId || null,
              status: "open",
            }),
          });
          dealRows = [created.data, ...dealRows];
        } catch {
          /* keep going if one deal fails */
        }
      }

      if (cancelled) return;

      const leadIds = leadEmails
        .map(
          (email) =>
            leads.find((row) => String(row.email || "").toLowerCase() === email)
              ?.id
        )
        .filter(Boolean)
        .map(String);

      const dealIds = dealNameKeys
        .map((name) =>
          dealRows.find(
            (row) => String(row.name || "").trim().toLowerCase() === name
          )?.id
        )
        .filter(Boolean)
        .map(String);

      if (dealRows.length !== deals.length) {
        setDeals(dealRows);
      }

      const relatedLeadIds = [
        ...new Set([...(contact.relatedLeadIds || []), ...leadIds]),
      ];
      const relatedDealIds = [
        ...new Set([...(contact.relatedDealIds || []), ...dealIds]),
      ];
      const contactChanged =
        relatedLeadIds.length !== (contact.relatedLeadIds || []).length ||
        relatedDealIds.length !== (contact.relatedDealIds || []).length ||
        relatedLeadIds.some(
          (id) => !(contact.relatedLeadIds || []).includes(id)
        ) ||
        relatedDealIds.some(
          (id) => !(contact.relatedDealIds || []).includes(id)
        );

      if (contactChanged) {
        const merged = { ...contact, relatedLeadIds, relatedDealIds };
        persistContactMeta(merged);
        setContact(merged);
      }

      for (const dealId of dealIds) {
        for (const row of leads) {
          const linked =
            leadIds.includes(String(row.id)) ||
            leadEmails.includes(String(row.email || "").trim().toLowerCase());
          if (!linked) continue;
          if ((row.related?.dealIds || []).map(String).includes(String(dealId))) {
            continue;
          }
          try {
            const related = buildNextRelated(row, "deal", dealId);
            const leadResponse = await apiFetch(`/api/leads/${row.id}`, {
              method: "PATCH",
              body: JSON.stringify({ related }),
            });
            const savedLead = fromApiLead(leadResponse.data);
            if (!cancelled) {
              setLeads((prev) =>
                prev.map((item) =>
                  item.id === savedLead.id ? savedLead : item
                )
              );
            }
          } catch {
            /* optional lead sync */
          }
        }
      }

    })();

    return () => {
      cancelled = true;
    };
  }, [loadStatus, contact, contactId, leads, deals, currentUserId]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadStatus("loading");
      try {
        const [
          detail,
          companyList,
          contactList,
          leadList,
          dealList,
          taskList,
          activityList,
          members,
          workspace,
        ] = await Promise.all([
          apiFetch(`/api/contacts/${contactId}`),
          apiFetch("/api/companies?order_by=name&limit=200"),
          apiFetch("/api/contacts?order_by=created_at&limit=200"),
          apiFetch("/api/leads?order_by=created_at&limit=200"),
          apiFetch("/api/deals?order_by=created_at&limit=200"),
          apiFetch("/api/tasks?order_by=due_at&limit=200"),
          apiFetch("/api/activities?type=meeting&order_by=due_at&limit=200"),
          apiFetch("/api/workspace/members"),
          apiFetch("/api/workspace"),
        ]);
        if (cancelled) return;
        const mappedOwners = (members.data || []).map(mapMemberToOwner);
        setOwners(mappedOwners.length ? mappedOwners : CONTACT_OWNERS);
        setCompanies(companyList.data || []);
        setContacts(contactList.data || []);
        setLeads((leadList.data || []).map(fromApiLead));
        setDeals(dealList.data || []);
        setTasks(taskList.data || []);
        setActivities(activityList.data || []);
        setContact(fromApiContact(detail.data));
        setCurrentUserId(workspace?.user?.id || "");
        setLoadStatus("ready");
      } catch (error) {
        if (!cancelled) {
          toast.error(error.message || "Could not load contact");
          setLoadStatus("error");
        }
      }
    }
    if (contactId) load();
    return () => {
      cancelled = true;
    };
  }, [contactId]);

  const company = useMemo(
    () => companies.find((c) => c.id === contact?.companyId),
    [companies, contact?.companyId]
  );

  const existingEmails = useMemo(
    () =>
      contacts
        .map((row) => fromApiContact(row).email)
        .filter(Boolean),
    [contacts]
  );

  async function handleSave(updated, { isEdit }) {
    const payload = toApiContact(updated);
    const response = isEdit
      ? await apiFetch(`/api/contacts/${updated.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        })
      : await apiFetch("/api/contacts", {
          method: "POST",
          body: JSON.stringify({
            ...payload,
            owner_id: updated.ownerId || currentUserId || null,
          }),
        });
    const saved = fromApiContact(response.data);
    const merged = withContactMeta(saved, { ...contact, ...updated });
    persistContactMeta(merged);
    setContact(merged);
    toast.success(isEdit ? "Contact updated" : "Contact created");
    setEditOpen(false);
  }

  async function handleAddNote(noteBlock) {
    if (!contact) return;
    const notes = contact.notes ? `${contact.notes}\n\n${noteBlock}` : noteBlock;
    const response = await apiFetch(`/api/contacts/${contact.id}`, {
      method: "PATCH",
      body: JSON.stringify({ notes }),
    });
    const saved = fromApiContact(response.data);
    const merged = withContactMeta(saved, { ...contact, notes });
    persistContactMeta(merged);
    setContact(merged);
  }

  async function handleLinkLead(leadId) {
    if (!contact) return;
    const lead = leads.find((row) => String(row.id) === String(leadId));
    if (!lead) return;
    const relatedLeadIds = [
      ...new Set([...(contact.relatedLeadIds || []), String(leadId)]),
    ];
    const related = buildNextRelated(lead, "contact", contact.id);
    const response = await apiFetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      body: JSON.stringify({ related }),
    });
    const savedLead = fromApiLead(response.data);
    setLeads((prev) =>
      prev.map((row) => (row.id === savedLead.id ? savedLead : row))
    );
    const merged = { ...contact, relatedLeadIds };
    persistContactMeta(merged);
    setContact(merged);
    toast.success("Lead linked");
  }

  async function handleUnlinkLead(leadId) {
    if (!contact) return;
    const lead = leads.find((row) => String(row.id) === String(leadId));
    const relatedLeadIds = (contact.relatedLeadIds || []).filter(
      (id) => String(id) !== String(leadId)
    );
    if (lead) {
      const patch = buildUnlinkLeadPatch(lead, "contact", { id: contact.id });
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
    const merged = { ...contact, relatedLeadIds };
    persistContactMeta(merged);
    setContact(merged);
  }

  async function handleLinkDeal(dealId) {
    if (!contact) return;
    const relatedDealIds = [
      ...new Set([...(contact.relatedDealIds || []), String(dealId)]),
    ];
    const response = await apiFetch(`/api/deals/${dealId}`, {
      method: "PATCH",
      body: JSON.stringify({ contact_id: contact.id }),
    });
    const updated = response.data;
    setDeals((prev) =>
      prev.map((row) => (row.id === updated.id ? updated : row))
    );
    const merged = { ...contact, relatedDealIds };
    persistContactMeta(merged);
    setContact(merged);

    const contactId = String(contact.id);
    const email = String(contact.email || "").trim().toLowerCase();
    const manualLeadIds = new Set((contact.relatedLeadIds || []).map(String));

    await Promise.all(
      leads.map(async (row) => {
        const linked =
          manualLeadIds.has(String(row.id)) ||
          String(row.convertedContactId) === contactId ||
          (email &&
            String(row.email || "").trim().toLowerCase() === email) ||
          (row.related?.contactIds || []).map(String).includes(contactId);
        if (!linked) return;
        if ((row.related?.dealIds || []).map(String).includes(String(dealId))) {
          return;
        }
        try {
          const related = buildNextRelated(row, "deal", dealId);
          const leadResponse = await apiFetch(`/api/leads/${row.id}`, {
            method: "PATCH",
            body: JSON.stringify({ related }),
          });
          const savedLead = fromApiLead(leadResponse.data);
          setLeads((prev) =>
            prev.map((item) => (item.id === savedLead.id ? savedLead : item))
          );
        } catch {
          /* keep contact link even if lead sync fails */
        }
      })
    );

    toast.success("Deal linked");
  }

  async function handleUnlinkDeal(dealId) {
    if (!contact) return;
    const deal = deals.find((row) => String(row.id) === String(dealId));
    const relatedDealIds = (contact.relatedDealIds || []).filter(
      (id) => String(id) !== String(dealId)
    );
    if (deal && String(deal.contact_id) === String(contact.id)) {
      const response = await apiFetch(`/api/deals/${dealId}`, {
        method: "PATCH",
        body: JSON.stringify({ contact_id: null }),
      });
      const updated = response.data;
      setDeals((prev) =>
        prev.map((row) => (row.id === updated.id ? updated : row))
      );
    }
    const merged = { ...contact, relatedDealIds };
    persistContactMeta(merged);
    setContact(merged);
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

  async function handleUnlinkCompany() {
    if (!contact) return;
    const response = await apiFetch(`/api/contacts/${contact.id}`, {
      method: "PATCH",
      body: JSON.stringify({ company_id: null }),
    });
    const saved = fromApiContact(response.data);
    const merged = withContactMeta(saved, { ...contact, companyId: "" });
    persistContactMeta(merged);
    setContact(merged);
  }

  if (loadStatus === "loading") {
    return (
      <div className="mx-auto flex w-full min-w-0 max-w-[1440px] flex-col gap-4 pb-10">
        <PageBreadcrumb
          items={[
            { href: "/contacts", label: "Contacts" },
            { label: "Loading…" },
          ]}
        />
        <LeadDetailSkeleton />
      </div>
    );
  }

  if (loadStatus === "error" || !contact) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-[1440px] pb-10">
        <PageBreadcrumb
          items={[
            { href: "/contacts", label: "Contacts" },
            { label: "Not found" },
          ]}
        />
        <p className="py-16 text-center text-muted-foreground">
          Contact not found.
        </p>
      </div>
    );
  }

  const name = fullName(contact);

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[1440px] flex-col gap-4 pb-10">
      <PageBreadcrumb
        items={[{ href: "/contacts", label: "Contacts" }, { label: name }]}
      />

      <ContactDetailPage
        contact={contact}
        company={company}
        owners={owners}
        contacts={contacts}
        leads={leads}
        deals={deals}
        tasks={tasks}
        activities={activities}
        currentUserId={currentUserId}
        onEdit={() => setEditOpen(true)}
        onAddNote={handleAddNote}
        onCreateTask={handleCreateTask}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
        onCreateMeeting={handleCreateMeeting}
        onUpdateMeeting={handleUpdateMeeting}
        onDeleteMeeting={handleDeleteMeeting}
        onUnlinkCompany={handleUnlinkCompany}
        onLinkLead={handleLinkLead}
        onUnlinkLead={handleUnlinkLead}
        onLinkDeal={handleLinkDeal}
        onUnlinkDeal={handleUnlinkDeal}
      />

      <ContactFormDrawer
        open={editOpen}
        onOpenChange={setEditOpen}
        initialContact={contact}
        onSave={handleSave}
        owners={owners}
        defaultOwnerId={currentUserId}
        companies={companies}
        onCompaniesChange={setCompanies}
        existingEmails={existingEmails}
      />
    </div>
  );
}
