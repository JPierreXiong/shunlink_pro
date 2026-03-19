import { getConfigs } from '../models/config';

/**
 * Setting definition
 */
export interface Setting {
  name: string;
  title: string;
  type: string;
  group: string;
  tab: string;
  placeholder?: string;
  tip?: string;
  value?: string;
  options?: { label: string; value: string }[];
  attributes?: Record<string, any>;
}

/**
 * Setting group definition
 */
export interface SettingGroup {
  name: string;
  title: string;
  description?: string;
  tab: string;
}

/**
 * Setting tab definition
 */
export interface SettingTab {
  name: string;
  title: string;
  url: string;
  is_active?: boolean;
}

/**
 * Public setting names (safe to expose to client)
 */
export const publicSettingNames: string[] = [
  'app_name',
  'app_url',
  'app_description',
  'app_logo',
  'app_favicon',
  'default_locale',
  'support_email',
  // Payment
  'default_payment_provider',
  'select_payment_enabled',
  'stripe_enabled',
  'stripe_publishable_key',
  'creem_enabled',
  'creem_environment',
  'paypal_enabled',
  'paypal_client_id',
  'paypal_environment',
  // Analytics
  'google_analytics_id',
  'clarity_id',
  'plausible_domain',
  'openpanel_client_id',
  'vercel_analytics_enabled',
  // Ads
  'adsense_publisher_id',
  // Customer service
  'tawk_property_id',
  'crisp_website_id',
  // Auth
  'github_auth_enabled',
  'google_auth_enabled',
  'email_auth_enabled',
];

/**
 * All setting groups configuration
 */
const settingGroupsConfig: SettingGroup[] = [
  // Auth tab
  { name: 'email_auth', title: 'Email Auth', tab: 'auth' },
  { name: 'google_auth', title: 'Google Auth', tab: 'auth' },
  { name: 'github_auth', title: 'Github Auth', tab: 'auth' },
  // Payment tab
  { name: 'basic_payment', title: 'Basic Payment', tab: 'payment' },
  { name: 'creem', title: 'Creem', tab: 'payment' },
  { name: 'stripe', title: 'Stripe', tab: 'payment' },
  { name: 'paypal', title: 'Paypal', tab: 'payment' },
  // Email tab
  { name: 'resend', title: 'Resend', tab: 'email' },
  // Storage tab
  { name: 'r2', title: 'Cloudflare R2', tab: 'storage' },
  { name: 's3', title: 'AWS S3', tab: 'storage' },
  // AI tab
  { name: 'openrouter', title: 'OpenRouter', tab: 'ai' },
  { name: 'replicate', title: 'Replicate', tab: 'ai' },
  { name: 'fal', title: 'Fal', tab: 'ai' },
  // Analytics tab
  { name: 'google_analytics', title: 'Google Analytics', tab: 'analytics' },
  { name: 'clarity', title: 'Clarity', tab: 'analytics' },
  { name: 'plausible', title: 'Plausible', tab: 'analytics' },
  { name: 'openpanel', title: 'OpenPanel', tab: 'analytics' },
  { name: 'vercel_analytics', title: 'Vercel Analytics', tab: 'analytics' },
  // Ads tab
  { name: 'adsense', title: 'Adsense', tab: 'ads' },
  // Affiliate tab
  { name: 'affonso', title: 'Affonso', tab: 'affiliate' },
  { name: 'promotekit', title: 'PromoteKit', tab: 'affiliate' },
  // Customer service tab
  { name: 'tawk', title: 'Tawk', tab: 'customer_service' },
  { name: 'crisp', title: 'Crisp', tab: 'customer_service' },
];

/**
 * All settings definitions
 */
