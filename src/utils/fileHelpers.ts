import { v4 as uuidv4 } from 'uuid';

export function generateS3Key(parentPath: string, fileName: string): string {
  const uniqueId = uuidv4();
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `files/${parentPath}${uniqueId}_${sanitizedName}`;
}

export function getParentPath(currentPath: string): string {
  if (!currentPath || currentPath === '/') return '';
  const parts = currentPath.split('/').filter(Boolean);
  parts.pop();
  return parts.length > 0 ? parts.join('/') + '/' : '';
}

export function buildPath(parentId: string | null, folderId: string): string {
  if (!parentId) return `${folderId}/`;
  return `${parentId}/${folderId}/`;
}

export function getFileIcon(mimeType: string | null, type: 'FILE' | 'FOLDER'): string {
  if (type === 'FOLDER') return 'folder';

  if (!mimeType) return 'file';

  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf')) return 'file-text';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType === 'text/csv') return 'file-spreadsheet';
  if (mimeType.includes('document') || mimeType.includes('word')) return 'file-text';
  if (mimeType.includes('zip') || mimeType.includes('compressed')) return 'archive';
  if (mimeType.includes('json') || mimeType.includes('javascript') || mimeType.includes('text')) return 'file-code';

  return 'file';
}

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

export function getMimeTypeFromExtension(filename: string): string {
  const ext = getFileExtension(filename);
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    csv: 'text/csv',
    txt: 'text/plain',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    zip: 'application/zip',
    json: 'application/json',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

export function isValidFileName(name: string): boolean {
  if (!name || name.trim().length === 0) return false;
  if (name.length > 255) return false;

  const invalidChars = /[<>:"/\\|?*\x00-\x1F]/;
  if (invalidChars.test(name)) return false;

  const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'LPT1'];
  const upperName = name.toUpperCase().split('.')[0];
  if (reservedNames.includes(upperName)) return false;

  return true;
}

export function sanitizeFileName(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .trim()
    .slice(0, 255);
}

export async function downloadBlob(blob: Blob, filename: string): Promise<void> {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
