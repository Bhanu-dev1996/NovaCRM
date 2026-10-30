import Link from "next/link";

import { LegalSection, LegalShell } from "@/components/legal/legal-shell";
import { siteConfig } from "@/config/site";

export const metadata = {
  title: "Help Center",
  description: `Help Center for ${siteConfig.name}`,
};

function FaqItem({ question, children }) {
  return (
    <div className="space-y-1.5">
      <h3 className="text-[15px] font-semibold text-neutral-900">{question}</h3>
      <div className="space-y-2 text-[15px] leading-7 text-neutral-700">
        {children}
      </div>
    </div>
  );
}

export default function HelpPage() {
  return (
    <LegalShell
      title="NovaCRM Help Center"
      description="Your guide to managing customer relationships with confidence."
    >
      <p>
        Welcome to the NovaCRM Help Center. Find answers, learn how to use your
        workspace, and discover ways to get more from your CRM.
      </p>
      <p>
        Whether you&apos;re setting up your account, managing leads, tracking
        deals, or exploring AI-powered features, we&apos;re here to help.
      </p>

      <LegalSection title="Getting Started">
        <FaqItem question="How do I create a NovaCRM account?">
          <p>
            Select{" "}
            <Link
              href="/signup"
              className="font-medium text-primary-600 hover:text-primary-700"
            >
              Create account
            </Link>{" "}
            on the sign-in page. Enter your name, email, and password, then
            follow the verification and workspace setup instructions.
          </p>
        </FaqItem>

        <FaqItem question="How do I sign in?">
          <p>
            Enter your registered email address and password on the{" "}
            <Link
              href="/login"
              className="font-medium text-primary-600 hover:text-primary-700"
            >
              login page
            </Link>
            . If your workspace supports an identity provider, you may also use
            the available single sign-on option.
          </p>
        </FaqItem>

        <FaqItem question="I forgot my password. What should I do?">
          <p>
            Select{" "}
            <Link
              href="/forgot-password"
              className="font-medium text-primary-600 hover:text-primary-700"
            >
              Forgot password?
            </Link>{" "}
            on the login page. Enter your email address and follow the
            instructions in the password-reset message. Check your spam folder
            if you cannot find the email.
          </p>
        </FaqItem>

        <FaqItem question="How do I set up my workspace?">
          <p>
            Open workspace settings to update your workspace name, company
            information, preferences, and other available configuration options.
          </p>
        </FaqItem>
      </LegalSection>

      <LegalSection title="Managing Leads and Contacts">
        <FaqItem question="How do I create a lead?">
          <p>
            Open <strong>Leads</strong>, select <strong>Add Lead</strong>, enter
            the available contact and business details, assign an owner, and
            save the record.
          </p>
        </FaqItem>

        <FaqItem question="Can I import existing contacts?">
          <p>
            If contact import is enabled for your workspace, open the import
            option and follow the file-format and field-mapping instructions.
            Review the preview for missing or duplicate information before
            confirming the import.
          </p>
        </FaqItem>

        <FaqItem question="How do I convert a lead into a contact or deal?">
          <p>
            Open the lead record and select the available conversion action.
            Review the associated contact, company, and deal information before
            confirming.
          </p>
        </FaqItem>

        <FaqItem question="Can I assign leads to teammates?">
          <p>
            If your role has the required permissions, open the lead record or
            select leads in the list and use the assignment action to choose an
            available teammate.
          </p>
        </FaqItem>
      </LegalSection>

      <LegalSection title="Managing Deals">
        <FaqItem question="How do I create a deal?">
          <p>
            Open <strong>Deals</strong>, select <strong>Create Deal</strong>,
            enter the deal name and value, associate a contact or company,
            choose a pipeline stage, and save.
          </p>
        </FaqItem>

        <FaqItem question="How do I update a deal&apos;s stage?">
          <p>
            Open the pipeline and move the deal to the appropriate stage if
            drag-and-drop is enabled, or use the stage selector on the deal
            details page.
          </p>
        </FaqItem>

        <FaqItem question="How do I record a won or lost deal?">
          <p>
            Open the deal and choose the appropriate outcome action. Add the
            requested details and confirm the change.
          </p>
        </FaqItem>
      </LegalSection>

      <LegalSection title="Tasks and Calendar">
        <FaqItem question="How do I create a follow-up task?">
          <p>
            Open <strong>Activities</strong> or the relevant CRM record, select{" "}
            <strong>Create Task</strong>, add a title and due date, assign an
            owner, and save.
          </p>
        </FaqItem>

        <FaqItem question="How do I schedule a meeting?">
          <p>
            Open <strong>Calendar</strong> or select the meeting action on a CRM
            record. Enter the date, time, participants, and relevant details,
            then save.
          </p>
          <p>
            Calendar synchronization and meeting links depend on the
            integrations enabled for your workspace.
          </p>
        </FaqItem>
      </LegalSection>

      <LegalSection title="AI Features">
        <FaqItem question="What can the NovaCRM AI assistant do?">
          <p>
            Depending on the features enabled for your account, the assistant
            can help summarize CRM records, draft follow-up messages, identify
            potential priorities, and suggest next steps.
          </p>
        </FaqItem>

        <FaqItem question="Can I trust every AI-generated recommendation?">
          <p>
            AI outputs may be inaccurate or incomplete. Review recommendations
            and generated content before relying on them or sharing them with
            customers.
          </p>
        </FaqItem>

        <FaqItem question="Will AI automatically send emails or modify records?">
          <p>
            This depends on the specific workflow and permissions configured for
            your workspace. Review the action details and confirmation
            requirements before enabling automation.
          </p>
        </FaqItem>
      </LegalSection>

      <LegalSection title="Account and Security">
        <FaqItem question="How do I change my password?">
          <p>
            Open your profile or security settings and select the available
            password-management option. If you sign in through an external
            identity provider, password changes may need to be completed through
            that provider.
          </p>
          <p>
            You can also use{" "}
            <Link
              href="/forgot-password"
              className="font-medium text-primary-600 hover:text-primary-700"
            >
              Forgot password?
            </Link>{" "}
            to receive a reset link by email.
          </p>
        </FaqItem>

        <FaqItem question="How do I invite a teammate?">
          <p>
            If you have permission, open{" "}
            <strong>Settings → Users &amp; Permissions</strong>, choose{" "}
            <strong>Invite Member</strong>, enter the person&apos;s email
            address, assign a role, and send the invitation.
          </p>
        </FaqItem>

        <FaqItem question="How do I manage access permissions?">
          <p>
            Workspace administrators can review available roles and permissions
            under <strong>Settings → Users &amp; Permissions</strong>.
          </p>
        </FaqItem>

        <FaqItem question="How do I contact support?">
          <p>
            Use the support option in the application or email our support team
            using the official contact address published on the NovaCRM website.
          </p>
        </FaqItem>
      </LegalSection>

      <LegalSection title="Troubleshooting">
        <FaqItem question="I did not receive my verification email.">
          <p>
            Check your spam folder, confirm that your email address is correct,
            and use the resend option if available. If the issue persists,
            contact support.
          </p>
        </FaqItem>

        <FaqItem question="I cannot access a feature.">
          <p>
            Check whether you have the necessary workspace role and whether the
            feature is available under your current plan or configuration.
          </p>
        </FaqItem>

        <FaqItem question="A page is not loading correctly.">
          <p>
            Refresh the page, check your internet connection, and try again. If
            the issue continues, contact support with the page name, approximate
            time, and a description of the problem. Avoid sharing passwords or
            confidential customer information.
          </p>
        </FaqItem>

        <FaqItem question="My integration is not syncing.">
          <p>
            Open the relevant integration settings, review the connection
            status, and follow any available reconnect or troubleshooting
            instructions.
          </p>
        </FaqItem>
      </LegalSection>

      <LegalSection title="Still Need Help?">
        <p>
          We&apos;re here to help you get the most from NovaCRM.
        </p>
        <p>
          <strong>Contact Support</strong>
          <br />
          Email: support@novacrm.ai
          <br />
          Support availability: Monday–Friday, 9:00–18:00 (local business hours)
        </p>
        <p>
          When contacting support, include a brief description of the issue and
          any relevant error message. Never send your password, authentication
          codes, or unnecessary customer data.
        </p>
        <p>
          You can also review our{" "}
          <Link
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary-600 hover:text-primary-700"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary-600 hover:text-primary-700"
          >
            Privacy Policy
          </Link>
          .
        </p>
        <p className="text-[14px] text-neutral-500">
          <strong>NovaCRM Support Team</strong>
          <br />
          Helping you build stronger customer relationships, one interaction at
          a time.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
