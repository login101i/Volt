const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
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
app.use(express.urlencoded({ extended: true }));

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Routes
try {
  const routes = require('./routes');
  app.use('/api', routes);
  console.log('Routes loaded successfully');
} catch (error) {
  console.error('Error loading routes:', error);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server - listen on all interfaces (0.0.0.0) to allow ngrok access
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
});

module.exports = app;

