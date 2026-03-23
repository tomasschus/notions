"use client";

import dynamic from "next/dynamic";
import { useState, type ReactNode } from "react";
import { NotesProvider } from "@/context/NotesContext";
import { Sidebar } from "@/components/Sidebar";

const SettingsModal = dynamic(
  () =>
    import("@/components/SettingsModal").then((m) => ({
      default: m.SettingsModal,
    })),
  { ssr: false }
);

export default function NotesLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <NotesProvider>
      <div className="flex h-screen bg-neutral-950 text-neutral-100 overflow-hidden">
        <Sidebar
          onOpenSettings={() => setIsSettingsOpen(true)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((c) => !c)}
        />
        {children}
      </div>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </NotesProvider>
  );
}
