const express = require('express');
const path = require('path');

// Initialize database first
require('./config/database');

const agentsRouter = require('./routes/agents');
const paymentsRouter = require('./routes/payments');
const webhooksRouter = require('./routes/webhooks');
const transactionsRouter = require('./routes/transactions');
const chainsRouter = require('./routes/chains');
const { logActivity } = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Routes
app.use('/v1/agents', agentsRouter);
app.use('/v1/payments', paymentsRouter);
app.use('/v1/webhooks', webhooksRouter);
app.use('/v1/transactions', transactionsRouter);
app.use('/v1/chains', chainsRouter);

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  logActivity(null, 'error', { message: err.message, path: req.path });
  res.status(500).json({
    success: false,
    error: {
      code: 'server_error',
      message: 'Internal server error'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'not_found',
      message: 'Endpoint not found'
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 KIRAPAY Enterprise Middleware running on port ${PORT}`);
  logActivity(null, 'server_start', { port: PORT });
});

module.exports = app;
