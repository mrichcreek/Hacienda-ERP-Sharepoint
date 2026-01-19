import { useEffect, useRef } from 'react';
import type { ContextMenuAction, ContextMenuPosition } from '../../types';

interface FileContextMenuProps {
  position: ContextMenuPosition;
  actions: ContextMenuAction[];
  onClose: () => void;
}

export function FileContextMenu({ position, actions, onClose }: FileContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleScroll = () => onClose();
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('scroll', handleScroll, true);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScroll, true);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let x = position.x;
      let y = position.y;

      if (x + rect.width > viewportWidth) {
        x = viewportWidth - rect.width - 10;
      }
      if (y + rect.height > viewportHeight) {
        y = viewportHeight - rect.height - 10;
      }

      menuRef.current.style.left = `${Math.max(10, x)}px`;
      menuRef.current.style.top = `${Math.max(10, y)}px`;
    }
  }, [position]);

  return (
    <div
      ref={menuRef}
      className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[180px] z-50 animate-scale-in"
      style={{ left: position.x, top: position.y }}
    >
      {actions.map((action) => (
        <div key={action.id}>
          {action.divider && <div className="my-1 border-t border-gray-100" />}
          <button
            onClick={() => {
              if (!action.disabled) {
                action.onClick();
                onClose();
              }
            }}
            disabled={action.disabled}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
              action.disabled
                ? 'text-gray-300 cursor-not-allowed'
                : action.danger
                ? 'text-red-600 hover:bg-red-50'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            {action.icon}
            {action.label}
          </button>
        </div>
      ))}
    </div>
  );
}
