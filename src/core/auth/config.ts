import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { oneTap } from 'better-auth/plugins';

import { db } from '@/core/db';
import { envConfigs } from '@/config';
import * as schema from '@/config/db/schema';
import { getUuid } from '@/shared/lib/hash';
import { getAllConfigs } from '@/shared/models/config';

// Safe base URL getter - prevents new URL() crash during Docker build
function getBaseURL(): string {
  if (process.env.AUTH_URL && process.env.AUTH_URL !== 'build-time-placeholder') {
    return process.env.AUTH_URL;
  }
  if (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL !== 'build-time-placeholder') {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  return 'http://localhost:3000';
}

// Helper function to get database provider
export function getDatabaseProvider(
  provider: string
): 'sqlite' | 'pg' | 'mysql' {
  switch (provider) {
    case 'sqlite':
      return 'sqlite';
    case 'postgresql':
      return 'pg';
    case 'mysql':
      return 'mysql';
    default:
      throw new Error(
        `Unsupported database provider for auth: ${envConfigs.database_provider}`
      );
  }
}

// Static auth options - WITH database connection
// This ensures auth works properly in all environments
export const authOptions = {
  appName: envConfigs.app_name,
  baseURL: getBaseURL(),
  secret: envConfigs.auth_secret,
  trustedOrigins: [
    envConfigs.app_url,
    'https://linkflowai.app',
    'https://linkflowai-app.vercel.app',
    'http://localhost:3003',
    'http://localhost:3000',
    'http://localhost:8787',
    'http://127.0.0.1:8787',
  ].filter(Boolean),
  // Add database connection for session persistence
  database: envConfigs.database_url
    ? drizzleAdapter(db(), {
        provider: getDatabaseProvider(envConfigs.database_provider),
        schema: schema,
      })
    : undefined,
  advanced: {
    generateId: () => getUuid(),
  },
  emailAndPassword: {
    enabled: true,
    // Password validation settings
    minPasswordLength: 8,
    requireEmailVerification: false, // Disable email verification for now
  },
  logger: {
    verboseLogging: true, // Enable for debugging
    // Disable all logs during build and production
    disabled: false, // Enable for debugging
  },
};

// Dynamic auth options - WITH database connection
// Only used in API routes that actually need database access
export async function getAuthOptions() {
  const configs = await getAllConfigs();
  return {
    ...authOptions,
    // Add database connection only when actually needed (runtime)
    database: envConfigs.database_url
      ? drizzleAdapter(db(), {
          provider: getDatabaseProvider(envConfigs.database_provider),
          schema: schema,
        })
      : null,
    emailAndPassword: {
      enabled: configs.email_auth_enabled !== 'false',
    },
    socialProviders: await getSocialProviders(configs),
    plugins:
      (configs.google_client_id || process.env.GOOGLE_CLIENT_ID) &&
      configs.google_one_tap_enabled === 'true'
        ? [oneTap()]
        : [],
  };
}

export async function getSocialProviders(configs: Record<string, string>) {
  // get configs from db
  const providers: any = {};

  const googleClientId =
    configs.google_client_id || process.env.GOOGLE_CLIENT_ID || '';
  const googleClientSecret =
    configs.google_client_secret || process.env.GOOGLE_CLIENT_SECRET || '';

  if (googleClientId && googleClientSecret) {
    providers.google = {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    };
  }

  if (configs.github_client_id && configs.github_client_secret) {
    providers.github = {
      clientId: configs.github_client_id,
      clientSecret: configs.github_client_secret,
    };
  }

  return providers;
}
