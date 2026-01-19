import { useState, useEffect } from 'react';
import { FolderOpen, Trash2, Clock, Star, Upload, X, Link, Plus, Folder, Trash } from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import { fetchAuthSession } from 'aws-amplify/auth';
import type { Schema } from '../../../amplify/data/resource';
import { useFileContext } from '../../contexts/FileContext';
import { Modal } from './Modal';

const client = generateClient<Schema>();

interface QuickLink {
  id: string;
  name: string;
  folderId: string;
  folderColor: string | null;
  sortOrder: number;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadClick: () => void;
}

export function Sidebar({ isOpen, onClose, onUploadClick }: SidebarProps) {
  const { isTrashView, setIsTrashView, setCurrentFolderId } = useFileContext();
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>([]);
  const [isAddLinkModalOpen, setIsAddLinkModalOpen] = useState(false);
  const [availableFolders, setAvailableFolders] = useState<{ id: string; name: string; folderColor: string | null }[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [linkName, setLinkName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchQuickLinks();
  }, []);

  const fetchQuickLinks = async () => {
    try {
      const session = await fetchAuthSession();
      const userId = session.tokens?.idToken?.payload?.sub as string;

      const { data } = await client.models.QuickLink.listQuickLinkByUserIdAndSortOrder({
        userId,
      });

      setQuickLinks((data || []).map(link => ({
        id: link.id,
        name: link.name,
        folderId: link.folderId,
        folderColor: link.folderColor || null,
        sortOrder: link.sortOrder || 0,
      })));
    } catch (error) {
      console.error('Failed to fetch quick links:', error);
    }
  };

  const fetchFolders = async () => {
    try {
      const { data } = await client.models.FileItem.list({
        filter: {
          type: { eq: 'FOLDER' },
          isDeleted: { eq: false },
        },
      });

      setAvailableFolders((data || []).map(folder => ({
        id: folder.id,
        name: folder.name,
        folderColor: folder.folderColor || null,
      })));
    } catch (error) {
      console.error('Failed to fetch folders:', error);
    }
  };

  const handleOpenAddModal = async () => {
    await fetchFolders();
    setIsAddLinkModalOpen(true);
  };

  const handleAddQuickLink = async () => {
    if (!selectedFolderId) return;

    setIsLoading(true);
    try {
      const session = await fetchAuthSession();
      const userId = session.tokens?.idToken?.payload?.sub as string;
      const folder = availableFolders.find(f => f.id === selectedFolderId);

      const { data } = await client.models.QuickLink.create({
        userId,
        name: linkName || folder?.name || 'Quick Link',
        folderId: selectedFolderId,
        folderColor: folder?.folderColor,
        sortOrder: quickLinks.length,
      });

      if (data) {
        setQuickLinks(prev => [...prev, {
          id: data.id,
          name: data.name,
          folderId: data.folderId,
          folderColor: data.folderColor || null,
          sortOrder: data.sortOrder || 0,
        }]);
      }

      setIsAddLinkModalOpen(false);
      setSelectedFolderId('');
      setLinkName('');
    } catch (error) {
      console.error('Failed to add quick link:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteQuickLink = async (linkId: string) => {
    try {
      await client.models.QuickLink.delete({ id: linkId });
      setQuickLinks(prev => prev.filter(link => link.id !== linkId));
    } catch (error) {
      console.error('Failed to delete quick link:', error);
    }
  };

  const handleNavigate = (path: 'files' | 'trash') => {
    if (path === 'trash') {
      setIsTrashView(true);
    } else {
      setIsTrashView(false);
      setCurrentFolderId(null);
    }
    onClose();
  };

  const handleQuickLinkClick = (folderId: string) => {
    setIsTrashView(false);
    setCurrentFolderId(folderId);
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

          <nav className="flex-1 px-3 py-2 overflow-y-auto">
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

            <div className="mt-6">
              <div className="flex items-center justify-between px-3 mb-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <Link className="w-4 h-4" />
                  Quick Links
                </h3>
                <button
                  onClick={handleOpenAddModal}
                  className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
                  title="Add Quick Link"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {quickLinks.length === 0 ? (
                <p className="px-3 py-2 text-sm text-gray-400">No quick links yet</p>
              ) : (
                <ul className="space-y-1">
                  {quickLinks.map((link) => (
                    <li key={link.id} className="group">
                      <div className="flex items-center">
                        <button
                          onClick={() => handleQuickLinkClick(link.folderId)}
                          className="flex-1 flex items-center gap-3 px-3 py-2 rounded-lg text-left text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <Folder
                            className="w-5 h-5 shrink-0"
                            style={{ color: link.folderColor || '#3b82f6' }}
                          />
                          <span className="truncate text-sm">{link.name}</span>
                        </button>
                        <button
                          onClick={() => handleDeleteQuickLink(link.id)}
                          className="p-1 mr-2 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove Quick Link"
                        >
                          <Trash className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
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

      <Modal
        isOpen={isAddLinkModalOpen}
        onClose={() => {
          setIsAddLinkModalOpen(false);
          setSelectedFolderId('');
          setLinkName('');
        }}
        title="Add Quick Link"
        size="sm"
      >
        <div className="p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Folder
          </label>
          <select
            value={selectedFolderId}
            onChange={(e) => {
              setSelectedFolderId(e.target.value);
              const folder = availableFolders.find(f => f.id === e.target.value);
              if (folder && !linkName) {
                setLinkName(folder.name);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select a folder...</option>
            {availableFolders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>

          <label className="block text-sm font-medium text-gray-700 mb-2 mt-4">
            Display Name (optional)
          </label>
          <input
            type="text"
            value={linkName}
            onChange={(e) => setLinkName(e.target.value)}
            placeholder="Enter display name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
          <button
            onClick={() => {
              setIsAddLinkModalOpen(false);
              setSelectedFolderId('');
              setLinkName('');
            }}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAddQuickLink}
            disabled={!selectedFolderId || isLoading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Adding...' : 'Add Quick Link'}
          </button>
        </div>
      </Modal>
    </>
  );
}
