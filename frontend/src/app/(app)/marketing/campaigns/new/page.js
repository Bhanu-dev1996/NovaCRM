"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function NewCampaignRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("create", "1");
    const edit = searchParams.get("edit");
    const templateId = searchParams.get("templateId");
    const segmentId = searchParams.get("segmentId");
    if (edit) params.set("edit", edit);
    if (templateId) params.set("templateId", templateId);
    if (segmentId) params.set("segmentId", segmentId);
    router.replace(`/marketing/campaigns?${params.toString()}`);
  }, [router, searchParams]);

  return null;
}