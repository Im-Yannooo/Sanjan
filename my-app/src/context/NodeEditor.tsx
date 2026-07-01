import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTabContext } from './TabContext';

// Matches [[Link]] or [[Link|Alias]]
const WIKILINK_RE = /\[\[(.*?)\]\]/g;

const NoteEditor: React.FC = () => {
  const { tabs, activeTabId, updateTabContent, openNote, allNotes, renameTab } = useTabContext();
  const activeTab = tabs.find((t) => t.id === activeTabId);

  const [draft, setDraft] = useState(activeTab?.content ?? '');
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Resync local draft whenever the active tab changes (switching tabs)
  useEffect(() => {
    setDraft(activeTab?.content ?? '');
  }, [activeTabId]); // eslint-disable-line react-hooks/exhaustive-deps

  const noteExists = useMemo(() => {
    const titles = new Set(allNotes.map((n) => n.title));
    return (raw: string) => {
      const target = raw.split('|')[0].trim();
      const formatted = target.endsWith('.md') ? target : `${target}.md`;
      return titles.has(formatted);
    };
  }, [allNotes]);

  if (!activeTab || activeTab.id === 'graph-view') {
    return null; // GraphView tab renders its own component elsewhere in your router/tab switch
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setDraft(value);

    // Debounced autosave so we're not hammering electronAPI.saveNote on every keystroke
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      updateTabContent(activeTab.id, value);
    }, 400);
  };

  // Flush save immediately on blur/tab switch so nothing's lost
  const handleBlur = () => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    updateTabContent(activeTab.id, draft);
  };

  const handleLinkClick = (rawTarget: string) => {
    const target = rawTarget.split('|')[0].trim();
    openNote(target);
  };

  // Very small markdown-ish renderer: headers, bold, italic, and wiki-links.
  // Wiki-links are rendered as clickable spans regardless of whether the note exists yet
  // (clicking a link to a note that doesn't exist yet creates it, matching openNote's behavior).
  const renderPreview = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      let match: RegExpExecArray | null;
      WIKILINK_RE.lastIndex = 0;

      while ((match = WIKILINK_RE.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.slice(lastIndex, match.index));
        }
        const rawTarget = match[1];
        const display = rawTarget.includes('|') ? rawTarget.split('|')[1] : rawTarget;
        const exists = noteExists(rawTarget);
        parts.push(
          <span
            key={`${i}-${match.index}`}
            onClick={() => handleLinkClick(rawTarget)}
            style={{
              color: exists ? '#5a4633' : '#a85c3b',
              backgroundColor: exists ? 'rgba(184,176,160,0.35)' : 'rgba(168,92,59,0.12)',
              borderRadius: '3px',
              padding: '0 3px',
              cursor: 'pointer',
              fontWeight: 500,
              textDecoration: 'none',
            }}
            title={exists ? `Open ${rawTarget}` : `Create "${rawTarget}"`}
          >
            {display}
          </span>
        );
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < line.length) parts.push(line.slice(lastIndex));
      if (parts.length === 0) parts.push(line);

      // Minimal block-level handling
      if (line.startsWith('### ')) {
        return <h3 key={i} style={headingStyle}>{parts.length === 1 && typeof parts[0] === 'string' ? line.replace('### ', '') : parts}</h3>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={i} style={headingStyle}>{parts.length === 1 && typeof parts[0] === 'string' ? line.replace('## ', '') : parts}</h2>;
      }
      if (line.startsWith('# ')) {
        return <h1 key={i} style={headingStyle}>{parts.length === 1 && typeof parts[0] === 'string' ? line.replace('# ', '') : parts}</h1>;
      }
      if (line.trim() === '') {
        return <div key={i} style={{ height: '0.8em' }} />;
      }
      return <p key={i} style={paragraphStyle}>{parts}</p>;
    });
  };

  return (
    <div style={containerStyle}>
      <div style={toolbarStyle}>
        <input
          value={activeTab.title.endsWith('.md') ? activeTab.title.slice(0, -3) : activeTab.title}
          onChange={(e) => renameTab(activeTab.id, e.target.value)}
          style={titleInputStyle}
          spellCheck={false}
        />
        <div style={modeToggleStyle}>
          <button
            onClick={() => setMode('edit')}
            style={mode === 'edit' ? activeModeBtnStyle : modeBtnStyle}
          >
            Edit
          </button>
          <button
            onClick={() => {
              handleBlur();
              setMode('preview');
            }}
            style={mode === 'preview' ? activeModeBtnStyle : modeBtnStyle}
          >
            Preview
          </button>
        </div>
      </div>

      {mode === 'edit' ? (
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Start writing... use [[Note Title]] to link to other notes"
          style={textareaStyle}
          spellCheck={false}
        />
      ) : (
        <div style={previewStyle}>{renderPreview(draft)}</div>
      )}
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#ece7d7',
};

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 16px',
  borderBottom: '1px solid #d7cfbe',
};

const titleInputStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#3b332b',
  background: 'transparent',
  border: 'none',
  outline: 'none',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  flex: 1,
};

const modeToggleStyle: React.CSSProperties = {
  display: 'flex',
  gap: '4px',
  backgroundColor: '#d7cfbe',
  borderRadius: '6px',
  padding: '2px',
};

const modeBtnStyle: React.CSSProperties = {
  fontSize: '12px',
  padding: '4px 10px',
  border: 'none',
  borderRadius: '4px',
  background: 'transparent',
  color: '#5a4633',
  cursor: 'pointer',
  fontFamily: 'system-ui, -apple-system, sans-serif',
};

const activeModeBtnStyle: React.CSSProperties = {
  ...modeBtnStyle,
  backgroundColor: '#5a4633',
  color: '#ece7d7',
};

const textareaStyle: React.CSSProperties = {
  flex: 1,
  width: '100%',
  resize: 'none',
  border: 'none',
  outline: 'none',
  padding: '20px 24px',
  fontSize: '14px',
  lineHeight: 1.6,
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  color: '#3b332b',
  backgroundColor: 'transparent',
};

const previewStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '20px 24px',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  color: '#3b332b',
};

const headingStyle: React.CSSProperties = {
  color: '#3b332b',
  margin: '0.6em 0 0.3em',
};

const paragraphStyle: React.CSSProperties = {
  margin: '0.3em 0',
  fontSize: '14px',
  lineHeight: 1.6,
};

export default NoteEditor;