const settingsConfig: Setting[] = [
  // Email Auth
  { name: 'email_auth_enabled', title: 'Enable Email Auth', type: 'switch', group: 'email_auth', tab: 'auth', tip: 'Allow users to sign in with email and password' },

  // Google Auth
  { name: 'google_auth_enabled', title: 'Enable Google Auth', type: 'switch', group: 'google_auth', tab: 'auth', tip: 'Allow users to sign in with Google' },
  { name: 'google_client_id', title: 'Google Client ID', type: 'text', group: 'google_auth', tab: 'auth', placeholder: 'your-google-client-id', tip: 'Google OAuth Client ID' },
  { name: 'google_client_secret', title: 'Google Client Secret', type: 'password', group: 'google_auth', tab: 'auth', placeholder: 'your-google-client-secret', tip: 'Google OAuth Client Secret' },

  // Github Auth
  { name: 'github_auth_enabled', title: 'Enable Github Auth', type: 'switch', group: 'github_auth', tab: 'auth', tip: 'Allow users to sign in with Github' },
  { name: 'github_client_id', title: 'Github Client ID', type: 'text', group: 'github_auth', tab: 'auth', placeholder: 'your-github-client-id' },
  { name: 'github_client_secret', title: 'Github Client Secret', type: 'password', group: 'github_auth', tab: 'auth', placeholder: 'your-github-client-secret' },

  // Basic Payment
  { name: 'default_payment_provider', title: 'Default Payment Provider', type: 'select', group: 'basic_payment', tab: 'payment', options: [
    { label: 'Creem', value: 'creem' },
    { label: 'Stripe', value: 'stripe' },
    { label: 'PayPal', value: 'paypal' },
  ], tip: 'Select the default payment provider' },
  { name: 'select_payment_enabled', title: 'Allow Payment Provider Selection', type: 'switch', group: 'basic_payment', tab: 'payment', tip: 'Allow users to select their preferred payment provider at checkout' },

  // Creem
  { name: 'creem_enabled', title: 'Enable Creem', type: 'switch', group: 'creem', tab: 'payment', tip: 'Enable Creem payment provider' },
  { name: 'creem_api_key', title: 'Creem API Key', type: 'password', group: 'creem', tab: 'payment', placeholder: 'creem_...' },
  { name: 'creem_signing_secret', title: 'Creem Signing Secret', type: 'password', group: 'creem', tab: 'payment', placeholder: 'whsec_...' },
  { name: 'creem_environment', title: 'Creem Environment', type: 'select', group: 'creem', tab: 'payment', options: [
    { label: 'Production', value: 'production' },
    { label: 'Sandbox', value: 'sandbox' },
  ]},
  { name: 'creem_product_ids', title: 'Creem Product IDs (JSON)', type: 'textarea', group: 'creem', tab: 'payment', placeholder: '{"product_id": "creem_product_id"}', tip: 'JSON mapping of product IDs to Creem product IDs' },

  // Stripe
  { name: 'stripe_enabled', title: 'Enable Stripe', type: 'switch', group: 'stripe', tab: 'payment' },
  { name: 'stripe_secret_key', title: 'Stripe Secret Key', type: 'password', group: 'stripe', tab: 'payment', placeholder: 'sk_...' },
  { name: 'stripe_publishable_key', title: 'Stripe Publishable Key', type: 'text', group: 'stripe', tab: 'payment', placeholder: 'pk_...' },
  { name: 'stripe_signing_secret', title: 'Stripe Signing Secret', type: 'password', group: 'stripe', tab: 'payment', placeholder: 'whsec_...' },

  // PayPal
  { name: 'paypal_enabled', title: 'Enable PayPal', type: 'switch', group: 'paypal', tab: 'payment' },
  { name: 'paypal_client_id', title: 'PayPal Client ID', type: 'text', group: 'paypal', tab: 'payment', placeholder: 'your-paypal-client-id' },
  { name: 'paypal_client_secret', title: 'PayPal Client Secret', type: 'password', group: 'paypal', tab: 'payment', placeholder: 'your-paypal-client-secret' },
  { name: 'paypal_environment', title: 'PayPal Environment', type: 'select', group: 'paypal', tab: 'payment', options: [
    { label: 'Production', value: 'production' },
    { label: 'Sandbox', value: 'sandbox' },
  ]},

  // Resend
  { name: 'resend_api_key', title: 'Resend API Key', type: 'password', group: 'resend', tab: 'email', placeholder: 're_...' },
  { name: 'resend_sender_email', title: 'Sender Email', type: 'text', group: 'resend', tab: 'email', placeholder: 'noreply@yourdomain.com' },
  { name: 'resend_sender_name', title: 'Sender Name', type: 'text', group: 'resend', tab: 'email', placeholder: 'SoloBoard' },

  // Cloudflare R2
  { name: 'r2_account_id', title: 'Account ID', type: 'text', group: 'r2', tab: 'storage', placeholder: 'your-account-id' },
  { name: 'r2_access_key_id', title: 'Access Key ID', type: 'text', group: 'r2', tab: 'storage', placeholder: 'your-access-key-id' },
  { name: 'r2_secret_access_key', title: 'Secret Access Key', type: 'password', group: 'r2', tab: 'storage', placeholder: 'your-secret-access-key' },
  { name: 'r2_bucket', title: 'Bucket Name', type: 'text', group: 'r2', tab: 'storage', placeholder: 'your-bucket-name' },
  { name: 'r2_public_domain', title: 'Public Domain', type: 'text', group: 'r2', tab: 'storage', placeholder: 'https://your-bucket.your-domain.com' },

  // AWS S3
  { name: 's3_region', title: 'Region', type: 'text', group: 's3', tab: 'storage', placeholder: 'us-east-1' },
  { name: 's3_access_key_id', title: 'Access Key ID', type: 'text', group: 's3', tab: 'storage', placeholder: 'your-access-key-id' },
  { name: 's3_secret_access_key', title: 'Secret Access Key', type: 'password', group: 's3', tab: 'storage', placeholder: 'your-secret-access-key' },
  { name: 's3_bucket', title: 'Bucket Name', type: 'text', group: 's3', tab: 'storage', placeholder: 'your-bucket-name' },
  { name: 's3_public_domain', title: 'Public Domain', type: 'text', group: 's3', tab: 'storage', placeholder: 'https://your-bucket.s3.amazonaws.com' },

  // OpenRouter
  { name: 'openrouter_api_key', title: 'OpenRouter API Key', type: 'password', group: 'openrouter', tab: 'ai', placeholder: 'sk-or-...' },
  { name: 'openrouter_model', title: 'Default Model', type: 'text', group: 'openrouter', tab: 'ai', placeholder: 'anthropic/claude-3-haiku' },

  // Replicate
  { name: 'replicate_api_key', title: 'Replicate API Key', type: 'password', group: 'replicate', tab: 'ai', placeholder: 'r8_...' },

  // Fal
  { name: 'fal_api_key', title: 'Fal API Key', type: 'password', group: 'fal', tab: 'ai', placeholder: 'your-fal-api-key' },

  // Google Analytics
  { name: 'google_analytics_id', title: 'Measurement ID', type: 'text', group: 'google_analytics', tab: 'analytics', placeholder: 'G-XXXXXXXXXX' },

  // Clarity
  { name: 'clarity_id', title: 'Clarity Project ID', type: 'text', group: 'clarity', tab: 'analytics', placeholder: 'your-clarity-id' },

  // Plausible
  { name: 'plausible_domain', title: 'Domain', type: 'text', group: 'plausible', tab: 'analytics', placeholder: 'yourdomain.com' },

  // OpenPanel
  { name: 'openpanel_client_id', title: 'Client ID', type: 'text', group: 'openpanel', tab: 'analytics', placeholder: 'your-client-id' },
  { name: 'openpanel_client_secret', title: 'Client Secret', type: 'password', group: 'openpanel', tab: 'analytics', placeholder: 'your-client-secret' },

  // Vercel Analytics
  { name: 'vercel_analytics_enabled', title: 'Enable Vercel Analytics', type: 'switch', group: 'vercel_analytics', tab: 'analytics' },

  // Adsense
  { name: 'adsense_publisher_id', title: 'Publisher ID', type: 'text', group: 'adsense', tab: 'ads', placeholder: 'pub-XXXXXXXXXXXXXXXX' },

  // Affonso
  { name: 'affonso_api_key', title: 'Affonso API Key', type: 'password', group: 'affonso', tab: 'affiliate', placeholder: 'your-affonso-api-key' },

  // PromoteKit
  { name: 'promotekit_id', title: 'PromoteKit ID', type: 'text', group: 'promotekit', tab: 'affiliate', placeholder: 'your-promotekit-id' },

  // Tawk
  { name: 'tawk_property_id', title: 'Property ID', type: 'text', group: 'tawk', tab: 'customer_service', placeholder: 'your-property-id' },
  { name: 'tawk_widget_id', title: 'Widget ID', type: 'text', group: 'tawk', tab: 'customer_service', placeholder: 'your-widget-id' },

  // Crisp
  { name: 'crisp_website_id', title: 'Website ID', type: 'text', group: 'crisp', tab: 'customer_service', placeholder: 'your-crisp-website-id' },
];

