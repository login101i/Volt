const express = require('express');
const router = express.Router();

try {
  // Import controllers
  const exampleController = require('../controllers/exampleController');
  const ordersController = require('../controllers/ordersController');
  
  // Example route
  router.get('/example', exampleController.getExample);
  router.post('/example', exampleController.createExample);

  // Orders routes
  router.get('/orders', ordersController.getOrders);
  router.get('/orders/:id', ordersController.getOrderById);

  console.log('Orders routes registered: GET /api/orders, GET /api/orders/:id');
  
  // Offers routes - try to load
  try {
    const offersController = require('../controllers/offersController');
    router.post('/offers', offersController.createOffer);
    router.get('/offers', offersController.getOffers);
    router.get('/offers/:id', offersController.getOfferById);
    router.put('/offers/:id', offersController.updateOffer);
    router.delete('/offers/:id', offersController.deleteOffer);
    console.log('Offers routes registered: POST /api/offers, GET /api/offers, GET /api/offers/:id, PUT /api/offers/:id, DELETE /api/offers/:id');
  } catch (offersError) {
    console.error('Error loading offers routes:', offersError);
  }

  // Upload routes - try to load
  try {
    const uploadController = require('../controllers/uploadController');
    router.post('/upload/component-image', uploadController.uploadComponentImage);
    console.log('Upload routes registered: POST /api/upload/component-image');
  } catch (uploadError) {
    console.error('Error loading upload routes:', uploadError);
  }
} catch (error) {
  console.error('Error setting up routes:', error);
}

module.exports = router;

