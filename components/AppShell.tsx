"use client";

import { useState } from "react";
import { NotesProvider } from "@/context/NotesContext";
import { Sidebar } from "./Sidebar";
import { Editor } from "./Editor";
import { SettingsModal } from "./SettingsModal";

export function AppShell() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <NotesProvider>
      <div className="flex h-screen bg-neutral-950 text-neutral-100 overflow-hidden">
        <Sidebar onOpenSettings={() => setIsSettingsOpen(true)} />
        <Editor />
      </div>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </NotesProvider>
  );
}
