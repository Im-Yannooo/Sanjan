// my-app/src/screens/MainScreen.tsx

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTabContext } from '../context/TabContext'
import { FaCircleNodes } from 'react-icons/fa6'
import '../styles/MainScreen.css'
import {
  getGhostSuggestion,
  getSemanticAnalytics,
  generateBridgeNote,
  chatWithNote,
  type GhostSuggestion,
  type RelatedNoteSuggestion,
  type ChatMessage,
  type VaultNote,
} from '../services/geminiService'

interface ContextMenuState {
  x: number
  y: number
  title: string // note title (e.g. "Foo.md")
}

const HEADING_RE = /^(#{1,6})(\s+)/

function renderLineWithMarkdown(line: string, noteTitles: Set<string>): React.ReactNode {
  const headingMatch = line.match(HEADING_RE)

  if (headingMatch) {
    const hashes = headingMatch[1]
    const spacing = headingMatch[2]
    const rest = line.slice(headingMatch[0].length)
    return (
      <span className="md-heading">
        <span className="md-syntax-hidden">{hashes}{spacing}</span>
        {renderWithWikiLinks(rest, noteTitles)}
      </span>
    )
  }

  return <>{renderWithWikiLinks(line, noteTitles)}</>
}

function renderContentWithMarkdown(text: string, noteTitles: Set<string>): React.ReactNode {
  const lines = text.split('\n')
  return lines.map((line, i) => (
    <React.Fragment key={i}>
      {i > 0 && '\n'}
      {renderLineWithMarkdown(line, noteTitles)}
    </React.Fragment>
  ))
}

const WIKILINK_RE = /\[\[(.*?)\]\]/g

function renderWithWikiLinks(text: string, noteTitles: Set<string>) {
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  WIKILINK_RE.lastIndex = 0

  while ((match = WIKILINK_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    const rawTarget = match[1]

    if (rawTarget.trim() === '') {
      parts.push(match[0])
      lastIndex = match.index + match[0].length
      continue
    }

    const display = rawTarget.includes('|') ? rawTarget.split('|')[1] : rawTarget
    const target = rawTarget.split('|')[0].trim()
    const formatted = target.endsWith('.md') ? target : `${target}.md`
    const exists = noteTitles.has(formatted)

    parts.push(
      <span key={match.index} className={`wikilink-highlight ${exists ? 'exists' : 'missing'}`}>
        {display}
      </span>,
    )
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts
}

type AIPanelTab = 'chat' | 'analytics' | 'bridge'

const GHOST_DEBOUNCE_MS = 800

/** Small local debounce helper — avoids pulling in lodash just for this. */
function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delayMs: number,
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return useCallback(
    (...args: Args) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => callbackRef.current(...args), delayMs)
    },
    [delayMs],
  )
}

function stripMdExt(title: string): string {
  return title.endsWith('.md') ? title.slice(0, -3) : title
}

