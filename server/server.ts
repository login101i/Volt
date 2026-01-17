import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT || 5005;
const HOST = process.env.HOST || '0.0.0.0';

// ============================================================================
// HEALTH CHECK ENDPOINT
// ============================================================================

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// ============================================================================
// 404 HANDLER
// ============================================================================

app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// ============================================================================
// ERROR HANDLER
// ============================================================================

app.use((err: any, req: any, res: any, next: any) => {
  console.error('❌ Server Error:', err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(Number(PORT), HOST, () => {
  console.log('🚀 ======================================');
  console.log(`✅ Server is running on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  console.log(`📊 Port: ${PORT}`);
  console.log(`🌐 Host: ${HOST}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log('🚀 ======================================');
});

export default app;