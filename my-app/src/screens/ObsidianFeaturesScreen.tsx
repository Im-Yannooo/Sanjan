import { useNavigate } from 'react-router-dom'
import React from 'react';

const ObsidianFeaturesScreen: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div style={styles.container}>
      {/* Left Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
            <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
          </svg>
          My Vault
        </div>
        <div style={styles.sidebarContent}>
          <div style={styles.folder}>
            <span style={styles.folderIcon}>▾</span> Features
          </div>
          <div style={{...styles.file, ...styles.activeFile}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            Welcome.md
          </div>
          <div style={styles.file}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            Graph View.md
          </div>
          <div style={styles.file}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            Plugins.md
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div style={styles.main}>
        {/* Tab Bar */}
        <div style={styles.tabBar}>
          <div style={styles.tab}>
            Welcome.md
            <span style={styles.closeIcon}>×</span>
          </div>
        </div>

        {/* Editor Content */}
        <div style={styles.editor}>
          <h1 style={styles.h1}>Welcome to Your Workspace</h1>
          <button onClick={() => navigate('/MainScreen')}>Go to Main Screen</button>
          <p style={styles.paragraph}>
            This environment is inspired by <strong>Obsidian</strong>, giving you a powerful, 
            local-first, and highly customizable note-taking experience.
          </p>
          
          <h2 style={styles.h2}>Key Features</h2>
          
          <div style={styles.featureGrid}>
            <div style={styles.featureCard}>
              <div style={styles.featureIconWrapper}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5a4633" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3"></circle>
                  <circle cx="6" cy="12" r="3"></circle>
                  <circle cx="18" cy="19" r="3"></circle>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
              </div>
              <h3 style={styles.h3}>Graph View</h3>
              <p style={styles.featureText}>Visualize the connections between your notes. Understand relationships at a glance.</p>
            </div>

            <div style={styles.featureCard}>
              <div style={styles.featureIconWrapper}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5a4633" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                  <polyline points="2 17 12 22 22 17"></polyline>
                  <polyline points="2 12 12 17 22 12"></polyline>
                </svg>
              </div>
              <h3 style={styles.h3}>Local First</h3>
              <p style={styles.featureText}>Your data is stored locally on your device as plain markdown files.</p>
            </div>

            <div style={styles.featureCard}>
              <div style={styles.featureIconWrapper}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5a4633" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
              </div>
              <h3 style={styles.h3}>Markdown Editor</h3>
              <p style={styles.featureText}>Write distraction-free with a powerful, real-time markdown editor.</p>
            </div>
            
            <div style={styles.featureCard}>
              <div style={styles.featureIconWrapper}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5a4633" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
              </div>
              <h3 style={styles.h3}>Extensible</h3>
              <p style={styles.featureText}>Customize your experience with hundreds of community plugins and themes.</p>
            </div>
          </div>

          <div style={styles.graphMockup}>
            {/* Simple CSS-based Graph Mockup */}
            <div style={{...styles.node, top: '20%', left: '30%'}}></div>
            <div style={{...styles.node, top: '50%', left: '50%', width: '12px', height: '12px', backgroundColor: '#5a4633'}}></div>
            <div style={{...styles.node, top: '70%', left: '40%'}}></div>
            <div style={{...styles.node, top: '40%', left: '70%'}}></div>
            <div style={{...styles.node, top: '80%', left: '75%'}}></div>
            
            <svg style={styles.edges} width="100%" height="100%">
              <line x1="30%" y1="20%" x2="50%" y2="50%" stroke="#b8b0a0" strokeWidth="2" />
              <line x1="40%" y1="70%" x2="50%" y2="50%" stroke="#b8b0a0" strokeWidth="2" />
              <line x1="70%" y1="40%" x2="50%" y2="50%" stroke="#b8b0a0" strokeWidth="2" />
              <line x1="75%" y1="80%" x2="70%" y2="40%" stroke="#b8b0a0" strokeWidth="2" />
            </svg>
            <div style={styles.graphMockupText}>Interactive Graph View</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#ece7d7', // Light beige from login.css
    color: '#3b332b',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    overflow: 'hidden',
  },
  sidebar: {
    width: '260px',
    backgroundColor: '#d7cfbe', // Slightly different beige for sidebar
    borderRight: '1px solid #b8b0a0',
    display: 'flex',
    flexDirection: 'column',
  },
  sidebarHeader: {
    padding: '16px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#5a4633',
    display: 'flex',
    alignItems: 'center',
    borderBottom: '1px solid #b8b0a0',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  sidebarContent: {
    padding: '12px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  folder: {
    padding: '6px 8px',
    fontSize: '14px',
    color: '#4d4e55',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    fontWeight: 500,
  },
  folderIcon: {
    marginRight: '6px',
    fontSize: '12px',
  },
  file: {
    padding: '6px 8px 6px 24px',
    fontSize: '14px',
    color: '#5a4633',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    borderRadius: '4px',
  },
  activeFile: {
    backgroundColor: 'rgba(90, 70, 51, 0.15)',
    color: '#5a4633',
    fontWeight: 600,
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  tabBar: {
    height: '40px',
    backgroundColor: '#d7cfbe',
    borderBottom: '1px solid #b8b0a0',
    display: 'flex',
    alignItems: 'flex-end',
    paddingLeft: '8px',
  },
  tab: {
    padding: '8px 16px',
    backgroundColor: '#ece7d7', // Matches main area
    borderTop: '2px solid #5a4633',
    borderRight: '1px solid #b8b0a0',
    borderLeft: '1px solid #b8b0a0',
    borderTopLeftRadius: '4px',
    borderTopRightRadius: '4px',
    fontSize: '13px',
    color: '#5a4633',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: 600,
  },
  closeIcon: {
    cursor: 'pointer',
    fontSize: '16px',
    opacity: 0.6,
  },
  editor: {
    flex: 1,
    padding: '40px 60px',
    overflowY: 'auto',
    maxWidth: '900px',
    margin: '0 auto',
    width: '100%',
  },
  h1: {
    fontSize: '32px',
    fontWeight: '700',
    marginBottom: '16px',
    color: '#3b332b',
  },
  paragraph: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#4d4e55',
    marginBottom: '40px',
  },
  h2: {
    fontSize: '24px',
    fontWeight: '600',
    marginBottom: '20px',
    color: '#3b332b',
    borderBottom: '1px solid #b8b0a0',
    paddingBottom: '8px',
  },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
    marginBottom: '40px',
  },
  featureCard: {
    backgroundColor: '#fff',
    border: '1px solid #b8b0a0',
    borderRadius: '8px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.2s, border-color 0.2s',
    cursor: 'pointer',
  },
  featureIconWrapper: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    backgroundColor: 'rgba(90, 70, 51, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  h3: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '8px',
    color: '#3b332b',
  },
  featureText: {
    fontSize: '14px',
    color: '#4d4e55',
    lineHeight: '1.5',
  },
  graphMockup: {
    height: '200px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #b8b0a0',
    position: 'relative',
    overflow: 'hidden',
    marginTop: '20px',
  },
  node: {
    position: 'absolute',
    width: '10px',
    height: '10px',
    backgroundColor: '#d7cfbe',
    border: '2px solid #5a4633',
    borderRadius: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 2,
  },
  edges: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
  graphMockupText: {
    position: 'absolute',
    bottom: '12px',
    right: '16px',
    fontSize: '12px',
    color: '#5a4633',
    zIndex: 3,
    fontWeight: 600,
  }
};

export default ObsidianFeaturesScreen;