function MainScreen() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const {
    allNotes,
    tabs,
    activeTabId,
    setActiveTabId,
    openNote,
    addTab,
    updateTabContent,
    renameNote,
    deleteNote,
  } = useTabContext()

  const activeTab = tabs.find((t) => t.id === activeTabId)

  // ── File sidebar context menu / rename state (unchanged from original) ──
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [renamingTitle, setRenamingTitle] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const renameInputRef = useRef<HTMLInputElement | null>(null)

  // ── Ghost text (Gap Finder) state ──
  const [ghostSuggestion, setGhostSuggestion] = useState<GhostSuggestion | null>(null)
  const [isGhostLoading, setIsGhostLoading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const ghostOverlayRef = useRef<HTMLDivElement | null>(null)
  // Guards against a slow response landing after the user already moved on / edited further.
  const ghostRequestIdRef = useRef(0)

  // ── AI sidebar panel state ──
  const [aiPanelOpen, setAIPanelOpen] = useState(false)
  const [aiPanelTab, setAIPanelTab] = useState<AIPanelTab>('chat')

  // Analytics
  const [relatedNotes, setRelatedNotes] = useState<RelatedNoteSuggestion[]>([])
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false)
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)

  // Bridge notes
  const [bridgeSelection, setBridgeSelection] = useState<Set<string>>(new Set())
  const [bridgeResult, setBridgeResult] = useState<string | null>(null)
  const [isBridgeLoading, setIsBridgeLoading] = useState(false)
  const [bridgeError, setBridgeError] = useState<string | null>(null)

  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)

  const noteTitleSet = useMemo(() => new Set(allNotes.map((n) => n.title)), [allNotes])

  const vaultNotes: VaultNote[] = useMemo(
    () => allNotes.map((n) => ({ title: n.title, content: n.content ?? '' })),
    [allNotes],
  )

  // Reset per-note AI panel state whenever the active note changes.
  useEffect(() => {
    setGhostSuggestion(null)
    setRelatedNotes([])
    setAnalyticsError(null)
    setChatMessages([])
    setChatError(null)
  }, [activeTabId])

  // Listen for sidebar toggle from the CustomTitleBar
  useEffect(() => {
    const handler = () => setSidebarOpen((prev) => !prev)
    window.addEventListener('toggle-sidebar', handler)
    return () => window.removeEventListener('toggle-sidebar', handler)
  }, [])

  // Close the file context menu on any outside click
  useEffect(() => {
    if (!contextMenu) return
    const close = () => setContextMenu(null)
    window.addEventListener('click', close)
    window.addEventListener('contextmenu', close)
    return () => {
      window.removeEventListener('click', close)
      window.removeEventListener('contextmenu', close)
    }
  }, [contextMenu])

  // Focus + select the rename input as soon as it appears
  useEffect(() => {
    if (renamingTitle && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [renamingTitle])

  // ── Ghost text: debounced fetch on typing pause ──────────────────────────
  const requestGhostSuggestion = useDebouncedCallback(
    async (content: string, title: string, notes: VaultNote[]) => {
      const requestId = ++ghostRequestIdRef.current
      setIsGhostLoading(true)
      try {
        const suggestion = await getGhostSuggestion(content, notes, title)
        if (requestId === ghostRequestIdRef.current) {
          setGhostSuggestion(suggestion)
        }
      } catch (err) {
        // Ghost text is a nice-to-have — fail silently in the UI, log for devs.
        console.error('Ghost suggestion failed:', err)
        if (requestId === ghostRequestIdRef.current) setGhostSuggestion(null)
      } finally {
        if (requestId === ghostRequestIdRef.current) setIsGhostLoading(false)
      }
    },
    GHOST_DEBOUNCE_MS,
  )

  const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!activeTab) return
    const newContent = e.target.value
    updateTabContent(activeTab.id, newContent)
    // Any manual edit invalidates the in-flight suggestion immediately —
    // a stale ghost pointing at old text is worse than no ghost.
    setGhostSuggestion(null)
    requestGhostSuggestion(newContent, activeTab.title, vaultNotes)
  }

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab' && ghostSuggestion && activeTab) {
      e.preventDefault()
      const accepted = ghostSuggestion.insertText
      updateTabContent(activeTab.id, activeTab.content + accepted)
      setGhostSuggestion(null)
      return
    }
    // Any other keystroke (besides pure navigation) should clear a stale ghost
    // so it doesn't visually linger over text it no longer applies to.
    if (ghostSuggestion && e.key !== 'Shift' && e.key !== 'Control' && e.key !== 'Alt' && e.key !== 'Meta') {
      if (e.key !== 'Tab') setGhostSuggestion(null)
    }
  }

  const syncOverlayScroll = () => {
    if (textareaRef.current && ghostOverlayRef.current) {
      ghostOverlayRef.current.scrollTop = textareaRef.current.scrollTop
      ghostOverlayRef.current.scrollLeft = textareaRef.current.scrollLeft
    }
  }

  // ── AI sidebar: Semantic Analytics ───────────────────────────────────────
  const runSemanticAnalytics = useCallback(async () => {
    if (!activeTab) return
    setIsAnalyticsLoading(true)
    setAnalyticsError(null)
    try {
      const results = await getSemanticAnalytics(activeTab.content, vaultNotes, activeTab.title)
      setRelatedNotes(results)
    } catch (err) {
      setAnalyticsError(err instanceof Error ? err.message : 'Failed to load analytics.')
    } finally {
      setIsAnalyticsLoading(false)
    }
  }, [activeTab, vaultNotes])

  // ── AI sidebar: Bridge Notes ──────────────────────────────────────────────
  const toggleBridgeSelection = (title: string) => {
    setBridgeSelection((prev) => {
      const next = new Set(prev)
      if (next.has(title)) next.delete(title)
      else next.add(title)
      return next
    })
  }

  const runGenerateBridgeNote = async () => {
    const selected = vaultNotes.filter((n) => bridgeSelection.has(n.title))
    if (selected.length < 2) {
      setBridgeError('Select at least two notes first.')
      return
    }
    setIsBridgeLoading(true)
    setBridgeError(null)
    setBridgeResult(null)
    try {
      const markdown = await generateBridgeNote(selected)
      setBridgeResult(markdown)
    } catch (err) {
      setBridgeError(err instanceof Error ? err.message : 'Failed to generate bridge note.')
    } finally {
      setIsBridgeLoading(false)
    }
  }

  // ── AI sidebar: Chat ──────────────────────────────────────────────────────
  const sendChatMessage = async () => {
    if (!activeTab || !chatInput.trim()) return
    const userMessage = chatInput.trim()
    setChatInput('')
    setChatError(null)
    const nextHistory: ChatMessage[] = [...chatMessages, { role: 'user', text: userMessage }]
    setChatMessages(nextHistory)
    setIsChatLoading(true)
    try {
      const reply = await chatWithNote(
        { title: activeTab.title, content: activeTab.content },
        chatMessages,
        userMessage,
      )
      setChatMessages([...nextHistory, { role: 'model', text: reply }])
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'Chat request failed.')
    } finally {
      setIsChatLoading(false)
    }
  }

  // ── File sidebar handlers (unchanged from original) ──────────────────────
  const handleSidebarFileClick = (title: string) => {
    openNote(title)
  }

  const handleSidebarContextMenu = (e: React.MouseEvent, title: string) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, title })
  }

  const startRename = (title: string) => {
    setRenamingTitle(title)
    setRenameValue(stripMdExt(title))
    setContextMenu(null)
  }

  const commitRename = () => {
    if (renamingTitle && renameValue.trim()) {
      renameNote(renamingTitle, renameValue.trim())
    }
    setRenamingTitle(null)
    setRenameValue('')
  }

  const cancelRename = () => {
    setRenamingTitle(null)
    setRenameValue('')
  }

  const handleDelete = (title: string) => {
    const confirmed = window.confirm(`Delete "${stripMdExt(title)}"? This can't be undone.`)
    if (confirmed) deleteNote(title)
    setContextMenu(null)
  }

  return (
    <div className="main-container">
      {/* File Sidebar */}
      <aside className={`main-sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
        <div className="sidebar-header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
            <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
          </svg>
          My Vault
        </div>
        <div className="sidebar-content">
          <div className="sidebar-folder">
            <span className="folder-icon">▾</span> Notes
          </div>
          {allNotes.map((note) => {
            const isRenaming = renamingTitle === note.title
            const matchingTab = tabs.find((t) => t.title === note.title)
            const isActive = !!matchingTab && matchingTab.id === activeTabId

            return (
              <div
                key={note.title}
                className={`sidebar-file ${isActive ? 'active' : ''}`}
                onClick={() => !isRenaming && handleSidebarFileClick(note.title)}
                onContextMenu={(e) => handleSidebarContextMenu(e, note.title)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px', flexShrink: 0 }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                {isRenaming ? (
                  <input
                    ref={renameInputRef}
                    value={renameValue}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename()
                      if (e.key === 'Escape') cancelRename()
                    }}
                    style={{
                      fontSize: '13px',
                      border: '1px solid #5a4633',
                      borderRadius: '3px',
                      padding: '1px 4px',
                      width: '100%',
                      fontFamily: 'inherit',
                    }}
                  />
                ) : (
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {stripMdExt(note.title)}
                  </span>
                )}
              </div>
            )
          })}
        </div>
        <div className="sidebar-actions">
        <button
          className="sidebar-action-btn"
          onClick={addTab}
          title="New note"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginRight: '4px' }}
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          New Note
        </button>

        <button
          className="sidebar-action-btn"
          onClick={() => navigate('/GraphView')}
          title="Graph View"
        >
          <FaCircleNodes size={12} style={{ marginRight: '4px' }} />
          Graph
        </button>

        <button
          className="sidebar-action-btn"
          onClick={() => navigate('/settings')}
          title="Settings"
        >
          ⚙ Settings
        </button>
      </div>
      </aside>

      {/* Right-click context menu */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            backgroundColor: '#ece7d7',
            border: '1px solid #b8b0a0',
            borderRadius: '6px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
            zIndex: 1000,
            minWidth: '140px',
            overflow: 'hidden',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '13px',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={contextMenuItemStyle} onClick={() => startRename(contextMenu.title)}>
            Rename
          </div>
          <div style={{ ...contextMenuItemStyle, color: '#a83b3b' }} onClick={() => handleDelete(contextMenu.title)}>
            Delete
          </div>
        </div>
      )}

      {/* Main Editor Area */}
      <div className="main-editor-area">
        <div className="editor-toolbar">
          {activeTab && (
            <button
              className={`ai-toggle-btn ${aiPanelOpen ? 'active' : ''}`}
              onClick={() => setAIPanelOpen((prev) => !prev)}
              title="Toggle AI panel"
            >
              ✦ Assistant
            </button>
          )}
        </div>

        {activeTab ? (
          <div className="editor-wrapper">
            {/* Ghost text overlay — sits behind the transparent-background textarea. */}
            <div className="ghost-overlay" ref={ghostOverlayRef} aria-hidden="true">
              {/* <span className="ghost-overlay-typed">{activeTab.content}</span> */}
              {/* <span className="ghost-overlay-typed">{renderWithWikiLinks(activeTab.content, noteTitleSet)}</span> */}
              <span className="ghost-overlay-typed">{renderContentWithMarkdown(activeTab.content, noteTitleSet)}</span>
              {ghostSuggestion && (
                <span className="ghost-overlay-suggestion">{ghostSuggestion.insertText}</span>
              )}
            </div>
            <textarea
              ref={textareaRef}
              className="note-editor"
              value={activeTab.content}
              onChange={handleEditorChange}
              onKeyDown={handleEditorKeyDown}
              onScroll={syncOverlayScroll}
              placeholder="Start typing your note here..."
              spellCheck={false}
            />
            {(isGhostLoading || ghostSuggestion) && (
              <div className="ghost-hint">
                {isGhostLoading ? 'Thinking…' : 'Press Tab to accept suggestion'}
              </div>
            )}
          </div>
        ) : (
          <div className="note-editor-empty">
            <p>
              No tabs open. Click the <strong>+</strong> button in the title bar to create a new note.
            </p>
          </div>
        )}
      </div>

      {/* AI Sidebar Panel */}
      {aiPanelOpen && activeTab && (
        <aside className="ai-panel">
          <div className="ai-panel-tabs">
            <button
              className={aiPanelTab === 'chat' ? 'active' : ''}
              onClick={() => setAIPanelTab('chat')}
            >
              Chat
            </button>
            <button
              className={aiPanelTab === 'analytics' ? 'active' : ''}
              onClick={() => {
                setAIPanelTab('analytics')
                if (relatedNotes.length === 0 && !isAnalyticsLoading) runSemanticAnalytics()
              }}
            >
              Analytics
            </button>
            <button
              className={aiPanelTab === 'bridge' ? 'active' : ''}
              onClick={() => setAIPanelTab('bridge')}
            >
              Bridge
            </button>
          </div>

          <div className="ai-panel-content">
            {aiPanelTab === 'chat' && (
              <div className="ai-chat">
                <div className="ai-chat-messages">
                  {chatMessages.length === 0 && (
                    <p className="ai-empty-hint">Ask a question about “{stripMdExt(activeTab.title)}”.</p>
                  )}
                  {chatMessages.map((m, i) => (
                    <div key={i} className={`ai-chat-bubble ${m.role}`}>
                      {m.text}
                    </div>
                  ))}
                  {isChatLoading && <div className="ai-chat-bubble model ai-loading">…</div>}
                </div>
                {chatError && <p className="ai-error">{chatError}</p>}
                <div className="ai-chat-input-row">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendChatMessage()
                      }
                    }}
                    placeholder="Ask about this note…"
                    disabled={isChatLoading}
                  />
                  <button onClick={sendChatMessage} disabled={isChatLoading || !chatInput.trim()}>
                    Send
                  </button>
                </div>
              </div>
            )}

            {aiPanelTab === 'analytics' && (
              <div className="ai-analytics">
                <div className="ai-analytics-header">
                  <span>Unlinked but related notes</span>
                  <button onClick={runSemanticAnalytics} disabled={isAnalyticsLoading}>
                    {isAnalyticsLoading ? 'Scanning…' : 'Refresh'}
                  </button>
                </div>
                {analyticsError && <p className="ai-error">{analyticsError}</p>}
                {!isAnalyticsLoading && relatedNotes.length === 0 && !analyticsError && (
                  <p className="ai-empty-hint">No strong unlinked matches found.</p>
                )}
                <ul className="ai-related-list">
                  {relatedNotes.map((r) => (
                    <li key={r.title}>
                      <div className="ai-related-title">
                        {r.title}
                        <span className="ai-related-score">{Math.round(r.relevance * 100)}%</span>
                      </div>
                      <div className="ai-related-reason">{r.reason}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {aiPanelTab === 'bridge' && (
              <div className="ai-bridge">
                <p className="ai-panel-subheading">Select notes to bridge</p>
                <ul className="ai-bridge-list">
                  {allNotes
                    .filter((n) => n.title !== activeTab.title)
                    .map((n) => (
                      <li key={n.title}>
                        <label>
                          <input
                            type="checkbox"
                            checked={bridgeSelection.has(n.title)}
                            onChange={() => toggleBridgeSelection(n.title)}
                          />
                          {stripMdExt(n.title)}
                        </label>
                      </li>
                    ))}
                </ul>
                <button
                  className="ai-bridge-generate-btn"
                  onClick={runGenerateBridgeNote}
                  disabled={isBridgeLoading || bridgeSelection.size < 2}
                >
                  {isBridgeLoading ? 'Generating…' : 'Generate Bridge Note'}
                </button>
                {bridgeError && <p className="ai-error">{bridgeError}</p>}
                {bridgeResult && (
                  <div className="ai-bridge-result">
                    <textarea readOnly value={bridgeResult} />
                    <button
                      onClick={() => {
                        // Hand the generated markdown to the user's normal save flow.
                        // Replace with your own "create note" action from TabContext if available.
                        navigator.clipboard.writeText(bridgeResult)
                      }}
                    >
                      Copy Markdown
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>
      )}
    </div>
  )
}

const contextMenuItemStyle: React.CSSProperties = {
  padding: '8px 14px',
  cursor: 'pointer',
  color: '#3b332b',
}

export default MainScreen
