/// <reference types="vite/client" />

interface Window {
  electronAPI?: {
    minimize?: () => void;
    maximize?: () => void;
    close?: () => void;
    getNotes?: () => Promise<{ title: string; content: string }[]>;
    saveNote?: (title: string, content: string) => Promise<void>;
    renameNote?: (oldTitle: string, newTitle: string) => Promise<void>;
    deleteNote?: (title: string) => Promise<void>;
    [key: string]: any;
  };
}