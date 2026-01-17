import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// ============================================================================
// MIDDLEWARE CONFIGURATION
// ============================================================================

// Allow multiple origins for ngrok support
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL,
  process.env.NGROK_FRONTEND_URL
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow if origin is in allowed list or is an ngrok URL
    if (allowedOrigins.includes(origin) || origin.includes('.ngrok.io') || origin.includes('.ngrok-free.app')) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins for development (you can restrict this in production)
    }
  },
  credentials: true
}));

app.use(express.json());

// ============================================================================
// ROUTE IMPORTS
// ============================================================================

// Import route modules
import exampleRouter from './routes/example';
import ordersRouter from './routes/orders';
import offersRouter from './routes/offers';
import uploadRouter from './routes/upload';
import componentsRouter from './routes/components';

// ============================================================================
// INITIALIZATION FUNCTIONS
// ============================================================================

// Initialize any startup processes here
(async () => {
  try {
    console.log('🚀 Server initialization starting...');
    // Add any initialization logic here (like folder indexing, database checks, etc.)
    console.log('✅ Server initialization completed');
  } catch (error) {
    console.warn('⚠️ Server initialization warning:', error);
  }
})();

// ============================================================================
// MOUNT ROUTERS
// ============================================================================

console.log('🔗 Mounting API routes...');

// Mount route modules with /api prefix
app.use('/api/example', exampleRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/offers', offersRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/components', componentsRouter);

console.log('✅ API routes mounted successfully');
console.log('📊 Routes configured:');
console.log('   • /api/example - Example endpoints');
console.log('   • /api/orders - Orders management');
console.log('   • /api/offers - Offers management');
console.log('   • /api/upload - File upload');
console.log('   • /api/components - Components database');

export default app;