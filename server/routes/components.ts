import express from 'express';
import componentsController from '../controllers/componentsController.js';

const componentsRouter = express.Router();

// ============================================================================
// COMPONENTS ROUTES
// ============================================================================

console.log('🔌 Setting up Components routes...');

// Get all components
componentsRouter.get('/', componentsController.getAllComponents);

// Search components
componentsRouter.get('/search', componentsController.searchComponents);

// Get component categories
componentsRouter.get('/categories', componentsController.getCategories);

// Get components by category
componentsRouter.get('/category/:category', componentsController.getComponentsByCategory);

// Get fuse types
componentsRouter.get('/fuse-types', componentsController.getFuseTypes);

// Get component by ID
componentsRouter.get('/:id', componentsController.getComponentById);

console.log('✅ Components routes configured:');
console.log('   GET /api/components - Get all components');
console.log('   GET /api/components/search?q=term - Search components');
console.log('   GET /api/components/categories - Get component categories');
console.log('   GET /api/components/category/:category - Get components by category');
console.log('   GET /api/components/fuse-types - Get fuse types');
console.log('   GET /api/components/:id - Get component by ID');

export default componentsRouter;