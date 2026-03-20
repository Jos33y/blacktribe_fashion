/*
 * BLACKTRIBE FASHION — ADMIN API ROUTES
 *
 * All routes guarded by requireAuth + requireAdmin.
 * Individual routes additionally check granular permissions.
 *
 * Batch 1: Stats endpoint (live)
 * Batch 2: Dashboard data
 * Batch 3: Products CRUD + image upload
 * Batch 4: Orders management
 * Batch 5: Walk-in orders (POS)
 * Batch 6: Collections, Discounts, Customers
 * Batch 7: Staff management (superadmin only)
 */

import express from 'express';
import { requireAuth, requireAdmin, requirePermission } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/database.js';
import { createError } from '../middleware/errorHandler.js';
import { logActivity, getRequestIp } from '../utils/activityLog.js';

const router = express.Router();

/* ═══ MIDDLEWARE: All admin routes require auth + admin role ═══ */
router.use(requireAuth, requireAdmin);


/* ═══════════════════════════════════════════════════════════
   STATS — Dashboard overview data
   ═══════════════════════════════════════════════════════════ */

router.get('/stats', async (req, res, next) => {
  try {
    const now = new Date();

    /* ─── Revenue calculations ─── */
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    // Monday of current week
    const weekStart = new Date(now);
    const dayOfWeek = weekStart.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0
    weekStart.setDate(weekStart.getDate() - diff);
    weekStart.setHours(0, 0, 0, 0);

    // First of current month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch all paid orders with created_at and total
    const { data: paidOrders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('total, created_at')
      .eq('payment_status', 'paid');

    if (ordersError) throw ordersError;

    const orders = paidOrders || [];
    let revenueToday = 0;
    let revenueWeek = 0;
    let revenueMonth = 0;
    let revenueAllTime = 0;

    orders.forEach((o) => {
      const total = o.total || 0;
      const created = new Date(o.created_at);
      revenueAllTime += total;
      if (created >= monthStart) revenueMonth += total;
      if (created >= weekStart) revenueWeek += total;
      if (created >= todayStart) revenueToday += total;
    });

    /* ─── Order counts by status ─── */
    const { data: allOrders, error: countsError } = await supabaseAdmin
      .from('orders')
      .select('status, order_type');

    if (countsError) throw countsError;

    const statusCounts = {};
    let onlineCount = 0;
    let walkInCount = 0;

    (allOrders || []).forEach((o) => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
      if (o.order_type === 'walk_in') walkInCount++;
      else onlineCount++;
    });

    /* ─── Recent orders (last 10) ─── */
    const { data: recentOrders, error: recentError } = await supabaseAdmin
      .from('orders')
      .select('id, order_number, status, total, payment_status, payment_method, order_type, guest_email, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentError) throw recentError;

    /* ─── Low stock alerts ─── */
    const { data: stockProducts, error: stockError } = await supabaseAdmin
      .from('products')
      .select('id, name, slug, sizes, show_inventory')
      .eq('show_inventory', true)
      .eq('is_active', true);

    if (stockError) throw stockError;

    const lowStockAlerts = [];
    (stockProducts || []).forEach((p) => {
      (p.sizes || []).forEach((s) => {
        if (s.stock < 5) {
          lowStockAlerts.push({
            product_id: p.id,
            product_name: p.name,
            product_slug: p.slug,
            size: s.size,
            stock: s.stock,
          });
        }
      });
    });

    /* ─── Total counts ─── */
    const { count: totalProducts } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    const { count: totalCustomers } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'customer');

    res.json({
      success: true,
      data: {
        revenue: {
          today: revenueToday,
          week: revenueWeek,
          month: revenueMonth,
          allTime: revenueAllTime,
        },
        orders: {
          total: (allOrders || []).length,
          online: onlineCount,
          walkIn: walkInCount,
          byStatus: statusCounts,
        },
        recentOrders: recentOrders || [],
        lowStockAlerts,
        totalProducts: totalProducts || 0,
        totalCustomers: totalCustomers || 0,
      },
    });
  } catch (err) {
    next(err);
  }
});


/* ═══════════════════════════════════════════════════════════
   PRODUCTS — CRUD + image upload
   Built in Batch 3
   ═══════════════════════════════════════════════════════════ */

