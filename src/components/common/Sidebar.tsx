import { FolderOpen, Trash2, Clock, Star, Upload, X } from 'lucide-react';
import { useFileContext } from '../../contexts/FileContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadClick: () => void;
}

export function Sidebar({ isOpen, onClose, onUploadClick }: SidebarProps) {
  const { isTrashView, setIsTrashView, setCurrentFolderId } = useFileContext();

  const handleNavigate = (path: 'files' | 'trash') => {
    if (path === 'trash') {
      setIsTrashView(true);
    } else {
      setIsTrashView(false);
      setCurrentFolderId(null);
    }
    onClose();
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:transform-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 lg:hidden flex items-center justify-between border-b border-gray-200">
            <span className="font-semibold text-gray-900">Menu</span>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-4">
            <button
              onClick={onUploadClick}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              <Upload className="w-5 h-5" />
              Upload Files
            </button>
          </div>

          <nav className="flex-1 px-3 py-2">
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => handleNavigate('files')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    !isTrashView
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FolderOpen className="w-5 h-5" />
                  My Files
                </button>
              </li>
              <li>
                <button
                  disabled
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-gray-400 cursor-not-allowed"
                >
                  <Clock className="w-5 h-5" />
                  Recent
                  <span className="ml-auto text-xs bg-gray-100 px-2 py-0.5 rounded">Soon</span>
                </button>
              </li>
              <li>
                <button
                  disabled
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-gray-400 cursor-not-allowed"
                >
                  <Star className="w-5 h-5" />
                  Starred
                  <span className="ml-auto text-xs bg-gray-100 px-2 py-0.5 rounded">Soon</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigate('trash')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    isTrashView
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Trash2 className="w-5 h-5" />
                  Trash
                </button>
              </li>
            </ul>
          </nav>

          <div className="p-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              <p className="font-medium text-gray-700 mb-1">Storage</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-primary-600 h-2 rounded-full" style={{ width: '0%' }} />
              </div>
              <p className="mt-1 text-xs">0 B used</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
