"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  createConversation,
  postConversationMessage,
} from "@/components/communications/communications-api";
import { CommunicationsDropdown } from "@/components/communications/communications-dropdown-field";
import { CommunicationsMessageEditor } from "@/components/communications/communications-message-editor";
import {
  COMM_CHANNELS,
  applyTemplateVariables,
  buildForwardQuote,
} from "@/components/communications/communications-data";
import { fullName } from "@/components/contacts/contacts-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

function contactDisplayName(c) {
  if (!c) return "";
  return fullName({
    firstName: c.firstName ?? c.first_name,
    lastName: c.lastName ?? c.last_name,
    name: c.name,
  });
}

const EMPTY = {
  channel: "email",
  from: "",
  to: "",
  cc: "",
  bcc: "",
  subject: "",
  body: "",
  contact_id: "",
  company_id: "",
  deal_id: "",
};

export function CommunicationsComposeDrawer({
  open,
  onOpenChange,
  contacts = [],
  companies = [],
  deals = [],
  templates = [],
  settings,
  currentUser,
  onConversationCreated,
  replyToConversation,
  forwardFrom,
  canSend = true,
}) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const sender = settings?.email || {};

  useEffect(() => {
    if (!open) return;
    const fromLine = `${sender.name || "NovaCRM"} <${sender.email || "sales@novacrm.app"}>`;
    if (forwardFrom) {
      const subj = forwardFrom.subject || "Conversation";
      setForm({
        ...EMPTY,
        channel: forwardFrom.channel || "email",
        from: fromLine,
        to: forwardFrom.contactEmail || "",
        subject: subj.startsWith("Fwd:") ? subj : `Fwd: ${subj}`,
        body: buildForwardQuote(forwardFrom),
        contact_id: forwardFrom.contactId || "",
        company_id: forwardFrom.companyId || "",
        deal_id: forwardFrom.dealId || "",
      });
      return;
    }
    if (replyToConversation) {
      setForm({
        ...EMPTY,
        channel: replyToConversation.channel || "email",
        from: fromLine,
        to: replyToConversation.contactEmail || "",
        subject: replyToConversation.subject?.startsWith("Re:")
          ? replyToConversation.subject
          : `Re: ${replyToConversation.subject || "Conversation"}`,
        contact_id: replyToConversation.contactId || "",
        company_id: replyToConversation.companyId || "",
        deal_id: replyToConversation.dealId || "",
      });
      return;
    }
    setForm({
      ...EMPTY,
      from: fromLine,
    });
  }, [open, replyToConversation, forwardFrom, sender.email, sender.name]);

  const contactOptions = useMemo(
    () =>
      contacts.map((c) => ({
        id: c.id,
        label: contactDisplayName(c),
        email: c.email,
        companyId: c.company_id || c.companyId,
      })),
    [contacts]
  );

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function selectContact(contactId) {
    const row = contactOptions.find((c) => String(c.id) === contactId);
    if (!row) return;
    setForm((prev) => ({
      ...prev,
      contact_id: contactId,
      to: row.email || prev.to,
      company_id: row.companyId || prev.company_id,
    }));
  }

  function validate() {
    if (form.channel === "email") {
      if (!form.to.trim()) return "Recipient (To) is required";
      if (!form.subject.trim()) return "Subject is required";
    }
    if (!form.body.trim()) return "Message body is required";
    return null;
  }

  async function handleSaveDraft() {
    if (!replyToConversation?.id) {
      toast.message("Start a draft by saving a sent message, or reply in an existing thread");
      return;
    }
    try {
      await postConversationMessage(replyToConversation.id, {
        body: form.body,
        channel: form.channel,
        sender_name: currentUser?.name || sender.name,
        sender_email: sender.email,
        send_email: false,
        status: "draft",
      });
      toast.success("Draft saved");
      onOpenChange(false);
    } catch (error) {
      toast.error(error.message || "Could not save draft");
    }
  }

  async function handleSend() {
    if (!canSend) {
      toast.error("You do not have permission to send messages");
      return;
    }
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    setSaving(true);
    try {
      const messagePayload = {
        direction: "outbound",
        body: form.body,
        channel: form.channel,
        sender_name: currentUser?.name || sender.name,
        sender_email: sender.email,
        subject: form.subject,
        to_email: form.to.trim(),
      };

      if (replyToConversation?.id) {
        const result = await postConversationMessage(replyToConversation.id, {
          ...messagePayload,
          send_email: form.channel === "email",
        });
        onConversationCreated?.(result.conversation);
      } else {
        const contact = contactOptions.find(
          (c) => String(c.id) === String(form.contact_id)
        );
        const company = companies.find(
          (co) => String(co.id) === String(form.company_id)
        );
        const deal = deals.find((d) => String(d.id) === String(form.deal_id));
        const conv = await createConversation({
          channel: form.channel,
          subject: form.subject,
          contact_id: form.contact_id || null,
          company_id: form.company_id || null,
          deal_id: form.deal_id || null,
          contact_name: contact?.label || form.to.split("@")[0],
          contact_email: form.to,
          company_name: company?.name || "",
          deal_name: deal?.name || "",
          assignee_id: currentUser?.id || null,
          last_message_preview: form.body.slice(0, 120),
          message: messagePayload,
          send_email: form.channel === "email",
        });
        onConversationCreated?.(conv);
      }
      toast.success(
        form.channel === "email"
          ? "Message saved — email sends when delivery is configured"
          : "Conversation saved"
      );
      onOpenChange(false);
    } catch (error) {
      toast.error(error.message || "Could not send message");
    } finally {
      setSaving(false);
    }
  }

  function insertTemplate(templateId) {
    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) return;
    const contact = contacts.find((c) => String(c.id) === String(form.contact_id));
    const company = companies.find((c) => String(c.id) === String(form.company_id));
    const deal = deals.find((d) => String(d.id) === String(form.deal_id));
    const ctx = {
      firstName: contact?.firstName || contact?.first_name,
      lastName: contact?.lastName || contact?.last_name,
      companyName: company?.name,
      dealName: deal?.name,
      dealValue: deal?.amount,
      ownerName: currentUser?.name,
    };
    setField("subject", applyTemplateVariables(tpl.subject, ctx));
    setField("body", applyTemplateVariables(tpl.body, ctx));
  }

  const emailChannel = form.channel === "email";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title={forwardFrom ? "Forward message" : "Compose message"}
        description="Outbound email is saved to the thread and sent when SMTP or Resend is configured."
        maxWidth={520}
        onClose={() => onOpenChange(false)}
      >
        <SheetBody className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[13px]">Channel</Label>
            <CommunicationsDropdown
              value={form.channel}
              onChange={(v) => setField("channel", v)}
              triggerClassName="rounded-lg"
              options={COMM_CHANNELS.map((ch) => ({
                value: ch.id,
                label: ch.label,
                disabled: ch.id !== "email",
              }))}
            />
          </div>

          {emailChannel ? (
            <>
              <Field label="From" required>
                <Input
                  className="h-9 rounded-lg"
                  value={form.from}
                  onChange={(e) => setField("from", e.target.value)}
                />
              </Field>
              <Field label="To" required>
                <Input
                  className="h-9 rounded-lg"
                  value={form.to}
                  onChange={(e) => setField("to", e.target.value)}
                  placeholder="contact@company.com"
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="CC">
                  <Input
                    className="h-9 rounded-lg"
                    value={form.cc}
                    onChange={(e) => setField("cc", e.target.value)}
                  />
                </Field>
                <Field label="BCC">
                  <Input
                    className="h-9 rounded-lg"
                    value={form.bcc}
                    onChange={(e) => setField("bcc", e.target.value)}
                  />
                </Field>
              </div>
              <Field label="Subject" required>
                <Input
                  className="h-9 rounded-lg"
                  value={form.subject}
                  onChange={(e) => setField("subject", e.target.value)}
                />
              </Field>
            </>
          ) : (
            <p className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50 px-3 py-2 text-[12px] text-muted-foreground dark:border-neutral-800">
              Call threads are logged from Activities. Compose is available for email.
            </p>
          )}

          <Field label="Related contact">
            <CommunicationsDropdown
              value={form.contact_id || "none"}
              onChange={(v) => (v === "none" ? setField("contact_id", "") : selectContact(v))}
              placeholder="Select contact"
              triggerClassName="rounded-lg"
              options={[
                { value: "none", label: "None" },
                ...contactOptions.map((c) => ({
                  value: String(c.id),
                  label: c.label,
                })),
              ]}
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Company">
              <CommunicationsDropdown
                value={form.company_id || "none"}
                onChange={(v) => setField("company_id", v === "none" ? "" : v)}
                placeholder="Company"
                triggerClassName="rounded-lg"
                options={[
                  { value: "none", label: "None" },
                  ...companies.map((c) => ({
                    value: String(c.id),
                    label: c.name,
                  })),
                ]}
              />
            </Field>
            <Field label="Deal">
              <CommunicationsDropdown
                value={form.deal_id || "none"}
                onChange={(v) => setField("deal_id", v === "none" ? "" : v)}
                placeholder="Deal"
                triggerClassName="rounded-lg"
                options={[
                  { value: "none", label: "None" },
                  ...deals.map((c) => ({
                    value: String(c.id),
                    label: c.name,
                  })),
                ]}
              />
            </Field>
          </div>

          <Field label="Message" required>
            <CommunicationsMessageEditor
              value={form.body}
              onChange={(v) => setField("body", v)}
              onAttach={() => toast.message("File attachments coming soon")}
              onInsertTemplate={
                templates.length
                  ? () => {
                      const first = templates[0];
                      if (first) insertTemplate(first.id);
                      toast.message("Inserted first template — pick another from Quick template");
                    }
                  : undefined
              }
            />
          </Field>

          {templates.length ? (
            <div className="space-y-1.5">
              <Label className="text-[12px] text-muted-foreground">Quick template</Label>
              <CommunicationsDropdown
                value=""
                onChange={insertTemplate}
                placeholder="Insert template…"
                triggerClassName="rounded-lg"
                options={templates.map((t) => ({
                  value: t.id,
                  label: t.name,
                }))}
              />
            </div>
          ) : null}
        </SheetBody>
        <SheetFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="outline" onClick={handleSaveDraft}>
            Save draft
          </Button>
          <Button
            type="button"
            className={cn("bg-primary-600 text-white hover:bg-primary-700")}
            disabled={saving || !emailChannel || !canSend}
            onClick={handleSend}
          >
            {saving ? "Sending…" : forwardFrom ? "Forward" : "Send email"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, required, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="gap-1 text-[13px]">
        {required ? (
          <span className="text-error-text" aria-hidden>
            *
          </span>
        ) : null}
        {label}
      </Label>
      {children}
    </div>
  );
}
