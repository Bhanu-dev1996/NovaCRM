"use client";

import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Paperclip,
  Underline as UnderlineIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function plainTextToDoc(text) {
  const lines = String(text || "").split("\n");
  return {
    type: "doc",
    content: lines.map((line) => ({
      type: "paragraph",
      content: line ? [{ type: "text", text: line }] : [],
    })),
  };
}

function docToPlainText(editor) {
  return editor.getText({ blockSeparator: "\n" });
}

export function CommunicationsMessageEditor({
  value,
  onChange,
  onAttach,
  onInsertTemplate,
  className,
  minHeight = 160,
  placeholder = "Write your message…",
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-primary-600 underline" },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: plainTextToDoc(value),
    editorProps: {
      attributes: {
        class: cn(
          "w-full max-w-none px-3 py-2.5 text-[13px] leading-relaxed text-foreground",
          "focus:outline-none",
          "[&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5"
        ),
        style: `min-height: ${minHeight}px`,
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(docToPlainText(ed));
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = docToPlainText(editor);
    if (current !== (value || "")) {
      editor.commands.setContent(plainTextToDoc(value), false);
    }
  }, [editor, value]);

  if (!editor) {
    return (
      <div
        className={cn(
          "block w-full max-w-none animate-pulse rounded-xl border border-neutral-200 bg-muted/20 dark:border-neutral-800",
          className
        )}
        style={{ minHeight: minHeight + 44 }}
      />
    );
  }

  function setLink() {
    const previous = editor.getAttributes("link").href;
    const url = window.prompt("Link URL", previous || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  return (
    <div
      className={cn(
        "tiptap-editor-surface flex w-full min-w-0 flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950",
        className
      )}
    >
      <div
        role="toolbar"
        aria-label="Message formatting"
        className="flex w-full min-w-0 shrink-0 flex-row flex-nowrap items-center gap-0.5 overflow-x-auto border-b border-neutral-100 bg-neutral-50/80 px-2 py-1.5 dark:border-neutral-800 dark:bg-neutral-900/40"
      >
        <ToolbarButton
          active={editor.isActive("bold")}
          label="Bold"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("italic")}
          label="Italic"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("underline")}
          label="Underline"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("bulletList")}
          label="Bullet list"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("orderedList")}
          label="Numbered list"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("link")} label="Link" onClick={setLink}>
          <Link2 className="size-3.5" />
        </ToolbarButton>
        {onAttach ? (
          <ToolbarButton label="Attach file" onClick={onAttach}>
            <Paperclip className="size-3.5" />
          </ToolbarButton>
        ) : null}
        {onInsertTemplate ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-auto h-8 rounded-md text-[11px]"
            onClick={onInsertTemplate}
          >
            Insert template
          </Button>
        ) : null}
      </div>
      <EditorContent
        editor={editor}
        className="block w-full min-w-0 max-w-none [&>div]:w-full [&>div]:max-w-none [&_.ProseMirror]:w-full [&_.ProseMirror]:max-w-none [&_.ProseMirror]:min-h-[var(--comm-editor-min-h,120px)] [&_.tiptap]:w-full [&_.tiptap]:max-w-none [&_.tiptap]:outline-none"
        style={{ "--comm-editor-min-h": `${minHeight}px` }}
      />
    </div>
  );
}

function ToolbarButton({ active, label, onClick, children }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "size-8 rounded-md",
        active && "bg-primary-50 text-primary-800 dark:bg-primary-950 dark:text-primary-200"
      )}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
