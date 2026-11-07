/** Calendar date (YYYY-MM-DD) from API timestamps — local timezone. */
export function parseApiDateYmd(value) {
  if (value == null || value === "") return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    const iso = String(value).slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : null;
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatLeadCalendarDate(value) {
  if (!value) return "—";
  const ymd =
    typeof value === "string" &&
    value.length === 10 &&
    /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? value
      : parseApiDateYmd(value);
  if (!ymd) return "—";
  const [year, month, day] = ymd.split("-").map(Number);
  if (!year || !month || !day) return "—";
  try {
    return new Date(year, month - 1, day).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return String(value);
  }
}

/** Drop last contacted when it predates record creation (bad seed / imports). */
export function normalizeLeadTimelineDates(createdAtRaw, lastContactedRaw) {
  const createdAt = parseApiDateYmd(createdAtRaw) || "";
  let lastContacted = parseApiDateYmd(lastContactedRaw);
  if (lastContacted && createdAt && lastContacted < createdAt) {
    lastContacted = null;
  }
  return { createdAt, lastContacted };
}
