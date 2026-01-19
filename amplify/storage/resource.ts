import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'haciendaERPFiles',
  access: (allow) => ({
    'files/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
    ],
    'trash/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
    ],
  }),
});
