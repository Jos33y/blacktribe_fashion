/*
 * BLACKTRIBE FASHION — CONTACT API
 *
 * POST /api/contact              — public: save message + send email
 * GET  /api/contact/messages     — admin: list all messages
 * PATCH /api/contact/messages/:id — admin: mark as read
 */

import express from 'express';
import { supabaseAdmin } from '../config/database.js';
import { sendEmail } from '../services/emailService.js';
import { requirePermission } from '../middleware/auth.js';

const router = express.Router();


/* ─── Public: submit contact form ─── */

router.post('/', async (req, res, next) => {
  try {
    const { name, email, message } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ success: false, error: 'Name is required.' });
    }
    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, error: 'Enter a valid email address.' });
    }
    if (!message?.trim()) {
      return res.status(400).json({ success: false, error: 'Message is required.' });
    }

    /* Save to database (primary record) */
    const { error: dbError } = await supabaseAdmin
      .from('contact_messages')
      .insert({
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      });

    if (dbError) {
      console.error('[contact] DB insert failed:', dbError.message);
    }

    /* Send email to support (fire-and-forget backup) */
    try {
      await sendEmail({
        to: 'support@blacktribefashion.com',
        subject: `Contact form: ${name.trim()}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px;">
            <h2 style="margin: 0 0 16px;">New contact form submission</h2>
            <p><strong>Name:</strong> ${name.trim()}</p>
            <p><strong>Email:</strong> ${email.trim()}</p>
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap; background: #f5f5f5; padding: 16px; border-radius: 4px;">${message.trim()}</p>
          </div>
        `,
        replyTo: email.trim(),
      });
    } catch (emailErr) {
      console.error('[contact] Email send failed:', emailErr.message);
    }

    res.json({ success: true, message: 'Message sent.' });
  } catch (err) {
    next(err);
  }
});


/* ─── Admin: list messages ─── */

router.get('/messages', requirePermission('orders'), async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabaseAdmin
      .from('contact_messages')
      .select('*', { count: 'exact' });

    if (status === 'unread') query = query.eq('is_read', false);
    if (status === 'read') query = query.eq('is_read', true);

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    res.json({ success: true, data, total: count });
  } catch (err) {
    next(err);
  }
});


/* ─── Admin: mark as read/unread ─── */

router.patch('/messages/:id', requirePermission('orders'), async (req, res, next) => {
  try {
    const { is_read } = req.body;

    const { data, error } = await supabaseAdmin
      .from('contact_messages')
      .update({ is_read: is_read !== false })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

export default router;
