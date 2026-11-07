import { LeadDetailSkeleton } from "@/components/leads/lead-skeletons";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";

export default function LeadDetailLoading() {
  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[1440px] flex-col gap-4 pb-10">
      <PageBreadcrumb
        items={[{ href: "/leads", label: "Leads" }, { label: "Loading…" }]}
      />
      <LeadDetailSkeleton />
    </div>
  );
}
