import { useState, useEffect } from 'react';
import { Folder, ChevronRight, Home, Loader2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import type { FileItem } from '../../types';

interface MoveToModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (targetFolderId: string | null) => void;
  items: FileItem[];
  mode: 'move' | 'copy';
  folders: FileItem[];
  currentFolderId: string | null;
  onFetchFolders: (parentId: string | null) => Promise<FileItem[]>;
  isLoading?: boolean;
}

export function MoveToModal({
  isOpen,
  onClose,
  onConfirm,
  items,
  mode,
  folders: initialFolders,
  currentFolderId,
  onFetchFolders,
  isLoading = false,
}: MoveToModalProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [browseFolderId, setBrowseFolderId] = useState<string | null>(null);
  const [folders, setFolders] = useState<FileItem[]>(initialFolders);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; name: string }[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);

  useEffect(() => {
    setFolders(initialFolders);
  }, [initialFolders]);

  const handleFolderOpen = async (folder: FileItem) => {
    setLoadingFolders(true);
    try {
      const subFolders = await onFetchFolders(folder.id);
      setFolders(subFolders);
      setBrowseFolderId(folder.id);
      setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }]);
    } catch (error) {
      console.error('Failed to fetch folders:', error);
    } finally {
      setLoadingFolders(false);
    }
  };

  const handleNavigateBack = async (index: number) => {
    const newBreadcrumbs = breadcrumbs.slice(0, index);
    const targetId = index === 0 ? null : newBreadcrumbs[newBreadcrumbs.length - 1].id;

    setLoadingFolders(true);
    try {
      const subFolders = await onFetchFolders(targetId);
      setFolders(subFolders);
      setBrowseFolderId(targetId);
      setBreadcrumbs(newBreadcrumbs);
    } catch (error) {
      console.error('Failed to fetch folders:', error);
    } finally {
      setLoadingFolders(false);
    }
  };

  const handleConfirm = () => {
    const targetId = selectedFolderId ?? browseFolderId;
    onConfirm(targetId);
  };

  const itemsToMove = items.map((i) => i.id);
  const filteredFolders = folders.filter(
    (f) => f.type === 'FOLDER' && !itemsToMove.includes(f.id) && f.id !== currentFolderId
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${mode === 'move' ? 'Move' : 'Copy'} ${items.length} item${items.length !== 1 ? 's' : ''}`}
      size="md"
    >
      <div className="p-4">
        <nav className="flex items-center gap-1 text-sm mb-4 overflow-x-auto pb-1">
          <button
            onClick={() => handleNavigateBack(0)}
            className="flex items-center gap-1 px-2 py-1 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors shrink-0"
          >
            <Home className="w-4 h-4" />
            <span>My Files</span>
          </button>

          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.id ?? 'root'} className="flex items-center shrink-0">
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <button
                onClick={() => handleNavigateBack(index + 1)}
                className="px-2 py-1 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors truncate max-w-[150px]"
              >
                {crumb.name}
              </button>
            </div>
          ))}
        </nav>

        <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
          {loadingFolders ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          ) : filteredFolders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No folders here</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredFolders.map((folder) => (
                <div
                  key={folder.id}
                  className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                    selectedFolderId === folder.id
                      ? 'bg-primary-50'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedFolderId(folder.id)}
                  onDoubleClick={() => handleFolderOpen(folder)}
                >
                  <Folder
                    className="w-5 h-5 shrink-0"
                    style={{ color: folder.folderColor || '#3b82f6' }}
                  />
                  <span className="flex-1 truncate">{folder.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFolderOpen(folder);
                    }}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            {mode === 'move' ? 'Move' : 'Copy'} to:{' '}
            <span className="font-medium text-gray-900">
              {selectedFolderId
                ? filteredFolders.find((f) => f.id === selectedFolderId)?.name
                : breadcrumbs.length > 0
                ? breadcrumbs[breadcrumbs.length - 1].name
                : 'My Files (Root)'}
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={isLoading}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : mode === 'move' ? 'Move Here' : 'Copy Here'}
        </button>
      </div>
    </Modal>
  );
}
