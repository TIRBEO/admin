import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import LinkExtension from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import Placeholder from "@tiptap/extension-placeholder";
import { useState, useCallback } from "react";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3, List, ListOrdered,
  Quote, Code2, Link, Image, Table2, Undo2, Redo2,
  FileCode, Pilcrow,
} from "lucide-react";

interface BlogEditorProps {
  content: string;
  onChange: (html: string) => void;
}

function MenuButton({ onClick, active, children, title }: {
  onClick: () => void; active?: boolean; children: React.ReactNode; title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors ${
        active ? "bg-indigo-600/20 text-indigo-400" : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="h-5 w-px bg-neutral-800" />;
}

function Toolbar({ editor }: { editor: Editor }) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const addLink = useCallback(() => {
    if (linkUrl) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl }).run();
      setLinkUrl("");
      setShowLinkInput(false);
    }
  }, [editor, linkUrl]);

  const addImage = useCallback(() => {
    const url = prompt("Enter image URL:");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  const addTable = useCallback(() => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  return (
    <div className="sticky top-0 z-10 border-b border-neutral-800 bg-neutral-900/95 backdrop-blur-xl">
      <div className="flex flex-wrap items-center gap-px px-3 py-2">
        <MenuButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
          <Bold className="h-3.5 w-3.5" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
          <Italic className="h-3.5 w-3.5" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline">
          <UnderlineIcon className="h-3.5 w-3.5" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
          <Strikethrough className="h-3.5 w-3.5" />
        </MenuButton>

        <Divider />

        <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Heading 1">
          <Heading1 className="h-3.5 w-3.5" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2">
          <Heading2 className="h-3.5 w-3.5" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3">
          <Heading3 className="h-3.5 w-3.5" />
        </MenuButton>

        <Divider />

        <MenuButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list">
          <List className="h-3.5 w-3.5" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Ordered list">
          <ListOrdered className="h-3.5 w-3.5" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Quote">
          <Quote className="h-3.5 w-3.5" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Code block">
          <Code2 className="h-3.5 w-3.5" />
        </MenuButton>

        <Divider />

        <MenuButton onClick={() => setShowLinkInput(!showLinkInput)} active={editor.isActive("link")} title="Link">
          <Link className="h-3.5 w-3.5" />
        </MenuButton>
        <MenuButton onClick={addImage} title="Image">
          <Image className="h-3.5 w-3.5" />
        </MenuButton>
        <MenuButton onClick={addTable} title="Table">
          <Table2 className="h-3.5 w-3.5" />
        </MenuButton>

        <div className="ml-auto flex items-center gap-px">
          <MenuButton onClick={() => editor.chain().focus().undo().run()} title="Undo">
            <Undo2 className="h-3.5 w-3.5" />
          </MenuButton>
          <MenuButton onClick={() => editor.chain().focus().redo().run()} title="Redo">
            <Redo2 className="h-3.5 w-3.5" />
          </MenuButton>
        </div>
      </div>

      {showLinkInput && (
        <div className="flex items-center gap-2 border-t border-neutral-800 px-3 py-2">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://..."
            className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-white outline-none focus:border-indigo-500"
          />
          <button onClick={addLink} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500">Apply</button>
          <button onClick={() => { editor.chain().focus().unsetLink().run(); setShowLinkInput(false); }} className="text-xs text-neutral-400 hover:text-neutral-200">Remove</button>
        </div>
      )}
    </div>
  );
}

export default function BlogEditor({ content, onChange }: BlogEditorProps) {
  const [showSource, setShowSource] = useState(false);
  const [sourceValue, setSourceValue] = useState(content);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      LinkExtension.configure({ openOnClick: false }),
      ImageExtension,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Placeholder.configure({ placeholder: "Start writing..." }),
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setSourceValue(html);
      onChange(html);
    },
  });

  if (!editor) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/50">
      {showSource ? (
        <textarea
          value={sourceValue}
          onChange={(e) => {
            setSourceValue(e.target.value);
            onChange(e.target.value);
          }}
          className="min-h-[400px] w-full resize-y bg-neutral-950 p-4 font-mono text-sm text-neutral-300 outline-none"
        />
      ) : (
        <>
          <Toolbar editor={editor} />
          <EditorContent
            editor={editor}
            className="prose-custom min-h-[400px] p-4 outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror_p]:text-neutral-300 [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-neutral-600 [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror]:min-h-[360px] [&_.ProseMirror_h1]:text-xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:text-white [&_.ProseMirror_h2]:text-lg [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h2]:text-white [&_.ProseMirror_h3]:text-base [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_h3]:text-white/90 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5 [&_.ProseMirror_li]:text-neutral-300 [&_.ProseMirror_blockquote]:border-l-2 [&_.ProseMirror_blockquote]:border-indigo-500 [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:text-neutral-400 [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_pre]:rounded-lg [&_.ProseMirror_pre]:bg-neutral-950 [&_.ProseMirror_pre]:p-4 [&_.ProseMirror_pre]:font-mono [&_.ProseMirror_pre]:text-sm [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:bg-neutral-800 [&_.ProseMirror_code]:px-1.5 [&_.ProseMirror_code]:py-0.5 [&_.ProseMirror_code]:font-mono [&_.ProseMirror_code]:text-indigo-400 [&_.ProseMirror_a]:text-indigo-400 [&_.ProseMirror_a]:underline [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:rounded-lg [&_.ProseMirror_table]:w-full [&_.ProseMirror_table]:border-collapse [&_.ProseMirror_th]:border [&_.ProseMirror_th]:border-neutral-700 [&_.ProseMirror_th]:bg-neutral-800 [&_.ProseMirror_th]:px-3 [&_.ProseMirror_th]:py-2 [&_.ProseMirror_th]:text-left [&_.ProseMirror_th]:text-sm [&_.ProseMirror_th]:font-semibold [&_.ProseMirror_th]:text-white [&_.ProseMirror_td]:border [&_.ProseMirror_td]:border-neutral-700 [&_.ProseMirror_td]:px-3 [&_.ProseMirror_td]:py-2 [&_.ProseMirror_td]:text-sm [&_.ProseMirror_td]:text-neutral-300"
          />
        </>
      )}
      <div className="flex items-center justify-between border-t border-neutral-800 px-3 py-2">
        <span className="text-xs text-neutral-500">
          {showSource ? "Editing HTML source" : `${editor.storage.characterCount?.characters?.() || 0} characters`}
        </span>
        <button
          type="button"
          onClick={() => {
            if (showSource) {
              editor.commands.setContent(sourceValue);
            }
            setShowSource(!showSource);
          }}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 transition-colors"
        >
          <FileCode className="h-3.5 w-3.5" />
          {showSource ? "Visual" : "Source"}
        </button>
      </div>
    </div>
  );
}
