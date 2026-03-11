const { v4: uuidv4 } = require('uuid');
const { agents, transactions } = require('../config/database');
const { logActivity } = require('../utils/logger');
const { createPaymentLink: kirapayCreateLink, getPaymentStatus: kirapayGetStatus, cancelPayment: kirapayCancel } = require('../services/kirapay');

const router = require('express').Router();

// Middleware to validate X-Agent-UID
function validateAgent(req, res, next) {
  const agentUid = req.headers['x-agent-uid'];
  
  if (!agentUid) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'unauthorized',
        message: 'Missing X-Agent-UID header'
      }
    });
  }
  
  const agent = agents.findByUid.get(agentUid);
  
  if (!agent) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'unauthorized',
        message: 'Invalid agent UID'
      }
    });
  }
  
  if (agent.status !== 'active') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'forbidden',
        message: 'Agent is not active'
      }
    });
  }
  
  req.agent = agent;
  next();
}

// Apply auth middleware to all payment routes
router.use(validateAgent);

// Create payment link
router.post('/create-link', async (req, res) => {
  try {
    const { amount, currency, description, reference } = req.body;
    const agentUid = req.agent.uid;
    
    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'invalid_request',
          message: 'Amount must be a positive number'
        }
      });
    }
    
    const paymentCurrency = currency || 'USD';
    
    // Generate internal transaction ID
    const transactionId = uuidv4();
    
    // Call KIRAPAY API (or stub)
    // Pass agent's wallet as the receiver
    const kirapayResult = await kirapayCreateLink({
      amount,
      currency: paymentCurrency,
      description,
      reference,
      receiver: req.agent.wallet_address
    });
    
    // Store transaction in DB
    transactions.create.run({
      id: transactionId,
      agent_uid: agentUid,
      kirapay_payment_id: kirapayResult.id,
      amount,
      currency: paymentCurrency,
      status: kirapayResult.status || 'pending',
      description: description || null,
      reference: reference || null,
      link: kirapayResult.link
    });
    
    // Log activity
    logActivity(agentUid, 'payment_link_created', {
      transaction_id: transactionId,
      kirapay_id: kirapayResult.id,
      amount,
      currency: paymentCurrency
    });
    
    // Return response
    res.status(201).json({
      success: true,
      payment: {
        id: kirapayResult.id,
        link: kirapayResult.link,
        amount,
        currency: paymentCurrency,
        status: kirapayResult.status || 'pending',
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Create payment error:', error);
    logActivity(req.agent?.uid, 'payment_error', { message: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'server_error',
        message: 'Failed to create payment link'
      }
    });
  }
});

// Get payment status
router.get('/:payment_id', async (req, res) => {
  try {
    const { payment_id } = req.params;
    const agentUid = req.agent.uid;
    
    // First check local DB
    let transaction = transactions.findByKirapayId.get(payment_id);
    
    if (!transaction) {
      // Try to get from KIRAPAY
      const kirapayResult = await kirapayGetStatus(payment_id);
      transaction = {
        id: payment_id,
        amount: kirapayResult.amount,
        currency: kirapayResult.currency,
        status: kirapayResult.status
      };
    }
    
    if (transaction.agent_uid !== agentUid) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'not_found',
          message: 'Payment not found'
        }
      });
    }
    
    res.json({
      success: true,
      payment: {
        id: transaction.kirapay_payment_id || payment_id,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        created_at: transaction.created_at
      }
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'server_error',
        message: 'Failed to get payment status'
      }
    });
  }
});

// Cancel payment
router.post('/:payment_id/cancel', async (req, res) => {
  try {
    const { payment_id } = req.params;
    const agentUid = req.agent.uid;
    
    // Check local DB
    const transaction = transactions.findByKirapayId.get(payment_id);
    
    if (!transaction || transaction.agent_uid !== agentUid) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'not_found',
          message: 'Payment not found'
        }
      });
    }
    
    if (transaction.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'invalid_request',
          message: 'Can only cancel pending payments'
        }
      });
    }
    
    // Call KIRAPAY API
    await kirapayCancel(payment_id);
    
    // Update local status
    transactions.updateStatus.run('cancelled', transaction.id);
    
    // Log activity
    logActivity(agentUid, 'payment_cancelled', { payment_id });
    
    res.json({
      success: true,
      payment: {
        id: payment_id,
        status: 'cancelled'
      }
    });
  } catch (error) {
    console.error('Cancel payment error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'server_error',
        message: 'Failed to cancel payment'
      }
    });
  }
});

module.exports = router;
