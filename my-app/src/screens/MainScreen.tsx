// import { useState, useEffect } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { useTabContext } from '../context/TabContext'
// import { FaCircleNodes } from "react-icons/fa6";
// import '../styles/MainScreen.css'

// function MainScreen() {
//   const navigate = useNavigate()
//   const [sidebarOpen, setSidebarOpen] = useState(true)
//   const { tabs, activeTabId, setActiveTabId, updateTabContent } = useTabContext()

//   const activeTab = tabs.find((t) => t.id === activeTabId)

//   // Listen for sidebar toggle from the CustomTitleBar
//   useEffect(() => {
//     const handler = () => setSidebarOpen((prev) => !prev)
//     window.addEventListener('toggle-sidebar', handler)
//     return () => window.removeEventListener('toggle-sidebar', handler)
//   }, [])

//   // Click a sidebar file to open it as the active tab
//   const handleSidebarFileClick = (title: string) => {
//     const existing = tabs.find((t) => t.title === title)
//     if (existing) {
//       setActiveTabId(existing.id)
//     }
//   }

//   return (
//     <div className="main-container">
//       {/* Sidebar */}
//       {sidebarOpen && (
//         <aside className="main-sidebar">
//           <div className="sidebar-header">
//             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
//               <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
//             </svg>
//             My Vault
//           </div>
//           <div className="sidebar-content">
//             <div className="sidebar-folder">
//               <span className="folder-icon">▾</span> Notes
//             </div>
//             {/* Render all open tabs as sidebar files */}
//             {tabs.map((tab) => (
//               <div
//                 key={tab.id}
//                 className={`sidebar-file ${tab.id === activeTabId ? 'active' : ''}`}
//                 onClick={() => handleSidebarFileClick(tab.title)}
//               >
//                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px', flexShrink: 0 }}>
//                   <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
//                   <polyline points="14 2 14 8 20 8"></polyline>
//                   <line x1="16" y1="13" x2="8" y2="13"></line>
//                   <line x1="16" y1="17" x2="8" y2="17"></line>
//                   <polyline points="10 9 9 9 8 9"></polyline>
//                 </svg>
//                 {tab.title}
//               </div>
//             ))}
//             <button
//               onClick={() => navigate('/GraphView')}
//               style={{
//                 background: 'none',
//                 border: 'none',
//                 cursor: 'pointer',
//                 padding: 0,
//               }}
//             >
//               <FaCircleNodes size={22} />
//             </button>
//           </div>
//         </aside>
//       )}

//       {/* Main Editor Area */}
//       <div className="main-editor-area">
//         {/* Editor – full-size markdown textarea */}
//         {activeTab ? (
//           <textarea
//             className="note-editor"
//             value={activeTab.content}
//             onChange={(e) => updateTabContent(activeTab.id, e.target.value)}
//             placeholder="Start typing your note here..."
//             spellCheck={false}
//           />
//         ) : (
//           <div className="note-editor-empty">
//             <p>No tabs open. Click the <strong>+</strong> button in the title bar to create a new note.</p>
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }

// export default MainScreen

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTabContext } from '../context/TabContext'
import '../styles/MainScreen.css'

interface ContextMenuState {
  x: number
  y: number
  title: string
}

