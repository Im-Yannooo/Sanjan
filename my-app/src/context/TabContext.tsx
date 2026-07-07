// import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// export interface Note {
//   title: string;
//   content: string;
// }

// export interface Tab {
//   id: string;
//   title: string;
//   content: string;
// }

// interface TabContextValue {
//   allNotes: Note[];
//   tabs: Tab[];
//   activeTabId: string;
//   setActiveTabId: (id: string) => void;
//   openNote: (title: string) => void;
//   addTab: () => void;
//   closeTab: (id: string) => void;
//   updateTabContent: (id: string, content: string) => void;
//   renameTab: (id: string, title: string) => void;
//   deleteNote: (title: string) => void;
// }

// const TabContext = createContext<TabContextValue | null>(null);

// const WELCOME_CONTENT = `# Welcome to Sanjan Workspace

// This is **SANJAN**, giving you a powerful, local-first, and highly customizable note-taking experience.

// Start typing to edit this note, or create a new tab with the "+" button above!
// `;

// export const TabProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const [allNotes, setAllNotes] = useState<Note[]>([]);
//   const [tabs, setTabs] = useState<Tab[]>([]);
//   const [activeTabId, setActiveTabId] = useState('');

//   // Load notes on mount
//   // useEffect(() => {
//   //   const init = async () => {
//   //     let notes: Note[] = [];
//   //     if (window.electronAPI?.getNotes) {
//   //       notes = await window.electronAPI.getNotes();
//   //     } else {
//   //       notes = [{ title: 'Welcome.md', content: WELCOME_CONTENT }];
//   //     }
//   //     setAllNotes(notes);

//   //     // Open Welcome.md as the first tab by default
//   //     const welcome = notes.find((n) => n.title === 'Welcome.md') || notes[0];
//   //     if (welcome) {
//   //       setTabs([{ id: '1', title: welcome.title, content: welcome.content }]);
//   //       setActiveTabId('1');
//   //     }
//   //   };
//   //   init();
//   // }, []);

//     useEffect(() => {
//     const init = async () => {
//       let notes = [];
//       if (window.electronAPI?.getNotes) {
//         notes = await window.electronAPI.getNotes();
//       } else {
//         notes = [{ title: 'Welcome.md', content: WELCOME_CONTENT }];
//       }
//       setAllNotes(notes);
//       const welcome = notes.find((n) => n.title === 'Welcome.md') || notes[0];
//       if (welcome) {
//         setTabs([{ id: '1', title: welcome.title, content: welcome.content }]);
//         setActiveTabId('1');
//       }
//     };
//     init();

//     // Re-init once the user picks a vault on first launch
//     window.electronAPI?.onVaultReady?.(() => init());
//   }, []);

//   const openNote = useCallback(
//     async (title: string) => {
//       if (title === 'Graph View') {
//         const existing = tabs.find((t) => t.id === 'graph-view');
//         if (existing) {
//           setActiveTabId('graph-view');
//         } else {
//           const newTab = { id: 'graph-view', title: 'Graph View', content: '' };
//           setTabs((prev) => [...prev, newTab]);
//           setActiveTabId('graph-view');
//         }
//         return;
//       }

//       const formattedTitle = title.endsWith('.md') ? title : `${title}.md`;
//       let note = allNotes.find((n) => n.title === formattedTitle);

//       if (!note) {
//         // Create new note on-the-fly (e.g. from internal double bracket link)
//         const cleanTitle = title.endsWith('.md') ? title.slice(0, -3) : title;
//         const content = `# ${cleanTitle}\n\n`;
//         note = { title: formattedTitle, content };

//         if (window.electronAPI?.saveNote) {
//           await window.electronAPI.saveNote(formattedTitle, content);
//         }
//         setAllNotes((prev) => [...prev, note!]);
//       }

//       const existingTab = tabs.find((t) => t.title === formattedTitle);
//       if (existingTab) {
//         setActiveTabId(existingTab.id);
//       } else {
//         const id = String(Date.now());
//         setTabs((prev) => [...prev, { id, title: note!.title, content: note!.content }]);
//         setActiveTabId(id);
//       }
//     },
//     [allNotes, tabs]
//   );