router.get('/products', requirePermission('products'), async (req, res, next) => {
  try {
    const { search, category, collection, status, sort, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabaseAdmin
      .from('products')
      .select('*, categories(name, slug), collections(name, slug)', { count: 'exact' });

    // Filters
    if (status === 'active') query = query.eq('is_active', true);
    else if (status === 'inactive') query = query.eq('is_active', false);
    if (category) query = query.eq('category_id', category);
    if (collection) query = query.eq('collection_id', collection);
    if (search) query = query.ilike('name', `%${search}%`);

    // Sort
    if (sort === 'price_asc') query = query.order('price', { ascending: true });
    else if (sort === 'price_desc') query = query.order('price', { ascending: false });
    else if (sort === 'name') query = query.order('name', { ascending: true });
    else query = query.order('created_at', { ascending: false });

    // Pagination
    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    res.json({ success: true, data, total: count, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
});

router.get('/products/:id', requirePermission('products'), async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*, categories(id, name, slug), collections(id, name, slug)')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return next(createError(404, 'Product not found.'));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post('/products', requirePermission('products'), async (req, res, next) => {
  try {
    const {
      name, slug, short_description, description, price, compare_at_price,
      category_id, collection_id, images, sizes, colors, badge,
      video_url, is_featured, is_active, show_inventory,
      total_inventory, preorder_deadline,
    } = req.body;

    /* Validation */
    if (!name?.trim()) return next(createError(400, 'Product name is required.'));
    if (!slug?.trim()) return next(createError(400, 'Slug is required.'));
    if (!price || price <= 0) return next(createError(400, 'Price must be greater than 0.'));
    if (!images || images.length === 0) return next(createError(400, 'At least one image is required.'));
    if (!sizes || sizes.length === 0) return next(createError(400, 'At least one size is required.'));

    /* Check slug uniqueness */
    const { data: existing } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('slug', slug.trim())
      .single();

    if (existing) return next(createError(400, 'A product with this slug already exists.'));

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert({
        name: name.trim(),
        slug: slug.trim(),
        short_description: short_description || null,
        description: description || null,
        price,
        compare_at_price: compare_at_price || null,
        category_id: category_id || null,
        collection_id: collection_id || null,
        images: images || [],
        sizes: sizes || [],
        colors: colors || null,
        tags: [],
        badge: badge || null,
        video_url: video_url || null,
        is_featured: is_featured || false,
        is_active: is_active !== false,
        show_inventory: show_inventory || false,
        total_inventory: total_inventory || null,
        preorder_deadline: preorder_deadline || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return next(createError(400, 'A product with this slug already exists.'));
      throw error;
    }

    res.status(201).json({ success: true, data });
    logActivity(supabaseAdmin, { userId: req.user.id, action: 'product.created', resourceType: 'product', resourceId: data.id, details: { name: data.name, price: data.price }, ip: getRequestIp(req) });
  } catch (err) {
    next(err);
  }
});

router.put('/products/:id', requirePermission('products'), async (req, res, next) => {
  try {
    const {
      name, slug, short_description, description, price, compare_at_price,
      category_id, collection_id, images, sizes, colors, badge,
      video_url, is_featured, is_active, show_inventory,
      total_inventory, preorder_deadline,
    } = req.body;

    const updates = { updated_at: new Date().toISOString() };

    if (name !== undefined) updates.name = name.trim();
    if (slug !== undefined) updates.slug = slug.trim();
    if (short_description !== undefined) updates.short_description = short_description || null;
    if (description !== undefined) updates.description = description || null;
    if (price !== undefined) updates.price = price;
    if (compare_at_price !== undefined) updates.compare_at_price = compare_at_price || null;
    if (category_id !== undefined) updates.category_id = category_id || null;
    if (collection_id !== undefined) updates.collection_id = collection_id || null;
    if (images !== undefined) updates.images = images;
    if (sizes !== undefined) updates.sizes = sizes;
    if (colors !== undefined) updates.colors = colors || null;
    if (badge !== undefined) updates.badge = badge || null;
    if (video_url !== undefined) updates.video_url = video_url || null;
    if (is_featured !== undefined) updates.is_featured = is_featured;
    if (is_active !== undefined) updates.is_active = is_active;
    if (show_inventory !== undefined) updates.show_inventory = show_inventory;
    if (total_inventory !== undefined) updates.total_inventory = total_inventory || null;
    if (preorder_deadline !== undefined) updates.preorder_deadline = preorder_deadline || null;

    /* Check slug uniqueness if changed */
    if (updates.slug) {
      const { data: existing } = await supabaseAdmin
        .from('products')
        .select('id')
        .eq('slug', updates.slug)
        .neq('id', req.params.id)
        .single();

      if (existing) return next(createError(400, 'A product with this slug already exists.'));
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return next(createError(400, 'A product with this slug already exists.'));
      throw error;
    }

    res.json({ success: true, data });
    logActivity(supabaseAdmin, { userId: req.user.id, action: 'product.updated', resourceType: 'product', resourceId: data.id, details: { name: data.name }, ip: getRequestIp(req) });
  } catch (err) {
    next(err);
  }
});

router.delete('/products/:id', requirePermission('products'), async (req, res, next) => {
  // Soft delete
  try {
    const { error } = await supabaseAdmin
      .from('products')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
    logActivity(supabaseAdmin, { userId: req.user.id, action: 'product.deactivated', resourceType: 'product', resourceId: req.params.id, ip: getRequestIp(req) });
  } catch (err) {
    next(err);
  }
});


/* ═══════════════════════════════════════════════════════════
   IMAGE UPLOAD — handled client-side via Supabase Storage SDK.
   The frontend ImageUploader component uploads directly to the
   'products' storage bucket using the user's JWT for auth.
   No server-side upload route needed.
   ═══════════════════════════════════════════════════════════ */


/* ═══════════════════════════════════════════════════════════
   ORDERS — List, detail, status updates
   Built in Batch 4
   ═══════════════════════════════════════════════════════════ */

router.get('/orders', requirePermission('orders'), async (req, res, next) => {
  try {
    const { status, order_type, search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact' });

    if (status && status !== 'all') query = query.eq('status', status);
    if (order_type && order_type !== 'all') query = query.eq('order_type', order_type);
    if (search) {
      query = query.or(`order_number.ilike.%${search}%,guest_email.ilike.%${search}%`);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    res.json({ success: true, data, total: count, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
});

router.get('/orders/:id', requirePermission('orders'), async (req, res, next) => {
  try {
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (orderError) throw orderError;
    if (!order) return next(createError(404, 'Order not found.'));

    // Fetch order items
    const { data: items, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .select('*')
      .eq('order_id', order.id);

    if (itemsError) throw itemsError;

    // Fetch customer profile if user_id exists
    let customer = null;
    if (order.user_id) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('full_name, phone, role')
        .eq('id', order.user_id)
        .single();
      customer = profile;
    }

    res.json({ success: true, data: { ...order, items: items || [], customer } });
  } catch (err) {
    next(err);
  }
});

router.patch('/orders/:id', requirePermission('orders'), async (req, res, next) => {
  try {
    const { status, tracking_number, notes } = req.body;
    const updates = { updated_at: new Date().toISOString() };

    if (status) updates.status = status;
    if (tracking_number !== undefined) updates.tracking_number = tracking_number;
    if (notes !== undefined) updates.notes = notes;

    // Set timestamps for status changes
    if (status === 'shipped') updates.shipped_at = new Date().toISOString();
    if (status === 'delivered') updates.delivered_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
    if (status) logActivity(supabaseAdmin, { userId: req.user.id, action: 'order.status_changed', resourceType: 'order', resourceId: req.params.id, details: { order_number: data.order_number, status, tracking_number: tracking_number || null }, ip: getRequestIp(req) });
  } catch (err) {
    next(err);
  }
});


/* ═══════════════════════════════════════════════════════════
   DISCOUNT VALIDATION — For walk-in and checkout
   ═══════════════════════════════════════════════════════════ */

router.post('/validate-discount', async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;
    if (!code?.trim()) return next(createError(400, 'Discount code is required.'));

    const { data: discount, error } = await supabaseAdmin
      .from('discounts')
      .select('*')
      .eq('code', code.trim().toUpperCase())
      .single();

    if (error || !discount) {
      return res.json({ success: false, error: 'This code is not valid.' });
    }

    if (!discount.is_active) {
      return res.json({ success: false, error: 'This code is not valid.' });
    }

    if (discount.expires_at && new Date(discount.expires_at) < new Date()) {
      return res.json({ success: false, error: 'This code has expired.' });
    }

    if (discount.starts_at && new Date(discount.starts_at) > new Date()) {
      return res.json({ success: false, error: 'This code is not yet active.' });
    }

    if (discount.usage_limit && (discount.times_used || 0) >= discount.usage_limit) {
      return res.json({ success: false, error: 'This code has reached its usage limit.' });
    }

    if (discount.min_order && subtotal && subtotal < discount.min_order) {
      const minNaira = Math.floor(discount.min_order / 100).toLocaleString('en-NG');
      return res.json({ success: false, error: `Minimum order of ₦${minNaira} required.` });
    }

    /* Calculate discount amount */
    let discountAmount = 0;
    if (discount.type === 'percentage') {
      discountAmount = Math.round((subtotal || 0) * (discount.value / 100));
    } else {
      discountAmount = discount.value;
    }

    res.json({
      success: true,
      data: {
        code: discount.code,
        type: discount.type,
        value: discount.value,
        discount_amount: discountAmount,
      },
    });
  } catch (err) {
    next(err);
  }
});


/* ═══════════════════════════════════════════════════════════
   WALK-IN ORDERS — POS mode
   Built in Batch 5
   ═══════════════════════════════════════════════════════════ */

router.post('/orders/walk-in', requirePermission('orders'), async (req, res, next) => {
  try {
    const {
      items, payment_method, subtotal, total,
      discount_amount, discount_code, guest_email,
    } = req.body;

    if (!items || items.length === 0) return next(createError(400, 'Order must have at least one item.'));
    if (!payment_method) return next(createError(400, 'Payment method is required.'));

    /* Link to existing customer if email matches */
    let linkedUserId = null;
    if (guest_email) {
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      const match = (users || []).find((u) => u.email?.toLowerCase() === guest_email.trim().toLowerCase());
      if (match) linkedUserId = match.id;
    }

    /* Generate order number */
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `BT-${year}${rand}`;

    /* Generate tracking token */
    const trackingToken = Array.from({ length: 32 }, () =>
      Math.random().toString(36).charAt(2)
    ).join('');

    /* Create order — walk-in goes straight to confirmed + paid */
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: linkedUserId,
        guest_email: guest_email || null,
        status: 'confirmed',
        order_type: 'walk_in',
        payment_method,
        payment_status: 'paid',
        payment_reference: `WALKIN-${Date.now()}`,
        subtotal: subtotal || 0,
        shipping_cost: 0,
        discount_amount: discount_amount || 0,
        discount_code: discount_code || null,
        total: total || 0,
        shipping_address: null,
        tracking_token: trackingToken,
        created_by: req.user.id,
        notes: `Walk-in order created by ${req.user.full_name || req.user.email}`,
      })
      .select()
      .single();

    if (orderErr) throw orderErr;

    /* Create order items */
    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id || null,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      size: item.size,
      color: item.color || null,
      image_url: item.image_url || null,
    }));

    const { error: itemsErr } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems);

    if (itemsErr) throw itemsErr;

    /* Deduct stock from products */
    for (const item of items) {
      if (!item.product_id) continue;

      const { data: product } = await supabaseAdmin
        .from('products')
        .select('sizes')
        .eq('id', item.product_id)
        .single();

      if (product?.sizes) {
        const updatedSizes = product.sizes.map((s) => {
          if (s.size === item.size) {
            return { ...s, stock: Math.max(0, (s.stock || 0) - item.quantity) };
          }
          return s;
        });

        await supabaseAdmin
          .from('products')
          .update({ sizes: updatedSizes, updated_at: new Date().toISOString() })
          .eq('id', item.product_id);
      }
    }

    res.status(201).json({
      success: true,
      data: { ...order, items: orderItems },
    });
    logActivity(supabaseAdmin, { userId: req.user.id, action: 'order.walkin_created', resourceType: 'order', resourceId: order.id, details: { order_number: order.order_number, total: order.total, payment_method, items: items.length }, ip: getRequestIp(req) });
  } catch (err) {
    next(err);
  }
});


/* ═══════════════════════════════════════════════════════════
   CUSTOMERS
   ═══════════════════════════════════════════════════════════ */

router.get('/customers', requirePermission('customers'), async (req, res, next) => {
  try {
    /* Fetch all customer profiles */
    const { data: profiles, error: profErr } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, phone, role, created_at')
      .eq('role', 'customer')
      .order('created_at', { ascending: false });

    if (profErr) throw profErr;

    /* Fetch user emails from auth.users via admin API */
    const { data: { users }, error: usersErr } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000,
    });

    if (usersErr) throw usersErr;

    const emailMap = {};
    (users || []).forEach((u) => { emailMap[u.id] = u.email; });

    /* Fetch all paid orders to aggregate per customer */
    const { data: orders, error: ordErr } = await supabaseAdmin
      .from('orders')
      .select('user_id, total')
      .eq('payment_status', 'paid')
      .not('user_id', 'is', null);

    if (ordErr) throw ordErr;

    const orderAgg = {};
    (orders || []).forEach((o) => {
      if (!o.user_id) return;
      if (!orderAgg[o.user_id]) orderAgg[o.user_id] = { count: 0, total: 0 };
      orderAgg[o.user_id].count += 1;
      orderAgg[o.user_id].total += o.total || 0;
    });

    /* Merge */
    const data = (profiles || []).map((p) => ({
      id: p.id,
      full_name: p.full_name,
      email: emailMap[p.id] || '—',
      phone: p.phone,
      created_at: p.created_at,
      order_count: orderAgg[p.id]?.count || 0,
      total_spent: orderAgg[p.id]?.total || 0,
    }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});


/* ═══════════════════════════════════════════════════════════
   CATEGORIES — CRUD
   ═══════════════════════════════════════════════════════════ */

router.get('/categories', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('id, name, slug, sort_order, is_active')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err) {
    next(err);
  }
});

