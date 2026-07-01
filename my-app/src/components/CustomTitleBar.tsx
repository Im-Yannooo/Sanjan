import React, { useState } from 'react';
import { useTabContext } from '../context/TabContext';
import { useLocation } from 'react-router-dom';
import '../styles/CustomTitleBar.css';

const TitleBar: React.FC = () => {
  const { tabs, activeTabId, setActiveTabId, addTab, closeTab } = useTabContext();
  const [search, setSearch] = useState('');
  const location = useLocation();

  const isAuthPage = ['/', '/login', '/signup', '/forgot-password'].includes(location.pathname);

  const handleToggleSidebar = () => {
    window.dispatchEvent(new Event('toggle-sidebar'));
  };

  const handleCloseTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    closeTab(id);
  };

  return (
    <nav className="title-bar">
      {!isAuthPage ? (
        <>
          {/* Left section: sidebar toggle, search, bookmark */}
          <div className="title-bar-left">
            <button onClick={handleToggleSidebar} className="icon-button" title="Toggle sidebar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                <line x1="9" y1="3" x2="9" y2="21"></line>
              </svg>
            </button>

            {/* Search bar */}
            <div className="title-bar-search">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
              />
            </div>

            {/* Bookmark */}
            <button className="icon-button" title="Bookmarks">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              </svg>
            </button>
          </div>

          {/* Tabs + New Tab button */}
          <div className="title-bar-tabs">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`title-bar-tab ${tab.id === activeTabId ? 'active' : ''}`}
                onClick={() => setActiveTabId(tab.id)}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <span className="tab-title">{tab.title}</span>
                <span className="tab-close" onClick={(e) => handleCloseTab(tab.id, e)}>
                  ×
                </span>
              </div>
            ))}

            {/* + New Tab button */}
            <button className="new-tab-button" onClick={addTab} title="New tab">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>
        </>
      ) : (
        <div style={{ flex: 1, paddingLeft: '10px', fontSize: '13px', color: '#888', fontWeight: 500, WebkitAppRegion: 'drag' } as React.CSSProperties}>
          SANJan
        </div>
      )}

      {/* Window controls */}
      <div className="nav-buttons">
        <button onClick={() => window.electronAPI?.minimize?.()} title="Minimize">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <line x1="1" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
        <button onClick={() => window.electronAPI?.maximize?.()} title="Maximize">
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <rect x="1" y="1" width="9" height="9" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
        <button onClick={() => window.electronAPI?.close?.()} title="Close">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" strokeWidth="1.2" />
            <line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
      </div>
    </nav>
  );
};

export default TitleBar;