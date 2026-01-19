import { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { isValidFileName, getFileExtension } from '../../utils/fileHelpers';
import type { FileItem } from '../../types';

interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newName: string) => void;
  item: FileItem | null;
  isLoading?: boolean;
}

export function RenameModal({
  isOpen,
  onClose,
  onConfirm,
  item,
  isLoading = false,
}: RenameModalProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (item) {
      if (item.type === 'FILE') {
        const ext = getFileExtension(item.name);
        const baseName = ext ? item.name.slice(0, -(ext.length + 1)) : item.name;
        setName(baseName);
      } else {
        setName(item.name);
      }
    }
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!item) return;

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Name is required');
      return;
    }

    let finalName = trimmedName;
    if (item.type === 'FILE') {
      const ext = getFileExtension(item.name);
      if (ext) {
        finalName = `${trimmedName}.${ext}`;
      }
    }

    if (!isValidFileName(finalName)) {
      setError('Invalid name. Avoid special characters like < > : " / \\ | ? *');
      return;
    }

    onConfirm(finalName);
  };

  const handleClose = () => {
    setName('');
    setError('');
    onClose();
  };

  const extension = item?.type === 'FILE' ? getFileExtension(item.name) : null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Rename" size="sm">
      <form onSubmit={handleSubmit}>
        <div className="p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {item?.type === 'FOLDER' ? 'Folder Name' : 'File Name'}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="Enter new name"
              autoFocus
              className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                error
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-primary-500'
              }`}
            />
            {extension && (
              <span className="text-gray-500 shrink-0">.{extension}</span>
            )}
          </div>
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim() || isLoading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Renaming...' : 'Rename'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
