import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

export interface Note {
  title: string;
  content: string;
}

export interface Tab {
  id: string;
  title: string;
  content: string;
}

interface TabContextValue {
  allNotes: Note[];
  tabs: Tab[];
  activeTabId: string;
  setActiveTabId: (id: string) => void;
  openNote: (title: string) => void;
  addTab: () => void;
  closeTab: (id: string) => void;
  updateTabContent: (id: string, content: string) => void;
  renameTab: (id: string, title: string) => void;
  renameNote: (oldTitle: string, newTitle: string) => void;
  deleteNote: (title: string) => void;
}

const TabContext = createContext<TabContextValue | null>(null);

export const TabProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState('');

  // Refs for tracking actual filenames on disk, pending content/titles, and debounce timeouts
  const diskTitlesRef = useRef<Record<string, string>>({});
  const pendingWritesRef = useRef<Record<string, { title: string; content: string }>>({});
  const renameTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Helper: Sanitize a heading into a valid Windows/Unix filename
  const sanitizeFilename = (title: string): string => {
    return title.replace(/[\\/:*?"<>|]/g, '').trim();
  };

  // Helper: Find and update the first Level 1 heading in a Markdown document
  const updateFirstHeading = (content: string, newTitle: string): string => {
    const cleanTitle = newTitle.endsWith('.md') ? newTitle.slice(0, -3) : newTitle;
    const headingRegex = /^#\s+(.*)$/m;
    if (headingRegex.test(content)) {
      return content.replace(headingRegex, `# ${cleanTitle}`);
    } else {
      return `# ${cleanTitle}\n\n` + content;
    }
  };

  // Load notes from the vault on mount
  useEffect(() => {
    const init = async () => {
      let notes: Note[] = [];
      try {
        notes = await window.electronAPI.vault.getNotes();
      } catch (err) {
        console.error('Failed to load vault notes:', err);
        notes = [];
      }
      setAllNotes(notes);

      // Open Welcome.md as the first tab by default
      const welcome = notes.find((n) => n.title === 'Welcome.md') || notes[0];
      if (welcome) {
        setTabs([{ id: '1', title: welcome.title, content: welcome.content }]);
        setActiveTabId('1');
        diskTitlesRef.current['1'] = welcome.title;
      }
    };
    init();
  }, []);

  // Flush all pending writes on unmount
  useEffect(() => {
    return () => {
      Object.keys(pendingWritesRef.current).forEach((id) => {
        const pending = pendingWritesRef.current[id];
        const diskTitle = diskTitlesRef.current[id];
        if (pending && diskTitle) {
          if (pending.title !== diskTitle) {
            window.electronAPI.vault.renameNote(diskTitle, pending.title).then(() => {
              window.electronAPI.vault.saveNote(pending.title, pending.content);
            });
          } else {
            window.electronAPI.vault.saveNote(diskTitle, pending.content);
          }
        }
      });
    };
  }, []);

  const openNote = useCallback(
    async (title: string) => {
      if (title === 'Graph View') {
        const existing = tabs.find((t) => t.id === 'graph-view');
        if (existing) {
          setActiveTabId('graph-view');
        } else {
          const newTab = { id: 'graph-view', title: 'Graph View', content: '' };
          setTabs((prev) => [...prev, newTab]);
          setActiveTabId('graph-view');
        }
        return;
      }

      const formattedTitle = title.endsWith('.md') ? title : `${title}.md`;
      let note = allNotes.find((n) => n.title === formattedTitle);

      if (!note) {
        // Create new note on-the-fly (e.g. from internal double bracket link)
        const cleanTitle = title.endsWith('.md') ? title.slice(0, -3) : title;
        const content = `# ${cleanTitle}\n\n`;
        note = { title: formattedTitle, content };

        await window.electronAPI.vault.saveNote(formattedTitle, content);
        setAllNotes((prev) => [...prev, note!]);
      }

      const existingTab = tabs.find((t) => t.title === formattedTitle);
      if (existingTab) {
        setActiveTabId(existingTab.id);
      } else {
        const id = String(Date.now());
        setTabs((prev) => [...prev, { id, title: note!.title, content: note!.content }]);
        setActiveTabId(id);
        diskTitlesRef.current[id] = note!.title;
      }
    },
    [allNotes, tabs]
  );

  const addTab = useCallback(async () => {
    let count = 1;
    let title = 'Untitled.md';
    while (allNotes.some((n) => n.title === title)) {
      title = `Untitled-${count++}.md`;
    }

    const cleanTitle = title.slice(0, -3);
    const content = `# ${cleanTitle}\n\n`;
    const newNote = { title, content };

    await window.electronAPI.vault.saveNote(newNote.title, newNote.content);

    setAllNotes((prev) => [...prev, newNote]);
    const id = String(Date.now());
    setTabs((prev) => [...prev, { id, title: newNote.title, content: newNote.content }]);
    setActiveTabId(id);
    diskTitlesRef.current[id] = newNote.title;
  }, [allNotes]);

  const closeTab = useCallback(
    (id: string) => {
      // Flush any pending write immediately
      if (renameTimeoutsRef.current[id]) {
        clearTimeout(renameTimeoutsRef.current[id]);
        delete renameTimeoutsRef.current[id];
      }
      const pending = pendingWritesRef.current[id];
      const diskTitle = diskTitlesRef.current[id];
      if (pending && diskTitle) {
        if (pending.title !== diskTitle) {
          window.electronAPI.vault.renameNote(diskTitle, pending.title).then(() => {
            window.electronAPI.vault.saveNote(pending.title, pending.content);
          });
        } else {
          window.electronAPI.vault.saveNote(diskTitle, pending.content);
        }
        delete pendingWritesRef.current[id];
      }
      delete diskTitlesRef.current[id];

      setTabs((prev) => {
        const idx = prev.findIndex((t) => t.id === id);
        const filtered = prev.filter((t) => t.id !== id);
        if (filtered.length === 0) {
          setActiveTabId('');
          return [];
        }
        // Compute fallback from the *current* tabs array (not the stale closure)
        setActiveTabId((prevActive) => {
          if (prevActive !== id) return prevActive;
          const fallback = prev[idx - 1] || prev[idx + 1];
          return fallback ? fallback.id : '';
        });
        return filtered;
      });
    },
    []
  );

  const updateTabContent = useCallback(
    (id: string, content: string) => {
      // 1. Determine the new title
      const headingMatch = content.match(/^#\s+(.+)$/m);
      const headingRaw = headingMatch ? headingMatch[1].trim() : 'Untitled';
      const cleanNewTitle = sanitizeFilename(headingRaw) || 'Untitled';
      const newTitle = `${cleanNewTitle}.md`;

      let finalTitle = newTitle;

      const currentTab = tabs.find((t) => t.id === id);
      const oldTitle = currentTab ? currentTab.title : newTitle;

      if (newTitle !== oldTitle) {
        let count = 1;
        while (allNotes.some((n) => n.title === finalTitle && n.title !== oldTitle)) {
          finalTitle = `${cleanNewTitle}-${count++}.md`;
        }
      }

      // Update state synchronously for instant UI updates
      setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, title: finalTitle, content } : t)));
      setAllNotes((prev) => prev.map((n) => (n.title === oldTitle ? { title: finalTitle, content } : n)));

      // Store the latest desired state for disk write
      pendingWritesRef.current[id] = { title: finalTitle, content };

      // Debounce the disk save/rename
      if (renameTimeoutsRef.current[id]) {
        clearTimeout(renameTimeoutsRef.current[id]);
      }

      renameTimeoutsRef.current[id] = setTimeout(async () => {
        const pending = pendingWritesRef.current[id];
        if (!pending) return;

        const diskTitle = diskTitlesRef.current[id];
        if (!diskTitle) return;

        try {
          if (pending.title !== diskTitle) {
            // Rename the file on disk
            await window.electronAPI.vault.renameNote(diskTitle, pending.title);
            // Update disk title reference
            diskTitlesRef.current[id] = pending.title;
          }
          // Save content to disk
          await window.electronAPI.vault.saveNote(diskTitlesRef.current[id], pending.content);
        } catch (err) {
          console.error('Failed to sync note to disk:', err);
        }
      }, 500);
    },
    [tabs, allNotes]
  );

  const renameTab = useCallback(
    async (id: string, newTitle: string) => {
      if (!newTitle.trim()) return;
      const formattedTitle = newTitle.endsWith('.md') ? newTitle : `${newTitle}.md`;

      const tab = tabs.find((t) => t.id === id);
      if (!tab) return;

      const oldTitle = tab.title;
      if (oldTitle === formattedTitle) return;

      if (allNotes.some((n) => n.title === formattedTitle)) {
        console.warn('A note with this name already exists');
        return;
      }

      // Flush any pending write timeout to disk first
      if (renameTimeoutsRef.current[id]) {
        clearTimeout(renameTimeoutsRef.current[id]);
        delete renameTimeoutsRef.current[id];
      }
      const pending = pendingWritesRef.current[id];
      let currentContent = tab.content;
      if (pending) {
        currentContent = pending.content;
        delete pendingWritesRef.current[id];
      }

      const diskTitle = diskTitlesRef.current[id] || oldTitle;

      // Update heading in content
      const cleanNew = formattedTitle.endsWith('.md') ? formattedTitle.slice(0, -3) : formattedTitle;
      const updatedContent = updateFirstHeading(currentContent, cleanNew);

      // Rename note on disk
      if (diskTitle !== formattedTitle) {
        await window.electronAPI.vault.renameNote(diskTitle, formattedTitle);
      }
      // Save content on disk
      await window.electronAPI.vault.saveNote(formattedTitle, updatedContent);

      // Update diskTitle ref
      diskTitlesRef.current[id] = formattedTitle;

      setAllNotes((prev) =>
        prev.map((n) => (n.title === oldTitle ? { title: formattedTitle, content: updatedContent } : n))
      );
      setTabs((prev) =>
        prev.map((t) => (t.id === id ? { ...t, title: formattedTitle, content: updatedContent } : t))
      );
    },
    [tabs, allNotes]
  );

  const renameNote = useCallback(
    async (oldTitle: string, newTitle: string) => {
      if (!newTitle.trim()) return;
      const formattedOld = oldTitle.endsWith('.md') ? oldTitle : `${oldTitle}.md`;
      const formattedNew = newTitle.endsWith('.md') ? newTitle : `${newTitle}.md`;

      if (formattedOld === formattedNew) return;

      if (allNotes.some((n) => n.title === formattedNew)) {
        console.warn('A note with this name already exists');
        return;
      }

      // Check if this note is currently open in any tab to flush pending writes
      const openTab = tabs.find((t) => t.title === formattedOld);
      let currentContent = allNotes.find((n) => n.title === formattedOld)?.content || '';

      if (openTab) {
        const id = openTab.id;
        if (renameTimeoutsRef.current[id]) {
          clearTimeout(renameTimeoutsRef.current[id]);
          delete renameTimeoutsRef.current[id];
        }
        const pending = pendingWritesRef.current[id];
        if (pending) {
          currentContent = pending.content;
          delete pendingWritesRef.current[id];
        }
      }

      const cleanNew = formattedNew.endsWith('.md') ? formattedNew.slice(0, -3) : formattedNew;
      const updatedContent = updateFirstHeading(currentContent, cleanNew);

      const diskTitle = openTab ? (diskTitlesRef.current[openTab.id] || formattedOld) : formattedOld;

      // Rename on disk
      await window.electronAPI.vault.renameNote(diskTitle, formattedNew);
      // Save on disk
      await window.electronAPI.vault.saveNote(formattedNew, updatedContent);

      if (openTab) {
        diskTitlesRef.current[openTab.id] = formattedNew;
      }

      setAllNotes((prev) =>
        prev.map((n) => (n.title === formattedOld ? { title: formattedNew, content: updatedContent } : n))
      );
      setTabs((prev) =>
        prev.map((t) => (t.title === formattedOld ? { ...t, title: formattedNew, content: updatedContent } : t))
      );
    },
    [allNotes, tabs]
  );

  const deleteNote = useCallback(
    async (title: string) => {
      const formattedTitle = title.endsWith('.md') ? title : `${title}.md`;

      await window.electronAPI.vault.deleteNote(formattedTitle);

      setAllNotes((prev) => prev.filter((n) => n.title !== formattedTitle));

      const tab = tabs.find((t) => t.title === formattedTitle);
      if (tab) {
        closeTab(tab.id);
      }
    },
    [tabs, closeTab]
  );

  return (
    <TabContext.Provider
      value={{
        allNotes,
        tabs,
        activeTabId,
        setActiveTabId,
        openNote,
        addTab,
        closeTab,
        updateTabContent,
        renameTab,
        renameNote,
        deleteNote,
      }}
    >
      {children}
    </TabContext.Provider>
  );
};

export const useTabContext = (): TabContextValue => {
  const ctx = useContext(TabContext);
  if (!ctx) throw new Error('useTabContext must be used within a TabProvider');
  return ctx;
};