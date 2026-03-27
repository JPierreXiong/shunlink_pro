import { defineCloudflareConfig } from '@opennextjs/cloudflare';

const cloudflareConfig = defineCloudflareConfig({
  // Keep ShipAny structure unchanged; only runtime adapter config.
});

export default {
  ...cloudflareConfig,
};
