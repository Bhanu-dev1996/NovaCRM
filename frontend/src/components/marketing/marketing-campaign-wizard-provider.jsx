"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { MarketingCampaignWizardBody } from "@/components/marketing/marketing-campaign-wizard";
import {
  Sheet,
  SheetBody,
  SheetContent,
} from "@/components/ui/sheet";

const CampaignWizardContext = createContext(null);

const CLOSED = {
  open: false,
  editId: null,
  templateId: null,
  segmentId: null,
};

export function useCampaignWizard() {
  const ctx = useContext(CampaignWizardContext);
  if (!ctx) {
    throw new Error("useCampaignWizard must be used within MarketingCampaignWizardProvider");
  }
  return ctx;
}

export function MarketingCampaignWizardProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [wizard, setWizard] = useState(CLOSED);

  const clearCreateQuery = useCallback(() => {
    if (pathname !== "/marketing/campaigns" || !searchParams.get("create")) return;
    router.replace("/marketing/campaigns", { scroll: false });
  }, [pathname, router, searchParams]);

  const closeWizard = useCallback(() => {
    setWizard(CLOSED);
    clearCreateQuery();
  }, [clearCreateQuery]);

  const openCampaignWizard = useCallback((opts = {}) => {
    setWizard({
      open: true,
      editId: opts.editId ? String(opts.editId) : null,
      templateId: opts.templateId ? String(opts.templateId) : null,
      segmentId: opts.segmentId ? String(opts.segmentId) : null,
    });
  }, []);

  useEffect(() => {
    if (pathname !== "/marketing/campaigns") return;
    if (searchParams.get("create") !== "1") return;
    setWizard({
      open: true,
      editId: searchParams.get("edit"),
      templateId: searchParams.get("templateId"),
      segmentId: searchParams.get("segmentId"),
    });
  }, [pathname, searchParams]);

  const sessionKey = useMemo(
    () =>
      [wizard.open, wizard.editId, wizard.templateId, wizard.segmentId]
        .map((v) => v ?? "")
        .join("|"),
    [wizard]
  );

  function handleSaved(campaignId) {
    closeWizard();
    router.push(`/marketing/campaigns/${campaignId}`);
  }

  const value = useMemo(
    () => ({ openCampaignWizard, closeWizard }),
    [openCampaignWizard, closeWizard]
  );

  return (
    <CampaignWizardContext.Provider value={value}>
      {children}
      <Sheet open={wizard.open} onOpenChange={(open) => !open && closeWizard()}>
        <SheetContent
          title={wizard.editId ? "Edit campaign" : "Create campaign"}
          description="Phase 1: save drafts or mark ready for review. Sending is disabled until a provider is connected."
          onClose={closeWizard}
          maxWidth={720}
          className="overflow-hidden"
        >
          {wizard.open ? (
            <SheetBody className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-4 pt-0 sm:px-5">
              <MarketingCampaignWizardBody
                key={sessionKey}
                editId={wizard.editId}
                templateIdParam={wizard.templateId}
                segmentIdParam={wizard.segmentId}
                layout="sheet"
                onClose={closeWizard}
                onSaved={handleSaved}
              />
            </SheetBody>
          ) : null}
        </SheetContent>
      </Sheet>
    </CampaignWizardContext.Provider>
  );
}