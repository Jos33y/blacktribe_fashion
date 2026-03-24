/*
 * BLACKTRIBE FASHION — ADMIN API ROUTES (Orchestrator)
 *
 * Thin router that mounts domain-specific sub-routers.
 * All routes share requireAuth + requireAdmin middleware.
 *
 * server.js imports: import adminRoutes from './server/routes/admin/index.js'
 * Mount path stays: app.use('/api/admin', adminRoutes)
 */

import express from 'express';
import { requireAuth, requireAdmin } from '../../middleware/auth.js';

import statsRoutes from './stats.js';
import productsRoutes from './products.js';
import ordersRoutes from './orders.js';
import catalogRoutes from './catalog.js';
import discountsRoutes from './discounts.js';
import customersRoutes from './customers.js';
import analyticsRoutes from './analytics.js';
import contentRoutes from './content.js';
import staffRoutes from './staff.js';
import searchRoutes from './search.js';
import behavioralRoutes from './behavioral.js';
import paymentsRoutes from './payments.js';

const router = express.Router();

/* All admin routes require auth + admin role */
router.use(requireAuth, requireAdmin);

/* Mount sub-routers */
router.use(statsRoutes);
router.use(productsRoutes);
router.use(ordersRoutes);
router.use(catalogRoutes);
router.use(discountsRoutes);
router.use(customersRoutes);
router.use(analyticsRoutes);
router.use(contentRoutes);
router.use(staffRoutes);
router.use(searchRoutes);
router.use(behavioralRoutes);
router.use(paymentsRoutes);

export default router;