/**
 * Get all setting groups
 */
export async function getSettingGroups(): Promise<SettingGroup[]> {
  return settingGroupsConfig;
}

/**
 * Get all settings with current values from DB
 */
export async function getSettings(): Promise<Setting[]> {
  try {
    const configs = await getConfigs();
    return settingsConfig.map((setting) => ({
      ...setting,
      value: configs[setting.name] ?? '',
    }));
  } catch (e) {
    return settingsConfig;
  }
}

/**
 * Get setting tabs with active state
 */
export async function getSettingTabs(activeTab: string): Promise<SettingTab[]> {
  const tabs = [
    { name: 'auth', title: 'Auth', url: '/admin/settings/auth' },
    { name: 'payment', title: 'Payment', url: '/admin/settings/payment' },
    { name: 'email', title: 'Email', url: '/admin/settings/email' },
    { name: 'storage', title: 'Storage', url: '/admin/settings/storage' },
    { name: 'ai', title: 'AI', url: '/admin/settings/ai' },
    { name: 'analytics', title: 'Analytics', url: '/admin/settings/analytics' },
    { name: 'ads', title: 'Ads', url: '/admin/settings/ads' },
    { name: 'affiliate', title: 'Affiliate', url: '/admin/settings/affiliate' },
    { name: 'customer_service', title: 'Customer Service', url: '/admin/settings/customer_service' },
  ];

  return tabs.map((tab) => ({
    ...tab,
    is_active: tab.name === activeTab,
  }));
}

