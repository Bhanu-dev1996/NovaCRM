import { Suspense } from "react";

import { ContactDetailView } from "@/components/contacts/contact-detail-view";
import { ContactsSkeleton } from "@/components/contacts/contacts-home";
import { siteConfig } from "@/config/site";

export async function generateMetadata({ params }) {
  const { id } = await params;
  return {
    title: `Contact · ${siteConfig.name}`,
    description: `Contact profile ${id} in ${siteConfig.name}.`,
  };
}

export default async function ContactDetailPage({ params }) {
  const { id } = await params;
  return (
    <Suspense fallback={<ContactsSkeleton />}>
      <ContactDetailView contactId={id} />
    </Suspense>
  );
}
