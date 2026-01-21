import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  FolderPlus,
  Download,
  Trash2,
  ChevronDown,
  RefreshCw,
  Copy,
  Scissors,
  Clipboard,
  Edit3,
  Move,
  Bell,
  Palette,
  RotateCcw,
  Loader2,
  FolderOpen,
  Check,
  Eye,
} from 'lucide-react';
import { useFileContext } from '../../contexts/FileContext';
import { useFiles } from '../../hooks/useFiles';
import { BreadcrumbNav } from './BreadcrumbNav';
import { FileItemComponent } from './FileItem';
import { FileUpload } from './FileUpload';
import { CreateFolderModal } from './CreateFolderModal';
import { RenameModal } from './RenameModal';
import { MoveToModal } from './MoveToModal';
import { FolderColorPicker } from './FolderColorPicker';
import { FilePreviewModal } from './FilePreviewModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import type { FileItem, ContextMenuAction, SortField, SortDirection } from '../../types';
import { SORT_OPTIONS } from '../../types';

interface FileBrowserProps {
  isUploadModalOpen: boolean;
  onUploadModalClose: () => void;
}

export function FileBrowser({ isUploadModalOpen, onUploadModalClose }: FileBrowserProps) {
  const {
    currentFolderId,
    setCurrentFolderId,
    selectedItems,
    toggleSelectItem,
    selectAll,
    clearSelection,
    viewMode,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    searchQuery,
    uploadProgress,
    setUploadProgress,
    clipboardItems,
    setClipboardItems,
    isTrashView,
  } = useFileContext();

  const {
    files,
    isLoading,
    breadcrumbs,
    uploadFiles,
    createFolder,
    renameItem,
    deleteItems,
    restoreItems,
    moveItems,
    copyItems,
    downloadFile,
    getFileUrl,
    updateFolderColor,
    fetchFolders,
    refetch,
  } = useFiles(currentFolderId, isTrashView);

  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [renameItem_, setRenameItem] = useState<FileItem | null>(null);
  const [moveModal, setMoveModal] = useState<{ items: FileItem[]; mode: 'move' | 'copy' } | null>(null);
  const [colorPickerItem, setColorPickerItem] = useState<FileItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ ids: string[]; permanent: boolean } | null>(null);
  const [folders, setFolders] = useState<FileItem[]>([]);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setIsSortMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentSortLabel = SORT_OPTIONS.find(
    (opt) => opt.field === sortField && opt.direction === sortDirection
  )?.label || 'Name (A-Z)';

  const filteredAndSortedFiles = useMemo(() => {
    let result = [...files];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((f) => f.name.toLowerCase().includes(query));
    }

    result.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'FOLDER' ? -1 : 1;
      }

      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'size':
          comparison = (a.size || 0) - (b.size || 0);
          break;
        case 'type':
          comparison = (a.mimeType || '').localeCompare(b.mimeType || '');
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [files, searchQuery, sortField, sortDirection]);

  const selectedFileItems = useMemo(
    () => files.filter((f) => selectedItems.has(f.id)),
    [files, selectedItems]
  );

  const handleUpload = async (filesToUpload: File[]) => {
    await uploadFiles(filesToUpload, setUploadProgress);
    setUploadProgress([]);
  };

  const handleCreateFolder = async (name: string) => {
    setIsProcessing(true);
    try {
      await createFolder(name);
      setIsCreateFolderOpen(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRename = async (newName: string) => {
    if (!renameItem_) return;
    setIsProcessing(true);
    try {
      await renameItem(renameItem_.id, newName);
      setRenameItem(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setIsProcessing(true);
    try {
      await deleteItems(deleteConfirm.ids, deleteConfirm.permanent);
      clearSelection();
      setDeleteConfirm(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = async (ids: string[]) => {
    setIsProcessing(true);
    try {
      await restoreItems(ids);
      clearSelection();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMoveOrCopy = async (targetFolderId: string | null) => {
    if (!moveModal) return;
    setIsProcessing(true);
    try {
      if (moveModal.mode === 'move') {
        await moveItems(
          moveModal.items.map((i) => i.id),
          targetFolderId
        );
      } else {
        await copyItems(moveModal.items, targetFolderId);
      }
      clearSelection();
      setMoveModal(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaste = async () => {
    if (!clipboardItems) return;
    setIsProcessing(true);
    try {
      if (clipboardItems.operation === 'cut') {
        await moveItems(
          clipboardItems.items.map((i) => i.id),
          currentFolderId
        );
      } else {
        await copyItems(clipboardItems.items, currentFolderId);
      }
      setClipboardItems(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenMoveModal = useCallback(
    async (items: FileItem[], mode: 'move' | 'copy') => {
      const rootFolders = await fetchFolders(null);
      setFolders(rootFolders);
      setMoveModal({ items, mode });
    },
    [fetchFolders]
  );

  const handleOpenItem = (item: FileItem) => {
    if (item.type === 'FOLDER') {
      setCurrentFolderId(item.id);
      clearSelection();
    } else {
      handlePreviewFile(item);
    }
  };

  const handlePreviewFile = async (item: FileItem) => {
    if (item.type === 'FOLDER') return;

    setPreviewFile(item);
    setPreviewUrl(null);
    setPreviewError(null);
    setIsPreviewLoading(true);

    try {
      const url = await getFileUrl(item);
      if (url) {
        setPreviewUrl(url);
      } else {
        setPreviewError('Failed to load file');
      }
    } catch (err) {
      console.error('Preview failed:', err);
      setPreviewError('Failed to load preview');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleClosePreview = () => {
    setPreviewFile(null);
    setPreviewUrl(null);
    setPreviewError(null);
    setIsPreviewLoading(false);
  };

  const getContextMenuActions = useCallback(
    (item: FileItem): ContextMenuAction[] => {
      if (isTrashView) {
        return [
          {
            id: 'restore',
            label: 'Restore',
            icon: <RotateCcw className="w-4 h-4" />,
            onClick: () => handleRestore([item.id]),
          },
          {
            id: 'delete-permanent',
            label: 'Delete Permanently',
            icon: <Trash2 className="w-4 h-4" />,
            onClick: () => setDeleteConfirm({ ids: [item.id], permanent: true }),
            divider: true,
            danger: true,
          },
        ];
      }

      const actions: ContextMenuAction[] = [
        {
          id: 'open',
          label: item.type === 'FOLDER' ? 'Open' : 'Preview',
          icon: item.type === 'FOLDER' ? <FolderOpen className="w-4 h-4" /> : <Eye className="w-4 h-4" />,
          onClick: () => handleOpenItem(item),
        },
      ];

      if (item.type === 'FILE') {
        actions.push({
          id: 'download',
          label: 'Download',
          icon: <Download className="w-4 h-4" />,
          onClick: () => downloadFile(item),
        });
      }

      actions.push(
        {
          id: 'rename',
          label: 'Rename',
          icon: <Edit3 className="w-4 h-4" />,
          onClick: () => setRenameItem(item),
          divider: true,
        },
        {
          id: 'move',
          label: 'Move to',
          icon: <Move className="w-4 h-4" />,
          onClick: () => handleOpenMoveModal([item], 'move'),
        },
        {
          id: 'copy-to',
          label: 'Copy to',
          icon: <Copy className="w-4 h-4" />,
          onClick: () => handleOpenMoveModal([item], 'copy'),
        },
        {
          id: 'copy',
          label: 'Copy',
          icon: <Copy className="w-4 h-4" />,
          onClick: () => setClipboardItems({ items: [item], operation: 'copy' }),
          divider: true,
        },
        {
          id: 'cut',
          label: 'Cut',
          icon: <Scissors className="w-4 h-4" />,
          onClick: () => setClipboardItems({ items: [item], operation: 'cut' }),
        },
      ];

      if (item.type === 'FOLDER') {
        actions.push({
          id: 'color',
          label: 'Folder Color',
          icon: <Palette className="w-4 h-4" />,
          onClick: () => setColorPickerItem(item),
          divider: true,
        });
      }

      actions.push(
        {
          id: 'alert',
          label: 'Alert Me',
          icon: <Bell className="w-4 h-4" />,
          onClick: () => {
            // TODO: Implement alert modal
          },
          divider: true,
        },
        {
          id: 'delete',
          label: 'Delete',
          icon: <Trash2 className="w-4 h-4" />,
          onClick: () => setDeleteConfirm({ ids: [item.id], permanent: false }),
          danger: true,
        }
      );

      return actions;
    },
    [isTrashView, handleOpenMoveModal, setClipboardItems, downloadFile, setCurrentFolderId, clearSelection]
  );

  const handleSortSelect = (field: SortField, direction: SortDirection) => {
    setSortField(field);
    setSortDirection(direction);
    setIsSortMenuOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 m-4 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-white via-slate-50 to-white sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          {!isTrashView ? (
            <BreadcrumbNav
              items={breadcrumbs}
              onNavigate={(id) => {
                setCurrentFolderId(id);
                clearSelection();
              }}
            />
          ) : (
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Trash
            </h2>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={refetch}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!isTrashView && (
            <>
              <button
                onClick={() => setIsCreateFolderOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <FolderPlus className="w-4 h-4" />
                New Folder
              </button>

              {clipboardItems && (
                <button
                  onClick={handlePaste}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary-100 text-primary-700 hover:bg-primary-200 rounded-lg transition-colors"
                >
                  <Clipboard className="w-4 h-4" />
                  Paste ({clipboardItems.items.length})
                </button>
              )}
            </>
          )}

          {selectedItems.size > 0 && (
            <>
              <div className="h-6 w-px bg-gray-300" />
              <span className="text-sm text-gray-600">
                {selectedItems.size} selected
              </span>

              {isTrashView ? (
                <>
                  <button
                    onClick={() => handleRestore(Array.from(selectedItems))}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Restore
                  </button>
                  <button
                    onClick={() =>
                      setDeleteConfirm({ ids: Array.from(selectedItems), permanent: true })
                    }
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Permanently
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleOpenMoveModal(selectedFileItems, 'move')}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Move className="w-4 h-4" />
                    Move
                  </button>
                  <button
                    onClick={() =>
                      setDeleteConfirm({ ids: Array.from(selectedItems), permanent: false })
                    }
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </>
              )}

              <button
                onClick={clearSelection}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Clear
              </button>
            </>
          )}

          <div className="ml-auto relative" ref={sortMenuRef}>
            <button
              onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {currentSortLabel}
              <ChevronDown className="w-4 h-4" />
            </button>
            {isSortMenuOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.label}
                    onClick={() => handleSortSelect(option.field, option.direction)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 ${
                      sortField === option.field && sortDirection === option.direction
                        ? 'text-primary-600 font-medium'
                        : 'text-gray-700'
                    }`}
                  >
                    {option.label}
                    {sortField === option.field && sortDirection === option.direction && (
                      <Check className="w-4 h-4" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
        ) : filteredAndSortedFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <FolderOpen className="w-16 h-16 mb-4 text-gray-300" />
            <p className="text-lg font-medium">
              {searchQuery ? 'No matching files found' : isTrashView ? 'Trash is empty' : 'This folder is empty'}
            </p>
            <p className="text-sm mt-1">
              {!searchQuery && !isTrashView && 'Upload files or create folders to get started'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredAndSortedFiles.map((item) => (
              <FileItemComponent
                key={item.id}
                item={item}
                isSelected={selectedItems.has(item.id)}
                onSelect={() => toggleSelectItem(item.id)}
                onOpen={() => handleOpenItem(item)}
                getContextMenuActions={getContextMenuActions}
                viewMode="grid"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="w-4" />
              <div className="w-5" />
              <div className="flex-1">Name</div>
              <div className="hidden lg:block w-24 text-center">Type</div>
              <div className="hidden sm:block w-24 text-right">Size</div>
              <div className="hidden md:block w-32 text-right">Modified</div>
              <div className="w-8" />
            </div>
            {files.length > 0 && !isTrashView && (
              <div className="flex items-center gap-3 px-3 py-1">
                <input
                  type="checkbox"
                  checked={selectedItems.size === filteredAndSortedFiles.length && filteredAndSortedFiles.length > 0}
                  onChange={() => {
                    if (selectedItems.size === filteredAndSortedFiles.length) {
                      clearSelection();
                    } else {
                      selectAll(filteredAndSortedFiles);
                    }
                  }}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-500">Select all</span>
              </div>
            )}
            {filteredAndSortedFiles.map((item) => (
              <FileItemComponent
                key={item.id}
                item={item}
                isSelected={selectedItems.has(item.id)}
                onSelect={() => toggleSelectItem(item.id)}
                onOpen={() => handleOpenItem(item)}
                getContextMenuActions={getContextMenuActions}
                viewMode="list"
              />
            ))}
          </div>
        )}
      </div>

      <FileUpload
        isOpen={isUploadModalOpen}
        onClose={onUploadModalClose}
        onUpload={handleUpload}
        uploadProgress={uploadProgress}
      />

      <CreateFolderModal
        isOpen={isCreateFolderOpen}
        onClose={() => setIsCreateFolderOpen(false)}
        onConfirm={handleCreateFolder}
        isLoading={isProcessing}
      />

      <RenameModal
        isOpen={!!renameItem_}
        onClose={() => setRenameItem(null)}
        onConfirm={handleRename}
        item={renameItem_}
        isLoading={isProcessing}
      />

      {moveModal && (
        <MoveToModal
          isOpen={true}
          onClose={() => setMoveModal(null)}
          onConfirm={handleMoveOrCopy}
          items={moveModal.items}
          mode={moveModal.mode}
          folders={folders}
          currentFolderId={currentFolderId}
          onFetchFolders={fetchFolders}
          isLoading={isProcessing}
        />
      )}

      <FolderColorPicker
        isOpen={!!colorPickerItem}
        onClose={() => setColorPickerItem(null)}
        onSelect={(color) => {
          if (colorPickerItem) {
            updateFolderColor(colorPickerItem.id, color);
          }
        }}
        currentColor={colorPickerItem?.folderColor ?? null}
      />

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title={deleteConfirm?.permanent ? 'Delete Permanently?' : 'Move to Trash?'}
        message={
          deleteConfirm?.permanent
            ? `Are you sure you want to permanently delete ${deleteConfirm.ids.length} item(s)? This action cannot be undone.`
            : `${deleteConfirm?.ids.length} item(s) will be moved to trash.`
        }
        confirmText={deleteConfirm?.permanent ? 'Delete Permanently' : 'Move to Trash'}
        isDangerous={deleteConfirm?.permanent}
        isLoading={isProcessing}
      />

      <FilePreviewModal
        isOpen={!!previewFile}
        onClose={handleClosePreview}
        file={previewFile}
        fileUrl={previewUrl}
        isLoading={isPreviewLoading}
        error={previewError}
        onDownload={() => previewFile && downloadFile(previewFile)}
      />
    </div>
  );
}