//   const addTab = useCallback(async () => {
//     let count = 1;
//     let title = 'Untitled.md';
//     while (allNotes.some((n) => n.title === title)) {
//       title = `Untitled-${count++}.md`;
//     }

//     const cleanTitle = title.slice(0, -3);
//     const content = `# ${cleanTitle}\n\n`;
//     const newNote = { title, content };

//     if (window.electronAPI?.saveNote) {
//       await window.electronAPI.saveNote(newNote.title, newNote.content);
//     }

//     setAllNotes((prev) => [...prev, newNote]);
//     const id = String(Date.now());
//     setTabs((prev) => [...prev, { id, title: newNote.title, content: newNote.content }]);
//     setActiveTabId(id);
//   }, [allNotes]);

//   const closeTab = useCallback(
//     (id: string) => {
//       setTabs((prev) => {
//         const filtered = prev.filter((t) => t.id !== id);
//         if (filtered.length === 0) {
//           setActiveTabId('');
//           return [];
//         }
//         return filtered;
//       });
//       setActiveTabId((prevActive) => {
//         if (prevActive !== id) return prevActive;
//         const idx = tabs.findIndex((t) => t.id === id);
//         const fallback = tabs[idx - 1] || tabs[idx + 1];
//         return fallback ? fallback.id : '';
//       });
//     },
//     [tabs]
//   );

//   const updateTabContent = useCallback(
//     (id: string, content: string) => {
//       setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, content } : t)));

//       const tab = tabs.find((t) => t.id === id);
//       if (!tab) return;

//       setAllNotes((prev) => prev.map((n) => (n.title === tab.title ? { ...n, content } : n)));

//       if (window.electronAPI?.saveNote) {
//         window.electronAPI.saveNote(tab.title, content);
//       }
//     },
//     [tabs]
//   );

//   const renameTab = useCallback(
//     async (id: string, newTitle: string) => {
//       if (!newTitle.trim()) return;
//       const formattedTitle = newTitle.endsWith('.md') ? newTitle : `${newTitle}.md`;

//       const tab = tabs.find((t) => t.id === id);
//       if (!tab) return;

//       const oldTitle = tab.title;
//       if (oldTitle === formattedTitle) return;

//       if (allNotes.some((n) => n.title === formattedTitle)) {
//         console.warn('A note with this name already exists');
//         return;
//       }

//       if (window.electronAPI?.renameNote) {
//         await window.electronAPI.renameNote(oldTitle, formattedTitle);
//       }

//       setAllNotes((prev) =>
//         prev.map((n) => (n.title === oldTitle ? { ...n, title: formattedTitle } : n))
//       );
//       setTabs((prev) =>
//         prev.map((t) => (t.id === id ? { ...t, title: formattedTitle } : t))
//       );
//     },
//     [tabs, allNotes]
//   );

//   const deleteNote = useCallback(
//     async (title: string) => {
//       const formattedTitle = title.endsWith('.md') ? title : `${title}.md`;

//       if (window.electronAPI?.deleteNote) {
//         await window.electronAPI.deleteNote(formattedTitle);
//       }

//       setAllNotes((prev) => prev.filter((n) => n.title !== formattedTitle));

//       const tab = tabs.find((t) => t.title === formattedTitle);
//       if (tab) {
//         closeTab(tab.id);
//       }
//     },
//     [tabs, closeTab]
//   );

//   return (
//     <TabContext.Provider
//       value={{
//         allNotes,
//         tabs,
//         activeTabId,
//         setActiveTabId,
//         openNote,
//         addTab,
//         closeTab,
//         updateTabContent,
//         renameTab,
//         deleteNote,
//       }}
//     >
//       {children}
//     </TabContext.Provider>
//   );
// };

// export const useTabContext = (): TabContextValue => {
//   const ctx = useContext(TabContext);
//   if (!ctx) throw new Error('useTabContext must be used within a TabProvider');
//   return ctx;
// };
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

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

