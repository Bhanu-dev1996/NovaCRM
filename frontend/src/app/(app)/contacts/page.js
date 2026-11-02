import { Suspense } from "react";

import { ContactsHome, ContactsSkeleton } from "@/components/contacts/contacts-home";
import { siteConfig } from "@/config/site";

export const metadata = {
  title: "Contacts",
  description: `People linked to companies and deals in ${siteConfig.name}.`,
};

export default function ContactsPage() {
  return (
    <Suspense fallback={<ContactsSkeleton />}>
      <ContactsHome />
    </Suspense>
  );
}
