import type { Config } from 'drizzle-kit';

export default {
  schema: './packages/shared/src/db/sqlite-schema.ts',
  out: './tools/migrations/sqlite',
  dialect: 'sqlite',
  dbCredentials: {
    url: 'local.db',
  },
} satisfies Config;