import { defineCloudflareConfig } from '@opennextjs/cloudflare';

const cloudflareConfig = defineCloudflareConfig({
  middleware: {
    external: false,
  },
});

export default {
  ...cloudflareConfig,
};
