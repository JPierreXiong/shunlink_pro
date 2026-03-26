import { defineCloudflareConfig } from '@opennextjs/cloudflare';

const cloudflareConfig = defineCloudflareConfig({
  // Keep ShipAny structure unchanged; only runtime adapter config.
});

export default {
  ...cloudflareConfig,
  // Windows EBUSY workaround: avoid default .open-next directory lock
  buildOutputPath: '.cfbuild',
};
