import express from 'express';
import ordersController from '../controllers/ordersController.js';

const ordersRouter = express.Router();

// ============================================================================
// ORDERS ROUTES
// ============================================================================

console.log('📦 Setting up Orders routes...');

// Get all orders
ordersRouter.get('/', ordersController.getOrders);

// Get order by ID
ordersRouter.get('/:id', ordersController.getOrderById);

console.log('✅ Orders routes configured: GET /api/orders, GET /api/orders/:id');

export default ordersRouter;