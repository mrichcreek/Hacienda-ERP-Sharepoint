import { useState, useRef } from 'react';
import { MoreVertical } from 'lucide-react';
import type { FileItem as FileItemType, ContextMenuAction, ContextMenuPosition } from '../../types';
import { FileIcon } from './FileIcon';
import { FileContextMenu } from './FileContextMenu';
import { formatFileSize, formatDate } from '../../utils/formatters';

interface FileItemProps {
  item: FileItemType;
  isSelected: boolean;
  onSelect: () => void;
  onOpen: () => void;
  getContextMenuActions: (item: FileItemType) => ContextMenuAction[];
  viewMode: 'list' | 'grid';
}

export function FileItemComponent({
  item,
  isSelected,
  onSelect,
  onOpen,
  getContextMenuActions,
  viewMode,
}: FileItemProps) {
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(null);
  const itemRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleMenuButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setContextMenu({ x: rect.right, y: rect.bottom });
  };

  const handleDoubleClick = () => {
    onOpen();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onOpen();
    }
  };

  if (viewMode === 'grid') {
    return (
      <>
        <div
          ref={itemRef}
          onClick={onSelect}
          onDoubleClick={handleDoubleClick}
          onContextMenu={handleContextMenu}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          className={`group relative p-4 rounded-lg border-2 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            isSelected
              ? 'border-primary-500 bg-primary-50'
              : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
          }`}
        >
          <button
            onClick={handleMenuButtonClick}
            className="absolute top-2 right-2 p-1 rounded hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="w-4 h-4 text-gray-500" />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className="mb-3">
              <FileIcon
                type={item.type}
                mimeType={item.mimeType}
                folderColor={item.folderColor}
                size="xl"
              />
            </div>
            <p className="font-medium text-gray-900 truncate w-full text-sm">{item.name}</p>
            <p className="text-xs text-gray-500 mt-1">
              {item.type === 'FOLDER' ? 'Folder' : formatFileSize(item.size)}
            </p>
          </div>
        </div>

        {contextMenu && (
          <FileContextMenu
            position={contextMenu}
            actions={getContextMenuActions(item)}
            onClose={() => setContextMenu(null)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div
        ref={itemRef}
        onClick={onSelect}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        className={`group flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 ${
          isSelected ? 'bg-primary-50' : 'hover:bg-gray-50'
        }`}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />

        <div className="shrink-0">
          <FileIcon
            type={item.type}
            mimeType={item.mimeType}
            folderColor={item.folderColor}
            size="md"
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{item.name}</p>
        </div>

        <div className="hidden sm:block w-24 text-sm text-gray-500 text-right">
          {item.type === 'FOLDER' ? '-' : formatFileSize(item.size)}
        </div>

        <div className="hidden md:block w-32 text-sm text-gray-500 text-right">
          {formatDate(item.createdAt)}
        </div>

        <button
          onClick={handleMenuButtonClick}
          className="p-1 rounded hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreVertical className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {contextMenu && (
        <FileContextMenu
          position={contextMenu}
          actions={getContextMenuActions(item)}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
}
