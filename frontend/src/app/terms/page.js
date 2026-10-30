import { LegalSection, LegalShell } from "@/components/legal/legal-shell";
import { siteConfig } from "@/config/site";

export const metadata = {
  title: "Terms of Service",
  description: `Terms of Service for ${siteConfig.name}`,
};

export default function TermsPage() {
  return (
    <LegalShell
      title="Terms of Service"
      description="Effective Date: October 24, 2026 · Last Updated: October 24, 2026"
    >
      <LegalSection title="1. Introduction">
        <p>
          Welcome to NovaCRM AI (“NovaCRM,” “we,” “our,” or “us”). NovaCRM
          provides customer relationship management software designed to help
          businesses organize customer information, manage sales pipelines,
          coordinate team activities, and improve business operations through
          AI-assisted features.
        </p>
        <p>
          These Terms of Service (“Terms”) govern your access to and use of the
          NovaCRM website, applications, features, and related services
          (collectively, the “Services”).
        </p>
        <p>
          By creating an account, accessing, or using the Services, you agree to
          these Terms. If you do not agree, you must not access or use the
          Services.
        </p>
      </LegalSection>

      <LegalSection title="2. Eligibility and Accounts">
        <p>
          You must be legally capable of entering into a binding agreement to
          use the Services.
        </p>
        <p>When creating an account, you agree to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Provide accurate, complete, and current information.</li>
          <li>Maintain the confidentiality of your login credentials.</li>
          <li>Keep your account information up to date.</li>
          <li>Notify us promptly of suspected unauthorized access.</li>
          <li>
            Accept responsibility for activities performed through your account,
            subject to applicable law.
          </li>
        </ul>
        <p>
          We may require additional verification to protect accounts and
          maintain service security.
        </p>
      </LegalSection>

      <LegalSection title="3. Workspaces and Team Access">
        <p>
          NovaCRM may allow users to create workspaces, invite team members,
          assign roles, and manage access permissions.
        </p>
        <p>
          Workspace owners and administrators are responsible for managing
          membership and permissions appropriately. Users must not access
          information or perform actions beyond their authorized permissions.
        </p>
        <p>
          Organizations using NovaCRM should ensure that their team members
          understand and comply with applicable confidentiality, privacy, and
          security requirements.
        </p>
      </LegalSection>

      <LegalSection title="4. Acceptable Use">
        <p>You agree to use NovaCRM lawfully and responsibly.</p>
        <p>You must not:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Use the Services for fraudulent, deceptive, or unlawful activities.
          </li>
          <li>
            Upload malicious software or attempt to compromise system security.
          </li>
          <li>Access another user&apos;s account without authorization.</li>
          <li>
            Interfere with the availability or operation of the Services.
          </li>
          <li>
            Attempt to bypass authentication, permissions, or usage
            restrictions.
          </li>
          <li>
            Use the Services to transmit unlawful, infringing, or harmful
            content.
          </li>
          <li>
            Use customer data for purposes that violate applicable privacy or
            marketing laws.
          </li>
          <li>
            Reverse engineer or misuse the Services except where permitted by
            applicable law.
          </li>
        </ul>
        <p>
          We may investigate suspected violations and take proportionate action
          where permitted by law.
        </p>
      </LegalSection>

      <LegalSection title="5. Customer Data and Content">
        <p>
          You retain your rights to the information, files, communications, and
          other content you submit to NovaCRM (“Customer Data”).
        </p>
        <p>
          You grant us a limited, non-exclusive right to host, process,
          transmit, and display Customer Data only as reasonably necessary to
          provide, secure, maintain, and improve the Services in accordance with
          these Terms and our Privacy Policy.
        </p>
        <p>
          You are responsible for ensuring that you have the rights,
          permissions, and lawful basis necessary to submit Customer Data to
          NovaCRM.
        </p>
        <p>
          Where you use NovaCRM to manage information about customers,
          employees, or other individuals, you must comply with applicable data
          protection and confidentiality obligations.
        </p>
      </LegalSection>

      <LegalSection title="6. AI-Powered Features">
        <p>
          NovaCRM may provide AI-assisted features, including summaries,
          recommendations, lead scoring, content drafting, and workflow
          suggestions.
        </p>
        <p>
          AI-generated output may be incomplete, inaccurate, outdated, or
          inappropriate for a particular situation. You are responsible for
          reviewing AI-generated content before relying on it or sharing it with
          others.
        </p>
        <p>
          AI outputs should not be treated as professional legal, financial,
          medical, or other regulated advice. Do not rely on AI-generated
          results as the sole basis for consequential business decisions without
          appropriate human review.
        </p>
        <p>
          AI functionality may depend on third-party providers and may be
          subject to additional limitations or terms disclosed within the
          Services.
        </p>
      </LegalSection>

      <LegalSection title="7. Third-Party Services">
        <p>
          The Services may integrate with third-party products, including email
          providers, calendars, analytics platforms, and AI services.
        </p>
        <p>
          Your use of third-party services may be subject to separate terms and
          privacy policies. NovaCRM is not responsible for the independent
          operation or policies of third-party services, except where applicable
          law provides otherwise.
        </p>
        <p>
          You authorize integrations only to the extent permitted by the
          permissions you grant and the configuration you select.
        </p>
      </LegalSection>

      <LegalSection title="8. Plans, Fees, and Billing">
        <p>Certain features may require a paid subscription.</p>
        <p>
          Where applicable, subscription prices, billing periods, usage limits,
          renewal terms, and cancellation procedures will be disclosed before
          purchase.
        </p>
        <p>
          You authorize applicable subscription charges when you complete a
          purchase. Unless otherwise stated, subscriptions may renew
          automatically until canceled according to the disclosed terms.
        </p>
        <p>
          Refunds, taxes, and payment disputes will be handled in accordance
          with the applicable subscription terms and law.
        </p>
      </LegalSection>

      <LegalSection title="9. Service Availability and Changes">
        <p>
          We aim to provide reliable access to NovaCRM but do not guarantee
          uninterrupted or error-free operation.
        </p>
        <p>
          We may update, modify, suspend, or discontinue features for
          operational, security, legal, or business reasons. Where required by
          law or applicable agreements, we will provide appropriate notice.
        </p>
        <p>
          We may perform maintenance that temporarily affects service
          availability.
        </p>
      </LegalSection>

      <LegalSection title="10. Intellectual Property">
        <p>
          NovaCRM and its associated software, branding, designs, documentation,
          and original materials are owned by us or our licensors and are
          protected by applicable intellectual property laws.
        </p>
        <p>
          Subject to these Terms, we grant you a limited, non-exclusive,
          non-transferable right to use the Services for their intended
          purposes.
        </p>
        <p>
          Except as expressly permitted, you may not copy, redistribute, modify,
          or commercially exploit our proprietary materials without
          authorization.
        </p>
      </LegalSection>

      <LegalSection title="11. Privacy and Security">
        <p>
          Our collection and use of personal information are described in the
          NovaCRM Privacy Policy.
        </p>
        <p>
          We use appropriate technical and organizational measures intended to
          protect information. However, no method of electronic transmission or
          storage can be guaranteed to be completely secure.
        </p>
        <p>
          You are responsible for protecting your account credentials and
          configuring workspace permissions appropriately.
        </p>
      </LegalSection>

      <LegalSection title="12. Suspension and Termination">
        <p>
          You may stop using the Services and close your account according to
          the available account settings or support procedures.
        </p>
        <p>
          We may restrict, suspend, or terminate access where reasonably
          necessary to address security risks, legal obligations, material
          violations of these Terms, non-payment, or misuse of the Services.
        </p>
        <p>
          Where appropriate and legally permitted, we will provide notice and an
          opportunity to resolve the issue.
        </p>
        <p>
          Following termination, access to Customer Data may be restricted or
          removed in accordance with the applicable retention policy,
          contractual commitments, and legal requirements.
        </p>
      </LegalSection>

      <LegalSection title="13. Disclaimers">
        <p>
          To the extent permitted by law, the Services are provided on an “as
          available” basis. We do not warrant that the Services will always be
          uninterrupted, error-free, or suitable for every business requirement.
        </p>
        <p>
          Nothing in these Terms excludes warranties or rights that cannot
          lawfully be excluded.
        </p>
      </LegalSection>

      <LegalSection title="14. Limitation of Liability">
        <p>
          To the extent permitted by applicable law, NovaCRM will not be liable
          for indirect, incidental, special, consequential, or punitive losses
          arising from the use of the Services.
        </p>
        <p>
          Any additional limitations on liability must be interpreted subject to
          applicable law and any mandatory rights that cannot be waived or
          restricted.
        </p>
      </LegalSection>

      <LegalSection title="15. Changes to These Terms">
        <p>
          We may update these Terms as the Services evolve or as required by
          law.
        </p>
        <p>
          We will update the “Last Updated” date and provide notice of material
          changes where required. Continued use of the Services after changes
          take effect constitutes acceptance where legally valid.
        </p>
      </LegalSection>

      <LegalSection title="16. Governing Law">
        <p>
          These Terms are subject to the laws applicable to the NovaCRM
          operating entity, without limiting any mandatory legal protections
          available to users.
        </p>
        <p>
          The applicable entity, governing law, and dispute-resolution
          arrangements must be specified before these Terms are published for
          actual use.
        </p>
      </LegalSection>

      <LegalSection title="17. Contact Us">
        <p>For questions about these Terms, contact:</p>
        <p>
          <strong>NovaCRM Support</strong>
          <br />
          Email: support@novacrm.ai
          <br />
          Website: https://novacrm.ai
          <br />
          Business Address: To be confirmed prior to commercial launch
        </p>
      </LegalSection>

      <p className="border-t border-neutral-200 pt-6 text-[14px] text-neutral-500">
        By using NovaCRM, you acknowledge that you have read and understood
        these Terms of Service.
      </p>
    </LegalShell>
  );
}
