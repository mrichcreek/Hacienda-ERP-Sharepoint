import { Check } from 'lucide-react';
import { Modal } from '../common/Modal';
import { FOLDER_COLORS } from '../../types';

interface FolderColorPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (color: string | null) => void;
  currentColor: string | null;
}

export function FolderColorPicker({
  isOpen,
  onClose,
  onSelect,
  currentColor,
}: FolderColorPickerProps) {
  const handleSelect = (color: string | null) => {
    onSelect(color);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Choose Folder Color" size="sm">
      <div className="p-4">
        <div className="grid grid-cols-4 gap-3">
          {FOLDER_COLORS.map((color) => (
            <button
              key={color.name}
              onClick={() => handleSelect(color.value)}
              className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                currentColor === color.value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: color.value || '#e5e7eb' }}
              >
                {currentColor === color.value && (
                  <Check className="w-4 h-4 text-white" />
                )}
              </div>
              <span className="text-xs text-gray-600">{color.name}</span>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
