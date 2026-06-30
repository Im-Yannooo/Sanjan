import { useState, useEffect } from 'react'
import { useTabContext } from '../context/TabContext'
import '../styles/MainScreen.css'

function MainScreen() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { tabs, activeTabId, setActiveTabId, updateTabContent } = useTabContext()

  const activeTab = tabs.find((t) => t.id === activeTabId)

  // Listen for sidebar toggle from the CustomTitleBar
  useEffect(() => {
    const handler = () => setSidebarOpen((prev) => !prev)
    window.addEventListener('toggle-sidebar', handler)
    return () => window.removeEventListener('toggle-sidebar', handler)
  }, [])

  // Click a sidebar file to open it as the active tab
  const handleSidebarFileClick = (title: string) => {
    const existing = tabs.find((t) => t.title === title)
    if (existing) {
      setActiveTabId(existing.id)
    }
  }

  return (
    <div className="main-container">
      {/* Sidebar */}
      {sidebarOpen && (
        <aside className="main-sidebar">
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
            {/* Render all open tabs as sidebar files */}
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`sidebar-file ${tab.id === activeTabId ? 'active' : ''}`}
                onClick={() => handleSidebarFileClick(tab.title)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px', flexShrink: 0 }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                {tab.title}
              </div>
            ))}
          </div>
        </aside>
      )}

      {/* Main Editor Area */}
      <div className="main-editor-area">
        {/* Editor – full-size markdown textarea */}
        {activeTab ? (
          <textarea
            className="note-editor"
            value={activeTab.content}
            onChange={(e) => updateTabContent(activeTab.id, e.target.value)}
            placeholder="Start typing your note here..."
            spellCheck={false}
          />
        ) : (
          <div className="note-editor-empty">
            <p>No tabs open. Click the <strong>+</strong> button in the title bar to create a new note.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default MainScreen