import { Suspense } from "react";

import { ContactsHome } from "@/components/contacts/contacts-home";
import { CrmSkeleton } from "@/components/crm/crm-shared";
import { siteConfig } from "@/config/site";

export const metadata = {
  title: "Contacts",
  description: `People linked to companies and deals in ${siteConfig.name}.`,
};

export default function ContactsPage() {
  return (
    <Suspense fallback={<CrmSkeleton />}>
      <ContactsHome />
    </Suspense>
  );
}
