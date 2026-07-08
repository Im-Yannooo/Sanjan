/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    window: {
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      setSetupSize: () => void;
      setLoginSize: () => void;
      setMainSize: () => void;
    };
    dialog: {
      openFolder: () => Promise<string | null>;
    };
    vault: {
      getNotes: () => Promise<{ title: string; content: string }[]>;
      saveNote: (title: string, content: string) => Promise<void>;
      renameNote: (oldTitle: string, newTitle: string) => Promise<void>;
      deleteNote: (title: string) => Promise<void>;
    };
    config: {
      getConfig: () => Promise<{ vaultPath: string | null }>;
      setVault: (vaultPath: string) => Promise<void>;
    };
  };
}