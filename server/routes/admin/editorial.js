/*
 * BLACKTRIBE FASHION — ADMIN: Editorial features CRUD
 *
 * GET    /editorial        — all features (drafts + published), no page bodies
 * GET    /editorial/:id    — single feature with pages
 * POST   /editorial        — create draft { title, slug? }
 * PUT    /editorial/:id    — update { title, slug, issue_label, dek, pages, status }
 * DELETE /editorial/:id    — delete feature
 *
 * Gated by the 'collections' permission (same as collections/categories).
 * Pages are sanitised server-side: known templates, known field keys,
 * capped string lengths, product ids validated as UUIDs.
 */

import express from 'express';
import { randomUUID } from 'crypto';
import { requirePermission } from '../../middleware/auth.js';
import { supabaseAdmin } from '../../config/database.js';
import { createError } from '../../middleware/errorHandler.js';
import { logActivity, getRequestIp } from '../../utils/activityLog.js';

const router = express.Router();

const TEMPLATES = ['brand', 'cover', 'image', 'split', 'products', 'statement', 'story', 'world', 'opener'];
const TONES = ['dark', 'light'];
const MAX_PAGES = 24;
const MAX_PRODUCTS = 4;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* Allowed string fields and their max lengths */
const FIELD_LIMITS = {
  image: 1000,
  kicker: 60,
  title: 120,
  dek: 300,
  caption: 300,
  credit: 120,
  side: 10,
  fit: 10,
  art: 10,
  border: 12,
  cutout: 1000,
  places: 600,
  mast: 10,
  lines: 300,
  treatment: 12,
  focus: 10,
  headline: 120,
  marks: 10,
  ink: 10,
  heading: 120,
  intro: 600,
  body: 6000,
  quote: 400,
  attribution: 120,
  mantra: 120,
  points: 600,
  cta: 120,
};

