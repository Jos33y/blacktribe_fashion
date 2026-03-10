import dotenv from 'dotenv';

dotenv.config();

const required = [
  'SUPABASE_URL',
  'SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_SECRET_KEY',
];

const optional = [
  'PAYSTACK_SECRET_KEY',
  'PAYSTACK_PUBLIC_KEY',
  'RESEND_API_KEY',
  'RESEND_FROM',
  'SITE_URL',
  'CLIENT_URL',
  'PORT',
  'NODE_ENV',
];

export function validateEnv() {
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(`[env] Missing required environment variables:\n  ${missing.join('\n  ')}`);
    console.error('[env] Copy .env.example to .env and fill in the values.');
    process.exit(1);
  }

  // Log loaded config (no secrets)
  console.log(`[env] Supabase URL: ${process.env.SUPABASE_URL}`);
  console.log(`[env] Environment: ${process.env.NODE_ENV || 'development'}`);
}

export const env = {
  get supabaseUrl() { return process.env.SUPABASE_URL; },
  get supabasePublishableKey() { return process.env.SUPABASE_PUBLISHABLE_KEY; },
  get supabaseSecretKey() { return process.env.SUPABASE_SECRET_KEY; },
  get paystackSecretKey() { return process.env.PAYSTACK_SECRET_KEY; },
  get paystackPublicKey() { return process.env.PAYSTACK_PUBLIC_KEY; },
  get resendApiKey() { return process.env.RESEND_API_KEY; },
  get resendFrom() { return process.env.RESEND_FROM || 'BlackTribe Fashion <noreply@relay.blacktribefashion.com>'; },
  get siteUrl() { return process.env.SITE_URL || 'https://blacktribefashion.com'; },
  get clientUrl() { return process.env.CLIENT_URL || 'http://localhost:5173'; },
  get port() { return parseInt(process.env.PORT || '3000', 10); },
  get isDev() { return process.env.NODE_ENV !== 'production'; },
};
