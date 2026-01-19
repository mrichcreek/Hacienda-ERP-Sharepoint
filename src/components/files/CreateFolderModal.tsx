import { useState } from 'react';
import { Modal } from '../common/Modal';
import { isValidFileName } from '../../utils/fileHelpers';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
  isLoading?: boolean;
}

export function CreateFolderModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: CreateFolderModalProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Folder name is required');
      return;
    }

    if (!isValidFileName(trimmedName)) {
      setError('Invalid folder name. Avoid special characters like < > : " / \\ | ? *');
      return;
    }

    onConfirm(trimmedName);
    setName('');
    setError('');
  };

  const handleClose = () => {
    setName('');
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Folder" size="sm">
      <form onSubmit={handleSubmit}>
        <div className="p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Folder Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder="Enter folder name"
            autoFocus
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              error
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-primary-500'
            }`}
          />
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
            {isLoading ? 'Creating...' : 'Create Folder'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
