"use client";

import { useState } from "react";
import { NotesProvider } from "@/context/NotesContext";
import { Sidebar } from "@/components/Sidebar";
import { SettingsModal } from "@/components/SettingsModal";

export default function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <NotesProvider>
      <div className="flex h-screen bg-neutral-950 text-neutral-100 overflow-hidden">
        <Sidebar onOpenSettings={() => setIsSettingsOpen(true)} />
        {children}
      </div>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </NotesProvider>
  );
}
