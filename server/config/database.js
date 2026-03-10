import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

// Public client (respects RLS, uses publishable key)
export const supabase = createClient(
  env.supabaseUrl,
  env.supabasePublishableKey
);

// Admin client (bypasses RLS, uses secret key)
// Use for: webhooks, order creation, guest tracking, admin operations
export const supabaseAdmin = createClient(
  env.supabaseUrl,
  env.supabaseSecretKey
);
