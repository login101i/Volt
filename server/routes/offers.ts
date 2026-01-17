import express from 'express';
import offersController from '../controllers/offersController.js';

const offersRouter = express.Router();

// ============================================================================
// OFFERS ROUTES
// ============================================================================

console.log('💼 Setting up Offers routes...');

// Create new offer
offersRouter.post('/', offersController.createOffer);

// Get all offers
offersRouter.get('/', offersController.getOffers);

// Get offer by ID
offersRouter.get('/:id', offersController.getOfferById);

// Update offer
offersRouter.put('/:id', offersController.updateOffer);

// Delete offer
offersRouter.delete('/:id', offersController.deleteOffer);

console.log('✅ Offers routes configured:');
console.log('   POST /api/offers - Create new offer');
console.log('   GET /api/offers - Get all offers');
console.log('   GET /api/offers/:id - Get offer by ID');
console.log('   PUT /api/offers/:id - Update offer');
console.log('   DELETE /api/offers/:id - Delete offer');

export default offersRouter;