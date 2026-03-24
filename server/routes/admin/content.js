/*
 * BLACKTRIBE FASHION — ADMIN: Newsletter + Shipping
 */

import express from 'express';
import { requirePermission } from '../../middleware/auth.js';
import { supabaseAdmin } from '../../config/database.js';
import { logActivity, getRequestIp } from '../../utils/activityLog.js';

const router = express.Router();


/* ═══ NEWSLETTER ═══ */

router.get('/newsletter', async (req, res, next) => {
  try {
    const { data, count, error } = await supabaseAdmin
      .from('newsletter')
      .select('*', { count: 'exact' })
      .order('subscribed_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data: data || [], total: count });
  } catch (err) {
    next(err);
  }
});

router.delete('/newsletter/:id', async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from('newsletter')
      .update({ is_active: false })
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) { next(err); }
});


/* ═══ SHIPPING ═══ */

router.get('/shipping', requirePermission('shipping'), async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('shipping_zones')
      .select('*')
      .order('zone_type', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err) {
    next(err);
  }
});

router.put('/shipping/:id', requirePermission('shipping'), async (req, res, next) => {
  try {
    const { rate, free_above } = req.body;
    const updates = {};
    if (rate !== undefined) updates.rate = rate;
    if (free_above !== undefined) updates.free_above = free_above;

    const { data, error } = await supabaseAdmin
      .from('shipping_zones')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
    logActivity(supabaseAdmin, { userId: req.user.id, action: 'shipping.updated', resourceType: 'shipping', resourceId: data.id, details: { name: data.name, rate: data.rate }, ip: getRequestIp(req) });
  } catch (err) { next(err); }
});

export default router;
