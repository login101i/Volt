import express from 'express';
import uploadController from '../controllers/uploadController.js';

const uploadRouter = express.Router();

// ============================================================================
// UPLOAD ROUTES
// ============================================================================

console.log('📤 Setting up Upload routes...');

// Upload component image
uploadRouter.post('/component-image', uploadController.uploadComponentImage);

console.log('✅ Upload routes configured: POST /api/upload/component-image');

export default uploadRouter;