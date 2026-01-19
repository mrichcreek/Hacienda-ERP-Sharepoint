import { useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import { list } from 'aws-amplify/storage';
import { fetchAuthSession } from 'aws-amplify/auth';
import type { Schema } from '../../amplify/data/resource';
import { Loader2, CheckCircle, AlertCircle, Play } from 'lucide-react';

const client = generateClient<Schema>();

interface ImportStatus {
  total: number;
  processed: number;
  folders: number;
  files: number;
  errors: string[];
}

function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
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
    sql: 'text/plain',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

export function ImportDataPage() {
  const [isImporting, setIsImporting] = useState(false);
  const [status, setStatus] = useState<ImportStatus | null>(null);
  const [isDone, setIsDone] = useState(false);

  const folderCache = new Map<string, string>();

  const createFolder = async (
    name: string,
    parentId: string | null,
    folderPath: string,
    userId: string,
    userEmail: string
  ): Promise<string> => {
    if (folderCache.has(folderPath)) {
      return folderCache.get(folderPath)!;
    }

    try {
      const { data } = await client.models.FileItem.create({
        name,
        type: 'FOLDER',
        parentId: parentId || null,
        ownerId: userId,
        ownerEmail: userEmail,
        isDeleted: false,
      });

      if (data) {
        folderCache.set(folderPath, data.id);
        return data.id;
      }
    } catch (error) {
      console.error(`Failed to create folder ${name}:`, error);
    }

    return '';
  };

  const ensureFolderPath = async (
    s3Key: string,
    userId: string,
    userEmail: string,
    updateStatus: (updates: Partial<ImportStatus>) => void
  ): Promise<string | null> => {
    // s3Key format: files/ConversionFiles/MOCK8/FIN/file.csv
    const pathWithoutPrefix = s3Key.replace(/^files\//, '');
    const parts = pathWithoutPrefix.split('/');
    parts.pop(); // Remove filename

    if (parts.length === 0) {
      return null;
    }

    let currentPath = '';
    let parentId: string | null = null;

    for (const folderName of parts) {
      currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;

      if (!folderCache.has(currentPath)) {
        parentId = await createFolder(folderName, parentId, currentPath, userId, userEmail);
        updateStatus({ folders: folderCache.size });
      } else {
        parentId = folderCache.get(currentPath) || null;
      }
    }

    return parentId;
  };

  const handleImport = async () => {
    setIsImporting(true);
    setIsDone(false);
    setStatus({
      total: 0,
      processed: 0,
      folders: 0,
      files: 0,
      errors: [],
    });

    try {
      // Get current user info
      const session = await fetchAuthSession();
      const userId = session.tokens?.idToken?.payload?.sub as string;
      const userEmail = session.tokens?.idToken?.payload?.email as string;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      // List all files in S3
      const result = await list({
        path: 'files/',
        options: {
          listAll: true,
        },
      });

      const files = result.items.filter(
        (item) => item.path && !item.path.endsWith('/')
      );

      setStatus((prev) => prev ? { ...prev, total: files.length } : prev);

      const updateStatus = (updates: Partial<ImportStatus>) => {
        setStatus((prev) => prev ? { ...prev, ...updates } : prev);
      };

      // Process each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const s3Key = file.path;
        const filename = s3Key.split('/').pop() || '';

        try {
          // Ensure folder structure exists
          const parentId = await ensureFolderPath(s3Key, userId, userEmail, updateStatus);

          // Create file record
          await client.models.FileItem.create({
            name: filename,
            type: 'FILE',
            parentId: parentId || null,
            s3Key: s3Key,
            size: file.size || 0,
            mimeType: getMimeType(filename),
            ownerId: userId,
            ownerEmail: userEmail,
            isDeleted: false,
          });

          setStatus((prev) =>
            prev
              ? {
                  ...prev,
                  processed: i + 1,
                  files: prev.files + 1,
                }
              : prev
          );
        } catch (error: any) {
          setStatus((prev) =>
            prev
              ? {
                  ...prev,
                  processed: i + 1,
                  errors: [...prev.errors, `${filename}: ${error.message}`],
                }
              : prev
          );
        }

        // Small delay to avoid rate limiting
        if (i % 10 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      setIsDone(true);
    } catch (error: any) {
      setStatus((prev) =>
        prev
          ? {
              ...prev,
              errors: [...prev.errors, `Import failed: ${error.message}`],
            }
          : prev
      );
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Import S3 Data</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600 mb-4">
          This will scan the S3 bucket and create database records for all files,
          making them visible in the file browser.
        </p>

        <button
          onClick={handleImport}
          disabled={isImporting}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isImporting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Start Import
            </>
          )}
        </button>

        {status && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2">
              {isDone ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
              )}
              <span className="font-medium">
                {isDone ? 'Import Complete!' : 'Importing...'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-gray-500">Progress</div>
                <div className="font-medium">
                  {status.processed} / {status.total} files
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-gray-500">Folders Created</div>
                <div className="font-medium">{status.folders}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-gray-500">Files Imported</div>
                <div className="font-medium">{status.files}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-gray-500">Errors</div>
                <div className="font-medium text-red-600">
                  {status.errors.length}
                </div>
              </div>
            </div>

            {status.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
                  <AlertCircle className="w-5 h-5" />
                  Errors
                </div>
                <ul className="text-sm text-red-600 space-y-1 max-h-40 overflow-y-auto">
                  {status.errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {isDone && status.errors.length === 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
                All files have been imported successfully! Go to{' '}
                <a href="/" className="underline font-medium">
                  My Files
                </a>{' '}
                to view them.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
