function memberNames(members) {
  return [...(members || [])]
    .map((m) => m?.name)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
}

/** Active @mention at text caret — closes after a completed member name + more text. */
export function getActiveMention(text, caretIndex, members = []) {
  if (caretIndex == null || caretIndex < 0) return null;
  const before = text.slice(0, caretIndex);
  const at = before.lastIndexOf("@");
  if (at === -1) return null;

  const rawQuery = before.slice(at + 1);
  if (rawQuery.includes("\n") || rawQuery.includes("@")) return null;

  const names = memberNames(members);
  for (const name of names) {
    if (!rawQuery.startsWith(name)) continue;
    const afterName = rawQuery.slice(name.length);
    if (afterName.length === 0) {
      return { start: at, end: caretIndex, query: rawQuery };
    }
    const boundary = afterName[0];
    if (boundary === " " || /[,.!?;:]/.test(boundary)) {
      if (caretIndex <= at + 1 + name.length) {
        return { start: at, end: caretIndex, query: rawQuery };
      }
      return null;
    }
  }

  if (/\s/.test(rawQuery) && filterMembersForMention(members, rawQuery).length === 0) {
    return null;
  }

  return { start: at, end: caretIndex, query: rawQuery };
}

export function insertMentionAt(text, start, end, mentionName) {
  const token = `@${mentionName} `;
  return {
    text: `${text.slice(0, start)}${token}${text.slice(end)}`,
    caret: start + token.length,
  };
}

export function filterMembersForMention(members, query) {
  const q = String(query || "").trim().toLowerCase();
  const list = (members || []).filter((m) => m?.name || m?.email);
  if (!q) return list;
  return list.filter((m) => {
    const name = (m.name || "").toLowerCase();
    const email = (m.email || "").toLowerCase();
    return name.includes(q) || email.includes(q);
  });
}

/** Split note body into plain text and @mention segments for display. */
export function parseMentionSegments(body, members) {
  if (!body) return [];
  const names = [...(members || [])]
    .map((m) => m?.name)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
  const parts = [];
  let i = 0;

  while (i < body.length) {
    const at = body.indexOf("@", i);
    if (at === -1) {
      parts.push({ type: "text", value: body.slice(i) });
      break;
    }
    if (at > i) {
      parts.push({ type: "text", value: body.slice(i, at) });
    }

    let matched = null;
    for (const name of names) {
      const after = body.slice(at + 1);
      if (!after.startsWith(name)) continue;
      const next = after[name.length];
      if (next === undefined || /[\s,.!?;:\n]/.test(next)) {
        matched = name;
        break;
      }
    }

    if (matched) {
      parts.push({ type: "mention", value: matched });
      i = at + 1 + matched.length;
    } else {
      parts.push({ type: "text", value: "@" });
      i = at + 1;
    }
  }

  return parts;
}

export const MENTION_CHIP_CLASS =
  "mention-chip rounded-md bg-primary-50 px-1.5 py-px font-medium text-primary-700 dark:bg-primary-950/50 dark:text-primary-300";

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** HTML for contenteditable note field — recognized @mentions are highlighted. */
export function mentionEditorHtml(text, members) {
  if (!text) return "";
  const segments = parseMentionSegments(text, members);
  return segments
    .map((part) => {
      if (part.type === "mention") {
        return `<span class="${MENTION_CHIP_CLASS}" data-mention-chip="1" contenteditable="false">@${escapeHtml(part.value)}</span>`;
      }
      return escapeHtml(part.value).replace(/\n/g, "<br>");
    })
    .join("");
}