function slugify(str) {
  return String(str).toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function cleanText(value, max) {
  if (typeof value !== 'string') return null;
  const v = value.trim().slice(0, max);
  return v || null;
}

function cleanPages(input) {
  if (!Array.isArray(input)) return [];

  return input
    .slice(0, MAX_PAGES)
    .filter((p) => p && typeof p === 'object' && TEMPLATES.includes(p.template))
    .map((p) => {
      const src = p.fields && typeof p.fields === 'object' ? p.fields : {};
      const fields = {};

      for (const [key, max] of Object.entries(FIELD_LIMITS)) {
        if (typeof src[key] === 'string') fields[key] = src[key].slice(0, max);
      }

      if (fields.image && !/^https:\/\//i.test(fields.image)) delete fields.image;
      if (fields.cutout && !/^https:\/\//i.test(fields.cutout)) delete fields.cutout;
      if (fields.art && fields.art !== 'mask') delete fields.art;
      if (fields.border && fields.border !== 'triangles') delete fields.border;
      if (fields.mast && !['upper', 'middle'].includes(fields.mast)) delete fields.mast;
      if (fields.treatment && !['mono', 'night', 'grain', 'mono-grain'].includes(fields.treatment)) delete fields.treatment;
      if (fields.focus && !['left', 'right', 'top'].includes(fields.focus)) delete fields.focus;
      if (fields.marks && fields.marks !== 'marks') delete fields.marks;
      if (fields.ink && fields.ink !== 'dark') delete fields.ink;
      if (fields.side && !['left', 'right'].includes(fields.side)) fields.side = 'left';
      if (fields.fit && !['fill', 'canvas'].includes(fields.fit)) fields.fit = 'fill';

      if (Array.isArray(src.products)) {
        fields.products = src.products
          .filter((id) => typeof id === 'string' && UUID_RE.test(id))
          .slice(0, MAX_PRODUCTS);
      }

      return {
        id: typeof p.id === 'string' && p.id.length <= 64 ? p.id : randomUUID(),
        template: p.template,
        tone: TONES.includes(p.tone) ? p.tone : 'dark',
        contact: p.template === 'brand' || p.contact === true,
        fields,
      };
    });
}

function deriveCover(pages) {
  const withImage = pages.find((p) => p.fields?.image);
  return withImage ? withImage.fields.image : null;
}


/* ═══ LIST ═══ */

router.get('/editorial', requirePermission('collections'), async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('editorial_features')
      .select('id, title, slug, issue_label, cover_image, status, published_at, updated_at, pages')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    const list = (data || []).map(({ pages, ...rest }) => ({
      ...rest,
      page_count: Array.isArray(pages) ? pages.length : 0,
    }));

    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});


/* ═══ SINGLE ═══ */

router.get('/editorial/:id', requirePermission('collections'), async (req, res, next) => {
  try {
    if (!UUID_RE.test(req.params.id)) return next(createError(404, 'Feature not found.'));

    const { data, error } = await supabaseAdmin
      .from('editorial_features')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) return next(createError(404, 'Feature not found.'));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});


/* ═══ CREATE ═══ */

router.post('/editorial', requirePermission('collections'), async (req, res, next) => {
  try {
    const title = cleanText(req.body.title, FIELD_LIMITS.title);
    if (!title) return next(createError(400, 'Title is required.'));

    const slug = slugify(req.body.slug || title);
    if (!slug) return next(createError(400, 'Slug is required.'));

    /* Every feature starts with a cover */
    const pages = [{
      id: randomUUID(),
      template: 'cover',
      tone: 'dark',
      fields: { title },
    }];

    const { data, error } = await supabaseAdmin
      .from('editorial_features')
      .insert({
        title,
        slug,
        issue_label: cleanText(req.body.issue_label, 60),
        pages,
        status: 'draft',
        created_by: req.user.id,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return next(createError(400, 'A feature with this slug already exists.'));
      throw error;
    }

    res.status(201).json({ success: true, data });
    logActivity(supabaseAdmin, { userId: req.user.id, action: 'editorial.created', resourceType: 'editorial', resourceId: data.id, details: { title: data.title }, ip: getRequestIp(req) });
  } catch (err) {
    next(err);
  }
});


/* ═══ UPDATE ═══ */

router.put('/editorial/:id', requirePermission('collections'), async (req, res, next) => {
  try {
    if (!UUID_RE.test(req.params.id)) return next(createError(404, 'Feature not found.'));

    const { data: existing, error: findError } = await supabaseAdmin
      .from('editorial_features')
      .select('id, status, published_at')
      .eq('id', req.params.id)
      .single();

    if (findError || !existing) return next(createError(404, 'Feature not found.'));

    const { title, slug, issue_label, dek, pages, status } = req.body;
    const updates = {};

    if (title !== undefined) {
      const t = cleanText(title, FIELD_LIMITS.title);
      if (!t) return next(createError(400, 'Title is required.'));
      updates.title = t;
    }
    if (slug !== undefined) {
      const s = slugify(slug);
      if (!s) return next(createError(400, 'Slug is required.'));
      updates.slug = s;
    }
    if (issue_label !== undefined) updates.issue_label = cleanText(issue_label, 60);
    if (dek !== undefined) updates.dek = cleanText(dek, FIELD_LIMITS.dek);

    if (pages !== undefined) {
      updates.pages = cleanPages(pages);
      updates.cover_image = deriveCover(updates.pages);
    }

    if (status !== undefined) {
      if (!['draft', 'published'].includes(status)) return next(createError(400, 'Invalid status.'));
      updates.status = status;
      /* First publish stamps the date; republishing keeps the original */
      if (status === 'published' && !existing.published_at) updates.published_at = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from('editorial_features')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return next(createError(400, 'A feature with this slug already exists.'));
      throw error;
    }

    res.json({ success: true, data });

    const action = status && status !== existing.status
      ? (status === 'published' ? 'editorial.published' : 'editorial.unpublished')
      : 'editorial.updated';
    logActivity(supabaseAdmin, { userId: req.user.id, action, resourceType: 'editorial', resourceId: data.id, details: { title: data.title }, ip: getRequestIp(req) });
  } catch (err) {
    next(err);
  }
});


/* ═══ DELETE ═══ */

router.delete('/editorial/:id', requirePermission('collections'), async (req, res, next) => {
  try {
    if (!UUID_RE.test(req.params.id)) return next(createError(404, 'Feature not found.'));

    const { data, error } = await supabaseAdmin
      .from('editorial_features')
      .delete()
      .eq('id', req.params.id)
      .select('id, title')
      .single();

    if (error || !data) return next(createError(404, 'Feature not found.'));

    res.json({ success: true });
    logActivity(supabaseAdmin, { userId: req.user.id, action: 'editorial.deleted', resourceType: 'editorial', resourceId: data.id, details: { title: data.title }, ip: getRequestIp(req) });
  } catch (err) {
    next(err);
  }
});

export default router;
