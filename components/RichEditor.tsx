"use client";

import { useEditor, EditorContent, Extension } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { useEffect, useRef, useState } from "react";
import { Provider } from "@/types";
import { useWebLLM } from "@/hooks/useWebLLM";

// ─── Image helpers ────────────────────────────────────────────────────────────

const MAX_IMAGE_PX = 1200;
const IMAGE_QUALITY = 0.82;

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > MAX_IMAGE_PX || height > MAX_IMAGE_PX) {
        if (width >= height) {
          height = Math.round((height * MAX_IMAGE_PX) / width);
          width = MAX_IMAGE_PX;
        } else {
          width = Math.round((width * MAX_IMAGE_PX) / height);
          height = MAX_IMAGE_PX;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Failed to get canvas context")); return; }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", IMAGE_QUALITY));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to load image")); };
    img.src = url;
  });
}

// ─── Ghost text plugin ────────────────────────────────────────────────────────

const ghostKey = new PluginKey<string>("ghost");

const GhostExtension = Extension.create({
  name: "ghost",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: ghostKey,
        state: {
          init: () => "",
          apply: (tr, prev) => {
            const meta = tr.getMeta(ghostKey);
            return meta !== undefined ? meta : prev;
          },
        },
        props: {
          decorations(state) {
            const text = ghostKey.getState(state) ?? "";
            if (!text) return DecorationSet.empty;
            const { to } = state.selection;
            const el = document.createElement("span");
            el.style.cssText =
              "color:#6b7280;pointer-events:none;user-select:none";
            el.setAttribute("contenteditable", "false");
            el.textContent = text;
            return DecorationSet.create(state.doc, [
              Decoration.widget(to, el, { side: 1 }),
            ]);
          },
        },
      }),
    ];
  },
  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => {
        const ghost = ghostKey.getState(editor.state) ?? "";
        if (!ghost) return false;
        editor.commands.insertContent(ghost);
        editor.view.dispatch(editor.view.state.tr.setMeta(ghostKey, ""));
        return true;
      },
      Escape: ({ editor }) => {
        const ghost = ghostKey.getState(editor.state) ?? "";
        if (!ghost) return false;
        editor.view.dispatch(editor.view.state.tr.setMeta(ghostKey, ""));
        return true;
      },
    };
  },
});

// ─── FontSize extension ───────────────────────────────────────────────────────

const FontSize = Extension.create({
  name: "fontSize",
  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],
        attributes: {
          fontSize: {
            default: null,
            renderHTML: (attrs) =>
              attrs.fontSize ? { style: `font-size:${attrs.fontSize}` } : {},
            parseHTML: (el) =>
              (el as HTMLElement).style.fontSize || null,
          },
        },
      },
    ];
  },
});

// ─── Constants ────────────────────────────────────────────────────────────────

const TEXT_COLORS = [
  { color: "default", label: "Default" },
  { color: "#f87171", label: "Rojo" },
  { color: "#fb923c", label: "Naranja" },
  { color: "#facc15", label: "Amarillo" },
  { color: "#4ade80", label: "Verde" },
  { color: "#60a5fa", label: "Azul" },
  { color: "#a78bfa", label: "Violeta" },
  { color: "#f472b6", label: "Rosa" },
  { color: "#9ca3af", label: "Gris" },
];

const HIGHLIGHT_COLORS = [
  { color: "#fef08a", text: "#000", label: "Amarillo" },
  { color: "#86efac", text: "#000", label: "Verde" },
  { color: "#93c5fd", text: "#000", label: "Azul" },
  { color: "#fca5a5", text: "#000", label: "Rojo" },
  { color: "#d8b4fe", text: "#000", label: "Violeta" },
  { color: "none", text: "#fff", label: "Quitar" },
];

const FONT_SIZES = [
  { value: "0.8rem", label: "Pequeño" },
  { value: "none", label: "Normal" },
  { value: "1.25rem", label: "Grande" },
  { value: "1.75rem", label: "Enorme" },
];

