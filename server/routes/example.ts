import express from 'express';
import exampleController from '../controllers/exampleController.js';

const exampleRouter = express.Router();

// ============================================================================
// EXAMPLE ROUTES
// ============================================================================

console.log('📝 Setting up Example routes...');

// Get example data
exampleRouter.get('/', exampleController.getExample);

// Create example
exampleRouter.post('/', exampleController.createExample);

console.log('✅ Example routes configured: GET /api/example, POST /api/example');

export default exampleRouter;