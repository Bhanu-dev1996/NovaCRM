import { Suspense } from "react";

import {
  ContactDetailSkeleton,
  ContactDetailView,
} from "@/components/contacts/contact-detail-view";
import { siteConfig } from "@/config/site";

export async function generateMetadata({ params }) {
  const { id } = await params;
  return {
    title: `Contact · ${siteConfig.name}`,
    description: `Contact profile ${id} in ${siteConfig.name}.`,
  };
}

async function ContactDetailContent({ params }) {
  const { id } = await params;
  return <ContactDetailView contactId={id} />;
}

export default function ContactDetailPage({ params }) {
  return (
    <Suspense fallback={<ContactDetailSkeleton />}>
      <ContactDetailContent params={params} />
    </Suspense>
  );
}