// ─── Toolbar button ───────────────────────────────────────────────────────────

function Btn({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      title={title}
      className={`px-1.5 py-1 rounded text-sm transition-colors ${
        active
          ? "bg-neutral-600 text-neutral-100"
          : "text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200"
      }`}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div className="w-px h-4 bg-neutral-700 mx-1" />;
}

// ─── Color picker ─────────────────────────────────────────────────────────────

function ColorPicker({
  colors,
  onSelect,
  onClose,
}: {
  colors: { color: string; label: string; text?: string }[];
  onSelect: (color: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 mt-1 z-50 bg-neutral-800 border border-neutral-700 rounded-lg p-2 flex flex-wrap gap-1.5 w-40 shadow-xl"
    >
      {colors.map((c) => (
        <button
          key={c.color}
          title={c.label}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(c.color);
            onClose();
          }}
          className="w-6 h-6 rounded-full border border-neutral-600 hover:scale-110 transition-transform flex items-center justify-center"
          style={{
            background: c.color === "none" ? "transparent" : c.color,
          }}
        >
          {c.color === "none" && (
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path d="M1 1l8 8M9 1L1 9" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface RichEditorProps {
  content: string;
  onChange: (html: string) => void;
  noteId: string;
  title?: string;
  apiKey: string;
  model: string;
  provider: Provider;
}

export function RichEditor({
  content,
  onChange,
  noteId,
  title,
  apiKey,
  model,
  provider,
}: RichEditorProps) {
  const [picker, setPicker] = useState<"text" | "highlight" | null>(null);
  const [hasGhost, setHasGhost] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevNoteIdRef = useRef<string | null>(null);
  const needSyncContentRef = useRef(false);
  const prevContentRef = useRef<string>(content);
  const { state: webllmState, load, complete } = useWebLLM();

  useEffect(() => {
    if (provider === "browser" && webllmState.status === "idle") {
      load(model);
    }
  }, [provider, model, webllmState.status, load]);

  const setGhost = (editor: ReturnType<typeof useEditor>, text: string) => {
    if (!editor) return;
    editor.view.dispatch(editor.view.state.tr.setMeta(ghostKey, text));
    setHasGhost(!!text);
  };

  const triggerAutocomplete = async (
    editor: ReturnType<typeof useEditor>,
    plainText: string
  ) => {
    if (!editor) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    if (provider === "off") return;
    if (provider === "openai" && !apiKey) return;
    if (plainText.trim().length < 10) return;

    const ctx = title ? `# ${title}\n\n${plainText}` : plainText;
    const contextText = provider === "browser" ? ctx : ctx.slice(-2000);

    timerRef.current = setTimeout(async () => {
      if (provider === "browser") {
        if (webllmState.status !== "ready") return;
        const completion = await complete(contextText);
        if (completion) setGhost(editor, completion);
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch("/api/autocomplete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ text: contextText, model, provider }),
          signal: controller.signal,
        });
        const data = await res.json();
        if (res.ok && data.completion && !controller.signal.aborted) {
          setGhost(editor, data.completion);
        } else if (!res.ok) {
          console.warn("[autocomplete]", data.error ?? res.status);
        }
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError")
          console.warn("[autocomplete]", err.message);
      }
    }, 1000);
  };

  const insertImageFile = async (
    editorInstance: ReturnType<typeof useEditor>,
    file: File
  ) => {
    if (!editorInstance || !file.type.startsWith("image/")) return;
    try {
      const src = await compressImage(file);
      editorInstance.chain().focus().setImage({ src }).run();
    } catch {
      // silently ignore failed image inserts
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      FontSize,
      Color,
      Highlight.configure({ multicolor: true }),
      GhostExtension,
      Image.configure({ inline: false, allowBase64: true }),
    ],
    content,
    editorProps: {
      attributes: { class: "focus:outline-none" },
      handlePaste: (_view: unknown, event: ClipboardEvent) => {
        const items = Array.from(
          (event.clipboardData?.items ?? []) as DataTransferItemList
        );
        const imageItem = items.find((i) => i.type.startsWith("image/"));
        if (!imageItem) return false;
        event.preventDefault();
        const file = imageItem.getAsFile();
        if (file) insertImageFile(editor, file);
        return true;
      },
      handleDrop: (_view: unknown, event: DragEvent) => {
        const files = Array.from(
          (event.dataTransfer?.files ?? []) as FileList
        );
        const imageFile = files.find((f) => f.type.startsWith("image/"));
        if (!imageFile) return false;
        event.preventDefault();
        insertImageFile(editor, imageFile);
        return true;
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
      setGhost(editor, "");
      setHasGhost(false);
      triggerAutocomplete(editor, editor.getText());
    },
  });

  // Al cambiar de nota: marcar que hay que sincronizar; aplicar cuando exista el editor.
  // Importante: si el contenido llega antes de que `editor` exista, no actualizar
  // `prevContentRef` en ese momento; si no, al montar el editor prev === content y
  // nunca se llama a setContent (nota vacía en prod con más latencia).
  useEffect(() => {
    if (noteId !== prevNoteIdRef.current) {
      prevNoteIdRef.current = noteId;
      needSyncContentRef.current = true;
    }
    if (editor && needSyncContentRef.current) {
      needSyncContentRef.current = false;
      prevContentRef.current = content;
      editor.commands.setContent(content || "<p></p>");
      setGhost(editor, "");
      setHasGhost(false);
    } else if (editor && content !== prevContentRef.current) {
      prevContentRef.current = content;
    }
  }, [noteId, content, editor]);

  if (!editor) return null;

  const setFontSize = (size: string) => {
    if (size === "none") {
      editor.chain().focus().setMark("textStyle", { fontSize: null }).run();
    } else {
      editor.chain().focus().setMark("textStyle", { fontSize: size }).run();
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Toolbar */}
      <div className="flex items-center flex-wrap gap-0.5 px-4 py-1.5 border-b border-neutral-800 bg-neutral-900/80 sticky top-0 z-10">
        {/* Font size */}
        <select
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => setFontSize(e.target.value)}
          defaultValue="none"
          className="bg-neutral-800 text-neutral-400 text-xs px-1.5 py-1 rounded border border-neutral-700 focus:outline-none mr-1"
        >
          {FONT_SIZES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        {/* Headings */}
        <Btn active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Encabezado 1">H1</Btn>
        <Btn active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Encabezado 2">H2</Btn>
        <Btn active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Encabezado 3">H3</Btn>

        <Sep />

        {/* Text style */}
        <Btn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Negrita"><strong>B</strong></Btn>
        <Btn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Cursiva"><em>I</em></Btn>
        <Btn active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Subrayado"><u>U</u></Btn>
        <Btn active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="Tachado"><s>S</s></Btn>

        <Sep />

        {/* Text color */}
        <div className="relative">
          <Btn onClick={() => setPicker(picker === "text" ? null : "text")} title="Color de texto">
            <span className="flex flex-col items-center gap-0.5">
              <span className="text-xs font-bold leading-none" style={{ color: editor.getAttributes("textStyle").color || "#e5e7eb" }}>A</span>
              <span className="w-3 h-0.5 rounded" style={{ background: editor.getAttributes("textStyle").color || "#e5e7eb" }} />
            </span>
          </Btn>
          {picker === "text" && (
            <ColorPicker
              colors={TEXT_COLORS}
              onSelect={(c) => {
                if (c === "default") {
                  editor.chain().focus().unsetColor().run();
                } else {
                  editor.chain().focus().setColor(c).run();
                }
              }}
              onClose={() => setPicker(null)}
            />
          )}
        </div>

        {/* Highlight */}
        <div className="relative">
          <Btn onClick={() => setPicker(picker === "highlight" ? null : "highlight")} title="Resaltado">
            <span className="flex flex-col items-center gap-0.5">
              <span className="text-xs leading-none">▪</span>
              <span className="w-3 h-0.5 rounded" style={{ background: (editor.getAttributes("highlight").color as string) || "#fef08a" }} />
            </span>
          </Btn>
          {picker === "highlight" && (
            <ColorPicker
              colors={HIGHLIGHT_COLORS}
              onSelect={(c) => {
                if (c === "none") {
                  editor.chain().focus().unsetHighlight().run();
                } else {
                  editor.chain().focus().setHighlight({ color: c }).run();
                }
              }}
              onClose={() => setPicker(null)}
            />
          )}
        </div>

        <Sep />

        {/* Lists */}
        <Btn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Lista">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="2" cy="4" r="1.2" fill="currentColor"/><rect x="5" y="3" width="8" height="1.5" rx="0.75" fill="currentColor"/><circle cx="2" cy="8" r="1.2" fill="currentColor"/><rect x="5" y="7" width="8" height="1.5" rx="0.75" fill="currentColor"/><circle cx="2" cy="12" r="1.2" fill="currentColor"/><rect x="5" y="11" width="8" height="1.5" rx="0.75" fill="currentColor"/></svg>
        </Btn>
        <Btn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Lista numerada">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><text x="0" y="5" fontSize="5" fill="currentColor">1.</text><rect x="5" y="3" width="8" height="1.5" rx="0.75" fill="currentColor"/><text x="0" y="9.5" fontSize="5" fill="currentColor">2.</text><rect x="5" y="7" width="8" height="1.5" rx="0.75" fill="currentColor"/><text x="0" y="14" fontSize="5" fill="currentColor">3.</text><rect x="5" y="11" width="8" height="1.5" rx="0.75" fill="currentColor"/></svg>
        </Btn>

        <Sep />

        {/* Code / Quote */}
        <Btn active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()} title="Código inline">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4 4L1 7l3 3M10 4l3 3-3 3M8 2l-2 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
        </Btn>
        <Btn active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Bloque de código">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="2" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M4 5.5L2.5 7 4 8.5M10 5.5L11.5 7 10 8.5M7 4.5l-1 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
        </Btn>
        <Btn active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Cita">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h3v4H2z" fill="currentColor" opacity=".6"/><path d="M7 4h3v4H7z" fill="currentColor" opacity=".6"/><path d="M2 9.5h3M7 9.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
        </Btn>

        <Sep />

        {/* Clear formatting */}
        <Btn onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="Limpiar formato">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 11h5M8 3l3 3-5 5-3-3 5-5zM1 13l3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </Btn>

        <Sep />

        {/* Insert image */}
        <Btn onClick={() => fileInputRef.current?.click()} title="Insertar imagen">
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="2" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><circle cx="4.5" cy="5.5" r="1.2" fill="currentColor"/><path d="M1 10l3.5-3.5 2.5 2.5 2-2 3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span className="sr-only">Insertar imagen</span>
        </Btn>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) insertImageFile(editor, file);
            e.target.value = "";
          }}
        />

        {/* Ghost hint */}
        {hasGhost && (
          <span className="ml-auto text-xs text-neutral-600">Tab para aceptar · Esc para descartar</span>
        )}

        {/* WebLLM loading */}
        {provider === "browser" && webllmState.status === "loading" && (
          <div className="ml-auto flex items-center gap-2">
            <div className="w-20 h-1 bg-neutral-800 rounded-full overflow-hidden">
              <div className="h-full bg-neutral-500 rounded-full transition-all" style={{ width: `${webllmState.progress}%` }} />
            </div>
            <span className="text-xs text-neutral-600">{webllmState.progress}%</span>
          </div>
        )}
      </div>

      {/* Editor content */}
      <div className="flex-1 overflow-y-auto px-12 py-6">
        <EditorContent editor={editor} className="tiptap-editor" />
      </div>
    </div>
  );
}
