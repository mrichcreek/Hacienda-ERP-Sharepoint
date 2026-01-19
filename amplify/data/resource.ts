import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  FileItem: a
    .model({
      name: a.string().required(),
      type: a.enum(['FILE', 'FOLDER']),
      parentId: a.string(),
      s3Key: a.string(),
      size: a.integer(),
      mimeType: a.string(),
      folderColor: a.string(),
      isDeleted: a.boolean().default(false),
      deletedAt: a.datetime(),
      ownerId: a.string().required(),
      ownerEmail: a.string(),
      sortOrder: a.string(),
    })
    .secondaryIndexes((index) => [
      index('parentId').sortKeys(['name']),
      index('ownerId').sortKeys(['name']),
    ])
    .authorization((allow) => [allow.authenticated()]),

  FileAlert: a
    .model({
      fileItemId: a.string().required(),
      userId: a.string().required(),
      userEmail: a.string().required(),
      alertOnUpload: a.boolean().default(true),
      alertOnModify: a.boolean().default(true),
      alertOnDelete: a.boolean().default(true),
      emailNotification: a.boolean().default(true),
    })
    .secondaryIndexes((index) => [
      index('userId'),
      index('fileItemId'),
    ])
    .authorization((allow) => [allow.authenticated()]),

  Notification: a
    .model({
      userId: a.string().required(),
      title: a.string().required(),
      message: a.string().required(),
      type: a.enum(['UPLOAD', 'MODIFY', 'DELETE', 'SHARE', 'ALERT']),
      fileItemId: a.string(),
      isRead: a.boolean().default(false),
      readAt: a.datetime(),
      sortKey: a.string(),
    })
    .secondaryIndexes((index) => [
      index('userId').sortKeys(['sortKey']),
    ])
    .authorization((allow) => [allow.authenticated()]),

  QuickLink: a
    .model({
      userId: a.string().required(),
      name: a.string().required(),
      folderId: a.string().required(),
      folderColor: a.string(),
      sortOrder: a.integer().default(0),
    })
    .secondaryIndexes((index) => [
      index('userId').sortKeys(['sortOrder']),
    ])
    .authorization((allow) => [allow.authenticated()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
