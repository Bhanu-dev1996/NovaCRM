import { parseCsv } from "@/components/leads/lead-import";

export const CONTACT_CSV_TEMPLATE = [
  "first_name,last_name,email,phone,title",
  "Priya,Nair,priya.nair@example.com,+91 98765 43210,Director",
].join("\n");

export function mapCsvRowsToContacts(rows) {
  const valid = [];
  const errors = [];

  rows.forEach((item) => {
    const firstName = String(item.first_name || "").trim();
    const lastName = String(item.last_name || "").trim();
    const issues = [];

    if (!firstName) issues.push("first name is required");
    if (!lastName) issues.push("last name is required");

    if (issues.length) {
      errors.push({
        rowNumber: item.rowNumber,
        message: issues.join(", "),
        email: String(item.email || "").trim() || "—",
      });
      return;
    }

    valid.push({
      id: `import-${Date.now()}-${item.rowNumber}-${Math.random().toString(36).slice(2, 7)}`,
      firstName,
      lastName,
      email: String(item.email || "").trim(),
      phone: String(item.phone || "").trim(),
      title: String(item.title || "").trim(),
    });
  });

  return { valid, errors };
}

export async function parseContactCsvFile(file) {
  const text = await file.text();
  const rows = parseCsv(text);
  return mapCsvRowsToContacts(rows);
}
