import { useState, useCallback, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import { uploadData, downloadData, remove, copy } from 'aws-amplify/storage';
import { fetchAuthSession } from 'aws-amplify/auth';
import type { Schema } from '../../amplify/data/resource';
import type { FileItem, UploadProgress, BreadcrumbItem } from '../types';
import { generateS3Key, getMimeTypeFromExtension } from '../utils/fileHelpers';
import { useNotificationContext } from '../contexts/NotificationContext';

const client = generateClient<Schema>();

export function useFiles(currentFolderId: string | null, isTrashView: boolean) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const { showToast } = useNotificationContext();

  const fetchFiles = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, errors } = await client.models.FileItem.list({
        filter: {
          isDeleted: { eq: isTrashView },
          ...(isTrashView ? {} : { parentId: currentFolderId ? { eq: currentFolderId } : { attributeExists: false } }),
        },
      });

      if (errors) {
        throw new Error(errors[0].message);
      }

      setFiles(data as unknown as FileItem[]);
    } catch (err) {
      console.error('Failed to fetch files:', err);
      setError('Failed to load files');
    } finally {
      setIsLoading(false);
    }
  }, [currentFolderId, isTrashView]);

  const fetchBreadcrumbs = useCallback(async (): Promise<void> => {
    if (!currentFolderId) {
      setBreadcrumbs([]);
      return;
    }

    const crumbs: BreadcrumbItem[] = [];
    let folderId: string | null = currentFolderId;

    while (folderId) {
      const currentId: string = folderId;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await client.models.FileItem.get({ id: currentId });
      if (response.data) {
        crumbs.unshift({ id: response.data.id, name: response.data.name });
        folderId = response.data.parentId ?? null;
      } else {
        folderId = null;
      }
    }

    setBreadcrumbs(crumbs);
  }, [currentFolderId]);

  useEffect(() => {
    fetchFiles();
    fetchBreadcrumbs();
  }, [fetchFiles, fetchBreadcrumbs]);

  const uploadFiles = useCallback(
    async (
      filesToUpload: File[],
      onProgress: (progress: UploadProgress[]) => void
    ) => {
      const session = await fetchAuthSession();
      const userId = session.tokens?.idToken?.payload?.sub as string;
      const userEmail = session.tokens?.idToken?.payload?.email as string;

      const progressState: UploadProgress[] = filesToUpload.map((f) => ({
        fileName: f.name,
        progress: 0,
        status: 'pending' as const,
      }));

      onProgress([...progressState]);

      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const s3Key = generateS3Key(currentFolderId || '', file.name);

        progressState[i] = { ...progressState[i], status: 'uploading' };
        onProgress([...progressState]);

        try {
          await uploadData({
            path: s3Key,
            data: file,
            options: {
              contentType: file.type || getMimeTypeFromExtension(file.name),
              onProgress: (event) => {
                const percent = event.totalBytes
                  ? Math.round((event.transferredBytes / event.totalBytes) * 100)
                  : 0;
                progressState[i] = { ...progressState[i], progress: percent };
                onProgress([...progressState]);
              },
            },
          }).result;

          const { data: fileItem } = await client.models.FileItem.create({
            name: file.name,
            type: 'FILE',
            parentId: currentFolderId,
            s3Key,
            size: file.size,
            mimeType: file.type || getMimeTypeFromExtension(file.name),
            isDeleted: false,
            ownerId: userId,
            ownerEmail: userEmail,
          });

          progressState[i] = { ...progressState[i], progress: 100, status: 'completed' };
          onProgress([...progressState]);

          if (fileItem) {
            setFiles((prev) => [...prev, fileItem as unknown as FileItem]);
          }
        } catch (err) {
          console.error('Upload failed:', err);
          progressState[i] = {
            ...progressState[i],
            status: 'error',
            error: 'Upload failed',
          };
          onProgress([...progressState]);
        }
      }

      showToast({
        title: 'Upload Complete',
        message: `${filesToUpload.length} file(s) uploaded successfully`,
        type: 'success',
      });
    },
    [currentFolderId, showToast]
  );

  const createFolder = useCallback(
    async (name: string) => {
      const session = await fetchAuthSession();
      const userId = session.tokens?.idToken?.payload?.sub as string;
      const userEmail = session.tokens?.idToken?.payload?.email as string;

      const { data, errors } = await client.models.FileItem.create({
        name,
        type: 'FOLDER',
        parentId: currentFolderId,
        isDeleted: false,
        ownerId: userId,
        ownerEmail: userEmail,
      });

      if (errors) {
        throw new Error(errors[0].message);
      }

      if (data) {
        setFiles((prev) => [...prev, data as unknown as FileItem]);
        showToast({
          title: 'Folder Created',
          message: `"${name}" has been created`,
          type: 'success',
        });
      }

      return data;
    },
    [currentFolderId, showToast]
  );

  const renameItem = useCallback(
    async (id: string, newName: string) => {
      const { data, errors } = await client.models.FileItem.update({
        id,
        name: newName,
      });

      if (errors) {
        throw new Error(errors[0].message);
      }

      if (data) {
        setFiles((prev) =>
          prev.map((f) => (f.id === id ? { ...f, name: newName } : f))
        );
        showToast({
          title: 'Renamed',
          message: `Item renamed to "${newName}"`,
          type: 'success',
        });
      }

      return data;
    },
    [showToast]
  );

  const deleteItems = useCallback(
    async (ids: string[], permanent: boolean = false) => {
      for (const id of ids) {
        const item = files.find((f) => f.id === id);

        if (permanent) {
          if (item?.s3Key) {
            await remove({ path: item.s3Key });
          }
          await client.models.FileItem.delete({ id });
        } else {
          await client.models.FileItem.update({
            id,
            isDeleted: true,
            deletedAt: new Date().toISOString(),
          });
        }
      }

      setFiles((prev) => prev.filter((f) => !ids.includes(f.id)));
      showToast({
        title: permanent ? 'Permanently Deleted' : 'Moved to Trash',
        message: `${ids.length} item(s) ${permanent ? 'deleted' : 'moved to trash'}`,
        type: 'success',
      });
    },
    [files, showToast]
  );

  const restoreItems = useCallback(
    async (ids: string[]) => {
      for (const id of ids) {
        await client.models.FileItem.update({
          id,
          isDeleted: false,
          deletedAt: null,
        });
      }

      setFiles((prev) => prev.filter((f) => !ids.includes(f.id)));
      showToast({
        title: 'Restored',
        message: `${ids.length} item(s) restored`,
        type: 'success',
      });
    },
    [showToast]
  );

  const moveItems = useCallback(
    async (ids: string[], targetFolderId: string | null) => {
      for (const id of ids) {
        await client.models.FileItem.update({
          id,
          parentId: targetFolderId,
        });
      }

      setFiles((prev) => prev.filter((f) => !ids.includes(f.id)));
      showToast({
        title: 'Moved',
        message: `${ids.length} item(s) moved`,
        type: 'success',
      });
    },
    [showToast]
  );

  const copyItems = useCallback(
    async (items: FileItem[], targetFolderId: string | null) => {
      const session = await fetchAuthSession();
      const userId = session.tokens?.idToken?.payload?.sub as string;
      const userEmail = session.tokens?.idToken?.payload?.email as string;

      for (const item of items) {
        let newS3Key: string | null = null;

        if (item.type === 'FILE' && item.s3Key) {
          newS3Key = generateS3Key(targetFolderId || '', item.name);
          await copy({
            source: { path: item.s3Key },
            destination: { path: newS3Key },
          });
        }

        await client.models.FileItem.create({
          name: item.type === 'FILE' ? item.name : `${item.name} (Copy)`,
          type: item.type,
          parentId: targetFolderId,
          s3Key: newS3Key,
          size: item.size,
          mimeType: item.mimeType,
          folderColor: item.folderColor,
          isDeleted: false,
          ownerId: userId,
          ownerEmail: userEmail,
        });
      }

      showToast({
        title: 'Copied',
        message: `${items.length} item(s) copied`,
        type: 'success',
      });
    },
    [showToast]
  );

  const downloadFile = useCallback(async (item: FileItem) => {
    if (!item.s3Key || item.type === 'FOLDER') return;

    try {
      const result = await downloadData({ path: item.s3Key }).result;
      const blob = await result.body.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = item.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      showToast({
        title: 'Download Failed',
        message: 'Failed to download the file',
        type: 'error',
      });
    }
  }, [showToast]);

  const updateFolderColor = useCallback(
    async (id: string, color: string | null) => {
      const { data, errors } = await client.models.FileItem.update({
        id,
        folderColor: color,
      });

      if (errors) {
        throw new Error(errors[0].message);
      }

      if (data) {
        setFiles((prev) =>
          prev.map((f) => (f.id === id ? { ...f, folderColor: color } : f))
        );
      }

      return data;
    },
    []
  );

  const fetchFolders = useCallback(async (parentId: string | null) => {
    const { data } = await client.models.FileItem.list({
      filter: {
        type: { eq: 'FOLDER' },
        isDeleted: { eq: false },
        ...(parentId ? { parentId: { eq: parentId } } : { parentId: { attributeExists: false } }),
      },
    });

    return data as unknown as FileItem[];
  }, []);

  return {
    files,
    isLoading,
    error,
    breadcrumbs,
    uploadFiles,
    createFolder,
    renameItem,
    deleteItems,
    restoreItems,
    moveItems,
    copyItems,
    downloadFile,
    updateFolderColor,
    fetchFolders,
    refetch: fetchFiles,
  };
}
