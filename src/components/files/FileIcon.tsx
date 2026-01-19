import {
  Folder,
  File,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
} from 'lucide-react';

interface FileIconProps {
  type: 'FILE' | 'FOLDER';
  mimeType: string | null;
  folderColor?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function FileIcon({ type, mimeType, folderColor, size = 'md' }: FileIconProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const sizeClass = sizeClasses[size];

  if (type === 'FOLDER') {
    return (
      <Folder
        className={sizeClass}
        style={{ color: folderColor || '#3b82f6' }}
        fill={folderColor || '#3b82f6'}
        fillOpacity={0.2}
      />
    );
  }

  if (!mimeType) {
    return <File className={`${sizeClass} text-gray-400`} />;
  }

  if (mimeType.startsWith('image/')) {
    return <FileImage className={`${sizeClass} text-purple-500`} />;
  }

  if (mimeType.startsWith('video/')) {
    return <FileVideo className={`${sizeClass} text-pink-500`} />;
  }

  if (mimeType.startsWith('audio/')) {
    return <FileAudio className={`${sizeClass} text-orange-500`} />;
  }

  if (mimeType.includes('pdf')) {
    return <FileText className={`${sizeClass} text-red-500`} />;
  }

  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType === 'text/csv') {
    return <FileSpreadsheet className={`${sizeClass} text-green-600`} />;
  }

  if (mimeType.includes('document') || mimeType.includes('word')) {
    return <FileText className={`${sizeClass} text-blue-600`} />;
  }

  if (mimeType.includes('zip') || mimeType.includes('compressed') || mimeType.includes('archive')) {
    return <FileArchive className={`${sizeClass} text-yellow-600`} />;
  }

  if (mimeType.includes('json') || mimeType.includes('javascript') || mimeType.includes('xml')) {
    return <FileCode className={`${sizeClass} text-gray-600`} />;
  }

  return <File className={`${sizeClass} text-gray-400`} />;
}
