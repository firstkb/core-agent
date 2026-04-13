import {
  forwardRef,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type { HTMLAttributes, ReactNode } from "react";

import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import { cx } from "../../lib/cx";
import { useControllableState } from "../../lib/use-controllable-state";
import { Button } from "../button";
import { Checkbox } from "../checkbox";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../dialog";
import { Input } from "../input";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import { Select } from "../select";
import { Textarea } from "../textarea";

export type RichTextToolbarPreset = "basic";

export type RichTextEditorProps = {
  id?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  toolbarPreset?: RichTextToolbarPreset;
  className?: string;
  contentClassName?: string;
  "aria-label"?: string;
};

export type RichTextContentProps = HTMLAttributes<HTMLDivElement> & {
  html: string;
};

type ToolbarButtonProps = {
  active?: boolean;
  ariaLabel: string;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
  onClick: () => void;
};

function normalizeRichTextHtml(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";

  if (!normalized || normalized === "<p></p>") {
    return "";
  }

  return normalized;
}

function ToolbarButton({
  active = false,
  ariaLabel,
  children,
  className,
  disabled = false,
  onClick,
}: ToolbarButtonProps) {
  return (
    <button
      aria-label={ariaLabel}
      aria-pressed={active}
      className={cx(
        "ui-rich-text-editor__toolbar-button",
        active && "ui-rich-text-editor__toolbar-button--active",
        className,
      )}
      disabled={disabled}
      onClick={onClick}
      onMouseDown={(event) => event.preventDefault()}
      type="button"
    >
      {children}
    </button>
  );
}

function BoldToolbarIcon() {
  return <span className="ui-rich-text-editor__toolbar-button-text ui-rich-text-editor__toolbar-button-text--strong">B</span>;
}

function ItalicToolbarIcon() {
  return <span className="ui-rich-text-editor__toolbar-button-text ui-rich-text-editor__toolbar-button-text--italic">I</span>;
}

function UnderlineToolbarIcon() {
  return <span className="ui-rich-text-editor__toolbar-button-text ui-rich-text-editor__toolbar-button-text--underline">U</span>;
}

function BulletListToolbarIcon() {
  return (
    <svg aria-hidden="true" className="ui-rich-text-editor__toolbar-icon" fill="none" viewBox="0 0 24 24">
      <circle cx="6" cy="7" fill="currentColor" r="1.5" />
      <circle cx="6" cy="12" fill="currentColor" r="1.5" />
      <circle cx="6" cy="17" fill="currentColor" r="1.5" />
      <path d="M10 7h8M10 12h8M10 17h8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function OrderedListToolbarIcon() {
  return (
    <svg aria-hidden="true" className="ui-rich-text-editor__toolbar-icon" fill="none" viewBox="0 0 24 24">
      <path d="M4.5 7h2V5.25h-1" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M4.5 11.2h2l-2 2.55h2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M4.65 16.25c.26-.2.57-.3.9-.3.86 0 1.55.54 1.55 1.3 0 .77-.7 1.35-1.6 1.35-.45 0-.88-.13-1.2-.37" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M11 7h9M11 12h9M11 17h9" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function LinkToolbarIcon() {
  return (
    <svg aria-hidden="true" className="ui-rich-text-editor__toolbar-icon" fill="none" viewBox="0 0 24 24">
      <path d="m10.9 13.1 5.05-5.05a2.9 2.9 0 0 1 4.1 4.1l-6.7 6.7a4.35 4.35 0 0 1-6.15-6.15l5.85-5.85a2.05 2.05 0 1 1 2.9 2.9l-5.4 5.4a1.1 1.1 0 0 1-1.55-1.55l4.65-4.65" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function UndoToolbarIcon() {
  return (
    <svg aria-hidden="true" className="ui-rich-text-editor__toolbar-icon" fill="none" viewBox="0 0 24 24">
      <path d="m9 14-5-5 5-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
      <path d="M4 9h11a4 4 0 1 1 0 8h-1" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
    </svg>
  );
}

function RedoToolbarIcon() {
  return (
    <svg aria-hidden="true" className="ui-rich-text-editor__toolbar-icon" fill="none" viewBox="0 0 24 24">
      <path d="m15 14 5-5-5-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
      <path d="M20 9H9a4 4 0 1 0 0 8h1" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
    </svg>
  );
}

function TableToolbarIcon() {
  return (
    <svg aria-hidden="true" className="ui-rich-text-editor__toolbar-icon" fill="none" viewBox="0 0 24 24">
      <rect height="13" rx="1.5" stroke="currentColor" strokeWidth="1.9" width="16" x="4" y="5.5" />
      <path d="M4 10.5h16M9.35 5.5v13M14.7 5.5v13" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
    </svg>
  );
}

function HtmlSourceToolbarIcon() {
  return (
    <svg aria-hidden="true" className="ui-rich-text-editor__toolbar-icon" fill="none" viewBox="0 0 24 24">
      <path d="m8.5 8-4 4 4 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="m15.5 8 4 4-4 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="m13.5 5-3 14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function getHeadingValue(editor: ReturnType<typeof useEditor>) {
  if (editor?.isActive("heading", { level: 2 })) {
    return "h2";
  }

  if (editor?.isActive("heading", { level: 3 })) {
    return "h3";
  }

  return "paragraph";
}

function getTextAlignValue(editor: ReturnType<typeof useEditor>) {
  if (editor?.isActive({ textAlign: "center" })) {
    return "center";
  }

  if (editor?.isActive({ textAlign: "right" })) {
    return "right";
  }

  return "left";
}

export const RichTextEditor = forwardRef<HTMLDivElement, RichTextEditorProps>(function RichTextEditor(
  {
    id,
    value,
    defaultValue = "",
    onChange,
    placeholder = "Start typing...",
    disabled = false,
    invalid = false,
    toolbarPreset = "basic",
    className,
    contentClassName,
    "aria-label": ariaLabel,
  },
  ref,
) {
  const generatedId = useId();
  const contentId = id ?? `ui-rich-text-editor-${generatedId}`;
  const linkInputId = `${contentId}-link-input`;
  const sourceTextareaId = `${contentId}-html-source`;
  const [currentValue, setCurrentValue] = useControllableState({
    defaultValue: normalizeRichTextHtml(defaultValue),
    onChange,
    value: value === undefined ? undefined : normalizeRichTextHtml(value),
  });
  const [toolbarVersion, setToolbarVersion] = useState(0);
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const [linkDraft, setLinkDraft] = useState("");
  const [tablePopoverOpen, setTablePopoverOpen] = useState(false);
  const [tableRows, setTableRows] = useState("3");
  const [tableColumns, setTableColumns] = useState("3");
  const [tableWithHeaderRow, setTableWithHeaderRow] = useState(true);
  const [sourceDialogOpen, setSourceDialogOpen] = useState(false);
  const [sourceDraft, setSourceDraft] = useState("");
  const linkInputRef = useRef<HTMLInputElement | null>(null);

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        heading: {
          levels: [2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Table.configure({
        resizable: false,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder,
      }),
    ],
    [placeholder],
  );

  const editor = useEditor({
    content: currentValue,
    editable: !disabled,
    extensions,
    immediatelyRender: false,
    onUpdate: ({ editor: nextEditor }) => {
      setCurrentValue(nextEditor.isEmpty ? "" : normalizeRichTextHtml(nextEditor.getHTML()));
    },
  });

  useEffect(() => {
    if (!editor) {
      return undefined;
    }

    const syncToolbarState = () => {
      setToolbarVersion((valueToUpdate) => valueToUpdate + 1);
    };

    editor.on("selectionUpdate", syncToolbarState);
    editor.on("transaction", syncToolbarState);
    editor.on("focus", syncToolbarState);
    editor.on("blur", syncToolbarState);

    return () => {
      editor.off("selectionUpdate", syncToolbarState);
      editor.off("transaction", syncToolbarState);
      editor.off("focus", syncToolbarState);
      editor.off("blur", syncToolbarState);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.setEditable(!disabled);
  }, [disabled, editor]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const normalizedCurrentValue = normalizeRichTextHtml(currentValue);
    const editorHtml = editor.isEmpty ? "" : normalizeRichTextHtml(editor.getHTML());

    if (normalizedCurrentValue === editorHtml) {
      return;
    }

    editor.commands.setContent(normalizedCurrentValue || "", false);
  }, [currentValue, editor]);

  useEffect(() => {
    if (!editor || !linkPopoverOpen) {
      return;
    }

    setLinkDraft(editor.getAttributes("link").href ?? "");

    if (typeof window !== "undefined") {
      const frameId = window.requestAnimationFrame(() => {
        linkInputRef.current?.focus();
        linkInputRef.current?.select();
      });

      return () => {
        window.cancelAnimationFrame(frameId);
      };
    }

    return;
  }, [editor, linkPopoverOpen]);

  useEffect(() => {
    if (!sourceDialogOpen || !editor) {
      return;
    }

    setSourceDraft(editor.isEmpty ? "" : normalizeRichTextHtml(editor.getHTML()));
  }, [editor, sourceDialogOpen]);

  const toolbarDisabled = disabled || !editor;
  const linkSelectionAvailable = Boolean(editor?.isActive("link") || !editor?.state.selection.empty);
  const tableActive = Boolean(editor?.isActive("table"));
  const headingValue = getHeadingValue(editor);
  const textAlignValue = getTextAlignValue(editor);
  const safeTableRows = Math.min(10, Math.max(1, Number.parseInt(tableRows || "3", 10) || 3));
  const safeTableColumns = Math.min(8, Math.max(1, Number.parseInt(tableColumns || "3", 10) || 3));

  const applyLink = () => {
    if (!editor) {
      return;
    }

    const href = linkDraft.trim();

    if (!href) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      setLinkPopoverOpen(false);
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    setLinkPopoverOpen(false);
  };

  const openSourceDialog = () => {
    if (!editor) {
      return;
    }

    setSourceDraft(editor.isEmpty ? "" : normalizeRichTextHtml(editor.getHTML()));
    setSourceDialogOpen(true);
  };

  const applySourceDraft = () => {
    if (!editor) {
      return;
    }

    const nextValue = normalizeRichTextHtml(sourceDraft);
    editor.commands.setContent(nextValue || "", false);
    setCurrentValue(nextValue);
    setSourceDialogOpen(false);
  };

  const insertTable = () => {
    if (!editor) {
      return;
    }

    editor
      .chain()
      .focus()
      .insertTable({
        cols: safeTableColumns,
        rows: safeTableRows,
        withHeaderRow: tableWithHeaderRow,
      })
      .run();
    setTablePopoverOpen(false);
  };

  void toolbarVersion;

  return (
    <>
      <div
        ref={ref}
        className={cx(
          "ui-rich-text-editor",
          invalid && "ui-rich-text-editor--invalid",
          disabled && "ui-rich-text-editor--disabled",
          className,
        )}
        data-toolbar-preset={toolbarPreset}
      >
        <div className="ui-rich-text-editor__toolbar" role="toolbar">
          <div className="ui-rich-text-editor__toolbar-group">
            <Select
              aria-label="Heading level"
              className="ui-rich-text-editor__toolbar-select"
              disabled={toolbarDisabled}
              onChange={(event) => {
                const nextValue = event.currentTarget.value;

                if (!editor) {
                  return;
                }

                if (nextValue === "paragraph") {
                  editor.chain().focus().setParagraph().run();
                  return;
                }

                if (nextValue === "h2") {
                  editor.chain().focus().setHeading({ level: 2 }).run();
                  return;
                }

                if (nextValue === "h3") {
                  editor.chain().focus().setHeading({ level: 3 }).run();
                }
              }}
              size="sm"
              value={headingValue}
            >
              <option value="paragraph">Paragraph</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
            </Select>
            <Select
              aria-label="Text alignment"
              className="ui-rich-text-editor__toolbar-select"
              disabled={toolbarDisabled}
              onChange={(event) => {
                editor?.chain().focus().setTextAlign(event.currentTarget.value as "center" | "left" | "right").run();
              }}
              size="sm"
              value={textAlignValue}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </Select>
          </div>
          <span aria-hidden="true" className="ui-rich-text-editor__toolbar-separator" />
          <div className="ui-rich-text-editor__toolbar-group">
            <ToolbarButton
              active={Boolean(editor?.isActive("bulletList"))}
              ariaLabel="Bullet list"
              disabled={toolbarDisabled}
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
            >
              <BulletListToolbarIcon />
            </ToolbarButton>
            <ToolbarButton
              active={Boolean(editor?.isActive("orderedList"))}
              ariaLabel="Ordered list"
              disabled={toolbarDisabled}
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            >
              <OrderedListToolbarIcon />
            </ToolbarButton>
          </div>
          <span aria-hidden="true" className="ui-rich-text-editor__toolbar-separator" />
          <div className="ui-rich-text-editor__toolbar-group">
            <ToolbarButton
              active={Boolean(editor?.isActive("bold"))}
              ariaLabel="Bold"
              disabled={toolbarDisabled}
              onClick={() => editor?.chain().focus().toggleBold().run()}
            >
              <BoldToolbarIcon />
            </ToolbarButton>
            <ToolbarButton
              active={Boolean(editor?.isActive("italic"))}
              ariaLabel="Italic"
              disabled={toolbarDisabled}
              onClick={() => editor?.chain().focus().toggleItalic().run()}
            >
              <ItalicToolbarIcon />
            </ToolbarButton>
            <ToolbarButton
              active={Boolean(editor?.isActive("underline"))}
              ariaLabel="Underline"
              disabled={toolbarDisabled}
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
            >
              <UnderlineToolbarIcon />
            </ToolbarButton>
          </div>
          <span aria-hidden="true" className="ui-rich-text-editor__toolbar-separator" />
          <div className="ui-rich-text-editor__toolbar-group">
            <Popover align="start" onOpenChange={setLinkPopoverOpen} open={linkPopoverOpen} side="bottom" sideOffset={10}>
              <PopoverTrigger>
                <ToolbarButton
                  active={linkPopoverOpen || Boolean(editor?.isActive("link"))}
                  ariaLabel="Edit link"
                  disabled={toolbarDisabled || !linkSelectionAvailable}
                  onClick={() => undefined}
                >
                  <LinkToolbarIcon />
                </ToolbarButton>
              </PopoverTrigger>
              <PopoverContent className="ui-rich-text-editor__link-popover">
                <div className="ui-rich-text-editor__popover-stack">
                  <label className="ui-rich-text-editor__popover-label" htmlFor={linkInputId}>
                    Link URL
                  </label>
                  <Input
                    id={linkInputId}
                    onChange={(event) => setLinkDraft(event.currentTarget.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        applyLink();
                      }
                    }}
                    placeholder="https://example.com"
                    ref={linkInputRef}
                    value={linkDraft}
                  />
                  <div className="ui-rich-text-editor__popover-actions">
                    {editor?.isActive("link") ? (
                      <Button
                        onClick={() => {
                          editor.chain().focus().extendMarkRange("link").unsetLink().run();
                          setLinkPopoverOpen(false);
                        }}
                        size="sm"
                        variant="outline"
                      >
                        Remove
                      </Button>
                    ) : null}
                    <Button onClick={() => setLinkPopoverOpen(false)} size="sm" variant="ghost">
                      Cancel
                    </Button>
                    <Button disabled={!linkDraft.trim()} onClick={applyLink} size="sm">
                      Apply
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <span aria-hidden="true" className="ui-rich-text-editor__toolbar-separator" />
          <div className="ui-rich-text-editor__toolbar-group">
            <Popover align="start" onOpenChange={setTablePopoverOpen} open={tablePopoverOpen} side="bottom" sideOffset={10}>
              <PopoverTrigger>
                <ToolbarButton
                  active={tablePopoverOpen || tableActive}
                  ariaLabel="Table tools"
                  disabled={toolbarDisabled}
                  onClick={() => undefined}
                >
                  <TableToolbarIcon />
                </ToolbarButton>
              </PopoverTrigger>
              <PopoverContent className="ui-rich-text-editor__table-popover">
                <div className="ui-rich-text-editor__popover-stack">
                  <div className="ui-rich-text-editor__popover-section">
                    <span className="ui-rich-text-editor__popover-title">Add table</span>
                    <div className="ui-rich-text-editor__table-grid">
                      <label className="ui-rich-text-editor__popover-field">
                        <span className="ui-rich-text-editor__popover-label">Rows</span>
                        <Input
                          inputMode="numeric"
                          max="10"
                          min="1"
                          onChange={(event) => setTableRows(event.currentTarget.value)}
                          type="number"
                          value={tableRows}
                        />
                      </label>
                      <label className="ui-rich-text-editor__popover-field">
                        <span className="ui-rich-text-editor__popover-label">Columns</span>
                        <Input
                          inputMode="numeric"
                          max="8"
                          min="1"
                          onChange={(event) => setTableColumns(event.currentTarget.value)}
                          type="number"
                          value={tableColumns}
                        />
                      </label>
                    </div>
                    <label className="ui-rich-text-editor__table-checkbox">
                      <Checkbox
                        checked={tableWithHeaderRow}
                        onChange={(event) => setTableWithHeaderRow(event.currentTarget.checked)}
                      />
                      <span>Header row</span>
                    </label>
                    <div className="ui-rich-text-editor__popover-actions">
                      <Button onClick={insertTable} size="sm">
                        Insert table
                      </Button>
                    </div>
                  </div>
                  {tableActive ? (
                    <>
                      <span aria-hidden="true" className="ui-rich-text-editor__popover-divider" />
                      <div className="ui-rich-text-editor__popover-section">
                        <span className="ui-rich-text-editor__popover-title">Current table</span>
                        <div className="ui-rich-text-editor__table-actions">
                          <Button onClick={() => editor?.chain().focus().addRowAfter().run()} size="sm" variant="outline">
                            Add row
                          </Button>
                          <Button onClick={() => editor?.chain().focus().deleteRow().run()} size="sm" variant="outline">
                            Delete row
                          </Button>
                          <Button onClick={() => editor?.chain().focus().addColumnAfter().run()} size="sm" variant="outline">
                            Add column
                          </Button>
                          <Button onClick={() => editor?.chain().focus().deleteColumn().run()} size="sm" variant="outline">
                            Delete column
                          </Button>
                          <Button onClick={() => editor?.chain().focus().toggleHeaderRow().run()} size="sm" variant="outline">
                            Toggle header
                          </Button>
                          <Button onClick={() => editor?.chain().focus().deleteTable().run()} size="sm" variant="danger">
                            Delete table
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <span aria-hidden="true" className="ui-rich-text-editor__toolbar-spacer" />
          <div className="ui-rich-text-editor__toolbar-group">
            <ToolbarButton
              active={sourceDialogOpen}
              ariaLabel="Edit HTML source"
              disabled={toolbarDisabled}
              onClick={openSourceDialog}
            >
              <HtmlSourceToolbarIcon />
            </ToolbarButton>
          </div>
          <div className="ui-rich-text-editor__toolbar-group">
            <ToolbarButton
              ariaLabel="Undo"
              disabled={toolbarDisabled || !editor?.can().chain().focus().undo().run()}
              onClick={() => editor?.chain().focus().undo().run()}
            >
              <UndoToolbarIcon />
            </ToolbarButton>
            <ToolbarButton
              ariaLabel="Redo"
              disabled={toolbarDisabled || !editor?.can().chain().focus().redo().run()}
              onClick={() => editor?.chain().focus().redo().run()}
            >
              <RedoToolbarIcon />
            </ToolbarButton>
          </div>
        </div>

        <EditorContent
          aria-label={ariaLabel}
          className={cx("ui-rich-text-editor__content", contentClassName)}
          editor={editor}
          id={contentId}
        />
      </div>

      <Dialog onOpenChange={setSourceDialogOpen} open={sourceDialogOpen}>
        <DialogContent className="ui-rich-text-editor__source-dialog">
          <DialogHeader>
            <DialogTitle>Edit HTML source</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Textarea
              className="ui-rich-text-editor__source-textarea"
              id={sourceTextareaId}
              onChange={(event) => setSourceDraft(event.currentTarget.value)}
              spellCheck={false}
              value={sourceDraft}
            />
          </DialogBody>
          <DialogFooter>
            <Button onClick={() => setSourceDialogOpen(false)} variant="ghost">
              Cancel
            </Button>
            <Button onClick={applySourceDraft}>Apply HTML</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

export const RichTextContent = forwardRef<HTMLDivElement, RichTextContentProps>(function RichTextContent(
  { className, html, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      className={cx("ui-rich-text-content", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});