const WELCOME_CONTENT = `# Welcome to Sanjan Workspace

This is **SANJAN**, giving you a powerful, local-first, and highly customizable note-taking experience.

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
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState('');

  // Load notes on mount
  useEffect(() => {
    const init = async () => {
      let notes: Note[] = [];
      if (window.electronAPI?.getNotes) {
        notes = await window.electronAPI.getNotes();
      } else {
        notes = [{ title: 'Welcome.md', content: WELCOME_CONTENT }];
      }
      setAllNotes(notes);

      // Open Welcome.md as the first tab by default
      const welcome = notes.find((n) => n.title === 'Welcome.md') || notes[0];
      if (welcome) {
        setTabs([{ id: '1', title: welcome.title, content: welcome.content }]);
        setActiveTabId('1');
      }
    };
    init();

    // Re-init once the user picks a vault on first launch
    window.electronAPI?.onVaultReady?.(() => init());
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

        if (window.electronAPI?.saveNote) {
          await window.electronAPI.saveNote(formattedTitle, content);
        }
        setAllNotes((prev) => [...prev, note!]);
      }

      const existingTab = tabs.find((t) => t.title === formattedTitle);
      if (existingTab) {
        setActiveTabId(existingTab.id);
      } else {
        const id = String(Date.now());
        setTabs((prev) => [...prev, { id, title: note!.title, content: note!.content }]);
        setActiveTabId(id);
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

    if (window.electronAPI?.saveNote) {
      await window.electronAPI.saveNote(newNote.title, newNote.content);
    }

    setAllNotes((prev) => [...prev, newNote]);
    const id = String(Date.now());
    setTabs((prev) => [...prev, { id, title: newNote.title, content: newNote.content }]);
    setActiveTabId(id);
  }, [allNotes]);

  const closeTab = useCallback(
    (id: string) => {
      setTabs((prev) => {
        const filtered = prev.filter((t) => t.id !== id);
        if (filtered.length === 0) {
          setActiveTabId('');
          return [];
        }
        return filtered;
      });
      setActiveTabId((prevActive) => {
        if (prevActive !== id) return prevActive;
        const idx = tabs.findIndex((t) => t.id === id);
        const fallback = tabs[idx - 1] || tabs[idx + 1];
        return fallback ? fallback.id : '';
      });
    },
    [tabs]
  );

  const updateTabContent = useCallback(
    (id: string, content: string) => {
      setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, content } : t)));

      const tab = tabs.find((t) => t.id === id);
      if (!tab) return;

      setAllNotes((prev) => prev.map((n) => (n.title === tab.title ? { ...n, content } : n)));

      if (window.electronAPI?.saveNote) {
        window.electronAPI.saveNote(tab.title, content);
      }
    },
    [tabs]
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

      if (window.electronAPI?.renameNote) {
        await window.electronAPI.renameNote(oldTitle, formattedTitle);
      }

      setAllNotes((prev) =>
        prev.map((n) => (n.title === oldTitle ? { ...n, title: formattedTitle } : n))
      );
      setTabs((prev) =>
        prev.map((t) => (t.id === id ? { ...t, title: formattedTitle } : t))
      );
    },
    [tabs, allNotes]
  );

  // Renames a note by its title rather than a tab id — works whether or not
  // the note is currently open as a tab. Used by the sidebar's right-click menu.
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

      if (window.electronAPI?.renameNote) {
        await window.electronAPI.renameNote(formattedOld, formattedNew);
      }

      setAllNotes((prev) =>
        prev.map((n) => (n.title === formattedOld ? { ...n, title: formattedNew } : n))
      );
      // Keep any open tab for this note in sync too
      setTabs((prev) =>
        prev.map((t) => (t.title === formattedOld ? { ...t, title: formattedNew } : t))
      );
    },
    [allNotes]
  );

  const deleteNote = useCallback(
    async (title: string) => {
      const formattedTitle = title.endsWith('.md') ? title : `${title}.md`;

      if (window.electronAPI?.deleteNote) {
        await window.electronAPI.deleteNote(formattedTitle);
      }

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