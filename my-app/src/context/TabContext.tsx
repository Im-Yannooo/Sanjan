import React, { createContext, useContext, useState, useCallback } from 'react';

export interface Tab {
  id: string;
  title: string;
  content: string;
}

interface TabContextValue {
  tabs: Tab[];
  activeTabId: string;
  setActiveTabId: (id: string) => void;
  addTab: () => void;
  closeTab: (id: string) => void;
  updateTabContent: (id: string, content: string) => void;
  renameTab: (id: string, title: string) => void;
}

const TabContext = createContext<TabContextValue | null>(null);

let nextId = 2; // '1' is taken by Welcome.md

const WELCOME_CONTENT = `# Welcome to Your Workspace

This environment is inspired by **Obsidian**, giving you a powerful, local-first, and highly customizable note-taking experience.

## Key Features

### 📊 Graph View
Visualize the connections between your notes. Understand relationships at a glance.

### 💾 Local First
Your data is stored locally on your device as plain markdown files.

### ✏️ Markdown Editor
Write distraction-free with a powerful, real-time markdown editor.

### 🧩 Extensible
Customize your experience with hundreds of community plugins and themes.

---

Start typing to edit this note, or create a new tab with the **+** button above!
`;

export const TabProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: '1', title: 'Welcome.md', content: WELCOME_CONTENT },
  ]);
  const [activeTabId, setActiveTabId] = useState('1');

  const addTab = useCallback(() => {
    const id = String(nextId++);
    const newTab: Tab = { id, title: `Untitled-${id}.md`, content: '' };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(id);
  }, []);

  const closeTab = useCallback((id: string) => {
    setTabs((prev) => {
      const filtered = prev.filter((t) => t.id !== id);
      if (filtered.length === 0) {
        // Always keep at least one tab
        const fallback: Tab = { id: String(nextId++), title: 'Untitled.md', content: '' };
        setActiveTabId(fallback.id);
        return [fallback];
      }
      return filtered;
    });
    setActiveTabId((prevActive) => {
      if (prevActive !== id) return prevActive;
      // Switch to the nearest tab
      const idx = tabs.findIndex((t) => t.id === id);
      const fallback = tabs[idx - 1] || tabs[idx + 1];
      return fallback ? fallback.id : tabs[0].id;
    });
  }, [tabs]);

  const updateTabContent = useCallback((id: string, content: string) => {
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, content } : t)));
  }, []);

  const renameTab = useCallback((id: string, title: string) => {
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, title } : t)));
  }, []);

  return (
    <TabContext.Provider value={{ tabs, activeTabId, setActiveTabId, addTab, closeTab, updateTabContent, renameTab }}>
      {children}
    </TabContext.Provider>
  );
};

export const useTabContext = (): TabContextValue => {
  const ctx = useContext(TabContext);
  if (!ctx) throw new Error('useTabContext must be used within a TabProvider');
  return ctx;
};
