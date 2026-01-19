/**
 * Sync S3 files to DynamoDB
 *
 * This script scans the S3 bucket and creates corresponding DynamoDB records
 * so files appear in the file browser UI.
 *
 * Usage: npx tsx scripts/sync-s3-to-dynamodb.ts
 */

import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Amplify outputs to get bucket name and table info
const amplifyOutputs = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../amplify_outputs.json'), 'utf-8')
);

const REGION = 'us-east-1';
const BUCKET_NAME = amplifyOutputs.storage.bucket_name;

// The table name follows Amplify's naming convention
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'FileItem-cel736vwezhr7ft5mkoipelbwa-NONE';

// Owner ID - you'll need to replace this with an actual Cognito user ID
const OWNER_ID = process.env.OWNER_ID || 'system-import';
const OWNER_EMAIL = process.env.OWNER_EMAIL || 'system@hacienda-erp.com';

const s3Client = new S3Client({ region: REGION });
const dynamoClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

interface FolderInfo {
  id: string;
  name: string;
  parentId: string | null;
  path: string;
}

const folderCache = new Map<string, FolderInfo>();

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

async function createFolder(name: string, parentId: string | null, folderPath: string): Promise<string> {
  const cacheKey = folderPath;

  if (folderCache.has(cacheKey)) {
    return folderCache.get(cacheKey)!.id;
  }

  const folderId = uuidv4();
  const now = new Date().toISOString();

  const item = {
    id: folderId,
    name,
    type: 'FOLDER',
    parentId: parentId || null,
    s3Key: null,
    size: null,
    mimeType: null,
    folderColor: null,
    isDeleted: false,
    deletedAt: null,
    ownerId: OWNER_ID,
    ownerEmail: OWNER_EMAIL,
    sortOrder: null,
    createdAt: now,
    updatedAt: now,
    __typename: 'FileItem',
  };

  try {
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
      ConditionExpression: 'attribute_not_exists(id)',
    }));
    console.log(`Created folder: ${folderPath}`);
  } catch (error: any) {
    if (error.name === 'ConditionalCheckFailedException') {
      console.log(`Folder already exists: ${folderPath}`);
    } else {
      throw error;
    }
  }

  folderCache.set(cacheKey, { id: folderId, name, parentId, path: folderPath });
  return folderId;
}

async function ensureFolderPath(s3Key: string): Promise<string | null> {
  // s3Key format: files/ConversionFiles/MOCK8/FIN/AP Invoices/PRIFAS/file.csv
  // Remove 'files/' prefix and get folder parts
  const pathWithoutPrefix = s3Key.replace(/^files\//, '');
  const parts = pathWithoutPrefix.split('/');

  // Remove the filename to get just folder parts
  parts.pop();

  if (parts.length === 0) {
    return null; // Root level file
  }

  let currentPath = '';
  let parentId: string | null = null;

  for (const folderName of parts) {
    currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;
    parentId = await createFolder(folderName, parentId, currentPath);
  }

  return parentId;
}

async function createFileRecord(s3Key: string, size: number): Promise<void> {
  const pathWithoutPrefix = s3Key.replace(/^files\//, '');
  const filename = pathWithoutPrefix.split('/').pop() || s3Key;
  const parentId = await ensureFolderPath(s3Key);

  const fileId = uuidv4();
  const now = new Date().toISOString();

  const item = {
    id: fileId,
    name: filename,
    type: 'FILE',
    parentId: parentId || null,
    s3Key: s3Key,
    size: size,
    mimeType: getMimeType(filename),
    folderColor: null,
    isDeleted: false,
    deletedAt: null,
    ownerId: OWNER_ID,
    ownerEmail: OWNER_EMAIL,
    sortOrder: null,
    createdAt: now,
    updatedAt: now,
    __typename: 'FileItem',
  };

  try {
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    }));
    console.log(`Created file record: ${filename}`);
  } catch (error) {
    console.error(`Failed to create file record for ${filename}:`, error);
  }
}

async function listAllS3Objects(): Promise<{ key: string; size: number }[]> {
  const objects: { key: string; size: number }[] = [];
  let continuationToken: string | undefined;

  do {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'files/',
      ContinuationToken: continuationToken,
    });

    const response = await s3Client.send(command);

    if (response.Contents) {
      for (const obj of response.Contents) {
        if (obj.Key && obj.Size !== undefined && !obj.Key.endsWith('/')) {
          objects.push({ key: obj.Key, size: obj.Size });
        }
      }
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return objects;
}

async function main() {
  console.log('Starting S3 to DynamoDB sync...');
  console.log(`Bucket: ${BUCKET_NAME}`);
  console.log(`Table: ${TABLE_NAME}`);
  console.log(`Owner ID: ${OWNER_ID}`);
  console.log('');

  try {
    const objects = await listAllS3Objects();
    console.log(`Found ${objects.length} files in S3\n`);

    for (const obj of objects) {
      await createFileRecord(obj.key, obj.size);
    }

    console.log('\nSync complete!');
    console.log(`Folders created: ${folderCache.size}`);
    console.log(`Files processed: ${objects.length}`);
  } catch (error) {
    console.error('Sync failed:', error);
    process.exit(1);
  }
}

main();
