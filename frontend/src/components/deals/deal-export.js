import { DEFAULT_PIPELINE_NAME } from "@/components/deals/deals-data";

function csvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

const EXPORT_HEADERS = [
  "name",
  "amount",
  "currency",
  "stage",
  "company",
  "contact_email",
  "owner",
  "expected_close_date",
  "lead_source",
  "priority",
  "pipeline",
  "probability",
  "notes",
  "status",
  "created_at",
];

export function exportDealsToCsv(
  deals,
  { companyMap = {}, contactById = {}, stageMap = {}, ownerLabel = () => "" } = {}
) {
  const lines = (deals || []).map((deal) => {
    const contact = contactById[deal.contactId];
    const cells = [
      deal.name,
      deal.amount,
      deal.currency || "INR",
      stageMap[deal.stageId]?.name || "",
      companyMap[deal.companyId] || "",
      contact?.email || "",
      ownerLabel(deal.ownerId),
      deal.expectedCloseDate || "",
      deal.leadSource || "",
      deal.priority || "",
      deal.pipelineName || DEFAULT_PIPELINE_NAME,
      deal.probability ?? "",
      deal.notes || "",
      deal.status || "open",
      deal.createdAt || "",
    ];
    return cells.map(csvCell).join(",");
  });

  const csv = [EXPORT_HEADERS.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `deals-export-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
