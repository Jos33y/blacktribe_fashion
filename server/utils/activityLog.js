/*
 * BLACKTRIBE FASHION — ACTIVITY LOG UTILITY
 *
 * Logs admin actions to the activity_log table.
 * Fire-and-forget: logging failures never block the primary action.
 *
 * Usage:
 *   import { logActivity } from '../utils/activityLog.js';
 *
 *   await logActivity(supabaseAdmin, {
 *     userId: req.user.id,
 *     action: 'product.created',
 *     resourceType: 'product',
 *     resourceId: product.id,
 *     details: { name: product.name, price: product.price },
 *   });
 *
 * Action naming: resource.verb (e.g., order.status_changed, staff.invited)
 */

/**
 * Log an admin activity. Non-blocking — catches and logs errors silently.
 *
 * @param {object} supabase - Supabase admin client
 * @param {object} params
 * @param {string} params.userId - The admin user who performed the action
 * @param {string} params.action - Action identifier (e.g., 'product.created')
 * @param {string} [params.resourceType] - Type of resource (product, order, staff, etc.)
 * @param {string} [params.resourceId] - UUID of the affected resource
 * @param {object} [params.details] - Additional context (jsonb)
 * @param {string} [params.ip] - Request IP address
 */
export async function logActivity(supabase, {
  userId,
  action,
  resourceType = null,
  resourceId = null,
  details = null,
  ip = null,
}) {
  try {
    await supabase
      .from('activity_log')
      .insert({
        user_id: userId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details: details || {},
        ip_address: ip || null,
      });
  } catch (err) {
    // Never let logging failures break the primary action
    console.error('[activity_log] Failed to log:', action, err?.message || err);
  }
}

/**
 * Helper to extract IP from Express request
 */
export function getRequestIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.socket?.remoteAddress
    || null;
}