router.post('/categories', requirePermission('products'), async (req, res, next) => {
  try {
    const { name, slug, sort_order, is_active } = req.body;
    if (!name?.trim()) return next(createError(400, 'Category name is required.'));

    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert({
        name: name.trim(),
        slug: slug?.trim() || name.trim().toLowerCase().replace(/\s+/g, '-'),
        sort_order: sort_order ?? 0,
        is_active: is_active !== false,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return next(createError(400, 'A category with this slug already exists.'));
      throw error;
    }
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.put('/categories/:id', requirePermission('products'), async (req, res, next) => {
  try {
    const { name, slug, sort_order, is_active } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (slug !== undefined) updates.slug = slug.trim();
    if (sort_order !== undefined) updates.sort_order = sort_order;
    if (is_active !== undefined) updates.is_active = is_active;

    const { data, error } = await supabaseAdmin
      .from('categories')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return next(createError(400, 'A category with this slug already exists.'));
      throw error;
    }
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});


/* ═══════════════════════════════════════════════════════════
   COLLECTIONS — CRUD
   ═══════════════════════════════════════════════════════════ */

router.get('/collections', requirePermission('collections'), async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('collections')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err) {
    next(err);
  }
});

router.post('/collections', requirePermission('collections'), async (req, res, next) => {
  try {
    const { name, slug, description, season, start_date, end_date, is_active, image_url } = req.body;
    if (!name?.trim()) return next(createError(400, 'Collection name is required.'));

    const { data, error } = await supabaseAdmin
      .from('collections')
      .insert({
        name: name.trim(),
        slug: slug?.trim() || name.trim().toLowerCase().replace(/\s+/g, '-'),
        description: description || null,
        image_url: image_url || null,
        season: season || null,
        start_date: start_date || null,
        end_date: end_date || null,
        is_active: is_active !== false,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return next(createError(400, 'A collection with this slug already exists.'));
      throw error;
    }
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.put('/collections/:id', requirePermission('collections'), async (req, res, next) => {
  try {
    const { name, slug, description, season, start_date, end_date, is_active, image_url } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (slug !== undefined) updates.slug = slug.trim();
    if (description !== undefined) updates.description = description || null;
    if (image_url !== undefined) updates.image_url = image_url || null;
    if (season !== undefined) updates.season = season || null;
    if (start_date !== undefined) updates.start_date = start_date || null;
    if (end_date !== undefined) updates.end_date = end_date || null;
    if (is_active !== undefined) updates.is_active = is_active;

    const { data, error } = await supabaseAdmin
      .from('collections')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return next(createError(400, 'A collection with this slug already exists.'));
      throw error;
    }
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});


/* ═══════════════════════════════════════════════════════════
   DISCOUNTS — CRUD
   ═══════════════════════════════════════════════════════════ */

router.get('/discounts', requirePermission('discounts'), async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('discounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err) {
    next(err);
  }
});

router.post('/discounts', requirePermission('discounts'), async (req, res, next) => {
  try {
    const { code, type, value, min_order, usage_limit, starts_at, expires_at, is_active } = req.body;
    if (!code?.trim()) return next(createError(400, 'Discount code is required.'));
    if (!value || value <= 0) return next(createError(400, 'Value must be greater than 0.'));

    const { data, error } = await supabaseAdmin
      .from('discounts')
      .insert({
        code: code.trim().toUpperCase(),
        type: type || 'percentage',
        value,
        min_order: min_order || null,
        usage_limit: usage_limit || null,
        times_used: 0,
        starts_at: starts_at || null,
        expires_at: expires_at || null,
        is_active: is_active !== false,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return next(createError(400, 'A discount with this code already exists.'));
      throw error;
    }
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
});

router.put('/discounts/:id', requirePermission('discounts'), async (req, res, next) => {
  try {
    const { code, type, value, min_order, usage_limit, starts_at, expires_at, is_active } = req.body;
    const updates = {};
    if (code !== undefined) updates.code = code.trim().toUpperCase();
    if (type !== undefined) updates.type = type;
    if (value !== undefined) updates.value = value;
    if (min_order !== undefined) updates.min_order = min_order;
    if (usage_limit !== undefined) updates.usage_limit = usage_limit;
    if (starts_at !== undefined) updates.starts_at = starts_at;
    if (expires_at !== undefined) updates.expires_at = expires_at;
    if (is_active !== undefined) updates.is_active = is_active;

    const { data, error } = await supabaseAdmin
      .from('discounts')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return next(createError(400, 'A discount with this code already exists.'));
      throw error;
    }
    res.json({ success: true, data });
  } catch (err) { next(err); }
});


/* ═══════════════════════════════════════════════════════════
   ANALYTICS — Revenue trends, top products, conversion data
   ═══════════════════════════════════════════════════════════ */

router.get('/analytics', async (req, res, next) => {
  try {
    const { period = '30d' } = req.query;

    /* ─── Calculate date range ─── */
    const now = new Date();
    let startDate;
    switch (period) {
      case '7d': startDate = new Date(now - 7 * 86400000); break;
      case '90d': startDate = new Date(now - 90 * 86400000); break;
      case '1y': startDate = new Date(now - 365 * 86400000); break;
      default: startDate = new Date(now - 30 * 86400000); break;
    }
    const startISO = startDate.toISOString();

    /* ─── Fetch paid orders in range ─── */
    const { data: orders, error: ordersErr } = await supabaseAdmin
      .from('orders')
      .select('id, total, status, created_at, shipping_address, user_id, guest_email')
      .eq('payment_status', 'paid')
      .gte('created_at', startISO)
      .order('created_at', { ascending: true });

    if (ordersErr) throw ordersErr;

    /* ─── Fetch order items for these orders ─── */
    const orderIds = (orders || []).map((o) => o.id);
    let allItems = [];
    if (orderIds.length > 0) {
      const chunks = [];
      for (let i = 0; i < orderIds.length; i += 100) {
        chunks.push(orderIds.slice(i, i + 100));
      }
      for (const chunk of chunks) {
        const { data: items, error: itemsErr } = await supabaseAdmin
          .from('order_items')
          .select('order_id, product_id, name, price, quantity')
          .in('order_id', chunk);
        if (itemsErr) throw itemsErr;
        allItems = allItems.concat(items || []);
      }
    }

    /* ─── Fetch categories for category breakdown ─── */
    const { data: categories } = await supabaseAdmin
      .from('categories')
      .select('id, name');
    const catMap = {};
    (categories || []).forEach((c) => { catMap[c.id] = c.name; });

    /* ─── Fetch products for category mapping ─── */
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('id, category_id');
    const prodCatMap = {};
    (products || []).forEach((p) => { prodCatMap[p.id] = p.category_id; });

    /* ─── Revenue by day ─── */
    const revByDay = {};
    const ordersByDayMap = {};
    (orders || []).forEach((o) => {
      const day = o.created_at.split('T')[0];
      revByDay[day] = (revByDay[day] || 0) + (o.total || 0);
      ordersByDayMap[day] = (ordersByDayMap[day] || 0) + 1;
    });

    const revenueByDay = Object.entries(revByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, total]) => ({ date, total }));

    const ordersByDay = Object.entries(ordersByDayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    /* ─── Top products ─── */
    const productAgg = {};
    allItems.forEach((item) => {
      const key = item.name || 'Unknown';
      if (!productAgg[key]) productAgg[key] = { name: key, totalSold: 0, revenue: 0 };
      productAgg[key].totalSold += item.quantity;
      productAgg[key].revenue += item.price * item.quantity;
    });
    const topProducts = Object.values(productAgg)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    /* ─── Sales by category ─── */
    const catAgg = {};
    allItems.forEach((item) => {
      const catId = prodCatMap[item.product_id];
      const catName = catId ? (catMap[catId] || 'Other') : 'Other';
      if (!catAgg[catName]) catAgg[catName] = { category: catName, revenue: 0, count: 0 };
      catAgg[catName].revenue += item.price * item.quantity;
      catAgg[catName].count += item.quantity;
    });
    const salesByCategory = Object.values(catAgg).sort((a, b) => b.revenue - a.revenue);

    /* ─── Key metrics ─── */
    const totalRevenue = (orders || []).reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOrders = (orders || []).length;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    const customerOrders = {};
    (orders || []).forEach((o) => {
      const key = o.user_id || o.guest_email || 'anon';
      customerOrders[key] = (customerOrders[key] || 0) + 1;
    });
    const totalCustomersInPeriod = Object.keys(customerOrders).length;
    const repeatCustomers = Object.values(customerOrders).filter((c) => c > 1).length;
    const repeatCustomerRate = totalCustomersInPeriod > 0
      ? (repeatCustomers / totalCustomersInPeriod) * 100
      : 0;

    /* ─── Geographic breakdown ─── */
    const geoAgg = {};
    (orders || []).forEach((o) => {
      const addr = o.shipping_address;
      const state = addr?.state || 'Unknown';
      if (state === 'Unknown' || !addr) return;
      if (!geoAgg[state]) geoAgg[state] = { state, orders: 0, revenue: 0 };
      geoAgg[state].orders += 1;
      geoAgg[state].revenue += o.total || 0;
    });
    const geographicBreakdown = Object.values(geoAgg)
      .sort((a, b) => b.orders - a.orders);

    /* ─── Customer growth ─── */
    const { data: profileData } = await supabaseAdmin
      .from('profiles')
      .select('created_at')
      .eq('role', 'customer')
      .gte('created_at', startISO)
      .order('created_at', { ascending: true });

    const growthMap = {};
    (profileData || []).forEach((p) => {
      const day = p.created_at.split('T')[0];
      growthMap[day] = (growthMap[day] || 0) + 1;
    });

    let cumulative = 0;
    const customerGrowth = Object.entries(growthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => {
        cumulative += count;
        return { date, count: cumulative };
      });

    res.json({
      success: true,
      data: {
        revenueByDay,
        ordersByDay,
        topProducts,
        salesByCategory,
        keyMetrics: {
          totalRevenue,
          totalOrders,
          avgOrderValue,
          repeatCustomerRate,
        },
        geographicBreakdown,
        customerGrowth,
      },
    });
  } catch (err) {
    next(err);
  }
});


/* ═══════════════════════════════════════════════════════════
   NEWSLETTER — Subscriber management
   Built in Batch 6
   ═══════════════════════════════════════════════════════════ */

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


/* ═══════════════════════════════════════════════════════════
   SHIPPING — Zone and rate management
   Built in Batch 6
   ═══════════════════════════════════════════════════════════ */

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
  } catch (err) { next(err); }
});


/* ═══════════════════════════════════════════════════════════
   STAFF MANAGEMENT — Superadmin only
   Create staff accounts, assign roles + permissions, revoke access.
   Uses Supabase auth.admin API (service role key).
   Built in Batch 7
   ═══════════════════════════════════════════════════════════ */

/* Helper: check if requesting user is superadmin */
function requireSuperadmin(req, res, next) {
  if (req.user?.role !== 'superadmin') {
    return next(createError(403, 'Superadmin access required.'));
  }
  next();
}

/* List all staff (admin + superadmin) */
router.get('/staff', requireSuperadmin, async (req, res, next) => {
  try {
    /* Fetch admin/superadmin profiles */
    const { data: profiles, error: profErr } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, phone, role, permissions, created_at')
      .in('role', ['admin', 'superadmin'])
      .order('created_at', { ascending: true });

    if (profErr) throw profErr;

    /* Fetch emails from auth.users */
    const { data: { users }, error: usersErr } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000,
    });

    if (usersErr) throw usersErr;

    const emailMap = {};
    (users || []).forEach((u) => { emailMap[u.id] = u.email; });

    const data = (profiles || []).map((p) => ({
      id: p.id,
      full_name: p.full_name,
      email: emailMap[p.id] || '—',
      phone: p.phone,
      role: p.role,
      permissions: p.permissions || [],
      created_at: p.created_at,
    }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/* Create staff member */
router.post('/staff', requireSuperadmin, async (req, res, next) => {
  try {
    const { full_name, email, password, role, permissions } = req.body;

    if (!full_name?.trim()) return next(createError(400, 'Name is required.'));
    if (!email?.trim()) return next(createError(400, 'Email is required.'));
    if (!password) return next(createError(400, 'Password is required.'));
    if (!['admin', 'superadmin'].includes(role)) return next(createError(400, 'Role must be admin or superadmin.'));

    /* Create auth user via admin API (auto-confirms email) */
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name.trim() },
    });

    if (authErr) {
      if (authErr.message?.includes('already been registered')) {
        return next(createError(400, 'An account with this email already exists.'));
      }
      throw authErr;
    }

    const userId = authData.user.id;

    /* Update profile with role + permissions.
       The profiles row is created by a database trigger on auth.users insert.
       The trigger runs async, so we retry until the row exists and is updated. */
    const profileData = {
      full_name: full_name.trim(),
      role,
      permissions: role === 'superadmin'
        ? ['products', 'orders', 'customers', 'collections', 'discounts', 'shipping', 'settings']
        : (permissions || []),
    };

    let profileUpdated = false;
    for (let attempt = 0; attempt < 6; attempt++) {
      const { data: updatedRow, error } = await supabaseAdmin
        .from('profiles')
        .update(profileData)
        .eq('id', userId)
        .select('id')
        .maybeSingle();

      if (!error && updatedRow) {
        profileUpdated = true;
        break;
      }

      /* Row doesn't exist yet — trigger hasn't fired. Wait and retry. */
      if (attempt < 5) {
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
      }
    }

    if (!profileUpdated) {
      /* Auth user was created but profile update failed. Log for manual fix. */
      console.error(`[staff] Profile update failed for ${userId} after 6 retries.`);
      return next(createError(500, 'Account created but profile setup failed. Try editing the staff member to set their role.'));
    }

    res.status(201).json({ success: true, data: { id: userId, email: email.trim() } });
    logActivity(supabaseAdmin, { userId: req.user.id, action: 'staff.created', resourceType: 'staff', resourceId: userId, details: { email: email.trim(), name: full_name.trim(), role }, ip: getRequestIp(req) });
  } catch (err) {
    next(err);
  }
});

/* Update staff role + permissions */
router.put('/staff/:id', requireSuperadmin, async (req, res, next) => {
  try {
    const { role, permissions } = req.body;

    /* Cannot edit own role */
    if (req.params.id === req.user.id) {
      return next(createError(400, 'Cannot edit your own role.'));
    }

    if (!['admin', 'superadmin'].includes(role)) {
      return next(createError(400, 'Role must be admin or superadmin.'));
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({
        role,
        permissions: role === 'superadmin'
          ? ['products', 'orders', 'customers', 'collections', 'discounts', 'shipping', 'settings']
          : (permissions || []),
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
    logActivity(supabaseAdmin, { userId: req.user.id, action: 'staff.updated', resourceType: 'staff', resourceId: req.params.id, details: { role, permissions: permissions || [] }, ip: getRequestIp(req) });
  } catch (err) {
    next(err);
  }
});

/* Revoke admin access (demote to customer) */
router.delete('/staff/:id', requireSuperadmin, async (req, res, next) => {
  try {
    /* Cannot revoke own access */
    if (req.params.id === req.user.id) {
      return next(createError(400, 'Cannot revoke your own access.'));
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        role: 'customer',
        permissions: [],
      })
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ success: true });
    logActivity(supabaseAdmin, { userId: req.user.id, action: 'staff.revoked', resourceType: 'staff', resourceId: req.params.id, ip: getRequestIp(req) });
  } catch (err) {
    next(err);
  }
});


/* ═══════════════════════════════════════════════════════════
   ACTIVITY LOG — Audit trail
   Superadmin only. Read-only.
   Built in Batch 7
   ═══════════════════════════════════════════════════════════ */

router.get('/activity', requireSuperadmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 50, action_prefix } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabaseAdmin
      .from('activity_log')
      .select('*', { count: 'exact' });

    /* Filter by action prefix (e.g., 'auth', 'order', 'product') */
    if (action_prefix && action_prefix !== 'all') {
      query = query.like('action', `${action_prefix}.%`);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    const { data: logs, count, error } = await query;
    if (error) throw error;

    /* Enrich with user names */
    const userIds = [...new Set((logs || []).map((l) => l.user_id).filter(Boolean))];
    let userMap = {};

    if (userIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      const emailMap = {};
      (users || []).forEach((u) => { emailMap[u.id] = u.email; });

      (profiles || []).forEach((p) => {
        userMap[p.id] = { name: p.full_name, email: emailMap[p.id] };
      });
    }

    const enriched = (logs || []).map((log) => ({
      ...log,
      user_name: userMap[log.user_id]?.name || null,
      user_email: userMap[log.user_id]?.email || null,
    }));

    res.json({ success: true, data: enriched, total: count, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
});


export default router;
