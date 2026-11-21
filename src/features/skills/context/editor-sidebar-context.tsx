"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { RepositoryTreeProps } from "../components/repository-tree";

export interface EditorHeaderControls {
  slug: string;
  title: string;
  summary: string | null;
  bannerImage: string | null;
  visibility: "public" | "private";
  status: "draft" | "published" | "archived";
  onUpdateMeta: (
    patch: Partial<{
      title: string;
      summary: string | null;
      bannerImage: string | null;
      visibility: "public" | "private";
      status: "draft" | "published" | "archived";
    }>
  ) => Promise<boolean | void>;
  onDeleteSkill: () => Promise<void>;
}

export interface EditorSidebarConfig {
  skillTitle: string;
  skillSlug: string;
  treeProps: RepositoryTreeProps;
  headerControls?: EditorHeaderControls;
}

interface EditorSidebarContextValue {
  config: EditorSidebarConfig | null;
  setConfig: (config: EditorSidebarConfig | null) => void;
}

const EditorSidebarContext = createContext<EditorSidebarContextValue>({
  config: null,
  setConfig: () => {},
});

export function EditorSidebarProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<EditorSidebarConfig | null>(null);
  return (
    <EditorSidebarContext.Provider value={{ config, setConfig }}>
      {children}
    </EditorSidebarContext.Provider>
  );
}

export function useEditorSidebar() {
  return useContext(EditorSidebarContext);
}
