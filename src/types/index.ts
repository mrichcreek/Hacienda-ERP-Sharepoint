export type FileType = 'FILE' | 'FOLDER';
export type NotificationType = 'UPLOAD' | 'MODIFY' | 'DELETE' | 'SHARE' | 'ALERT';
export type ViewMode = 'list' | 'grid';
export type SortField = 'name' | 'createdAt' | 'size' | 'type';
export type SortDirection = 'asc' | 'desc';

export interface FileItem {
  id: string;
  name: string;
  type: FileType;
  parentId: string | null;
  s3Key: string | null;
  size: number | null;
  mimeType: string | null;
  folderColor: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  ownerId: string;
  ownerEmail: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FileAlert {
  id: string;
  fileItemId: string;
  userId: string;
  userEmail: string;
  alertOnUpload: boolean;
  alertOnModify: boolean;
  alertOnDelete: boolean;
  emailNotification: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  fileItemId: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BreadcrumbItem {
  id: string | null;
  name: string;
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface ContextMenuPosition {
  x: number;
  y: number;
}

export interface ContextMenuAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  divider?: boolean;
  disabled?: boolean;
  danger?: boolean;
}

export const FOLDER_COLORS = [
  { name: 'Default', value: null },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
] as const;
