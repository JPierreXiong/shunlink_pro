import { defineCloudflareConfig } from '@opennextjs/cloudflare';

const cloudflareConfig = defineCloudflareConfig({
  middleware: {
    external: false,
  },
});

export default {
  ...cloudflareConfig,
  // Prevent esbuild from trying to bundle @libsql/client (only used for SQLite/Turso,
  // not needed in Cloudflare Workers where DATABASE_PROVIDER=postgresql)
  edgeExternals: ['node:crypto', '@libsql/client'],
};
