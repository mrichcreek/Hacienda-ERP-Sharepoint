import { useState, useEffect } from 'react';
import { X, Download, Loader2, FileText, AlertCircle, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import type { FileItem } from '../../types';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: FileItem | null;
  fileUrl: string | null;
  isLoading: boolean;
  error: string | null;
  onDownload: () => void;
}

type PreviewType = 'image' | 'video' | 'audio' | 'pdf' | 'text' | 'code' | 'unsupported';

function getPreviewType(mimeType: string | null): PreviewType {
  if (!mimeType) return 'unsupported';

  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.startsWith('text/') || mimeType === 'application/json') return 'text';
  if (
    mimeType.includes('javascript') ||
    mimeType.includes('typescript') ||
    mimeType.includes('xml') ||
    mimeType.includes('html') ||
    mimeType.includes('css')
  ) {
    return 'code';
  }

  return 'unsupported';
}

function getLanguageFromMimeType(mimeType: string | null): string {
  if (!mimeType) return 'plaintext';

  if (mimeType.includes('javascript')) return 'javascript';
  if (mimeType.includes('typescript')) return 'typescript';
  if (mimeType.includes('json')) return 'json';
  if (mimeType.includes('html')) return 'html';
  if (mimeType.includes('css')) return 'css';
  if (mimeType.includes('xml')) return 'xml';
  if (mimeType === 'text/csv') return 'csv';

  return 'plaintext';
}

export function FilePreviewModal({
  isOpen,
  onClose,
  file,
  fileUrl,
  isLoading,
  error,
  onDownload,
}: FilePreviewModalProps) {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [imageZoom, setImageZoom] = useState(100);
  const [imageRotation, setImageRotation] = useState(0);

  const previewType = file ? getPreviewType(file.mimeType) : 'unsupported';

  // Reset state when file changes
  useEffect(() => {
    setTextContent(null);
    setImageZoom(100);
    setImageRotation(0);
  }, [file?.id]);

  // Load text content for text/code files
  useEffect(() => {
    if (!fileUrl || !file) return;

    if (previewType === 'text' || previewType === 'code') {
      fetch(fileUrl)
        .then((res) => res.text())
        .then((text) => setTextContent(text))
        .catch(() => setTextContent('Failed to load file content'));
    }
  }, [fileUrl, file, previewType]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !file) return null;

  const handleZoomIn = () => setImageZoom((prev) => Math.min(prev + 25, 300));
  const handleZoomOut = () => setImageZoom((prev) => Math.max(prev - 25, 25));
  const handleRotate = () => setImageRotation((prev) => (prev + 90) % 360);

  const renderPreview = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <Loader2 className="w-12 h-12 animate-spin mb-4" />
          <p>Loading preview...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-red-500">
          <AlertCircle className="w-12 h-12 mb-4" />
          <p className="text-lg font-medium">Failed to load preview</p>
          <p className="text-sm text-gray-500 mt-2">{error}</p>
        </div>
      );
    }

    if (!fileUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <FileText className="w-16 h-16 mb-4" />
          <p>No preview available</p>
        </div>
      );
    }

    switch (previewType) {
      case 'image':
        return (
          <div className="flex items-center justify-center h-full overflow-auto p-4">
            <img
              src={fileUrl}
              alt={file.name}
              style={{
                transform: `scale(${imageZoom / 100}) rotate(${imageRotation}deg)`,
                transition: 'transform 0.2s ease-in-out',
                maxWidth: imageZoom <= 100 ? '100%' : 'none',
                maxHeight: imageZoom <= 100 ? '100%' : 'none',
              }}
              className="object-contain"
            />
          </div>
        );

      case 'video':
        return (
          <div className="flex items-center justify-center h-full p-4">
            <video
              src={fileUrl}
              controls
              className="max-w-full max-h-full"
              autoPlay={false}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        );

      case 'audio':
        return (
          <div className="flex flex-col items-center justify-center h-full p-4">
            <div className="w-64 h-64 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center mb-8">
              <div className="w-32 h-32 bg-white rounded-full shadow-inner" />
            </div>
            <audio src={fileUrl} controls className="w-full max-w-md">
              Your browser does not support the audio tag.
            </audio>
          </div>
        );

      case 'pdf':
        return (
          <div className="h-full w-full">
            <iframe
              src={fileUrl}
              className="w-full h-full border-0"
              title={file.name}
            />
          </div>
        );

      case 'text':
      case 'code':
        return (
          <div className="h-full w-full overflow-auto p-4">
            <pre className="text-sm bg-gray-50 p-4 rounded-lg overflow-auto h-full">
              <code className={`language-${getLanguageFromMimeType(file.mimeType)}`}>
                {textContent ?? 'Loading...'}
              </code>
            </pre>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <FileText className="w-16 h-16 mb-4" />
            <p className="text-lg font-medium">Preview not available</p>
            <p className="text-sm text-gray-500 mt-2">
              This file type cannot be previewed. Click download to view it.
            </p>
            <button
              onClick={onDownload}
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download File
            </button>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-900/95">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800 text-white shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="text-lg font-medium truncate">{file.name}</h2>
          {file.size && (
            <span className="text-sm text-gray-400 shrink-0">
              ({(file.size / 1024).toFixed(1)} KB)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {previewType === 'image' && fileUrl && (
            <>
              <button
                onClick={handleZoomOut}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                title="Zoom out"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-400 w-12 text-center">{imageZoom}%</span>
              <button
                onClick={handleZoomIn}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                title="Zoom in"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button
                onClick={handleRotate}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                title="Rotate"
              >
                <RotateCw className="w-5 h-5" />
              </button>
              <div className="w-px h-6 bg-gray-600 mx-2" />
            </>
          )}
          <button
            onClick={onDownload}
            className="flex items-center gap-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
            title="Download"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Preview content */}
      <div className="flex-1 min-h-0 bg-gray-100">
        {renderPreview()}
      </div>
    </div>
  );
}
