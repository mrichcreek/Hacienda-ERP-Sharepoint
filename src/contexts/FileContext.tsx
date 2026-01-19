import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { FileItem, ViewMode, SortField, SortDirection, UploadProgress } from '../types';

interface FileContextType {
  currentFolderId: string | null;
  setCurrentFolderId: (id: string | null) => void;
  selectedItems: Set<string>;
  setSelectedItems: React.Dispatch<React.SetStateAction<Set<string>>>;
  toggleSelectItem: (id: string) => void;
  selectAll: (items: FileItem[]) => void;
  clearSelection: () => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  sortField: SortField;
  setSortField: (field: SortField) => void;
  sortDirection: SortDirection;
  setSortDirection: (direction: SortDirection) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  uploadProgress: UploadProgress[];
  setUploadProgress: React.Dispatch<React.SetStateAction<UploadProgress[]>>;
  clipboardItems: { items: FileItem[]; operation: 'copy' | 'cut' } | null;
  setClipboardItems: (items: { items: FileItem[]; operation: 'copy' | 'cut' } | null) => void;
  isTrashView: boolean;
  setIsTrashView: (isTrash: boolean) => void;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

export function FileProvider({ children }: { children: ReactNode }) {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [clipboardItems, setClipboardItems] = useState<{ items: FileItem[]; operation: 'copy' | 'cut' } | null>(null);
  const [isTrashView, setIsTrashView] = useState(false);

  const toggleSelectItem = useCallback((id: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((items: FileItem[]) => {
    setSelectedItems(new Set(items.map((item) => item.id)));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  return (
    <FileContext.Provider
      value={{
        currentFolderId,
        setCurrentFolderId,
        selectedItems,
        setSelectedItems,
        toggleSelectItem,
        selectAll,
        clearSelection,
        viewMode,
        setViewMode,
        sortField,
        setSortField,
        sortDirection,
        setSortDirection,
        searchQuery,
        setSearchQuery,
        uploadProgress,
        setUploadProgress,
        clipboardItems,
        setClipboardItems,
        isTrashView,
        setIsTrashView,
      }}
    >
      {children}
    </FileContext.Provider>
  );
}

export function useFileContext() {
  const context = useContext(FileContext);
  if (context === undefined) {
    throw new Error('useFileContext must be used within a FileProvider');
  }
  return context;
}
