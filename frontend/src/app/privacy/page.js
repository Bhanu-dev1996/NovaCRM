import { LegalSection, LegalShell } from "@/components/legal/legal-shell";
import { siteConfig } from "@/config/site";

export const metadata = {
  title: "Privacy Policy",
  description: `Privacy Policy for ${siteConfig.name}`,
};

export default function PrivacyPage() {
  return (
    <LegalShell
      title="Privacy Policy"
      description="Effective Date: October 24, 2026 · Last Updated: October 24, 2026"
    >
      <LegalSection title="1. Introduction">
        <p>
          At NovaCRM AI (“NovaCRM,” “we,” “our,” or “us”), we value privacy and
          are committed to handling personal information responsibly.
        </p>
        <p>
          This Privacy Policy explains how we collect, use, disclose, store, and
          protect information when you visit our website, create an account, use
          our CRM platform, or interact with our support services.
        </p>
        <p>
          This Policy applies to the NovaCRM website, applications, and related
          Services. Certain organizations may have additional privacy terms
          governing information they manage through their workspaces.
        </p>
      </LegalSection>

      <LegalSection title="2. Information We Collect">
        <p>
          The information we collect depends on how you use NovaCRM and which
          features you enable.
        </p>

        <h3 className="pt-1 text-[16px] font-semibold text-neutral-900">
          2.1 Account Information
        </h3>
        <p>When you create or manage an account, we may collect:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Name and email address.</li>
          <li>Password credentials in appropriately protected form.</li>
          <li>Profile image and job title, if provided.</li>
          <li>Authentication and account preferences.</li>
          <li>Workspace membership and role information.</li>
        </ul>
        <p>
          If you sign in using a third-party identity provider, we may receive
          information authorized by that provider.
        </p>

        <h3 className="pt-1 text-[16px] font-semibold text-neutral-900">
          2.2 Customer and CRM Information
        </h3>
        <p>
          Users may submit information to manage their business relationships,
          including:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Customer and contact names.</li>
          <li>Business email addresses and telephone numbers.</li>
          <li>Company and account information.</li>
          <li>Leads, deals, notes, tasks, and sales activities.</li>
          <li>Communications and meeting details.</li>
          <li>Support tickets, attachments, and related records.</li>
        </ul>
        <p>
          The organization or individual that submits this information is
          responsible for determining the appropriate purposes and lawful basis
          for its use.
        </p>

        <h3 className="pt-1 text-[16px] font-semibold text-neutral-900">
          2.3 Usage and Technical Information
        </h3>
        <p>We may collect technical information such as:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Browser type and device information.</li>
          <li>
            IP address and approximate location derived from it, where
            collected.
          </li>
          <li>Log-in timestamps and security events.</li>
          <li>Pages visited and feature interactions.</li>
          <li>Error logs, performance metrics, and diagnostic information.</li>
        </ul>
        <p>
          The precise information collected depends on the services and
          monitoring technologies we use.
        </p>

        <h3 className="pt-1 text-[16px] font-semibold text-neutral-900">
          2.4 Communications and Support
        </h3>
        <p>
          If you contact us, we may retain your messages, support requests,
          feedback, and information necessary to respond to your inquiry.
        </p>

        <h3 className="pt-1 text-[16px] font-semibold text-neutral-900">
          2.5 Cookies and Similar Technologies
        </h3>
        <p>
          NovaCRM may use essential cookies or similar technologies to maintain
          sessions, protect accounts, remember preferences, and support core
          functionality.
        </p>
        <p>
          If analytics or advertising technologies are used, we will provide
          appropriate disclosures and choices where required by law.
        </p>
      </LegalSection>

      <LegalSection title="3. How We Use Information">
        <p>We may use information to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Create and maintain user accounts.</li>
          <li>Operate workspaces and CRM features.</li>
          <li>Organize customer records and sales activities.</li>
          <li>Provide AI-assisted functionality requested by users.</li>
          <li>Process subscriptions and payments, where applicable.</li>
          <li>Send service messages and security notifications.</li>
          <li>Respond to support requests.</li>
          <li>Diagnose errors and improve performance.</li>
          <li>Prevent fraud, abuse, and unauthorized access.</li>
          <li>Comply with legal obligations.</li>
          <li>Enforce our terms and protect our rights.</li>
        </ul>
        <p>
          We will not describe a use as occurring unless it reflects our actual
          practices.
        </p>
      </LegalSection>

      <LegalSection title="4. AI Features and Data Processing">
        <p>
          NovaCRM may offer AI-assisted summaries, recommendations, lead
          scoring, text generation, and workflow automation.
        </p>
        <p>
          When you use these features, relevant inputs may be processed by
          NovaCRM and, where applicable, third-party AI providers to produce the
          requested output.
        </p>
        <p>
          We will disclose relevant provider relationships and data-handling
          practices where required. The specific information shared depends on
          the feature, your configuration, and applicable agreements.
        </p>
        <p>
          Do not submit sensitive personal information to AI features unless the
          feature is appropriate for that information and you have the necessary
          authorization.
        </p>
        <p>
          Whether AI inputs or outputs are retained, used for model training, or
          processed by third parties depends on the actual service configuration
          and provider terms. NovaCRM must document these practices accurately
          before publication.
        </p>
      </LegalSection>

      <LegalSection title="5. How We Share Information">
        <p>We may share information in the following circumstances:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Service providers:</strong> With hosting, database,
            authentication, email delivery, payment, analytics, and AI providers
            when needed to operate the Services.
          </li>
          <li>
            <strong>Workspace members:</strong> With authorized members of the
            same workspace according to their assigned permissions and
            organizational settings.
          </li>
          <li>
            <strong>Integrations:</strong> With third-party services you choose
            to connect, as necessary to perform the requested integration.
          </li>
          <li>
            <strong>Legal requirements:</strong> When disclosure is required by
            law or reasonably necessary to respond to valid legal processes and
            protect rights or safety.
          </li>
          <li>
            <strong>Business transfers:</strong> In connection with a merger,
            acquisition, financing, or transfer of assets, subject to
            appropriate safeguards and applicable law.
          </li>
          <li>
            <strong>With your direction:</strong> When you explicitly authorize
            a particular disclosure.
          </li>
        </ul>
        <p>
          We do not claim to sell or share personal information for advertising
          purposes unless our actual practices and applicable law support that
          disclosure.
        </p>
      </LegalSection>

      <LegalSection title="6. Data Retention">
        <p>
          We retain information for as long as reasonably necessary to provide
          the Services, maintain accounts, meet contractual obligations, resolve
          disputes, maintain security, and comply with legal requirements.
        </p>
        <p>
          Retention periods vary by information type and purpose.
        </p>
        <p>
          When information is no longer required, we will delete it, anonymize
          it, or securely dispose of it as appropriate, subject to applicable
          legal obligations, backups, and documented retention policies.
        </p>
        <p>
          Workspace administrators may have additional controls over customer
          records and user access.
        </p>
      </LegalSection>

      <LegalSection title="7. Data Security">
        <p>
          We use appropriate technical and organizational safeguards intended to
          protect information from unauthorized access, alteration, disclosure,
          or destruction.
        </p>
        <p>
          Depending on the deployed product configuration, safeguards may
          include access controls, authentication protections, encrypted
          communications, monitoring, backups, and restricted administrative
          access.
        </p>
        <p>
          No security measure is perfect. Users should maintain strong
          credentials, protect their devices, and promptly report suspected
          security incidents.
        </p>
      </LegalSection>

      <LegalSection title="8. International Data Transfers">
        <p>
          NovaCRM and its service providers may process information in countries
          other than the country in which it was collected.
        </p>
        <p>
          Where international transfers are subject to legal restrictions, we
          will implement applicable safeguards and transfer mechanisms.
        </p>
        <p>
          The countries involved and the safeguards used depend on our actual
          infrastructure and provider arrangements.
        </p>
      </LegalSection>

      <LegalSection title="9. Your Privacy Rights">
        <p>
          Depending on your location and applicable law, you may have rights to:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Request access to personal information.</li>
          <li>Correct inaccurate information.</li>
          <li>Request deletion of eligible information.</li>
          <li>
            Request a copy of certain information in a portable format.
          </li>
          <li>Object to or restrict certain processing.</li>
          <li>Withdraw consent where processing relies on consent.</li>
          <li>
            Lodge a complaint with a competent data protection authority.
          </li>
        </ul>
        <p>
          To exercise these rights, contact us using the details below. We may
          need to verify your identity before processing a request.
        </p>
        <p>
          If your information is managed by an organization using NovaCRM,
          contact that organization first where it acts as the responsible data
          controller.
        </p>
      </LegalSection>

      <LegalSection title="10. Children's Privacy">
        <p>
          NovaCRM is intended for business use and is not designed for children
          who are not legally permitted to use the Services.
        </p>
        <p>
          We do not knowingly collect children&apos;s personal information in
          violation of applicable law. If you believe such information has been
          collected improperly, contact us so that we can investigate and take
          appropriate action.
        </p>
      </LegalSection>

      <LegalSection title="11. Third-Party Links and Integrations">
        <p>
          NovaCRM may contain links to third-party websites or integrations.
        </p>
        <p>
          Those services operate under their own privacy policies and practices.
          We encourage you to review their policies before providing information
          or authorizing access.
        </p>
      </LegalSection>

      <LegalSection title="12. Changes to This Policy">
        <p>
          We may update this Privacy Policy to reflect changes in our Services,
          technology, business operations, or legal obligations.
        </p>
        <p>
          We will update the “Last Updated” date and provide additional notice
          where required.
        </p>
      </LegalSection>

      <LegalSection title="13. Contact Us">
        <p>For privacy questions, requests, or concerns, contact:</p>
        <p>
          <strong>NovaCRM Privacy Support</strong>
          <br />
          Email: privacy@novacrm.ai
          <br />
          Website: https://novacrm.ai
          <br />
          Business Address: To be confirmed prior to commercial launch
        </p>
        <p>
          If applicable, include the contact details of your designated privacy
          representative or data protection officer.
        </p>
      </LegalSection>

      <p className="border-t border-neutral-200 pt-6 text-[14px] text-neutral-500">
        This Privacy Policy should be read together with the NovaCRM Terms of
        Service and any applicable customer or data-processing agreement.
      </p>
    </LegalShell>
  );
}
