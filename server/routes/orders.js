import { Router } from 'express';
import { getOrderById } from '../services/orderService.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();

/**
 * GET /api/orders/:id
 * Returns order with items for the confirmation page.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const order = await getOrderById(req.params.id);
    if (!order) throw createError(404, 'Order not found.');

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

export default router;
