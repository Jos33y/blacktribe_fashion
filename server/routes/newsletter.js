/*
 * BLACKTRIBE FASHION — PUBLIC NEWSLETTER API
 *
 * POST /api/newsletter/subscribe — add email to newsletter
 */

import express from 'express';
import { supabaseAdmin } from '../config/database.js';

const router = express.Router();


/* ─── Subscribe ─── */

router.post('/subscribe', async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: 'Enter a valid email address.' });
    }

    const trimmed = email.trim().toLowerCase();

    /* Basic email validation */
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return res.status(400).json({ success: false, error: 'Enter a valid email address.' });
    }

    /* Check if already subscribed */
    const { data: existing } = await supabaseAdmin
      .from('newsletter')
      .select('id, is_active')
      .eq('email', trimmed)
      .single();

    if (existing) {
      if (existing.is_active) {
        return res.json({ success: false, error: 'This email is already subscribed.' });
      }
      /* Reactivate if previously unsubscribed */
      await supabaseAdmin
        .from('newsletter')
        .update({ is_active: true, subscribed_at: new Date().toISOString() })
        .eq('id', existing.id);

      return res.json({ success: true, message: 'You are in.' });
    }

    /* New subscription */
    const { error } = await supabaseAdmin
      .from('newsletter')
      .insert({
        email: trimmed,
        is_active: true,
        subscribed_at: new Date().toISOString(),
      });

    if (error) {
      if (error.code === '23505') {
        return res.json({ success: false, error: 'This email is already subscribed.' });
      }
      throw error;
    }

    res.json({ success: true, message: 'You are in.' });
  } catch (err) {
    next(err);
  }
});

export default router;
