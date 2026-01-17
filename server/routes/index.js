const express = require('express');
const router = express.Router();

console.log('=== SETTING UP API ROUTES ===');

// ============================================================================
// LOAD ROUTE MODULES
// ============================================================================

// Example routes
try {
  console.log('📝 Loading Example routes...');
  const exampleRoutes = require('./example');
  router.use('/example', exampleRoutes);
  console.log('✅ Example routes loaded');
} catch (error) {
  console.error('❌ Error loading Example routes:', error.message);
}

// Orders routes
try {
  console.log('📦 Loading Orders routes...');
  const ordersRoutes = require('./orders');
  router.use('/orders', ordersRoutes);
  console.log('✅ Orders routes loaded');
} catch (error) {
  console.error('❌ Error loading Orders routes:', error.message);
}

// Offers routes
try {
  console.log('💼 Loading Offers routes...');
  const offersRoutes = require('./offers');
  router.use('/offers', offersRoutes);
  console.log('✅ Offers routes loaded');
} catch (error) {
  console.error('❌ Error loading Offers routes:', error.message);
}

// Upload routes
try {
  console.log('📤 Loading Upload routes...');
  const uploadRoutes = require('./upload');
  router.use('/upload', uploadRoutes);
  console.log('✅ Upload routes loaded');
} catch (error) {
  console.error('❌ Error loading Upload routes:', error.message);
}

// Components routes
try {
  console.log('🔌 Loading Components routes...');
  const componentsRoutes = require('./components');
  router.use('/components', componentsRoutes);
  console.log('✅ Components routes loaded');
} catch (error) {
  console.error('❌ Error loading Components routes:', error.message);
}

console.log('=== API ROUTES SETUP COMPLETED ===');
console.log(`📊 Total route modules configured: 5`);

module.exports = router;

