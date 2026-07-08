import { useEffect, useState } from 'react';
import '../styles/setup.css';

interface SetupScreenProps {
  onVaultConfigured: () => void;
}

function SetupScreen({ onVaultConfigured }: SetupScreenProps) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [vaultName, setVaultName] = useState('My Vault');
  const [mode, setMode] = useState<'pick' | 'create'>('pick');

  useEffect(() => {
    window.electronAPI.window.setSetupSize();
  }, []);

  const handleCreateNew = () => {
    setMode('create');
  };

  const handleBrowseFolder = async () => {
    const folderPath = await window.electronAPI.dialog.openFolder();
    if (folderPath) {
      setSelectedPath(folderPath);
    }
  };

  const handleOpenExisting = async () => {
    const folderPath = await window.electronAPI.dialog.openFolder();
    if (folderPath) {
      await window.electronAPI.config.setVault(folderPath);
      onVaultConfigured();
    }
  };

  const handleCreate = async () => {
    if (!selectedPath || !vaultName.trim()) return;

    const fullPath = `${selectedPath}\\${vaultName.trim()}`;
    await window.electronAPI.config.setVault(fullPath);
    onVaultConfigured();
  };

  return (
    <div className="setup-screen">
      {/* ── Left branding panel ── */}
      <div className="setup-left">
        <h1 className="setup-logo">SANJan</h1>
        <p className="setup-tagline">
          A local-first workspace<br />
          for connected thinking.
        </p>
      </div>

      {/* ── Right action panel ── */}
      <div className="setup-right">
        <h2 className="setup-heading">Quick Start</h2>
        <p className="setup-subtitle">
          Create a new vault or open an existing folder to get started.
        </p>

        <div className="setup-actions">
          {/* Create New Vault */}
          <div
            className="setup-card"
            onClick={handleCreateNew}
          >
            <div className="setup-card-icon create">📝</div>
            <div className="setup-card-info">
              <div className="setup-card-title">Create new vault</div>
              <div className="setup-card-desc">
                Start fresh with a new workspace for your notes.
              </div>
            </div>
            <span className="setup-card-arrow">→</span>
          </div>

          {/* Open Existing Vault */}
          <div
            className="setup-card"
            onClick={handleOpenExisting}
          >
            <div className="setup-card-icon open">📂</div>
            <div className="setup-card-info">
              <div className="setup-card-title">Open folder as vault</div>
              <div className="setup-card-desc">
                Choose an existing folder with your markdown files.
              </div>
            </div>
            <span className="setup-card-arrow">→</span>
          </div>

          {/* ── Create flow: path + name ── */}
          {mode === 'create' && (
            <>
              <div
                className="setup-card"
                onClick={handleBrowseFolder}
                style={{ borderColor: selectedPath ? '#5a4633' : undefined }}
              >
                <div className="setup-card-icon open">📁</div>
                <div className="setup-card-info">
                  <div className="setup-card-title">
                    {selectedPath ? 'Change location' : 'Choose location'}
                  </div>
                  <div className="setup-card-desc">
                    Select where to create your new vault folder.
                  </div>
                </div>
                <span className="setup-card-arrow">→</span>
              </div>

              {selectedPath && (
                <div className="setup-vault-path">
                  <span className="setup-vault-path-icon">📍</span>
                  <span className="setup-vault-path-text">
                    <strong>{selectedPath}</strong>
                  </span>
                </div>
              )}

              <div className="setup-name-input-group">
                <label className="setup-name-label">Vault name</label>
                <input
                  className="setup-name-input"
                  type="text"
                  value={vaultName}
                  onChange={(e) => setVaultName(e.target.value)}
                  placeholder="My Vault"
                  autoFocus
                />
              </div>

              <button
                className="setup-create-btn"
                disabled={!selectedPath || !vaultName.trim()}
                onClick={handleCreate}
              >
                Create
              </button>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="setup-footer">
          <span className="setup-footer-icon">🔒</span>
          <span className="setup-footer-text">
            Your notes are stored locally. Nothing leaves your device.
          </span>
        </div>
      </div>
    </div>
  );
}

export default SetupScreen;