function MainScreen() {
  const navigate = useNavigate()

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const {
    allNotes,
    tabs,
    activeTabId,
    openNote,
    updateTabContent,
    renameNote,
    deleteNote
  } = useTabContext()

  const activeTab = tabs.find(
    (t) => t.id === activeTabId
  )

  const [contextMenu, setContextMenu] =
    useState<ContextMenuState | null>(null)

  const [renamingTitle, setRenamingTitle] =
    useState<string | null>(null)

  const [renameValue, setRenameValue] =
    useState('')

  const renameInputRef =
    useRef<HTMLInputElement | null>(null)

  const filteredNotes = allNotes.filter(note =>
    note.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    const handler = () =>
      setSidebarOpen(prev => !prev)

    window.addEventListener(
      'toggle-sidebar',
      handler
    )

    return () =>
      window.removeEventListener(
        'toggle-sidebar',
        handler
      )
  }, [])

  useEffect(() => {
    if (!contextMenu) return

    const close = () =>
      setContextMenu(null)

    window.addEventListener('click', close)
    window.addEventListener('contextmenu', close)

    return () => {
      window.removeEventListener('click', close)
      window.removeEventListener('contextmenu', close)
    }
  }, [contextMenu])

  useEffect(() => {
    if (
      renamingTitle &&
      renameInputRef.current
    ) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [renamingTitle])

  const handleSidebarFileClick = (
    title: string
  ) => {
    openNote(title)
  }

  const handleSidebarContextMenu = (
    e: React.MouseEvent,
    title: string
  ) => {
    e.preventDefault()
    e.stopPropagation()

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      title
    })
  }

  const startRename = (title: string) => {
    const cleanTitle = title.endsWith('.md')
      ? title.slice(0, -3)
      : title

    setRenamingTitle(title)
    setRenameValue(cleanTitle)
    setContextMenu(null)
  }

  const commitRename = () => {
    if (
      renamingTitle &&
      renameValue.trim()
    ) {
      renameNote(
        renamingTitle,
        renameValue.trim()
      )
    }

    setRenamingTitle(null)
    setRenameValue('')
  }

  const cancelRename = () => {
    setRenamingTitle(null)
    setRenameValue('')
  }

  const handleDelete = (
    title: string
  ) => {
    const displayTitle =
      title.endsWith('.md')
        ? title.slice(0, -3)
        : title

    const confirmed =
      window.confirm(
        `Delete "${displayTitle}"? This can't be undone.`
      )

    if (confirmed) {
      deleteNote(title)
    }

    setContextMenu(null)
  }

  return (
    <div className="main-container">

      {sidebarOpen && (
        <aside className="main-sidebar">

          <div className="sidebar-header">
            <h2>SANJan</h2>
            <p>Your Knowledge Vault</p>
          </div>

          <div className="sidebar-search-wrapper">
            <input
              type="text"
              className="sidebar-search"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
            />
          </div>

          <div className="sidebar-folder">
            <span className="folder-icon">
              ▾
            </span>
            Notes
          </div>

          <div className="notes-list">

            {filteredNotes.map(note => {

              const isRenaming =
                renamingTitle === note.title

              const matchingTab =
                tabs.find(
                  t => t.title === note.title
                )

              const isActive =
                !!matchingTab &&
                matchingTab.id === activeTabId

              return (
                <div
                  key={note.title}
                  className={`sidebar-file ${
                    isActive ? 'active' : ''
                  }`}
                  onClick={() =>
                    !isRenaming &&
                    handleSidebarFileClick(
                      note.title
                    )
                  }
                  onContextMenu={(e) =>
                    handleSidebarContextMenu(
                      e,
                      note.title
                    )
                  }
                >

                  {isRenaming ? (
                    <input
                      ref={renameInputRef}
                      value={renameValue}
                      onClick={(e) =>
                        e.stopPropagation()
                      }
                      onChange={(e) =>
                        setRenameValue(
                          e.target.value
                        )
                      }
                      onBlur={commitRename}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter')
                          commitRename()

                        if (e.key === 'Escape')
                          cancelRename()
                      }}
                    />
                  ) : (
                    <span>
                      {note.title.endsWith('.md')
                        ? note.title.slice(0, -3)
                        : note.title}
                    </span>
                  )}

                </div>
              )
            })}

          </div>

          <div className="sidebar-footer">

            <button
              className="sidebar-nav-btn"
              onClick={() =>
                navigate('/GraphView')
              }
            >
              🔗 Graph View
            </button>

            <button
              className="sidebar-nav-btn"
              onClick={() =>
                navigate('/settings')
              }
            >
              ⚙ Settings
            </button>

          </div>

        </aside>
      )}

      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            backgroundColor: '#ece7d7',
            border: '1px solid #b8b0a0',
            borderRadius: '6px',
            boxShadow:
              '0 4px 14px rgba(0,0,0,0.15)',
            zIndex: 1000,
            minWidth: '140px'
          }}
        >
          <div
            style={contextMenuItemStyle}
            onClick={() =>
              startRename(contextMenu.title)
            }
          >
            Rename
          </div>

          <div
            style={{
              ...contextMenuItemStyle,
              color: '#a83b3b'
            }}
            onClick={() =>
              handleDelete(
                contextMenu.title
              )
            }
          >
            Delete
          </div>
        </div>
      )}

      <div className="main-editor-area">

        {activeTab ? (
          <>
            <div className="editor-header">

              <h2 className="editor-title">
                {activeTab.title.replace(
                  '.md',
                  ''
                )}
              </h2>

              <p className="editor-subtitle">
                Markdown Note
              </p>

            </div>

            <textarea
              className="note-editor"
              value={activeTab.content}
              onChange={(e) =>
                updateTabContent(
                  activeTab.id,
                  e.target.value
                )
              }
              placeholder="Start typing your note here..."
              spellCheck={false}
            />

          </>
        ) : (
          <div className="note-editor-empty">
            <h2>Welcome to SANJan</h2>
            <p>
              Create a new note using the +
              button in the title bar.
            </p>
          </div>
        )}

      </div>

    </div>
  )
}

const contextMenuItemStyle: React.CSSProperties = {
  padding: '8px 14px',
  cursor: 'pointer',
  color: '#3b332b'
}

export default MainScreen