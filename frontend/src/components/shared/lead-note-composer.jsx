"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  caretOffsetInEditor,
  plainTextFromEditor,
  setCaretOffsetInEditor,
} from "@/lib/contenteditable-caret";
import { crmControl, crmType } from "@/lib/crm-typography";
import { cn } from "@/lib/utils";
import {
  filterMembersForMention,
  getActiveMention,
  insertMentionAt,
  MENTION_CHIP_CLASS,
  mentionEditorHtml,
  parseMentionSegments,
} from "@/lib/note-mentions";

export function NoteBodyWithMentions({ body, members }) {
  const segments = useMemo(
    () => parseMentionSegments(body, members),
    [body, members]
  );

  if (!body) return null;

  return (
    <>
      {segments.map((part, index) =>
        part.type === "mention" ? (
          <span key={`m-${index}`} className={MENTION_CHIP_CLASS}>
            @{part.value}
          </span>
        ) : (
          <span key={`t-${index}`}>{part.value}</span>
        )
      )}
    </>
  );
}

export function LeadNoteComposer({
  members = [],
  value,
  onChange,
  onSubmit,
  posting,
  placeholder = "Write a note for your team…",
}) {
  const editorRef = useRef(null);
  const listRef = useRef(null);
  const paintingRef = useRef(false);
  const [caret, setCaret] = useState(0);
  const [mentionDismissed, setMentionDismissed] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [pickerRect, setPickerRect] = useState(null);

  const paintEditor = useCallback(
    (text, caretPos) => {
      const el = editorRef.current;
      if (!el) return;
      paintingRef.current = true;
      el.innerHTML = mentionEditorHtml(text, members);
      if (caretPos != null) setCaretOffsetInEditor(el, caretPos);
      paintingRef.current = false;
    },
    [members]
  );

  const activeMention = useMemo(
    () => getActiveMention(value, caret, members),
    [value, caret, members]
  );

  const suggestions = useMemo(
    () =>
      activeMention
        ? filterMembersForMention(members, activeMention.query)
        : [],
    [members, activeMention]
  );

  const showPicker = Boolean(activeMention) && !mentionDismissed;

  const syncCaret = useCallback(() => {
    const el = editorRef.current;
    if (el) setCaret(caretOffsetInEditor(el));
  }, []);

  useEffect(() => {
    const el = editorRef.current;
    if (!el || document.activeElement === el) return;
    paintEditor(value, value.length);
  }, [value, paintEditor]);

  const updatePickerPosition = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPickerRect({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  useLayoutEffect(() => {
    if (!showPicker) {
      setPickerRect(null);
      return;
    }
    updatePickerPosition();
    window.addEventListener("resize", updatePickerPosition);
    window.addEventListener("scroll", updatePickerPosition, true);
    return () => {
      window.removeEventListener("resize", updatePickerPosition);
      window.removeEventListener("scroll", updatePickerPosition, true);
    };
  }, [showPicker, value, updatePickerPosition]);

  useEffect(() => {
    setHighlightIndex(0);
  }, [activeMention?.query, suggestions.length]);

  useEffect(() => {
    if (!showPicker) return;
    const item = listRef.current?.querySelector(
      `[data-mention-index="${highlightIndex}"]`
    );
    item?.scrollIntoView({ block: "nearest" });
  }, [highlightIndex, showPicker]);

  function handleEditorInput() {
    if (paintingRef.current) return;
    const el = editorRef.current;
    if (!el) return;
    const next = plainTextFromEditor(el);
    const nextCaret = caretOffsetInEditor(el);
    onChange(next);
    setCaret(nextCaret);
    if (getActiveMention(next, nextCaret, members)) setMentionDismissed(false);
    paintEditor(next, nextCaret);
  }

  function pickMember(member) {
    if (!activeMention) return;
    const { text, caret: nextCaret } = insertMentionAt(
      value,
      activeMention.start,
      activeMention.end,
      member.name
    );
    onChange(text);
    setMentionDismissed(false);
    requestAnimationFrame(() => {
      const el = editorRef.current;
      if (!el) return;
      el.focus();
      paintEditor(text, nextCaret);
      setCaret(nextCaret);
    });
  }

  function handleKeyDown(event) {
    if (showPicker && suggestions.length) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setHighlightIndex((i) => (i + 1) % suggestions.length);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setHighlightIndex(
          (i) => (i - 1 + suggestions.length) % suggestions.length
        );
        return;
      }
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        pickMember(suggestions[highlightIndex]);
        return;
      }
    }

    if (event.key === "Escape" && showPicker) {
      event.preventDefault();
      setMentionDismissed(true);
    }
  }

  const mentionList = showPicker && pickerRect && (
    <div
      role="listbox"
      aria-label="Mention a workspace member"
      style={{
        position: "fixed",
        top: pickerRect.top,
        left: pickerRect.left,
        width: pickerRect.width,
        zIndex: 9999,
      }}
      className="max-h-48 overflow-y-auto rounded-lg border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-800 dark:bg-neutral-950"
    >
      <p className={cn("px-3 py-1.5", crmType.mentionPickerTitle)}>
        Workspace members
      </p>
      {suggestions.length ? (
        <ul ref={listRef}>
          {suggestions.map((member, index) => (
            <li key={member.id || member.email || member.name}>
              <button
                type="button"
                role="option"
                aria-selected={index === highlightIndex}
                data-mention-index={index}
                className={cn(
                  "flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-neutral-50 dark:hover:bg-neutral-900",
                  crmType.body,
                  index === highlightIndex &&
                    "bg-primary-50 dark:bg-primary-950/40"
                )}
                onMouseDown={(event) => {
                  event.preventDefault();
                  pickMember(member);
                }}
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                  {member.initials ||
                    member.name?.slice(0, 2).toUpperCase() ||
                    "?"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-neutral-900 dark:text-neutral-50">
                    {member.name}
                  </span>
                  {member.email ? (
                    <span className={cn("block truncate", crmType.helper)}>
                      {member.email}
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className={cn("px-3 py-2", crmType.helper)}>No matching members</p>
      )}
    </div>
  );

  return (
    <div>
      <div
        ref={editorRef}
        role="textbox"
        aria-multiline="true"
        aria-label={placeholder}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={handleEditorInput}
        onKeyDown={handleKeyDown}
        onKeyUp={syncCaret}
        onClick={syncCaret}
        className={cn(
          crmControl.textareaEditor,
          "empty:before:pointer-events-none empty:before:text-neutral-400 empty:before:content-[attr(data-placeholder)]"
        )}
      />

      {typeof document !== "undefined" && mentionList
        ? createPortal(mentionList, document.body)
        : null}

      <div className="mt-2 flex items-center justify-between gap-3">
        <p className={crmType.helper}>
          Type <span className={crmType.metaMedium}>@</span> to mention a
          workspace member
        </p>
        <Button
          type="submit"
          disabled={!value.trim() || posting}
          className={cn(
            "rounded-lg bg-primary-600 px-4 text-white hover:bg-primary-700",
            crmControl.btnPrimarySm
          )}
        >
          {posting ? (
            <>
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              Posting
            </>
          ) : (
            "Post note"
          )}
        </Button>
      </div>
    </div>
  );
}
